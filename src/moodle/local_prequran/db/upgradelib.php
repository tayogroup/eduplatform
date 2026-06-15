<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function xmldb_local_prequran_add_field_if_missing(
    database_manager $dbman,
    xmldb_table $table,
    xmldb_field $field
): void {
    if (!$dbman->table_exists($table)) {
        return;
    }
    if (!$dbman->field_exists($table, $field)) {
        $dbman->add_field($table, $field);
    }
}

function xmldb_local_prequran_add_index_if_missing(
    database_manager $dbman,
    xmldb_table $table,
    xmldb_index $index
): void {
    if (!$dbman->table_exists($table)) {
        return;
    }
    if (!$dbman->index_exists($table, $index)) {
        $dbman->add_index($table, $index);
    }
}

function xmldb_local_prequran_field_int(string $name, int $length = 20, int $default = 0): xmldb_field {
    return new xmldb_field($name, XMLDB_TYPE_INTEGER, (string)$length, null, XMLDB_NOTNULL, null, (string)$default);
}

function xmldb_local_prequran_field_id(): xmldb_field {
    return new xmldb_field('id', XMLDB_TYPE_INTEGER, '20', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
}

function xmldb_local_prequran_field_char(string $name, int $length, string $default = ''): xmldb_field {
    return new xmldb_field($name, XMLDB_TYPE_CHAR, (string)$length, null, XMLDB_NOTNULL, null, $default);
}

function xmldb_local_prequran_field_text(string $name): xmldb_field {
    return new xmldb_field($name, XMLDB_TYPE_TEXT, null, null, null, null, null);
}

function xmldb_local_prequran_create_table_if_missing(
    database_manager $dbman,
    xmldb_table $table,
    array $fields,
    array $keys,
    array $indexes
): void {
    if ($dbman->table_exists($table)) {
        foreach ($fields as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $table, $field);
        }
        foreach ($indexes as $index) {
            xmldb_local_prequran_add_index_if_missing($dbman, $table, $index);
        }
        return;
    }

    foreach ($fields as $field) {
        $table->addField($field);
    }
    foreach ($keys as $key) {
        $table->addKey($key);
    }
    foreach ($indexes as $index) {
        $table->addIndex($index);
    }
    $dbman->create_table($table);
}

function xmldb_local_prequran_ensure_live_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_live_session'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('seriesid', 20, 0),
            xmldb_local_prequran_field_int('series_sequence', 10, 0),
            xmldb_local_prequran_field_int('cohortid', 20, 0),
            xmldb_local_prequran_field_int('teacherid'),
            xmldb_local_prequran_field_char('lessonid', 100),
            xmldb_local_prequran_field_char('unitid', 100),
            xmldb_local_prequran_field_char('title', 255),
            xmldb_local_prequran_field_text('description'),
            xmldb_local_prequran_field_int('scheduled_start'),
            xmldb_local_prequran_field_int('scheduled_end'),
            xmldb_local_prequran_field_char('timezone', 100, 'UTC'),
            xmldb_local_prequran_field_char('status', 50, 'scheduled'),
            xmldb_local_prequran_field_char('qa_status', 40, 'not_reviewed'),
            xmldb_local_prequran_field_int('qa_score', 20, 0),
            xmldb_local_prequran_field_text('qa_checklist'),
            xmldb_local_prequran_field_text('qa_notes'),
            xmldb_local_prequran_field_text('qa_coaching_notes'),
            xmldb_local_prequran_field_int('qa_reviewedby'),
            xmldb_local_prequran_field_int('qa_reviewedat'),
            xmldb_local_prequran_field_char('qa_coaching_status', 40, 'none'),
            xmldb_local_prequran_field_char('qa_coaching_priority', 20, 'normal'),
            xmldb_local_prequran_field_int('qa_coaching_due_date'),
            xmldb_local_prequran_field_int('qa_coaching_ackby'),
            xmldb_local_prequran_field_int('qa_coaching_ackat'),
            xmldb_local_prequran_field_int('qa_coaching_completedby'),
            xmldb_local_prequran_field_int('qa_coaching_completedat'),
            xmldb_local_prequran_field_char('leadership_review_status', 40, 'none'),
            xmldb_local_prequran_field_text('leadership_review_reason'),
            xmldb_local_prequran_field_text('leadership_review_notes'),
            xmldb_local_prequran_field_int('leadership_reviewby'),
            xmldb_local_prequran_field_int('leadership_reviewat'),
            xmldb_local_prequran_field_int('leadership_clearedby'),
            xmldb_local_prequran_field_int('leadership_clearedat'),
            xmldb_local_prequran_field_char('improvement_plan_status', 40, 'none'),
            xmldb_local_prequran_field_text('improvement_plan_goals'),
            xmldb_local_prequran_field_text('improvement_plan_actions'),
            xmldb_local_prequran_field_int('improvement_plan_due_date'),
            xmldb_local_prequran_field_char('improvement_plan_priority', 20, 'normal'),
            xmldb_local_prequran_field_int('improvement_plan_mentorid'),
            xmldb_local_prequran_field_int('improvement_plan_assignedby'),
            xmldb_local_prequran_field_int('improvement_plan_assignedat'),
            xmldb_local_prequran_field_int('improvement_plan_ackby'),
            xmldb_local_prequran_field_int('improvement_plan_ackat'),
            xmldb_local_prequran_field_int('improvement_plan_completedby'),
            xmldb_local_prequran_field_int('improvement_plan_completedat'),
            xmldb_local_prequran_field_text('improvement_plan_completion_notes'),
            xmldb_local_prequran_field_int('recording_enabled', 1, 0),
            xmldb_local_prequran_field_int('recording_consent_required', 1, 1),
            xmldb_local_prequran_field_int('parent_observer_allowed', 1, 0),
            xmldb_local_prequran_field_int('max_participants', 10, 12),
            xmldb_local_prequran_field_char('bbb_meeting_id', 255),
            xmldb_local_prequran_field_char('bbb_internal_meeting_id', 255),
            xmldb_local_prequran_field_int('bbb_created', 1, 0),
            xmldb_local_prequran_field_int('bbb_create_time'),
            xmldb_local_prequran_field_text('bbb_last_error'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('cancelledby'),
            xmldb_local_prequran_field_text('cancellation_reason'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqlive_sess_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['teacherid', 'scheduled_start']),
            new xmldb_index('preqlive_sess_status_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'scheduled_start']),
            new xmldb_index('preqlive_sess_series_ix', XMLDB_INDEX_NOTUNIQUE, ['seriesid', 'scheduled_start']),
            new xmldb_index('preqlive_sess_qa_ix', XMLDB_INDEX_NOTUNIQUE, ['qa_status', 'qa_reviewedat']),
            new xmldb_index('preqlive_sess_qacoach_ix', XMLDB_INDEX_NOTUNIQUE, ['qa_coaching_status', 'qa_coaching_due_date']),
            new xmldb_index('preqlive_sess_lead_ix', XMLDB_INDEX_NOTUNIQUE, ['leadership_review_status', 'leadership_reviewat']),
            new xmldb_index('preqlive_sess_imp_ix', XMLDB_INDEX_NOTUNIQUE, ['improvement_plan_status', 'improvement_plan_due_date']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_live_participant'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('sessionid'),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_char('role', 50, 'student'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_char('status', 50, 'active'),
            xmldb_local_prequran_field_char('displayname', 255),
            xmldb_local_prequran_field_int('invitedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqlive_part_uix', XMLDB_KEY_UNIQUE, ['sessionid', 'userid', 'role']),
        ],
        [
            new xmldb_index('preqlive_part_user_ix', XMLDB_INDEX_NOTUNIQUE, ['userid']),
            new xmldb_index('preqlive_part_student_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid']),
            new xmldb_index('preqlive_part_role_ix', XMLDB_INDEX_NOTUNIQUE, ['role', 'status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_live_attendance'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('sessionid'),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('join_time'),
            xmldb_local_prequran_field_int('leave_time'),
            xmldb_local_prequran_field_char('attendance_status', 50, 'absent'),
            xmldb_local_prequran_field_char('participation_status', 50),
            xmldb_local_prequran_field_int('technical_issue', 1, 0),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_int('markedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqlive_att_uix', XMLDB_KEY_UNIQUE, ['sessionid', 'studentid']),
        ],
        [
            new xmldb_index('preqlive_att_user_ix', XMLDB_INDEX_NOTUNIQUE, ['userid']),
            new xmldb_index('preqlive_att_status_ix', XMLDB_INDEX_NOTUNIQUE, ['attendance_status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_live_note'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('sessionid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('teacherid'),
            xmldb_local_prequran_field_text('strengths'),
            xmldb_local_prequran_field_text('needs_practice'),
            xmldb_local_prequran_field_text('homework'),
            xmldb_local_prequran_field_char('homework_lessonid', 100),
            xmldb_local_prequran_field_char('homework_unitid', 100),
            xmldb_local_prequran_field_int('homework_due_date'),
            xmldb_local_prequran_field_char('homework_priority', 20, 'normal'),
            xmldb_local_prequran_field_char('followup_status', 40, 'none'),
            xmldb_local_prequran_field_text('followup_message'),
            xmldb_local_prequran_field_int('followup_resolved', 1, 0),
            xmldb_local_prequran_field_int('followup_resolvedby'),
            xmldb_local_prequran_field_int('followup_resolvedat'),
            xmldb_local_prequran_field_int('followup_threadid'),
            xmldb_local_prequran_field_int('followup_contactedat'),
            xmldb_local_prequran_field_char('parent_response_status', 40, 'none'),
            xmldb_local_prequran_field_text('parent_response_message'),
            xmldb_local_prequran_field_int('parent_responseby'),
            xmldb_local_prequran_field_int('parent_responseat'),
            xmldb_local_prequran_field_text('parent_summary'),
            xmldb_local_prequran_field_text('private_note'),
            xmldb_local_prequran_field_int('visible_to_parent', 1, 1),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqlive_note_uix', XMLDB_KEY_UNIQUE, ['sessionid', 'studentid']),
        ],
        [
            new xmldb_index('preqlive_note_student_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid']),
            new xmldb_index('preqlive_note_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['teacherid']),
            new xmldb_index('preqlive_note_hw_due_ix', XMLDB_INDEX_NOTUNIQUE, ['homework_due_date']),
            new xmldb_index('preqlive_note_hw_unit_ix', XMLDB_INDEX_NOTUNIQUE, ['homework_unitid']),
            new xmldb_index('preqlive_note_follow_ix', XMLDB_INDEX_NOTUNIQUE, ['followup_status', 'followup_resolved']),
            new xmldb_index('preqlive_note_fthread_ix', XMLDB_INDEX_NOTUNIQUE, ['followup_threadid']),
            new xmldb_index('preqlive_note_parent_ix', XMLDB_INDEX_NOTUNIQUE, ['parent_response_status', 'parent_responseat']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_live_recording'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('sessionid'),
            xmldb_local_prequran_field_char('bbb_record_id', 255),
            xmldb_local_prequran_field_char('bbb_meeting_id', 255),
            xmldb_local_prequran_field_char('name', 255),
            xmldb_local_prequran_field_text('playback_url'),
            xmldb_local_prequran_field_char('playback_format', 50),
            xmldb_local_prequran_field_int('duration_minutes', 10, 0),
            xmldb_local_prequran_field_int('published', 1, 0),
            xmldb_local_prequran_field_int('visible_to_parent', 1, 0),
            xmldb_local_prequran_field_char('status', 50, 'available'),
            xmldb_local_prequran_field_int('reviewedby'),
            xmldb_local_prequran_field_int('reviewedat'),
            xmldb_local_prequran_field_int('expiresat'),
            xmldb_local_prequran_field_text('raw_metadata'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqlive_rec_uix', XMLDB_KEY_UNIQUE, ['bbb_record_id']),
        ],
        [
            new xmldb_index('preqlive_rec_session_ix', XMLDB_INDEX_NOTUNIQUE, ['sessionid']),
            new xmldb_index('preqlive_rec_meeting_ix', XMLDB_INDEX_NOTUNIQUE, ['bbb_meeting_id']),
            new xmldb_index('preqlive_rec_parent_ix', XMLDB_INDEX_NOTUNIQUE, ['visible_to_parent', 'status']),
            new xmldb_index('preqlive_rec_expires_ix', XMLDB_INDEX_NOTUNIQUE, ['expiresat']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_live_consent'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('guardianid'),
            xmldb_local_prequran_field_char('consent_type', 50, 'live_session'),
            xmldb_local_prequran_field_int('granted', 1, 0),
            xmldb_local_prequran_field_char('version', 50, '1'),
            xmldb_local_prequran_field_char('consent_source', 100),
            xmldb_local_prequran_field_text('details'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqlive_cons_uix', XMLDB_KEY_UNIQUE, ['studentid', 'guardianid', 'consent_type']),
        ],
        [
            new xmldb_index('preqlive_cons_guard_ix', XMLDB_INDEX_NOTUNIQUE, ['guardianid']),
            new xmldb_index('preqlive_cons_type_ix', XMLDB_INDEX_NOTUNIQUE, ['consent_type', 'granted']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_live_audit'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('sessionid'),
            xmldb_local_prequran_field_int('actorid'),
            xmldb_local_prequran_field_char('action', 80),
            xmldb_local_prequran_field_char('targettype', 80),
            xmldb_local_prequran_field_int('targetid'),
            xmldb_local_prequran_field_text('details'),
            xmldb_local_prequran_field_int('timecreated'),
        ],
        [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])],
        [
            new xmldb_index('preqlive_audit_session_ix', XMLDB_INDEX_NOTUNIQUE, ['sessionid', 'timecreated']),
            new xmldb_index('preqlive_audit_actor_ix', XMLDB_INDEX_NOTUNIQUE, ['actorid', 'timecreated']),
            new xmldb_index('preqlive_audit_action_ix', XMLDB_INDEX_NOTUNIQUE, ['action', 'timecreated']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_live_series'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('cohortid'),
            xmldb_local_prequran_field_int('teacherid'),
            xmldb_local_prequran_field_char('title', 255),
            xmldb_local_prequran_field_char('lessonid', 100),
            xmldb_local_prequran_field_char('unitid', 100),
            xmldb_local_prequran_field_char('pattern', 50, 'none'),
            xmldb_local_prequran_field_char('weekdays', 50),
            xmldb_local_prequran_field_char('start_time', 10),
            xmldb_local_prequran_field_int('duration_minutes', 10, 60),
            xmldb_local_prequran_field_int('date_start'),
            xmldb_local_prequran_field_int('date_end'),
            xmldb_local_prequran_field_int('session_count', 10, 0),
            xmldb_local_prequran_field_char('status', 50, 'active'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('cancelledby'),
            xmldb_local_prequran_field_text('cancellation_reason'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])],
        [
            new xmldb_index('preqlive_series_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['teacherid', 'date_start']),
            new xmldb_index('preqlive_series_status_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'date_start']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_live_availability'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('teacherid'),
            xmldb_local_prequran_field_int('weekday', 1, 0),
            xmldb_local_prequran_field_int('start_minute', 10, 0),
            xmldb_local_prequran_field_int('end_minute', 10, 0),
            xmldb_local_prequran_field_char('timezone', 100, 'UTC'),
            xmldb_local_prequran_field_char('status', 50, 'active'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])],
        [new xmldb_index('preqlive_avail_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['teacherid', 'weekday', 'status'])]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_live_ack'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('seriesid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('parentid'),
            xmldb_local_prequran_field_char('ack_status', 40, 'pending'),
            xmldb_local_prequran_field_text('ack_message'),
            xmldb_local_prequran_field_int('acknowledgedat'),
            xmldb_local_prequran_field_int('lastchangeat'),
            xmldb_local_prequran_field_int('remindedat'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqlive_ack_uix', XMLDB_KEY_UNIQUE, ['seriesid', 'studentid', 'parentid']),
        ],
        [
            new xmldb_index('preqlive_ack_series_ix', XMLDB_INDEX_NOTUNIQUE, ['seriesid', 'ack_status', 'acknowledgedat']),
            new xmldb_index('preqlive_ack_parent_ix', XMLDB_INDEX_NOTUNIQUE, ['parentid', 'studentid', 'lastchangeat']),
        ]
    );

    xmldb_local_prequran_ensure_grouping_schema();
}

function xmldb_local_prequran_ensure_environment_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $environmentfield = xmldb_local_prequran_field_char('environment', 30, 'production');

    $tables = [
        'local_prequran_lessonprog' => [
            new xmldb_index('preqlesson_env_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'userid', 'lessonid', 'unitid']),
        ],
        'local_prequran_stepprog' => [
            new xmldb_index('preqstep_env_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'userid', 'lessonid', 'unitid']),
        ],
        'local_prequran_stepcfg' => [
            new xmldb_index('preqstepcfg_env_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'lessonid', 'unitid', 'active']),
        ],
        'local_prequran_focuslog' => [
            new xmldb_index('preqfocuslog_env_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'userid', 'lessonid', 'unitid']),
        ],
        'local_prequran_focusagg' => [
            new xmldb_index('preqfocusagg_env_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'userid', 'lessonid', 'unitid']),
        ],
        'local_prequran_speakrec' => [
            new xmldb_index('preqspeakrec_env_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'userid', 'lessonid', 'unitid']),
        ],
        'local_prequran_submitrec' => [
            new xmldb_index('preqsubmitrec_env_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'userid', 'lessonid', 'unitid']),
        ],
    ];

    foreach ($tables as $tablename => $indexes) {
        $table = new xmldb_table($tablename);
        if (!$dbman->table_exists($table)) {
            continue;
        }

        xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $environmentfield);

        foreach ($indexes as $index) {
            xmldb_local_prequran_add_index_if_missing($dbman, $table, $index);
        }
    }
}

function xmldb_local_prequran_ensure_quiz_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_quiz_attempt'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('environment', 30, 'production'),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_char('lessonid', 100),
            xmldb_local_prequran_field_char('unitid', 100),
            xmldb_local_prequran_field_char('quizid', 120),
            xmldb_local_prequran_field_char('quiz_version', 80),
            xmldb_local_prequran_field_char('attempt_session_id', 120),
            xmldb_local_prequran_field_int('attempt_no', 10, 1),
            xmldb_local_prequran_field_char('status', 40, 'started'),
            xmldb_local_prequran_field_int('pass_count', 10, 0),
            xmldb_local_prequran_field_int('questions_total', 10, 0),
            xmldb_local_prequran_field_int('questions_answered', 10, 0),
            xmldb_local_prequran_field_int('correct_count', 10, 0),
            xmldb_local_prequran_field_int('incorrect_count', 10, 0),
            xmldb_local_prequran_field_int('percent', 10, 0),
            xmldb_local_prequran_field_int('duration_seconds', 20, 0),
            xmldb_local_prequran_field_int('started_at'),
            xmldb_local_prequran_field_int('completed_at'),
            xmldb_local_prequran_field_int('last_activity_at'),
            xmldb_local_prequran_field_char('device_type', 40),
            xmldb_local_prequran_field_text('useragent'),
            xmldb_local_prequran_field_text('summary_json'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqquizattempt_sess_uix', XMLDB_KEY_UNIQUE, ['environment', 'attempt_session_id']),
        ],
        [
            new xmldb_index('preqquizattempt_user_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'userid', 'lessonid', 'unitid']),
            new xmldb_index('preqquizattempt_quiz_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'quizid', 'status']),
            new xmldb_index('preqquizattempt_last_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'last_activity_at']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_quiz_pass'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('environment', 30, 'production'),
            xmldb_local_prequran_field_int('attemptid'),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_char('lessonid', 100),
            xmldb_local_prequran_field_char('unitid', 100),
            xmldb_local_prequran_field_char('quizid', 120),
            xmldb_local_prequran_field_int('pass_number', 10, 0),
            xmldb_local_prequran_field_char('pass_title', 160),
            xmldb_local_prequran_field_int('questions_total', 10, 0),
            xmldb_local_prequran_field_int('questions_answered', 10, 0),
            xmldb_local_prequran_field_int('correct_count', 10, 0),
            xmldb_local_prequran_field_int('incorrect_count', 10, 0),
            xmldb_local_prequran_field_int('percent', 10, 0),
            xmldb_local_prequran_field_int('duration_seconds', 20, 0),
            xmldb_local_prequran_field_int('started_at'),
            xmldb_local_prequran_field_int('completed_at'),
            xmldb_local_prequran_field_text('summary_json'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqquizpass_uix', XMLDB_KEY_UNIQUE, ['attemptid', 'pass_number']),
        ],
        [
            new xmldb_index('preqquizpass_user_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'userid', 'lessonid', 'unitid']),
            new xmldb_index('preqquizpass_quiz_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'quizid', 'pass_number']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_quiz_question'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('environment', 30, 'production'),
            xmldb_local_prequran_field_int('attemptid'),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_char('lessonid', 100),
            xmldb_local_prequran_field_char('unitid', 100),
            xmldb_local_prequran_field_char('quizid', 120),
            xmldb_local_prequran_field_int('pass_number', 10, 0),
            xmldb_local_prequran_field_int('question_index', 10, 0),
            xmldb_local_prequran_field_char('question_id', 160),
            xmldb_local_prequran_field_char('question_tag', 160),
            xmldb_local_prequran_field_char('skill_area', 80),
            xmldb_local_prequran_field_text('prompt'),
            xmldb_local_prequran_field_text('focus_text'),
            xmldb_local_prequran_field_char('correct_answer', 160),
            xmldb_local_prequran_field_char('selected_answer', 160),
            xmldb_local_prequran_field_int('is_correct', 1, 0),
            xmldb_local_prequran_field_int('attempt_count', 10, 1),
            xmldb_local_prequran_field_int('used_listen', 1, 0),
            xmldb_local_prequran_field_int('listen_count', 10, 0),
            xmldb_local_prequran_field_int('time_to_answer_seconds', 20, 0),
            xmldb_local_prequran_field_int('answered_at'),
            xmldb_local_prequran_field_text('choices_json'),
            xmldb_local_prequran_field_text('extra_json'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqquizquestion_uix', XMLDB_KEY_UNIQUE, ['attemptid', 'question_id']),
        ],
        [
            new xmldb_index('preqquizquestion_user_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'userid', 'lessonid', 'unitid']),
            new xmldb_index('preqquizquestion_skill_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'skill_area', 'is_correct']),
            new xmldb_index('preqquizquestion_pass_ix', XMLDB_INDEX_NOTUNIQUE, ['attemptid', 'pass_number', 'question_index']),
        ]
    );
}

function xmldb_local_prequran_ensure_live_focus_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $livefield = xmldb_local_prequran_field_int('live_sessionid', 20, 0);

    $tables = [
        'local_prequran_focuslog' => [
            new xmldb_index('preqfocuslog_live_ix', XMLDB_INDEX_NOTUNIQUE, ['live_sessionid', 'userid', 'timecreated']),
        ],
        'local_prequran_focusagg' => [
            new xmldb_index('preqfocusagg_live_ix', XMLDB_INDEX_NOTUNIQUE, ['live_sessionid', 'userid', 'last_time']),
        ],
    ];

    foreach ($tables as $tablename => $indexes) {
        $table = new xmldb_table($tablename);
        if (!$dbman->table_exists($table)) {
            continue;
        }
        xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $livefield);
        foreach ($indexes as $index) {
            xmldb_local_prequran_add_index_if_missing($dbman, $table, $index);
        }
    }
}

function xmldb_local_prequran_ensure_grouping_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_student_profile'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_char('student_display_name', 255),
            xmldb_local_prequran_field_char('date_of_birth', 20),
            xmldb_local_prequran_field_char('timezone', 100, 'UTC'),
            xmldb_local_prequran_field_char('primary_language', 100),
            xmldb_local_prequran_field_char('language', 100),
            xmldb_local_prequran_field_int('age_years', 10, 0),
            xmldb_local_prequran_field_char('age_band', 40),
            xmldb_local_prequran_field_char('current_level', 100),
            xmldb_local_prequran_field_char('learning_base', 100),
            xmldb_local_prequran_field_char('country', 100),
            xmldb_local_prequran_field_char('city', 100),
            xmldb_local_prequran_field_char('gender', 40),
            xmldb_local_prequran_field_char('parent_name', 255),
            xmldb_local_prequran_field_char('parent_email', 255),
            xmldb_local_prequran_field_char('parent_phone', 100),
            xmldb_local_prequran_field_int('live_class_consent', 1, 0),
            xmldb_local_prequran_field_int('recording_consent', 1, 0),
            xmldb_local_prequran_field_text('consent_notes'),
            xmldb_local_prequran_field_text('availability'),
            xmldb_local_prequran_field_text('parent_preferences'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqstudprof_user_uix', XMLDB_KEY_UNIQUE, ['userid']),
        ],
        [
            new xmldb_index('preqstudprof_match_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'timezone', 'language', 'current_level']),
            new xmldb_index('preqstudprof_parent_ix', XMLDB_INDEX_NOTUNIQUE, ['parent_email']),
            new xmldb_index('preqstudprof_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['live_class_consent', 'recording_consent']),
            new xmldb_index('preqstudprof_age_ix', XMLDB_INDEX_NOTUNIQUE, ['age_band', 'gender']),
            new xmldb_index('preqstudprof_place_ix', XMLDB_INDEX_NOTUNIQUE, ['country', 'city']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_group_pool'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('title', 255),
            xmldb_local_prequran_field_char('timezone', 100, 'UTC'),
            xmldb_local_prequran_field_char('language', 100),
            xmldb_local_prequran_field_int('age_min', 10, 0),
            xmldb_local_prequran_field_int('age_max', 10, 99),
            xmldb_local_prequran_field_char('level_min', 100),
            xmldb_local_prequran_field_char('level_max', 100),
            xmldb_local_prequran_field_char('learning_base', 100),
            xmldb_local_prequran_field_char('country', 100),
            xmldb_local_prequran_field_char('city', 100),
            xmldb_local_prequran_field_char('gender_policy', 40, 'flexible'),
            xmldb_local_prequran_field_text('schedule_preferences'),
            xmldb_local_prequran_field_text('rule_notes'),
            xmldb_local_prequran_field_int('max_students', 10, 9),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqgrpool_match_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'timezone', 'language', 'gender_policy']),
            new xmldb_index('preqgrpool_level_ix', XMLDB_INDEX_NOTUNIQUE, ['learning_base', 'level_min', 'level_max']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_class_group'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('poolid'),
            xmldb_local_prequran_field_int('teacherid'),
            xmldb_local_prequran_field_char('title', 255),
            xmldb_local_prequran_field_char('timezone', 100, 'UTC'),
            xmldb_local_prequran_field_char('language', 100),
            xmldb_local_prequran_field_char('current_level', 100),
            xmldb_local_prequran_field_char('learning_base', 100),
            xmldb_local_prequran_field_char('country', 100),
            xmldb_local_prequran_field_char('city', 100),
            xmldb_local_prequran_field_int('age_min', 10, 0),
            xmldb_local_prequran_field_int('age_max', 10, 99),
            xmldb_local_prequran_field_char('gender_policy', 40, 'flexible'),
            xmldb_local_prequran_field_text('schedule_summary'),
            xmldb_local_prequran_field_int('max_students', 10, 9),
            xmldb_local_prequran_field_char('status', 40, 'open'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqclassgrp_pool_ix', XMLDB_INDEX_NOTUNIQUE, ['poolid', 'status']),
            new xmldb_index('preqclassgrp_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['teacherid', 'status']),
            new xmldb_index('preqclassgrp_match_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'timezone', 'language', 'current_level']),
            new xmldb_index('preqclassgrp_place_ix', XMLDB_INDEX_NOTUNIQUE, ['country', 'city']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_group_member'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('groupid'),
            xmldb_local_prequran_field_int('poolid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('match_score', 10, 0),
            xmldb_local_prequran_field_char('match_status', 40, 'suggested'),
            xmldb_local_prequran_field_char('assignment_status', 40, 'active'),
            xmldb_local_prequran_field_text('match_details'),
            xmldb_local_prequran_field_int('assignedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqgrmem_uix', XMLDB_KEY_UNIQUE, ['groupid', 'studentid']),
        ],
        [
            new xmldb_index('preqgrmem_student_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'assignment_status']),
            new xmldb_index('preqgrmem_pool_ix', XMLDB_INDEX_NOTUNIQUE, ['poolid', 'match_status']),
            new xmldb_index('preqgrmem_score_ix', XMLDB_INDEX_NOTUNIQUE, ['match_score', 'match_status']),
        ]
    );

    $sessiontable = new xmldb_table('local_prequran_live_session');
    xmldb_local_prequran_add_field_if_missing($dbman, $sessiontable, xmldb_local_prequran_field_int('groupid'));
    xmldb_local_prequran_add_index_if_missing($dbman, $sessiontable, new xmldb_index('preqlive_sess_group_ix', XMLDB_INDEX_NOTUNIQUE, ['groupid', 'scheduled_start']));

    $seriestable = new xmldb_table('local_prequran_live_series');
    xmldb_local_prequran_add_field_if_missing($dbman, $seriestable, xmldb_local_prequran_field_int('groupid'));
    xmldb_local_prequran_add_index_if_missing($dbman, $seriestable, new xmldb_index('preqlive_series_group_ix', XMLDB_INDEX_NOTUNIQUE, ['groupid', 'date_start']));
}

function xmldb_local_prequran_ensure_intake_request_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_intake_request'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('parent_name', 255),
            xmldb_local_prequran_field_char('parent_email', 255),
            xmldb_local_prequran_field_char('parent_phone', 100),
            xmldb_local_prequran_field_char('student_firstname', 100),
            xmldb_local_prequran_field_char('student_lastname', 100),
            xmldb_local_prequran_field_char('student_display_name', 255),
            xmldb_local_prequran_field_char('student_email', 255),
            xmldb_local_prequran_field_char('date_of_birth', 20),
            xmldb_local_prequran_field_int('age_years', 10, 0),
            xmldb_local_prequran_field_char('gender', 40),
            xmldb_local_prequran_field_char('country', 100),
            xmldb_local_prequran_field_char('city', 100),
            xmldb_local_prequran_field_char('timezone', 100, 'UTC'),
            xmldb_local_prequran_field_char('primary_language', 100),
            xmldb_local_prequran_field_text('other_languages'),
            xmldb_local_prequran_field_char('current_level', 100),
            xmldb_local_prequran_field_char('learning_base', 100),
            xmldb_local_prequran_field_text('availability_json'),
            xmldb_local_prequran_field_text('availability_summary'),
            xmldb_local_prequran_field_text('parent_preferences'),
            xmldb_local_prequran_field_int('live_class_consent', 1, 0),
            xmldb_local_prequran_field_int('recording_consent', 1, 0),
            xmldb_local_prequran_field_text('consent_notes'),
            xmldb_local_prequran_field_char('status', 40, 'new'),
            xmldb_local_prequran_field_int('matched_groupid'),
            xmldb_local_prequran_field_int('transferred_userid'),
            xmldb_local_prequran_field_int('transferred_profileid'),
            xmldb_local_prequran_field_text('admin_notes'),
            xmldb_local_prequran_field_int('reviewedby'),
            xmldb_local_prequran_field_int('reviewedat'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqintreq_status_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'timecreated']),
            new xmldb_index('preqintreq_parent_ix', XMLDB_INDEX_NOTUNIQUE, ['parent_email']),
            new xmldb_index('preqintreq_match_ix', XMLDB_INDEX_NOTUNIQUE, ['timezone', 'primary_language', 'current_level']),
            new xmldb_index('preqintreq_transfer_ix', XMLDB_INDEX_NOTUNIQUE, ['transferred_userid']),
        ]
    );
}
