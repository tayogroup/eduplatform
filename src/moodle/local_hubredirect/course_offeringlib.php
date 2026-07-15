<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_catalog.php');
require_once($GLOBALS['CFG']->dirroot . '/local/prequran/notificationlib.php');

function pqco_table_ready(): bool {
    return pqh_table_exists_safe('local_prequran_course_offering')
        && pqh_table_exists_safe('local_prequran_course_enrol_req');
}

function pqco_date_to_time(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? (int)$time : 0;
}

function pqco_time_to_date(int $time): string {
    return $time > 0 ? date('Y-m-d', $time) : '';
}

function pqco_offering_has_ended($offering, int $now = 0): bool {
    $now = $now > 0 ? $now : time();
    $enddate = (int)($offering->enddate ?? 0);
    if ($enddate <= 0) {
        return false;
    }
    return ($enddate + DAYSECS) <= $now;
}

function pqco_offering_accepts_requests($offering, int $now = 0): bool {
    return (string)($offering->status ?? '') === 'published' && !pqco_offering_has_ended($offering, $now);
}

function pqco_offering_availability_label($offering, int $open, int $now = 0): string {
    $now = $now > 0 ? $now : time();
    if ((string)($offering->status ?? '') === 'closed') {
        return 'Closed';
    }
    if ((string)($offering->status ?? '') === 'archived') {
        return 'Archived';
    }
    if (pqco_offering_has_ended($offering, $now)) {
        return 'Enrollment closed';
    }
    if ($open <= 0) {
        return 'Full';
    }
    $startdate = (int)($offering->startdate ?? 0);
    if ($startdate > $now) {
        return 'Upcoming';
    }
    return 'Available';
}

function pqco_status_options(): array {
    return [
        'draft' => 'Draft',
        'published' => 'Published',
        'closed' => 'Closed',
        'archived' => 'Archived',
    ];
}

function pqco_learner_visible_statuses(): array {
    return ['published', 'closed'];
}

function pqco_visibility_options(): array {
    return [
        'workspace' => 'Workspace members',
        'institution_public' => 'Institution portal',
    ];
}

function pqco_workspace_course_options(stdClass $consumercontext, array $fallback = [], bool $publiconly = false): array {
    global $DB;

    $workspaceid = (int)($consumercontext->workspaceid ?? 0);
    if ($workspaceid <= 0 || !pqco_table_ready()) {
        return $workspaceid > 0 ? [] : $fallback;
    }
    $params = [$workspaceid, 'published'];
    $where = 'workspaceid = ? AND status = ?';
    if ($publiconly) {
        $where .= ' AND visibility = ?';
        $params[] = 'institution_public';
    }
    try {
        $offerings = $DB->get_records_select(
            'local_prequran_course_offering',
            $where,
            $params,
            'startdate ASC, title ASC'
        );
    } catch (Throwable $e) {
        return [];
    }
    $options = [];
    foreach ($offerings as $offering) {
        if (pqco_offering_has_ended($offering)) {
            continue;
        }
        $key = pqh_normalize_course_key((string)$offering->course_key);
        if ($key === '') {
            continue;
        }
        $label = trim((string)$offering->title);
        $options[$key] = $label !== '' ? $label : (string)($fallback[$key] ?? $key);
    }
    return $options;
}

function pqco_moodle_courses(): array {
    global $DB;

    $courses = [];
    try {
        $rows = $DB->get_records_sql(
            "SELECT id, fullname, shortname, idnumber, visible
               FROM {course}
              WHERE id <> :siteid
           ORDER BY fullname ASC",
            ['siteid' => SITEID]
        );
    } catch (Throwable $e) {
        return [];
    }
    foreach ($rows as $course) {
        $label = trim((string)$course->fullname);
        if ($label === '') {
            $label = (string)$course->shortname;
        }
        $meta = [];
        if ((string)$course->shortname !== '') {
            $meta[] = (string)$course->shortname;
        }
        if ((string)$course->idnumber !== '') {
            $meta[] = (string)$course->idnumber;
        }
        if (!(int)$course->visible) {
            $meta[] = 'hidden';
        }
        $courses[(int)$course->id] = $label . ($meta ? ' (' . implode(' / ', $meta) . ')' : '');
    }
    return $courses;
}

function pqco_slug_segment(string $value, string $fallback): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '_', $value) ?? '';
    $value = trim($value, '_');
    if ($value === '') {
        $value = $fallback;
    }
    return substr($value, 0, 42);
}

function pqco_unique_moodle_shortname(string $base): string {
    global $DB;

    $base = strtoupper(pqco_slug_segment($base, 'PQCO'));
    $base = substr($base, 0, 82);
    $candidate = $base;
    $suffix = 1;
    while ($DB->record_exists('course', ['shortname' => $candidate])) {
        $suffix++;
        $candidate = substr($base, 0, 82 - strlen((string)$suffix) - 1) . '-' . $suffix;
    }
    return $candidate;
}

function pqco_consumer_category_id($consumercontext, $workspace): int {
    global $CFG, $DB;

    $consumerid = (int)($consumercontext->consumerid ?? 0);
    $consumername = trim((string)($consumercontext->consumername ?? ''));
    if ($consumername === '') {
        $consumername = trim((string)($workspace->name ?? 'Institution'));
    }
    if ($consumername === '') {
        $consumername = 'Institution';
    }
    $idnumber = $consumerid > 0
        ? 'pqco_consumer_' . $consumerid
        : 'pqco_consumer_' . pqco_slug_segment($consumername, 'institution');

    $existingid = (int)$DB->get_field('course_categories', 'id', ['idnumber' => $idnumber], IGNORE_MISSING);
    if ($existingid > 0) {
        return $existingid;
    }

    require_once($CFG->dirroot . '/course/lib.php');
    $category = core_course_category::create((object)[
        'name' => $consumername,
        'idnumber' => $idnumber,
        'parent' => 0,
        'visible' => 1,
    ]);
    return (int)$category->id;
}

function pqco_ensure_manual_enrolment_enabled(int $courseid): bool {
    global $CFG;

    if ($courseid <= 0) {
        return false;
    }
    require_once($CFG->libdir . '/enrollib.php');
    $manual = enrol_get_plugin('manual');
    if (!$manual) {
        return false;
    }
    $instances = enrol_get_instances($courseid, false);
    foreach ($instances as $instance) {
        if ((string)$instance->enrol === 'manual') {
            if ((int)$instance->status !== ENROL_INSTANCE_ENABLED) {
                $manual->update_status($instance, ENROL_INSTANCE_ENABLED);
            }
            return true;
        }
    }
    $course = get_course($courseid);
    $manual->add_instance($course, ['status' => ENROL_INSTANCE_ENABLED]);
    return true;
}

function pqco_create_moodle_course_for_offering($consumercontext, $workspace, array $form, array $catalog): int {
    global $CFG;

    $coursekey = pqh_normalize_course_key((string)($form['course_key'] ?? ''));
    if ($coursekey === '' || !isset($catalog[$coursekey])) {
        return 0;
    }
    require_once($CFG->dirroot . '/course/lib.php');

    $title = trim((string)($form['title'] ?? ''));
    if ($title === '') {
        $title = (string)$catalog[$coursekey]['title'];
    }
    $categoryid = pqco_consumer_category_id($consumercontext, $workspace);
    $workspaceid = (int)($workspace->id ?? 0);
    $shortnamebase = implode('_', array_filter([
        'pqco',
        pqco_slug_segment((string)($consumercontext->consumerslug ?? ''), 'consumer'),
        $workspaceid > 0 ? 'w' . $workspaceid : '',
        pqco_slug_segment($coursekey, 'course'),
        date('YmdHis'),
    ]));
    $summary = trim((string)($form['summary'] ?? ''));
    $course = create_course((object)[
        'fullname' => $title,
        'shortname' => pqco_unique_moodle_shortname($shortnamebase),
        'category' => $categoryid,
        'summary' => $summary,
        'summaryformat' => FORMAT_HTML,
        'format' => 'topics',
        'visible' => 1,
        'startdate' => pqco_date_to_time((string)($form['startdate'] ?? '')),
        'enddate' => pqco_date_to_time((string)($form['enddate'] ?? '')),
    ]);
    pqco_ensure_manual_enrolment_enabled((int)$course->id);
    return (int)$course->id;
}

function pqqco_create_moodle_course_for_offering($consumercontext, $workspace, array $form, array $catalog): int {
    return pqco_create_moodle_course_for_offering($consumercontext, $workspace, $form, $catalog);
}

function pqco_offering_counts(array $offeringids): array {
    global $DB;

    if (!$offeringids || !pqh_table_exists_safe('local_prequran_course_enrol_req')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal(array_values($offeringids), SQL_PARAMS_NAMED, 'offering');
    $approvedstatuses = ['approved', 'enrolled'];
    [$statussql, $statusparams] = $DB->get_in_or_equal($approvedstatuses, SQL_PARAMS_NAMED, 'status');
    $rows = $DB->get_records_sql(
        "SELECT offeringid, COUNT(1) AS approved_count
           FROM {local_prequran_course_enrol_req}
          WHERE offeringid {$insql}
            AND status {$statussql}
       GROUP BY offeringid",
        $params + $statusparams
    );
    $counts = [];
    foreach ($rows as $row) {
        $counts[(int)$row->offeringid] = (int)$row->approved_count;
    }
    return $counts;
}

function pqco_open_seats($offering, array $counts): int {
    $capacity = (int)($offering->capacity ?? 0);
    if ($capacity <= 0) {
        return 999999;
    }
    return max(0, $capacity - (int)($counts[(int)$offering->id] ?? 0));
}

function pqco_request_status_label(string $status): string {
    $labels = [
        'pending' => 'Pending approval',
        'approved' => 'Approved - pending sync',
        'enrolled' => 'Enrolled',
        'drop_requested' => 'Drop requested',
        'dropped' => 'Dropped',
        'rejected' => 'Rejected',
        'cancelled' => 'Cancelled',
    ];
    return $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

function pqco_user_has_moodle_offering_access(int $userid, string $coursekey): bool {
    global $DB;

    $coursekey = pqh_normalize_course_key($coursekey);
    if ($userid <= 0 || $coursekey === '' || !pqco_table_ready()) {
        return false;
    }
    [$statussql, $statusparams] = $DB->get_in_or_equal(pqco_learner_visible_statuses(), SQL_PARAMS_NAMED, 'offeringstatus');
    try {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT o.id, o.moodlecourseid
               FROM {local_prequran_course_enrol_req} r
               JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
              WHERE r.studentid = :userid
                AND o.course_key = :coursekey
                AND r.status = :requeststatus
                AND COALESCE(r.moodleenrolledat, 0) > 0
                AND o.status {$statussql}",
            ['userid' => $userid, 'coursekey' => $coursekey, 'requeststatus' => 'enrolled'] + $statusparams
        );
    } catch (Throwable $e) {
        return false;
    }
    foreach ($rows as $row) {
        if (pqco_user_has_active_moodle_enrolment($userid, (int)$row->moodlecourseid)) {
            return true;
        }
    }
    return false;
}

function pqco_user_has_course_offering_request(int $userid, string $coursekey): bool {
    global $DB;

    $coursekey = pqh_normalize_course_key($coursekey);
    if ($userid <= 0 || $coursekey === '' || !pqco_table_ready()) {
        return false;
    }
    try {
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_course_enrol_req} r
               JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
              WHERE r.studentid = :userid
                AND o.course_key = :coursekey",
            ['userid' => $userid, 'coursekey' => $coursekey]
        );
    } catch (Throwable $e) {
        return false;
    }
}

function pqco_user_has_active_moodle_enrolment(int $userid, int $courseid): bool {
    global $DB;

    if ($userid <= 0 || $courseid <= 0) {
        return false;
    }
    try {
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {course} c
               JOIN {enrol} e ON e.courseid = c.id
               JOIN {user_enrolments} ue ON ue.enrolid = e.id
              WHERE c.id = :courseid
                AND c.visible = 1
                AND e.enrol = :enrolmethod
                AND e.status = 0
                AND ue.userid = :userid
                AND ue.status = 0",
            ['courseid' => $courseid, 'enrolmethod' => 'manual', 'userid' => $userid]
        );
    } catch (Throwable $e) {
        return false;
    }
}

function pqco_course_audit(string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;

    if (!pqh_table_exists_safe('local_prequran_course_audit')) {
        return;
    }
    $offeringid = (int)($details['offeringid'] ?? 0);
    $requestid = (int)($details['requestid'] ?? 0);
    $record = (object)[
        'consumerid' => (int)($details['consumerid'] ?? 0),
        'workspaceid' => (int)($details['workspaceid'] ?? 0),
        'offeringid' => $offeringid,
        'requestid' => $requestid,
        'studentid' => (int)($details['studentid'] ?? 0),
        'actorid' => (int)($details['actorid'] ?? ($USER->id ?? 0)),
        'action' => core_text::substr($action, 0, 80),
        'targettype' => core_text::substr($targettype, 0, 80),
        'targetid' => $targetid,
        'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
    ];
    try {
        $DB->insert_record('local_prequran_course_audit', $record);
    } catch (Throwable $e) {
        debugging('Could not write course audit event: ' . $e->getMessage(), DEBUG_DEVELOPER);
    }
}

function pqco_workspace_admin_ids(int $workspaceid): array {
    global $DB;

    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    [$rolesql, $roleparams] = $DB->get_in_or_equal(['owner', 'admin'], SQL_PARAMS_NAMED, 'role');
    $roleparams['workspaceid'] = $workspaceid;
    $roleparams['status'] = 'active';
    $ids = [];
    foreach ($DB->get_records_sql(
        "SELECT userid
           FROM {local_prequran_workspace_member}
          WHERE workspaceid = :workspaceid
            AND status = :status
            AND workspace_role {$rolesql}",
        $roleparams
    ) as $row) {
        $userid = (int)$row->userid;
        if ($userid > 0) {
            $ids[$userid] = $userid;
        }
    }
    if (!$ids) {
        foreach (get_admins() as $admin) {
            $ids[(int)$admin->id] = (int)$admin->id;
        }
    }
    return array_values($ids);
}

function pqco_notify_user(int $recipientid, string $subject, string $message, moodle_url $url, string $urlname, string $eventtype, array $auditdetails = []): bool {
    $sent = local_prequran_notify_user_live_update(0, $recipientid, $subject, $message, $url, $urlname, $eventtype, (int)($auditdetails['studentid'] ?? 0));
    pqco_course_audit($sent ? 'course_notification_sent' : 'course_notification_failed', 'user', $recipientid, $auditdetails + [
        'recipientid' => $recipientid,
        'eventtype' => $eventtype,
        'subject' => $subject,
    ]);
    return $sent;
}

function pqco_notify_workspace_admins(int $workspaceid, string $subject, string $message, moodle_url $url, string $urlname, string $eventtype, array $auditdetails = []): int {
    $sent = 0;
    foreach (pqco_workspace_admin_ids($workspaceid) as $adminid) {
        if (pqco_notify_user((int)$adminid, $subject, $message, $url, $urlname, $eventtype, $auditdetails + ['workspaceid' => $workspaceid])) {
            $sent++;
        }
    }
    return $sent;
}

function pqco_notify_student_and_parents(int $studentid, string $subject, string $message, moodle_url $url, string $urlname, string $eventtype, array $auditdetails = []): int {
    $recipients = [];
    if ($studentid > 0) {
        $recipients[$studentid] = $studentid;
    }
    foreach (local_prequran_notify_parent_ids_for_student($studentid) as $parentid) {
        $recipients[(int)$parentid] = (int)$parentid;
    }
    $sent = 0;
    foreach ($recipients as $recipientid) {
        if (pqco_notify_user((int)$recipientid, $subject, $message, $url, $urlname, $eventtype, $auditdetails + ['studentid' => $studentid])) {
            $sent++;
        }
    }
    return $sent;
}

function pqco_notify_new_enrollment_request($request, $offering, int $workspaceid, array $urlparams = []): int {
    $url = new moodle_url('/local/hubredirect/course_offerings.php', $urlparams + ['workspaceid' => $workspaceid, 'request_status' => 'pending']);
    $student = core_user::get_user((int)$request->studentid);
    $studentname = $student ? fullname($student) : 'Student #' . (int)$request->studentid;
    return pqco_notify_workspace_admins(
        $workspaceid,
        'New course enrollment request',
        $studentname . ' requested enrollment in ' . (string)$offering->title . '.',
        $url,
        'Review enrollment request',
        'course_enrollment_requested',
        [
            'consumerid' => (int)($request->consumerid ?? 0),
            'workspaceid' => $workspaceid,
            'offeringid' => (int)$request->offeringid,
            'requestid' => (int)$request->id,
            'studentid' => (int)$request->studentid,
        ]
    );
}

function pqco_notify_request_outcome($request, string $eventtype, string $subject, string $message, int $workspaceid, array $urlparams = []): int {
    $url = new moodle_url('/local/hubredirect/course_catalog_browse.php', $urlparams + ['workspaceid' => $workspaceid]);
    return pqco_notify_student_and_parents(
        (int)$request->studentid,
        $subject,
        $message,
        $url,
        'Open course catalog',
        $eventtype,
        [
            'consumerid' => (int)($request->consumerid ?? 0),
            'workspaceid' => $workspaceid,
            'offeringid' => (int)$request->offeringid,
            'requestid' => (int)$request->id,
            'studentid' => (int)$request->studentid,
            'status' => (string)$request->status,
        ]
    );
}

function pqco_pending_request_count(int $workspaceid): int {
    global $DB;

    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_course_enrol_req')) {
        return 0;
    }
    return (int)$DB->count_records('local_prequran_course_enrol_req', [
        'workspaceid' => $workspaceid,
        'status' => 'pending',
    ]);
}

function pqco_request_map_for_students(array $offeringids, array $studentids): array {
    global $DB;

    if (!$offeringids || !$studentids || !pqh_table_exists_safe('local_prequran_course_enrol_req')) {
        return [];
    }
    [$offsql, $offparams] = $DB->get_in_or_equal(array_values($offeringids), SQL_PARAMS_NAMED, 'offering');
    [$stusql, $stuparams] = $DB->get_in_or_equal(array_values($studentids), SQL_PARAMS_NAMED, 'student');
    $rows = $DB->get_records_sql(
        "SELECT id, offeringid, studentid, status
           FROM {local_prequran_course_enrol_req}
          WHERE offeringid {$offsql}
            AND studentid {$stusql}",
        $offparams + $stuparams
    );
    $map = [];
    foreach ($rows as $row) {
        $map[(int)$row->offeringid . ':' . (int)$row->studentid] = $row;
    }
    return $map;
}

function pqco_requests_for_students(int $workspaceid, array $studentids): array {
    global $DB;

    if ($workspaceid <= 0 || !$studentids || !pqh_table_exists_safe('local_prequran_course_enrol_req')) {
        return [];
    }
    [$stusql, $stuparams] = $DB->get_in_or_equal(array_values($studentids), SQL_PARAMS_NAMED, 'student');
    [$statussql, $statusparams] = $DB->get_in_or_equal(pqco_learner_visible_statuses(), SQL_PARAMS_NAMED, 'offeringstatus');
    return array_values($DB->get_records_sql(
        "SELECT r.*, o.title AS offering_title, o.course_key, o.startdate, o.enddate,
                u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
           JOIN {user} u ON u.id = r.studentid
          WHERE r.workspaceid = :workspaceid
            AND r.studentid {$stusql}
            AND o.status {$statussql}
       ORDER BY r.timecreated DESC",
        ['workspaceid' => $workspaceid] + $stuparams + $statusparams,
        0,
        80
    ));
}

function pqco_workspace_students_for_user(int $workspaceid, int $userid): array {
    global $DB;

    if ($workspaceid <= 0 || $userid <= 0) {
        return [];
    }
    $role = pqh_user_workspace_role($userid, $workspaceid);
    $students = [];
    if ($role === 'student') {
        $user = core_user::get_user($userid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING);
        if ($user) {
            $students[$userid] = $user;
        }
        return $students;
    }

    if ($role === 'parent') {
        if (pqh_table_exists_safe('local_prequran_comm_consent')) {
            $rows = $DB->get_records_sql(
                "SELECT u.id, u.firstname, u.lastname, u.email, u.idnumber
                   FROM {local_prequran_comm_consent} cc
                   JOIN {local_prequran_workspace_member} wm
                     ON wm.workspaceid = :workspaceid
                    AND wm.userid = cc.studentid
                    AND wm.workspace_role = :studentrole
                    AND wm.status = :memberstatus
                   JOIN {user} u ON u.id = cc.studentid
                  WHERE cc.guardianid = :guardianid",
                [
                    'workspaceid' => $workspaceid,
                    'studentrole' => 'student',
                    'memberstatus' => 'active',
                    'guardianid' => $userid,
                ]
            );
            foreach ($rows as $row) {
                $students[(int)$row->id] = $row;
            }
        }
        if (pqh_table_exists_safe('local_prequran_live_consent')) {
            $rows = $DB->get_records_sql(
                "SELECT u.id, u.firstname, u.lastname, u.email, u.idnumber
                   FROM {local_prequran_live_consent} lc
                   JOIN {local_prequran_workspace_member} wm
                     ON wm.workspaceid = :workspaceid
                    AND wm.userid = lc.studentid
                    AND wm.workspace_role = :studentrole
                    AND wm.status = :memberstatus
                   JOIN {user} u ON u.id = lc.studentid
                  WHERE lc.guardianid = :guardianid",
                [
                    'workspaceid' => $workspaceid,
                    'studentrole' => 'student',
                    'memberstatus' => 'active',
                    'guardianid' => $userid,
                ]
            );
            foreach ($rows as $row) {
                $students[(int)$row->id] = $row;
            }
        }
    }

    if (pqh_user_can_manage_workspace($userid, $workspaceid) || pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
        $rows = $DB->get_records_sql(
            "SELECT u.id, u.firstname, u.lastname, u.email, u.idnumber
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid
              WHERE wm.workspaceid = :workspaceid
                AND wm.workspace_role = :studentrole
                AND wm.status = :memberstatus
           ORDER BY u.lastname ASC, u.firstname ASC",
            [
                'workspaceid' => $workspaceid,
                'studentrole' => 'student',
                'memberstatus' => 'active',
            ]
        );
        foreach ($rows as $row) {
            $students[(int)$row->id] = $row;
        }
    }

    uasort($students, static function($a, $b): int {
        return strcasecmp(fullname($a), fullname($b));
    });
    return $students;
}

function pqco_append_profile_course(int $studentid, string $coursekey): void {
    global $DB;

    $coursekey = pqh_normalize_course_key($coursekey);
    if ($studentid <= 0 || $coursekey === '' || !pqh_table_exists_safe('local_prequran_student_profile')) {
        return;
    }
    if (!pqh_table_has_field_safe('local_prequran_student_profile', 'course_type')) {
        return;
    }
    $profile = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', IGNORE_MISSING);
    if (!$profile) {
        return;
    }
    $keys = pqh_normalize_course_keys((string)($profile->course_type ?? ''));
    if (!in_array($coursekey, $keys, true)) {
        $keys[] = $coursekey;
    }
    $profile->course_type = implode(',', $keys);
    if (pqh_table_has_field_safe('local_prequran_student_profile', 'timemodified')) {
        $profile->timemodified = time();
    }
    $DB->update_record('local_prequran_student_profile', $profile);
}

function pqco_enrol_user_in_moodle_course(int $userid, int $courseid, string $roleshortname): bool {
    global $CFG, $DB;

    if ($userid <= 0 || $courseid <= 0) {
        return false;
    }
    require_once($CFG->libdir . '/enrollib.php');
    if (is_enrolled(context_course::instance($courseid), $userid, '', true)) {
        return true;
    }
    $manual = enrol_get_plugin('manual');
    if (!$manual) {
        return false;
    }
    $instances = enrol_get_instances($courseid, true);
    $manualinstance = null;
    foreach ($instances as $instance) {
        if ((string)$instance->enrol === 'manual' && (int)$instance->status === ENROL_INSTANCE_ENABLED) {
            $manualinstance = $instance;
            break;
        }
    }
    if (!$manualinstance) {
        return false;
    }
    $roleid = (int)$DB->get_field('role', 'id', ['shortname' => $roleshortname], IGNORE_MISSING);
    $manual->enrol_user($manualinstance, $userid, $roleid ?: null, time(), 0, ENROL_USER_ACTIVE);
    return true;
}

function pqco_enrol_student_in_moodle_course(int $studentid, int $courseid): bool {
    return pqco_enrol_user_in_moodle_course($studentid, $courseid, 'student');
}

function pqco_teacher_ids_for_student(int $studentid, int $workspaceid = 0): array {
    global $DB;

    if ($studentid <= 0) {
        return [];
    }

    $teacherids = [];
    if (pqh_table_exists_safe('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', [
            'studentid' => $studentid,
            'status' => 'active',
        ], '', 'id,teacherid');
        foreach ($rows as $row) {
            $teacherid = (int)$row->teacherid;
            if ($teacherid > 0 && $teacherid !== $studentid) {
                $teacherids[$teacherid] = $teacherid;
            }
        }
    }

    if (pqh_table_exists_safe('local_prequran_group_member') && pqh_table_exists_safe('local_prequran_class_group')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT cg.teacherid
               FROM {local_prequran_group_member} gm
               JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
              WHERE gm.studentid = :studentid
                AND gm.assignment_status = :assignmentstatus
                AND cg.status <> :archived",
            [
                'studentid' => $studentid,
                'assignmentstatus' => 'active',
                'archived' => 'archived',
            ]
        );
        foreach ($rows as $row) {
            $teacherid = (int)$row->teacherid;
            if ($teacherid > 0 && $teacherid !== $studentid) {
                $teacherids[$teacherid] = $teacherid;
            }
        }
    }

    if ($workspaceid > 0
        && pqh_table_exists_safe('local_prequran_workspace')
        && pqh_table_exists_safe('local_prequran_workspace_member')) {
        $rows = $DB->get_records_sql(
            "SELECT userid
               FROM {local_prequran_workspace_member}
              WHERE workspaceid = :workspaceid
                AND status = :status
                AND workspace_role IN (:ownerrole, :teacherrole, :assistantrole)
                AND EXISTS (
                    SELECT 1
                      FROM {local_prequran_workspace} w
                     WHERE w.id = :workspaceidcheck
                       AND w.workspace_type = :workspacetype
                       AND w.status <> :archived
                )",
            [
                'workspaceid' => $workspaceid,
                'workspaceidcheck' => $workspaceid,
                'status' => 'active',
                'ownerrole' => 'owner',
                'teacherrole' => 'teacher',
                'assistantrole' => 'assistant_teacher',
                'workspacetype' => 'solo_teacher',
                'archived' => 'archived',
            ]
        );
        foreach ($rows as $row) {
            $teacherid = (int)$row->userid;
            if ($teacherid > 0 && $teacherid !== $studentid) {
                $teacherids[$teacherid] = $teacherid;
            }
        }
    }

    return array_values($teacherids);
}

function pqco_enrol_assigned_teachers_in_moodle_course(int $studentid, int $courseid, int $workspaceid = 0, array $auditdetails = []): int {
    $count = 0;
    foreach (pqco_teacher_ids_for_student($studentid, $workspaceid) as $teacherid) {
        if (!pqco_enrol_user_in_moodle_course((int)$teacherid, $courseid, 'teacher')) {
            continue;
        }
        $count++;
        pqco_course_audit('teacher_moodle_enrollment_completed', 'user', (int)$teacherid, $auditdetails + [
            'workspaceid' => $workspaceid,
            'studentid' => $studentid,
            'teacherid' => (int)$teacherid,
            'moodlecourseid' => $courseid,
        ]);
    }
    return $count;
}

function pqco_unenrol_student_from_moodle_course(int $studentid, int $courseid): bool {
    global $CFG;

    if ($studentid <= 0 || $courseid <= 0) {
        return false;
    }
    require_once($CFG->libdir . '/enrollib.php');
    $manual = enrol_get_plugin('manual');
    if (!$manual) {
        return false;
    }
    $instances = enrol_get_instances($courseid, true);
    foreach ($instances as $instance) {
        if ((string)$instance->enrol === 'manual') {
            $manual->unenrol_user($instance, $studentid);
            return true;
        }
    }
    return false;
}
