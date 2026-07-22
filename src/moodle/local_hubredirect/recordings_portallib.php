<?php
// Recordings query library — extracted VERBATIM from recordings.php
// (renamed pqr_ -> pqrecl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.
//
// NOT extracted: pqr_render_student_picker (pure Moodle-page HTML rendering
// via $OUTPUT — the portal page renders the chooser itself from JSON).

defined('MOODLE_INTERNAL') || die();

function pqrecl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqrecl_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0) {
        return false;
    }
    if (!pqh_user_belongs_to_consumer_context($studentid)) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqrecl_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqrecl_table_exists('local_prequran_comm_participant') && pqrecl_table_exists('local_prequran_comm_thread')) {
        $exists = $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = ?
                AND p.role = ?
                AND t.studentid = ?",
            [$parentid, 'parent', $studentid]
        );
        if ($exists) {
            return true;
        }
    }

    return false;
}

function pqrecl_is_managed_student(int $userid): bool {
    require_once($GLOBALS['CFG']->dirroot . '/user/profile/lib.php');
    try {
        $profile = profile_user_record($userid, false);
    } catch (Throwable $e) {
        return false;
    }
    foreach (['managed_student', 'managedstudent', 'managed'] as $field) {
        if (isset($profile->{$field})) {
            $value = strtolower(trim((string)$profile->{$field}));
            return in_array($value, ['1', 'yes', 'true', 'on'], true);
        }
    }
    return false;
}

function pqrecl_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqrecl_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = ?
            AND r.shortname IN ('editingteacher', 'teacher', 'manager')",
        [$userid]
    );
}

function pqrecl_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (!pqh_user_belongs_to_consumer_context($studentid)) {
        return false;
    }

    if (pqrecl_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', [
            'teacherid' => $teacherid,
            'status' => 'active',
        ]);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', [
                'teacherid' => $teacherid,
                'studentid' => $studentid,
                'status' => 'active',
            ]);
        }
    }

    if (!pqrecl_has_teacher_role($teacherid)) {
        return false;
    }

    if (!pqrecl_is_managed_student($studentid)) {
        return false;
    }

    return $DB->record_exists_sql(
        "SELECT 1
           FROM {cohort_members} teacher_cm
           JOIN {cohort_members} student_cm ON student_cm.cohortid = teacher_cm.cohortid
          WHERE teacher_cm.userid = ?
            AND student_cm.userid = ?",
        [$teacherid, $studentid]
    );
}

function pqrecl_safe_storage_path(string $path): string {
    $parts = array_filter(explode('/', str_replace('\\', '/', $path)), function($part) {
        return $part !== '' && $part !== '.' && $part !== '..';
    });
    return implode('/', array_map('rawurlencode', $parts));
}

function pqrecl_stream_bunny_file(string $path, string $mimetype): void {
    $zone = trim((string)get_config('local_prequran', 'bunny_storage_zone'));
    $host = trim((string)get_config('local_prequran', 'bunny_storage_host'));
    $accesskey = trim((string)get_config('local_prequran', 'bunny_storage_access_key'));

    if ($host === '') {
        $host = 'storage.bunnycdn.com';
    }
    if ($zone === '' || $accesskey === '' || $path === '' || !function_exists('curl_init')) {
        throw new invalid_parameter_exception('Recording storage is not configured.');
    }

    $url = 'https://' . $host . '/' . rawurlencode($zone) . '/' . pqrecl_safe_storage_path($path);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['AccessKey: ' . $accesskey]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    $bytes = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($errno || $status < 200 || $status >= 300 || $bytes === false) {
        throw new invalid_parameter_exception('Recording could not be loaded.');
    }

    @header('Content-Type: ' . ($mimetype !== '' ? $mimetype : 'audio/webm'));
    @header('Content-Length: ' . strlen($bytes));
    @header('Cache-Control: private, max-age=300');
    @header('X-Content-Type-Options: nosniff');
    echo $bytes;
    exit;
}

function pqrecl_recording_student_rows(int $userid): array {
    global $DB;
    if (!pqrecl_table_exists('local_prequran_speakrec')) {
        return [];
    }

    $rows = $DB->get_records_sql(
        "SELECT r.userid AS studentid, COUNT(1) AS recording_count, MAX(r.timecreated) AS last_recorded
           FROM {local_prequran_speakrec} r
          WHERE r.status <> :failed
       GROUP BY r.userid
       ORDER BY last_recorded DESC",
        ['failed' => 'upload_failed']
    );

    $students = [];
    foreach ($rows as $row) {
        $studentid = (int)$row->studentid;
        if ($studentid <= 0) {
            continue;
        }
        if (!is_siteadmin($userid)
            && !pqrecl_teacher_can_access_student($userid, $studentid)
            && !pqrecl_parent_can_access_child($userid, $studentid)
            && $studentid !== $userid) {
            continue;
        }
        $student = core_user::get_user($studentid);
        $students[] = [
            'studentid' => $studentid,
            'name' => $student ? fullname($student) : 'Student ' . $studentid,
            'recording_count' => (int)$row->recording_count,
            'last_recorded' => (int)$row->last_recorded,
        ];
    }
    return $students;
}
