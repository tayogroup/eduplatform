-- Phase 34: QA Alerts & Leadership Review Workflow.
-- Replace mdlgx_ with your Moodle database prefix if needed.

ALTER TABLE mdlgx_local_prequran_live_session
    ADD COLUMN leadership_review_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none' AFTER qa_coaching_completedat,
    ADD COLUMN leadership_review_reason LONGTEXT COLLATE utf8mb4_unicode_ci NULL AFTER leadership_review_status,
    ADD COLUMN leadership_review_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL AFTER leadership_review_reason,
    ADD COLUMN leadership_reviewby BIGINT(20) NOT NULL DEFAULT 0 AFTER leadership_review_notes,
    ADD COLUMN leadership_reviewat BIGINT(20) NOT NULL DEFAULT 0 AFTER leadership_reviewby,
    ADD COLUMN leadership_clearedby BIGINT(20) NOT NULL DEFAULT 0 AFTER leadership_reviewat,
    ADD COLUMN leadership_clearedat BIGINT(20) NOT NULL DEFAULT 0 AFTER leadership_clearedby;

ALTER TABLE mdlgx_local_prequran_live_session
    ADD INDEX mdlgx_preq_live_session_leadstatus_ix (leadership_review_status, leadership_reviewat),
    ADD INDEX mdlgx_preq_live_session_leadby_ix (leadership_reviewby, leadership_clearedby);
