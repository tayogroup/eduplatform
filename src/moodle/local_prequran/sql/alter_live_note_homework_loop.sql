-- Phase 24 schema update: structured homework/action plan fields.
-- Replace mdlgx_ with your Moodle table prefix if needed.

ALTER TABLE mdlgx_local_prequran_live_note
  ADD COLUMN homework_lessonid VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' AFTER homework,
  ADD COLUMN homework_unitid VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' AFTER homework_lessonid,
  ADD COLUMN homework_due_date BIGINT(20) NOT NULL DEFAULT 0 AFTER homework_unitid,
  ADD COLUMN homework_priority VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' AFTER homework_due_date,
  ADD KEY mdlgx_lpreqlive_note_hw_due_ix (homework_due_date),
  ADD KEY mdlgx_lpreqlive_note_hw_unit_ix (homework_unitid);

