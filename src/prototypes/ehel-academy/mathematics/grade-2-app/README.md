# Grade 2 Mathematics — the standalone lesson build

Nine self-contained lesson pages plus a hub, on the same model as
`../grade-1-app`: each carries its own CSS, its own activity JS and its own
copy of the voice engine, and none of it goes through `shell/course-app.js`.

**Committed on 2026-09-07 before it was finished, deliberately.** Until that
commit the only copies were ten claude.ai artifacts and a directory under
`AppData\Local\Temp`. Artifacts are a review surface, not source control, and
temp is temp — the same "the CDN was the only copy" that got Grade 1 committed.

## Status: NOT deployable, and the gap is the platform layer

Measured against `grade-1-app/g1v2`, which is live:

| | grade-1-v2 | here |
| --- | --- | --- |
| deck, `finish()`, stickers | ✓ | ✓ |
| design template + ink tokens | ✓ | ✓ |
| header bars, `.eh-b2right` | ✓ | **none** |
| Class chat / Hand up / Join class | ✓ | **none** |
| Wehel | ✓ | **none** |
| launch params carried across links | ✓ | **none** |
| hub links | sibling `*.html` | **claude.ai artifact URLs** |
| deploy path | `deploy.mjs` | **none** |

The lessons DO read `?pwsToken` / `?pwsEndpoint` already, but only for the
voice endpoint (`PLATFORM_VOICE`) — that is not the same thing as carrying
them onto the next page, and reading a count of `location.search` as evidence
of link plumbing is how this list was under-estimated once already.

## Order of work, and why it is that order

1. **The hub's links first.** `g2-index.html` points at ten artifact URLs, so
   nothing here is a course until they point at siblings.
2. **Launch params next, before the controls.** `mountHandRaise` /
   `mountClassChat` open with a guard on `launchToken` and `launchEndpoint`, so
   without both they mount NOTHING rather than erroring. Wire the controls
   first and they look broken when they are merely unreachable — the exact
   failure `grade-1-app/keep-launch-params.py` documents.
3. **Header bars, then the controls into them.** `placeLearnerControls()`
   prepends into `.top-actions`; there is no such element here yet.
4. **A deploy path.** Generalise the Grade 1 tools rather than cloning them:
   `add-platform-controls.py`, `keep-launch-params.py`, `preload-platform.py`,
   `check-lessons.py` and `deploy.mjs` all hardcode `g1v2` and a literal lesson
   list, and every one of them is otherwise grade-agnostic.

## The open question, which is not engineering

**This path records no progress** — no gradebook, no live-group-board position,
no study plan, no placement exam. That is a property of being off the standard
content path and it is already true of both Grade 1 builds. Shipping Grade 2
this way doubles the number of courses in that state, so it wants deciding
rather than inheriting.
