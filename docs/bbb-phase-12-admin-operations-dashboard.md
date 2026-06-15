# BBB Phase 12: Admin Operations Dashboard

This phase adds a single admin command center:

- URL: `/local/hubredirect/live_ops.php`
- Source: `src/moodle/local_hubredirect/live_ops.php`

## What It Shows

- today's live sessions
- upcoming sessions for the next 7 days
- missing post-class reviews
- incomplete attendance or notes
- BBB errors
- recording review queue
- notification failures/skips
- teacher workload for the next 7 days

## Quick Links

- Live sessions
- Recording review
- Diagnostics
- Per-session review page

## Verification

Run:

```sql
source src/moodle/local_prequran/sql/verify_live_ops.sql
```

Then open:

```text
/local/hubredirect/live_ops.php
```
