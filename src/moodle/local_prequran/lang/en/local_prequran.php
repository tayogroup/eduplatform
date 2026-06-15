<?php
defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'PreQuran';

$string['bbb_heading'] = 'BigBlueButton live sessions';
$string['bbb_heading_desc'] = 'Configure the hosted BigBlueButton server used for Quraan Academy live review sessions. The shared secret is used only by Moodle server-side code.';
$string['bbb_base_url'] = 'BigBlueButton base URL';
$string['bbb_base_url_desc'] = 'The hosted BigBlueButton API base URL, for example https://bbb.example.com/bigbluebutton/ or https://bbb.example.com/bigbluebutton/api/.';
$string['bbb_shared_secret'] = 'BigBlueButton shared secret';
$string['bbb_shared_secret_desc'] = 'The API shared secret from your hosted BigBlueButton provider. Never expose this value in frontend JavaScript.';
$string['bbb_record_default'] = 'Default recording policy';
$string['bbb_record_default_desc'] = 'Default policy for new live sessions. Consent required is the safest default for sessions involving children.';
$string['bbb_record_default_consent'] = 'Record only when guardian consent exists';
$string['bbb_record_default_off'] = 'Recording off by default';
$string['bbb_record_default_on'] = 'Recording on by default';
$string['bbb_join_window_before_minutes'] = 'Join window before start';
$string['bbb_join_window_before_minutes_desc'] = 'How many minutes before the scheduled start time students may join.';
$string['bbb_join_window_after_minutes'] = 'Join window after start';
$string['bbb_join_window_after_minutes_desc'] = 'How many minutes after the scheduled start time students may still join without admin/teacher override.';
$string['bbb_max_participants_default'] = 'Default max participants';
$string['bbb_max_participants_default_desc'] = 'Default BigBlueButton room capacity. For 1 teacher and 9 students, 12 leaves room for an admin or parent helper.';
$string['bbb_recording_retention_days'] = 'Recording retention days';
$string['bbb_recording_retention_days_desc'] = 'Default number of days to keep live-session recordings before review, unpublishing, or deletion.';
$string['parent_trust_heading'] = 'Parent trust retention';
$string['parent_trust_heading_desc'] = 'Configure governance settings for parent trust support audit retention. These settings control readiness and approval workflow only; they do not delete records.';
$string['parent_trust_retention_days'] = 'Parent trust retention days';
$string['parent_trust_retention_days_desc'] = 'How long to retain parent trust support audit records before they become dry-run purge candidates. Recommended starting value: 365 days.';
$string['parent_trust_purge_requires_export'] = 'Require export before purge';
$string['parent_trust_purge_requires_export_desc'] = 'Require administrators to export a compliance review pack before any future parent trust support audit purge.';
$string['parent_trust_purge_approval_required'] = 'Require approval before purge';
$string['parent_trust_purge_approval_required_desc'] = 'Require an administrator approval workflow before any future parent trust support audit purge.';

$string['bbb_config_missing'] = 'BigBlueButton is not configured. Add the base URL and shared secret in PreQuran plugin settings.';
$string['bbb_api_error'] = 'BigBlueButton API error: {$a}';
$string['bbb_api_parse_error'] = 'BigBlueButton returned an invalid response: {$a}';
$string['messageprovider:live_session_update'] = 'Live session updates';
$string['task_live_session_reminders'] = 'Live session reminders and follow-ups';
