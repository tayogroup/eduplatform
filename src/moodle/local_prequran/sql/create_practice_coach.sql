-- Chatbot Practice Coach event log.
-- Run in the quraantest Moodle database if the Moodle plugin upgrade has not created it yet.

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_practice_coach_event (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  environment VARCHAR(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'production',
  live_sessionid BIGINT(20) NOT NULL DEFAULT 0,
  userid BIGINT(20) NOT NULL DEFAULT 0,
  lessonid VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  unitid VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  step_id VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  event_type VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  trigger_key VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  template_key VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  message LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  base_message LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  message_source VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'rule_based',
  ai_model VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  recommendation_key VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  recommendation_message LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  meta_json LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  coach_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'delivered',
  timecreated BIGINT(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY mdlgx_lpreqcoach_live_ix (live_sessionid, userid, timecreated),
  KEY mdlgx_lpreqcoach_user_ix (userid, timecreated),
  KEY mdlgx_lpreqcoach_trig_ix (trigger_key, timecreated),
  KEY mdlgx_lpreqcoach_env_ix (environment, timecreated),
  KEY mdlgx_lpreqcoach_rec_ix (recommendation_key, timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE mdlgx_local_prequran_practice_coach_event ADD COLUMN IF NOT EXISTS template_key VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';
ALTER TABLE mdlgx_local_prequran_practice_coach_event ADD COLUMN IF NOT EXISTS base_message LONGTEXT COLLATE utf8mb4_unicode_ci NULL;
ALTER TABLE mdlgx_local_prequran_practice_coach_event ADD COLUMN IF NOT EXISTS message_source VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'rule_based';
ALTER TABLE mdlgx_local_prequran_practice_coach_event ADD COLUMN IF NOT EXISTS ai_model VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';
ALTER TABLE mdlgx_local_prequran_practice_coach_event ADD COLUMN IF NOT EXISTS recommendation_key VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';
ALTER TABLE mdlgx_local_prequran_practice_coach_event ADD COLUMN IF NOT EXISTS recommendation_message LONGTEXT COLLATE utf8mb4_unicode_ci NULL;

SHOW COLUMNS FROM mdlgx_local_prequran_practice_coach_event;
