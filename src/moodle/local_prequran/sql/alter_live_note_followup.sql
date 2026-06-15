-- Phase 25: Teacher-parent follow-up workflow.
-- Replace mdlgx_ with your Moodle database prefix if needed.

ALTER TABLE mdlgx_local_prequran_live_note
    ADD COLUMN followup_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none' AFTER homework_priority,
    ADD COLUMN followup_message LONGTEXT COLLATE utf8mb4_unicode_ci NULL AFTER followup_status,
    ADD COLUMN followup_resolved TINYINT(1) NOT NULL DEFAULT 0 AFTER followup_message,
    ADD COLUMN followup_resolvedby BIGINT(20) NOT NULL DEFAULT 0 AFTER followup_resolved,
    ADD COLUMN followup_resolvedat BIGINT(20) NOT NULL DEFAULT 0 AFTER followup_resolvedby;

ALTER TABLE mdlgx_local_prequran_live_note
    ADD INDEX mdlgx_preq_live_note_followup_ix (followup_status, followup_resolved),
    ADD INDEX mdlgx_preq_live_note_followup_due_ix (homework_due_date, followup_resolved);
