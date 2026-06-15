# BigBlueButton Phase 2 Database Tables

SQL helper:

```text
src/moodle/local_prequran/sql/create_live_sessions.sql
```

The script creates the production MVP live-session tables:

- `mdlgx_local_prequran_live_session`
- `mdlgx_local_prequran_live_participant`
- `mdlgx_local_prequran_live_attendance`
- `mdlgx_local_prequran_live_note`
- `mdlgx_local_prequran_live_recording`
- `mdlgx_local_prequran_live_consent`
- `mdlgx_local_prequran_live_audit`

## Deployment Notes

The script uses the existing project database prefix style, `mdlgx_`. If the Moodle database prefix is different in a target environment, replace `mdlgx_` before running it.

Run this only once per environment. It is intended as a manual helper to match the existing SQL files in this repo. A future Moodle-native upgrade step can convert these tables to XMLDB/install logic.

## Security Notes

The tables intentionally do not store BigBlueButton moderator or attendee passwords. The later join flow should generate or derive meeting passwords server-side, and the browser should receive only a short-lived BBB join URL after Moodle permission checks pass.
