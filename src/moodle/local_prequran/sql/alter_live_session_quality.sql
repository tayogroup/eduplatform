-- Phase 30: Live Session QA Checklist & Quality Review.
-- Replace mdlgx_ with your Moodle database prefix if needed.

ALTER TABLE mdlgx_local_prequran_live_session
    ADD COLUMN qa_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_reviewed' AFTER status,
    ADD COLUMN qa_score BIGINT(20) NOT NULL DEFAULT 0 AFTER qa_status,
    ADD COLUMN qa_checklist LONGTEXT COLLATE utf8mb4_unicode_ci NULL AFTER qa_score,
    ADD COLUMN qa_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL AFTER qa_checklist,
    ADD COLUMN qa_coaching_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL AFTER qa_notes,
    ADD COLUMN qa_reviewedby BIGINT(20) NOT NULL DEFAULT 0 AFTER qa_coaching_notes,
    ADD COLUMN qa_reviewedat BIGINT(20) NOT NULL DEFAULT 0 AFTER qa_reviewedby;

ALTER TABLE mdlgx_local_prequran_live_session
    ADD INDEX mdlgx_preq_live_session_qa_ix (qa_status, qa_reviewedat),
    ADD INDEX mdlgx_preq_live_session_qaby_ix (qa_reviewedby);
