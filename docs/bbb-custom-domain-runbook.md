# BBB Custom Domain Runbook

Use this runbook for the Quraan Academy BiggerBlueButton account after the custom domain is active.

## Current Working Setting

In Moodle:

```text
Site administration -> Plugins -> Local plugins -> PreQuran
```

Set:

```text
BigBlueButton base URL = https://live.quraantest.academy/bigbluebutton/quraanacademy/
```

Moodle normalizes this to:

```text
https://live.quraantest.academy/bigbluebutton/quraanacademy/api/
```

Keep the shared secret server-side in the same PreQuran settings page.

## Important Note

Do not switch Moodle back to:

```text
https://biggerbluebutton.com/bigbluebutton/quraanacademy/
```

after the custom domain has been activated for the account. API calls can still return `SUCCESS`, but the BBB web client may be mapped to the custom domain and can fail or return `401` when the provider URL is used.

## Verification

1. Open:

```text
/local/hubredirect/live_diagnostics.php
```

2. Confirm:

```text
BBB base URL configured = PASS
Configured BBB URL = https://live.quraantest.academy/bigbluebutton/quraanacademy/
Normalized BBB API URL = https://live.quraantest.academy/bigbluebutton/quraanacademy/api/
BBB domain mode = CUSTOM
BBB shared secret configured = PASS
```

3. Create a fresh live session.
4. Start it as teacher/admin.
5. Confirm the browser stays in the BBB room on `live.quraantest.academy`.

## Rollback

Only roll back to the provider URL if BiggerBlueButton support confirms they have removed the custom-domain mapping from the account web-client flow.

If BBB opens and immediately returns to Moodle or shows `error_401.html`, verify the Moodle base URL first. If it is already the custom-domain URL above, contact BiggerBlueButton support and ask them to check the custom-domain activation, account path, and web-client authorization.
