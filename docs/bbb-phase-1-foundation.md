# BigBlueButton Phase 1 Foundation

This phase adds Moodle-side BigBlueButton configuration and a server-side API helper for live sessions.

## Files Added

- `src/moodle/local_prequran/version.php`
- `src/moodle/local_prequran/settings.php`
- `src/moodle/local_prequran/lang/en/local_prequran.php`
- `src/moodle/local_prequran/locallib.php`

## Step-by-Step Deployment

1. Copy the `src/moodle/local_prequran` folder contents into Moodle at:

   ```text
   local/prequran/
   ```

2. In Moodle, go to:

   ```text
   Site administration -> Notifications
   ```

   Let Moodle detect or upgrade the local plugin.

3. Go to:

   ```text
   Site administration -> Plugins -> Local plugins -> PreQuran
   ```

4. Enter the BigBlueButton hosted-service settings:

   ```text
   BigBlueButton base URL
   BigBlueButton shared secret
   Default recording policy
   Join window before start
   Join window after start
   Default max participants
   Recording retention days
   ```

5. Use these recommended MVP defaults:

   ```text
   Join window before start: 10
   Join window after start: 15
   Default max participants: 12
   Default recording policy: Record only when guardian consent exists
   Recording retention days: 90
   ```

6. Purge Moodle caches:

   ```text
   Site administration -> Development -> Purge caches
   ```

## Helper Functions

The helper functions are available from `local/prequran/locallib.php`:

```php
local_prequran_bbb_build_url($callname, $params);
local_prequran_bbb_call($callname, $params);
local_prequran_bbb_create_meeting($meeting);
local_prequran_bbb_join_url($meetingid, $fullname, $password, $userid, $extra);
local_prequran_bbb_get_recordings($meetingid, $recordid);
```

## Security Rule

The BBB shared secret is stored in Moodle plugin settings and is used only by server-side PHP. Do not expose it in JavaScript, static HTML, app config files, or browser responses.
