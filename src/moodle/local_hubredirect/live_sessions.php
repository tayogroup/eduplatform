<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');

$pageworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
$pqlbrandname = trim((string)($consumercontext->consumername ?? 'EduPlatform'));
if ($pqlbrandname === '') {
    $pqlbrandname = 'EduPlatform';
}
if ($pageworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $pageworkspaceid = (int)$consumercontext->workspaceid;
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($pageworkspaceid > 0) {
    $urlparams['workspaceid'] = $pageworkspaceid;
}
$returnurl = new moodle_url($pageworkspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $urlparams);
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(pql_url('/local/hubredirect/live_sessions.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Sessions');
$PAGE->set_heading('Live Sessions');
$PAGE->add_body_class('pqh-live-page');

function pql_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

function pql_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pql_live_tables_ready(): bool {
    return pql_table_exists('local_prequran_live_session')
        && pql_table_exists('local_prequran_live_participant')
        && pql_table_exists('local_prequran_live_audit');
}

function pql_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pql_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pql_valid_timezone(string $timezone): string {
    $timezone = trim($timezone);
    if ($timezone === '') {
        return 'Africa/Nairobi';
    }
    try {
        new DateTimeZone($timezone);
        return $timezone;
    } catch (Throwable $e) {
        return 'Africa/Nairobi';
    }
}

function pql_default_schedule_timezone(): string {
    $timezone = trim((string)get_config('local_prequran', 'live_schedule_timezone'));
    return pql_valid_timezone($timezone !== '' ? $timezone : 'Africa/Nairobi');
}

function pql_parse_local_datetime(string $date, string $time, string $timezone): int {
    $timezone = pql_valid_timezone($timezone);
    $value = trim($date) . ' ' . trim($time);
    try {
        $dt = DateTimeImmutable::createFromFormat('!Y-m-d H:i', $value, new DateTimeZone($timezone));
        if (!$dt) {
            return 0;
        }
        return $dt->getTimestamp();
    } catch (Throwable $e) {
        return 0;
    }
}

function pql_format_session_datetime(int $timestamp, string $timezone): string {
    $timezone = pql_valid_timezone($timezone);
    try {
        $dt = (new DateTimeImmutable('@' . $timestamp))->setTimezone(new DateTimeZone($timezone));
        return $dt->format('d/m/y, H:i');
    } catch (Throwable $e) {
        return userdate($timestamp, get_string('strftimedatetimeshort'), $timezone);
    }
}

function pql_series_ready(): bool {
    return pql_table_exists('local_prequran_live_series')
        && pql_column_exists('local_prequran_live_session', 'seriesid')
        && pql_column_exists('local_prequran_live_session', 'series_sequence');
}

function pql_is_managed_student(int $userid): bool {
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

function pql_is_teacher(int $userid): bool {
    global $DB;
    if (is_siteadmin($userid)) {
        return true;
    }
    if (pql_table_exists('local_prequran_teacher_student')
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

function pql_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    $explicit = false;

    if (pql_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records_sql(
            "SELECT studentid, MAX(cohortid) AS cohortid
               FROM {local_prequran_teacher_student}
              WHERE teacherid = :teacherid
                AND status = :status
           GROUP BY studentid",
            ['teacherid' => $teacherid, 'status' => 'active']
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $explicit = true;
                $students[$studentid] = ['studentid' => $studentid, 'cohortid' => (int)$row->cohortid];
            }
        }
    }

    if (!$explicit) {
        $teachercohorts = $DB->get_records('cohort_members', ['userid' => $teacherid], '', 'id, cohortid');
        foreach ($teachercohorts as $membership) {
            $cohortid = (int)$membership->cohortid;
            if ($cohortid <= 0) {
                continue;
            }
            $members = $DB->get_records('cohort_members', ['cohortid' => $cohortid], '', 'userid, cohortid');
            foreach ($members as $member) {
                $studentid = (int)$member->userid;
                if ($studentid > 0 && $studentid !== $teacherid && pql_is_managed_student($studentid)) {
                    $students[$studentid] = ['studentid' => $studentid, 'cohortid' => $cohortid];
                }
            }
        }
    }

    foreach ($students as $studentid => $student) {
        $user = core_user::get_user($studentid);
        $students[$studentid]['name'] = $user ? fullname($user) : 'Student ' . $studentid;
        if (empty($students[$studentid]['cohortid'])) {
            $cohortid = $DB->get_field_sql(
                "SELECT cohortid FROM {cohort_members} WHERE userid = ? ORDER BY id DESC",
                [$studentid],
                IGNORE_MULTIPLE
            );
            $students[$studentid]['cohortid'] = $cohortid ? (int)$cohortid : 0;
        }
    }

    uasort($students, function($a, $b) {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return array_values($students);
}

function pql_user_can_view_session($session): bool {
    global $DB, $USER;
    if (is_siteadmin($USER)) {
        return true;
    }
    if ((int)$session->teacherid === (int)$USER->id) {
        return true;
    }
    return $DB->record_exists('local_prequran_live_participant', [
        'sessionid' => (int)$session->id,
        'userid' => (int)$USER->id,
        'status' => 'active',
    ]);
}

function pql_agenda_slides_ready(): bool {
    return pql_column_exists('local_prequran_live_session', 'agenda_slides_path')
        && pql_column_exists('local_prequran_live_session', 'agenda_slides_filename');
}

function pql_agenda_slides_controls($session, string $returnurl): string {
    if (!pql_agenda_slides_ready()) {
        return '';
    }
    $sessionid = (int)$session->id;
    $html = html_writer::start_div('pql-agenda');
    if (trim((string)($session->agenda_slides_path ?? '')) !== '') {
        $filename = trim((string)($session->agenda_slides_filename ?? 'Agenda slides'));
        $html .= html_writer::link(
            pqh_live_session_agenda_file_url($sessionid),
            'Open agenda slides',
            ['class' => 'pql-btn pql-btn--light']
        );
        $html .= html_writer::link(
            pqh_live_session_agenda_editor_url($sessionid),
            'Edit online',
            ['class' => 'pql-btn pql-btn--light']
        );
        $html .= html_writer::link(
            pqh_live_session_materials_url($sessionid),
            'Quraan Materials',
            ['class' => 'pql-btn pql-btn--light', 'target' => '_blank', 'rel' => 'noopener']
        );
        $html .= html_writer::span('Attached: ' . s($filename), 'pql-agenda__status');
    } else {
        $html .= html_writer::span('No completed agenda slides attached yet.', 'pql-agenda__status');
        $html .= html_writer::link(
            pqh_live_session_agenda_editor_url($sessionid),
            'Create and edit online',
            ['class' => 'pql-btn pql-btn--light']
        );
        $html .= html_writer::link(
            pqh_live_session_materials_url($sessionid),
            'Quraan Materials',
            ['class' => 'pql-btn pql-btn--light', 'target' => '_blank', 'rel' => 'noopener']
        );
    }
    $html .= html_writer::start_tag('form', [
        'method' => 'post',
        'action' => pqh_live_session_agenda_upload_url($sessionid)->out(false),
        'enctype' => 'multipart/form-data',
        'class' => 'pql-agenda__form',
    ]);
    $html .= html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]);
    $html .= html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'return', 'value' => $returnurl]);
    $html .= html_writer::empty_tag('input', [
        'type' => 'file',
        'name' => 'agenda_file',
        'accept' => '.ppt,.pptx,.pdf',
        'required' => 'required',
        'class' => 'pql-agenda__file',
    ]);
    $html .= html_writer::tag('button', 'Attach agenda slides', ['class' => 'pql-btn pql-btn--light', 'type' => 'submit']);
    $html .= html_writer::end_tag('form');
    $html .= html_writer::end_div();
    return $html;
}

function pql_bbb_password($session, string $role): string {
    $secret = trim((string)get_config('local_prequran', 'bbb_shared_secret'));
    if ($secret === '') {
        return '';
    }
    return substr(sha1('prequran-live|' . (int)$session->id . '|' . (string)$session->bbb_meeting_id . '|' . $role . '|' . $secret), 0, 24);
}

function pql_bbb_is_configured(): bool {
    return trim((string)get_config('local_prequran', 'bbb_shared_secret')) !== '';
}

function pql_live_tutor_url($session, int $studentid = 0, bool $floating = true): moodle_url {
    $params = [
        'sessionid' => (int)$session->id,
        'embed' => 1,
        'panel' => 1,
        'frombbb' => 1,
    ];
    $context = pqh_requested_consumer_context();
    if (!empty($context->consumerslug)) {
        $params['consumer'] = (string)$context->consumerslug;
    }
    if ($floating) {
        $params['floating'] = 1;
    }
    if ($studentid > 0) {
        $params['studentid'] = $studentid;
    }
    if (!empty($session->workspaceid)) {
        $params['workspaceid'] = (int)$session->workspaceid;
    }
    return pql_url('/local/hubredirect/live_virtual_tutor.php', [], $params);
}

function pql_live_tutor_studentid($session, $participant): int {
    global $DB;
    if ($participant && (int)($participant->studentid ?? 0) > 0) {
        return (int)$participant->studentid;
    }
    if ($participant && (string)($participant->role ?? '') === 'student') {
        return (int)$participant->userid;
    }
    if (!pql_table_exists('local_prequran_live_participant')) {
        return 0;
    }
    $studentid = $DB->get_field_select(
        'local_prequran_live_participant',
        'studentid',
        'sessionid = ? AND status = ? AND role = ? AND studentid > 0',
        [(int)$session->id, 'active', 'student'],
        IGNORE_MULTIPLE
    );
    return $studentid ? (int)$studentid : 0;
}

function pql_live_launch_bridge(string $joinurl, moodle_url $tutorurl, moodle_url $lessonurl, $session, ?moodle_url $materialsurl = null, string $role = ''): void {
    global $OUTPUT, $PAGE;

    $PAGE->set_pagelayout('embedded');
    $PAGE->set_title('Please wait while the Live Session is being loaded');
    $PAGE->set_heading('Please wait while the Live Session is being loaded');

    $joinurljson = json_encode($joinurl);
    $tutorurljson = json_encode($tutorurl->out(false));
    $lessonurljson = json_encode($lessonurl->out(false));
    $materialsurljson = json_encode($materialsurl ? $materialsurl->out(false) : '');
    $openmaterialsjson = json_encode(in_array($role, ['teacher', 'admin_observer'], true));
    $sessiontitle = s((string)$session->title);

    echo $OUTPUT->header();
    ?>
<style>
html,body{min-height:100%;background:#f4f8f6!important}
body{margin:0!important}
body.pqh-live-page header,
body.pqh-live-page footer,
body.pqh-live-page nav.navbar,
body.pqh-live-page #page-header,
body.pqh-live-page #page-footer,
body.pqh-live-page .drawer,
body.pqh-live-page .drawer-toggles,
body.pqh-live-page .secondary-navigation{display:none!important}
.pql-bridge{min-height:100vh;display:grid;place-items:center;padding:24px;color:#243325;font-family:inherit}
.pql-bridge__card{width:min(560px,100%);padding:24px;border:1px solid rgba(105,76,45,.14);border-radius:14px;background:#fff;box-shadow:0 24px 70px rgba(23,48,68,.14)}
.pql-bridge__card h1{margin:0 0 8px;color:#221b22;font-size:28px;line-height:1.1;font-weight:950;letter-spacing:0}
.pql-bridge__card p{margin:0 0 18px;color:#60735f;font-size:15px;font-weight:800}
.pql-bridge__actions{display:flex;flex-wrap:wrap;gap:10px}
.pql-bridge__btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:10px;border:1px solid rgba(105,76,45,.18);background:#6f4e32;color:#fff!important;text-decoration:none!important;font-size:14px;font-weight:950;cursor:pointer}
.pql-bridge__btn--light{background:#fff7e7;color:#3f2c1f!important}
</style>
<main class="pql-bridge">
  <section class="pql-bridge__card">
    <h1><?php echo $sessiontitle; ?></h1>
    <p id="pql-bridge-status">Opening the BBB classroom. Open Virtual Tutor and Quraan Materials after the room is stable.</p>
    <div class="pql-bridge__actions">
      <button id="pql-open-tools" class="pql-bridge__btn pql-bridge__btn--light" type="button">Open Tutor + Materials</button>
      <?php if ($materialsurl): ?><a id="pql-open-materials" class="pql-bridge__btn pql-bridge__btn--light" target="_blank" rel="noopener" href="<?php echo $materialsurl->out(false); ?>">Open Quraan Materials</a><?php endif; ?>
      <button id="pql-open-class" class="pql-bridge__btn" type="button">Continue to Class</button>
    </div>
  </section>
</main>
<script>
(function(){
  var joinUrl = <?php echo $joinurljson; ?>;
  var tutorUrl = <?php echo $tutorurljson; ?>;
  var materialsUrl = <?php echo $materialsurljson; ?>;
  var shouldOpenMaterials = <?php echo $openmaterialsjson; ?>;
  var popupName = 'pqa_virtual_tutor_<?php echo (int)$session->id; ?>';
  var materialsPopupName = 'pqa_quraan_materials_<?php echo (int)$session->id; ?>';

  function parkedFeatures(index) {
    var screenWidth = window.screen && window.screen.availWidth ? window.screen.availWidth : 1280;
    var screenHeight = window.screen && window.screen.availHeight ? window.screen.availHeight : 820;
    var width = 320;
    var height = 220;
    var left = Math.max(0, screenWidth - width - 18);
    var top = Math.min(Math.max(0, screenHeight - height - 18), 24 + (index * 58));
    return 'popup=yes,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes';
  }

  function openTutor() {
    var popup = window.open('about:blank', popupName, parkedFeatures(0));
    if (popup) {
      try {
        popup.opener = null;
      } catch (e) {}
      try {
        popup.location.replace(tutorUrl);
      } catch (e) {
        popup.location.href = tutorUrl;
      }
      window.focus();
    }
    return !!popup;
  }

  function openMaterials() {
    if (!materialsUrl || !shouldOpenMaterials) {
      return false;
    }
    var popup = window.open(materialsUrl, materialsPopupName, parkedFeatures(1));
    if (popup) {
      window.focus();
      return true;
    }
    return false;
  }

  function openParkedTools() {
    openTutor();
    openMaterials();
  }

  function openClass() {
    window.location.replace(joinUrl);
  }

  var tutorButton = document.getElementById('pql-open-tutor');
  var toolsButton = document.getElementById('pql-open-tools');
  var materialsButton = document.getElementById('pql-open-materials');
  var classButton = document.getElementById('pql-open-class');
  var status = document.getElementById('pql-bridge-status');
  if (tutorButton) {
    tutorButton.addEventListener('click', openTutor);
  }
  if (materialsButton) {
    materialsButton.addEventListener('click', function(event){
      event.preventDefault();
      openMaterials();
    });
  }
  if (toolsButton) {
    toolsButton.addEventListener('click', openParkedTools);
  }
  if (classButton) {
    classButton.addEventListener('click', function(){
      openClass();
    });
  }

  window.setTimeout(function(){
    openClass();
    if (status) {
      status.textContent = 'Please wait while the Live Session is being loaded';
    }
  }, 200);
})();
</script>
    <?php
    echo $OUTPUT->footer();
    exit;
}

function pql_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pql_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pql_generate_recurring_starts(int $firststart, string $pattern, array $weekdays, int $until, int $count): array {
    $starts = [];
    $count = max(1, min(60, $count));
    $until = $until > 0 ? $until : $firststart;
    if ($pattern === 'none') {
        return [$firststart];
    }
    if ($pattern === 'daily') {
        $cursor = $firststart;
        while (count($starts) < $count && $cursor <= $until) {
            $starts[] = $cursor;
            $cursor += DAYSECS;
        }
        return $starts;
    }
    if ($pattern === 'weekly') {
        $cursor = $firststart;
        while (count($starts) < $count && $cursor <= $until) {
            $starts[] = $cursor;
            $cursor += WEEKSECS;
        }
        return $starts;
    }
    if ($pattern === 'weekdays') {
        $weekdays = array_values(array_unique(array_filter(array_map('intval', $weekdays), function($day) {
            return $day >= 0 && $day <= 6;
        })));
        if (!$weekdays) {
            $weekdays = [(int)date('w', $firststart)];
        }
        $cursor = $firststart;
        while (count($starts) < $count && $cursor <= $until) {
            if (in_array((int)date('w', $cursor), $weekdays, true)) {
                $starts[] = $cursor;
            }
            $cursor += DAYSECS;
        }
        return $starts;
    }
    return [$firststart];
}

function pql_teacher_availability_conflicts(int $teacherid, array $starts, int $duration): array {
    global $DB;
    if (!pql_table_exists('local_prequran_live_availability')) {
        return [];
    }
    $windows = $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active']);
    if (!$windows) {
        return [];
    }
    $conflicts = [];
    foreach ($starts as $start) {
        $weekday = (int)date('w', (int)$start);
        $minute = ((int)date('G', (int)$start) * 60) + (int)date('i', (int)$start);
        $endminute = $minute + max(15, $duration);
        $allowed = false;
        foreach ($windows as $window) {
            if ((int)$window->weekday === $weekday
                && $minute >= (int)$window->start_minute
                && $endminute <= (int)$window->end_minute) {
                $allowed = true;
                break;
            }
        }
        if (!$allowed) {
            $conflicts[] = [
                'type' => 'availability',
                'message' => 'Teacher is not marked available at ' . userdate((int)$start, get_string('strftimedatetimeshort')),
            ];
        }
    }
    return $conflicts;
}

function pql_schedule_conflicts(int $teacherid, array $studentids, array $starts, int $duration): array {
    global $DB;
    $conflicts = [];
    $maxparticipants = (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12;
    if ((count($studentids) + 1) > $maxparticipants) {
        $conflicts[] = [
            'type' => 'capacity',
            'message' => 'Selected group has ' . (count($studentids) + 1) . ' participants including teacher, above the BBB limit of ' . $maxparticipants . '.',
        ];
    }
    foreach (pql_teacher_availability_conflicts($teacherid, $starts, $duration) as $conflict) {
        $conflicts[] = $conflict;
    }
    foreach ($starts as $start) {
        $start = (int)$start;
        $end = $start + max(15, $duration) * MINSECS;
        $teacherconflicts = $DB->get_records_sql(
            "SELECT id, title, scheduled_start, scheduled_end
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
            $conflicts[] = [
                'type' => 'teacher_overlap',
                'message' => 'Teacher overlaps with "' . (string)$session->title . '" at ' . userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')) . '.',
            ];
        }
        if ($studentids) {
            list($insql, $inparams) = $DB->get_in_or_equal(array_values($studentids), SQL_PARAMS_NAMED, 'student');
            $params = $inparams + ['starttime' => $start, 'endtime' => $end];
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
                $params,
                0,
                10
            );
            foreach ($studentconflicts as $session) {
                $student = core_user::get_user((int)$session->studentid);
                $conflicts[] = [
                    'type' => 'student_overlap',
                    'message' => ($student ? fullname($student) : 'Student ' . (int)$session->studentid) . ' overlaps with "' . (string)$session->title . '" at ' . userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')) . '.',
                ];
            }
        }
    }
    return array_slice($conflicts, 0, 20);
}

function pql_conflict_message(array $conflicts): string {
    if (!$conflicts) {
        return '';
    }
    $lines = ['Schedule conflict detected. No sessions were created.'];
    foreach ($conflicts as $conflict) {
        $lines[] = '- ' . (string)$conflict['message'];
    }
    return implode("\n", $lines);
}

function pql_insert_live_session(int $teacherid, array $studentids, array $payload, int $start, int $duration, int $seriesid = 0, int $sequence = 0): int {
    global $DB, $USER;
    $now = time();
    $pendingmeetingid = 'prequran-live-pending-' . $now . '-' . random_string(8);
    $record = (object)[
        'cohortid' => (int)$payload['cohortid'],
        'teacherid' => $teacherid,
        'lessonid' => (string)$payload['lessonid'],
        'unitid' => (string)$payload['unitid'],
        'title' => (string)$payload['title'],
        'description' => '',
        'scheduled_start' => $start,
        'scheduled_end' => $start + max(15, $duration) * MINSECS,
        'timezone' => (string)$payload['timezone'],
        'status' => 'scheduled',
        'recording_enabled' => !empty($payload['recording_enabled']) ? 1 : 0,
        'recording_consent_required' => 1,
        'parent_observer_allowed' => 0,
        'max_participants' => (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12,
        'bbb_meeting_id' => $pendingmeetingid,
        'bbb_internal_meeting_id' => '',
        'bbb_created' => 0,
        'bbb_create_time' => 0,
        'bbb_last_error' => '',
        'createdby' => (int)$USER->id,
        'cancelledby' => 0,
        'cancellation_reason' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    if (pql_series_ready()) {
        $record->seriesid = $seriesid;
        $record->series_sequence = $sequence;
    }
    if (pql_column_exists('local_prequran_live_session', 'groupid')) {
        $record->groupid = (int)($payload['groupid'] ?? 0);
    }
    if (pql_column_exists('local_prequran_live_session', 'workspaceid')) {
        $record->workspaceid = (int)($payload['workspaceid'] ?? 0);
    }
    $sessionid = (int)$DB->insert_record('local_prequran_live_session', $record);
    $DB->set_field('local_prequran_live_session', 'bbb_meeting_id', 'prequran-live-' . $sessionid, ['id' => $sessionid]);
    try {
        pqh_attach_default_agenda_to_live_session($sessionid, (int)$USER->id);
        pql_audit($sessionid, 'agenda_slides_auto_attached', 'session', $sessionid, ['source' => 'live_session_create']);
    } catch (Throwable $e) {
        pql_audit($sessionid, 'agenda_slides_auto_attach_failed', 'session', $sessionid, ['error' => $e->getMessage()]);
    }

    $teacher = core_user::get_user($teacherid);
    $DB->insert_record('local_prequran_live_participant', (object)[
        'sessionid' => $sessionid,
        'userid' => $teacherid,
        'role' => 'teacher',
        'studentid' => 0,
        'status' => 'active',
        'displayname' => $teacher ? fullname($teacher) : 'Teacher ' . $teacherid,
        'invitedby' => (int)$USER->id,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    foreach ($studentids as $studentid) {
        $student = core_user::get_user((int)$studentid);
        $DB->insert_record('local_prequran_live_participant', (object)[
            'sessionid' => $sessionid,
            'userid' => (int)$studentid,
            'role' => 'student',
            'studentid' => (int)$studentid,
            'status' => 'active',
            'displayname' => $student ? fullname($student) : 'Student ' . (int)$studentid,
            'invitedby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }
    return $sessionid;
}

function pql_mark_student_join($session, $participant, string $role): void {
    global $DB, $USER;
    if ($role !== 'student' || !$participant || empty($participant->studentid)) {
        return;
    }
    if (!pql_table_exists('local_prequran_live_attendance')) {
        return;
    }
    $now = time();
    $studentid = (int)$participant->studentid;
    $status = $now > ((int)$session->scheduled_start + (5 * MINSECS)) ? 'late' : 'present';
    $existing = $DB->get_record('local_prequran_live_attendance', [
        'sessionid' => (int)$session->id,
        'studentid' => $studentid,
    ]);
    if ($existing) {
        if (empty($existing->join_time)) {
            $existing->join_time = $now;
        }
        $existing->attendance_status = $status;
        $existing->participation_status = 'joined';
        $existing->userid = (int)$USER->id;
        $existing->timemodified = $now;
        $DB->update_record('local_prequran_live_attendance', $existing);
        return;
    }
    $DB->insert_record('local_prequran_live_attendance', (object)[
        'sessionid' => (int)$session->id,
        'userid' => (int)$USER->id,
        'studentid' => $studentid,
        'join_time' => $now,
        'leave_time' => 0,
        'attendance_status' => $status,
        'participation_status' => 'joined',
        'technical_issue' => 0,
        'notes' => '',
        'markedby' => (int)$USER->id,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pql_visible_sessions(): array {
    global $DB, $USER;
    if (is_siteadmin($USER)) {
        return array_values($DB->get_records_sql(
            "SELECT * FROM {local_prequran_live_session}
              WHERE scheduled_end >= :fromtime
           ORDER BY scheduled_start ASC, id ASC",
            ['fromtime' => time()]
        ));
    }
    return array_values($DB->get_records_sql(
        "SELECT DISTINCT s.*
           FROM {local_prequran_live_session} s
      LEFT JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
          WHERE s.scheduled_end >= :fromtime
            AND (s.teacherid = :teacherid OR (p.userid = :userid AND p.status = :status))
       ORDER BY s.scheduled_start ASC, s.id ASC",
        ['fromtime' => time(), 'teacherid' => (int)$USER->id, 'userid' => (int)$USER->id, 'status' => 'active']
    ));
}

function pql_delete_expired_live_sessions(int $beforetime): int {
    global $DB;
    if (!pql_live_tables_ready()) {
        return 0;
    }
    $sessionids = $DB->get_fieldset_select(
        'local_prequran_live_session',
        'id',
        'scheduled_end < ?',
        [max(0, $beforetime)]
    );
    $sessionids = array_values(array_filter(array_map('intval', $sessionids)));
    if (!$sessionids) {
        return 0;
    }

    [$insql, $params] = $DB->get_in_or_equal($sessionids, SQL_PARAMS_NAMED, 'expiredsession');
    $transaction = $DB->start_delegated_transaction();
    foreach ([
        'local_prequran_live_participant',
        'local_prequran_live_attendance',
        'local_prequran_live_note',
        'local_prequran_live_recording',
        'local_prequran_live_audit',
    ] as $table) {
        if (pql_table_exists($table)) {
            $DB->delete_records_select($table, "sessionid $insql", $params);
        }
    }
    $DB->delete_records_select('local_prequran_live_session', "id $insql", $params);
    $transaction->allow_commit();

    pql_audit(0, 'expired_sessions_deleted', 'session', 0, [
        'count' => count($sessionids),
        'beforetime' => $beforetime,
        'sessionids' => $sessionids,
    ]);
    return count($sessionids);
}

$notice = '';
$error = '';
$canmanage = is_siteadmin($USER) || (pql_is_teacher((int)$USER->id) && !pql_is_managed_student((int)$USER->id));
$prefillteacherid = optional_param('teacherid', 0, PARAM_INT);
$prefillgroupid = optional_param('groupid', 0, PARAM_INT);
$prefillstudentidsraw = optional_param('studentids_raw', '', PARAM_RAW);
$prefilltitle = optional_param('title', 'Pre-Quran review session', PARAM_TEXT);
$prefillsessiondate = optional_param('sessiondate', '', PARAM_TEXT);
$prefillsessiontime = optional_param('sessiontime', '', PARAM_TEXT);
$prefillduration = optional_param('duration', 60, PARAM_INT);
$prefilllessonid = optional_param('lessonid', '', PARAM_ALPHANUMEXT);
$prefillunitid = optional_param('unitid', '', PARAM_ALPHANUMEXT);
$prefillrecording = optional_param('recording_enabled', 0, PARAM_BOOL);
$prefilloverride = optional_param('override_conflicts', 0, PARAM_BOOL);
$prefilloverridereason = optional_param('override_reason', '', PARAM_TEXT);
$prefillcreatedfromwizard = optional_param('created_from_wizard', 0, PARAM_BOOL);

if (!pql_live_tables_ready()) {
    $error = 'Live-session tables are not installed yet.';
}

if ($error === '' && data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'delete_expired') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please refresh the live sessions page and try again.', $returnurl, 'Live sessions action expired');
    }
    if (!is_siteadmin($USER)) {
        pqh_access_denied('Only site administrators can delete expired live sessions.', $returnurl, 'Live sessions access required');
    }
    $deletedcount = pql_delete_expired_live_sessions(time());
    redirect(pql_url('/local/hubredirect/live_sessions.php', $urlparams, ['expireddeleted' => $deletedcount]));
}

if ($error === '' && optional_param('action', '', PARAM_ALPHANUMEXT) === 'join') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen the live session from the schedule.', $returnurl, 'Live session link expired');
    }
    $sessionid = optional_param('sessionid', 0, PARAM_INT);
    $workspaceid = optional_param('workspaceid', 0, PARAM_INT);
    if ($workspaceid <= 0) {
        $workspaceid = $pageworkspaceid;
    }
    if ($sessionid <= 0) {
        pqh_access_denied('Choose a valid live session before joining.', $returnurl, 'Live session unavailable');
    }
    $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING);
    if (!$session) {
        pqh_access_denied('This live session could not be found. It may have expired or been removed.', $returnurl, 'Live session unavailable');
    }
    if ($workspaceid <= 0 && !empty($session->workspaceid)) {
        $workspaceid = (int)$session->workspaceid;
    }
    $sessionurlparams = $urlparams;
    if ($workspaceid > 0) {
        $sessionurlparams['workspaceid'] = $workspaceid;
    }
    if (!pql_user_can_view_session($session)) {
        pqh_access_denied('You cannot join this live session.', $returnurl, 'Live session access required');
    }
    if (in_array((string)$session->status, ['cancelled', 'failed'], true)) {
        pqh_access_denied('This live session is not available.', $returnurl, 'Live session unavailable');
    }

    $participant = $DB->get_record('local_prequran_live_participant', [
        'sessionid' => (int)$session->id,
        'userid' => (int)$USER->id,
        'status' => 'active',
    ]);
    $role = '';
    if (is_siteadmin($USER)) {
        $role = 'admin_observer';
    } else if ((int)$session->teacherid === (int)$USER->id || ($participant && (string)$participant->role === 'teacher')) {
        $role = 'teacher';
    } else if ($participant && (string)$participant->role === 'student') {
        $role = 'student';
    } else if ($participant && (string)$participant->role === 'parent_observer' && !empty($session->parent_observer_allowed)) {
        $role = 'parent_observer';
    }
    if ($role === '') {
        pqh_access_denied('You cannot join this live session.', $returnurl, 'Live session access required');
    }

    if (in_array($role, ['student', 'parent_observer'], true)) {
        $before = ((int)get_config('local_prequran', 'bbb_join_window_before_minutes') ?: 10) * MINSECS;
        $after = ((int)get_config('local_prequran', 'bbb_join_window_after_minutes') ?: 15) * MINSECS;
        $now = time();
        $teacherstarted = !empty($session->bbb_created) && (string)$session->status === 'live';
        if ($now > ((int)$session->scheduled_end + $after)
            || (!$teacherstarted && $now < ((int)$session->scheduled_start - $before))) {
            pqh_access_denied('This live session is outside the student join window.', $returnurl, 'Live session not open yet');
        }
    }

    $locallib = $CFG->dirroot . '/local/prequran/locallib.php';
    if (!file_exists($locallib)) {
        pqh_access_denied('The live classroom service is not ready. Please ask support to review the live-room configuration.', $returnurl, 'Live classroom unavailable');
    }
    require_once($locallib);

    $studentid = pql_live_tutor_studentid($session, $participant);
    $tutorurl = pql_live_tutor_url($session, $studentid, true);
    $tutorurlout = $tutorurl->out(false);
    $unitid = trim((string)($session->unitid ?? ''));
    $lessonurl = pql_url('/local/hubredirect/issue_child.php', $sessionurlparams, [
        'goto' => $unitid !== '' ? $unitid : 'alphabet_listen',
        'managed_student' => 0,
        'monitor_studentid' => $studentid,
        'live_sessionid' => $sessionid,
    ]);
    $lessonurlout = $lessonurl->out(false);
    $welcometext = 'Welcome to ' . $pqlbrandname . '.';

    if (empty($session->bbb_created)) {
        if (!in_array($role, ['teacher', 'admin_observer'], true)) {
            pqh_access_denied('The teacher has not started this live session yet.', $returnurl, 'Live session not started');
        }
        if (!pql_bbb_is_configured()) {
            pqh_access_denied('The live room could not be started. Please ask support to review the BigBlueButton configuration.', $returnurl, 'Live room unavailable');
        }
        $recordingdecision = local_prequran_live_recording_consent_decision($session);
        $recordingallowed = !empty($recordingdecision['allowed']);
        if (!empty($recordingdecision['requested']) && !$recordingallowed) {
            pql_audit((int)$session->id, 'recording_disabled_missing_consent', 'session', (int)$session->id, [
                'missing_studentids' => $recordingdecision['missing_studentids'],
                'studentids' => $recordingdecision['studentids'],
                'reason' => $recordingdecision['reason'],
            ]);
        }
        try {
            $meetingparams = [
                'meetingID' => (string)$session->bbb_meeting_id,
                'name' => (string)$session->title,
                'attendeePW' => pql_bbb_password($session, 'attendee'),
                'moderatorPW' => pql_bbb_password($session, 'moderator'),
                'record' => $recordingallowed,
                'autoStartRecording' => $recordingallowed,
                'muteOnStart' => true,
                'maxParticipants' => (int)$session->max_participants,
                'duration' => max(60, (int)ceil(((int)$session->scheduled_end - (int)$session->scheduled_start) / 60) + 30),
                'logoutURL' => pql_url('/local/hubredirect/live_sessions.php', $sessionurlparams)->out(false),
                'welcome' => $welcometext,
                'lockSettingsDisableCam' => true,
                'disabledFeatures' => 'virtualBackgrounds,customVirtualBackgrounds,cameraAsContent',
            ];
            $xml = local_prequran_bbb_create_meeting($meetingparams);
        } catch (Throwable $e) {
            $session->bbb_last_error = $e->getMessage();
            $session->timemodified = time();
            $DB->update_record('local_prequran_live_session', $session);
            pql_audit((int)$session->id, 'bbb_create_failed', 'session', (int)$session->id, ['error' => $e->getMessage()]);
            pqh_access_denied('The live room could not be started. Please ask support to review the BigBlueButton configuration.', $returnurl, 'Live room unavailable');
        }
        $session->bbb_internal_meeting_id = (string)($xml->internalMeetingID ?? '');
        $session->bbb_created = 1;
        $session->bbb_create_time = time();
        if (!empty($recordingdecision['requested']) && !$recordingallowed) {
            $session->recording_enabled = 0;
        }
        $session->status = 'live';
        $session->timemodified = time();
        $DB->update_record('local_prequran_live_session', $session);
        pql_audit((int)$session->id, 'bbb_created', 'session', (int)$session->id, [
            'recording_requested' => !empty($recordingdecision['requested']),
            'recording_enabled' => $recordingallowed,
            'recording_consent_reason' => $recordingdecision['reason'],
        ]);
    }

    try {
        if (!pql_bbb_is_configured()) {
            pqh_access_denied('The live room is not available yet. Please ask support to review the live-room configuration.', $returnurl, 'Live room unavailable');
        }
        $joinurl = local_prequran_bbb_join_url(
            (string)$session->bbb_meeting_id,
            fullname($USER),
            in_array($role, ['teacher', 'admin_observer'], true) ? pql_bbb_password($session, 'moderator') : pql_bbb_password($session, 'attendee'),
            (int)$USER->id,
            [
                'userdata-prequran-role' => $role,
                'userdata-prequran-sessionid' => (int)$session->id,
                'userdata-prequran-workspaceid' => $workspaceid > 0 ? $workspaceid : (int)($session->workspaceid ?? 0),
                'userdata-prequran-studentid' => $studentid,
            ]
        );
    } catch (Throwable $e) {
        pql_audit((int)$session->id, 'bbb_join_failed', 'session', (int)$session->id, ['error' => $e->getMessage()]);
        pqh_access_denied('The live room is not available yet. Please ask support to review the live-room configuration.', $returnurl, 'Live room unavailable');
    }
    pql_audit((int)$session->id, 'join_redirect', 'user', (int)$USER->id, ['role' => $role]);
    pql_mark_student_join($session, $participant, $role);
    pql_live_launch_bridge($joinurl, $tutorurl, $lessonurl, $session, pqh_live_session_materials_control_url((int)$session->id), $role);
}

if ($error === '' && data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'create') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please refresh the live sessions page and try again.', $returnurl, 'Live sessions action expired');
    }
    if (!$canmanage) {
        pqh_access_denied('You cannot create live sessions.', $returnurl, 'Live sessions access required');
    }
    $createdfromwizard = optional_param('created_from_wizard', 0, PARAM_BOOL);

    $teacherid = is_siteadmin($USER) ? optional_param('teacherid', 0, PARAM_INT) : (int)$USER->id;
    $title = trim(optional_param('title', '', PARAM_TEXT));
    $date = trim(optional_param('sessiondate', '', PARAM_TEXT));
    $time = trim(optional_param('sessiontime', '', PARAM_TEXT));
    $duration = optional_param('duration', 60, PARAM_INT);
    $lessonid = optional_param('lessonid', '', PARAM_ALPHANUMEXT);
    $unitid = optional_param('unitid', '', PARAM_ALPHANUMEXT);
    $cohortid = optional_param('cohortid', 0, PARAM_INT);
    $groupid = optional_param('groupid', 0, PARAM_INT);
    $recording = optional_param('recording_enabled', 0, PARAM_BOOL);
    $recurring = optional_param('recurring_enabled', 0, PARAM_BOOL);
    $recurrencepattern = optional_param('recurrence_pattern', 'none', PARAM_ALPHANUMEXT);
    $recurrenceuntil = optional_param('recurrence_until', '', PARAM_TEXT);
    $recurrencecount = optional_param('recurrence_count', 4, PARAM_INT);
    $recurrenceweekdays = optional_param_array('recurrence_weekdays', [], PARAM_INT);
    $overrideconflicts = optional_param('override_conflicts', 0, PARAM_BOOL);
    $overridereason = trim(optional_param('override_reason', '', PARAM_TEXT));
    $studentids = optional_param_array('studentids', [], PARAM_INT);
    $studentidsraw = optional_param('studentids_raw', '', PARAM_RAW);
    if ($studentidsraw !== '') {
        $studentids = array_merge($studentids, array_map('intval', preg_split('/[\s,]+/', $studentidsraw, -1, PREG_SPLIT_NO_EMPTY)));
    }
    if ($groupid > 0 && pql_table_exists('local_prequran_group_member')) {
        $groupmembers = $DB->get_records('local_prequran_group_member', ['groupid' => $groupid, 'assignment_status' => 'active'], '', 'id, studentid');
        foreach ($groupmembers as $member) {
            $studentids[] = (int)$member->studentid;
        }
    }
    $studentids = array_values(array_unique(array_filter(array_map('intval', $studentids))));
    if ($teacherid <= 0) {
        $error = 'Choose a teacher user ID.';
    } else if ($title === '') {
        $error = 'Enter a live session title.';
    } else if ($date === '' || $time === '') {
        $error = 'Choose a live session date and time.';
    } else if ($lessonid === '' || $unitid === '') {
        $error = 'Choose the lesson ID and unit ID for this live review session.';
    } else if (!$studentids) {
        $error = 'Choose at least one student.';
    } else {
        $tz = pql_valid_timezone(optional_param('timezone', pql_default_schedule_timezone(), PARAM_TEXT));
        $start = pql_parse_local_datetime($date, $time, $tz);
        if (!$start) {
            $error = 'Enter a valid date and time.';
        } else {
            if ($recurring && !pql_series_ready()) {
                $error = 'Recurring classes need the Phase 16 series SQL installed first.';
            } else {
                $payload = [
                    'cohortid' => $cohortid,
                    'groupid' => $groupid,
                    'workspaceid' => $pageworkspaceid,
                    'lessonid' => $lessonid,
                    'unitid' => $unitid,
                    'title' => $title,
                    'timezone' => $tz,
                    'recording_enabled' => $recording,
                ];
                $sessionids = [];
                $seriesid = 0;
                $starts = [$start];
                if ($recurring) {
                    $until = $recurrenceuntil !== '' ? strtotime($recurrenceuntil . ' 23:59:59 ' . $tz) : ($start + (30 * DAYSECS));
                    $starts = pql_generate_recurring_starts($start, $recurrencepattern, $recurrenceweekdays, (int)$until, $recurrencecount);
                    if (!$starts) {
                        $starts = [$start];
                    }
                }
                $conflicts = pql_schedule_conflicts($teacherid, $studentids, $starts, $duration);
                $canoverride = is_siteadmin($USER) && $overrideconflicts && $overridereason !== '';
                if ($conflicts && !$canoverride) {
                    pql_audit(0, 'schedule_conflict_blocked', $recurring ? 'series' : 'session', 0, ['conflicts' => $conflicts, 'teacherid' => $teacherid, 'students' => $studentids]);
                    $error = pql_conflict_message($conflicts);
                } else if ($conflicts && $canoverride) {
                    pql_audit(0, 'schedule_conflict_override', $recurring ? 'series' : 'session', 0, ['conflicts' => $conflicts, 'teacherid' => $teacherid, 'students' => $studentids, 'reason' => $overridereason]);
                }
                if ($error !== '') {
                    // Keep the form visible with the conflict message.
                } else
                if ($recurring) {
                    $now = time();
                    $seriesrecord = (object)[
                        'cohortid' => $cohortid,
                        'teacherid' => $teacherid,
                        'title' => $title,
                        'lessonid' => $lessonid,
                        'unitid' => $unitid,
                        'pattern' => $recurrencepattern,
                        'weekdays' => implode(',', array_map('intval', $recurrenceweekdays)),
                        'start_time' => $time,
                        'duration_minutes' => max(15, $duration),
                        'date_start' => min($starts),
                        'date_end' => max($starts),
                        'session_count' => count($starts),
                        'status' => 'active',
                        'createdby' => (int)$USER->id,
                        'cancelledby' => 0,
                        'cancellation_reason' => '',
                        'timecreated' => $now,
                        'timemodified' => $now,
                    ];
                    if (pql_column_exists('local_prequran_live_series', 'groupid')) {
                        $seriesrecord->groupid = $groupid;
                    }
                    if (pql_column_exists('local_prequran_live_series', 'workspaceid')) {
                        $seriesrecord->workspaceid = $pageworkspaceid;
                    }
                    $seriesid = (int)$DB->insert_record('local_prequran_live_series', $seriesrecord);
                    pql_audit(0, $createdfromwizard ? 'series_created_from_wizard' : 'series_created', 'series', $seriesid, ['students' => $studentids, 'sessions' => count($starts), 'pattern' => $recurrencepattern]);
                    $sequence = 1;
                    foreach ($starts as $sessionstart) {
                        $sessionid = pql_insert_live_session($teacherid, $studentids, $payload, (int)$sessionstart, $duration, $seriesid, $sequence);
                        $sessionids[] = $sessionid;
                        pql_audit($sessionid, 'series_session_created', 'series', $seriesid, ['sequence' => $sequence, 'seriesid' => $seriesid]);
                        $sequence++;
                    }
                } else {
                    $sessionid = pql_insert_live_session($teacherid, $studentids, $payload, $start, $duration);
                    $sessionids[] = $sessionid;
                    pql_audit($sessionid, $createdfromwizard ? 'created_from_wizard' : 'created_from_ui', 'session', $sessionid, ['students' => $studentids]);
                }
                redirect(pql_url('/local/hubredirect/live_sessions.php', $urlparams, ['created' => count($sessionids), 'seriesid' => $seriesid, 'wizard' => $createdfromwizard ? 1 : 0]));
            }
        }
    }
}

$createdcount = optional_param('created', 0, PARAM_INT);
if ($createdcount > 0) {
    $notice = $createdcount > 1 ? $createdcount . ' recurring live sessions created.' : 'Live session created.';
    if (optional_param('wizard', 0, PARAM_BOOL)) {
        $notice = $createdcount > 1 ? $createdcount . ' recurring live sessions created from wizard.' : 'Live session created from wizard.';
    }
}
$expireddeleted = optional_param('expireddeleted', -1, PARAM_INT);
if ($expireddeleted >= 0) {
    $notice = $expireddeleted > 0
        ? $expireddeleted . ' expired live session(s) deleted.'
        : 'No expired live sessions were found.';
}

$teacherstudents = $canmanage && !is_siteadmin($USER) ? pql_teacher_students((int)$USER->id) : [];
$classgroups = (is_siteadmin($USER) && pql_table_exists('local_prequran_class_group'))
    ? $DB->get_records_select('local_prequran_class_group', "status IN ('open', 'active')", [], 'title ASC', '*', 0, 100)
    : [];
$sessions = $error === '' ? pql_visible_sessions() : [];

echo $OUTPUT->header();
?>
<style>
body.pqh-live-page header,
body.pqh-live-page footer,
body.pqh-live-page nav.navbar,
body.pqh-live-page #page-header,
body.pqh-live-page #page-footer,
body.pqh-live-page .drawer,
body.pqh-live-page .drawer-toggles,
body.pqh-live-page .block-region,
body.pqh-live-page [data-region="drawer"],
body.pqh-live-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-page #page,
body.pqh-live-page #page-content,
body.pqh-live-page #region-main,
body.pqh-live-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pql-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pql-wrap{max-width:1120px;margin:0 auto}
.pql-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pql-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pql-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pql-grid{display:grid;grid-template-columns:minmax(300px,390px) 1fr;gap:16px;align-items:start}
.pql-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pql-panel h2{margin:0 0 13px;font-size:20px;font-weight:950}
.pql-field{display:grid;gap:6px;margin-bottom:12px}
.pql-field label{font-size:13px;font-weight:900;color:#415665}
.pql-input,.pql-select{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}
.pql-checks{display:grid;max-height:230px;overflow:auto;border:1px solid rgba(23,48,68,.14);border-radius:8px;background:#fbfdff}
.pql-check{display:flex;gap:9px;align-items:center;padding:9px 10px;border-bottom:1px solid rgba(23,48,68,.08);font-size:13px;font-weight:850}
.pql-check:last-child{border-bottom:0}
.pql-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}
.pql-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pql-btn--start{background:#6f4e32}
.pql-btn--danger{background:#8a332b}
.pql-inline-form{display:inline-flex;margin:0}
.pql-alert{margin-bottom:14px;padding:12px 14px;border-radius:8px;font-size:14px;font-weight:850;white-space:pre-line}
.pql-alert--ok{background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16)}
.pql-alert--bad{background:#fff0ed;color:#883526;border:1px solid rgba(136,53,38,.16)}
.pql-list{display:grid;gap:12px}
.pql-card{padding:16px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pql-card__head{display:flex;justify-content:space-between;gap:12px;margin-bottom:8px}
.pql-card h3{margin:0;font-size:18px;font-weight:950}
.pql-meta{margin:5px 0 0;color:#5e7280;font-size:13px;font-weight:800}
.pql-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pql-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}
.pql-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pql-help{margin:0;color:#718390;font-size:12px;font-weight:750}
.pql-subgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pql-recurring{margin:12px 0;padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fbfdff}
.pql-recurring h3{margin:0 0 10px;font-size:16px;font-weight:950;color:#173044}
.pql-agenda{display:flex;flex:1 0 100%;flex-wrap:wrap;align-items:center;gap:9px;margin-top:12px;padding:10px;border:1px solid rgba(23,48,68,.1);border-radius:10px;background:#fbfdff}
.pql-agenda__form{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0}
.pql-agenda__file{max-width:260px;font-size:12px;font-weight:800;color:#415665}
.pql-agenda__status{color:#5e7280;font-size:12px;font-weight:850}
@media(max-width:850px){.pql-grid{grid-template-columns:1fr}.pql-top{display:block}.pql-title{font-size:24px}.pql-agenda__file{max-width:100%}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pql-shell">
  <div class="pql-wrap">
    <section class="pql-top pqh-workspace-top">
      <div>
        <h1 class="pql-title pqh-workspace-title">Live Sessions</h1>
        <p class="pql-sub pqh-workspace-sub">Schedule, start, and join <?php echo s($pqlbrandname); ?> review classes through BigBlueButton.</p>
      </div>
      <div class="pql-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <?php echo pqh_live_session_agenda_template_link(); ?>
        <button class="pql-btn pql-btn--light" type="button" onclick="window.history.back()">Back</button>
        <a class="pql-btn pql-btn--light" href="<?php echo $returnurl->out(false); ?>">Dashboard</a>
        <?php if (is_siteadmin($USER)): ?>
          <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_admin.php', $urlparams)->out(false); ?>">Admin menu</a>
          <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_ops.php', $urlparams)->out(false); ?>">Operations</a>
          <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_diagnostics.php', $urlparams)->out(false); ?>">Diagnostics</a>
          <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_recordings_admin.php', $urlparams)->out(false); ?>">Recording review</a>
          <form method="post" class="pql-inline-form" onsubmit="return confirm('Delete all expired live sessions and their participant, attendance, note, recording metadata, and audit rows? This cannot be undone.');">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="delete_expired">
            <button class="pql-btn pql-btn--danger" type="submit">Delete expired sessions</button>
          </form>
        <?php endif; ?>
        <?php if ($canmanage): ?>
          <?php if (is_siteadmin($USER)): ?>
            <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_create_wizard.php', $urlparams)->out(false); ?>">Create wizard</a>
            <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_series_wizard.php', $urlparams)->out(false); ?>">Series wizard</a>
          <?php endif; ?>
          <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_teacher.php', $urlparams)->out(false); ?>">Teacher workspace</a>
          <?php if (is_siteadmin($USER)): ?>
            <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_capacity.php', $urlparams)->out(false); ?>">Capacity planning</a>
          <?php endif; ?>
          <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_series.php', $urlparams)->out(false); ?>">Class series</a>
          <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_availability.php', $urlparams)->out(false); ?>">Availability</a>
        <?php endif; ?>
        <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_schedule.php', $urlparams)->out(false); ?>">Live schedule</a>
        <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_calendar.php', $urlparams)->out(false); ?>">Calendar</a>
        <a class="pql-btn pql-btn--light" href="<?php echo pql_url('/local/hubredirect/live_summaries.php', $urlparams)->out(false); ?>">Live summaries</a>
        <a class="pql-btn pqh-workspace-logout" href="<?php echo pql_url('/local/hubredirect/logout.php', $urlparams)->out(false); ?>">Logout</a>
      </div>
    </section>

    <?php if ($notice !== ''): ?><div class="pql-alert pql-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pql-alert pql-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <div class="pql-grid">
      <?php if ($canmanage && pql_live_tables_ready()): ?>
      <section class="pql-panel">
        <h2><?php echo $prefillcreatedfromwizard ? 'Complete Wizard Session' : 'Create Session'; ?></h2>
        <form method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="create">
          <input type="hidden" name="timezone" value="<?php echo s(pql_default_schedule_timezone()); ?>">
          <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
          <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
          <?php if ($prefillcreatedfromwizard): ?><input type="hidden" name="created_from_wizard" value="1"><?php endif; ?>
          <?php if (is_siteadmin($USER)): ?>
            <div class="pql-field">
              <label for="teacherid">Teacher user ID</label>
              <input class="pql-input" id="teacherid" name="teacherid" type="number" min="1" value="<?php echo (int)$prefillteacherid; ?>" required>
            </div>
            <?php if ($classgroups): ?>
              <div class="pql-field">
                <label for="groupid">Class group</label>
                <select class="pql-input" id="groupid" name="groupid">
                  <option value="0">No class group</option>
                  <?php foreach ($classgroups as $group): ?>
                    <option value="<?php echo (int)$group->id; ?>" <?php echo $prefillgroupid === (int)$group->id ? 'selected' : ''; ?>><?php echo s((string)$group->title . ' #' . (int)$group->id); ?></option>
                  <?php endforeach; ?>
                </select>
                <p class="pql-help">Choosing a class group automatically includes its active students. You can still add extra student IDs below.</p>
              </div>
            <?php endif; ?>
            <div class="pql-field">
              <label for="studentids_raw">Student user IDs</label>
              <input class="pql-input" id="studentids_raw" name="studentids_raw" type="text" value="<?php echo s($prefillstudentidsraw); ?>" placeholder="101, 102, 103">
              <p class="pql-help">Comma or space separated. Teacher accounts see a checklist instead.</p>
            </div>
          <?php else: ?>
            <input type="hidden" name="teacherid" value="<?php echo (int)$USER->id; ?>">
            <div class="pql-field">
              <label>Students</label>
              <div class="pql-checks">
                <?php foreach ($teacherstudents as $student): ?>
                  <label class="pql-check">
                    <input type="checkbox" name="studentids[]" value="<?php echo (int)$student['studentid']; ?>">
                    <span><?php echo s($student['name']); ?></span>
                  </label>
                <?php endforeach; ?>
                <?php if (!$teacherstudents): ?><div class="pql-check">No assigned students found.</div><?php endif; ?>
              </div>
            </div>
          <?php endif; ?>
          <div class="pql-field">
            <label for="title">Title</label>
            <input class="pql-input" id="title" name="title" type="text" value="<?php echo s($prefilltitle); ?>" required>
          </div>
          <div class="pql-field">
            <label for="sessiondate">Date</label>
            <input class="pql-input" id="sessiondate" name="sessiondate" type="date" value="<?php echo s($prefillsessiondate); ?>" required>
          </div>
          <div class="pql-field">
            <label for="sessiontime">Time</label>
            <input class="pql-input" id="sessiontime" name="sessiontime" type="time" value="<?php echo s($prefillsessiontime); ?>" required>
          </div>
          <div class="pql-field">
            <label for="duration">Duration</label>
            <select class="pql-select" id="duration" name="duration">
              <?php foreach ([60, 45, 75, 90] as $minutes): ?>
                <option value="<?php echo (int)$minutes; ?>" <?php echo (int)$prefillduration === $minutes ? 'selected' : ''; ?>><?php echo (int)$minutes; ?> minutes</option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="pql-recurring">
            <h3>Recurring Class</h3>
            <?php if (!pql_series_ready()): ?>
              <p class="pql-help">Run the Phase 16 series SQL before creating recurring classes. One-time sessions still work.</p>
            <?php endif; ?>
            <label class="pql-check" style="border:0;padding-left:0">
              <input type="checkbox" name="recurring_enabled" value="1" <?php echo pql_series_ready() ? '' : 'disabled'; ?>>
              <span>Create multiple sessions as a class series</span>
            </label>
            <div class="pql-field">
              <label for="recurrence_pattern">Repeat</label>
              <select class="pql-select" id="recurrence_pattern" name="recurrence_pattern" <?php echo pql_series_ready() ? '' : 'disabled'; ?>>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="weekdays">Selected weekdays</option>
              </select>
            </div>
            <div class="pql-checks" style="max-height:none;margin-bottom:12px">
              <?php foreach ([1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 0 => 'Sun'] as $day => $label): ?>
                <label class="pql-check">
                  <input type="checkbox" name="recurrence_weekdays[]" value="<?php echo (int)$day; ?>" <?php echo pql_series_ready() ? '' : 'disabled'; ?>>
                  <span><?php echo s($label); ?></span>
                </label>
              <?php endforeach; ?>
            </div>
            <div class="pql-subgrid pqh-workspace-sub">
              <div class="pql-field">
                <label for="recurrence_count">Max Sessions</label>
                <input class="pql-input" id="recurrence_count" name="recurrence_count" type="number" min="1" max="60" value="8" <?php echo pql_series_ready() ? '' : 'disabled'; ?>>
              </div>
              <div class="pql-field">
                <label for="recurrence_until">Until Date</label>
                <input class="pql-input" id="recurrence_until" name="recurrence_until" type="date" <?php echo pql_series_ready() ? '' : 'disabled'; ?>>
              </div>
            </div>
          </div>
          <div class="pql-field">
            <label for="lessonid">Lesson ID</label>
            <input class="pql-input" id="lessonid" name="lessonid" type="text" value="<?php echo s($prefilllessonid); ?>" placeholder="alphabet" required>
            <p class="pql-help">Required. This is used for teacher prep, live monitoring, and parent schedule context.</p>
          </div>
          <div class="pql-field">
            <label for="unitid">Unit ID</label>
            <input class="pql-input" id="unitid" name="unitid" type="text" value="<?php echo s($prefillunitid); ?>" placeholder="alphabet_listen" required>
          </div>
          <label class="pql-check" style="border:0;padding-left:0">
            <input type="checkbox" name="recording_enabled" value="1" <?php echo $prefillrecording ? 'checked' : ''; ?>>
            <span>Record session when consent policy allows</span>
          </label>
          <?php if (is_siteadmin($USER)): ?>
            <div class="pql-recurring">
              <h3>Admin Conflict Override</h3>
              <label class="pql-check" style="border:0;padding-left:0">
                <input type="checkbox" name="override_conflicts" value="1" <?php echo $prefilloverride ? 'checked' : ''; ?>>
                <span>Allow schedule conflict override with audit reason</span>
              </label>
              <div class="pql-field">
                <label for="override_reason">Override Reason</label>
                <input class="pql-input" id="override_reason" name="override_reason" type="text" value="<?php echo s($prefilloverridereason); ?>" placeholder="Required when overriding conflicts">
              </div>
            </div>
          <?php endif; ?>
          <button class="pql-btn" type="submit">Create live session</button>
        </form>
      </section>
      <?php endif; ?>

      <section class="pql-panel">
        <h2>Upcoming Sessions</h2>
        <?php if (!$sessions): ?>
          <div class="pql-empty">No live sessions are visible for this account yet.</div>
        <?php else: ?>
          <div class="pql-list">
            <?php foreach ($sessions as $session): ?>
              <?php
                $teacher = core_user::get_user((int)$session->teacherid);
                $sessionurlparams = $urlparams;
                if (empty($sessionurlparams['workspaceid']) && !empty($session->workspaceid)) {
                    $sessionurlparams['workspaceid'] = (int)$session->workspaceid;
                }
                $joinurl = pql_url('/local/hubredirect/live_sessions.php', $sessionurlparams, [
                    'action' => 'join',
                    'sessionid' => (int)$session->id,
                    'sesskey' => sesskey(),
                ]);
                $reviewurl = pql_url('/local/hubredirect/live_review.php', $sessionurlparams, [
                    'sessionid' => (int)$session->id,
                ]);
                $monitorurl = pql_url('/local/hubredirect/live_monitor.php', $sessionurlparams, [
                    'sessionid' => (int)$session->id,
                ]);
                $buttontext = ((int)$session->teacherid === (int)$USER->id || is_siteadmin($USER)) ? 'Start class' : 'Join class';
                $sessiontimezone = pql_valid_timezone((string)($session->timezone ?? ''));
              ?>
              <article class="pql-card">
                <div class="pql-card__head">
                  <div>
                    <h3><?php echo s($session->title); ?></h3>
                    <p class="pql-meta"><?php echo s(pql_format_session_datetime((int)$session->scheduled_start, $sessiontimezone)); ?> - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid); ?></p>
                    <?php if ((string)$session->lessonid !== '' || (string)$session->unitid !== ''): ?>
                      <p class="pql-meta"><?php echo s(trim((string)$session->lessonid . ' / ' . (string)$session->unitid, ' /')); ?></p>
                    <?php endif; ?>
                    <?php if (!empty($session->seriesid)): ?>
                      <p class="pql-meta">Series #<?php echo (int)$session->seriesid; ?><?php echo !empty($session->series_sequence) ? ' - Class ' . (int)$session->series_sequence : ''; ?></p>
                    <?php endif; ?>
                  </div>
                  <span class="pql-pill"><?php echo s((string)$session->status); ?></span>
                </div>
                <div class="pql-actions pqh-workspace-actions">
                  <?php if ((int)$session->teacherid === (int)$USER->id || $canmanage || pqh_can_manage_academy_operations((int)$USER->id)): ?>
                    <?php echo pql_agenda_slides_controls($session, pql_url('/local/hubredirect/live_sessions.php', $sessionurlparams)->out(false)); ?>
                  <?php endif; ?>
                  <a class="pql-btn pql-btn--start" href="<?php echo $joinurl->out(false); ?>"><?php echo s($buttontext); ?></a>
                  <?php if ((int)$session->teacherid === (int)$USER->id || is_siteadmin($USER)): ?>
                    <a class="pql-btn pql-btn--light" href="<?php echo $monitorurl->out(false); ?>">Lesson monitor</a>
                    <a class="pql-btn pql-btn--light" href="<?php echo $reviewurl->out(false); ?>">Attendance &amp; notes</a>
                  <?php endif; ?>
                </div>
              </article>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </section>
    </div>
  </div>
</main>
<?php
echo $OUTPUT->footer();
