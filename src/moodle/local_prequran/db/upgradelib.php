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

function xmldb_local_prequran_ensure_school_principal_role(): void {
    global $CFG, $DB;

    require_once($CFG->libdir . '/accesslib.php');

    $role = $DB->get_record('role', ['shortname' => 'school_principal'], 'id');
    if ($role) {
        $roleid = (int)$role->id;
    } else {
        $roleid = create_role(
            'School principal',
            'school_principal',
            'Academy operations role for course maintenance, live sessions, people dashboards, reports, and progress review. This role does not grant Moodle site administration.'
        );
    }

    if ($roleid <= 0) {
        return;
    }

    set_role_contextlevels($roleid, [CONTEXT_SYSTEM, CONTEXT_COURSECAT, CONTEXT_COURSE]);

    $systemcontext = context_system::instance();
    $capabilityexists = static function(string $capability) use ($DB): bool {
        return $DB->record_exists('capabilities', ['name' => $capability]);
    };
    $capabilities = [
        'moodle/course:create',
        'moodle/course:update',
        'moodle/course:view',
        'moodle/course:viewhiddencourses',
        'moodle/course:visibility',
        'moodle/course:manageactivities',
        'moodle/course:activityvisibility',
        'moodle/course:sectionvisibility',
        'moodle/course:movesections',
        'moodle/course:changecategory',
        'moodle/course:enrolreview',
        'moodle/user:viewdetails',
        'moodle/user:viewhiddendetails',
    ];

    foreach ($capabilities as $capability) {
        if (!$capabilityexists($capability)) {
            continue;
        }
        assign_capability($capability, CAP_ALLOW, $roleid, $systemcontext->id, true);
    }

    foreach (['moodle/site:config', 'moodle/site:doanything'] as $capability) {
        if (!$capabilityexists($capability)) {
            continue;
        }
        unassign_capability($capability, $roleid, $systemcontext->id);
    }
}

function xmldb_local_prequran_ensure_sqa_tester_role(): void {
    global $CFG, $DB;

    require_once($CFG->libdir . '/accesslib.php');

    $role = $DB->get_record('role', ['shortname' => 'sqa_tester'], 'id');
    if ($role) {
        $roleid = (int)$role->id;
    } else {
        $roleid = create_role(
            'SQA Tester',
            'sqa_tester',
            'Quality-assurance testing role for EduPlatform dashboards, reports, lesson checks, test evidence, and release verification. This role does not grant Moodle site administration.'
        );
    }

    if ($roleid <= 0) {
        return;
    }

    set_role_contextlevels($roleid, [CONTEXT_SYSTEM, CONTEXT_COURSECAT, CONTEXT_COURSE]);

    $systemcontext = context_system::instance();
    $capabilityexists = static function(string $capability) use ($DB): bool {
        return $DB->record_exists('capabilities', ['name' => $capability]);
    };
    $capabilities = [
        'moodle/course:view',
        'moodle/course:viewhiddencourses',
        'moodle/user:viewdetails',
        'moodle/user:viewhiddendetails',
        'moodle/site:viewreports',
        'moodle/grade:viewall',
        'report/log:view',
        'report/outline:view',
        'report/progress:view',
    ];

    foreach ($capabilities as $capability) {
        if (!$capabilityexists($capability)) {
            continue;
        }
        assign_capability($capability, CAP_ALLOW, $roleid, $systemcontext->id, true);
    }

    foreach ([
        'moodle/site:config',
        'moodle/site:doanything',
        'moodle/user:create',
        'moodle/user:delete',
        'moodle/user:update',
        'moodle/role:assign',
        'moodle/role:manage',
        'moodle/course:create',
        'moodle/course:delete',
    ] as $capability) {
        if (!$capabilityexists($capability)) {
            continue;
        }
        unassign_capability($capability, $roleid, $systemcontext->id);
    }
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
            xmldb_local_prequran_field_char('session_type', 40, 'teacher_led'),
            xmldb_local_prequran_field_int('teacher_required', 1, 1),
            xmldb_local_prequran_field_int('report_to_teacherid'),
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
            xmldb_local_prequran_field_text('agenda_slides_path'),
            xmldb_local_prequran_field_char('agenda_slides_filename', 255),
            xmldb_local_prequran_field_char('agenda_slides_mimetype', 120),
            xmldb_local_prequran_field_int('agenda_slides_size'),
            xmldb_local_prequran_field_int('agenda_slides_uploadedby'),
            xmldb_local_prequran_field_int('agenda_slides_uploadedat'),
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
            new xmldb_index('preqlive_sess_type_ix', XMLDB_INDEX_NOTUNIQUE, ['session_type', 'status', 'scheduled_start']),
            new xmldb_index('preqlive_sess_report_ix', XMLDB_INDEX_NOTUNIQUE, ['report_to_teacherid', 'scheduled_start']),
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

function xmldb_local_prequran_ensure_live_agenda_slide_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $table = new xmldb_table('local_prequran_live_session');
    xmldb_local_prequran_add_field_if_missing($dbman, $table, xmldb_local_prequran_field_text('agenda_slides_path'));
    xmldb_local_prequran_add_field_if_missing($dbman, $table, xmldb_local_prequran_field_char('agenda_slides_filename', 255));
    xmldb_local_prequran_add_field_if_missing($dbman, $table, xmldb_local_prequran_field_char('agenda_slides_mimetype', 120));
    xmldb_local_prequran_add_field_if_missing($dbman, $table, xmldb_local_prequran_field_int('agenda_slides_size'));
    xmldb_local_prequran_add_field_if_missing($dbman, $table, xmldb_local_prequran_field_int('agenda_slides_uploadedby'));
    xmldb_local_prequran_add_field_if_missing($dbman, $table, xmldb_local_prequran_field_int('agenda_slides_uploadedat'));
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
        if ($workspaceid > 0) {
            try {
                $DB->set_field_select($tablename, 'workspaceid', $workspaceid, 'workspaceid = ?', [0]);
            } catch (Throwable $e) {
                debugging('Could not backfill workspaceid for ' . $tablename . ': ' . $e->getMessage(), DEBUG_DEVELOPER);
            }
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

function xmldb_local_prequran_ensure_practice_coach_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_practice_coach_event'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('environment', 30, 'production'),
            xmldb_local_prequran_field_int('live_sessionid'),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_char('lessonid', 100),
            xmldb_local_prequran_field_char('unitid', 100),
            xmldb_local_prequran_field_char('step_id', 80),
            xmldb_local_prequran_field_char('event_type', 40),
            xmldb_local_prequran_field_char('trigger_key', 60),
            xmldb_local_prequran_field_char('template_key', 80),
            xmldb_local_prequran_field_text('message'),
            xmldb_local_prequran_field_text('base_message'),
            xmldb_local_prequran_field_char('message_source', 40, 'rule_based'),
            xmldb_local_prequran_field_char('ai_model', 80),
            xmldb_local_prequran_field_char('recommendation_key', 80),
            xmldb_local_prequran_field_text('recommendation_message'),
            xmldb_local_prequran_field_text('meta_json'),
            xmldb_local_prequran_field_char('coach_status', 40, 'delivered'),
            xmldb_local_prequran_field_int('timecreated'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqcoach_live_ix', XMLDB_INDEX_NOTUNIQUE, ['live_sessionid', 'userid', 'timecreated']),
            new xmldb_index('preqcoach_user_ix', XMLDB_INDEX_NOTUNIQUE, ['userid', 'timecreated']),
            new xmldb_index('preqcoach_trig_ix', XMLDB_INDEX_NOTUNIQUE, ['trigger_key', 'timecreated']),
            new xmldb_index('preqcoach_env_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'timecreated']),
            new xmldb_index('preqcoach_rec_ix', XMLDB_INDEX_NOTUNIQUE, ['recommendation_key', 'timecreated']),
        ]
    );
}

function xmldb_local_prequran_ensure_virtual_tutor_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_vt_session'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('environment', 30, 'production'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('parentid'),
            xmldb_local_prequran_field_int('teacherid'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_char('source_type', 60, 'teacher_live_session'),
            xmldb_local_prequran_field_char('lessonid', 100),
            xmldb_local_prequran_field_char('unitid', 100),
            xmldb_local_prequran_field_char('step_id', 80),
            xmldb_local_prequran_field_char('step_title', 255),
            xmldb_local_prequran_field_text('lesson_url'),
            xmldb_local_prequran_field_text('teacher_instructions'),
            xmldb_local_prequran_field_text('context_json'),
            xmldb_local_prequran_field_char('session_status', 40, 'active'),
            xmldb_local_prequran_field_char('ai_mode', 40, 'guided_rule_based'),
            xmldb_local_prequran_field_char('ai_model', 80),
            xmldb_local_prequran_field_text('summary'),
            xmldb_local_prequran_field_int('startedat'),
            xmldb_local_prequran_field_int('closedat'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqvt_s_student_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'session_status', 'timemodified']),
            new xmldb_index('preqvt_s_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['teacherid', 'timemodified']),
            new xmldb_index('preqvt_s_source_ix', XMLDB_INDEX_NOTUNIQUE, ['source_type', 'timemodified']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_vt_message'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('sessionid'),
            xmldb_local_prequran_field_int('senderid'),
            xmldb_local_prequran_field_char('sender_role', 40),
            xmldb_local_prequran_field_text('message'),
            xmldb_local_prequran_field_text('prompt_json'),
            xmldb_local_prequran_field_char('message_source', 60, 'user'),
            xmldb_local_prequran_field_char('safety_status', 40, 'ok'),
            xmldb_local_prequran_field_int('timecreated'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqvt_m_session_ix', XMLDB_INDEX_NOTUNIQUE, ['sessionid', 'timecreated']),
            new xmldb_index('preqvt_m_sender_ix', XMLDB_INDEX_NOTUNIQUE, ['senderid', 'timecreated']),
        ]
    );
}

function xmldb_local_prequran_ensure_workspace_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_workspace'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('name', 255),
            xmldb_local_prequran_field_char('slug', 120),
            xmldb_local_prequran_field_char('workspace_type', 40, 'academy_managed'),
            xmldb_local_prequran_field_int('ownerid'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_char('plan_code', 80, 'pilot'),
            xmldb_local_prequran_field_int('student_limit', 10, 0),
            xmldb_local_prequran_field_int('teacher_limit', 10, 0),
            xmldb_local_prequran_field_int('session_limit', 10, 0),
            xmldb_local_prequran_field_int('storage_limit_mb', 20, 0),
            xmldb_local_prequran_field_text('settingsjson'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqwork_slug_uix', XMLDB_KEY_UNIQUE, ['slug']),
        ],
        [
            new xmldb_index('preqwork_type_ix', XMLDB_INDEX_NOTUNIQUE, ['workspace_type', 'status']),
            new xmldb_index('preqwork_owner_ix', XMLDB_INDEX_NOTUNIQUE, ['ownerid', 'status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_workspace_member'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_char('workspace_role', 40, 'student'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqworkmem_user_uix', XMLDB_KEY_UNIQUE, ['workspaceid', 'userid', 'workspace_role']),
        ],
        [
            new xmldb_index('preqworkmem_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'workspace_role', 'status']),
            new xmldb_index('preqworkmem_user_ix', XMLDB_INDEX_NOTUNIQUE, ['userid', 'status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_workspace_material'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('title', 255),
            xmldb_local_prequran_field_char('material_type', 60, 'link'),
            xmldb_local_prequran_field_char('course_key', 120),
            xmldb_local_prequran_field_text('description'),
            xmldb_local_prequran_field_text('source_url'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_char('visibility', 40, 'workspace'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqworkmat_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqworkmat_course_ix', XMLDB_INDEX_NOTUNIQUE, ['course_key', 'visibility']),
            new xmldb_index('preqworkmat_type_ix', XMLDB_INDEX_NOTUNIQUE, ['material_type', 'status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_workspace_mat_assign'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('materialid'),
            xmldb_local_prequran_field_char('target_type', 40, 'student'),
            xmldb_local_prequran_field_int('targetid'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_char('workflow_status', 40, 'assigned'),
            xmldb_local_prequran_field_int('assignedby'),
            xmldb_local_prequran_field_int('startedat'),
            xmldb_local_prequran_field_int('completedat'),
            xmldb_local_prequran_field_int('reviewedby'),
            xmldb_local_prequran_field_int('reviewedat'),
            xmldb_local_prequran_field_text('review_notes'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqworkmatass_uix', XMLDB_KEY_UNIQUE, ['workspaceid', 'materialid', 'target_type', 'targetid']),
        ],
        [
            new xmldb_index('preqworkmatass_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'target_type', 'status']),
            new xmldb_index('preqworkmatass_mat_ix', XMLDB_INDEX_NOTUNIQUE, ['materialid', 'status']),
            new xmldb_index('preqworkmatass_target_ix', XMLDB_INDEX_NOTUNIQUE, ['targetid', 'target_type', 'status']),
            new xmldb_index('preqworkmatass_flow_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'workflow_status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_teacher_student'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('teacherid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('cohortid'),
            xmldb_local_prequran_field_char('status', 50, 'active'),
            xmldb_local_prequran_field_int('assignedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqtstu_teacher_student_uix', XMLDB_KEY_UNIQUE, ['workspaceid', 'teacherid', 'studentid']),
        ],
        [
            new xmldb_index('preqtstu_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['teacherid']),
            new xmldb_index('preqtstu_student_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid']),
            new xmldb_index('preqtstu_cohort_ix', XMLDB_INDEX_NOTUNIQUE, ['cohortid']),
            new xmldb_index('preqtstu_status_ix', XMLDB_INDEX_NOTUNIQUE, ['status']),
            new xmldb_index('preqtstu_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'teacherid', 'status']),
            new xmldb_index('preqtstu_workstu_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
        ]
    );

    $now = time();
    if (!$DB->record_exists('local_prequran_workspace', ['slug' => 'quraan-academy'])) {
        $workspaceid = (int)$DB->insert_record('local_prequran_workspace', (object)[
            'name' => 'Quraan Academy',
            'slug' => 'quraan-academy',
            'workspace_type' => 'academy_managed',
            'ownerid' => 0,
            'status' => 'active',
            'plan_code' => 'platform',
            'student_limit' => 0,
            'teacher_limit' => 0,
            'session_limit' => 0,
            'storage_limit_mb' => 0,
            'settingsjson' => json_encode(['default' => true], JSON_UNESCAPED_SLASHES),
            'createdby' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    } else {
        $workspaceid = (int)$DB->get_field('local_prequran_workspace', 'id', ['slug' => 'quraan-academy']);
    }

    $workspacefield = xmldb_local_prequran_field_int('workspaceid', 20, $workspaceid > 0 ? $workspaceid : 0);
    $workspacefields = [
        'local_prequran_student_profile' => [
            new xmldb_index('preqstudprof_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        ],
        'local_prequran_group_pool' => [
            new xmldb_index('preqgrpool_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        ],
        'local_prequran_class_group' => [
            new xmldb_index('preqclassgrp_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        ],
        'local_prequran_group_member' => [
            new xmldb_index('preqgrmem_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'assignment_status']),
        ],
        'local_prequran_teacher_student' => [
            new xmldb_index('preqtstu_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'teacherid', 'status']),
            new xmldb_index('preqtstu_workstu_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
        ],
        'local_prequran_live_session' => [
            new xmldb_index('preqlive_sess_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'scheduled_start']),
        ],
        'local_prequran_live_series' => [
            new xmldb_index('preqlive_ser_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'date_start']),
        ],
        'local_prequran_live_participant' => [
            new xmldb_index('preqlive_part_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid']),
        ],
        'local_prequran_live_attendance' => [
            new xmldb_index('preqlive_att_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid']),
        ],
        'local_prequran_live_note' => [
            new xmldb_index('preqlive_note_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid']),
        ],
        'local_prequran_live_recording' => [
            new xmldb_index('preqlive_rec_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        ],
        'local_prequran_live_consent' => [
            new xmldb_index('preqlive_cons_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'guardianid']),
        ],
        'local_prequran_intake_request' => [
            new xmldb_index('preqintreq_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        ],
    ];

    foreach ($workspacefields as $tablename => $indexes) {
        $table = new xmldb_table($tablename);
        if (!$dbman->table_exists($table)) {
            continue;
        }
        xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $workspacefield);
        foreach ($indexes as $index) {
            xmldb_local_prequran_add_index_if_missing($dbman, $table, $index);
        }
    }
}

function xmldb_local_prequran_repair_teacher_student_workspace_key(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $table = new xmldb_table('local_prequran_teacher_student');
    if (!$dbman->table_exists($table)) {
        return;
    }

    $workspacefield = new xmldb_field('workspaceid', XMLDB_TYPE_INTEGER, '20', null, XMLDB_NOTNULL, null, '0', 'id');
    if (!$dbman->field_exists($table, $workspacefield)) {
        $dbman->add_field($table, $workspacefield);
    }

    $legacyindex = new xmldb_index('preqtstu_teacher_student_uix', XMLDB_INDEX_UNIQUE, ['teacherid', 'studentid']);
    if ($dbman->index_exists($table, $legacyindex)) {
        $dbman->drop_index($table, $legacyindex);
    }

    $workspaceindex = new xmldb_index(
        'preqtstu_work_teacher_uix',
        XMLDB_INDEX_UNIQUE,
        ['workspaceid', 'teacherid', 'studentid']
    );
    if (!$dbman->index_exists($table, $workspaceindex)) {
        $dbman->add_index($table, $workspaceindex);
    }
}

function xmldb_local_prequran_ensure_consumer_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_consumer'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('slug', 120),
            xmldb_local_prequran_field_char('name', 255),
            xmldb_local_prequran_field_char('consumer_type', 40, 'platform_foundation'),
            xmldb_local_prequran_field_char('institution_type', 80),
            xmldb_local_prequran_field_char('faith_subcategory', 80),
            xmldb_local_prequran_field_char('teaching_method', 40, 'regular'),
            xmldb_local_prequran_field_char('operator_type', 40, 'private_entity'),
            xmldb_local_prequran_field_char('website_mode', 40, 'hosted'),
            xmldb_local_prequran_field_text('externalwebsiteurl'),
            xmldb_local_prequran_field_char('domainmanagement', 40, 'consumer_managed'),
            xmldb_local_prequran_field_char('portallabel', 120, 'Learning portal'),
            xmldb_local_prequran_field_char('brandingsource', 40, 'eduplatform_settings'),
            xmldb_local_prequran_field_char('intakelocation', 40, 'eduplatform'),
            xmldb_local_prequran_field_char('integrationmethod', 40, 'links'),
            xmldb_local_prequran_field_text('returnurl'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_int('primaryworkspaceid'),
            xmldb_local_prequran_field_int('owneruserid'),
            xmldb_local_prequran_field_char('supportemail', 255),
            xmldb_local_prequran_field_char('logourl', 255),
            xmldb_local_prequran_field_text('themejson'),
            xmldb_local_prequran_field_text('copyjson'),
            xmldb_local_prequran_field_char('defaultpublicpath', 255, '/'),
            xmldb_local_prequran_field_char('defaultdashboardpath', 255, '/local/hubredirect/dashboard.php'),
            xmldb_local_prequran_field_char('emailfromname', 255),
            xmldb_local_prequran_field_char('emailreplyto', 255),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqconsumer_slug_uix', XMLDB_KEY_UNIQUE, ['slug']),
        ],
        [
            new xmldb_index('preqconsumer_type_ix', XMLDB_INDEX_NOTUNIQUE, ['consumer_type', 'status']),
            new xmldb_index('preqconsumer_work_ix', XMLDB_INDEX_NOTUNIQUE, ['primaryworkspaceid', 'status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_consumer_domain'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('domain', 255),
            xmldb_local_prequran_field_char('domain_type', 40, 'public'),
            xmldb_local_prequran_field_int('isprimary', 1, 0),
            xmldb_local_prequran_field_char('sslstatus', 40, 'not_checked'),
            xmldb_local_prequran_field_char('verificationstatus', 40, 'seeded'),
            xmldb_local_prequran_field_int('verifiedat'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqconsdom_domain_uix', XMLDB_KEY_UNIQUE, ['domain']),
        ],
        [
            new xmldb_index('preqconsdom_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'status']),
            new xmldb_index('preqconsdom_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqconsdom_type_ix', XMLDB_INDEX_NOTUNIQUE, ['domain_type', 'status']),
        ]
    );

    xmldb_local_prequran_seed_consumer_record(
        'eduplatform',
        'EduPlatform',
        'platform_foundation',
        '',
        [
            ['eduplatform.ai', 'public', 1],
            ['www.eduplatform.ai', 'public', 0],
            ['app.eduplatform.ai', 'app', 0],
        ],
        [
            'supportemail' => 'support@eduplatform.ai',
            'emailfromname' => 'EduPlatform',
            'emailreplyto' => 'support@eduplatform.ai',
            'defaultpublicpath' => '/local/hubredirect/platform_landing.php',
            'defaultdashboardpath' => '/local/hubredirect/platform_dashboard.php',
            'themejson' => json_encode(['seeded' => true, 'brand' => 'foundation'], JSON_UNESCAPED_SLASHES),
            'copyjson' => json_encode(['seeded' => true, 'headline' => 'Shared learning operations platform'], JSON_UNESCAPED_SLASHES),
        ]
    );

    xmldb_local_prequran_seed_consumer_record(
        'quraan-academy',
        'Quraan Academy',
        'academy_consumer',
        'quraan-academy',
        [
            ['quraan.academy', 'public', 1],
            ['quraantest.academy', 'app', 0],
        ],
        [
            'supportemail' => 'support@quraan.academy',
            'emailfromname' => 'Quraan Academy',
            'emailreplyto' => 'support@quraan.academy',
            'defaultpublicpath' => '/local/ehelhome/index.php',
            'defaultdashboardpath' => '/local/hubredirect/dashboard.php',
        ]
    );

    xmldb_local_prequran_seed_consumer_record(
        'edu-for-tomorrow',
        'EduForTomorrow',
        'marketplace',
        '',
        [
            ['edufortomorrow.com', 'public', 1],
            ['www.edufortomorrow.com', 'public', 0],
            ['app.edufortomorrow.com', 'app', 0],
        ],
        [
            'supportemail' => 'support@edufortomorrow.com',
            'emailfromname' => 'EduForTomorrow',
            'emailreplyto' => 'support@edufortomorrow.com',
        ]
    );
}

function xmldb_local_prequran_ensure_organization_group_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_org_group'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('slug', 120),
            xmldb_local_prequran_field_char('name', 255),
            xmldb_local_prequran_field_char('group_type', 40, 'owned_group'),
            xmldb_local_prequran_field_int('parentconsumerid'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_text('policyjson'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqorggrp_slug_uix', XMLDB_KEY_UNIQUE, ['slug']),
        ],
        [
            new xmldb_index('preqorggrp_type_ix', XMLDB_INDEX_NOTUNIQUE, ['group_type', 'status']),
            new xmldb_index('preqorggrp_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['parentconsumerid', 'status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_org_group_member'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('groupid'),
            xmldb_local_prequran_field_char('member_type', 40, 'workspace'),
            xmldb_local_prequran_field_int('memberid'),
            xmldb_local_prequran_field_char('relationship_type', 40, 'owned_branch'),
            xmldb_local_prequran_field_char('group_role', 40, 'member'),
            xmldb_local_prequran_field_char('access_scope', 40, 'governance'),
            xmldb_local_prequran_field_int('inherit_sensitive_access', 1, 0),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqorgmem_member_uix', XMLDB_KEY_UNIQUE, ['groupid', 'member_type', 'memberid', 'group_role']),
        ],
        [
            new xmldb_index('preqorgmem_group_ix', XMLDB_INDEX_NOTUNIQUE, ['groupid', 'member_type', 'status']),
            new xmldb_index('preqorgmem_member_ix', XMLDB_INDEX_NOTUNIQUE, ['member_type', 'memberid', 'status']),
            new xmldb_index('preqorgmem_rel_ix', XMLDB_INDEX_NOTUNIQUE, ['relationship_type', 'access_scope', 'status']),
        ]
    );
}

function xmldb_local_prequran_repair_organization_group_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    if (!$dbman->table_exists(new xmldb_table('local_prequran_org_group'))) {
        $DB->execute(
            "CREATE TABLE IF NOT EXISTS {local_prequran_org_group} (
                id BIGINT(20) NOT NULL AUTO_INCREMENT,
                slug VARCHAR(120) NOT NULL DEFAULT '',
                name VARCHAR(255) NOT NULL DEFAULT '',
                group_type VARCHAR(40) NOT NULL DEFAULT 'owned_group',
                parentconsumerid BIGINT(20) NOT NULL DEFAULT 0,
                status VARCHAR(40) NOT NULL DEFAULT 'active',
                policyjson LONGTEXT NULL,
                createdby BIGINT(20) NOT NULL DEFAULT 0,
                timecreated BIGINT(20) NOT NULL DEFAULT 0,
                timemodified BIGINT(20) NOT NULL DEFAULT 0,
                PRIMARY KEY (id),
                UNIQUE KEY preqorggrp_slug_uix (slug),
                KEY preqorggrp_type_ix (group_type, status),
                KEY preqorggrp_cons_ix (parentconsumerid, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    }

    if (!$dbman->table_exists(new xmldb_table('local_prequran_org_group_member'))) {
        $DB->execute(
            "CREATE TABLE IF NOT EXISTS {local_prequran_org_group_member} (
                id BIGINT(20) NOT NULL AUTO_INCREMENT,
                groupid BIGINT(20) NOT NULL DEFAULT 0,
                member_type VARCHAR(40) NOT NULL DEFAULT 'workspace',
                memberid BIGINT(20) NOT NULL DEFAULT 0,
                relationship_type VARCHAR(40) NOT NULL DEFAULT 'owned_branch',
                group_role VARCHAR(40) NOT NULL DEFAULT 'member',
                access_scope VARCHAR(40) NOT NULL DEFAULT 'governance',
                inherit_sensitive_access TINYINT(1) NOT NULL DEFAULT 0,
                status VARCHAR(40) NOT NULL DEFAULT 'active',
                notes LONGTEXT NULL,
                createdby BIGINT(20) NOT NULL DEFAULT 0,
                timecreated BIGINT(20) NOT NULL DEFAULT 0,
                timemodified BIGINT(20) NOT NULL DEFAULT 0,
                PRIMARY KEY (id),
                UNIQUE KEY preqorgmem_member_uix (groupid, member_type, memberid, group_role),
                KEY preqorgmem_group_ix (groupid, member_type, status),
                KEY preqorgmem_member_ix (member_type, memberid, status),
                KEY preqorgmem_rel_ix (relationship_type, access_scope, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    }
}

function xmldb_local_prequran_seed_org_group_record(
    string $slug,
    string $name,
    string $grouptype,
    int $parentconsumerid,
    array $policy
): int {
    global $DB;

    if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_org_group'))) {
        return 0;
    }

    $now = time();
    $existing = $DB->get_record('local_prequran_org_group', ['slug' => $slug], '*', IGNORE_MISSING);
    $record = (object)[
        'slug' => $slug,
        'name' => $name,
        'group_type' => $grouptype,
        'parentconsumerid' => $parentconsumerid,
        'status' => 'active',
        'policyjson' => json_encode($policy, JSON_UNESCAPED_SLASHES),
        'createdby' => 0,
        'timemodified' => $now,
    ];

    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_org_group', $record);
        return (int)$existing->id;
    }

    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_org_group', $record);
}

function xmldb_local_prequran_seed_organization_operating_model(): void {
    global $DB;

    xmldb_local_prequran_repair_organization_group_schema();

    $quraanconsumerid = 0;
    $educonsumerid = 0;
    if ($DB->get_manager()->table_exists(new xmldb_table('local_prequran_consumer'))) {
        $quraanconsumerid = (int)$DB->get_field(
            'local_prequran_consumer',
            'id',
            ['slug' => 'quraan-academy'],
            IGNORE_MISSING
        );
        $educonsumerid = (int)$DB->get_field(
            'local_prequran_consumer',
            'id',
            ['slug' => 'edu-for-tomorrow'],
            IGNORE_MISSING
        );
    }

    xmldb_local_prequran_seed_org_group_record(
        'owned-schools',
        'Owned Schools',
        'owned_group',
        $quraanconsumerid,
        [
            'model' => 'wholly_owned_schools',
            'default_workspace_relationship' => 'owned_branch',
            'default_access_scope' => 'operations',
            'inherit_sensitive_access' => true,
            'description' => 'Schools fully owned and centrally operated by the parent institution.',
        ]
    );

    xmldb_local_prequran_seed_org_group_record(
        'franchise-schools',
        'Franchise Schools',
        'franchise_network',
        $educonsumerid,
        [
            'model' => 'independent_franchise_schools',
            'default_workspace_relationship' => 'franchise_member',
            'default_access_scope' => 'governance',
            'inherit_sensitive_access' => false,
            'description' => 'Independently operated schools that participate in a shared franchise network.',
        ]
    );
}

function xmldb_local_prequran_ensure_course_offering_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_course_offering'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('moodlecourseid'),
            xmldb_local_prequran_field_char('course_key', 120),
            xmldb_local_prequran_field_char('title', 255),
            xmldb_local_prequran_field_text('summary'),
            xmldb_local_prequran_field_text('syllabus'),
            xmldb_local_prequran_field_text('prerequisites'),
            xmldb_local_prequran_field_int('startdate'),
            xmldb_local_prequran_field_int('enddate'),
            xmldb_local_prequran_field_int('capacity', 10, 0),
            xmldb_local_prequran_field_char('tuition_amount', 40),
            xmldb_local_prequran_field_char('pricing_currency', 10, 'USD'),
            xmldb_local_prequran_field_char('registration_fee', 40),
            xmldb_local_prequran_field_char('materials_fee', 40),
            xmldb_local_prequran_field_int('installment_eligible', 1, 0),
            xmldb_local_prequran_field_int('scholarship_eligible', 1, 0),
            xmldb_local_prequran_field_char('tax_behavior', 80, 'not_configured'),
            xmldb_local_prequran_field_char('refund_policy_label', 120),
            xmldb_local_prequran_field_char('payment_required_timing', 80, 'workspace_policy'),
            xmldb_local_prequran_field_char('visibility', 40, 'workspace'),
            xmldb_local_prequran_field_char('approval_mode', 40, 'admin_approval'),
            xmldb_local_prequran_field_char('status', 40, 'draft'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqcoffer_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'startdate']),
            new xmldb_index('preqcoffer_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'status']),
            new xmldb_index('preqcoffer_course_ix', XMLDB_INDEX_NOTUNIQUE, ['moodlecourseid', 'course_key']),
            new xmldb_index('preqcoffer_price_ix', XMLDB_INDEX_NOTUNIQUE, ['pricing_currency', 'status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_course_enrol_req'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('offeringid'),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('requesterid'),
            xmldb_local_prequran_field_char('requester_role', 40, 'student'),
            xmldb_local_prequran_field_char('status', 40, 'pending'),
            xmldb_local_prequran_field_text('request_notes'),
            xmldb_local_prequran_field_text('admin_notes'),
            xmldb_local_prequran_field_int('approvedby'),
            xmldb_local_prequran_field_int('approvedat'),
            xmldb_local_prequran_field_int('moodleenrolledat'),
            xmldb_local_prequran_field_int('droppedby'),
            xmldb_local_prequran_field_int('droppedat'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqcoereq_student_uix', XMLDB_KEY_UNIQUE, ['offeringid', 'studentid']),
        ],
        [
            new xmldb_index('preqcoereq_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqcoereq_student_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'status']),
            new xmldb_index('preqcoereq_requester_ix', XMLDB_INDEX_NOTUNIQUE, ['requesterid', 'status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_course_audit'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('offeringid'),
            xmldb_local_prequran_field_int('requestid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('actorid'),
            xmldb_local_prequran_field_char('action', 80),
            xmldb_local_prequran_field_char('targettype', 80),
            xmldb_local_prequran_field_int('targetid'),
            xmldb_local_prequran_field_text('details'),
            xmldb_local_prequran_field_int('timecreated'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqcaud_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'timecreated']),
            new xmldb_index('preqcaud_offer_ix', XMLDB_INDEX_NOTUNIQUE, ['offeringid', 'timecreated']),
            new xmldb_index('preqcaud_req_ix', XMLDB_INDEX_NOTUNIQUE, ['requestid', 'timecreated']),
            new xmldb_index('preqcaud_student_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'timecreated']),
            new xmldb_index('preqcaud_action_ix', XMLDB_INDEX_NOTUNIQUE, ['action', 'timecreated']),
        ]
    );
}

function xmldb_local_prequran_ensure_admissions_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $intaketable = new xmldb_table('local_prequran_intake_request');
    if ($dbman->table_exists($intaketable)) {
        foreach ([
            xmldb_local_prequran_field_int('applicationid'),
            xmldb_local_prequran_field_char('admission_status', 40, 'inquiry'),
            xmldb_local_prequran_field_char('placement_status', 40, 'not_assessed'),
            xmldb_local_prequran_field_text('document_status_json'),
        ] as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $intaketable, $field);
        }
        xmldb_local_prequran_add_index_if_missing($dbman, $intaketable, new xmldb_index('preqintreq_adm_ix', XMLDB_INDEX_NOTUNIQUE, ['admission_status', 'placement_status']));
    }

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_admission_app'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('consumerid'),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('intakerequestid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('parentid'),
        xmldb_local_prequran_field_int('billingaccountid'),
        xmldb_local_prequran_field_int('offeringid'),
        xmldb_local_prequran_field_int('enrolrequestid'),
        xmldb_local_prequran_field_char('application_no', 80),
        xmldb_local_prequran_field_char('family_name', 255),
        xmldb_local_prequran_field_char('student_name', 255),
        xmldb_local_prequran_field_char('student_email', 255),
        xmldb_local_prequran_field_char('parent_name', 255),
        xmldb_local_prequran_field_char('parent_email', 255),
        xmldb_local_prequran_field_char('parent_phone', 100),
        xmldb_local_prequran_field_char('program_key', 120),
        xmldb_local_prequran_field_char('desired_start', 40),
        xmldb_local_prequran_field_char('application_status', 40, 'submitted'),
        xmldb_local_prequran_field_char('review_status', 40, 'pending'),
        xmldb_local_prequran_field_char('placement_status', 40, 'not_assessed'),
        xmldb_local_prequran_field_char('decision', 40, 'pending'),
        xmldb_local_prequran_field_int('decisionby'),
        xmldb_local_prequran_field_int('decisionat'),
        xmldb_local_prequran_field_text('family_profile_json'),
        xmldb_local_prequran_field_text('student_profile_json'),
        xmldb_local_prequran_field_text('placement_json'),
        xmldb_local_prequran_field_text('review_notes'),
        xmldb_local_prequran_field_text('decision_notes'),
        xmldb_local_prequran_field_text('conversion_json'),
        xmldb_local_prequran_field_int('convertedby'),
        xmldb_local_prequran_field_int('convertedat'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqadmapp_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'application_status', 'timecreated']),
        new xmldb_index('preqadmapp_intake_ix', XMLDB_INDEX_NOTUNIQUE, ['intakerequestid']),
        new xmldb_index('preqadmapp_student_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'application_status']),
        new xmldb_index('preqadmapp_decision_ix', XMLDB_INDEX_NOTUNIQUE, ['decision', 'decisionat']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_admission_doc'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('applicationid'),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_char('document_type', 80, 'other'),
        xmldb_local_prequran_field_char('document_label', 255),
        xmldb_local_prequran_field_char('filename', 255),
        xmldb_local_prequran_field_char('mimetype', 120),
        xmldb_local_prequran_field_int('filesize'),
        xmldb_local_prequran_field_text('filepath'),
        xmldb_local_prequran_field_char('status', 40, 'received'),
        xmldb_local_prequran_field_text('review_notes'),
        xmldb_local_prequran_field_int('uploadedby'),
        xmldb_local_prequran_field_int('reviewedby'),
        xmldb_local_prequran_field_int('reviewedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqadmdoc_app_ix', XMLDB_INDEX_NOTUNIQUE, ['applicationid', 'status']),
        new xmldb_index('preqadmdoc_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'document_type', 'status']),
    ]);
}

function xmldb_local_prequran_ensure_academic_calendar_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_acad_term'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('consumerid'),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('term_code', 80),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_char('term_type', 40, 'term'),
        xmldb_local_prequran_field_int('startdate'),
        xmldb_local_prequran_field_int('enddate'),
        xmldb_local_prequran_field_int('enrollment_open'),
        xmldb_local_prequran_field_int('enrollment_close'),
        xmldb_local_prequran_field_int('add_drop_deadline'),
        xmldb_local_prequran_field_int('withdrawal_deadline'),
        xmldb_local_prequran_field_int('refund_deadline'),
        xmldb_local_prequran_field_char('status', 40, 'planned'),
        xmldb_local_prequran_field_text('notes'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqterm_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'startdate']),
        new xmldb_index('preqterm_code_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'term_code']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_acad_event'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('termid'),
        xmldb_local_prequran_field_char('event_type', 60, 'holiday'),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_int('startdate'),
        xmldb_local_prequran_field_int('enddate'),
        xmldb_local_prequran_field_int('blackout', 1, 0),
        xmldb_local_prequran_field_text('notes'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqevent_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'event_type', 'startdate']),
        new xmldb_index('preqevent_term_ix', XMLDB_INDEX_NOTUNIQUE, ['termid', 'status']),
    ]);

    $offeringtable = new xmldb_table('local_prequran_course_offering');
    if ($dbman->table_exists($offeringtable)) {
        foreach ([
            xmldb_local_prequran_field_int('termid'),
            xmldb_local_prequran_field_text('schedule_json'),
            xmldb_local_prequran_field_int('add_drop_deadline'),
            xmldb_local_prequran_field_int('withdrawal_deadline'),
            xmldb_local_prequran_field_int('refund_deadline'),
        ] as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $offeringtable, $field);
        }
        xmldb_local_prequran_add_index_if_missing($dbman, $offeringtable, new xmldb_index('preqcoffer_term_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'termid', 'status']));
    }
}

function xmldb_local_prequran_ensure_attendance_operations_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $attendancetable = new xmldb_table('local_prequran_live_attendance');
    if ($dbman->table_exists($attendancetable)) {
        foreach ([
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('termid'),
            xmldb_local_prequran_field_int('offeringid'),
            xmldb_local_prequran_field_int('minutes_late'),
            xmldb_local_prequran_field_int('excused', 1, 0),
            xmldb_local_prequran_field_int('makeup_required', 1, 0),
            xmldb_local_prequran_field_int('makeup_sessionid'),
            xmldb_local_prequran_field_char('standing_action', 80),
            xmldb_local_prequran_field_char('finance_hold_action', 80),
        ] as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $attendancetable, $field);
        }
        xmldb_local_prequran_add_index_if_missing($dbman, $attendancetable, new xmldb_index('preqlive_att_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'attendance_status']));
        xmldb_local_prequran_add_index_if_missing($dbman, $attendancetable, new xmldb_index('preqlive_att_term_ix', XMLDB_INDEX_NOTUNIQUE, ['termid', 'offeringid']));
    }

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_att_rule'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('termid'),
        xmldb_local_prequran_field_int('offeringid'),
        xmldb_local_prequran_field_char('rule_name', 120),
        xmldb_local_prequran_field_int('late_after_minutes', 10, 10),
        xmldb_local_prequran_field_int('absence_warning_count', 10, 3),
        xmldb_local_prequran_field_int('absence_hold_count', 10, 5),
        xmldb_local_prequran_field_int('makeup_required_after_absent', 1, 1),
        xmldb_local_prequran_field_int('excused_counts_present', 1, 0),
        xmldb_local_prequran_field_char('finance_hold_behavior', 80, 'warning_only'),
        xmldb_local_prequran_field_char('academic_standing_behavior', 80, 'warning_only'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_text('notes'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqattrule_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqattrule_scope_ix', XMLDB_INDEX_NOTUNIQUE, ['termid', 'offeringid']),
    ]);
}

function xmldb_local_prequran_ensure_gradebook_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_grade_category'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('offeringid'),
        xmldb_local_prequran_field_char('category_key', 80),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_char('weight_percent', 40, '0'),
        xmldb_local_prequran_field_char('drop_lowest_count', 10, '0'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqgrcat_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqgrcat_offer_ix', XMLDB_INDEX_NOTUNIQUE, ['offeringid', 'category_key']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_assessment'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('offeringid'),
        xmldb_local_prequran_field_int('categoryid'),
        xmldb_local_prequran_field_char('assessment_type', 60, 'assignment'),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_text('description'),
        xmldb_local_prequran_field_char('max_points', 40, '100'),
        xmldb_local_prequran_field_char('weight_override', 40),
        xmldb_local_prequran_field_int('duedate'),
        xmldb_local_prequran_field_int('publishdate'),
        xmldb_local_prequran_field_char('status', 40, 'draft'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqassess_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'duedate']),
        new xmldb_index('preqassess_offer_ix', XMLDB_INDEX_NOTUNIQUE, ['offeringid', 'assessment_type']),
        new xmldb_index('preqassess_cat_ix', XMLDB_INDEX_NOTUNIQUE, ['categoryid', 'status']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_grade'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('offeringid'),
        xmldb_local_prequran_field_int('assessmentid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_char('score_points', 40),
        xmldb_local_prequran_field_char('score_percent', 40),
        xmldb_local_prequran_field_char('letter_grade', 10),
        xmldb_local_prequran_field_char('status', 40, 'draft'),
        xmldb_local_prequran_field_text('teacher_feedback'),
        xmldb_local_prequran_field_text('rubric_json'),
        xmldb_local_prequran_field_int('gradedby'),
        xmldb_local_prequran_field_int('gradedat'),
        xmldb_local_prequran_field_int('reviewedby'),
        xmldb_local_prequran_field_int('reviewedat'),
        xmldb_local_prequran_field_int('publishedby'),
        xmldb_local_prequran_field_int('publishedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqgrade_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
        new xmldb_index('preqgrade_assess_ix', XMLDB_INDEX_NOTUNIQUE, ['assessmentid', 'studentid']),
        new xmldb_index('preqgrade_offer_ix', XMLDB_INDEX_NOTUNIQUE, ['offeringid', 'status']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_course_grade'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('offeringid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_char('final_percent', 40),
        xmldb_local_prequran_field_char('letter_grade', 10),
        xmldb_local_prequran_field_char('status', 40, 'draft'),
        xmldb_local_prequran_field_text('calculation_json'),
        xmldb_local_prequran_field_int('calculatedat'),
        xmldb_local_prequran_field_int('publishedby'),
        xmldb_local_prequran_field_int('publishedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqcgrade_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
        new xmldb_index('preqcgrade_offer_ix', XMLDB_INDEX_NOTUNIQUE, ['offeringid', 'studentid']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_grade_dispute'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('gradeid'),
        xmldb_local_prequran_field_int('coursegradeid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('requesterid'),
        xmldb_local_prequran_field_char('status', 40, 'open'),
        xmldb_local_prequran_field_text('reason'),
        xmldb_local_prequran_field_text('resolution'),
        xmldb_local_prequran_field_int('resolvedby'),
        xmldb_local_prequran_field_int('resolvedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqgdisp_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqgdisp_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'timecreated']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_grade_audit'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('offeringid'),
        xmldb_local_prequran_field_int('assessmentid'),
        xmldb_local_prequran_field_int('gradeid'),
        xmldb_local_prequran_field_int('coursegradeid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('actorid'),
        xmldb_local_prequran_field_char('action', 80),
        xmldb_local_prequran_field_text('oldvaluejson'),
        xmldb_local_prequran_field_text('newvaluejson'),
        xmldb_local_prequran_field_text('reason'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqgaud_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'timecreated']),
        new xmldb_index('preqgaud_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'timecreated']),
        new xmldb_index('preqgaud_action_ix', XMLDB_INDEX_NOTUNIQUE, ['action', 'timecreated']),
    ]);
}

function xmldb_local_prequran_ensure_homework_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_homework'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('consumerid'),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('moodlecourseid'),
        xmldb_local_prequran_field_int('offeringid'),
        xmldb_local_prequran_field_int('assessmentid'),
        xmldb_local_prequran_field_int('resourcematerialid'),
        xmldb_local_prequran_field_char('target_type', 40, 'individual'),
        xmldb_local_prequran_field_int('targetid'),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_text('instructions'),
        xmldb_local_prequran_field_int('duedate'),
        xmldb_local_prequran_field_char('maxpoints', 40, '100'),
        xmldb_local_prequran_field_int('allowresubmit', 1, 1),
        xmldb_local_prequran_field_char('status', 40, 'published'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqhome_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'duedate']),
        new xmldb_index('preqhome_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'workspaceid']),
        new xmldb_index('preqhome_course_ix', XMLDB_INDEX_NOTUNIQUE, ['moodlecourseid', 'status']),
        new xmldb_index('preqhome_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['createdby', 'status']),
        new xmldb_index('preqhome_target_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'target_type', 'targetid']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_homework_sub'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('homeworkid'),
        xmldb_local_prequran_field_int('consumerid'),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_char('status', 40, 'assigned'),
        xmldb_local_prequran_field_int('attemptnumber', 10, 0),
        xmldb_local_prequran_field_text('response_text'),
        xmldb_local_prequran_field_int('materialid'),
        xmldb_local_prequran_field_int('startedat'),
        xmldb_local_prequran_field_int('submittedat'),
        xmldb_local_prequran_field_char('scorepoints', 40),
        xmldb_local_prequran_field_char('scorepercent', 40),
        xmldb_local_prequran_field_text('feedback'),
        xmldb_local_prequran_field_int('gradedby'),
        xmldb_local_prequran_field_int('gradedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [
        new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        new xmldb_key('preqhomesub_home_stud_uix', XMLDB_KEY_UNIQUE, ['homeworkid', 'studentid']),
    ], [
        new xmldb_index('preqhomesub_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqhomesub_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'status']),
        new xmldb_index('preqhomesub_home_ix', XMLDB_INDEX_NOTUNIQUE, ['homeworkid', 'status']),
    ]);
}

function xmldb_local_prequran_ensure_learning_path_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_skill'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('skill_key', 120),
        xmldb_local_prequran_field_char('domain', 80, 'quran'),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_text('description'),
        xmldb_local_prequran_field_char('level_band', 80),
        xmldb_local_prequran_field_char('prerequisite_keys', 255),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_int('sortorder', 10, 0),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqskill_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'domain', 'status']),
        new xmldb_index('preqskill_key_ix', XMLDB_INDEX_NOTUNIQUE, ['skill_key']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_skill_mastery'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('skillid'),
        xmldb_local_prequran_field_char('mastery_status', 40, 'introduced'),
        xmldb_local_prequran_field_char('mastery_percent', 40, '0'),
        xmldb_local_prequran_field_text('evidence_json'),
        xmldb_local_prequran_field_text('teacher_comment'),
        xmldb_local_prequran_field_int('assessedby'),
        xmldb_local_prequran_field_int('assessedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqmaster_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'mastery_status']),
        new xmldb_index('preqmaster_skill_ix', XMLDB_INDEX_NOTUNIQUE, ['skillid', 'studentid']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_adv_rule'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('from_level', 80),
        xmldb_local_prequran_field_char('to_level', 80),
        xmldb_local_prequran_field_char('required_mastery_percent', 40, '80'),
        xmldb_local_prequran_field_char('required_attendance_percent', 40, '70'),
        xmldb_local_prequran_field_char('required_grade_percent', 40, '70'),
        xmldb_local_prequran_field_char('recommended_course_key', 120),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_text('notes'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqadvrule_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqadvrule_level_ix', XMLDB_INDEX_NOTUNIQUE, ['from_level', 'to_level']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_student_path'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_char('current_level', 80),
        xmldb_local_prequran_field_char('placement_level', 80),
        xmldb_local_prequran_field_char('advancement_status', 40, 'on_track'),
        xmldb_local_prequran_field_char('recommended_course_key', 120),
        xmldb_local_prequran_field_text('recommendation_reason'),
        xmldb_local_prequran_field_text('teacher_comment'),
        xmldb_local_prequran_field_int('reviewedby'),
        xmldb_local_prequran_field_int('reviewedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqpath_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid']),
        new xmldb_index('preqpath_level_ix', XMLDB_INDEX_NOTUNIQUE, ['current_level', 'advancement_status']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_intervention'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('teacherid'),
        xmldb_local_prequran_field_char('plan_type', 80, 'learning_support'),
        xmldb_local_prequran_field_char('status', 40, 'open'),
        xmldb_local_prequran_field_char('priority', 40, 'normal'),
        xmldb_local_prequran_field_text('concern'),
        xmldb_local_prequran_field_text('goal'),
        xmldb_local_prequran_field_text('actions'),
        xmldb_local_prequran_field_int('duedate'),
        xmldb_local_prequran_field_text('resolution'),
        xmldb_local_prequran_field_int('resolvedby'),
        xmldb_local_prequran_field_int('resolvedat'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqintv_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
        new xmldb_index('preqintv_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['teacherid', 'status']),
    ]);
}

function xmldb_local_prequran_ensure_operations_layer_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    $sessiontable = new xmldb_table('local_prequran_live_session');
    if ($dbman->table_exists($sessiontable)) {
        foreach ([
            xmldb_local_prequran_field_char('room_provider', 40, 'bbb'),
            xmldb_local_prequran_field_text('room_url'),
            xmldb_local_prequran_field_int('substitute_teacherid'),
            xmldb_local_prequran_field_char('reschedule_status', 40, 'none'),
            xmldb_local_prequran_field_int('rescheduled_from'),
            xmldb_local_prequran_field_int('reminder_offset_minutes', 10, 60),
            xmldb_local_prequran_field_int('reminder_queuedat'),
            xmldb_local_prequran_field_int('reminder_sentat'),
            xmldb_local_prequran_field_text('parent_visibility_json'),
        ] as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $sessiontable, $field);
        }
        xmldb_local_prequran_add_index_if_missing($dbman, $sessiontable, new xmldb_index('preqlive_sess_sub_ix', XMLDB_INDEX_NOTUNIQUE, ['substitute_teacherid', 'scheduled_start']));
        xmldb_local_prequran_add_index_if_missing($dbman, $sessiontable, new xmldb_index('preqlive_sess_rem_ix', XMLDB_INDEX_NOTUNIQUE, ['reminder_sentat', 'scheduled_start']));
    }

    $payouttable = new xmldb_table('local_prequran_market_payout');
    if ($dbman->table_exists($payouttable)) {
        foreach ([
            xmldb_local_prequran_field_int('contractid'),
            xmldb_local_prequran_field_char('readiness_status', 40, 'ready_for_review'),
            xmldb_local_prequran_field_text('readiness_json'),
        ] as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $payouttable, $field);
        }
        xmldb_local_prequran_add_index_if_missing($dbman, $payouttable, new xmldb_index('preqmpout_ready_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'readiness_status', 'status']));
    }

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_teacher_contract'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('teacherid'),
        xmldb_local_prequran_field_char('contract_type', 80, 'hourly'),
        xmldb_local_prequran_field_char('currency', 10, 'USD'),
        xmldb_local_prequran_field_char('hourly_rate', 40, '0.00'),
        xmldb_local_prequran_field_char('session_rate', 40, '0.00'),
        xmldb_local_prequran_field_char('marketplace_rate', 40, '0.00'),
        xmldb_local_prequran_field_int('effective_start'),
        xmldb_local_prequran_field_int('effective_end'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_text('terms_json'),
        xmldb_local_prequran_field_int('approvedby'),
        xmldb_local_prequran_field_int('approvedat'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqtcont_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'teacherid', 'status']),
        new xmldb_index('preqtcont_eff_ix', XMLDB_INDEX_NOTUNIQUE, ['effective_start', 'effective_end']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_teacher_load'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('teacherid'),
        xmldb_local_prequran_field_int('active_students', 10, 0),
        xmldb_local_prequran_field_int('weekly_sessions', 10, 0),
        xmldb_local_prequran_field_int('weekly_minutes', 10, 0),
        xmldb_local_prequran_field_char('load_status', 40, 'normal'),
        xmldb_local_prequran_field_text('notes'),
        xmldb_local_prequran_field_int('calculatedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqtload_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'teacherid', 'calculatedat']),
        new xmldb_index('preqtload_status_ix', XMLDB_INDEX_NOTUNIQUE, ['load_status', 'calculatedat']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_sub_request'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('sessionid'),
        xmldb_local_prequran_field_int('original_teacherid'),
        xmldb_local_prequran_field_int('substitute_teacherid'),
        xmldb_local_prequran_field_char('status', 40, 'requested'),
        xmldb_local_prequran_field_text('reason'),
        xmldb_local_prequran_field_text('handoff_notes'),
        xmldb_local_prequran_field_int('requestedby'),
        xmldb_local_prequran_field_int('approvedby'),
        xmldb_local_prequran_field_int('approvedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqsubreq_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqsubreq_sess_ix', XMLDB_INDEX_NOTUNIQUE, ['sessionid', 'status']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_live_reminder'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('sessionid'),
        xmldb_local_prequran_field_int('recipientid'),
        xmldb_local_prequran_field_char('recipient_role', 40, 'student'),
        xmldb_local_prequran_field_char('channel', 40, 'email'),
        xmldb_local_prequran_field_int('sendat'),
        xmldb_local_prequran_field_char('status', 40, 'queued'),
        xmldb_local_prequran_field_text('payloadjson'),
        xmldb_local_prequran_field_int('sentat'),
        xmldb_local_prequran_field_text('error'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqlrem_sess_ix', XMLDB_INDEX_NOTUNIQUE, ['sessionid', 'status']),
        new xmldb_index('preqlrem_send_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'sendat', 'status']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_comm_thread'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_char('type', 40, 'parent_teacher'),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('cohortid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('caseid'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_char('subject', 255),
        xmldb_local_prequran_field_int('lastmessageat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqcommthr_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'type', 'status']),
        new xmldb_index('preqcommthr_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'lastmessageat']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_comm_participant'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('threadid'),
        xmldb_local_prequran_field_int('userid'),
        xmldb_local_prequran_field_char('role', 40, 'participant'),
        xmldb_local_prequran_field_int('canreply', 1, 1),
        xmldb_local_prequran_field_int('lastreadmessageid'),
        xmldb_local_prequran_field_int('muted', 1, 0),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqcommpart_thread_ix', XMLDB_INDEX_NOTUNIQUE, ['threadid', 'userid']),
        new xmldb_index('preqcommpart_user_ix', XMLDB_INDEX_NOTUNIQUE, ['userid', 'muted']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_comm_message'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('threadid'),
        xmldb_local_prequran_field_int('senderid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_char('messagekind', 40, 'text'),
        xmldb_local_prequran_field_text('body'),
        xmldb_local_prequran_field_char('templatekey', 120),
        xmldb_local_prequran_field_char('status', 40, 'visible'),
        xmldb_local_prequran_field_text('moderationflags'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqcommmsg_thread_ix', XMLDB_INDEX_NOTUNIQUE, ['threadid', 'status']),
        new xmldb_index('preqcommmsg_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'timecreated']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_comm_audit'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('threadid'),
        xmldb_local_prequran_field_int('messageid'),
        xmldb_local_prequran_field_int('actorid'),
        xmldb_local_prequran_field_char('action', 80),
        xmldb_local_prequran_field_text('details'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqcommaud_thread_ix', XMLDB_INDEX_NOTUNIQUE, ['threadid', 'timecreated']),
        new xmldb_index('preqcommaud_actor_ix', XMLDB_INDEX_NOTUNIQUE, ['actorid', 'timecreated']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_comm_template'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('templatekey', 120),
        xmldb_local_prequran_field_char('channel', 40, 'email'),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_char('subject', 255),
        xmldb_local_prequran_field_text('body'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqctpl_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'channel', 'status']),
        new xmldb_index('preqctpl_key_ix', XMLDB_INDEX_NOTUNIQUE, ['templatekey']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_comm_campaign'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('campaign_type', 60, 'announcement'),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_char('channel', 40, 'email'),
        xmldb_local_prequran_field_int('templateid'),
        xmldb_local_prequran_field_char('audience', 80, 'parents'),
        xmldb_local_prequran_field_char('status', 40, 'draft'),
        xmldb_local_prequran_field_int('scheduledat'),
        xmldb_local_prequran_field_int('sentat'),
        xmldb_local_prequran_field_text('messagebody'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqccamp_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'scheduledat']),
        new xmldb_index('preqccamp_channel_ix', XMLDB_INDEX_NOTUNIQUE, ['channel', 'audience']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_comm_delivery'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('campaignid'),
        xmldb_local_prequran_field_int('threadid'),
        xmldb_local_prequran_field_int('messageid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('recipientid'),
        xmldb_local_prequran_field_char('channel', 40, 'email'),
        xmldb_local_prequran_field_char('recipient_address', 255),
        xmldb_local_prequran_field_char('status', 40, 'queued'),
        xmldb_local_prequran_field_text('provider_response'),
        xmldb_local_prequran_field_int('sentat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqcdel_campaign_ix', XMLDB_INDEX_NOTUNIQUE, ['campaignid', 'status']),
        new xmldb_index('preqcdel_rec_ix', XMLDB_INDEX_NOTUNIQUE, ['recipientid', 'channel', 'status']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_comm_consent'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('guardianid'),
        xmldb_local_prequran_field_char('channel', 40, 'email'),
        xmldb_local_prequran_field_int('consented', 1, 1),
        xmldb_local_prequran_field_char('source', 80, 'manual'),
        xmldb_local_prequran_field_text('notes'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqccons_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'channel']),
        new xmldb_index('preqccons_guard_ix', XMLDB_INDEX_NOTUNIQUE, ['guardianid', 'channel', 'consented']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_comm_case'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_char('case_type', 80, 'general'),
        xmldb_local_prequran_field_char('priority', 40, 'normal'),
        xmldb_local_prequran_field_char('status', 40, 'open'),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_text('summary'),
        xmldb_local_prequran_field_int('ownerid'),
        xmldb_local_prequran_field_int('openedby'),
        xmldb_local_prequran_field_int('closedby'),
        xmldb_local_prequran_field_int('closedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqccase_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
        new xmldb_index('preqccase_owner_ix', XMLDB_INDEX_NOTUNIQUE, ['ownerid', 'status']),
    ]);
}

function xmldb_local_prequran_ensure_admin_document_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_work_task'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('queue', 60, 'support'),
        xmldb_local_prequran_field_char('tasktype', 80, 'general'),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_text('description'),
        xmldb_local_prequran_field_char('status', 40, 'open'),
        xmldb_local_prequran_field_char('priority', 40, 'normal'),
        xmldb_local_prequran_field_int('assignedto'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_char('targettype', 80),
        xmldb_local_prequran_field_int('targetid'),
        xmldb_local_prequran_field_int('duedate'),
        xmldb_local_prequran_field_int('escalated', 1, 0),
        xmldb_local_prequran_field_int('escalatedto'),
        xmldb_local_prequran_field_text('approval_json'),
        xmldb_local_prequran_field_int('approvedby'),
        xmldb_local_prequran_field_int('approvedat'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('closedby'),
        xmldb_local_prequran_field_int('closedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqwtask_queue_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'queue', 'status']),
        new xmldb_index('preqwtask_assignee_ix', XMLDB_INDEX_NOTUNIQUE, ['assignedto', 'status', 'duedate']),
        new xmldb_index('preqwtask_student_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'status']),
        new xmldb_index('preqwtask_target_ix', XMLDB_INDEX_NOTUNIQUE, ['targettype', 'targetid']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_work_note'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('taskid'),
        xmldb_local_prequran_field_int('authorid'),
        xmldb_local_prequran_field_char('visibility', 40, 'internal'),
        xmldb_local_prequran_field_text('note'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqwtnote_task_ix', XMLDB_INDEX_NOTUNIQUE, ['taskid', 'timecreated']),
        new xmldb_index('preqwtnote_author_ix', XMLDB_INDEX_NOTUNIQUE, ['authorid', 'timecreated']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_work_audit'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('taskid'),
        xmldb_local_prequran_field_int('actorid'),
        xmldb_local_prequran_field_char('action', 80),
        xmldb_local_prequran_field_text('oldvaluejson'),
        xmldb_local_prequran_field_text('newvaluejson'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqwtaud_task_ix', XMLDB_INDEX_NOTUNIQUE, ['taskid', 'timecreated']),
        new xmldb_index('preqwtaud_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'timecreated']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_document'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('ownerid'),
        xmldb_local_prequran_field_char('document_type', 80, 'other'),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_char('document_number', 120),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_char('verification_status', 40, 'pending'),
        xmldb_local_prequran_field_int('verifiedby'),
        xmldb_local_prequran_field_int('verifiedat'),
        xmldb_local_prequran_field_int('issuedat'),
        xmldb_local_prequran_field_int('expiresat'),
        xmldb_local_prequran_field_char('filename', 255),
        xmldb_local_prequran_field_char('mimetype', 120),
        xmldb_local_prequran_field_int('filesize'),
        xmldb_local_prequran_field_char('contenthash', 80),
        xmldb_local_prequran_field_char('source_type', 80, 'upload'),
        xmldb_local_prequran_field_int('source_id'),
        xmldb_local_prequran_field_text('metadatajson'),
        xmldb_local_prequran_field_int('uploadedby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqdoc_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'document_type', 'status']),
        new xmldb_index('preqdoc_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'verification_status']),
        new xmldb_index('preqdoc_exp_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'expiresat', 'status']),
        new xmldb_index('preqdoc_source_ix', XMLDB_INDEX_NOTUNIQUE, ['source_type', 'source_id']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_document_audit'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('documentid'),
        xmldb_local_prequran_field_int('actorid'),
        xmldb_local_prequran_field_char('action', 80),
        xmldb_local_prequran_field_text('detailsjson'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqdocaud_doc_ix', XMLDB_INDEX_NOTUNIQUE, ['documentid', 'timecreated']),
        new xmldb_index('preqdocaud_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'timecreated']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_generated_doc'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('documentid'),
        xmldb_local_prequran_field_char('doc_type', 80, 'certificate'),
        xmldb_local_prequran_field_char('source_type', 80),
        xmldb_local_prequran_field_int('source_id'),
        xmldb_local_prequran_field_char('document_key', 160),
        xmldb_local_prequran_field_char('status', 40, 'draft'),
        xmldb_local_prequran_field_text('payloadjson'),
        xmldb_local_prequran_field_char('pdfhash', 80),
        xmldb_local_prequran_field_char('download_url', 255),
        xmldb_local_prequran_field_int('generatedby'),
        xmldb_local_prequran_field_int('generatedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqgendoc_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'doc_type', 'status']),
        new xmldb_index('preqgendoc_doc_ix', XMLDB_INDEX_NOTUNIQUE, ['documentid']),
        new xmldb_index('preqgendoc_source_ix', XMLDB_INDEX_NOTUNIQUE, ['source_type', 'source_id']),
    ]);
}

function xmldb_local_prequran_ensure_roles_portal_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_role_cap'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('rolekey', 80),
        xmldb_local_prequran_field_char('capability', 120),
        xmldb_local_prequran_field_int('allowed', 1, 1),
        xmldb_local_prequran_field_char('scope', 80, 'workspace'),
        xmldb_local_prequran_field_text('conditionsjson'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqrolecap_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'rolekey', 'allowed']),
        new xmldb_index('preqrolecap_cap_ix', XMLDB_INDEX_NOTUNIQUE, ['capability', 'scope']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_support_grant'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('supportuserid'),
        xmldb_local_prequran_field_int('targetuserid'),
        xmldb_local_prequran_field_char('grant_type', 80, 'support_impersonation'),
        xmldb_local_prequran_field_char('status', 40, 'pending'),
        xmldb_local_prequran_field_text('reason'),
        xmldb_local_prequran_field_int('approvedby'),
        xmldb_local_prequran_field_int('approvedat'),
        xmldb_local_prequran_field_int('expiresat'),
        xmldb_local_prequran_field_int('revokedby'),
        xmldb_local_prequran_field_int('revokedat'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqsgrant_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'expiresat']),
        new xmldb_index('preqsgrant_sup_ix', XMLDB_INDEX_NOTUNIQUE, ['supportuserid', 'targetuserid']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_support_session'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('grantid'),
        xmldb_local_prequran_field_int('supportuserid'),
        xmldb_local_prequran_field_int('targetuserid'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_text('reason'),
        xmldb_local_prequran_field_text('entry_contextjson'),
        xmldb_local_prequran_field_int('startedat'),
        xmldb_local_prequran_field_int('endedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqssess_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'startedat']),
        new xmldb_index('preqssess_user_ix', XMLDB_INDEX_NOTUNIQUE, ['supportuserid', 'targetuserid']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_tenant_audit'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('userid'),
        xmldb_local_prequran_field_char('check_key', 120),
        xmldb_local_prequran_field_char('status', 40, 'pass'),
        xmldb_local_prequran_field_char('targettype', 80),
        xmldb_local_prequran_field_int('targetid'),
        xmldb_local_prequran_field_text('detailsjson'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqtenaud_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'timecreated']),
        new xmldb_index('preqtenaud_user_ix', XMLDB_INDEX_NOTUNIQUE, ['userid', 'check_key']),
        new xmldb_index('preqtenaud_target_ix', XMLDB_INDEX_NOTUNIQUE, ['targettype', 'targetid']),
    ]);
}

function xmldb_local_prequran_ensure_governance_analytics_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_retention_rule'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('data_domain', 80, 'student_records'),
        xmldb_local_prequran_field_char('record_type', 120, 'general'),
        xmldb_local_prequran_field_int('retention_days', 10, 2555),
        xmldb_local_prequran_field_char('disposition', 60, 'review'),
        xmldb_local_prequran_field_int('legal_hold', 1, 0),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_text('policyjson'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqretrule_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqretrule_domain_ix', XMLDB_INDEX_NOTUNIQUE, ['data_domain', 'record_type']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_privacy_req'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('subjectuserid'),
        xmldb_local_prequran_field_int('requesterid'),
        xmldb_local_prequran_field_char('request_type', 80, 'export'),
        xmldb_local_prequran_field_char('status', 40, 'submitted'),
        xmldb_local_prequran_field_char('legal_basis', 120),
        xmldb_local_prequran_field_text('scopejson'),
        xmldb_local_prequran_field_text('request_notes'),
        xmldb_local_prequran_field_text('responsejson'),
        xmldb_local_prequran_field_int('assignedto'),
        xmldb_local_prequran_field_int('duedate'),
        xmldb_local_prequran_field_int('completedby'),
        xmldb_local_prequran_field_int('completedat'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqprivreq_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'duedate']),
        new xmldb_index('preqprivreq_subj_ix', XMLDB_INDEX_NOTUNIQUE, ['subjectuserid', 'request_type']),
        new xmldb_index('preqprivreq_assn_ix', XMLDB_INDEX_NOTUNIQUE, ['assignedto', 'status']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_privacy_action'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('requestid'),
        xmldb_local_prequran_field_int('subjectuserid'),
        xmldb_local_prequran_field_char('action_type', 80, 'export'),
        xmldb_local_prequran_field_char('target_table', 120),
        xmldb_local_prequran_field_int('targetid'),
        xmldb_local_prequran_field_char('status', 40, 'queued'),
        xmldb_local_prequran_field_text('resultjson'),
        xmldb_local_prequran_field_int('performedby'),
        xmldb_local_prequran_field_int('performedat'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqprivact_req_ix', XMLDB_INDEX_NOTUNIQUE, ['requestid', 'status']),
        new xmldb_index('preqprivact_subj_ix', XMLDB_INDEX_NOTUNIQUE, ['subjectuserid', 'action_type']),
        new xmldb_index('preqprivact_target_ix', XMLDB_INDEX_NOTUNIQUE, ['target_table', 'targetid']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_consent_hist'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('guardianid'),
        xmldb_local_prequran_field_char('consent_type', 80, 'communication'),
        xmldb_local_prequran_field_char('channel', 40),
        xmldb_local_prequran_field_int('consented', 1, 1),
        xmldb_local_prequran_field_char('source_table', 120),
        xmldb_local_prequran_field_int('source_id'),
        xmldb_local_prequran_field_text('evidencejson'),
        xmldb_local_prequran_field_int('capturedby'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqconhist_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'consent_type']),
        new xmldb_index('preqconhist_guard_ix', XMLDB_INDEX_NOTUNIQUE, ['guardianid', 'channel']),
        new xmldb_index('preqconhist_src_ix', XMLDB_INDEX_NOTUNIQUE, ['source_table', 'source_id']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_audit_report'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('report_type', 80, 'full'),
        xmldb_local_prequran_field_int('period_start'),
        xmldb_local_prequran_field_int('period_end'),
        xmldb_local_prequran_field_char('status', 40, 'generated'),
        xmldb_local_prequran_field_text('summaryjson'),
        xmldb_local_prequran_field_text('filtersjson'),
        xmldb_local_prequran_field_int('generatedby'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqaudrep_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'report_type', 'timecreated']),
        new xmldb_index('preqaudrep_period_ix', XMLDB_INDEX_NOTUNIQUE, ['period_start', 'period_end']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_analytics_snap'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('snapshot_type', 80, 'executive_dashboard'),
        xmldb_local_prequran_field_int('period_start'),
        xmldb_local_prequran_field_int('period_end'),
        xmldb_local_prequran_field_text('metricsjson'),
        xmldb_local_prequran_field_int('generatedby'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqanlsnap_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'snapshot_type', 'timecreated']),
        new xmldb_index('preqanlsnap_period_ix', XMLDB_INDEX_NOTUNIQUE, ['period_start', 'period_end']),
    ]);
}

function xmldb_local_prequran_ensure_certificates_placement_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_cert_template'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('template_key', 120),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_char('award_type', 80, 'completion'),
        xmldb_local_prequran_field_text('body_template'),
        xmldb_local_prequran_field_text('designjson'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqcerttpl_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqcerttpl_key_ix', XMLDB_INDEX_NOTUNIQUE, ['template_key', 'award_type']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_completion_award'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('offeringid'),
        xmldb_local_prequran_field_int('courseid'),
        xmldb_local_prequran_field_int('templateid'),
        xmldb_local_prequran_field_char('awardnumber', 120),
        xmldb_local_prequran_field_char('award_type', 80, 'completion'),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_char('status', 40, 'draft'),
        xmldb_local_prequran_field_char('completion_percent', 40),
        xmldb_local_prequran_field_char('final_grade', 40),
        xmldb_local_prequran_field_text('evidencejson'),
        xmldb_local_prequran_field_int('issuedby'),
        xmldb_local_prequran_field_int('issuedat'),
        xmldb_local_prequran_field_int('revokedby'),
        xmldb_local_prequran_field_int('revokedat'),
        xmldb_local_prequran_field_text('revocation_reason'),
        xmldb_local_prequran_field_int('documentid'),
        xmldb_local_prequran_field_int('generateddocid'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqaward_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'issuedat']),
        new xmldb_index('preqaward_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'award_type']),
        new xmldb_index('preqaward_num_ix', XMLDB_INDEX_NOTUNIQUE, ['awardnumber']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_award_audit'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('awardid'),
        xmldb_local_prequran_field_int('actorid'),
        xmldb_local_prequran_field_char('action', 80),
        xmldb_local_prequran_field_text('detailsjson'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqawardaud_award_ix', XMLDB_INDEX_NOTUNIQUE, ['awardid', 'timecreated']),
        new xmldb_index('preqawardaud_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'timecreated']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_place_test'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('test_key', 120),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_char('domain', 80, 'quran_arabic'),
        xmldb_local_prequran_field_char('level_band', 80),
        xmldb_local_prequran_field_char('delivery_mode', 80, 'oral_and_written'),
        xmldb_local_prequran_field_text('instructions'),
        xmldb_local_prequran_field_text('rubricjson'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqpltest_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqpltest_key_ix', XMLDB_INDEX_NOTUNIQUE, ['test_key', 'domain']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_place_session'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('testid'),
        xmldb_local_prequran_field_int('applicationid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('assessorid'),
        xmldb_local_prequran_field_char('status', 40, 'scheduled'),
        xmldb_local_prequran_field_int('scheduledat'),
        xmldb_local_prequran_field_int('startedat'),
        xmldb_local_prequran_field_int('completedat'),
        xmldb_local_prequran_field_char('recommended_level', 80),
        xmldb_local_prequran_field_char('recommended_course_key', 120),
        xmldb_local_prequran_field_char('score_percent', 40),
        xmldb_local_prequran_field_text('resultjson'),
        xmldb_local_prequran_field_text('assessor_notes'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqplsess_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'scheduledat']),
        new xmldb_index('preqplsess_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'status']),
        new xmldb_index('preqplsess_app_ix', XMLDB_INDEX_NOTUNIQUE, ['applicationid', 'status']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_place_audit'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('sessionid'),
        xmldb_local_prequran_field_int('actorid'),
        xmldb_local_prequran_field_char('action', 80),
        xmldb_local_prequran_field_text('detailsjson'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqplaud_sess_ix', XMLDB_INDEX_NOTUNIQUE, ['sessionid', 'timecreated']),
        new xmldb_index('preqplaud_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'timecreated']),
    ]);
}

function xmldb_local_prequran_ensure_student_finance_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_billing_account'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('accounttype', 40, 'parent'),
            xmldb_local_prequran_field_int('primaryuserid'),
            xmldb_local_prequran_field_char('displayname', 255),
            xmldb_local_prequran_field_char('billingemail', 255),
            xmldb_local_prequran_field_char('billingphone', 100),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqbillacct_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'accounttype']),
            new xmldb_index('preqbillacct_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'status']),
            new xmldb_index('preqbillacct_user_ix', XMLDB_INDEX_NOTUNIQUE, ['primaryuserid', 'status']),
            new xmldb_index('preqbillacct_email_ix', XMLDB_INDEX_NOTUNIQUE, ['billingemail']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_student_finance'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_text('financepolicyjson'),
            xmldb_local_prequran_field_char('holdstatus', 40, 'none'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqstudfin_student_uix', XMLDB_KEY_UNIQUE, ['workspaceid', 'studentid']),
        ],
        [
            new xmldb_index('preqstudfin_acct_ix', XMLDB_INDEX_NOTUNIQUE, ['billingaccountid', 'status']),
            new xmldb_index('preqstudfin_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'status']),
            new xmldb_index('preqstudfin_hold_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'holdstatus', 'status']),
        ]
    );
}

function xmldb_local_prequran_ensure_finance_policy_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_finance_policy'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('policyversion', 10, 1),
            xmldb_local_prequran_field_char('policyhash', 64),
            xmldb_local_prequran_field_text('policyjson'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqfinpol_work_uix', XMLDB_KEY_UNIQUE, ['workspaceid']),
        ],
        [
            new xmldb_index('preqfinpol_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'status']),
            new xmldb_index('preqfinpol_status_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'timemodified']),
            new xmldb_index('preqfinpol_hash_ix', XMLDB_INDEX_NOTUNIQUE, ['policyhash']),
        ]
    );
}

function xmldb_local_prequran_ensure_invoice_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_invoice'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_char('invoicenumber', 80),
            xmldb_local_prequran_field_char('invoicetype', 40, 'tuition'),
            xmldb_local_prequran_field_char('status', 40, 'draft'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('subtotal', 40, '0.00'),
            xmldb_local_prequran_field_char('discounttotal', 40, '0.00'),
            xmldb_local_prequran_field_char('taxtotal', 40, '0.00'),
            xmldb_local_prequran_field_char('total', 40, '0.00'),
            xmldb_local_prequran_field_char('paidamount', 40, '0.00'),
            xmldb_local_prequran_field_char('creditedamount', 40, '0.00'),
            xmldb_local_prequran_field_char('balancedue', 40, '0.00'),
            xmldb_local_prequran_field_int('policyversion', 10, 1),
            xmldb_local_prequran_field_char('policyhash', 64),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('issuedat'),
            xmldb_local_prequran_field_int('dueat'),
            xmldb_local_prequran_field_int('sentat'),
            xmldb_local_prequran_field_int('voidedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqinv_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'timemodified']),
            new xmldb_index('preqinv_account_ix', XMLDB_INDEX_NOTUNIQUE, ['billingaccountid', 'status']),
            new xmldb_index('preqinv_student_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
            new xmldb_index('preqinv_number_ix', XMLDB_INDEX_NOTUNIQUE, ['invoicenumber']),
            new xmldb_index('preqinv_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_invoice_line'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('linesequence', 10, 1),
            xmldb_local_prequran_field_char('description', 255),
            xmldb_local_prequran_field_char('quantity', 40, '1'),
            xmldb_local_prequran_field_char('unitamount', 40, '0.00'),
            xmldb_local_prequran_field_char('discountamount', 40, '0.00'),
            xmldb_local_prequran_field_char('taxamount', 40, '0.00'),
            xmldb_local_prequran_field_char('linetotal', 40, '0.00'),
            xmldb_local_prequran_field_int('offeringid'),
            xmldb_local_prequran_field_int('requestid'),
            xmldb_local_prequran_field_int('moodlecourseid'),
            xmldb_local_prequran_field_int('teacherid'),
            xmldb_local_prequran_field_int('seriesid'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqinvline_seq_uix', XMLDB_KEY_UNIQUE, ['invoiceid', 'linesequence']),
        ],
        [
            new xmldb_index('preqinvline_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqinvline_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqinvline_offer_ix', XMLDB_INDEX_NOTUNIQUE, ['offeringid']),
            new xmldb_index('preqinvline_req_ix', XMLDB_INDEX_NOTUNIQUE, ['requestid']),
            new xmldb_index('preqinvline_course_ix', XMLDB_INDEX_NOTUNIQUE, ['moodlecourseid']),
            new xmldb_index('preqinvline_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['teacherid']),
        ]
    );
}

function xmldb_local_prequran_ensure_payment_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_payment'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_char('receiptnumber', 80),
            xmldb_local_prequran_field_char('paymentmethod', 60, 'cash'),
            xmldb_local_prequran_field_char('status', 40, 'recorded'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('amount', 40, '0.00'),
            xmldb_local_prequran_field_char('allocatedamount', 40, '0.00'),
            xmldb_local_prequran_field_char('unallocatedamount', 40, '0.00'),
            xmldb_local_prequran_field_char('reference', 120),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('receivedat'),
            xmldb_local_prequran_field_int('reversedat'),
            xmldb_local_prequran_field_int('reversalofid'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqpay_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'receivedat']),
            new xmldb_index('preqpay_acct_ix', XMLDB_INDEX_NOTUNIQUE, ['billingaccountid', 'status']),
            new xmldb_index('preqpay_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
            new xmldb_index('preqpay_receipt_ix', XMLDB_INDEX_NOTUNIQUE, ['receiptnumber']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_payment_alloc'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('paymentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('amount', 40, '0.00'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('allocatedat'),
            xmldb_local_prequran_field_int('reversedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqpayalloc_pay_ix', XMLDB_INDEX_NOTUNIQUE, ['paymentid', 'status']),
            new xmldb_index('preqpayalloc_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqpayalloc_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        ]
    );
}

function xmldb_local_prequran_ensure_finance_correction_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_credit_note'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_char('creditnumber', 80),
            xmldb_local_prequran_field_char('credittype', 40, 'credit'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('amount', 40, '0.00'),
            xmldb_local_prequran_field_char('reasoncode', 80),
            xmldb_local_prequran_field_text('reason'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('issuedat'),
            xmldb_local_prequran_field_int('voidedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqcred_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'issuedat']),
            new xmldb_index('preqcred_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqcred_acct_ix', XMLDB_INDEX_NOTUNIQUE, ['billingaccountid', 'status']),
            new xmldb_index('preqcred_num_ix', XMLDB_INDEX_NOTUNIQUE, ['creditnumber']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_refund'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('paymentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_char('refundnumber', 80),
            xmldb_local_prequran_field_char('status', 40, 'recorded'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('amount', 40, '0.00'),
            xmldb_local_prequran_field_char('refundmethod', 60, 'manual'),
            xmldb_local_prequran_field_char('reference', 120),
            xmldb_local_prequran_field_text('reason'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('refundedat'),
            xmldb_local_prequran_field_int('voidedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqrefund_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status', 'refundedat']),
            new xmldb_index('preqrefund_pay_ix', XMLDB_INDEX_NOTUNIQUE, ['paymentid', 'status']),
            new xmldb_index('preqrefund_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqrefund_num_ix', XMLDB_INDEX_NOTUNIQUE, ['refundnumber']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_finance_audit'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('paymentid'),
            xmldb_local_prequran_field_int('actorid'),
            xmldb_local_prequran_field_char('action', 80),
            xmldb_local_prequran_field_char('targettype', 80),
            xmldb_local_prequran_field_int('targetid'),
            xmldb_local_prequran_field_text('details'),
            xmldb_local_prequran_field_int('timecreated'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqfinaud_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'timecreated']),
            new xmldb_index('preqfinaud_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'timecreated']),
            new xmldb_index('preqfinaud_pay_ix', XMLDB_INDEX_NOTUNIQUE, ['paymentid', 'timecreated']),
            new xmldb_index('preqfinaud_actor_ix', XMLDB_INDEX_NOTUNIQUE, ['actorid', 'timecreated']),
            new xmldb_index('preqfinaud_action_ix', XMLDB_INDEX_NOTUNIQUE, ['action', 'timecreated']),
        ]
    );
}

function xmldb_local_prequran_ensure_finance_hold_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_finance_hold'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('paymentid'),
            xmldb_local_prequran_field_char('holdtype', 80, 'manual'),
            xmldb_local_prequran_field_char('source', 80, 'manual'),
            xmldb_local_prequran_field_char('severity', 40, 'warning'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_char('policyaction', 80, 'warning_only'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('amount', 40, '0.00'),
            xmldb_local_prequran_field_char('reasoncode', 120),
            xmldb_local_prequran_field_text('reason'),
            xmldb_local_prequran_field_text('parentmessage'),
            xmldb_local_prequran_field_text('resolutionnote'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('detectedat'),
            xmldb_local_prequran_field_int('activatedat'),
            xmldb_local_prequran_field_int('resolvedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqfinhold_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
            new xmldb_index('preqfinhold_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqfinhold_type_ix', XMLDB_INDEX_NOTUNIQUE, ['holdtype', 'status']),
            new xmldb_index('preqfinhold_reason_ix', XMLDB_INDEX_NOTUNIQUE, ['reasoncode', 'status']),
        ]
    );
}

function xmldb_local_prequran_ensure_finance_notification_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_finance_link'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('paymentid'),
            xmldb_local_prequran_field_char('purpose', 80, 'invoice_view'),
            xmldb_local_prequran_field_char('targettype', 80, 'invoice'),
            xmldb_local_prequran_field_int('targetid'),
            xmldb_local_prequran_field_char('tokenhash', 64),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_int('expiresat'),
            xmldb_local_prequran_field_int('revokedat'),
            xmldb_local_prequran_field_int('lastusedat'),
            xmldb_local_prequran_field_int('usecount'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqfinlink_token_ix', XMLDB_INDEX_NOTUNIQUE, ['tokenhash']),
            new xmldb_index('preqfinlink_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'purpose', 'status']),
            new xmldb_index('preqfinlink_pay_ix', XMLDB_INDEX_NOTUNIQUE, ['paymentid', 'purpose', 'status']),
            new xmldb_index('preqfinlink_exp_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'expiresat']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_finance_delivery'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('paymentid'),
            xmldb_local_prequran_field_int('linkid'),
            xmldb_local_prequran_field_int('recipientid'),
            xmldb_local_prequran_field_char('recipientemail', 255),
            xmldb_local_prequran_field_char('eventtype', 80),
            xmldb_local_prequran_field_char('status', 40, 'pending'),
            xmldb_local_prequran_field_char('subject', 255),
            xmldb_local_prequran_field_text('messagebody'),
            xmldb_local_prequran_field_text('error'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('sentat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqfindel_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'eventtype', 'timecreated']),
            new xmldb_index('preqfindel_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'eventtype']),
            new xmldb_index('preqfindel_pay_ix', XMLDB_INDEX_NOTUNIQUE, ['paymentid', 'eventtype']),
            new xmldb_index('preqfindel_rec_ix', XMLDB_INDEX_NOTUNIQUE, ['recipientid', 'timecreated']),
        ]
    );
}

function xmldb_local_prequran_ensure_payment_gateway_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_pay_provider'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('scope', 40, 'workspace'),
            xmldb_local_prequran_field_char('provider', 80, 'generic_hosted'),
            xmldb_local_prequran_field_char('mode', 20, 'test'),
            xmldb_local_prequran_field_char('accountid', 120),
            xmldb_local_prequran_field_char('displayname', 255),
            xmldb_local_prequran_field_char('checkoutbaseurl', 255),
            xmldb_local_prequran_field_text('apikey'),
            xmldb_local_prequran_field_text('webhooksecret'),
            xmldb_local_prequran_field_char('status', 40, 'disabled'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqpayprov_scope_ix', XMLDB_INDEX_NOTUNIQUE, ['scope', 'consumerid', 'workspaceid', 'status']),
            new xmldb_index('preqpayprov_provider_ix', XMLDB_INDEX_NOTUNIQUE, ['provider', 'mode', 'status']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_pay_session'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('providerconfigid'),
            xmldb_local_prequran_field_char('provider', 80, 'generic_hosted'),
            xmldb_local_prequran_field_char('mode', 20, 'test'),
            xmldb_local_prequran_field_char('localsessionid', 120),
            xmldb_local_prequran_field_char('providersessionid', 180),
            xmldb_local_prequran_field_char('providertransactionid', 180),
            xmldb_local_prequran_field_char('status', 40, 'pending'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('amount', 40, '0.00'),
            xmldb_local_prequran_field_text('checkouturl'),
            xmldb_local_prequran_field_text('returnurl'),
            xmldb_local_prequran_field_text('cancelurl'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('expiresat'),
            xmldb_local_prequran_field_int('completedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqpaysess_invoice_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqpaysess_local_ix', XMLDB_INDEX_NOTUNIQUE, ['localsessionid']),
            new xmldb_index('preqpaysess_provider_ix', XMLDB_INDEX_NOTUNIQUE, ['provider', 'providersessionid']),
            new xmldb_index('preqpaysess_txn_ix', XMLDB_INDEX_NOTUNIQUE, ['providertransactionid']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_pay_webhook'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('paymentid'),
            xmldb_local_prequran_field_int('sessionid'),
            xmldb_local_prequran_field_char('provider', 80, 'generic_hosted'),
            xmldb_local_prequran_field_char('mode', 20, 'test'),
            xmldb_local_prequran_field_char('eventid', 180),
            xmldb_local_prequran_field_char('idempotencykey', 180),
            xmldb_local_prequran_field_char('eventtype', 120),
            xmldb_local_prequran_field_char('mappedstatus', 40),
            xmldb_local_prequran_field_char('signaturestatus', 40, 'unchecked'),
            xmldb_local_prequran_field_char('processingstatus', 40, 'received'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('amount', 40, '0.00'),
            xmldb_local_prequran_field_char('providertransactionid', 180),
            xmldb_local_prequran_field_text('payloadjson'),
            xmldb_local_prequran_field_text('error'),
            xmldb_local_prequran_field_int('receivedat'),
            xmldb_local_prequran_field_int('processedat'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqpaywh_event_ix', XMLDB_INDEX_NOTUNIQUE, ['provider', 'eventid']),
            new xmldb_index('preqpaywh_idem_ix', XMLDB_INDEX_NOTUNIQUE, ['provider', 'idempotencykey']),
            new xmldb_index('preqpaywh_status_ix', XMLDB_INDEX_NOTUNIQUE, ['processingstatus', 'receivedat']),
            new xmldb_index('preqpaywh_invoice_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'eventtype']),
        ]
    );
}

function xmldb_local_prequran_ensure_payment_plan_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_payment_plan'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_char('plannumber', 80),
            xmldb_local_prequran_field_char('status', 40, 'draft'),
            xmldb_local_prequran_field_char('plantype', 60, 'manual_installments'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('principalamount', 40, '0.00'),
            xmldb_local_prequran_field_char('scheduledamount', 40, '0.00'),
            xmldb_local_prequran_field_char('paidamount', 40, '0.00'),
            xmldb_local_prequran_field_char('pastdueamount', 40, '0.00'),
            xmldb_local_prequran_field_int('installmentcount'),
            xmldb_local_prequran_field_int('firstdueat'),
            xmldb_local_prequran_field_int('lastdueat'),
            xmldb_local_prequran_field_int('activatedat'),
            xmldb_local_prequran_field_int('completedat'),
            xmldb_local_prequran_field_int('cancelledat'),
            xmldb_local_prequran_field_text('termsnote'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqpayplan_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqpayplan_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
            new xmldb_index('preqpayplan_acct_ix', XMLDB_INDEX_NOTUNIQUE, ['billingaccountid', 'status']),
            new xmldb_index('preqpayplan_num_ix', XMLDB_INDEX_NOTUNIQUE, ['plannumber']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_payment_install'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('planid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('installmentnumber'),
            xmldb_local_prequran_field_char('status', 40, 'scheduled'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('amount', 40, '0.00'),
            xmldb_local_prequran_field_char('paidamount', 40, '0.00'),
            xmldb_local_prequran_field_char('balancedue', 40, '0.00'),
            xmldb_local_prequran_field_int('dueat'),
            xmldb_local_prequran_field_int('paidat'),
            xmldb_local_prequran_field_int('cancelledat'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqpayinst_seq_uix', XMLDB_KEY_UNIQUE, ['planid', 'installmentnumber']),
        ],
        [
            new xmldb_index('preqpayinst_plan_ix', XMLDB_INDEX_NOTUNIQUE, ['planid', 'status']),
            new xmldb_index('preqpayinst_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqpayinst_due_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'dueat', 'status']),
            new xmldb_index('preqpayinst_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
        ]
    );
}

function xmldb_local_prequran_ensure_finance_assistance_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_scholar_award'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('creditnoteid'),
            xmldb_local_prequran_field_char('awardnumber', 80),
            xmldb_local_prequran_field_char('awardtype', 60, 'need_based'),
            xmldb_local_prequran_field_char('fundingsource', 120),
            xmldb_local_prequran_field_char('status', 40, 'approved'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('amount', 40, '0.00'),
            xmldb_local_prequran_field_text('reason'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('approvedby'),
            xmldb_local_prequran_field_int('approvedat'),
            xmldb_local_prequran_field_int('voidedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqschaw_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqschaw_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
            new xmldb_index('preqschaw_num_ix', XMLDB_INDEX_NOTUNIQUE, ['awardnumber']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_sponsor_commit'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('sponsoraccountid'),
            xmldb_local_prequran_field_int('billingaccountid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_char('commitmentnumber', 80),
            xmldb_local_prequran_field_char('status', 40, 'pledged'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('committedamount', 40, '0.00'),
            xmldb_local_prequran_field_char('receivedamount', 40, '0.00'),
            xmldb_local_prequran_field_char('balanceamount', 40, '0.00'),
            xmldb_local_prequran_field_text('termsnote'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('committedat'),
            xmldb_local_prequran_field_int('expectedat'),
            xmldb_local_prequran_field_int('completedat'),
            xmldb_local_prequran_field_int('cancelledat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqspcom_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqspcom_spon_ix', XMLDB_INDEX_NOTUNIQUE, ['sponsoraccountid', 'status']),
            new xmldb_index('preqspcom_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
            new xmldb_index('preqspcom_num_ix', XMLDB_INDEX_NOTUNIQUE, ['commitmentnumber']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_market_payout'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('teacherid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('requestid'),
            xmldb_local_prequran_field_int('paymentid'),
            xmldb_local_prequran_field_char('payoutnumber', 80),
            xmldb_local_prequran_field_char('status', 40, 'ready_for_review'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('grossamount', 40, '0.00'),
            xmldb_local_prequran_field_char('platformfee', 40, '0.00'),
            xmldb_local_prequran_field_char('payoutamount', 40, '0.00'),
            xmldb_local_prequran_field_char('payoutmethod', 80, 'manual'),
            xmldb_local_prequran_field_char('reference', 120),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('readyat'),
            xmldb_local_prequran_field_int('approvedby'),
            xmldb_local_prequran_field_int('approvedat'),
            xmldb_local_prequran_field_int('paidat'),
            xmldb_local_prequran_field_int('voidedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqmpout_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqmpout_teach_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'teacherid', 'status']),
            new xmldb_index('preqmpout_req_ix', XMLDB_INDEX_NOTUNIQUE, ['requestid', 'status']),
            new xmldb_index('preqmpout_num_ix', XMLDB_INDEX_NOTUNIQUE, ['payoutnumber']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_scholar_app'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('applicantid'),
            xmldb_local_prequran_field_int('guardianid'),
            xmldb_local_prequran_field_int('offeringid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('awardid'),
            xmldb_local_prequran_field_int('assignedto'),
            xmldb_local_prequran_field_char('applicationnumber', 80),
            xmldb_local_prequran_field_char('status', 40, 'submitted'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('requestedamount', 40, '0.00'),
            xmldb_local_prequran_field_char('needlevel', 40, 'standard'),
            xmldb_local_prequran_field_char('fundingpreference', 120),
            xmldb_local_prequran_field_text('householdnote'),
            xmldb_local_prequran_field_text('academicnote'),
            xmldb_local_prequran_field_text('documentnote'),
            xmldb_local_prequran_field_text('decisionnote'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('submittedat'),
            xmldb_local_prequran_field_int('reviewedat'),
            xmldb_local_prequran_field_int('decidedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqschapp_ws_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqschapp_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
            new xmldb_index('preqschapp_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqschapp_num_ix', XMLDB_INDEX_NOTUNIQUE, ['applicationnumber']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_donor_pledge'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('sponsoraccountid'),
            xmldb_local_prequran_field_int('donoruserid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('invoiceid'),
            xmldb_local_prequran_field_int('commitmentid'),
            xmldb_local_prequran_field_char('pledgenumber', 80),
            xmldb_local_prequran_field_char('campaign', 120),
            xmldb_local_prequran_field_char('pledge_type', 60, 'general'),
            xmldb_local_prequran_field_char('status', 40, 'pledged'),
            xmldb_local_prequran_field_char('currency', 10, 'USD'),
            xmldb_local_prequran_field_char('pledgedamount', 40, '0.00'),
            xmldb_local_prequran_field_char('allocatedamount', 40, '0.00'),
            xmldb_local_prequran_field_char('balanceamount', 40, '0.00'),
            xmldb_local_prequran_field_char('privacy', 40, 'named'),
            xmldb_local_prequran_field_text('donor_message'),
            xmldb_local_prequran_field_text('staffnote'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('pledgedat'),
            xmldb_local_prequran_field_int('expectedat'),
            xmldb_local_prequran_field_int('acceptedat'),
            xmldb_local_prequran_field_int('completedat'),
            xmldb_local_prequran_field_int('cancelledat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqdonpl_ws_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqdonpl_spon_ix', XMLDB_INDEX_NOTUNIQUE, ['sponsoraccountid', 'status']),
            new xmldb_index('preqdonpl_user_ix', XMLDB_INDEX_NOTUNIQUE, ['donoruserid', 'status']),
            new xmldb_index('preqdonpl_inv_ix', XMLDB_INDEX_NOTUNIQUE, ['invoiceid', 'status']),
            new xmldb_index('preqdonpl_num_ix', XMLDB_INDEX_NOTUNIQUE, ['pledgenumber']),
        ]
    );
}

function xmldb_local_prequran_ensure_finance_api_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_finance_api'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('actorid'),
            xmldb_local_prequran_field_char('endpoint', 120),
            xmldb_local_prequran_field_char('idempotencykey', 180),
            xmldb_local_prequran_field_char('idempotencyhash', 64),
            xmldb_local_prequran_field_char('requesthash', 64),
            xmldb_local_prequran_field_char('status', 40, 'accepted'),
            xmldb_local_prequran_field_int('responseid'),
            xmldb_local_prequran_field_text('responsejson'),
            xmldb_local_prequran_field_text('error'),
            xmldb_local_prequran_field_int('windowstart'),
            xmldb_local_prequran_field_int('expiresat'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqfinapi_ihash_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'endpoint', 'idempotencyhash']),
            new xmldb_index('preqfinapi_actor_ix', XMLDB_INDEX_NOTUNIQUE, ['actorid', 'endpoint', 'timecreated']),
            new xmldb_index('preqfinapi_status_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'timecreated']),
            new xmldb_index('preqfinapi_exp_ix', XMLDB_INDEX_NOTUNIQUE, ['expiresat']),
        ]
    );

    $apitable = new xmldb_table('local_prequran_finance_api');
    if ($dbman->table_exists($apitable)) {
        $oldindex = new xmldb_index('preqfinapi_idem_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'endpoint', 'idempotencykey']);
        if ($dbman->index_exists($apitable, $oldindex)) {
            $dbman->drop_index($apitable, $oldindex);
        }
    }

    $hashfield = new xmldb_field('idempotencyhash');
    if ($dbman->table_exists($apitable) && $dbman->field_exists($apitable, $hashfield)) {
        $records = $DB->get_records_select(
            'local_prequran_finance_api',
            "idempotencykey <> '' AND idempotencyhash = ''",
            null,
            '',
            'id, idempotencykey'
        );
        foreach ($records as $record) {
            $DB->update_record('local_prequran_finance_api', (object)[
                'id' => (int)$record->id,
                'idempotencyhash' => hash('sha256', (string)$record->idempotencykey),
            ]);
        }
    }

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_finance_scale'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('snapshotkey', 120),
            xmldb_local_prequran_field_char('status', 40, 'ok'),
            xmldb_local_prequran_field_text('metricsjson'),
            xmldb_local_prequran_field_text('warningsjson'),
            xmldb_local_prequran_field_int('checkedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqfinscale_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'snapshotkey', 'checkedat']),
            new xmldb_index('preqfinscale_status_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'checkedat']),
        ]
    );
}

function xmldb_local_prequran_ensure_mobile_localization_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_mobile_client'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('clientname', 120),
            xmldb_local_prequran_field_char('platform', 40, 'mobile'),
            xmldb_local_prequran_field_char('clientkey', 80),
            xmldb_local_prequran_field_char('status', 40, 'draft'),
            xmldb_local_prequran_field_char('min_app_version', 40),
            xmldb_local_prequran_field_char('current_app_version', 40),
            xmldb_local_prequran_field_char('api_scope', 255),
            xmldb_local_prequran_field_text('redirecturis'),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_text('metadatajson'),
            xmldb_local_prequran_field_int('lastcheckat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqmobcl_ws_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqmobcl_key_ix', XMLDB_INDEX_NOTUNIQUE, ['clientkey']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_mobile_check'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('clientid'),
            xmldb_local_prequran_field_char('checkkey', 120),
            xmldb_local_prequran_field_char('status', 40, 'warning'),
            xmldb_local_prequran_field_char('severity', 40, 'medium'),
            xmldb_local_prequran_field_text('summary'),
            xmldb_local_prequran_field_text('detailsjson'),
            xmldb_local_prequran_field_int('checkedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqmobchk_ws_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqmobchk_client_ix', XMLDB_INDEX_NOTUNIQUE, ['clientid', 'checkkey']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_locale_profile'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('locale', 40, 'en_US'),
            xmldb_local_prequran_field_char('language', 40, 'en'),
            xmldb_local_prequran_field_char('country', 80),
            xmldb_local_prequran_field_char('timezone', 100, 'UTC'),
            xmldb_local_prequran_field_char('date_format', 80, 'Y-m-d'),
            xmldb_local_prequran_field_char('time_format', 80, 'H:i'),
            xmldb_local_prequran_field_char('week_start', 20, 'sunday'),
            xmldb_local_prequran_field_char('number_format', 80, '1,234.56'),
            xmldb_local_prequran_field_char('currency_position', 20, 'before'),
            xmldb_local_prequran_field_char('default_currency', 10, 'USD'),
            xmldb_local_prequran_field_text('enabled_currencies'),
            xmldb_local_prequran_field_char('tax_region', 80),
            xmldb_local_prequran_field_char('tax_behavior', 40, 'not_configured'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqlocale_ws_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqlocale_locale_ix', XMLDB_INDEX_NOTUNIQUE, ['locale', 'default_currency']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_currency_rate'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('base_currency', 10, 'USD'),
            xmldb_local_prequran_field_char('quote_currency', 10, 'USD'),
            xmldb_local_prequran_field_char('rate', 40, '1.000000'),
            xmldb_local_prequran_field_char('provider', 80, 'manual'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_int('effectiveat'),
            xmldb_local_prequran_field_int('expiresat'),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqcurrate_ws_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqcurrate_pair_ix', XMLDB_INDEX_NOTUNIQUE, ['base_currency', 'quote_currency', 'effectiveat']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_tax_region'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('regioncode', 80),
            xmldb_local_prequran_field_char('regionname', 160),
            xmldb_local_prequran_field_char('taxname', 80, 'Tax'),
            xmldb_local_prequran_field_char('taxrate', 40, '0.0000'),
            xmldb_local_prequran_field_char('behavior', 40, 'not_configured'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_text('exemptionnote'),
            xmldb_local_prequran_field_int('effectiveat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqtaxreg_ws_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqtaxreg_code_ix', XMLDB_INDEX_NOTUNIQUE, ['regioncode', 'behavior']),
        ]
    );
}

function xmldb_local_prequran_ensure_transcript_policy_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_transcript_policy'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('policyversion', 10, 1),
            xmldb_local_prequran_field_char('policyhash', 64),
            xmldb_local_prequran_field_text('policyjson'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('modifiedby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqtrpol_workspace_uix', XMLDB_KEY_UNIQUE, ['workspaceid']),
        ],
        [
            new xmldb_index('preqtrpol_status_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'timemodified']),
            new xmldb_index('preqtrpol_hash_ix', XMLDB_INDEX_NOTUNIQUE, ['policyhash']),
        ]
    );
}

function xmldb_local_prequran_ensure_transcript_document_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_transcript_doc'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('documentid', 80),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_char('transcripttype', 40, 'official'),
            xmldb_local_prequran_field_char('status', 40, 'issued'),
            xmldb_local_prequran_field_int('policyversion', 10, 1),
            xmldb_local_prequran_field_char('policyhash', 64),
            xmldb_local_prequran_field_char('snapshothash', 64),
            xmldb_local_prequran_field_char('verificationtokenhash', 64),
            xmldb_local_prequran_field_char('pdfhash', 64),
            xmldb_local_prequran_field_int('pdfgeneratedat'),
            xmldb_local_prequran_field_char('replacedbydocumentid', 80),
            xmldb_local_prequran_field_text('snapshotjson'),
            xmldb_local_prequran_field_text('issuereason'),
            xmldb_local_prequran_field_text('revocationreason'),
            xmldb_local_prequran_field_int('issuedby'),
            xmldb_local_prequran_field_int('issuedat'),
            xmldb_local_prequran_field_int('revokedby'),
            xmldb_local_prequran_field_int('revokedat'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqtrdoc_docid_uix', XMLDB_KEY_UNIQUE, ['documentid']),
        ],
        [
            new xmldb_index('preqtrdoc_student_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
            new xmldb_index('preqtrdoc_issue_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'issuedat']),
            new xmldb_index('preqtrdoc_verify_ix', XMLDB_INDEX_NOTUNIQUE, ['verificationtokenhash']),
            new xmldb_index('preqtrdoc_hash_ix', XMLDB_INDEX_NOTUNIQUE, ['snapshothash']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_transcript_hold'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_char('holdtype', 80, 'registrar'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_text('reason'),
            xmldb_local_prequran_field_text('resolutionnote'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('resolvedby'),
            xmldb_local_prequran_field_int('resolvedat'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqtrhold_student_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
            new xmldb_index('preqtrhold_status_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'timecreated']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_transcript_override'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_char('documentid', 80),
            xmldb_local_prequran_field_char('fieldpath', 255),
            xmldb_local_prequran_field_text('oldvalue'),
            xmldb_local_prequran_field_text('newvalue'),
            xmldb_local_prequran_field_text('reason'),
            xmldb_local_prequran_field_char('status', 40, 'approved'),
            xmldb_local_prequran_field_int('requestedby'),
            xmldb_local_prequran_field_int('approvedby'),
            xmldb_local_prequran_field_int('approvedat'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqtrovr_student_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'studentid', 'status']),
            new xmldb_index('preqtrovr_doc_ix', XMLDB_INDEX_NOTUNIQUE, ['documentid', 'status']),
        ]
    );
}

function xmldb_local_prequran_ensure_consumer_scope_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $tables = [
        'local_prequran_intake_request' => [
            new xmldb_index('preqintreq_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'status']),
        ],
        'local_prequran_teacher_profile' => [
            new xmldb_index('preqtprof_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'marketplace_visible', 'marketplace_status']),
        ],
        'local_prequran_teacher_request' => [
            new xmldb_index('preqtreq_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'request_status']),
        ],
    ];

    $consumerfield = xmldb_local_prequran_field_int('consumerid');
    foreach ($tables as $tablename => $indexes) {
        $table = new xmldb_table($tablename);
        if (!$dbman->table_exists($table)) {
            continue;
        }
        xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $consumerfield);
        foreach ($indexes as $index) {
            xmldb_local_prequran_add_index_if_missing($dbman, $table, $index);
        }
    }

    if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_consumer'))) {
        return;
    }

    $quraanid = (int)$DB->get_field('local_prequran_consumer', 'id', ['slug' => 'quraan-academy'], IGNORE_MISSING);
    if ($quraanid <= 0) {
        return;
    }

    foreach (array_keys($tables) as $tablename) {
        $table = new xmldb_table($tablename);
        if (!$dbman->table_exists($table)) {
            continue;
        }
        try {
            $DB->set_field_select($tablename, 'consumerid', $quraanid, 'consumerid = ?', [0]);
        } catch (Throwable $e) {
            debugging('Could not backfill consumerid for ' . $tablename . ': ' . $e->getMessage(), DEBUG_DEVELOPER);
        }
    }
}

function xmldb_local_prequran_ensure_teacher_intake_request_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_teacher_intake_request'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('teacher_name', 255),
            xmldb_local_prequran_field_char('email', 255),
            xmldb_local_prequran_field_char('phone', 100),
            xmldb_local_prequran_field_char('country', 100),
            xmldb_local_prequran_field_char('city', 100),
            xmldb_local_prequran_field_char('timezone', 100, 'UTC'),
            xmldb_local_prequran_field_char('primary_language', 100),
            xmldb_local_prequran_field_text('other_languages'),
            xmldb_local_prequran_field_text('courses'),
            xmldb_local_prequran_field_text('levels'),
            xmldb_local_prequran_field_text('teacher_work_models'),
            xmldb_local_prequran_field_text('service_modes'),
            xmldb_local_prequran_field_char('subject_language', 100),
            xmldb_local_prequran_field_text('subject_areas'),
            xmldb_local_prequran_field_text('subject_other'),
            xmldb_local_prequran_field_text('age_groups'),
            xmldb_local_prequran_field_text('general_levels'),
            xmldb_local_prequran_field_text('workspace_preferences'),
            xmldb_local_prequran_field_int('years_experience'),
            xmldb_local_prequran_field_text('institution_experience'),
            xmldb_local_prequran_field_text('application_json'),
            xmldb_local_prequran_field_text('experience'),
            xmldb_local_prequran_field_text('education'),
            xmldb_local_prequran_field_text('teaching_style'),
            xmldb_local_prequran_field_text('bio'),
            xmldb_local_prequran_field_text('availability_json'),
            xmldb_local_prequran_field_text('availability_summary'),
            xmldb_local_prequran_field_text('desired_services'),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_char('status', 40, 'new'),
            xmldb_local_prequran_field_int('converted_userid'),
            xmldb_local_prequran_field_int('converted_profileid'),
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
            new xmldb_index('preqtintreq_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'status']),
            new xmldb_index('preqtintreq_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqtintreq_email_ix', XMLDB_INDEX_NOTUNIQUE, ['email']),
            new xmldb_index('preqtintreq_created_ix', XMLDB_INDEX_NOTUNIQUE, ['timecreated']),
        ]
    );

    $requesttable = new xmldb_table('local_prequran_teacher_intake_request');
    foreach ([
        xmldb_local_prequran_field_text('teacher_work_models'),
        xmldb_local_prequran_field_text('service_modes'),
        xmldb_local_prequran_field_char('subject_language', 100),
        xmldb_local_prequran_field_text('subject_areas'),
        xmldb_local_prequran_field_text('subject_other'),
        xmldb_local_prequran_field_text('age_groups'),
        xmldb_local_prequran_field_text('general_levels'),
        xmldb_local_prequran_field_text('workspace_preferences'),
        xmldb_local_prequran_field_int('years_experience'),
        xmldb_local_prequran_field_text('institution_experience'),
        xmldb_local_prequran_field_text('application_json'),
    ] as $field) {
        xmldb_local_prequran_add_field_if_missing($dbman, $requesttable, $field);
    }

    $profiletable = new xmldb_table('local_prequran_teacher_profile');
    if ($dbman->table_exists($profiletable)) {
        foreach ([
            xmldb_local_prequran_field_text('teacher_work_models'),
            xmldb_local_prequran_field_text('service_modes'),
            xmldb_local_prequran_field_char('subject_language', 100),
            xmldb_local_prequran_field_text('subject_areas'),
            xmldb_local_prequran_field_text('subject_other'),
            xmldb_local_prequran_field_text('age_groups'),
            xmldb_local_prequran_field_text('general_levels'),
            xmldb_local_prequran_field_text('workspace_preferences'),
            xmldb_local_prequran_field_int('years_experience'),
            xmldb_local_prequran_field_text('institution_experience'),
            xmldb_local_prequran_field_text('application_json'),
        ] as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $profiletable, $field);
        }
    }
}

function xmldb_local_prequran_seed_consumer_record(
    string $slug,
    string $name,
    string $type,
    string $workspaceslug,
    array $domains,
    array $settings = []
): int {
    global $DB;

    if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_consumer'))) {
        return 0;
    }

    $now = time();
    $workspaceid = 0;
    if ($workspaceslug !== '' && $DB->get_manager()->table_exists(new xmldb_table('local_prequran_workspace'))) {
        $workspaceid = (int)$DB->get_field('local_prequran_workspace', 'id', ['slug' => $workspaceslug], IGNORE_MISSING);
    }

    $record = $DB->get_record('local_prequran_consumer', ['slug' => $slug], '*', IGNORE_MISSING);
    if ($record) {
        $consumerid = (int)$record->id;
        $record->name = $name;
        $record->consumer_type = $type;
        $record->status = 'active';
        if ($workspaceid > 0) {
            $record->primaryworkspaceid = $workspaceid;
        }
        foreach ([
            'supportemail',
            'emailfromname',
            'emailreplyto',
            'logourl',
            'themejson',
            'copyjson',
            'defaultpublicpath',
            'defaultdashboardpath',
        ] as $field) {
            if (array_key_exists($field, $settings)) {
                $record->{$field} = (string)$settings[$field];
            }
        }
        $record->timemodified = $now;
        $DB->update_record('local_prequran_consumer', $record);
    } else {
        $consumerid = (int)$DB->insert_record('local_prequran_consumer', (object)[
            'slug' => $slug,
            'name' => $name,
            'consumer_type' => $type,
            'status' => 'active',
            'primaryworkspaceid' => $workspaceid,
            'owneruserid' => 0,
            'supportemail' => (string)($settings['supportemail'] ?? ''),
            'logourl' => (string)($settings['logourl'] ?? ''),
            'themejson' => (string)($settings['themejson'] ?? json_encode(['seeded' => true], JSON_UNESCAPED_SLASHES)),
            'copyjson' => (string)($settings['copyjson'] ?? json_encode(['seeded' => true], JSON_UNESCAPED_SLASHES)),
            'defaultpublicpath' => (string)($settings['defaultpublicpath'] ?? '/'),
            'defaultdashboardpath' => (string)($settings['defaultdashboardpath'] ?? '/local/hubredirect/dashboard.php'),
            'emailfromname' => (string)($settings['emailfromname'] ?? $name),
            'emailreplyto' => (string)($settings['emailreplyto'] ?? ''),
            'createdby' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }

    if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_consumer_domain'))) {
        return $consumerid;
    }

    foreach ($domains as $domainrow) {
        $domain = strtolower(trim((string)($domainrow[0] ?? '')));
        if ($domain === '') {
            continue;
        }
        $domaintype = trim((string)($domainrow[1] ?? 'public'));
        $isprimary = (int)($domainrow[2] ?? 0);
        $existing = $DB->get_record('local_prequran_consumer_domain', ['domain' => $domain], '*', IGNORE_MISSING);
        if ($existing) {
            $existing->consumerid = $consumerid;
            if ($workspaceid > 0) {
                $existing->workspaceid = $workspaceid;
            }
            $existing->domain_type = $domaintype;
            $existing->isprimary = $isprimary;
            $existing->status = 'active';
            $existing->verificationstatus = 'seeded';
            $existing->verifiedat = $existing->verifiedat ?: $now;
            $existing->timemodified = $now;
            $DB->update_record('local_prequran_consumer_domain', $existing);
        } else {
            $DB->insert_record('local_prequran_consumer_domain', (object)[
                'consumerid' => $consumerid,
                'workspaceid' => $workspaceid,
                'domain' => $domain,
                'domain_type' => $domaintype,
                'isprimary' => $isprimary,
                'sslstatus' => 'not_checked',
                'verificationstatus' => 'seeded',
                'verifiedat' => $now,
                'status' => 'active',
                'createdby' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
    }

    return $consumerid;
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
            xmldb_local_prequran_field_char('student_middle_name', 100),
            xmldb_local_prequran_field_char('student_access_type', 40, 'managed'),
            xmldb_local_prequran_field_char('date_of_birth', 20),
            xmldb_local_prequran_field_char('timezone', 100, 'UTC'),
            xmldb_local_prequran_field_char('primary_language', 100),
            xmldb_local_prequran_field_char('preferred_teaching_language', 100),
            xmldb_local_prequran_field_char('language', 100),
            xmldb_local_prequran_field_int('age_years', 10, 0),
            xmldb_local_prequran_field_char('age_band', 40),
            xmldb_local_prequran_field_char('current_grade', 80),
            xmldb_local_prequran_field_char('school_curriculum', 120),
            xmldb_local_prequran_field_char('current_school_name', 255),
            xmldb_local_prequran_field_char('student_lives_with', 80),
            xmldb_local_prequran_field_char('primary_learning_goal', 255),
            xmldb_local_prequran_field_text('medical_safety_notes'),
            xmldb_local_prequran_field_char('preferred_class_format', 80),
            xmldb_local_prequran_field_char('preferred_group_size', 80),
            xmldb_local_prequran_field_char('preferred_teacher_gender', 40),
            xmldb_local_prequran_field_char('school_term', 80),
            xmldb_local_prequran_field_char('islamic_program_interest', 80),
            xmldb_local_prequran_field_char('quran_reading_level', 80),
            xmldb_local_prequran_field_char('tajweed_level', 80),
            xmldb_local_prequran_field_char('memorization_status', 80),
            xmldb_local_prequran_field_char('memorized_portion', 255),
            xmldb_local_prequran_field_char('arabic_reading_ability', 80),
            xmldb_local_prequran_field_text('prior_islamic_studies'),
            xmldb_local_prequran_field_char('islamic_learning_goal', 255),
            xmldb_local_prequran_field_char('previous_learning_method', 80),
            xmldb_local_prequran_field_char('tafsir_level', 80),
            xmldb_local_prequran_field_text('islamic_notes'),
            xmldb_local_prequran_field_char('course_type', 120, 'pre_quraan'),
            xmldb_local_prequran_field_char('current_level', 100),
            xmldb_local_prequran_field_char('tajweed_sub_level', 40),
            xmldb_local_prequran_field_char('learning_base', 100),
            xmldb_local_prequran_field_char('country', 100),
            xmldb_local_prequran_field_char('city', 100),
            xmldb_local_prequran_field_char('gender', 40),
            xmldb_local_prequran_field_char('parent_name', 255),
            xmldb_local_prequran_field_char('parent_relationship', 40),
            xmldb_local_prequran_field_char('parent_relationship_other', 255),
            xmldb_local_prequran_field_char('parent_email', 255),
            xmldb_local_prequran_field_char('parent_phone', 100),
            xmldb_local_prequran_field_char('emergency_contact_name', 255),
            xmldb_local_prequran_field_char('emergency_contact_phone', 100),
            xmldb_local_prequran_field_int('parent_email_enabled', 1, 1),
            xmldb_local_prequran_field_int('live_class_consent', 1, 0),
            xmldb_local_prequran_field_int('recording_consent', 1, 0),
            xmldb_local_prequran_field_text('consent_notes'),
            xmldb_local_prequran_field_text('availability'),
            xmldb_local_prequran_field_text('parent_preferences'),
            xmldb_local_prequran_field_char('enrollment_approval_status', 40, 'approved'),
            xmldb_local_prequran_field_int('enrollment_approvedby'),
            xmldb_local_prequran_field_int('enrollment_approvedat'),
            xmldb_local_prequran_field_text('enrollment_approval_notes'),
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
            new xmldb_index('preqstudprof_course_ix', XMLDB_INDEX_NOTUNIQUE, ['course_type', 'status']),
            new xmldb_index('preqstudprof_parent_ix', XMLDB_INDEX_NOTUNIQUE, ['parent_email']),
            new xmldb_index('preqstudprof_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['live_class_consent', 'recording_consent']),
            new xmldb_index('preqstudprof_enroll_ix', XMLDB_INDEX_NOTUNIQUE, ['enrollment_approval_status', 'enrollment_approvedat']),
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
            xmldb_local_prequran_field_char('course_type', 120, 'pre_quraan'),
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
            new xmldb_index('preqgrpool_course_ix', XMLDB_INDEX_NOTUNIQUE, ['course_type', 'status']),
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
            xmldb_local_prequran_field_char('course_type', 120, 'pre_quraan'),
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
            new xmldb_index('preqclassgrp_course_ix', XMLDB_INDEX_NOTUNIQUE, ['course_type', 'status']),
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

function xmldb_local_prequran_ensure_referral_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_referrer'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_char('referrer_code', 5),
            xmldb_local_prequran_field_char('name', 255),
            xmldb_local_prequran_field_char('contact', 255),
            xmldb_local_prequran_field_char('phone', 100),
            xmldb_local_prequran_field_char('email', 255),
            xmldb_local_prequran_field_char('city', 100),
            xmldb_local_prequran_field_char('state', 100),
            xmldb_local_prequran_field_char('country', 100),
            xmldb_local_prequran_field_char('preferred_contact', 40, 'email'),
            xmldb_local_prequran_field_char('status', 40, 'active'),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqref_user_uix', XMLDB_KEY_UNIQUE, ['userid']),
            new xmldb_key('preqref_code_uix', XMLDB_KEY_UNIQUE, ['referrer_code']),
        ],
        [
            new xmldb_index('preqref_status_ix', XMLDB_INDEX_NOTUNIQUE, ['status', 'country', 'city']),
            new xmldb_index('preqref_contact_ix', XMLDB_INDEX_NOTUNIQUE, ['contact']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_referral'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('referrerid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_int('datereferred'),
            xmldb_local_prequran_field_int('effectiveat'),
            xmldb_local_prequran_field_char('referral_status', 40, 'pending'),
            xmldb_local_prequran_field_int('dateexpires'),
            xmldb_local_prequran_field_char('referrer_name', 255),
            xmldb_local_prequran_field_char('referrer_contact_number', 100),
            xmldb_local_prequran_field_char('referrer_email', 255),
            xmldb_local_prequran_field_char('referrer_city', 100),
            xmldb_local_prequran_field_char('referrer_state', 100),
            xmldb_local_prequran_field_char('referrer_country', 100),
            xmldb_local_prequran_field_char('commission_amount', 40),
            xmldb_local_prequran_field_char('commission_rate', 40),
            xmldb_local_prequran_field_char('commission_currency', 10, 'USD'),
            xmldb_local_prequran_field_int('approvedat'),
            xmldb_local_prequran_field_int('approvedby'),
            xmldb_local_prequran_field_char('payment_status', 40, 'unpaid'),
            xmldb_local_prequran_field_int('paidat'),
            xmldb_local_prequran_field_char('payment_reference', 120),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqrefl_student_uix', XMLDB_KEY_UNIQUE, ['studentid']),
        ],
        [
            new xmldb_index('preqrefl_ref_ix', XMLDB_INDEX_NOTUNIQUE, ['referrerid', 'referral_status']),
            new xmldb_index('preqrefl_status_ix', XMLDB_INDEX_NOTUNIQUE, ['referral_status', 'dateexpires']),
            new xmldb_index('preqrefl_pay_ix', XMLDB_INDEX_NOTUNIQUE, ['payment_status', 'paidat']),
        ]
    );
}

function xmldb_local_prequran_ensure_referrer_contact_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $referrertable = new xmldb_table('local_prequran_referrer');
    foreach ([
        xmldb_local_prequran_field_char('email', 255),
        xmldb_local_prequran_field_char('state', 100),
    ] as $field) {
        xmldb_local_prequran_add_field_if_missing($dbman, $referrertable, $field);
    }

    $referraltable = new xmldb_table('local_prequran_referral');
    foreach ([
        xmldb_local_prequran_field_int('effectiveat'),
        xmldb_local_prequran_field_char('referrer_name', 255),
        xmldb_local_prequran_field_char('referrer_contact_number', 100),
        xmldb_local_prequran_field_char('referrer_email', 255),
        xmldb_local_prequran_field_char('referrer_city', 100),
        xmldb_local_prequran_field_char('referrer_state', 100),
        xmldb_local_prequran_field_char('referrer_country', 100),
    ] as $field) {
        xmldb_local_prequran_add_field_if_missing($dbman, $referraltable, $field);
    }
    xmldb_local_prequran_add_index_if_missing(
        $dbman,
        $referraltable,
        new xmldb_index('preqrefl_effect_ix', XMLDB_INDEX_NOTUNIQUE, ['effectiveat', 'referral_status'])
    );
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
            xmldb_local_prequran_field_char('parent_relationship', 40),
            xmldb_local_prequran_field_char('parent_relationship_other', 255),
            xmldb_local_prequran_field_char('parent_email', 255),
            xmldb_local_prequran_field_char('parent_phone', 100),
            xmldb_local_prequran_field_char('emergency_contact_name', 255),
            xmldb_local_prequran_field_char('emergency_contact_phone', 100),
            xmldb_local_prequran_field_char('student_firstname', 100),
            xmldb_local_prequran_field_char('student_middle_name', 100),
            xmldb_local_prequran_field_char('student_lastname', 100),
            xmldb_local_prequran_field_char('student_display_name', 255),
            xmldb_local_prequran_field_char('student_access_type', 40, 'managed'),
            xmldb_local_prequran_field_char('student_email', 255),
            xmldb_local_prequran_field_char('date_of_birth', 20),
            xmldb_local_prequran_field_int('age_years', 10, 0),
            xmldb_local_prequran_field_char('gender', 40),
            xmldb_local_prequran_field_char('current_grade', 80),
            xmldb_local_prequran_field_char('school_curriculum', 120),
            xmldb_local_prequran_field_char('current_school_name', 255),
            xmldb_local_prequran_field_char('student_lives_with', 80),
            xmldb_local_prequran_field_char('primary_learning_goal', 255),
            xmldb_local_prequran_field_text('medical_safety_notes'),
            xmldb_local_prequran_field_char('preferred_class_format', 80),
            xmldb_local_prequran_field_char('preferred_group_size', 80),
            xmldb_local_prequran_field_char('preferred_teacher_gender', 40),
            xmldb_local_prequran_field_char('school_term', 80),
            xmldb_local_prequran_field_char('islamic_program_interest', 80),
            xmldb_local_prequran_field_char('quran_reading_level', 80),
            xmldb_local_prequran_field_char('tajweed_level', 80),
            xmldb_local_prequran_field_char('memorization_status', 80),
            xmldb_local_prequran_field_char('memorized_portion', 255),
            xmldb_local_prequran_field_char('arabic_reading_ability', 80),
            xmldb_local_prequran_field_text('prior_islamic_studies'),
            xmldb_local_prequran_field_char('islamic_learning_goal', 255),
            xmldb_local_prequran_field_char('previous_learning_method', 80),
            xmldb_local_prequran_field_char('tafsir_level', 80),
            xmldb_local_prequran_field_text('islamic_notes'),
            xmldb_local_prequran_field_char('country', 100),
            xmldb_local_prequran_field_char('city', 100),
            xmldb_local_prequran_field_char('timezone', 100, 'UTC'),
            xmldb_local_prequran_field_char('primary_language', 100),
            xmldb_local_prequran_field_char('preferred_teaching_language', 100),
            xmldb_local_prequran_field_text('other_languages'),
            xmldb_local_prequran_field_char('current_level', 100),
            xmldb_local_prequran_field_char('tajweed_sub_level', 40),
            xmldb_local_prequran_field_char('learning_base', 100),
            xmldb_local_prequran_field_text('availability_json'),
            xmldb_local_prequran_field_text('availability_summary'),
            xmldb_local_prequran_field_text('parent_preferences'),
            xmldb_local_prequran_field_int('parent_email_enabled', 1, 1),
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

function xmldb_local_prequran_ensure_intake_guardian_contact_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $intaketable = new xmldb_table('local_prequran_intake_request');
    foreach ([
        xmldb_local_prequran_field_char('parent_relationship', 40),
        xmldb_local_prequran_field_char('parent_relationship_other', 255),
        xmldb_local_prequran_field_char('emergency_contact_name', 255),
        xmldb_local_prequran_field_char('emergency_contact_phone', 100),
    ] as $field) {
        xmldb_local_prequran_add_field_if_missing($dbman, $intaketable, $field);
    }

    $profiletable = new xmldb_table('local_prequran_student_profile');
    foreach ([
        xmldb_local_prequran_field_char('parent_relationship', 40),
        xmldb_local_prequran_field_char('parent_relationship_other', 255),
        xmldb_local_prequran_field_char('emergency_contact_name', 255),
        xmldb_local_prequran_field_char('emergency_contact_phone', 100),
    ] as $field) {
        xmldb_local_prequran_add_field_if_missing($dbman, $profiletable, $field);
    }
}

function xmldb_local_prequran_ensure_consumer_classification_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $consumertable = new xmldb_table('local_prequran_consumer');
    foreach ([
        xmldb_local_prequran_field_char('faith_subcategory', 80),
        xmldb_local_prequran_field_char('teaching_method', 40, 'regular'),
        xmldb_local_prequran_field_char('operator_type', 40, 'private_entity'),
    ] as $field) {
        xmldb_local_prequran_add_field_if_missing($dbman, $consumertable, $field);
    }
}

function xmldb_local_prequran_ensure_consumer_website_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $consumertable = new xmldb_table('local_prequran_consumer');
    foreach ([
        xmldb_local_prequran_field_char('website_mode', 40, 'hosted'),
        xmldb_local_prequran_field_text('externalwebsiteurl'),
        xmldb_local_prequran_field_char('domainmanagement', 40, 'consumer_managed'),
        xmldb_local_prequran_field_char('portallabel', 120, 'Learning portal'),
        xmldb_local_prequran_field_char('brandingsource', 40, 'eduplatform_settings'),
        xmldb_local_prequran_field_char('intakelocation', 40, 'eduplatform'),
        xmldb_local_prequran_field_char('integrationmethod', 40, 'links'),
        xmldb_local_prequran_field_text('returnurl'),
    ] as $field) {
        xmldb_local_prequran_add_field_if_missing($dbman, $consumertable, $field);
    }
}

function xmldb_local_prequran_ensure_primary_education_intake_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $fields = [
        xmldb_local_prequran_field_char('current_grade', 80),
        xmldb_local_prequran_field_char('school_curriculum', 120),
        xmldb_local_prequran_field_char('current_school_name', 255),
        xmldb_local_prequran_field_char('student_lives_with', 80),
        xmldb_local_prequran_field_char('primary_learning_goal', 255),
        xmldb_local_prequran_field_text('medical_safety_notes'),
        xmldb_local_prequran_field_char('preferred_class_format', 80),
        xmldb_local_prequran_field_char('preferred_group_size', 80),
        xmldb_local_prequran_field_char('preferred_teacher_gender', 40),
        xmldb_local_prequran_field_char('school_term', 80),
    ];

    foreach ([
        new xmldb_table('local_prequran_intake_request'),
        new xmldb_table('local_prequran_student_profile'),
    ] as $table) {
        foreach ($fields as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $field);
        }
    }
}

function xmldb_local_prequran_ensure_islamic_studies_intake_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $fields = [
        xmldb_local_prequran_field_char('islamic_program_interest', 80),
        xmldb_local_prequran_field_char('quran_reading_level', 80),
        xmldb_local_prequran_field_char('tajweed_level', 80),
        xmldb_local_prequran_field_char('memorization_status', 80),
        xmldb_local_prequran_field_char('memorized_portion', 255),
        xmldb_local_prequran_field_char('arabic_reading_ability', 80),
        xmldb_local_prequran_field_text('prior_islamic_studies'),
        xmldb_local_prequran_field_char('islamic_learning_goal', 255),
        xmldb_local_prequran_field_char('previous_learning_method', 80),
        xmldb_local_prequran_field_char('tafsir_level', 80),
        xmldb_local_prequran_field_text('islamic_notes'),
    ];

    foreach ([
        new xmldb_table('local_prequran_intake_request'),
        new xmldb_table('local_prequran_student_profile'),
    ] as $table) {
        foreach ($fields as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $field);
        }
    }
}

function xmldb_local_prequran_ensure_christian_studies_intake_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $fields = [
        xmldb_local_prequran_field_char('christian_program_interest', 80),
        xmldb_local_prequran_field_char('bible_reading_level', 80),
        xmldb_local_prequran_field_char('bible_knowledge_level', 80),
        xmldb_local_prequran_field_char('christian_studies_level', 80),
        xmldb_local_prequran_field_text('prior_christian_studies'),
        xmldb_local_prequran_field_char('christian_previous_learning_method', 80),
        xmldb_local_prequran_field_char('christian_learning_goal', 255),
        xmldb_local_prequran_field_text('christian_notes'),
    ];

    foreach ([
        new xmldb_table('local_prequran_intake_request'),
        new xmldb_table('local_prequran_student_profile'),
    ] as $table) {
        foreach ($fields as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $field);
        }
    }
}

function xmldb_local_prequran_ensure_higher_education_intake_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $fields = [
        xmldb_local_prequran_field_char('higher_application_level', 80),
        xmldb_local_prequran_field_char('higher_program_field', 255),
        xmldb_local_prequran_field_char('higher_specialization', 255),
        xmldb_local_prequran_field_char('higher_highest_qualification', 80),
        xmldb_local_prequran_field_char('higher_previous_institution', 255),
        xmldb_local_prequran_field_char('higher_qualification_title', 255),
        xmldb_local_prequran_field_char('higher_completion_year', 20),
        xmldb_local_prequran_field_char('higher_academic_result', 120),
        xmldb_local_prequran_field_char('higher_academic_status', 80),
        xmldb_local_prequran_field_char('higher_admission_route', 80),
        xmldb_local_prequran_field_char('higher_transfer_credits', 20),
        xmldb_local_prequran_field_char('higher_study_mode', 40),
        xmldb_local_prequran_field_char('higher_study_load', 40),
        xmldb_local_prequran_field_char('higher_preferred_intake', 120),
        xmldb_local_prequran_field_text('higher_research_interest'),
        xmldb_local_prequran_field_char('higher_funding_method', 80),
        xmldb_local_prequran_field_char('higher_financial_aid_interest', 20),
        xmldb_local_prequran_field_text('higher_support_needs'),
    ];

    foreach ([
        new xmldb_table('local_prequran_intake_request'),
        new xmldb_table('local_prequran_student_profile'),
    ] as $table) {
        foreach ($fields as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $field);
        }
    }
}

function xmldb_local_prequran_ensure_technical_training_intake_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $fields = [
        xmldb_local_prequran_field_char('technical_program', 80),
        xmldb_local_prequran_field_char('technical_specialization', 255),
        xmldb_local_prequran_field_char('technical_training_level', 80),
        xmldb_local_prequran_field_char('technical_previous_experience', 80),
        xmldb_local_prequran_field_char('technical_previous_learning_method', 80),
        xmldb_local_prequran_field_char('technical_experience_duration', 40),
        xmldb_local_prequran_field_char('technical_employment_status', 80),
        xmldb_local_prequran_field_char('technical_employer_workshop', 255),
        xmldb_local_prequran_field_char('technical_training_goal', 80),
        xmldb_local_prequran_field_char('technical_certification_sought', 255),
        xmldb_local_prequran_field_char('technical_training_format', 80),
        xmldb_local_prequran_field_char('technical_training_schedule', 40),
        xmldb_local_prequran_field_text('technical_tools_experience'),
        xmldb_local_prequran_field_char('technical_tool_access', 40),
        xmldb_local_prequran_field_char('technical_digital_skill_level', 40),
        xmldb_local_prequran_field_char('technical_safety_training', 20),
        xmldb_local_prequran_field_char('technical_protective_equipment', 40),
        xmldb_local_prequran_field_text('technical_support_needs'),
        xmldb_local_prequran_field_text('technical_notes'),
    ];

    foreach ([
        new xmldb_table('local_prequran_intake_request'),
        new xmldb_table('local_prequran_student_profile'),
    ] as $table) {
        foreach ($fields as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $field);
        }
    }
}

function xmldb_local_prequran_ensure_professional_development_intake_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $fields = [
        xmldb_local_prequran_field_char('professional_area', 80),
        xmldb_local_prequran_field_char('professional_topic_skill', 255),
        xmldb_local_prequran_field_char('professional_current_role', 255),
        xmldb_local_prequran_field_char('professional_industry', 80),
        xmldb_local_prequran_field_char('professional_employment_status', 80),
        xmldb_local_prequran_field_char('professional_employer', 255),
        xmldb_local_prequran_field_char('professional_experience_years', 40),
        xmldb_local_prequran_field_char('professional_responsibility_level', 80),
        xmldb_local_prequran_field_char('professional_development_goal', 80),
        xmldb_local_prequran_field_char('professional_skill_level', 40),
        xmldb_local_prequran_field_char('professional_credential_sought', 255),
        xmldb_local_prequran_field_char('professional_certification_deadline', 20),
        xmldb_local_prequran_field_char('professional_learning_format', 80),
        xmldb_local_prequran_field_char('professional_learning_schedule', 40),
        xmldb_local_prequran_field_char('professional_course_intensity', 80),
        xmldb_local_prequran_field_char('professional_employer_sponsored', 40),
        xmldb_local_prequran_field_char('professional_cpd_required', 20),
        xmldb_local_prequran_field_char('professional_cpd_credits', 40),
        xmldb_local_prequran_field_text('professional_workplace_outcome'),
        xmldb_local_prequran_field_text('professional_support_needs'),
        xmldb_local_prequran_field_text('professional_notes'),
    ];

    foreach ([
        new xmldb_table('local_prequran_intake_request'),
        new xmldb_table('local_prequran_student_profile'),
    ] as $table) {
        foreach ($fields as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $field);
        }
    }
}

function xmldb_local_prequran_ensure_adult_learning_intake_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $fields = [
        xmldb_local_prequran_field_char('adult_learning_area', 80),
        xmldb_local_prequran_field_char('adult_subject_skill', 255),
        xmldb_local_prequran_field_char('adult_education_level', 80),
        xmldb_local_prequran_field_char('adult_literacy_level', 80),
        xmldb_local_prequran_field_char('adult_numeracy_level', 80),
        xmldb_local_prequran_field_char('adult_digital_skill_level', 40),
        xmldb_local_prequran_field_char('adult_previous_experience', 80),
        xmldb_local_prequran_field_char('adult_previous_learning_method', 80),
        xmldb_local_prequran_field_char('adult_learning_goal', 80),
        xmldb_local_prequran_field_char('adult_employment_status', 80),
        xmldb_local_prequran_field_char('adult_learning_format', 80),
        xmldb_local_prequran_field_char('adult_learning_pace', 40),
        xmldb_local_prequran_field_char('adult_class_arrangement', 40),
        xmldb_local_prequran_field_char('adult_childcare_impact', 40),
        xmldb_local_prequran_field_char('adult_work_impact', 20),
        xmldb_local_prequran_field_char('adult_access_limitations', 40),
        xmldb_local_prequran_field_char('adult_learning_confidence', 40),
        xmldb_local_prequran_field_text('adult_support_needs'),
        xmldb_local_prequran_field_text('adult_notes'),
    ];

    foreach ([
        new xmldb_table('local_prequran_intake_request'),
        new xmldb_table('local_prequran_student_profile'),
    ] as $table) {
        foreach ($fields as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $table, clone $field);
        }
    }
}

function xmldb_local_prequran_ensure_data_operations_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_bulk_job'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('jobnumber', 80),
            xmldb_local_prequran_field_char('jobtype', 80, 'import'),
            xmldb_local_prequran_field_char('dataset', 120, 'workspace_members'),
            xmldb_local_prequran_field_char('status', 40, 'queued'),
            xmldb_local_prequran_field_char('sourceformat', 40, 'csv'),
            xmldb_local_prequran_field_int('totalrows'),
            xmldb_local_prequran_field_int('processedrows'),
            xmldb_local_prequran_field_int('successrows'),
            xmldb_local_prequran_field_int('errorrows'),
            xmldb_local_prequran_field_text('inputsample'),
            xmldb_local_prequran_field_text('resultjson'),
            xmldb_local_prequran_field_text('notes'),
            xmldb_local_prequran_field_int('startedat'),
            xmldb_local_prequran_field_int('completedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqbulk_ws_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'dataset', 'status']),
            new xmldb_index('preqbulk_num_ix', XMLDB_INDEX_NOTUNIQUE, ['jobnumber']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_migration_run'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('runnumber', 80),
            xmldb_local_prequran_field_char('migrationtype', 120, 'moodle_to_workspace'),
            xmldb_local_prequran_field_char('source_system', 120, 'moodle'),
            xmldb_local_prequran_field_char('target_system', 120, 'prequran_workspace'),
            xmldb_local_prequran_field_char('status', 40, 'planned'),
            xmldb_local_prequran_field_char('mode', 40, 'dry_run'),
            xmldb_local_prequran_field_text('scopejson'),
            xmldb_local_prequran_field_text('mappingjson'),
            xmldb_local_prequran_field_text('validationjson'),
            xmldb_local_prequran_field_text('rollbackplan'),
            xmldb_local_prequran_field_int('sourcecount'),
            xmldb_local_prequran_field_int('mappedcount'),
            xmldb_local_prequran_field_int('errorcount'),
            xmldb_local_prequran_field_int('startedat'),
            xmldb_local_prequran_field_int('completedat'),
            xmldb_local_prequran_field_int('approvedby'),
            xmldb_local_prequran_field_int('approvedat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqmigrun_ws_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqmigrun_num_ix', XMLDB_INDEX_NOTUNIQUE, ['runnumber']),
        ]
    );

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_backup_check'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('consumerid'),
            xmldb_local_prequran_field_int('workspaceid'),
            xmldb_local_prequran_field_char('checknumber', 80),
            xmldb_local_prequran_field_char('checktype', 120, 'readiness'),
            xmldb_local_prequran_field_char('status', 40, 'warning'),
            xmldb_local_prequran_field_char('severity', 40, 'medium'),
            xmldb_local_prequran_field_text('metricsjson'),
            xmldb_local_prequran_field_text('findingsjson'),
            xmldb_local_prequran_field_text('runbookurl'),
            xmldb_local_prequran_field_text('evidencenote'),
            xmldb_local_prequran_field_int('lastbackupat'),
            xmldb_local_prequran_field_int('lastrestoretestat'),
            xmldb_local_prequran_field_int('nextcheckat'),
            xmldb_local_prequran_field_int('createdby'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        ],
        [
            new xmldb_index('preqbackchk_ws_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
            new xmldb_index('preqbackchk_num_ix', XMLDB_INDEX_NOTUNIQUE, ['checknumber']),
            new xmldb_index('preqbackchk_next_ix', XMLDB_INDEX_NOTUNIQUE, ['nextcheckat', 'status']),
        ]
    );
}

function xmldb_local_prequran_ensure_support_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    $commthread = new xmldb_table('local_prequran_comm_thread');
    xmldb_local_prequran_add_field_if_missing($dbman, $commthread, xmldb_local_prequran_field_int('linkedticketid'));
    xmldb_local_prequran_add_field_if_missing($dbman, $commthread, xmldb_local_prequran_field_char('support_category', 80));
    xmldb_local_prequran_add_field_if_missing($dbman, $commthread, xmldb_local_prequran_field_char('support_priority', 40, 'normal'));
    xmldb_local_prequran_add_field_if_missing($dbman, $commthread, xmldb_local_prequran_field_int('assignedto'));
    xmldb_local_prequran_add_field_if_missing($dbman, $commthread, xmldb_local_prequran_field_int('assignmentgroupid'));
    xmldb_local_prequran_add_field_if_missing($dbman, $commthread, xmldb_local_prequran_field_char('visibility', 40, 'public'));
    xmldb_local_prequran_add_field_if_missing($dbman, $commthread, xmldb_local_prequran_field_text('contextjson'));
    xmldb_local_prequran_add_index_if_missing($dbman, $commthread, new xmldb_index('preqcommthr_tick_ix', XMLDB_INDEX_NOTUNIQUE, ['linkedticketid']));
    xmldb_local_prequran_add_index_if_missing($dbman, $commthread, new xmldb_index('preqcommthr_assign_ix', XMLDB_INDEX_NOTUNIQUE, ['assignmentgroupid', 'assignedto']));

    $commmessage = new xmldb_table('local_prequran_comm_message');
    xmldb_local_prequran_add_field_if_missing($dbman, $commmessage, xmldb_local_prequran_field_char('senderrole', 40));
    xmldb_local_prequran_add_field_if_missing($dbman, $commmessage, xmldb_local_prequran_field_char('visibility', 40, 'public'));
    xmldb_local_prequran_add_field_if_missing($dbman, $commmessage, xmldb_local_prequran_field_int('ticketid'));
    xmldb_local_prequran_add_index_if_missing($dbman, $commmessage, new xmldb_index('preqcommmsg_ticket_ix', XMLDB_INDEX_NOTUNIQUE, ['ticketid', 'visibility']));

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_support_policy'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('consumerid'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_int('livechat_enabled', 1, 0),
        xmldb_local_prequran_field_int('async_enabled', 1, 0),
        xmldb_local_prequran_field_int('student_helpdesk_enabled', 1, 0),
        xmldb_local_prequran_field_int('student_teacher_enabled', 1, 0),
        xmldb_local_prequran_field_int('parent_teacher_enabled', 1, 1),
        xmldb_local_prequran_field_char('student_free_text_policy', 40, 'topic_only'),
        xmldb_local_prequran_field_int('parent_visible_default', 1, 1),
        xmldb_local_prequran_field_char('business_timezone', 80, 'UTC'),
        xmldb_local_prequran_field_text('businesshoursjson'),
        xmldb_local_prequran_field_text('categoriesjson'),
        xmldb_local_prequran_field_text('routingjson'),
        xmldb_local_prequran_field_text('policyjson'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('updatedby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqsuppol_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqsuppol_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'status']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_support_queue'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('queuekey', 80),
        xmldb_local_prequran_field_char('name', 255),
        xmldb_local_prequran_field_char('category', 80),
        xmldb_local_prequran_field_int('restricted', 1, 0),
        xmldb_local_prequran_field_int('default_assigneeid'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_text('settingsjson'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqsupque_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqsupque_key_ix', XMLDB_INDEX_NOTUNIQUE, ['queuekey', 'workspaceid']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_support_sla'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('name', 255),
        xmldb_local_prequran_field_char('category', 80, 'other'),
        xmldb_local_prequran_field_char('priority', 40, 'normal'),
        xmldb_local_prequran_field_int('first_response_minutes', 10, 1440),
        xmldb_local_prequran_field_int('next_response_minutes', 10, 1440),
        xmldb_local_prequran_field_int('resolution_minutes', 10, 4320),
        xmldb_local_prequran_field_int('pause_on_waiting', 1, 0),
        xmldb_local_prequran_field_int('breach_warning_minutes', 10, 120),
        xmldb_local_prequran_field_int('escalationqueueid'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_text('calendarjson'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqsupsla_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqsupsla_match_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'category', 'priority']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_support_canned'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_char('responsekey', 120),
        xmldb_local_prequran_field_char('title', 255),
        xmldb_local_prequran_field_char('category', 80, 'other'),
        xmldb_local_prequran_field_text('body'),
        xmldb_local_prequran_field_int('restricted', 1, 0),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_int('createdby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqsupcan_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'category', 'status']),
        new xmldb_index('preqsupcan_key_ix', XMLDB_INDEX_NOTUNIQUE, ['responsekey', 'workspaceid']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_support_ticket'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_char('ticketnumber', 80),
        xmldb_local_prequran_field_int('sourceconversationid'),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('consumerid'),
        xmldb_local_prequran_field_int('studentid'),
        xmldb_local_prequran_field_int('requesterid'),
        xmldb_local_prequran_field_char('requesterrole', 40),
        xmldb_local_prequran_field_char('subject', 255),
        xmldb_local_prequran_field_text('description'),
        xmldb_local_prequran_field_char('category', 80, 'other'),
        xmldb_local_prequran_field_char('priority', 40, 'normal'),
        xmldb_local_prequran_field_char('status', 40, 'open'),
        xmldb_local_prequran_field_int('assigneeid'),
        xmldb_local_prequran_field_int('assignmentgroupid'),
        xmldb_local_prequran_field_int('sla_policy_id'),
        xmldb_local_prequran_field_int('sla_first_response_due'),
        xmldb_local_prequran_field_int('sla_next_response_due'),
        xmldb_local_prequran_field_int('sla_resolution_due'),
        xmldb_local_prequran_field_int('firstrespondedat'),
        xmldb_local_prequran_field_int('resolvedat'),
        xmldb_local_prequran_field_int('closedat'),
        xmldb_local_prequran_field_char('visibility', 40, 'public'),
        xmldb_local_prequran_field_text('metadatajson'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqsuptick_num_ix', XMLDB_INDEX_NOTUNIQUE, ['ticketnumber']),
        new xmldb_index('preqsuptick_conv_ix', XMLDB_INDEX_NOTUNIQUE, ['sourceconversationid']),
        new xmldb_index('preqsuptick_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status']),
        new xmldb_index('preqsuptick_ass_ix', XMLDB_INDEX_NOTUNIQUE, ['assignmentgroupid', 'assigneeid', 'status']),
        new xmldb_index('preqsuptick_sla_ix', XMLDB_INDEX_NOTUNIQUE, ['sla_resolution_due', 'status']),
        new xmldb_index('preqsuptick_stud_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'timecreated']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_support_event'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('ticketid'),
        xmldb_local_prequran_field_int('conversationid'),
        xmldb_local_prequran_field_int('messageid'),
        xmldb_local_prequran_field_int('actorid'),
        xmldb_local_prequran_field_char('eventtype', 80),
        xmldb_local_prequran_field_char('visibility', 40, 'staff_only'),
        xmldb_local_prequran_field_text('oldvalue'),
        xmldb_local_prequran_field_text('newvalue'),
        xmldb_local_prequran_field_text('body'),
        xmldb_local_prequran_field_text('detailsjson'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqsupevt_tick_ix', XMLDB_INDEX_NOTUNIQUE, ['ticketid', 'timecreated']),
        new xmldb_index('preqsupevt_conv_ix', XMLDB_INDEX_NOTUNIQUE, ['conversationid', 'timecreated']),
        new xmldb_index('preqsupevt_actor_ix', XMLDB_INDEX_NOTUNIQUE, ['actorid', 'timecreated']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_support_audit'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('ticketid'),
        xmldb_local_prequran_field_int('conversationid'),
        xmldb_local_prequran_field_int('messageid'),
        xmldb_local_prequran_field_int('actorid'),
        xmldb_local_prequran_field_char('action', 80),
        xmldb_local_prequran_field_char('targettype', 80),
        xmldb_local_prequran_field_int('targetid'),
        xmldb_local_prequran_field_text('detailsjson'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqsupaud_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'timecreated']),
        new xmldb_index('preqsupaud_tick_ix', XMLDB_INDEX_NOTUNIQUE, ['ticketid', 'timecreated']),
        new xmldb_index('preqsupaud_actor_ix', XMLDB_INDEX_NOTUNIQUE, ['actorid', 'timecreated']),
    ]);

    $now = time();
    $queues = [
        ['help_desk', 'Help Desk', 'technical_access', 0],
        ['teacher_support', 'Teacher Support', 'lesson_help', 0],
        ['finance_admin', 'Finance/Admin', 'payment_billing', 1],
        ['safeguarding', 'Safeguarding Restricted', 'safeguarding_concern', 1],
    ];
    foreach ($queues as $queue) {
        if (!$DB->record_exists('local_prequran_support_queue', ['workspaceid' => 0, 'queuekey' => $queue[0]])) {
            $DB->insert_record('local_prequran_support_queue', (object)[
                'workspaceid' => 0,
                'queuekey' => $queue[0],
                'name' => $queue[1],
                'category' => $queue[2],
                'restricted' => $queue[3],
                'default_assigneeid' => 0,
                'status' => 'active',
                'settingsjson' => json_encode(['seeded' => 'phase5']),
                'createdby' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
    }

    $sla = [
        'urgent' => [30, 60, 480, 60],
        'high' => [120, 240, 1440, 120],
        'normal' => [1440, 1440, 4320, 240],
        'low' => [2880, 2880, 10080, 480],
    ];
    foreach ($sla as $priority => $minutes) {
        if (!$DB->record_exists('local_prequran_support_sla', ['workspaceid' => 0, 'category' => 'other', 'priority' => $priority])) {
            $DB->insert_record('local_prequran_support_sla', (object)[
                'workspaceid' => 0,
                'name' => ucfirst($priority) . ' default support SLA',
                'category' => 'other',
                'priority' => $priority,
                'first_response_minutes' => $minutes[0],
                'next_response_minutes' => $minutes[1],
                'resolution_minutes' => $minutes[2],
                'pause_on_waiting' => 1,
                'breach_warning_minutes' => $minutes[3],
                'escalationqueueid' => 0,
                'status' => 'active',
                'calendarjson' => json_encode(['timezone' => 'UTC', 'business_hours' => 'all']),
                'createdby' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
    }

    $canned = [
        ['received', 'We received your request', 'other', 'Thank you. We received your support request {{ticketnumber}} and will follow up here.'],
        ['need_more_info', 'Request more information', 'other', 'Thank you. Could you share a little more detail so we can help with {{subject}}?'],
        ['resolved_followup', 'Resolved follow-up', 'other', 'We believe {{ticketnumber}} is resolved. Please reply here if you still need help.'],
    ];
    foreach ($canned as $response) {
        if (!$DB->record_exists('local_prequran_support_canned', ['workspaceid' => 0, 'responsekey' => $response[0]])) {
            $DB->insert_record('local_prequran_support_canned', (object)[
                'workspaceid' => 0,
                'responsekey' => $response[0],
                'title' => $response[1],
                'category' => $response[2],
                'body' => $response[3],
                'restricted' => 0,
                'status' => 'active',
                'createdby' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
    }
}

function xmldb_local_prequran_ensure_teacher_marketplace_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $profiletable = new xmldb_table('local_prequran_teacher_profile');

    if ($dbman->table_exists($profiletable)) {
        foreach ([
            xmldb_local_prequran_field_int('marketplace_visible', 1, 0),
            xmldb_local_prequran_field_char('marketplace_status', 40, 'draft'),
            xmldb_local_prequran_field_text('marketplace_bio'),
            xmldb_local_prequran_field_text('marketplace_skills'),
            xmldb_local_prequran_field_text('marketplace_experience'),
            xmldb_local_prequran_field_text('marketplace_education'),
            xmldb_local_prequran_field_text('marketplace_teaching_style'),
            xmldb_local_prequran_field_text('marketplace_courses'),
            xmldb_local_prequran_field_text('teacher_work_models'),
            xmldb_local_prequran_field_text('service_modes'),
            xmldb_local_prequran_field_char('subject_language', 100),
            xmldb_local_prequran_field_text('subject_areas'),
            xmldb_local_prequran_field_text('subject_other'),
            xmldb_local_prequran_field_text('age_groups'),
            xmldb_local_prequran_field_text('general_levels'),
            xmldb_local_prequran_field_text('workspace_preferences'),
            xmldb_local_prequran_field_int('years_experience'),
            xmldb_local_prequran_field_text('institution_experience'),
            xmldb_local_prequran_field_text('application_json'),
            xmldb_local_prequran_field_char('vetting_status', 40, 'not_reviewed'),
            xmldb_local_prequran_field_text('vetting_summary'),
            xmldb_local_prequran_field_int('vetting_reviewedby'),
            xmldb_local_prequran_field_int('vetting_reviewedat'),
        ] as $field) {
            xmldb_local_prequran_add_field_if_missing($dbman, $profiletable, $field);
        }

        xmldb_local_prequran_add_index_if_missing(
            $dbman,
            $profiletable,
            new xmldb_index('preqtprof_market_ix', XMLDB_INDEX_NOTUNIQUE, ['marketplace_visible', 'marketplace_status', 'status'])
        );
        xmldb_local_prequran_add_index_if_missing(
            $dbman,
            $profiletable,
            new xmldb_index('preqtprof_vetting_ix', XMLDB_INDEX_NOTUNIQUE, ['vetting_status', 'vetting_reviewedat'])
        );
    }

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_teacher_request'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_int('teacherid'),
            xmldb_local_prequran_field_int('parentid'),
            xmldb_local_prequran_field_int('studentid'),
            xmldb_local_prequran_field_char('request_status', 40, 'new'),
            xmldb_local_prequran_field_text('message'),
            xmldb_local_prequran_field_int('threadid'),
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
            new xmldb_index('preqtreq_teacher_ix', XMLDB_INDEX_NOTUNIQUE, ['teacherid', 'request_status']),
            new xmldb_index('preqtreq_parent_ix', XMLDB_INDEX_NOTUNIQUE, ['parentid', 'timecreated']),
            new xmldb_index('preqtreq_student_ix', XMLDB_INDEX_NOTUNIQUE, ['studentid', 'request_status']),
            new xmldb_index('preqtreq_thread_ix', XMLDB_INDEX_NOTUNIQUE, ['threadid']),
        ]
    );
}

function xmldb_local_prequran_ensure_institution_data_scoping_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $profiletable = new xmldb_table('local_prequran_teacher_profile');
    if ($dbman->table_exists($profiletable)) {
        xmldb_local_prequran_add_field_if_missing($dbman, $profiletable, xmldb_local_prequran_field_int('workspaceid'));
        xmldb_local_prequran_add_index_if_missing(
            $dbman,
            $profiletable,
            new xmldb_index('preqtprof_work_ix', XMLDB_INDEX_NOTUNIQUE, ['workspaceid', 'status'])
        );
    }
}

function xmldb_local_prequran_ensure_sqa_tracker_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_sqa_run'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('artifactkey', 60),
            xmldb_local_prequran_field_char('runid', 80),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_char('status', 40, 'saved'),
            xmldb_local_prequran_field_text('summaryjson'),
            xmldb_local_prequran_field_text('payloadjson'),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            new xmldb_key('preqsqarun_user_uix', XMLDB_KEY_UNIQUE, ['artifactkey', 'runid', 'userid']),
        ],
        [
            new xmldb_index('preqsqarun_user_ix', XMLDB_INDEX_NOTUNIQUE, ['userid', 'timemodified']),
            new xmldb_index('preqsqarun_art_ix', XMLDB_INDEX_NOTUNIQUE, ['artifactkey', 'timemodified']),
        ]
    );
}

function xmldb_local_prequran_ensure_safenet_schema(): void {
    global $DB;

    $dbman = $DB->get_manager();
    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_safenet_dev'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('consumerid'),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('childid'),
        xmldb_local_prequran_field_int('parentid'),
        xmldb_local_prequran_field_char('clientid', 64),
        xmldb_local_prequran_field_char('label', 255),
        xmldb_local_prequran_field_char('platform', 40, 'other'),
        xmldb_local_prequran_field_char('status', 40, 'active'),
        xmldb_local_prequran_field_char('policy', 40, 'childsafe'),
        xmldb_local_prequran_field_int('policy_until'),
        xmldb_local_prequran_field_char('syncstatus', 40, 'pending'),
        xmldb_local_prequran_field_int('lastseen'),
        xmldb_local_prequran_field_int('enrolledby'),
        xmldb_local_prequran_field_int('timecreated'),
        xmldb_local_prequran_field_int('timemodified'),
    ], [
        new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
        new xmldb_key('preqsafedev_client_uix', XMLDB_KEY_UNIQUE, ['clientid']),
    ], [
        new xmldb_index('preqsafedev_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'workspaceid', 'status']),
        new xmldb_index('preqsafedev_child_ix', XMLDB_INDEX_NOTUNIQUE, ['childid', 'status']),
        new xmldb_index('preqsafedev_parent_ix', XMLDB_INDEX_NOTUNIQUE, ['parentid', 'status']),
        new xmldb_index('preqsafedev_sync_ix', XMLDB_INDEX_NOTUNIQUE, ['syncstatus', 'timemodified']),
    ]);

    xmldb_local_prequran_create_table_if_missing($dbman, new xmldb_table('local_prequran_safenet_evt'), [
        xmldb_local_prequran_field_id(),
        xmldb_local_prequran_field_int('consumerid'),
        xmldb_local_prequran_field_int('workspaceid'),
        xmldb_local_prequran_field_int('deviceid'),
        xmldb_local_prequran_field_int('actorid'),
        xmldb_local_prequran_field_char('action', 64),
        xmldb_local_prequran_field_text('detailsjson'),
        xmldb_local_prequran_field_int('timecreated'),
    ], [new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id'])], [
        new xmldb_index('preqsafeevt_dev_ix', XMLDB_INDEX_NOTUNIQUE, ['deviceid', 'timecreated']),
        new xmldb_index('preqsafeevt_cons_ix', XMLDB_INDEX_NOTUNIQUE, ['consumerid', 'workspaceid', 'timecreated']),
    ]);
}

function xmldb_local_prequran_ensure_safenet_schedule_fields(): void {
    global $DB;
    $dbman = $DB->get_manager();
    $table = new xmldb_table('local_prequran_safenet_dev');
    if (!$dbman->table_exists($table)) {
        return;
    }
    $schedulejson = new xmldb_field('schedulejson', XMLDB_TYPE_TEXT, null, null, null, null, null, 'policy_until');
    if (!$dbman->field_exists($table, $schedulejson)) {
        $dbman->add_field($table, $schedulejson);
    }
    $schedapplied = new xmldb_field('sched_applied', XMLDB_TYPE_CHAR, '40', null, XMLDB_NOTNULL, null, '', 'schedulejson');
    if (!$dbman->field_exists($table, $schedapplied)) {
        $dbman->add_field($table, $schedapplied);
    }
    $alertedat = new xmldb_field('alerted_at', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0', 'sched_applied');
    if (!$dbman->field_exists($table, $alertedat)) {
        $dbman->add_field($table, $alertedat);
    }
}
