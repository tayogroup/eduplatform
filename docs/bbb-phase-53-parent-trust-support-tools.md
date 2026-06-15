# Phase 53: Parent Trust Dashboard Admin Preview & Support Tools

This phase adds a staff-only support layer to the existing Parent Live-Class Hub.

## What Changed

- Admins and authorized teachers can open `/local/hubredirect/live_parent_trust.php?childid=<studentid>` to preview the parent trust dashboard for a student.
- The parent-visible area still hides private teacher notes.
- Staff see an additional support panel with:
  - linked parent count
  - upcoming sessions
  - visible summaries
  - open follow-ups
  - pending schedule acknowledgements
  - approved recordings
  - parent hub URL for support copying
  - quick links to schedule, summaries, recordings, and trust center
- The system writes `parent_trust_preview_opened` audit rows, rate-limited to once per staff/student per hour.
- Teacher follow-up cards and Admin Ops follow-up rows now include a direct Parent hub link.

## Test

1. Log in as admin.
2. Open `/local/hubredirect/live_parent_trust.php?childid=<studentid>`.
3. Confirm the Staff Preview & Support panel appears.
4. Log in as a linked parent and open the same child hub.
5. Confirm the support panel is not visible.
6. Run `src/moodle/local_prequran/sql/verify_live_parent_trust_support.sql`.
7. Confirm a `parent_trust_preview_opened` audit row exists after staff preview.

