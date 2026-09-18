# Archived: Grade 5's unrouted shell course

Moved here 2026-09-18. This is the same 18-unit, `grade-N/data/units/*.json` shell
course every other Mathematics grade (1, 3, 4, 6, 7, 8) still uses, built for
Grade 5 and never routed to a learner: `mathematics/grade-5-app/` — six lesson
pages, wired to the platform shell 2026-09-18 — is Grade 5's live product, and
has been since it was routed (`ehel-math-g05 -> app/mathematics/grade-5-v2/index.html`,
2026-09-17; see `project_math_standalone_routing.md`).

Owner decision, 2026-09-18: keep the app, archive this. Both builds were
complete and valid, which is what made the duplication worth flagging rather
than deleting outright — see the "Maths Upper Stages Side by Side" comparison
(`https://claude.ai/artifact/JkJCta989uZYDR7HXdPbxe`) for the full comparison
that surfaced it, including the field-by-field difference between what this
shell course holds and what the app teaches.

**This directory is not built, checked or routed.** `tools/build-ehel-math-runtime.js`'s
default grade list no longer includes 5 (matching Grade 2's own precedent as
the deliberately-excluded reference implementation), so a bare `npm run
build:math --force` will not recreate `mathematics/grade-5/` from the content
model. The repo-wide Math checks (`npm run check:math`) glob `grade-*/data/units`
and simply find nothing here, by directory name, not by any special-casing.

Kept rather than deleted so the content is not lost — it is complete, Cambridge-
mapped work — and so git history for `mathematics/grade-5/` is not disturbed
(this was a rename, not a delete-and-recreate). If the app is ever retired in
favour of this shell course, `git mv` it back to `mathematics/grade-5/` and
re-add 5 to `build-ehel-math-runtime.js`'s default grade list.
