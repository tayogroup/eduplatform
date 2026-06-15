# BBB Phase 9: Recording Lifecycle and Admin Quality Review

This phase adds an admin-only recording review console.

- URL: `/local/hubredirect/live_recordings_admin.php`
- Source: `src/moodle/local_hubredirect/live_recordings_admin.php`
- Parent URL: `/local/hubredirect/live_recordings.php?childid=STUDENT_USER_ID`

## Workflow

1. Admin clicks `Sync BBB recordings`.
2. The page calls the BBB `getRecordings` API for BBB-created, recording-enabled sessions.
3. Recording metadata is stored in `local_prequran_live_recording`.
4. New recordings are hidden from parents by default with `visible_to_parent = 0`.
5. Admin opens playback, reviews quality, and can:
   - mark reviewed
   - publish to parents
   - hide from parents
   - archive
6. Admin can apply retention expiry. Expired recordings are hidden from parents and marked `expired`.
7. Parents can open the approved recordings page. It shows only recordings with `visible_to_parent = 1`, `status = available`, and a non-expired retention date.

## Safety Rules

- Parent visibility requires explicit admin publish.
- BBB secrets and meeting passwords are never shown.
- Recordings can be reviewed before families see them.
- Retention expiry hides old recordings from parents.
- Admin actions are written to `local_prequran_live_audit`.

## Verification

Run:

```sql
source src/moodle/local_prequran/sql/verify_live_recordings.sql
```

Expected result:

- synced recordings appear in `local_prequran_live_recording`
- new rows have `visible_to_parent = 0`
- reviewed/published/admin actions update `reviewedby`, `reviewedat`, `visible_to_parent`, and `status`
