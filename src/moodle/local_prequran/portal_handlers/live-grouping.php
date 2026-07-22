<?php
// ---- report: live-grouping (student grouping / class-group management) ---------
// Ported from local_hubredirect/live_grouping.php via live_grouping_portallib
// (pqlgrp_*). Dispatched from portal_data.php AFTER token auth: $claims is
// verified, $USER is the token user, JSON exception handler + CORS headers are
// installed. The legacy page stays live in parallel and is untouched.
//
// GET  ?report=live-grouping&token=…[&workspaceid=]
//      -> the grouping console state exactly as the legacy page renders it:
//         metrics, recent student profiles, matching pools, ranked teacher
//         options (generic + per-pool), class groups (with live capacity), and
//         the top suggested assignments (+ names + course-type labels).
// POST body JSON {"do": …}:
//      do=save_profile    (legacy action=save_profile)
//      do=create_pool     (legacy action=create_pool)
//      do=create_group    (legacy action=create_group)
//      do=assign_student  (legacy action=assign_student)
// The legacy write branches read their fields with optional_param() /
// pqlgrp_trim_param() / pqlgrp_email_param() (built for a form POST). Token auth
// already replaces confirm_sesskey(), so the only bridge needed is to map the
// JSON body onto $_POST before running each branch VERBATIM; every DB write and
// pqlgrp_audit() then runs byte-for-byte as on the page, and the legacy
// re-render-with-message is returned as ok JSON instead.
// Access is the legacy page check verbatim: pqh_current_workspace_id resolution
// + pqh_user_can_manage_workspace(), with pqh_access_denied(...) -> pqpd_fail(403,
// same message). The legacy page never calls pqh_live_security_audit, so there is
// none to keep.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_grouping_portallib.php');

// The legacy page loads this config at the top level; the handler loads it here
// (the portallib carries ZERO top-level statements besides its guard).
$pqlgrpoptions = require($CFG->dirroot . '/local/hubredirect/student_intake_config.php');

$ispost = (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST');
$body = [];
if ($ispost) {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid JSON body.');
    }
}

// ---- page preamble + ENTRY access check (legacy denial message, verbatim) ------
$requestedworkspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqpd_fail(403, 'Choose a school workspace you manage before using student grouping.');
}

$ready = pqlgrp_required_ready();
$now = time();

if ($ispost) {
    // The legacy page only processes writes when the grouping tables are ready
    // (otherwise it silently re-renders its "tables not ready" empty state); the
    // API says so explicitly with the same message the page shows.
    if (!$ready) {
        pqpd_fail(403, 'Grouping tables are not ready. Run the Moodle plugin upgrade for local_prequran, then return to this page.');
    }
    // Bridge the JSON body onto $_POST so the verbatim branches (built on
    // optional_param / pqlgrp_trim_param / pqlgrp_email_param) read it unchanged.
    foreach ($body as $key => $value) {
        if (is_scalar($value)) {
            $_POST[$key] = (string)$value;
        }
    }
    $action = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    $message = '';
    try {
        if ($action === 'save_profile') {
            // -- write: save_profile (legacy action=save_profile, verbatim) --
            $userid = optional_param('userid', 0, PARAM_INT);
            if ($userid <= 0) {
                throw new invalid_parameter_exception('Choose a valid student before saving the profile.');
            }
            $age = max(0, min(25, optional_param('age_years', 0, PARAM_INT)));
            $primarylanguage = pqlgrp_trim_param('primary_language');
            $otherlanguages = pqlgrp_trim_param('language');
            $language = $primarylanguage !== '' ? $primarylanguage : $otherlanguages;
            $record = (object)[
                'userid' => $userid,
                'timezone' => pqlgrp_trim_param('timezone', 'UTC'),
                'language' => $language,
                'age_years' => $age,
                'age_band' => pqlgrp_profile_age_band($age),
                'current_level' => pqlgrp_trim_param('current_level'),
                'learning_base' => pqlgrp_trim_param('learning_base'),
                'country' => pqlgrp_trim_param('country'),
                'city' => pqlgrp_trim_param('city'),
                'gender' => pqlgrp_trim_param('gender'),
                'availability' => pqlgrp_trim_param('availability'),
                'parent_preferences' => pqlgrp_trim_param('parent_preferences'),
                'status' => pqlgrp_trim_param('status', 'active'),
                'timemodified' => $now,
            ];
            pqlgrp_set_profile_field($record, 'student_display_name', pqlgrp_trim_param('student_display_name'));
            pqlgrp_set_profile_field($record, 'date_of_birth', pqlgrp_trim_param('date_of_birth'));
            pqlgrp_set_profile_field($record, 'primary_language', $primarylanguage);
            pqlgrp_set_profile_field($record, 'special_needs', pqlgrp_trim_param('special_needs', 'no'));
            pqlgrp_set_profile_field($record, 'course_type', pqlgrp_trim_param('course_type', 'pre_quraan'));
            pqlgrp_set_profile_field($record, 'parent_name', pqlgrp_trim_param('parent_name'));
            pqlgrp_set_profile_field($record, 'parent_email', pqlgrp_email_param('parent_email'));
            pqlgrp_set_profile_field($record, 'parent_phone', pqlgrp_trim_param('parent_phone'));
            pqlgrp_set_profile_field($record, 'live_class_consent', optional_param('live_class_consent', 0, PARAM_BOOL) ? 1 : 0);
            pqlgrp_set_profile_field($record, 'recording_consent', optional_param('recording_consent', 0, PARAM_BOOL) ? 1 : 0);
            pqlgrp_set_profile_field($record, 'consent_notes', pqlgrp_trim_param('consent_notes'));
            pqlgrp_set_profile_field($record, 'workspaceid', $workspaceid);
            $existingselect = ['userid' => $userid];
            if (pqlgrp_table_has_field('local_prequran_student_profile', 'workspaceid')) {
                $existingselect['workspaceid'] = $workspaceid;
            }
            $existing = $DB->get_record('local_prequran_student_profile', $existingselect);
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_student_profile', $record);
                $profileid = (int)$existing->id;
            } else {
                $record->createdby = (int)$USER->id;
                $record->timecreated = $now;
                $profileid = (int)$DB->insert_record('local_prequran_student_profile', $record);
            }
            pqlgrp_audit('grouping_profile_saved', 'student', $userid, [
                'profileid' => $profileid,
                'live_class_consent' => optional_param('live_class_consent', 0, PARAM_BOOL) ? 1 : 0,
                'recording_consent' => optional_param('recording_consent', 0, PARAM_BOOL) ? 1 : 0,
            ]);
            $message = 'Student intake profile saved.';
        } elseif ($action === 'create_pool') {
            // -- write: create_pool (legacy action=create_pool, verbatim) --
            $record = (object)[
                'title' => pqlgrp_trim_param('title'),
                'course_type' => pqlgrp_trim_param('course_type', 'pre_quraan'),
                'timezone' => pqlgrp_trim_param('timezone', 'UTC'),
                'language' => pqlgrp_trim_param('language'),
                'age_min' => max(0, min(25, optional_param('age_min', 0, PARAM_INT))),
                'age_max' => max(1, min(99, optional_param('age_max', 99, PARAM_INT))),
                'level_min' => pqlgrp_trim_param('level_min'),
                'level_max' => pqlgrp_trim_param('level_max'),
                'learning_base' => pqlgrp_trim_param('learning_base'),
                'country' => pqlgrp_trim_param('country'),
                'city' => pqlgrp_trim_param('city'),
                'gender_policy' => pqlgrp_trim_param('gender_policy', 'flexible'),
                'schedule_preferences' => pqlgrp_trim_param('schedule_preferences'),
                'rule_notes' => pqlgrp_trim_param('rule_notes'),
                'max_students' => max(1, min(15, optional_param('max_students', 9, PARAM_INT))),
                'status' => 'active',
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            if (pqlgrp_table_has_field('local_prequran_group_pool', 'workspaceid')) {
                $record->workspaceid = $workspaceid;
            }
            $id = (int)$DB->insert_record('local_prequran_group_pool', $record);
            pqlgrp_audit('grouping_pool_created', 'pool', $id, ['title' => $record->title]);
            $message = 'Matching pool created.';
        } elseif ($action === 'create_group') {
            // -- write: create_group (legacy action=create_group, verbatim) --
            $poolid = optional_param('poolid', 0, PARAM_INT);
            $pool = $poolid > 0 ? $DB->get_record('local_prequran_group_pool', ['id' => $poolid]) : null;
            if ($pool && pqlgrp_table_has_field('local_prequran_group_pool', 'workspaceid')
                    && (int)($pool->workspaceid ?? 0) > 0
                    && (int)$pool->workspaceid !== $workspaceid) {
                throw new invalid_parameter_exception('Choose a matching pool from the selected school workspace.');
            }
            $record = (object)[
                'poolid' => $poolid,
                'teacherid' => optional_param('teacherid', 0, PARAM_INT),
                'title' => pqlgrp_trim_param('title', $pool ? (string)$pool->title : ''),
                'course_type' => pqlgrp_trim_param('course_type', $pool ? (string)($pool->course_type ?? 'pre_quraan') : 'pre_quraan'),
                'timezone' => pqlgrp_trim_param('timezone', $pool ? (string)$pool->timezone : 'UTC'),
                'language' => pqlgrp_trim_param('language', $pool ? (string)$pool->language : ''),
                'current_level' => pqlgrp_trim_param('current_level', $pool ? (string)$pool->level_min : ''),
                'learning_base' => pqlgrp_trim_param('learning_base', $pool ? (string)$pool->learning_base : ''),
                'country' => pqlgrp_trim_param('country', $pool ? (string)$pool->country : ''),
                'city' => pqlgrp_trim_param('city', $pool ? (string)$pool->city : ''),
                'age_min' => max(0, min(25, optional_param('age_min', $pool ? (int)$pool->age_min : 0, PARAM_INT))),
                'age_max' => max(1, min(99, optional_param('age_max', $pool ? (int)$pool->age_max : 99, PARAM_INT))),
                'gender_policy' => pqlgrp_trim_param('gender_policy', $pool ? (string)$pool->gender_policy : 'flexible'),
                'schedule_summary' => pqlgrp_trim_param('schedule_summary', $pool ? (string)$pool->schedule_preferences : ''),
                'max_students' => max(1, min(15, optional_param('max_students', $pool ? (int)$pool->max_students : 9, PARAM_INT))),
                'status' => 'open',
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            if (pqlgrp_table_has_field('local_prequran_class_group', 'workspaceid')) {
                $record->workspaceid = $workspaceid;
            }
            if ((int)$record->teacherid > 0 && !pqh_user_can_teach_in_workspace((int)$record->teacherid, $workspaceid)) {
                throw new invalid_parameter_exception('Choose a teacher assigned to this school workspace.');
            }
            if ((int)$record->teacherid <= 0) {
                [, $automatches] = pqlgrp_ranked_teacher_options($record, null, $workspaceid);
                if ($automatches) {
                    $record->teacherid = (int)$automatches[0]['userid'];
                }
            }
            $id = (int)$DB->insert_record('local_prequran_class_group', $record);
            pqlgrp_audit('class_group_created', 'group', $id, ['title' => $record->title, 'poolid' => $poolid, 'teacherid' => (int)$record->teacherid]);
            $message = 'Class group created.';
        } elseif ($action === 'assign_student') {
            // -- write: assign_student (legacy action=assign_student, verbatim) --
            $groupid = optional_param('groupid', 0, PARAM_INT);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $group = $groupid > 0 ? $DB->get_record('local_prequran_class_group', ['id' => $groupid]) : false;
            $profile = $studentid > 0 ? $DB->get_record('local_prequran_student_profile', ['userid' => $studentid]) : false;
            if (!$group) {
                throw new invalid_parameter_exception('Choose a valid class group before assigning a student.');
            }
            if (pqlgrp_table_has_field('local_prequran_class_group', 'workspaceid')
                    && (int)($group->workspaceid ?? 0) > 0
                    && (int)$group->workspaceid !== $workspaceid) {
                throw new invalid_parameter_exception('Choose a class group from the selected school workspace.');
            }
            if (!$profile) {
                throw new invalid_parameter_exception('Choose a valid student profile before assigning a group.');
            }
            if (pqlgrp_table_has_field('local_prequran_student_profile', 'workspaceid')
                    && (int)($profile->workspaceid ?? 0) > 0
                    && (int)$profile->workspaceid !== $workspaceid) {
                throw new invalid_parameter_exception('Choose a student from the selected school workspace.');
            }
            [$score, $matchstatus, $details] = pqlgrp_match_score($profile, $group);
            $record = (object)[
                'groupid' => $groupid,
                'poolid' => (int)$group->poolid,
                'studentid' => $studentid,
                'match_score' => $score,
                'match_status' => $matchstatus,
                'assignment_status' => 'active',
                'match_details' => $details,
                'assignedby' => (int)$USER->id,
                'timemodified' => $now,
            ];
            if (pqlgrp_table_has_field('local_prequran_group_member', 'workspaceid')) {
                $record->workspaceid = $workspaceid;
            }
            $existing = $DB->get_record('local_prequran_group_member', ['groupid' => $groupid, 'studentid' => $studentid]);
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_group_member', $record);
            } else {
                $record->timecreated = $now;
                $DB->insert_record('local_prequran_group_member', $record);
            }
            pqlgrp_audit('student_assigned_group', 'group', $groupid, ['studentid' => $studentid, 'score' => $score, 'status' => $matchstatus]);
            $message = 'Student assigned to group.';
        } else {
            pqpd_fail(400, 'Unknown live-grouping action.');
        }
    } catch (Throwable $e) {
        // Legacy sets $error and re-renders the page; the API returns it as 400.
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $message,
        'workspaceid' => $workspaceid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- GET: the grouping console state (same computation order as the page) ------
$profilewhere = [];
$profileparams = [];
if ($ready && pqlgrp_table_has_field('local_prequran_student_profile', 'workspaceid')) {
    $profilewhere[] = 'workspaceid = :workspaceid';
    $profileparams['workspaceid'] = $workspaceid;
}
$poolwhere = [];
$poolparams = [];
if ($ready && pqlgrp_table_has_field('local_prequran_group_pool', 'workspaceid')) {
    $poolwhere[] = 'workspaceid = :workspaceid';
    $poolparams['workspaceid'] = $workspaceid;
}
$profiles = $ready ? $DB->get_records_select(
    'local_prequran_student_profile',
    $profilewhere ? implode(' AND ', $profilewhere) : '',
    $profileparams,
    'timemodified DESC',
    '*',
    0,
    50
) : [];
$pools = $ready ? $DB->get_records_select(
    'local_prequran_group_pool',
    $poolwhere ? implode(' AND ', $poolwhere) : '',
    $poolparams,
    'timemodified DESC',
    '*',
    0,
    50
) : [];
$teacherprofiles = pqlgrp_teacher_profiles($workspaceid);
$teacherlinks = pqlgrp_teacher_link_data($teacherprofiles);
[$teachers, $teachermatches] = pqlgrp_ranked_teacher_options(null, $teacherprofiles, $workspaceid);
$teacheroptionsbypool = [];
$teachermatchesbypool = [];
$pooldefaults = [];
foreach ($pools as $pool) {
    [$poolteacheroptions, $poolteachermatches] = pqlgrp_ranked_teacher_options($pool, $teacherprofiles, $workspaceid);
    $poolid = (string)$pool->id;
    $teacheroptionsbypool[$poolid] = $poolteacheroptions;
    $teachermatchesbypool[$poolid] = array_slice($poolteachermatches, 0, 5);
    $pooldefaults[$poolid] = [
        'title' => (string)$pool->title,
        'course_type' => (string)($pool->course_type ?? 'pre_quraan'),
        'timezone' => (string)($pool->timezone ?? 'UTC'),
        'language' => (string)($pool->language ?? ''),
        'current_level' => (string)($pool->level_min ?? ''),
        'learning_base' => (string)($pool->learning_base ?? ''),
        'country' => (string)($pool->country ?? ''),
        'city' => (string)($pool->city ?? ''),
        'gender_policy' => (string)($pool->gender_policy ?? 'flexible'),
        'age_min' => (string)($pool->age_min ?? 0),
        'age_max' => (string)($pool->age_max ?? 99),
        'max_students' => (string)($pool->max_students ?? 9),
        'schedule_summary' => (string)($pool->schedule_preferences ?? ''),
    ];
}
$groups = [];
$recommendations = [];
$metrics = ['profiles' => 0, 'pools' => 0, 'groups' => 0, 'ungrouped' => 0];

if ($ready) {
    $groupwhere = '';
    $groupparams = [];
    if (pqlgrp_table_has_field('local_prequran_class_group', 'workspaceid')) {
        $groupwhere = 'WHERE g.workspaceid = :workspaceid';
        $groupparams['workspaceid'] = $workspaceid;
    }
    $groups = $DB->get_records_sql(
        "SELECT g.*,
                COALESCE(gmc.active_students, 0) AS active_students
           FROM {local_prequran_class_group} g
      LEFT JOIN (
                SELECT groupid, COUNT(1) AS active_students
                  FROM {local_prequran_group_member}
                 WHERE assignment_status = 'active'
              GROUP BY groupid
                ) gmc ON gmc.groupid = g.id
          {$groupwhere}
       ORDER BY g.timemodified DESC",
        $groupparams,
        0,
        50
    );
    $profilecountwhere = 'status = :status';
    $profilecountparams = ['status' => 'active'];
    if (pqlgrp_table_has_field('local_prequran_student_profile', 'workspaceid')) {
        $profilecountwhere .= ' AND workspaceid = :workspaceid';
        $profilecountparams['workspaceid'] = $workspaceid;
    }
    $poolcountwhere = 'status = :status';
    $poolcountparams = ['status' => 'active'];
    if (pqlgrp_table_has_field('local_prequran_group_pool', 'workspaceid')) {
        $poolcountwhere .= ' AND workspaceid = :workspaceid';
        $poolcountparams['workspaceid'] = $workspaceid;
    }
    $groupcountwhere = "status IN ('open', 'active')";
    $groupcountparams = [];
    if (pqlgrp_table_has_field('local_prequran_class_group', 'workspaceid')) {
        $groupcountwhere .= ' AND workspaceid = :workspaceid';
        $groupcountparams['workspaceid'] = $workspaceid;
    }
    $metrics['profiles'] = $DB->count_records_select('local_prequran_student_profile', $profilecountwhere, $profilecountparams);
    $metrics['pools'] = $DB->count_records_select('local_prequran_group_pool', $poolcountwhere, $poolcountparams);
    $metrics['groups'] = $DB->count_records_select('local_prequran_class_group', $groupcountwhere, $groupcountparams);
    $ungroupedworkspace = '';
    $ungroupedparams = ['workspaceid' => $workspaceid];
    if (pqlgrp_table_has_field('local_prequran_student_profile', 'workspaceid')) {
        $ungroupedworkspace = 'AND sp.workspaceid = :workspaceid';
    }
    $metrics['ungrouped'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_student_profile} sp
          WHERE sp.status = 'active'
            {$ungroupedworkspace}
            AND NOT EXISTS (
                SELECT 1
                  FROM {local_prequran_group_member} gm
                 WHERE gm.studentid = sp.userid
                   AND gm.assignment_status = 'active'
            )",
        $ungroupedworkspace !== '' ? $ungroupedparams : []
    );

    foreach ($profiles as $profile) {
        $best = null;
        foreach ($groups as $group) {
            if ((int)$group->active_students >= (int)$group->max_students) {
                continue;
            }
            [$score, $status, $details] = pqlgrp_match_score($profile, $group);
            if ($best === null || $score > $best['score']) {
                $best = ['student' => $profile, 'group' => $group, 'score' => $score, 'status' => $status, 'details' => $details];
            }
        }
        if ($best !== null) {
            $recommendations[] = $best;
        }
    }
    usort($recommendations, static function(array $a, array $b): int {
        return $b['score'] <=> $a['score'];
    });
    $recommendations = array_slice($recommendations, 0, 20);
}

// -- Decorate for the client (names + labels the page renders inline via
// -- pqlgrp_user_name() and the course_types map). --
$coursetypes = $pqlgrpoptions['course_types'] ?? [];

$profilesout = [];
foreach ($profiles as $profile) {
    $profilesout[] = [
        'userid' => (int)$profile->userid,
        'student_display_name' => (string)($profile->student_display_name ?? ''),
        'timezone' => (string)($profile->timezone ?? ''),
        'language' => (string)($profile->language ?? ''),
        'course_type' => (string)($profile->course_type ?? ''),
        'current_level' => (string)($profile->current_level ?? ''),
        'learning_base' => (string)($profile->learning_base ?? ''),
        'parent_name' => (string)($profile->parent_name ?? ''),
        'parent_email' => (string)($profile->parent_email ?? ''),
        'live_class_consent' => !empty($profile->live_class_consent) ? 1 : 0,
        'recording_consent' => !empty($profile->recording_consent) ? 1 : 0,
        'country' => (string)($profile->country ?? ''),
        'city' => (string)($profile->city ?? ''),
        'gender' => (string)($profile->gender ?? ''),
        'age_band' => (string)($profile->age_band ?? ''),
        'special_needs' => (string)($profile->special_needs ?? 'no'),
        'status' => (string)($profile->status ?? ''),
    ];
}

$poolsout = [];
foreach ($pools as $pool) {
    $poolsout[] = ['id' => (int)$pool->id, 'title' => (string)$pool->title];
}

$groupsout = [];
foreach ($groups as $group) {
    $groupsout[] = [
        'id' => (int)$group->id,
        'title' => (string)$group->title,
        'status' => (string)$group->status,
        'teacherid' => (int)$group->teacherid,
        'course_type' => (string)($group->course_type ?? ''),
        'language' => (string)$group->language,
        'current_level' => (string)$group->current_level,
        'learning_base' => (string)$group->learning_base,
        'timezone' => (string)$group->timezone,
        'gender_policy' => (string)$group->gender_policy,
        'age_min' => (int)$group->age_min,
        'age_max' => (int)$group->age_max,
        'country' => (string)$group->country,
        'city' => (string)$group->city,
        'active_students' => (int)$group->active_students,
        'max_students' => (int)$group->max_students,
        'schedule_summary' => (string)$group->schedule_summary,
    ];
}

$recommendationsout = [];
foreach ($recommendations as $rec) {
    $recommendationsout[] = [
        'studentid' => (int)$rec['student']->userid,
        'student_display_name' => (string)($rec['student']->student_display_name ?? ''),
        'student_level' => (string)$rec['student']->current_level,
        'group_id' => (int)$rec['group']->id,
        'group_title' => (string)$rec['group']->title,
        'score' => (int)$rec['score'],
        'details' => (string)$rec['details'],
    ];
}

$nameids = [];
foreach ($profiles as $profile) {
    $nameids[] = (int)$profile->userid;
}
foreach ($groups as $group) {
    $nameids[] = (int)$group->teacherid;
}
foreach ($recommendations as $rec) {
    $nameids[] = (int)$rec['student']->userid;
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'workspaceid' => $workspaceid,
    'course_types' => $coursetypes,
    'metrics' => $metrics,
    'profiles' => $profilesout,
    'pools' => $poolsout,
    'groups' => $groupsout,
    'recommendations' => $recommendationsout,
    'teachers' => (object)$teachers,
    'teacheroptionsbypool' => (object)$teacheroptionsbypool,
    'teachermatchesbypool' => (object)$teachermatchesbypool,
    'pooldefaults' => (object)$pooldefaults,
    'teacherlinks' => (object)$teacherlinks,
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/live_grouping.php?workspaceid=' . $workspaceid,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
