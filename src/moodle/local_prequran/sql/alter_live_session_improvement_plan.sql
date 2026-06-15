-- Phase 37: Teacher Improvement Plan Workflow.
-- Replace mdlgx_ with your Moodle database prefix if needed.

ALTER TABLE mdlgx_local_prequran_live_session
    ADD COLUMN improvement_plan_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none' AFTER leadership_clearedat,
    ADD COLUMN improvement_plan_goals LONGTEXT COLLATE utf8mb4_unicode_ci NULL AFTER improvement_plan_status,
    ADD COLUMN improvement_plan_actions LONGTEXT COLLATE utf8mb4_unicode_ci NULL AFTER improvement_plan_goals,
    ADD COLUMN improvement_plan_due_date BIGINT(20) NOT NULL DEFAULT 0 AFTER improvement_plan_actions,
    ADD COLUMN improvement_plan_priority VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' AFTER improvement_plan_due_date,
    ADD COLUMN improvement_plan_mentorid BIGINT(20) NOT NULL DEFAULT 0 AFTER improvement_plan_priority,
    ADD COLUMN improvement_plan_assignedby BIGINT(20) NOT NULL DEFAULT 0 AFTER improvement_plan_mentorid,
    ADD COLUMN improvement_plan_assignedat BIGINT(20) NOT NULL DEFAULT 0 AFTER improvement_plan_assignedby,
    ADD COLUMN improvement_plan_ackby BIGINT(20) NOT NULL DEFAULT 0 AFTER improvement_plan_assignedat,
    ADD COLUMN improvement_plan_ackat BIGINT(20) NOT NULL DEFAULT 0 AFTER improvement_plan_ackby,
    ADD COLUMN improvement_plan_completedby BIGINT(20) NOT NULL DEFAULT 0 AFTER improvement_plan_ackat,
    ADD COLUMN improvement_plan_completedat BIGINT(20) NOT NULL DEFAULT 0 AFTER improvement_plan_completedby,
    ADD COLUMN improvement_plan_completion_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL AFTER improvement_plan_completedat;

ALTER TABLE mdlgx_local_prequran_live_session
    ADD INDEX mdlgx_preq_live_session_impp_stat_ix (improvement_plan_status, improvement_plan_due_date),
    ADD INDEX mdlgx_preq_live_session_impp_tchr_ix (teacherid, improvement_plan_status),
    ADD INDEX mdlgx_preq_live_session_impp_mnt_ix (improvement_plan_mentorid);
