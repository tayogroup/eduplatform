# BBB Phase 8: Parent Trust Features

This phase adds a parent-facing Live Class Trust Center.

- URL: `/local/hubredirect/live_trust.php?childid=STUDENT_USER_ID`
- Source: `src/moodle/local_hubredirect/live_trust.php`
- Dashboard entry: `Trust Center`

The page gives parents a clear view of:

- live-session count
- sessions started or completed
- parent summaries published
- sessions marked for recording
- live participation consent status
- recording consent status
- teacher name and class date
- attendance and participation status
- summary publication status
- visible parent recording availability

The trust page intentionally does not show:

- private teacher notes
- teacher-only attendance notes
- BBB secrets or meeting credentials
- internal audit details

## Verification

Run:

```sql
source src/moodle/local_prequran/sql/verify_live_trust.sql
```

Expected result:

- sessions are listed per active student participant
- attendance and summary visibility match teacher review data
- visible parent recordings count only includes recordings marked `visible_to_parent = 1`
