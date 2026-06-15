# Phase 21 - Admin Reporting and Export Center

This phase adds a reporting center so admins can inspect live-class operations without using phpMyAdmin.

## Added page

- `/local/hubredirect/live_reports.php`

The page is site-admin only.

## Filters

- date range
- teacher ID
- student ID
- session status
- series ID

## Reports

- session summary
- teacher workload
- risk and trust audit
- attendance counts
- parent-visible summary counts
- parent-visible recording counts
- conflict and notification audit counts

## CSV exports

- sessions CSV
- attendance CSV
- audit CSV

## Verification

Run:

```sql
src/moodle/local_prequran/sql/verify_live_reports.sql
```

Then test:

1. Open `/local/hubredirect/live_reports.php`.
2. Change the date range and apply filters.
3. Export sessions CSV.
4. Export attendance CSV.
5. Export audit CSV.
