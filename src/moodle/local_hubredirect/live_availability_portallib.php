<?php
// Teacher-availability query library — extracted VERBATIM from
// live_availability.php (the page already uses a unique pqlav_ prefix, so no
// rename is needed). The legacy page keeps its inline copies and stays
// untouched (parallel-run). Only the page-defined pqlav_* functions live here;
// shared pqh_* helpers stay in accesslib.php and are NOT copied.
// Requires: local/hubredirect/accesslib.php and user/profile/lib.php loaded
// first (pqlav_is_teacher uses pqh_has_independent_teacher_profile;
// pqlav_is_managed_student uses profile_user_record).

defined('MOODLE_INTERNAL') || die();

function pqlav_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlav_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}

function pqlav_stop(string $message, moodle_url $returnurl, string $title = 'Teacher availability unavailable'): void {
    pqh_access_denied($message, $returnurl, $title);
}

function pqlav_can_manage_teacher_for_workspace(int $workspaceid, int $teacherid): bool {
    global $DB;
    if ($workspaceid <= 0 || $teacherid <= 0 || !pqlav_table_exists('local_prequran_workspace_member')) {
        return true;
    }
    return $DB->record_exists_select(
        'local_prequran_workspace_member',
        'workspaceid = ? AND userid = ? AND status = ? AND workspace_role IN (?, ?, ?, ?, ?)',
        [$workspaceid, $teacherid, 'active', 'owner', 'admin', 'coordinator', 'teacher', 'assistant_teacher']
    );
}

function pqlav_is_managed_student(int $userid): bool {
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

function pqlav_is_teacher(int $userid): bool {
    global $DB;
    if (is_siteadmin($userid)) {
        return true;
    }
    if (pqh_has_independent_teacher_profile($userid)) {
        return true;
    }
    if (pqlav_table_exists('local_prequran_teacher_profile')
        && $DB->record_exists_select(
            'local_prequran_teacher_profile',
            "userid = ? AND (status IS NULL OR status = '' OR LOWER(status) NOT IN (?, ?, ?))",
            [$userid, 'archived', 'inactive', 'rejected']
        )) {
        return true;
    }
    if (pqlav_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    if (pqlav_table_exists('local_prequran_class_group')
        && $DB->record_exists_select('local_prequran_class_group', 'teacherid = ? AND status <> ?', [$userid, 'archived'])) {
        return true;
    }
    if (pqlav_table_exists('local_prequran_live_session')
        && $DB->record_exists_select('local_prequran_live_session', 'teacherid = :teacherid AND status <> :cancelled', [
            'teacherid' => $userid,
            'cancelled' => 'cancelled',
        ])) {
        return true;
    }
    if (pqlav_table_exists('local_prequran_live_participant')
        && $DB->record_exists('local_prequran_live_participant', [
            'userid' => $userid,
            'role' => 'teacher',
            'status' => 'active',
        ])) {
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

function pqlav_audit(int $teacherid, array $details): void {
    global $DB, $USER;
    if (!pqlav_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => 'availability_updated',
        'targettype' => 'teacher',
        'targetid' => $teacherid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqlav_minutes(string $time): int {
    if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', $time, $matches)) {
        return -1;
    }
    $hour = min(23, (int)$matches[1]);
    return ($hour * 60) + (int)$matches[2];
}

function pqlav_format_minute(int $minute): string {
    $minute = max(0, min(24 * 60, $minute));
    if ($minute === 24 * 60) {
        return '24:00';
    }
    return sprintf('%02d:%02d', intdiv($minute, 60), $minute % 60);
}

function pqlav_calendar_slots(array $windows): array {
    $calendar = array_fill(0, 7, []);
    foreach ($windows as $window) {
        $weekday = (int)$window->weekday;
        if ($weekday < 0 || $weekday > 6) {
            continue;
        }
        $calendar[$weekday][] = $window;
    }
    return $calendar;
}

function pqlav_grid_days(): array {
    return [1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday', 4 => 'Thursday', 5 => 'Friday', 6 => 'Saturday', 0 => 'Sunday'];
}

function pqlav_teacher_config(): array {
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $configpath = __DIR__ . '/teacher_intake_config.php';
    if (!is_readable($configpath)) {
        $config = [];
        return $config;
    }

    $loaded = require($configpath);
    $config = is_array($loaded) ? $loaded : [];
    return $config;
}

function pqlav_slot_minutes(): int {
    $config = pqlav_teacher_config();
    $minutes = (int)($config['availability_slot_minutes'] ?? 120);
    return max(1, min(24 * 60, $minutes));
}

function pqlav_grid_hours(): array {
    $fallback = [
        '00:00' => '2:00 AM',
        '02:00' => '4:00 AM',
        '04:00' => '6:00 AM',
        '06:00' => '8:00 AM',
        '08:00' => '10:00 AM',
        '10:00' => '12:00 PM',
        '12:00' => '14:00 PM',
        '14:00' => '16:00 PM',
        '16:00' => '18:00 PM',
        '18:00' => '20:00 PM',
        '20:00' => '22:00 PM',
        '22:00' => '24:00 PM',
    ];
    $config = pqlav_teacher_config();
    if (empty($config['availability_time_windows']) || !is_array($config['availability_time_windows'])) {
        return $fallback;
    }
    return $config['availability_time_windows'];
}

function pqlav_slot_is_checked(array $calendar, int $weekday, string $hour): bool {
    $start = pqlav_minutes($hour);
    if ($start < 0) {
        return false;
    }
    $end = min(24 * 60, $start + pqlav_slot_minutes());
    foreach ($calendar[$weekday] ?? [] as $window) {
        if ((int)$window->start_minute <= $start && (int)$window->end_minute >= $end) {
            return true;
        }
    }
    return false;
}
