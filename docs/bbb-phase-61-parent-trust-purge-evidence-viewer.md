# Phase 61: Parent Trust Purge Recovery Viewer & Evidence Export

## Goal

Phase 61 turns the Phase 60 purge evidence JSON into a dedicated admin review page with CSV and JSON exports.

## Admin Page

Open a purge evidence row from:

`/local/hubredirect/live_parent_trust_retention.php`

Then click:

`View/export evidence`

Direct URL format:

`/local/hubredirect/live_parent_trust_purge_evidence.php?id={auditid}`

## Exports

The evidence page provides:

- CSV export for spreadsheet/legal review.
- JSON export for full recovery evidence.

Each export writes an audit row:

`parent_trust_purge_evidence_exported`

## What The Viewer Shows

- Purge audit row ID.
- Admin who ran the purge.
- Retention policy and cutoff.
- Export confirmation and approval status.
- Candidate/deleted counts.
- Sample IDs.
- Oldest/newest deleted event.
- Action counts.
- Reason counts.
- Sample deleted rows.
- Full deleted audit ID list when available.

## Verification SQL

Run:

`src/moodle/local_prequran/sql/verify_live_parent_trust_purge_evidence_viewer.sql`

Expected result:

- Purge rows are listed for opening in the viewer.
- CSV/JSON downloads create `parent_trust_purge_evidence_exported` rows.
- Completed purge rows expose sample IDs, action counts, reason counts, and sample rows.
