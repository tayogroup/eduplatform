# BigBlueButton Phase 5 Test And Harden

Phase 5 adds live-flow hardening and diagnostics.

## Code Changes

- Student joins now create or update `local_prequran_live_attendance`.
- BBB room creation failures are stored in `bbb_last_error`.
- BBB creation failures are audited as `bbb_create_failed`.
- Successful BBB creation is audited as `bbb_created`.
- Successful UI joins are audited as `join_redirect`.
- Successful web-service joins are audited as `join_url_created`.
- Admin diagnostics page added at:

```text
local/hubredirect/live_diagnostics.php
```

## SQL Verification

Run:

```text
src/moodle/local_prequran/sql/verify_live_flow.sql
```

It checks recent sessions, participants, attendance rows, and audit rows.

## Manual Test Flow

1. Open `local/hubredirect/live_sessions.php` as admin or teacher.
2. Create a session with one teacher and one test student.
3. Confirm the session appears in the list.
4. Click `Start class` as teacher/admin.
5. Confirm BBB opens and `bbb_created` becomes `1`.
6. Log in as the assigned student during the join window.
7. Click `Join class`.
8. Confirm an attendance row is created.
9. Log in as an unassigned student and confirm access is denied.
10. Adjust the session start time outside the join window and confirm the student cannot join.
11. Open `live_diagnostics.php` and confirm recent session/audit state.
