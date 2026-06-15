# Phase 29: Follow-Up Command Center

This phase gives teachers and administrators one place to manage parent follow-ups.

## What It Adds

- New page:
  - `/local/hubredirect/live_followups.php`
- Role-aware access:
  - Administrators see all follow-ups.
  - Teachers see only their own session follow-ups.
- Filters:
  - all
  - open
  - parent needs help
  - overdue
  - admin support
  - resolved
- Quick actions:
  - mark resolved
  - reopen
  - escalate to admin
  - update status only
  - open message thread
  - open session review
  - open parent view
- Audit rows:
  - `followup_resolved_command_center`
  - `followup_reopened_command_center`
  - `followup_escalated_command_center`
  - `followup_updated_command_center`

## Files

- `src/moodle/local_hubredirect/live_followups.php`
- `src/moodle/local_hubredirect/live_ops.php`
- `src/moodle/local_hubredirect/live_teacher.php`
- `src/moodle/local_prequran/sql/verify_live_followup_command_center.sql`

## Install

Upload:

- `live_followups.php`
- updated `live_ops.php`
- updated `live_teacher.php`

No database schema change is required for Phase 29 if Phase 25, Phase 26, and Phase 28 are already installed.

## Test

1. Create an open follow-up from `live_review.php`.
2. Open `/local/hubredirect/live_followups.php` as the teacher.
3. Confirm only that teacher's follow-ups appear.
4. Open the same page as an admin.
5. Confirm all follow-ups and teacher filter appear.
6. Test:
   - `Mark resolved`
   - `Reopen follow-up`
   - `Escalate to admin`
   - `Message`
   - `Review`
   - `Parent view`
7. Run:

```sql
src/moodle/local_prequran/sql/verify_live_followup_command_center.sql
```
