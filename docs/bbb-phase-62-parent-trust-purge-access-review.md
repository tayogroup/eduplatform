# Phase 62: Parent Trust Purge Recovery Access Controls & Export Audit Review

## Goal

Phase 62 strengthens governance around purge recovery evidence. Admins can still view and export evidence, but access is now logged and exports require a reason.

## Updated Page

Open:

`/local/hubredirect/live_parent_trust_purge_evidence.php?id={auditid}`

The page now includes:

- View audit logging.
- Export reason field.
- CSV and JSON export buttons.
- Access and export audit history for the purge evidence record.

## Audit Events

New or expanded audit events:

- `parent_trust_purge_evidence_viewed`
- `parent_trust_purge_evidence_exported`

Export audit details include:

- Source purge audit ID.
- Source purge action.
- Export format.
- Export reason.
- Evidence record count.

## Verification SQL

Run:

`src/moodle/local_prequran/sql/verify_live_parent_trust_purge_access_review.sql`

Expected result:

- Page loads create `parent_trust_purge_evidence_viewed`.
- CSV/JSON downloads create `parent_trust_purge_evidence_exported`.
- Export rows include a non-empty `export_reason`.
- Access counts show views, exports, and distinct admins per purge evidence record.
