# BBB Phase 10: Parent Notifications MVP

This phase adds Moodle notifications for parent-visible live-session updates.

## Triggers

- Teacher saves a parent-visible live summary for the first time.
- Admin publishes a live class recording to parents.

## Delivery

The notification helper uses Moodle's message API with provider:

- component: `local_prequran`
- provider: `live_session_update`

Delivery depends on the site's Moodle message settings. Audit rows are written regardless of delivery outcome.

## Safety

- Notifications are sent only to linked parents/guardians.
- Summary notifications link to `/local/hubredirect/live_summaries.php?childid=...`.
- Recording notifications link to `/local/hubredirect/live_recordings.php?childid=...`.
- Notification text does not expose private teacher notes, BBB secrets, or recording URLs.

## Verification

Run:

```sql
source src/moodle/local_prequran/sql/verify_live_notifications.sql
```

Expected actions:

- `notification_sent`
- `notification_failed`
- `notification_skipped`

After deploying `db/messages.php`, bumping `version.php`, and visiting Moodle Admin Notifications, purge caches so Moodle registers the new message provider.
