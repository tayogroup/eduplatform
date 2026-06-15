<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can use the recurring class wizard.');
}

function pqlsw_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlsw_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlsw_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlsw_ready(): bool {
    return pqlsw_table_exists('local_prequran_live_series')
        && pqlsw_table_exists('local_prequran_live_session')
        && pqlsw_table_exists('local_prequran_live_participant')
        && pqlsw_column_exists('local_prequran_live_session', 'seriesid')
        && pqlsw_column_exists('local_prequran_live_session', 'series_sequence');
}

function pqlsw_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlsw_minutes(string $time): int {
    if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', trim($time), $matches)) {
        return -1;
    }
    return (min(23, (int)$matches[1]) * 60) + (int)$matches[2];
}

function pqlsw_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlsw_parse_students(string $raw): array {
    $parts = preg_split('/[\s,;]+/', trim($raw));
    return array_values(array_unique(array_filter(array_map('intval', $parts ?: []))));
}

function pqlsw_class_groups(): array {
    global $DB;
    if (!pqlsw_table_exists('local_prequran_class_group')) {
        return [];
    }
    return $DB->get_records_select('local_prequran_class_group', "status IN ('open', 'active')", [], 'title ASC', '*', 0, 100);
}

function pqlsw_group_student_ids(int $groupid): array {
    global $DB;
    if ($groupid <= 0 || !pqlsw_table_exists('local_prequran_group_member')) {
        return [];
    }
    $ids = [];
    foreach ($DB->get_records('local_prequran_group_member', ['groupid' => $groupid, 'assignment_status' => 'active'], '', 'id, studentid') as $member) {
        $ids[] = (int)$member->studentid;
    }
    return array_values(array_unique(array_filter($ids)));
}

function pqlsw_teacher_candidates(): array {
    global $DB;
    $ids = [];
    foreach (['local_prequran_live_session', 'local_prequran_live_availability', 'local_prequran_teacher_student'] as $table) {
        if (!pqlsw_table_exists($table)) {
            continue;
        }
        $where = $table === 'local_prequran_live_session' ? 'teacherid > 0' : "teacherid > 0 AND status = 'active'";
        foreach ($DB->get_records_sql("SELECT DISTINCT teacherid FROM {{$table}} WHERE {$where}") as $row) {
            $ids[(int)$row->teacherid] = true;
        }
    }
    $teachers = [];
    foreach (array_keys($ids) as $teacherid) {
        $teachers[] = ['id' => $teacherid, 'name' => pqlsw_user_name($teacherid, 'Teacher ' . $teacherid)];
    }
    usort($teachers, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $teachers;
}

function pqlsw_generate_starts(int $firststart, string $pattern, array $weekdays, int $until, int $count): array {
    $starts = [];
    $count = max(1, min(60, $count));
    $until = $until > 0 ? $until : ($firststart + (30 * DAYSECS));
    if ($pattern === 'daily') {
        for ($cursor = $firststart; count($starts) < $count && $cursor <= $until; $cursor += DAYSECS) {
            $starts[] = $cursor;
        }
    } else if ($pattern === 'weekly') {
        for ($cursor = $firststart; count($starts) < $count && $cursor <= $until; $cursor += WEEKSECS) {
            $starts[] = $cursor;
        }
    } else {
        $weekdays = array_values(array_unique(array_filter(array_map('intval', $weekdays), static function(int $day): bool {
            return $day >= 0 && $day <= 6;
        })));
        if (!$weekdays) {
            $weekdays = [(int)date('w', $firststart)];
        }
        for ($cursor = $firststart; count($starts) < $count && $cursor <= $until; $cursor += DAYSECS) {
            if (in_array((int)date('w', $cursor), $weekdays, true)) {
                $starts[] = $cursor;
            }
        }
    }
    return $starts ?: [$firststart];
}

function pqlsw_conflicts(int $teacherid, array $studentids, array $starts, int $duration): array {
    global $DB;
    $rows = [];
    if ($teacherid <= 0 || !$starts || !pqlsw_table_exists('local_prequran_live_session')) {
        return $rows;
    }
    $maxparticipants = (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12;
    foreach ($starts as $start) {
        $messages = [];
        $end = (int)$start + (max(15, $duration) * MINSECS);
        if (pqlsw_table_exists('local_prequran_live_availability')) {
            $windows = $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active']);
            if ($windows) {
                $weekday = (int)date('w', (int)$start);
                $startminute = ((int)date('G', (int)$start) * 60) + (int)date('i', (int)$start);
                $endminute = $startminute + $duration;
                $allowed = false;
                foreach ($windows as $window) {
                    if ((int)$window->weekday === $weekday && (int)$window->start_minute <= $startminute && (int)$window->end_minute >= $endminute) {
                        $allowed = true;
                        break;
                    }
                }
                if (!$allowed) {
                    $messages[] = 'outside teacher availability';
                }
            }
        }
        $teacherconflicts = $DB->get_records_sql(
            "SELECT id, title, scheduled_start
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND status NOT IN ('cancelled', 'failed')
                AND scheduled_start < :endtime
                AND scheduled_end > :starttime",
            ['teacherid' => $teacherid, 'starttime' => (int)$start, 'endtime' => $end],
            0,
            3
        );
        foreach ($teacherconflicts as $session) {
            $messages[] = 'teacher overlaps with #' . (int)$session->id . ' ' . (string)$session->title;
        }
        if ($studentids && pqlsw_table_exists('local_prequran_live_participant')) {
            list($insql, $inparams) = $DB->get_in_or_equal($studentids, SQL_PARAMS_NAMED, 'student');
            $studentconflicts = $DB->get_records_sql(
                "SELECT s.id, s.title, p.studentid
                   FROM {local_prequran_live_session} s
                   JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
                  WHERE p.role = 'student'
                    AND p.status = 'active'
                    AND p.studentid {$insql}
                    AND s.status NOT IN ('cancelled', 'failed')
                    AND s.scheduled_start < :endtime
                    AND s.scheduled_end > :starttime",
                $inparams + ['starttime' => (int)$start, 'endtime' => $end],
                0,
                5
            );
            foreach ($studentconflicts as $session) {
                $messages[] = pqlsw_user_name((int)$session->studentid, 'Student ' . (int)$session->studentid) . ' overlaps with #' . (int)$session->id;
            }
        }
        if ((count($studentids) + 1) > $maxparticipants) {
            $messages[] = 'above BBB participant limit of ' . $maxparticipants;
        }
        $rows[] = ['start' => (int)$start, 'messages' => $messages];
    }
    return $rows;
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_series_wizard.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Recurring Class Series Wizard');
$PAGE->set_heading('Recurring Class Series Wizard');
$PAGE->add_body_class('pqh-live-series-wizard-page');

$step = max(1, min(6, optional_param('step', 1, PARAM_INT)));
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$groupid = optional_param('groupid', 0, PARAM_INT);
$studentraw = trim(optional_param('studentids_raw', '', PARAM_TEXT));
$studentids = array_values(array_unique(array_merge(pqlsw_group_student_ids($groupid), pqlsw_parse_students($studentraw))));
$title = trim(optional_param('title', 'Pre-Quran review class series', PARAM_TEXT));
$lessonid = trim(optional_param('lessonid', 'alphabet', PARAM_TEXT));
$unitid = trim(optional_param('unitid', 'alphabet_listen', PARAM_TEXT));
$sessiondate = optional_param('sessiondate', '', PARAM_TEXT);
$sessiontime = optional_param('sessiontime', '', PARAM_TEXT);
$duration = max(15, min(240, optional_param('duration', 60, PARAM_INT)));
$pattern = optional_param('recurrence_pattern', 'weekdays', PARAM_ALPHANUMEXT);
$count = max(1, min(60, optional_param('recurrence_count', 8, PARAM_INT)));
$untilraw = optional_param('recurrence_until', '', PARAM_TEXT);
$weekdays = optional_param_array('recurrence_weekdays', [], PARAM_INT);
$recording = optional_param('recording_enabled', 0, PARAM_BOOL);
$datevalue = pqlsw_clean_date($sessiondate, 0);
$start = ($datevalue > 0 && pqlsw_minutes($sessiontime) >= 0) ? usergetmidnight($datevalue) + (pqlsw_minutes($sessiontime) * MINSECS) : 0;
$until = $untilraw !== '' ? pqlsw_clean_date($untilraw, 0) + DAYSECS - 1 : ($start > 0 ? $start + (30 * DAYSECS) : 0);
$starts = $start > 0 ? pqlsw_generate_starts($start, $pattern, $weekdays, $until, $count) : [];
$conflictrows = pqlsw_conflicts($teacherid, $studentids, $starts, $duration);
$conflictcount = 0;
foreach ($conflictrows as $row) {
    $conflictcount += count($row['messages']);
}
$teachers = pqlsw_teacher_candidates();
$classgroups = pqlsw_class_groups();
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
    'recurrence_pattern' => $pattern,
    'recurrence_count' => $count,
    'recurrence_until' => $untilraw,
    'recording_enabled' => $recording ? 1 : 0,
];

echo $OUTPUT->header();
?>
<style>
body.pqh-live-series-wizard-page header,body.pqh-live-series-wizard-page footer,body.pqh-live-series-wizard-page nav.navbar,body.pqh-live-series-wizard-page #page-header,body.pqh-live-series-wizard-page #page-footer,body.pqh-live-series-wizard-page .drawer,body.pqh-live-series-wizard-page .drawer-toggles,body.pqh-live-series-wizard-page .block-region,body.pqh-live-series-wizard-page [data-region="drawer"],body.pqh-live-series-wizard-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-series-wizard-page #page,body.pqh-live-series-wizard-page #page-content,body.pqh-live-series-wizard-page #region-main,body.pqh-live-series-wizard-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlsw-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqlsw-wrap{max-width:1080px;margin:0 auto}.pqlsw-top,.pqlsw-panel,.pqlsw-card{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}.pqlsw-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}.pqlsw-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}.pqlsw-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}.pqlsw-actions{display:flex;flex-wrap:wrap;gap:9px}.pqlsw-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqlsw-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqlsw-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:16px}.pqlsw-step{padding:10px;border-radius:8px;background:#eef4f6;color:#415665;font-size:12px;font-weight:950;text-align:center}.pqlsw-step--active{background:#2f6f4e;color:#fff}.pqlsw-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pqlsw-field{display:grid;gap:6px;margin-bottom:12px}.pqlsw-field label{font-size:13px;font-weight:900;color:#415665}.pqlsw-input,.pqlsw-select,.pqlsw-textarea{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}.pqlsw-textarea{min-height:92px}.pqlsw-meta{margin:3px 0;color:#5e7280;font-size:13px;font-weight:800}.pqlsw-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-size:14px;font-weight:850}.pqlsw-alert--bad{background:#fff0ed;color:#883526;border:1px solid rgba(136,53,38,.16)}.pqlsw-alert--ok{background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16)}.pqlsw-check{display:flex;gap:9px;align-items:center;padding:7px 0;font-size:13px;font-weight:850}.pqlsw-table{width:100%;border-collapse:collapse;font-size:13px}.pqlsw-table th,.pqlsw-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}.pqlsw-table th{background:#f7fafc;font-size:12px;color:#415665}.pqlsw-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}.pqlsw-pill--ok{background:#edf9ef;color:#245c35}.pqlsw-pill--bad{background:#fff0ed;color:#883526}.pqlsw-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
@media(max-width:780px){.pqlsw-top{display:block}.pqlsw-actions{margin-top:12px}.pqlsw-grid,.pqlsw-steps{grid-template-columns:1fr}.pqlsw-title{font-size:24px}}
</style>
<main class="pqlsw-shell"><div class="pqlsw-wrap">
  <section class="pqlsw-top"><div><h1 class="pqlsw-title">Guided Recurring Class Series Wizard</h1><p class="pqlsw-sub">Preview every generated class date before creating a recurring BBB live-session series.</p></div><div class="pqlsw-actions"><a class="pqlsw-btn pqlsw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php'))->out(false); ?>">Single session wizard</a><a class="pqlsw-btn pqlsw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_capacity.php'))->out(false); ?>">Capacity</a><a class="pqlsw-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a></div></section>
  <section class="pqlsw-steps"><?php foreach ([1 => 'Teacher', 2 => 'Students', 3 => 'Lesson', 4 => 'Recurrence', 5 => 'Safety', 6 => 'Review'] as $num => $label): ?><div class="pqlsw-step <?php echo $step === $num ? 'pqlsw-step--active' : ''; ?>"><?php echo (int)$num; ?>. <?php echo s($label); ?></div><?php endforeach; ?></section>
  <section class="pqlsw-panel">
    <?php if (!pqlsw_ready()): ?><div class="pqlsw-empty">Recurring wizard requires the Phase 16 series table/columns.</div>
    <?php elseif ($step === 1): ?>
      <form method="get"><input type="hidden" name="step" value="2"><div class="pqlsw-field"><label for="teacherid">Teacher</label><select class="pqlsw-select" id="teacherid" name="teacherid" required><option value="">Choose teacher</option><?php foreach ($teachers as $teacher): ?><option value="<?php echo (int)$teacher['id']; ?>" <?php echo $teacherid === (int)$teacher['id'] ? 'selected' : ''; ?>><?php echo s($teacher['name'] . ' #' . $teacher['id']); ?></option><?php endforeach; ?></select></div><button class="pqlsw-btn" type="submit">Next: students</button></form>
    <?php elseif ($step === 2): ?>
      <form method="get"><?php foreach ($params as $key => $value): if (!in_array($key, ['studentids_raw', 'groupid'], true)): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?><input type="hidden" name="step" value="3"><?php if ($classgroups): ?><div class="pqlsw-field"><label for="groupid">Class group</label><select class="pqlsw-select" id="groupid" name="groupid"><option value="0">No class group</option><?php foreach ($classgroups as $group): ?><option value="<?php echo (int)$group->id; ?>" <?php echo $groupid === (int)$group->id ? 'selected' : ''; ?>><?php echo s((string)$group->title . ' #' . (int)$group->id); ?></option><?php endforeach; ?></select><p class="pqlsw-meta">A class group automatically adds active assigned students. Extra IDs below are optional.</p></div><?php endif; ?><div class="pqlsw-field"><label for="studentids_raw">Student user IDs</label><textarea class="pqlsw-textarea" id="studentids_raw" name="studentids_raw"><?php echo s(implode(', ', $studentids)); ?></textarea></div><div class="pqlsw-actions"><a class="pqlsw-btn pqlsw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_wizard.php', $params + ['step' => 1]))->out(false); ?>">Back</a><button class="pqlsw-btn" type="submit">Next: lesson</button></div></form>
    <?php elseif ($step === 3): ?>
      <form method="get"><?php foreach ($params as $key => $value): if (!in_array($key, ['title', 'lessonid', 'unitid'], true)): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?><input type="hidden" name="step" value="4"><div class="pqlsw-field"><label for="title">Series Title</label><input class="pqlsw-input" id="title" name="title" value="<?php echo s($title); ?>" required></div><div class="pqlsw-grid"><div class="pqlsw-field"><label for="lessonid">Lesson ID</label><input class="pqlsw-input" id="lessonid" name="lessonid" value="<?php echo s($lessonid); ?>" required></div><div class="pqlsw-field"><label for="unitid">Unit ID</label><input class="pqlsw-input" id="unitid" name="unitid" value="<?php echo s($unitid); ?>" required></div></div><div class="pqlsw-actions"><a class="pqlsw-btn pqlsw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_wizard.php', $params + ['step' => 2]))->out(false); ?>">Back</a><button class="pqlsw-btn" type="submit">Next: recurrence</button></div></form>
    <?php elseif ($step === 4): ?>
      <form method="get"><?php foreach ($params as $key => $value): if (!in_array($key, ['sessiondate', 'sessiontime', 'duration', 'recurrence_pattern', 'recurrence_count', 'recurrence_until'], true)): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?><input type="hidden" name="step" value="5"><div class="pqlsw-grid"><div class="pqlsw-field"><label for="sessiondate">First Date</label><input class="pqlsw-input" id="sessiondate" name="sessiondate" type="date" value="<?php echo s($sessiondate); ?>" required></div><div class="pqlsw-field"><label for="sessiontime">Class Time</label><input class="pqlsw-input" id="sessiontime" name="sessiontime" type="time" value="<?php echo s($sessiontime); ?>" required></div></div><div class="pqlsw-grid"><div class="pqlsw-field"><label for="duration">Duration</label><select class="pqlsw-select" id="duration" name="duration"><?php foreach ([45, 60, 75, 90] as $minutes): ?><option value="<?php echo (int)$minutes; ?>" <?php echo $duration === $minutes ? 'selected' : ''; ?>><?php echo (int)$minutes; ?> minutes</option><?php endforeach; ?></select></div><div class="pqlsw-field"><label for="recurrence_pattern">Repeat</label><select class="pqlsw-select" id="recurrence_pattern" name="recurrence_pattern"><?php foreach (['daily' => 'Daily', 'weekly' => 'Weekly', 'weekdays' => 'Selected weekdays'] as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo $pattern === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div></div><div class="pqlsw-grid"><div class="pqlsw-field"><label for="recurrence_count">Max Sessions</label><input class="pqlsw-input" id="recurrence_count" name="recurrence_count" type="number" min="1" max="60" value="<?php echo (int)$count; ?>"></div><div class="pqlsw-field"><label for="recurrence_until">Until Date</label><input class="pqlsw-input" id="recurrence_until" name="recurrence_until" type="date" value="<?php echo s($untilraw); ?>"></div></div><div class="pqlsw-card"><p class="pqlsw-meta">Weekdays for selected-weekdays repeat:</p><?php foreach ([1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 0 => 'Sun'] as $day => $label): ?><label class="pqlsw-check"><input type="checkbox" name="recurrence_weekdays[]" value="<?php echo (int)$day; ?>" <?php echo in_array($day, $weekdays, true) ? 'checked' : ''; ?>> <span><?php echo s($label); ?></span></label><?php endforeach; ?></div><div class="pqlsw-actions"><a class="pqlsw-btn pqlsw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_wizard.php', $params + ['step' => 3]))->out(false); ?>">Back</a><button class="pqlsw-btn" type="submit">Next: safety</button></div></form>
    <?php elseif ($step === 5): ?>
      <form method="get"><?php foreach ($params as $key => $value): if ($key !== 'recording_enabled'): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?><?php foreach ($weekdays as $day): ?><input type="hidden" name="recurrence_weekdays[]" value="<?php echo (int)$day; ?>"><?php endforeach; ?><input type="hidden" name="step" value="6"><div class="pqlsw-card"><h3>Recording & Consent</h3><p class="pqlsw-meta">Recording should only be enabled when guardian consent policy allows it for all students in the series.</p><label class="pqlsw-check"><input type="checkbox" name="recording_enabled" value="1" <?php echo $recording ? 'checked' : ''; ?>> <span>Record sessions when consent policy allows</span></label></div><div class="pqlsw-actions"><a class="pqlsw-btn pqlsw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_wizard.php', $params + ['step' => 4]))->out(false); ?>">Back</a><button class="pqlsw-btn" type="submit">Preview series</button></div></form>
    <?php else: ?>
      <?php if ($conflictcount > 0): ?><div class="pqlsw-alert pqlsw-alert--bad"><?php echo (int)$conflictcount; ?> conflict warning(s) found across the generated series.</div><?php else: ?><div class="pqlsw-alert pqlsw-alert--ok">No conflicts detected across the generated series.</div><?php endif; ?>
      <div class="pqlsw-card"><h3><?php echo s($title); ?></h3><p class="pqlsw-meta">Teacher: <?php echo s(pqlsw_user_name($teacherid, 'Teacher ' . $teacherid)); ?> #<?php echo (int)$teacherid; ?></p><p class="pqlsw-meta">Students: <?php echo s(implode(', ', array_map(static function(int $id): string { return pqlsw_user_name($id, 'Student ' . $id); }, $studentids))); ?></p><p class="pqlsw-meta">Lesson: <?php echo s($lessonid); ?> / <?php echo s($unitid); ?></p><p class="pqlsw-meta">Generated sessions: <?php echo count($starts); ?>, <?php echo s($pattern); ?>, recording <?php echo $recording ? 'enabled when consent allows' : 'off'; ?></p></div>
      <table class="pqlsw-table"><tr><th>#</th><th>Date</th><th>Status</th></tr><?php $i = 1; foreach ($conflictrows as $row): ?><tr><td><?php echo $i++; ?></td><td><?php echo s(userdate((int)$row['start'], get_string('strftimedatetimeshort'))); ?></td><td><?php if ($row['messages']): ?><span class="pqlsw-pill pqlsw-pill--bad"><?php echo s(implode('; ', $row['messages'])); ?></span><?php else: ?><span class="pqlsw-pill pqlsw-pill--ok">clear</span><?php endif; ?></td></tr><?php endforeach; ?></table>
      <form method="post" action="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>"><input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>"><input type="hidden" name="action" value="create"><input type="hidden" name="created_from_wizard" value="1"><input type="hidden" name="recurring_enabled" value="1"><input type="hidden" name="teacherid" value="<?php echo (int)$teacherid; ?>"><input type="hidden" name="groupid" value="<?php echo (int)$groupid; ?>"><input type="hidden" name="studentids_raw" value="<?php echo s(implode(', ', $studentids)); ?>"><input type="hidden" name="title" value="<?php echo s($title); ?>"><input type="hidden" name="lessonid" value="<?php echo s($lessonid); ?>"><input type="hidden" name="unitid" value="<?php echo s($unitid); ?>"><input type="hidden" name="sessiondate" value="<?php echo s($sessiondate); ?>"><input type="hidden" name="sessiontime" value="<?php echo s($sessiontime); ?>"><input type="hidden" name="duration" value="<?php echo (int)$duration; ?>"><input type="hidden" name="recurrence_pattern" value="<?php echo s($pattern); ?>"><input type="hidden" name="recurrence_count" value="<?php echo (int)$count; ?>"><input type="hidden" name="recurrence_until" value="<?php echo s($untilraw); ?>"><?php foreach ($weekdays as $day): ?><input type="hidden" name="recurrence_weekdays[]" value="<?php echo (int)$day; ?>"><?php endforeach; ?><?php if ($recording): ?><input type="hidden" name="recording_enabled" value="1"><?php endif; ?><?php if ($conflictcount > 0): ?><div class="pqlsw-card"><h3>Admin Conflict Override</h3><label class="pqlsw-check"><input type="checkbox" name="override_conflicts" value="1"> <span>Override conflicts with audit reason</span></label><div class="pqlsw-field"><label for="override_reason">Override Reason</label><input class="pqlsw-input" id="override_reason" name="override_reason" type="text" placeholder="Required if overriding conflicts"></div></div><?php endif; ?><div class="pqlsw-actions"><a class="pqlsw-btn pqlsw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_wizard.php', $params + ['step' => 5]))->out(false); ?>">Back</a><button class="pqlsw-btn" type="submit">Create recurring series</button></div></form>
    <?php endif; ?>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
