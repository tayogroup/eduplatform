# Group 1: Access, Roles, and Security Hardening

This group hardens the highest-risk live-session surfaces before more product features are added.

## Implemented

- Added `local/hubredirect/live_security.php` as a shared security helper.
- Audits denied access for live review, parent summaries, parent recordings, parent trust details, and purge evidence pages.
- Keeps BBB/live-session secret-style decisions server-side by continuing to guard sensitive actions with Moodle login and role checks.
- Keeps parent summary pages limited to `visible_to_parent = 1` feedback fields.
- Keeps parent recording pages limited to approved, available, unexpired recordings.
- Logs `private_teacher_note_saved` with note length only, never note content.
- Clarified the teacher review label as `Private Teacher Note (not visible to parents)`.
- Cleans and limits purge evidence export reason text.

## Verification

Run:

`src/moodle/local_prequran/sql/verify_group_1_access_security.sql`

Recommended manual checks:

1. Log in as a student or unrelated parent and open another student's summaries, recordings, trust page, and teacher review page. Moodle should deny access.
2. Confirm the denied attempts appear in `local_prequran_live_audit`.
3. Save a private teacher note and confirm the audit row stores only `private_note_length`.
4. Open the parent summaries page and confirm no private teacher note text appears.
5. Try purge evidence export without a reason. It should require a reason and `sesskey`.
