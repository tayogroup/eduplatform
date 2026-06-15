-- Phase 28: Parent follow-up resolution experience.
-- Replace mdlgx_ with your Moodle database prefix if needed.

ALTER TABLE mdlgx_local_prequran_live_note
    ADD COLUMN parent_response_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none' AFTER followup_contactedat,
    ADD COLUMN parent_response_message LONGTEXT COLLATE utf8mb4_unicode_ci NULL AFTER parent_response_status,
    ADD COLUMN parent_responseby BIGINT(20) NOT NULL DEFAULT 0 AFTER parent_response_message,
    ADD COLUMN parent_responseat BIGINT(20) NOT NULL DEFAULT 0 AFTER parent_responseby;

ALTER TABLE mdlgx_local_prequran_live_note
    ADD INDEX mdlgx_preq_live_note_parentresp_ix (parent_response_status, parent_responseat);
