# BigBlueButton Phase 3 Web Services

This phase adds the first safe backend endpoints for Quraan Academy live sessions.

## Registered Functions

The functions are registered in `src/moodle/local_prequran/services.php`:

- `local_prequran_live_create_session`
- `local_prequran_live_list_sessions`
- `local_prequran_live_get_session`
- `local_prequran_live_join_session`

## Implementation File

The endpoint implementation lives in:

```text
src/moodle/local_prequran/externallib_v4.php
```

It loads the server-side BBB helper from:

```text
local/prequran/locallib.php
```

## Behavior

`live_create_session` creates a scheduled live session and inserts teacher/student participants. It does not create the BigBlueButton room yet.

`live_list_sessions` returns sessions visible to the current user. Admins see matching sessions; teachers/students see sessions they own or participate in.

`live_get_session` returns one session plus participants after a visibility check.

`live_join_session` validates the caller, creates the BBB room just-in-time when a teacher/admin starts it, and returns a signed BBB join URL. Students and parent observers cannot create the room.

## Deployment

After copying the plugin files into Moodle:

1. Go to `Site administration -> Notifications`.
2. Let Moodle upgrade the `local_prequran` plugin.
3. Purge caches.
4. Confirm the new web-service functions are listed under the `PreQuran Web Services` service.

## Notes

BBB moderator and attendee passwords are derived server-side and are not stored in the browser or database.
