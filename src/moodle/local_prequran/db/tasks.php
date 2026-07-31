<?php
defined('MOODLE_INTERNAL') || die();

$tasks = [
    [
        'classname' => 'local_prequran\task\safenet_schedule',
        'blocking' => 0,
        'minute' => '*/2',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        'classname' => 'local_prequran\task\live_session_reminders',
        'blocking' => 0,
        'minute' => '*/15',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        'classname' => 'local_prequran\task\live_recording_automation',
        'blocking' => 0,
        'minute' => '17',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        'classname' => 'local_prequran\task\workspace_weekly_digest',
        'blocking' => 0,
        'minute' => '10',
        'hour' => '8',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '1',
    ],
    [
        'classname' => 'local_prequran\task\course_request_digest',
        'blocking' => 0,
        'minute' => '25',
        'hour' => '8',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '1',
    ],
    [
        'classname' => 'local_prequran\task\course_data_maintenance',
        'blocking' => 0,
        'minute' => '40',
        'hour' => '2',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        'classname' => 'local_prequran\task\transcript_maintenance',
        'blocking' => 0,
        'minute' => '55',
        'hour' => '2',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        'classname' => 'local_prequran\task\finance_operations_refresh',
        'blocking' => 0,
        'minute' => '20',
        'hour' => '3',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        'classname' => 'local_prequran\task\finance_api_hardening',
        'blocking' => 0,
        'minute' => '35',
        'hour' => '3',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        'classname' => 'local_prequran\task\support_sla_monitor',
        'blocking' => 0,
        'minute' => '*/10',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        // Ehel Academy: catalog.json -> categories, courses (by idnumber), grade items.
        'classname' => 'local_prequran\task\catalog_sync',
        'blocking' => 0,
        'minute' => '10',
        'hour' => '3',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        // Ehel Academy: cohorts.json -> cohorts, memberships, cohort enrolments.
        // Runs after catalog_sync so the courses exist.
        'classname' => 'local_prequran\task\cohort_sync',
        'blocking' => 0,
        'minute' => '25',
        'hour' => '3',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        // Enrolment lifecycle reconcile: teacher↔course drift + parent observer
        // role assignments. Runs after cohort_sync so rosters are current.
        'classname' => 'local_prequran\task\enrolment_reconcile',
        'blocking' => 0,
        'minute' => '40',
        'hour' => '3',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        // Student wellness: at-risk early-warning flags + homework due/missed
        // reminders. Inert until student_risk_mode / homework_reminder_mode set.
        'classname' => 'local_prequran\task\student_wellness_scan',
        'blocking' => 0,
        'minute' => '55',
        'hour' => '3',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        // Classroom hygiene: no-show/stale-review/zero-attendance sweeps,
        // late-start + short-notice-cancel reporting, grading-SLA reminders.
        // Inert until classroom_hygiene_mode is set.
        'classname' => 'local_prequran\task\classroom_hygiene',
        'blocking' => 0,
        'minute' => '10',
        'hour' => '4',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        // Finance dunning: due-soon/overdue invoice notices, stale plan
        // recalcs, abandoned-session expiry, hold-candidate reporting.
        // Inert until finance_dunning_mode is set.
        'classname' => 'local_prequran\task\finance_dunning',
        'blocking' => 0,
        'minute' => '25',
        'hour' => '4',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        // Completion-award candidate scan: students with a published passing
        // course grade but no certificate. Inert until completion_award_mode.
        'classname' => 'local_prequran\task\completion_award_scan',
        'blocking' => 0,
        'minute' => '40',
        'hour' => '4',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        // Nightly academic analytics snapshot (grade distribution, pass rate,
        // attendance + completion). Inert until analytics_snapshot_mode.
        'classname' => 'local_prequran\task\analytics_snapshot',
        'blocking' => 0,
        'minute' => '50',
        'hour' => '4',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
    [
        // Data retention: purge expired SEB webcam proctoring frames (always)
        // + optional operational-audit trimming (audit_retention_days).
        'classname' => 'local_prequran\task\data_retention',
        'blocking' => 0,
        'minute' => '5',
        'hour' => '3',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
];
