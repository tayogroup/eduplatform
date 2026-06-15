# BigBlueButton Phase 4 UI Pages

Phase 4 adds a first Moodle UI for the live-session production MVP.

## Page

```text
src/moodle/local_hubredirect/live_sessions.php
```

Deploy it to:

```text
local/hubredirect/live_sessions.php
```

## Features

- Admins can create sessions by entering teacher and student user IDs.
- Teachers can create sessions from their assigned student checklist.
- Admins, teachers, and students can see visible upcoming sessions.
- Teachers/admins use `Start class`.
- Students use `Join class`.
- The page creates the BBB room just-in-time when the teacher/admin starts the class.
- Students cannot create a BBB room.
- Student joins are limited by the configured join window.

## Requirements

The Phase 1 BBB helper must be deployed:

```text
local/prequran/locallib.php
```

The Phase 2 tables must exist.

The Phase 3 web services are still useful for future frontend/API use, but this page works directly in Moodle so the academy can test the workflow without a separate app build.
