-- Phase 31: Teacher Coaching & QA Follow-Up Loop.
-- Replace mdlgx_ with your Moodle database prefix if needed.

ALTER TABLE mdlgx_local_prequran_live_session
    ADD COLUMN qa_coaching_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none' AFTER qa_coaching_notes,
    ADD COLUMN qa_coaching_priority VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' AFTER qa_coaching_status,
    ADD COLUMN qa_coaching_due_date BIGINT(20) NOT NULL DEFAULT 0 AFTER qa_coaching_priority,
    ADD COLUMN qa_coaching_ackby BIGINT(20) NOT NULL DEFAULT 0 AFTER qa_coaching_due_date,
    ADD COLUMN qa_coaching_ackat BIGINT(20) NOT NULL DEFAULT 0 AFTER qa_coaching_ackby,
    ADD COLUMN qa_coaching_completedby BIGINT(20) NOT NULL DEFAULT 0 AFTER qa_coaching_ackat,
    ADD COLUMN qa_coaching_completedat BIGINT(20) NOT NULL DEFAULT 0 AFTER qa_coaching_completedby;

ALTER TABLE mdlgx_local_prequran_live_session
    ADD INDEX mdlgx_preq_live_session_qacoach_ix (qa_coaching_status, qa_coaching_due_date),
    ADD INDEX mdlgx_preq_live_session_qacoachby_ix (qa_coaching_ackby, qa_coaching_completedby);
