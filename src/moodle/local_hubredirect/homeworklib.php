<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_catalog.php');
require_once(__DIR__ . '/office_materials_lib.php');

function pqhh_ready(): bool {
    return pqh_table_exists_safe('local_prequran_homework')
        && pqh_table_exists_safe('local_prequran_homework_sub');
}

function pqhh_context_params(stdClass $consumercontext, int $workspaceid): array {
    $params = ['workspaceid' => $workspaceid];
    if (!empty($consumercontext->consumerslug)) {
        $params['consumer'] = (string)$consumercontext->consumerslug;
    }
    return $params;
}

function pqhh_consumer_id(stdClass $consumercontext): int {
    return (int)($consumercontext->consumerid ?? $consumercontext->id ?? 0);
}

function pqhh_user_can_assign(int $userid, int $workspaceid): bool {
    global $DB;
    if ($userid <= 0 || $workspaceid <= 0
            || !$DB->record_exists('local_prequran_workspace', ['id' => $workspaceid])) {
        return false;
    }
    if (pqh_user_can_teach_in_workspace($userid, $workspaceid)
            || pqh_user_can_manage_workspace($userid, $workspaceid)) {
        return true;
    }
    if ((int)$DB->get_field('local_prequran_workspace', 'ownerid', ['id' => $workspaceid], IGNORE_MISSING) === $userid) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_teacher_student')
            && $DB->record_exists('local_prequran_teacher_student', [
                'workspaceid' => $workspaceid,
                'teacherid' => $userid,
                'status' => 'active',
            ])) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_teacher_profile')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid')) {
        if ($DB->record_exists_select(
            'local_prequran_teacher_profile',
            'userid = :userid AND workspaceid = :workspaceid
             AND (status IS NULL OR status = :blank OR LOWER(status) NOT IN (:archived, :inactive, :rejected))',
            [
                'userid' => $userid, 'workspaceid' => $workspaceid, 'blank' => '',
                'archived' => 'archived', 'inactive' => 'inactive', 'rejected' => 'rejected',
            ]
        )) {
            return true;
        }
    }
    if (pqh_table_exists_safe('local_prequran_class_group')
            && pqh_table_has_field_safe('local_prequran_class_group', 'workspaceid')
            && $DB->record_exists_select(
                'local_prequran_class_group',
                'workspaceid = :workspaceid AND teacherid = :teacherid AND status <> :archived',
                ['workspaceid' => $workspaceid, 'teacherid' => $userid, 'archived' => 'archived']
            )) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_live_session')
            && pqh_table_has_field_safe('local_prequran_live_session', 'workspaceid')
            && $DB->record_exists_select(
                'local_prequran_live_session',
                'workspaceid = :workspaceid AND teacherid = :teacherid AND status <> :cancelled',
                ['workspaceid' => $workspaceid, 'teacherid' => $userid, 'cancelled' => 'cancelled']
            )) {
        return true;
    }
    return false;
}

function pqhh_resolve_teacher_workspace_id(int $userid, int $requestedid = 0, ?stdClass $consumercontext = null): int {
    global $DB, $SESSION;
    if ($userid <= 0) {
        return 0;
    }
    $consumercontext = $consumercontext ?: pqh_requested_consumer_context();
    $candidates = [];
    $add = static function(int $workspaceid) use (&$candidates): void {
        if ($workspaceid > 0) {
            $candidates[$workspaceid] = $workspaceid;
        }
    };
    $add($requestedid);
    $add((int)($SESSION->local_prequran_workspaceid ?? 0));

    if (pqh_table_exists_safe('local_prequran_teacher_student')
            && pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
        $rows = $DB->get_records_select(
            'local_prequran_teacher_student',
            'teacherid = :teacherid AND status = :status AND workspaceid > :zero',
            ['teacherid' => $userid, 'status' => 'active', 'zero' => 0],
            'timemodified DESC, id DESC',
            'id,workspaceid'
        );
        foreach ($rows as $row) {
            $add((int)$row->workspaceid);
        }
    }
    if (pqh_table_exists_safe('local_prequran_teacher_profile')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid')) {
        foreach ($DB->get_records_select(
            'local_prequran_teacher_profile',
            'userid = :userid AND workspaceid > :zero',
            ['userid' => $userid, 'zero' => 0],
            'timemodified DESC, id DESC',
            'id,workspaceid'
        ) as $row) {
            $add((int)$row->workspaceid);
        }
    }
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        foreach ($DB->get_records_select(
            'local_prequran_workspace_member',
            'userid = :userid AND workspace_role IN (:teacher, :assistant, :owner, :admin) AND status = :status',
            [
                'userid' => $userid, 'teacher' => 'teacher', 'assistant' => 'assistant_teacher',
                'owner' => 'owner', 'admin' => 'admin', 'status' => 'active',
            ],
            'timemodified DESC, id DESC',
            'id,workspaceid'
        ) as $row) {
            $add((int)$row->workspaceid);
        }
    }
    if (pqh_table_exists_safe('local_prequran_class_group')
            && pqh_table_has_field_safe('local_prequran_class_group', 'workspaceid')) {
        foreach ($DB->get_records_select(
            'local_prequran_class_group',
            'teacherid = :teacherid AND workspaceid > :zero AND status <> :archived',
            ['teacherid' => $userid, 'zero' => 0, 'archived' => 'archived'],
            'timemodified DESC, id DESC',
            'id,workspaceid'
        ) as $row) {
            $add((int)$row->workspaceid);
        }
    }
    if (pqh_table_exists_safe('local_prequran_live_session')
            && pqh_table_has_field_safe('local_prequran_live_session', 'workspaceid')) {
        foreach ($DB->get_records_select(
            'local_prequran_live_session',
            'teacherid = :teacherid AND workspaceid > :zero AND status <> :cancelled',
            ['teacherid' => $userid, 'zero' => 0, 'cancelled' => 'cancelled'],
            'timemodified DESC, id DESC',
            'id,workspaceid',
            0,
            20
        ) as $row) {
            $add((int)$row->workspaceid);
        }
    }
    if (pqh_table_exists_safe('local_prequran_workspace')) {
        foreach ($DB->get_records('local_prequran_workspace', ['ownerid' => $userid], 'timemodified DESC', 'id') as $row) {
            $add((int)$row->id);
        }
    }
    $add(pqh_user_primary_workspace_id($userid));
    $add((int)($consumercontext->workspaceid ?? 0));

    foreach ($candidates as $workspaceid) {
        if (pqhh_user_can_assign($userid, $workspaceid)) {
            $SESSION->local_prequran_workspaceid = $workspaceid;
            return $workspaceid;
        }
    }
    return 0;
}

function pqhh_teacher_students(int $teacherid, int $workspaceid): array {
    global $DB;
    if ($teacherid <= 0 || $workspaceid <= 0) {
        return [];
    }
    $studentids = [];
    if (pqh_table_exists_safe('local_prequran_teacher_student')) {
        foreach ($DB->get_records('local_prequran_teacher_student', [
            'teacherid' => $teacherid, 'status' => 'active',
        ], 'timemodified DESC', 'id,studentid,workspaceid') as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $studentids[$studentid] = $studentid;
            }
        }
    }
    if (pqh_table_exists_safe('local_prequran_group_member') && pqh_table_exists_safe('local_prequran_class_group')) {
        foreach ($DB->get_records_sql(
            "SELECT gm.studentid, cg.workspaceid
               FROM {local_prequran_group_member} gm
               JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
              WHERE cg.teacherid = :teacherid AND gm.assignment_status = :active
                AND cg.status <> :archived",
            ['teacherid' => $teacherid, 'active' => 'active', 'archived' => 'archived']
        ) as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $studentids[$studentid] = $studentid;
            }
        }
    }
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        foreach ($DB->get_records('local_prequran_workspace_member', [
            'workspaceid' => $workspaceid, 'workspace_role' => 'student', 'status' => 'active',
        ], '', 'id,userid') as $row) {
            if ((int)$row->userid > 0) {
                $studentids[(int)$row->userid] = (int)$row->userid;
            }
        }
    }
    if (!$studentids) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal(array_values($studentids), SQL_PARAMS_NAMED, 'homeworkstudent');
    return array_values($DB->get_records_select(
        'user',
        "id {$insql} AND deleted = :deleted AND suspended = :suspended",
        $params + ['deleted' => 0, 'suspended' => 0],
        'firstname ASC, lastname ASC, id ASC',
        'id,firstname,lastname,idnumber,email,username'
    ));
}

function pqhh_teacher_groups(int $teacherid, int $workspaceid, array $students): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_group_member') || !pqh_table_exists_safe('local_prequran_class_group')) {
        return [];
    }
    $allowedstudents = [];
    foreach ($students as $student) {
        $allowedstudents[(int)$student->id] = true;
    }
    $groups = [];
    foreach ($DB->get_records_sql(
        "SELECT gm.id, gm.studentid, gm.groupid, cg.title, cg.workspaceid
           FROM {local_prequran_group_member} gm
           JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
          WHERE cg.teacherid = :teacherid AND gm.assignment_status = :active
            AND cg.status <> :archived
       ORDER BY cg.title, gm.id",
        ['teacherid' => $teacherid, 'active' => 'active', 'archived' => 'archived']
    ) as $row) {
        $studentid = (int)$row->studentid;
        if (!isset($allowedstudents[$studentid])) {
            continue;
        }
        $groupid = (int)$row->groupid;
        if (!isset($groups[$groupid])) {
            $groups[$groupid] = (object)['id' => $groupid, 'title' => (string)$row->title, 'studentids' => []];
        }
        $groups[$groupid]->studentids[$studentid] = $studentid;
    }
    return array_values($groups);
}

function pqhh_assign_resource_material(int $workspaceid, int $materialid, int $studentid, int $actorid): void {
    global $DB;
    if ($materialid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        return;
    }
    $now = time();
    $assignment = $DB->get_record('local_prequran_workspace_mat_assign', [
        'workspaceid' => $workspaceid, 'materialid' => $materialid,
        'target_type' => 'student', 'targetid' => $studentid,
    ], '*', IGNORE_MISSING);
    $values = (object)[
        'workspaceid' => $workspaceid, 'materialid' => $materialid, 'target_type' => 'student',
        'targetid' => $studentid, 'status' => 'active', 'workflow_status' => 'assigned',
        'assignedby' => $actorid, 'startedat' => 0, 'completedat' => 0, 'reviewedby' => 0,
        'reviewedat' => 0, 'review_notes' => '', 'timemodified' => $now,
    ];
    if ($assignment) {
        $values->id = (int)$assignment->id;
        $DB->update_record('local_prequran_workspace_mat_assign', $values);
    } else {
        $values->timecreated = $now;
        $DB->insert_record('local_prequran_workspace_mat_assign', $values);
    }
}

function pqhh_user_enrolled_in_course(int $userid, int $courseid): bool {
    global $DB;
    return $userid > 0 && $courseid > 0 && $DB->record_exists_sql(
        "SELECT 1
           FROM {user_enrolments} ue
           JOIN {enrol} e ON e.id = ue.enrolid
          WHERE ue.userid = :userid AND e.courseid = :courseid
            AND ue.status = 0 AND e.status = 0",
        ['userid' => $userid, 'courseid' => $courseid]
    );
}

function pqhh_teacher_courses(array $students): array {
    $courses = [];
    foreach ($students as $student) {
        foreach (pqh_user_moodle_enrolment_courses((int)$student->id) as $courseid => $course) {
            $courses[(int)$courseid] = $course;
        }
    }
    uasort($courses, static fn(array $a, array $b): int => strcasecmp((string)$a['title'], (string)$b['title']));
    return $courses;
}

function pqhh_course_offering(int $workspaceid, int $courseid): ?stdClass {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_course_offering')) {
        return null;
    }
    return $DB->get_record('local_prequran_course_offering', [
        'workspaceid' => $workspaceid,
        'moodlecourseid' => $courseid,
    ], '*', IGNORE_MISSING) ?: null;
}

function pqhh_ensure_assessment(stdClass $homework): int {
    global $DB;
    $assessmentid = (int)($homework->assessmentid ?? 0);
    if ($assessmentid > 0 || (int)($homework->offeringid ?? 0) <= 0
            || !pqh_table_exists_safe('local_prequran_assessment')) {
        return $assessmentid;
    }
    $now = time();
    $assessmentid = (int)$DB->insert_record('local_prequran_assessment', (object)[
        'workspaceid' => (int)$homework->workspaceid,
        'offeringid' => (int)$homework->offeringid,
        'categoryid' => 0,
        'assessment_type' => 'homework',
        'title' => (string)$homework->title,
        'description' => (string)$homework->instructions,
        'max_points' => (string)$homework->maxpoints,
        'weight_override' => '',
        'duedate' => (int)$homework->duedate,
        'publishdate' => $now,
        'status' => 'published',
        'createdby' => (int)$homework->createdby,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $DB->set_field('local_prequran_homework', 'assessmentid', $assessmentid, ['id' => (int)$homework->id]);
    return $assessmentid;
}

function pqhh_publish_grade(stdClass $homework, stdClass $submission, int $graderid): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_grade')) {
        return;
    }
    $assessmentid = pqhh_ensure_assessment($homework);
    if ($assessmentid <= 0) {
        return;
    }
    $now = time();
    $record = $DB->get_record('local_prequran_grade', [
        'assessmentid' => $assessmentid,
        'studentid' => (int)$submission->studentid,
    ], '*', IGNORE_MISSING);
    $values = (object)[
        'workspaceid' => (int)$homework->workspaceid,
        'offeringid' => (int)$homework->offeringid,
        'assessmentid' => $assessmentid,
        'studentid' => (int)$submission->studentid,
        'score_points' => (string)$submission->scorepoints,
        'score_percent' => (string)$submission->scorepercent,
        'letter_grade' => '',
        'status' => 'published',
        'teacher_feedback' => (string)$submission->feedback,
        'rubric_json' => '',
        'gradedby' => $graderid,
        'gradedat' => $now,
        'reviewedby' => $graderid,
        'reviewedat' => $now,
        'publishedby' => $graderid,
        'publishedat' => $now,
        'timemodified' => $now,
    ];
    if ($record) {
        $values->id = (int)$record->id;
        $DB->update_record('local_prequran_grade', $values);
    } else {
        $values->timecreated = $now;
        $DB->insert_record('local_prequran_grade', $values);
    }
}

function pqhh_status_label(string $status): string {
    return [
        'assigned' => 'Not started', 'in_progress' => 'In progress', 'submitted' => 'Awaiting review',
        'returned' => 'Changes requested', 'graded' => 'Graded',
    ][$status] ?? ucfirst(str_replace('_', ' ', $status));
}
