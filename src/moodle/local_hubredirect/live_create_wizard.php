<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can use the guided live-session wizard.');
}

function pqlwiz_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlwiz_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlwiz_minutes(string $time): int {
    if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', trim($time), $matches)) {
        return -1;
    }
    $hour = min(23, (int)$matches[1]);
    return ($hour * 60) + (int)$matches[2];
}

function pqlwiz_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlwiz_weekdays(): array {
    return [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];
}

function pqlwiz_format_minute(int $minute): string {
    $minute = max(0, min(24 * 60, $minute));
    if ($minute === 24 * 60) {
        return '24:00';
    }
    return sprintf('%02d:%02d', intdiv($minute, 60), $minute % 60);
}

function pqlwiz_teacher_availability(int $teacherid): array {
    global $DB;
    $calendar = array_fill(0, 7, []);
    if ($teacherid <= 0 || !pqlwiz_table_exists('local_prequran_live_availability')) {
        return $calendar;
    }
    $windows = $DB->get_records(
        'local_prequran_live_availability',
        ['teacherid' => $teacherid, 'status' => 'active'],
        'weekday ASC, start_minute ASC'
    );
    foreach ($windows as $window) {
        $weekday = (int)$window->weekday;
        if ($weekday < 0 || $weekday > 6) {
            continue;
        }
        $start = (int)$window->start_minute;
        $end = (int)$window->end_minute;
        $calendar[$weekday][] = [
            'label' => pqlwiz_format_minute($start) . ' - ' . pqlwiz_format_minute($end),
            'timezone' => trim((string)($window->timezone ?? '')),
        ];
    }
    return $calendar;
}

function pqlwiz_render_availability_calendar(int $teacherid, int $selecteddate = 0): string {
    $days = pqlwiz_weekdays();
    $calendar = pqlwiz_teacher_availability($teacherid);
    $selectedweekday = $selecteddate > 0 ? (int)date('w', $selecteddate) : -1;
    $teachername = $teacherid > 0 ? pqlwiz_user_name($teacherid, 'Teacher ' . $teacherid) : '';
    $html = '<section class="pqlwiz-availability">';
    $html .= '<div class="pqlwiz-availability-head"><div><h3>Teacher availability calendar</h3>';
    if ($teacherid <= 0) {
        $html .= '<p class="pqlwiz-meta">Choose a teacher first to view weekly availability.</p></div></div></section>';
        return $html;
    }
    $html .= '<p class="pqlwiz-meta">' . s($teachername) . ' #' . (int)$teacherid . ' - active weekly availability windows.</p></div>';
    $html .= '<a class="pqlwiz-btn pqlwiz-btn--light" href="' .
        (new moodle_url('/local/hubredirect/live_availability.php', ['teacherid' => $teacherid]))->out(false) .
        '">Manage availability</a></div>';
    $html .= '<div class="pqlwiz-availability-grid">';
    foreach ($days as $weekday => $dayname) {
        $classes = 'pqlwiz-day' . ($weekday === $selectedweekday ? ' pqlwiz-day--selected' : '');
        $html .= '<div class="' . $classes . '">';
        $html .= '<div class="pqlwiz-day-title">' . s($dayname) . '</div>';
        if (empty($calendar[$weekday])) {
            $html .= '<span class="pqlwiz-slot pqlwiz-slot--empty">No availability</span>';
        } else {
            foreach ($calendar[$weekday] as $slot) {
                $html .= '<span class="pqlwiz-slot">' . s($slot['label']);
                if ($slot['timezone'] !== '') {
                    $html .= '<small>' . s($slot['timezone']) . '</small>';
                }
                $html .= '</span>';
            }
        }
        $html .= '</div>';
    }
    $html .= '</div>';
    if ($selectedweekday >= 0) {
        $html .= '<p class="pqlwiz-meta">The selected date falls on ' . s($days[$selectedweekday]) . ', highlighted above.</p>';
    }
    $html .= '</section>';
    return $html;
}

function pqlwiz_teacher_candidates(): array {
    global $DB;
    $ids = [];
    if (pqlwiz_table_exists('local_prequran_live_session')) {
        foreach ($DB->get_records_sql("SELECT DISTINCT teacherid FROM {local_prequran_live_session} WHERE teacherid > 0") as $row) {
            $ids[(int)$row->teacherid] = true;
        }
    }
    if (pqlwiz_table_exists('local_prequran_live_availability')) {
        foreach ($DB->get_records_sql("SELECT DISTINCT teacherid FROM {local_prequran_live_availability} WHERE teacherid > 0 AND status = 'active'") as $row) {
            $ids[(int)$row->teacherid] = true;
        }
    }
    if (pqlwiz_table_exists('local_prequran_teacher_student')) {
        foreach ($DB->get_records_sql("SELECT DISTINCT teacherid FROM {local_prequran_teacher_student} WHERE teacherid > 0 AND status = 'active'") as $row) {
            $ids[(int)$row->teacherid] = true;
        }
    }
    $teachers = [];
    foreach (array_keys($ids) as $teacherid) {
        $teachers[] = ['id' => $teacherid, 'name' => pqlwiz_user_name($teacherid, 'Teacher ' . $teacherid)];
    }
    usort($teachers, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $teachers;
}

function pqlwiz_student_names(array $studentids): array {
    $names = [];
    foreach (array_values(array_unique(array_filter(array_map('intval', $studentids)))) as $studentid) {
        $names[$studentid] = pqlwiz_user_name($studentid, 'Student ' . $studentid);
    }
    return $names;
}

function pqlwiz_profile_field($profile, string $field): string {
    return trim((string)($profile->{$field} ?? ''));
}

function pqlwiz_student_picker_profiles(int $limit = 400): array {
    global $DB;
    if (!pqlwiz_table_exists('local_prequran_student_profile')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT sp.id AS profileid,
                sp.userid,
                sp.student_display_name,
                sp.timezone,
                sp.language,
                sp.primary_language,
                sp.age_years,
                sp.age_band,
                sp.current_level,
                sp.country,
                sp.city,
                sp.gender,
                sp.live_class_consent,
                sp.recording_consent,
                sp.status,
                u.firstname,
                u.lastname,
                u.idnumber,
                u.username
           FROM {local_prequran_student_profile} sp
           JOIN {user} u ON u.id = sp.userid
          WHERE u.deleted = 0
            AND u.suspended = 0
            AND sp.status = :status
       ORDER BY sp.timezone ASC, sp.current_level ASC, sp.student_display_name ASC, u.firstname ASC, u.lastname ASC",
        ['status' => 'active'],
        0,
        $limit
    ));
}

function pqlwiz_student_picker_timezones(array $profiles): array {
    $timezones = [];
    foreach ($profiles as $profile) {
        $timezone = pqlwiz_profile_field($profile, 'timezone');
        if ($timezone !== '') {
            $timezones[$timezone] = $timezone;
        }
    }
    ksort($timezones, SORT_NATURAL | SORT_FLAG_CASE);
    return $timezones;
}

function pqlwiz_student_picker_name($profile): string {
    $display = pqlwiz_profile_field($profile, 'student_display_name');
    if ($display !== '') {
        return $display;
    }
    $name = trim(pqlwiz_profile_field($profile, 'firstname') . ' ' . pqlwiz_profile_field($profile, 'lastname'));
    return $name !== '' ? $name : 'Student ' . (int)$profile->userid;
}

function pqlwiz_parse_students(string $raw): array {
    $parts = preg_split('/[\s,;]+/', trim($raw));
    return array_values(array_unique(array_filter(array_map('intval', $parts ?: []))));
}

function pqlwiz_class_groups(): array {
    global $DB;
    if (!pqlwiz_table_exists('local_prequran_class_group')) {
        return [];
    }
    return $DB->get_records_select('local_prequran_class_group', "status IN ('open', 'active')", [], 'title ASC', '*', 0, 100);
}

function pqlwiz_group_student_ids(int $groupid): array {
    global $DB;
    if ($groupid <= 0 || !pqlwiz_table_exists('local_prequran_group_member')) {
        return [];
    }
    $ids = [];
    foreach ($DB->get_records('local_prequran_group_member', ['groupid' => $groupid, 'assignment_status' => 'active'], '', 'id, studentid') as $member) {
        $ids[] = (int)$member->studentid;
    }
    return array_values(array_unique(array_filter($ids)));
}

function pqlwiz_conflicts(int $teacherid, array $studentids, int $start, int $duration): array {
    global $DB;
    $conflicts = [];
    if ($teacherid <= 0 || $start <= 0 || !pqlwiz_table_exists('local_prequran_live_session')) {
        return $conflicts;
    }
    $end = $start + (max(15, $duration) * MINSECS);
    if (pqlwiz_table_exists('local_prequran_live_availability')) {
        $windows = $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($windows) {
            $weekday = (int)date('w', $start);
            $startminute = ((int)date('G', $start) * 60) + (int)date('i', $start);
            $endminute = $startminute + $duration;
            $allowed = false;
            foreach ($windows as $window) {
                if ((int)$window->weekday === $weekday && (int)$window->start_minute <= $startminute && (int)$window->end_minute >= $endminute) {
                    $allowed = true;
                    break;
                }
            }
            if (!$allowed) {
                $conflicts[] = 'Teacher is outside active availability for this proposed time.';
            }
        }
    }
    $teacherconflicts = $DB->get_records_sql(
        "SELECT id, title, scheduled_start
           FROM {local_prequran_live_session}
          WHERE teacherid = :teacherid
            AND status NOT IN ('cancelled', 'failed')
            AND scheduled_start < :endtime
            AND scheduled_end > :starttime
       ORDER BY scheduled_start ASC",
        ['teacherid' => $teacherid, 'starttime' => $start, 'endtime' => $end],
        0,
        5
    );
    foreach ($teacherconflicts as $session) {
        $conflicts[] = 'Teacher overlaps with "' . (string)$session->title . '" at ' . userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')) . '.';
    }
    if ($studentids && pqlwiz_table_exists('local_prequran_live_participant')) {
        list($insql, $inparams) = $DB->get_in_or_equal(array_values($studentids), SQL_PARAMS_NAMED, 'student');
        $studentconflicts = $DB->get_records_sql(
            "SELECT s.id, s.title, s.scheduled_start, p.studentid
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
              WHERE p.role = 'student'
                AND p.status = 'active'
                AND p.studentid {$insql}
                AND s.status NOT IN ('cancelled', 'failed')
                AND s.scheduled_start < :endtime
                AND s.scheduled_end > :starttime
           ORDER BY s.scheduled_start ASC",
            $inparams + ['starttime' => $start, 'endtime' => $end],
            0,
            10
        );
        foreach ($studentconflicts as $session) {
            $conflicts[] = pqlwiz_user_name((int)$session->studentid, 'Student ' . (int)$session->studentid) . ' overlaps with "' . (string)$session->title . '" at ' . userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')) . '.';
        }
    }
    $maxparticipants = (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12;
    if ((count($studentids) + 1) > $maxparticipants) {
        $conflicts[] = 'Participant count is ' . (count($studentids) + 1) . ', above the configured BBB limit of ' . $maxparticipants . '.';
    }
    return array_slice($conflicts, 0, 20);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_create_wizard.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Create Live Session Wizard');
$PAGE->set_heading('Create Live Session Wizard');
$PAGE->add_body_class('pqh-live-create-wizard-page');

$step = max(1, min(6, optional_param('step', 1, PARAM_INT)));
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$groupid = optional_param('groupid', 0, PARAM_INT);
$studentraw = trim(optional_param('studentids_raw', '', PARAM_TEXT));
$studentids = array_values(array_unique(array_merge(pqlwiz_group_student_ids($groupid), pqlwiz_parse_students($studentraw))));
$title = trim(optional_param('title', 'Pre-Quran review session', PARAM_TEXT));
$lessonid = trim(optional_param('lessonid', 'alphabet', PARAM_TEXT));
$unitid = trim(optional_param('unitid', 'alphabet_listen', PARAM_TEXT));
$sessiondate = optional_param('sessiondate', '', PARAM_TEXT);
$sessiontime = optional_param('sessiontime', '', PARAM_TEXT);
$duration = max(15, min(240, optional_param('duration', 60, PARAM_INT)));
$recording = optional_param('recording_enabled', 0, PARAM_BOOL);
$override = optional_param('override_conflicts', 0, PARAM_BOOL);
$override_reason = trim(optional_param('override_reason', '', PARAM_TEXT));
$start = 0;
$datevalue = pqlwiz_clean_date($sessiondate, 0);
if ($datevalue > 0 && pqlwiz_minutes($sessiontime) >= 0) {
    $start = usergetmidnight($datevalue) + (pqlwiz_minutes($sessiontime) * MINSECS);
}
$conflicts = pqlwiz_conflicts($teacherid, $studentids, $start, $duration);
$teachers = pqlwiz_teacher_candidates();
$classgroups = pqlwiz_class_groups();
$studentnames = pqlwiz_student_names($studentids);
$studentprofiles = pqlwiz_student_picker_profiles();
$studenttimezones = pqlwiz_student_picker_timezones($studentprofiles);
$params = [
    'teacherid' => $teacherid,
    'groupid' => $groupid,
    'studentids_raw' => implode(', ', $studentids),
    'title' => $title,
    'lessonid' => $lessonid,
    'unitid' => $unitid,
    'sessiondate' => $sessiondate,
    'sessiontime' => $sessiontime,
    'duration' => $duration,
    'recording_enabled' => $recording ? 1 : 0,
];

echo $OUTPUT->header();
?>
<style>
body.pqh-live-create-wizard-page header,
body.pqh-live-create-wizard-page footer,
body.pqh-live-create-wizard-page nav.navbar,
body.pqh-live-create-wizard-page #page-header,
body.pqh-live-create-wizard-page #page-footer,
body.pqh-live-create-wizard-page .drawer,
body.pqh-live-create-wizard-page .drawer-toggles,
body.pqh-live-create-wizard-page .block-region,
body.pqh-live-create-wizard-page [data-region="drawer"],
body.pqh-live-create-wizard-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-create-wizard-page #page,
body.pqh-live-create-wizard-page #page-content,
body.pqh-live-create-wizard-page #region-main,
body.pqh-live-create-wizard-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlwiz-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlwiz-wrap{max-width:1040px;margin:0 auto}
.pqlwiz-top,.pqlwiz-panel{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlwiz-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqlwiz-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlwiz-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlwiz-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlwiz-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlwiz-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlwiz-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:16px}
.pqlwiz-step{padding:10px;border-radius:8px;background:#eef4f6;color:#415665;font-size:12px;font-weight:950;text-align:center}
.pqlwiz-step--active{background:#2f6f4e;color:#fff}
.pqlwiz-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pqlwiz-field{display:grid;gap:6px;margin-bottom:12px}
.pqlwiz-field label{font-size:13px;font-weight:900;color:#415665}
.pqlwiz-input,.pqlwiz-select,.pqlwiz-textarea{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}
.pqlwiz-textarea{min-height:92px}
.pqlwiz-card{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff;margin-bottom:12px}
.pqlwiz-card h3{margin:0 0 6px;font-size:17px;font-weight:950}
.pqlwiz-meta{margin:3px 0;color:#5e7280;font-size:13px;font-weight:800}
.pqlwiz-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-size:14px;font-weight:850;white-space:pre-wrap}
.pqlwiz-alert--bad{background:#fff0ed;color:#883526;border:1px solid rgba(136,53,38,.16)}
.pqlwiz-alert--ok{background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16)}
.pqlwiz-check{display:flex;gap:9px;align-items:center;font-size:13px;font-weight:850}
.pqlwiz-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlwiz-availability{margin:0 0 14px;padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#f8fbfd}
.pqlwiz-availability-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
.pqlwiz-availability h3{margin:0 0 4px;font-size:17px;font-weight:950}
.pqlwiz-availability-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.pqlwiz-day{min-height:96px;padding:10px;border:1px solid rgba(23,48,68,.12);border-radius:9px;background:#fff}
.pqlwiz-day--selected{border-color:#2f6f4e;box-shadow:0 0 0 2px rgba(47,111,78,.12)}
.pqlwiz-day-title{margin-bottom:8px;color:#415665;font-size:12px;font-weight:950}
.pqlwiz-slot{display:block;margin:5px 0;padding:6px 8px;border-radius:999px;background:#edf9ef;color:#245c35;font-size:12px;font-weight:900}
.pqlwiz-slot small{display:block;margin-top:2px;color:#5e7280;font-size:10px;font-weight:850}
.pqlwiz-slot--empty{background:#eef4f6;color:#5e7280}
.pqlwiz-picker{display:grid;gap:12px;margin-bottom:12px}
.pqlwiz-filter-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px}
.pqlwiz-roster{max-height:430px;overflow:auto;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlwiz-roster table{width:100%;border-collapse:collapse;font-size:13px}
.pqlwiz-roster th,.pqlwiz-roster td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlwiz-roster th{position:sticky;top:0;background:#f8fbfd;color:#415665;font-size:12px;font-weight:950;z-index:1}
.pqlwiz-student-main{font-weight:950;color:#173044}
.pqlwiz-student-meta{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:800}
.pqlwiz-pill{display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950;white-space:nowrap}
.pqlwiz-pill--ok{background:#edf9ef;color:#245c35}
.pqlwiz-pill--warn{background:#fff6df;color:#7a5637}
.pqlwiz-selected{display:flex;flex-wrap:wrap;gap:8px;min-height:42px;padding:10px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#f8fbfd}
.pqlwiz-selected .pqlwiz-pill{cursor:pointer;border:0}
.pqlwiz-selected-count{font-weight:950;color:#173044}
.pqlwiz-manual{margin-top:12px}
@media(max-width:780px){.pqlwiz-top{display:block}.pqlwiz-actions{margin-top:12px}.pqlwiz-grid,.pqlwiz-steps,.pqlwiz-availability-grid,.pqlwiz-filter-grid{grid-template-columns:1fr}.pqlwiz-title{font-size:24px}.pqlwiz-availability-head{display:block}.pqlwiz-availability-head .pqlwiz-btn{margin-top:10px}.pqlwiz-roster table{min-width:760px}}
</style>
<main class="pqlwiz-shell">
  <div class="pqlwiz-wrap">
    <section class="pqlwiz-top">
      <div>
        <h1 class="pqlwiz-title">Guided Session Creation Wizard</h1>
        <p class="pqlwiz-sub">Create one live review session with capacity, availability, and conflict checks before final submission.</p>
      </div>
      <div class="pqlwiz-actions">
        <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_capacity.php'))->out(false); ?>">Capacity</a>
        <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <a class="pqlwiz-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <section class="pqlwiz-steps">
      <?php foreach ([1 => 'Teacher', 2 => 'Students', 3 => 'Lesson', 4 => 'Time', 5 => 'Safety', 6 => 'Review'] as $num => $label): ?>
        <div class="pqlwiz-step <?php echo $step === $num ? 'pqlwiz-step--active' : ''; ?>"><?php echo (int)$num; ?>. <?php echo s($label); ?></div>
      <?php endforeach; ?>
    </section>

    <section class="pqlwiz-panel">
      <?php if (!pqlwiz_table_exists('local_prequran_live_session') || !pqlwiz_table_exists('local_prequran_live_participant')): ?>
        <div class="pqlwiz-empty">Live-session tables are required before using the wizard.</div>
      <?php else: ?>
        <?php if ($step === 1): ?>
          <form method="get">
            <input type="hidden" name="step" value="2">
            <div class="pqlwiz-field">
              <label for="teacherid">Teacher</label>
              <select class="pqlwiz-select" id="teacherid" name="teacherid" required>
                <option value="">Choose teacher</option>
                <?php foreach ($teachers as $teacher): ?>
                  <option value="<?php echo (int)$teacher['id']; ?>" <?php echo $teacherid === (int)$teacher['id'] ? 'selected' : ''; ?>><?php echo s($teacher['name'] . ' #' . $teacher['id']); ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="pqlwiz-actions">
              <button class="pqlwiz-btn" type="submit">Next: students</button>
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_capacity.php'))->out(false); ?>">Review capacity first</a>
            </div>
          </form>
        <?php elseif ($step === 2): ?>
          <form method="get">
            <?php foreach ($params as $key => $value): if (!in_array($key, ['studentids_raw', 'groupid'], true)): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?>
            <input type="hidden" name="step" value="3">
            <?php if ($classgroups): ?>
              <div class="pqlwiz-field">
                <label for="groupid">Class group</label>
                <select class="pqlwiz-select" id="groupid" name="groupid">
                  <option value="0">No class group</option>
                  <?php foreach ($classgroups as $group): ?>
                    <option value="<?php echo (int)$group->id; ?>" <?php echo $groupid === (int)$group->id ? 'selected' : ''; ?>><?php echo s((string)$group->title . ' #' . (int)$group->id); ?></option>
                  <?php endforeach; ?>
                </select>
                <p class="pqlwiz-meta">A class group automatically adds active assigned students. Extra IDs below are optional.</p>
              </div>
            <?php endif; ?>
            <section class="pqlwiz-picker" aria-label="Student picker">
              <div class="pqlwiz-card">
                <h3>Choose students</h3>
                <p class="pqlwiz-meta">Filter first, then select students. The selected Moodle IDs are copied into the manual ID box below.</p>
                <div class="pqlwiz-filter-grid">
                  <div class="pqlwiz-field">
                    <label for="student_filter_timezone">Time zone</label>
                    <select class="pqlwiz-select" id="student_filter_timezone">
                      <option value="">All time zones</option>
                      <?php foreach ($studenttimezones as $timezone): ?>
                        <option value="<?php echo s($timezone); ?>"><?php echo s($timezone); ?></option>
                      <?php endforeach; ?>
                    </select>
                  </div>
                  <div class="pqlwiz-field">
                    <label for="student_filter_level">Level</label>
                    <input class="pqlwiz-input" id="student_filter_level" type="search" placeholder="alphabet, level 1">
                  </div>
                  <div class="pqlwiz-field">
                    <label for="student_filter_language">Language</label>
                    <input class="pqlwiz-input" id="student_filter_language" type="search" placeholder="Somali">
                  </div>
                  <div class="pqlwiz-field">
                    <label for="student_filter_search">Search</label>
                    <input class="pqlwiz-input" id="student_filter_search" type="search" placeholder="Name, city, ID">
                  </div>
                </div>
                <div class="pqlwiz-selected-count"><span id="pqlwiz-selected-count"><?php echo count($studentids); ?></span> students selected</div>
                <div class="pqlwiz-selected" id="pqlwiz-selected-list" aria-live="polite"></div>
              </div>
              <?php if (!$studentprofiles): ?>
                <div class="pqlwiz-empty">No active student intake profiles are available for the picker. Use the manual Moodle IDs field below.</div>
              <?php else: ?>
                <div class="pqlwiz-roster">
                  <table>
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Student</th>
                        <th>Age / Gender</th>
                        <th>Level</th>
                        <th>Language</th>
                        <th>Time zone</th>
                        <th>Location</th>
                        <th>Consent</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php foreach ($studentprofiles as $profile): ?>
                        <?php
                        $userid = (int)$profile->userid;
                        $studentname = pqlwiz_student_picker_name($profile);
                        $language = pqlwiz_profile_field($profile, 'primary_language') ?: pqlwiz_profile_field($profile, 'language');
                        $rowtext = strtolower(implode(' ', [
                            $studentname,
                            (string)$userid,
                            pqlwiz_profile_field($profile, 'idnumber'),
                            pqlwiz_profile_field($profile, 'username'),
                            pqlwiz_profile_field($profile, 'city'),
                            pqlwiz_profile_field($profile, 'country'),
                            pqlwiz_profile_field($profile, 'current_level'),
                            $language,
                        ]));
                        ?>
                        <tr class="js-pqlwiz-student-row"
                            data-userid="<?php echo $userid; ?>"
                            data-name="<?php echo s($studentname); ?>"
                            data-timezone="<?php echo s(pqlwiz_profile_field($profile, 'timezone')); ?>"
                            data-level="<?php echo s(strtolower(pqlwiz_profile_field($profile, 'current_level'))); ?>"
                            data-language="<?php echo s(strtolower($language)); ?>"
                            data-search="<?php echo s($rowtext); ?>">
                          <td>
                            <label class="pqlwiz-check">
                              <input class="js-pqlwiz-student-check" type="checkbox" value="<?php echo $userid; ?>" <?php echo in_array($userid, $studentids, true) ? 'checked' : ''; ?>>
                              <span class="accesshide">Select <?php echo s($studentname); ?></span>
                            </label>
                          </td>
                          <td>
                            <span class="pqlwiz-student-main"><?php echo s($studentname); ?></span>
                            <span class="pqlwiz-student-meta">Moodle ID <?php echo $userid; ?><?php echo pqlwiz_profile_field($profile, 'idnumber') !== '' ? ' / ' . s(pqlwiz_profile_field($profile, 'idnumber')) : ''; ?></span>
                          </td>
                          <td><?php echo (int)$profile->age_years; ?> / <?php echo s(pqlwiz_profile_field($profile, 'gender')); ?></td>
                          <td><?php echo s(pqlwiz_profile_field($profile, 'current_level')); ?></td>
                          <td><?php echo s($language); ?></td>
                          <td><?php echo s(pqlwiz_profile_field($profile, 'timezone')); ?></td>
                          <td><?php echo s(trim(pqlwiz_profile_field($profile, 'city') . ', ' . pqlwiz_profile_field($profile, 'country'), ' ,')); ?></td>
                          <td>
                            <span class="pqlwiz-pill <?php echo !empty($profile->live_class_consent) ? 'pqlwiz-pill--ok' : 'pqlwiz-pill--warn'; ?>">live <?php echo !empty($profile->live_class_consent) ? 'yes' : 'no'; ?></span>
                            <span class="pqlwiz-pill <?php echo !empty($profile->recording_consent) ? 'pqlwiz-pill--ok' : 'pqlwiz-pill--warn'; ?>">record <?php echo !empty($profile->recording_consent) ? 'yes' : 'no'; ?></span>
                          </td>
                        </tr>
                      <?php endforeach; ?>
                    </tbody>
                  </table>
                </div>
              <?php endif; ?>
            </section>
            <div class="pqlwiz-field pqlwiz-manual">
              <label for="studentids_raw">Student user IDs</label>
              <textarea class="pqlwiz-textarea" id="studentids_raw" name="studentids_raw" placeholder="101, 102, 103"><?php echo s(implode(', ', $studentids)); ?></textarea>
              <p class="pqlwiz-meta">Manual fallback. These are Moodle user IDs and will be combined with any selected class-group students.</p>
            </div>
            <div class="pqlwiz-actions">
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $params + ['step' => 1]))->out(false); ?>">Back</a>
              <button class="pqlwiz-btn" type="submit">Next: lesson</button>
            </div>
          </form>
        <?php elseif ($step === 3): ?>
          <form method="get">
            <?php foreach ($params as $key => $value): if (!in_array($key, ['title', 'lessonid', 'unitid'], true)): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?>
            <input type="hidden" name="step" value="4">
            <div class="pqlwiz-field"><label for="title">Title</label><input class="pqlwiz-input" id="title" name="title" type="text" value="<?php echo s($title); ?>" required></div>
            <div class="pqlwiz-grid">
              <div class="pqlwiz-field"><label for="lessonid">Lesson ID</label><input class="pqlwiz-input" id="lessonid" name="lessonid" type="text" value="<?php echo s($lessonid); ?>" required></div>
              <div class="pqlwiz-field"><label for="unitid">Unit ID</label><input class="pqlwiz-input" id="unitid" name="unitid" type="text" value="<?php echo s($unitid); ?>" required></div>
            </div>
            <div class="pqlwiz-actions">
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $params + ['step' => 2]))->out(false); ?>">Back</a>
              <button class="pqlwiz-btn" type="submit">Next: time</button>
            </div>
          </form>
        <?php elseif ($step === 4): ?>
          <form method="get">
            <?php foreach ($params as $key => $value): if (!in_array($key, ['sessiondate', 'sessiontime', 'duration'], true)): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?>
            <input type="hidden" name="step" value="5">
            <?php echo pqlwiz_render_availability_calendar($teacherid, $datevalue); ?>
            <div class="pqlwiz-grid">
              <div class="pqlwiz-field"><label for="sessiondate">Date</label><input class="pqlwiz-input" id="sessiondate" name="sessiondate" type="date" value="<?php echo s($sessiondate); ?>" required></div>
              <div class="pqlwiz-field"><label for="sessiontime">Time</label><input class="pqlwiz-input" id="sessiontime" name="sessiontime" type="time" value="<?php echo s($sessiontime); ?>" required></div>
            </div>
            <div class="pqlwiz-field"><label for="duration">Duration</label><select class="pqlwiz-select" id="duration" name="duration">
              <?php foreach ([45, 60, 75, 90] as $minutes): ?><option value="<?php echo (int)$minutes; ?>" <?php echo $duration === $minutes ? 'selected' : ''; ?>><?php echo (int)$minutes; ?> minutes</option><?php endforeach; ?>
            </select></div>
            <div class="pqlwiz-actions">
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $params + ['step' => 3]))->out(false); ?>">Back</a>
              <button class="pqlwiz-btn" type="submit">Next: safety</button>
            </div>
          </form>
        <?php elseif ($step === 5): ?>
          <form method="get">
            <?php foreach ($params as $key => $value): if ($key !== 'recording_enabled'): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?>
            <input type="hidden" name="step" value="6">
            <div class="pqlwiz-card">
              <h3>Recording & Consent</h3>
              <p class="pqlwiz-meta">Recording should only be enabled when guardian consent policy allows it.</p>
              <label class="pqlwiz-check"><input type="checkbox" name="recording_enabled" value="1" <?php echo $recording ? 'checked' : ''; ?>> <span>Record session when consent policy allows</span></label>
            </div>
            <div class="pqlwiz-actions">
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $params + ['step' => 4]))->out(false); ?>">Back</a>
              <button class="pqlwiz-btn" type="submit">Review session</button>
            </div>
          </form>
        <?php else: ?>
          <?php if ($conflicts): ?><div class="pqlwiz-alert pqlwiz-alert--bad"><?php echo s(implode("\n", $conflicts)); ?></div><?php else: ?><div class="pqlwiz-alert pqlwiz-alert--ok">No schedule conflicts detected for this teacher, group, and time.</div><?php endif; ?>
          <div class="pqlwiz-card">
            <h3><?php echo s($title); ?></h3>
            <p class="pqlwiz-meta">Teacher: <?php echo s(pqlwiz_user_name($teacherid, 'Teacher ' . $teacherid)); ?> #<?php echo (int)$teacherid; ?></p>
            <p class="pqlwiz-meta">Students: <?php echo s(implode(', ', $studentnames)); ?></p>
            <p class="pqlwiz-meta">Lesson: <?php echo s($lessonid); ?> / <?php echo s($unitid); ?></p>
            <p class="pqlwiz-meta">Time: <?php echo $start > 0 ? s(userdate($start, get_string('strftimedatetimeshort'))) : 'Not set'; ?> for <?php echo (int)$duration; ?> minutes</p>
            <p class="pqlwiz-meta">Recording: <?php echo $recording ? 'enabled when consent allows' : 'off'; ?></p>
          </div>
          <form method="post" action="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="create">
            <input type="hidden" name="created_from_wizard" value="1">
            <input type="hidden" name="teacherid" value="<?php echo (int)$teacherid; ?>">
            <input type="hidden" name="groupid" value="<?php echo (int)$groupid; ?>">
            <input type="hidden" name="studentids_raw" value="<?php echo s(implode(', ', $studentids)); ?>">
            <input type="hidden" name="title" value="<?php echo s($title); ?>">
            <input type="hidden" name="lessonid" value="<?php echo s($lessonid); ?>">
            <input type="hidden" name="unitid" value="<?php echo s($unitid); ?>">
            <input type="hidden" name="sessiondate" value="<?php echo s($sessiondate); ?>">
            <input type="hidden" name="sessiontime" value="<?php echo s($sessiontime); ?>">
            <input type="hidden" name="duration" value="<?php echo (int)$duration; ?>">
            <?php if ($recording): ?><input type="hidden" name="recording_enabled" value="1"><?php endif; ?>
            <?php if ($conflicts): ?>
              <div class="pqlwiz-card">
                <h3>Admin Conflict Override</h3>
                <label class="pqlwiz-check"><input id="pqlwiz_override_conflicts" type="checkbox" name="override_conflicts" value="1"> <span>Override conflicts with audit reason</span></label>
                <div class="pqlwiz-field"><label for="override_reason">Override Reason</label><input class="pqlwiz-input" id="override_reason" name="override_reason" type="text" placeholder="Required if overriding conflicts"></div>
              </div>
            <?php endif; ?>
            <div class="pqlwiz-actions">
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $params + ['step' => 5]))->out(false); ?>">Back</a>
              <button class="pqlwiz-btn" type="submit">Create live session</button>
            </div>
          </form>
        <?php endif; ?>
      <?php endif; ?>
    </section>
  </div>
</main>
<script>
(function() {
  const override = document.getElementById('pqlwiz_override_conflicts');
  const reason = document.getElementById('override_reason');
  if (override && reason) {
    function syncOverrideReason() {
      reason.required = override.checked;
    }
    override.addEventListener('change', syncOverrideReason);
    syncOverrideReason();
  }

  const manual = document.getElementById('studentids_raw');
  const rows = Array.from(document.querySelectorAll('.js-pqlwiz-student-row'));
  const checks = Array.from(document.querySelectorAll('.js-pqlwiz-student-check'));
  const selectedList = document.getElementById('pqlwiz-selected-list');
  const selectedCount = document.getElementById('pqlwiz-selected-count');
  const timezoneFilter = document.getElementById('student_filter_timezone');
  const levelFilter = document.getElementById('student_filter_level');
  const languageFilter = document.getElementById('student_filter_language');
  const searchFilter = document.getElementById('student_filter_search');

  if (!manual || !rows.length) {
    return;
  }

  function parseIds(value) {
    return (value || '')
      .split(/[\s,;]+/)
      .map(function(part) { return parseInt(part, 10); })
      .filter(function(id, index, list) { return id > 0 && list.indexOf(id) === index; });
  }

  function setManualIds(ids) {
    manual.value = ids.filter(function(id, index, list) {
      return id > 0 && list.indexOf(id) === index;
    }).join(', ');
  }

  function checkedIds() {
    return checks
      .filter(function(check) { return check.checked; })
      .map(function(check) { return parseInt(check.value, 10); })
      .filter(function(id) { return id > 0; });
  }

  function syncChecksFromManual() {
    const ids = parseIds(manual.value);
    checks.forEach(function(check) {
      check.checked = ids.indexOf(parseInt(check.value, 10)) !== -1;
    });
  }

  function renderSelected() {
    const ids = parseIds(manual.value);
    if (selectedCount) {
      selectedCount.textContent = String(ids.length);
    }
    if (!selectedList) {
      return;
    }
    selectedList.innerHTML = '';
    if (!ids.length) {
      const empty = document.createElement('span');
      empty.className = 'pqlwiz-meta';
      empty.textContent = 'No students selected yet.';
      selectedList.appendChild(empty);
      return;
    }
    ids.forEach(function(id) {
      const row = rows.find(function(item) {
        return parseInt(item.getAttribute('data-userid') || '0', 10) === id;
      });
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'pqlwiz-pill';
      pill.textContent = (row ? row.getAttribute('data-name') : 'Student') + ' #' + id + ' x';
      pill.addEventListener('click', function() {
        const next = parseIds(manual.value).filter(function(existing) { return existing !== id; });
        setManualIds(next);
        syncChecksFromManual();
        renderSelected();
      });
      selectedList.appendChild(pill);
    });
  }

  function syncManualFromChecks() {
    const rosterIds = rows.map(function(row) {
      return parseInt(row.getAttribute('data-userid') || '0', 10);
    }).filter(function(id) { return id > 0; });
    const manualIds = parseIds(manual.value);
    const manualOnlyIds = manualIds.filter(function(id) {
      return rosterIds.indexOf(id) === -1;
    });
    setManualIds(manualOnlyIds.concat(checkedIds()));
    syncChecksFromManual();
    renderSelected();
  }

  function rowMatches(row) {
    const timezone = timezoneFilter ? timezoneFilter.value : '';
    const level = levelFilter ? levelFilter.value.trim().toLowerCase() : '';
    const language = languageFilter ? languageFilter.value.trim().toLowerCase() : '';
    const search = searchFilter ? searchFilter.value.trim().toLowerCase() : '';
    if (timezone && row.getAttribute('data-timezone') !== timezone) {
      return false;
    }
    if (level && (row.getAttribute('data-level') || '').indexOf(level) === -1) {
      return false;
    }
    if (language && (row.getAttribute('data-language') || '').indexOf(language) === -1) {
      return false;
    }
    if (search && (row.getAttribute('data-search') || '').indexOf(search) === -1) {
      return false;
    }
    return true;
  }

  function applyFilters() {
    rows.forEach(function(row) {
      row.hidden = !rowMatches(row);
    });
  }

  checks.forEach(function(check) {
    check.addEventListener('change', syncManualFromChecks);
  });
  manual.addEventListener('input', function() {
    syncChecksFromManual();
    renderSelected();
  });
  [timezoneFilter, levelFilter, languageFilter, searchFilter].forEach(function(input) {
    if (input) {
      input.addEventListener('input', applyFilters);
      input.addEventListener('change', applyFilters);
    }
  });

  syncChecksFromManual();
  renderSelected();
  applyFilters();
})();
</script>
<?php
echo $OUTPUT->footer();
