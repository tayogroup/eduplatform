# Phase 41: Teacher Profile Export & Review Pack

Phase 41 turns the teacher performance profile into a leadership-ready review pack.

## What Changed

- Added a leadership review pack section to `/local/hubredirect/live_teacher_profile.php`.
- The review pack summarizes:
  - overall profile verdict;
  - strengths;
  - risks to discuss;
  - recommended actions;
  - QA coverage, QA score, QA pass rate, coaching, improvement plans, leadership cases, and parent follow-ups.
- Added printable review-pack mode:
  - `/local/hubredirect/live_teacher_profile.php?teacherid=36&print=1`
- Added review-pack CSV export:
  - `/local/hubredirect/live_teacher_profile.php?teacherid=36&export=reviewpack`
- Existing session CSV export remains available with `export=profile`.

## Files

- `local/hubredirect/live_teacher_profile.php`
- `local/prequran/sql/verify_live_teacher_review_pack.sql`

## Test

1. Open `/local/hubredirect/live_teacher_profile.php?teacherid=36`.
2. Confirm the Leadership Review Pack appears above the timeline.
3. Click `Printable review pack`, then use browser print or save to PDF.
4. Click `Export review pack` and confirm the CSV includes sections for metrics, strengths, risks, recommended actions, QA concerns, and sessions.
5. Run `verify_live_teacher_review_pack.sql` after replacing `36` with a real teacher user ID.
