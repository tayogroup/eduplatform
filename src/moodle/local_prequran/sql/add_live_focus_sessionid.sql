-- quraantest helper: add live-session scoping to Pre-Quraan focus tables.
-- Replace mdlgx_ if your Moodle database prefix is different.

ALTER TABLE mdlgx_local_prequran_focuslog
  ADD COLUMN IF NOT EXISTS live_sessionid BIGINT(20) NOT NULL DEFAULT 0;

ALTER TABLE mdlgx_local_prequran_focusagg
  ADD COLUMN IF NOT EXISTS live_sessionid BIGINT(20) NOT NULL DEFAULT 0;

CREATE INDEX mdlgx_lpreqfocuslog_live_ix
  ON mdlgx_local_prequran_focuslog (live_sessionid, userid, timecreated);

CREATE INDEX mdlgx_lpreqfocusagg_live_ix
  ON mdlgx_local_prequran_focusagg (live_sessionid, userid, last_time);
