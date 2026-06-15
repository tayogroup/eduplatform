-- Phase 26: link live follow-ups to existing parent-teacher messaging.
-- Replace mdlgx_ with your Moodle database prefix if needed.

ALTER TABLE mdlgx_local_prequran_live_note
    ADD COLUMN followup_threadid BIGINT(20) NOT NULL DEFAULT 0 AFTER followup_resolvedat,
    ADD COLUMN followup_contactedat BIGINT(20) NOT NULL DEFAULT 0 AFTER followup_threadid;

ALTER TABLE mdlgx_local_prequran_live_note
    ADD INDEX mdlgx_preq_live_note_fthread_ix (followup_threadid),
    ADD INDEX mdlgx_preq_live_note_fcontact_ix (followup_contactedat);
