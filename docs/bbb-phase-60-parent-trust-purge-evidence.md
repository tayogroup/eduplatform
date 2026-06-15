# Phase 60: Parent Trust Purge Recovery Log & Evidence Snapshot

## Goal

Phase 60 makes the guarded parent trust purge auditable after records are deleted. Before deletion, the retention page captures an evidence snapshot with deleted audit IDs, action and reason counts, affected staff/student counts, oldest/newest timestamps, and a small sample of rows.

## Admin Page

Open:

`/local/hubredirect/live_parent_trust_retention.php`

The page now includes:

- Retention dry-run and approval controls.
- Guarded purge execution.
- Purge Recovery Log & Evidence Snapshot.
- Purge history for blocked, started, and completed purge attempts.

## What Is Stored

When a purge runs, these audit rows are written:

- `parent_trust_purge_started`
- `parent_trust_purge_completed`
- `parent_trust_purge_blocked` when safeguards fail

The started and completed rows include:

- `candidate_count`
- `deleted_count` on completion
- `sample_ids`
- `evidence_snapshot.record_ids`
- `evidence_snapshot.action_counts`
- `evidence_snapshot.reason_counts`
- `evidence_snapshot.staff_count`
- `evidence_snapshot.student_count`
- `evidence_snapshot.sample_rows`

## Verification SQL

Run:

`src/moodle/local_prequran/sql/verify_live_parent_trust_purge_evidence.sql`

Expected result:

- Blocked purge attempts appear when safeguards are not met.
- Started/completed purge rows appear after a successful purge.
- Completed rows show `deleted_count` and `snapshot_record_count`.
- `sample_ids`, action counts, and reason counts are visible in the JSON evidence.

## Safety Notes

- Only parent trust support audit actions are purge targets.
- The purge limit remains 500 records per run.
- Broader live-session audit, attendance, summaries, recordings, and student progress are not deleted by this flow.
- The evidence snapshot supports later review without restoring private support-audit rows.
