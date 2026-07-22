<?php
// ---- report: seb-exams (Safe Exam Browser exam manager; read + teacher writes) ----
// Ported from local_hubredirect/seb_exams.php. That page defines no page-local
// functions, so seb_exams_portallib is a guard-only stub and the real helpers
// come from the shared seb_lib.php (+ accesslib.php), require'd below.
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, CORS headers sent.
//
//   GET  = the exam manager state (exams for this manager + attempt counts,
//          assignable students, and the known-content picker), curated so no
//          SEB credential (quit password) or raw allow-list leaves the server.
//   POST = do=create (legacy action=create, verbatim insert + assignment rows +
//          audit) or do=archive (legacy action=archive, verbatim status flip +
//          audit). confirm_sesskey() dropped: the token replaces the session key.
//
// The exam-taking / config-download / results links stay legacy Moodle URLs
// (seb_exam.php, seb_config.php, seb_results.php) because they need a real
// Moodle session and are out of scope for this migration.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/seb_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/seb_exams_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = [];
    }
}

// Workspace scope: query string on GET, JSON body on POST (same value the
// legacy page reads from the request).
$workspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);

// -- Entry access: verbatim teacher/ops gate from seb_exams.php --
// pqh_access_denied(...) is replaced by pqpd_fail(403, <same message>). The
// legacy page performs no security-audit write on this gate, so none is added.
$isteacher = pqh_user_can_create_live_sessions($userid, $workspaceid)
    || ($workspaceid > 0 && pqh_user_can_teach_in_workspace($userid, $workspaceid));
if (!$isteacher && !is_siteadmin($USER) && !pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only teachers can manage exams.');
}

$tablesready = pqh_seb_tables_ready();

// Teacher's assignable students (same source as live-session creation) — used to
// render the create form AND to constrain the create write, exactly as legacy.
$students = [];
if (pqh_table_exists_safe('local_prequran_teacher_student')) {
    $links = $DB->get_records('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'], '', 'id, studentid');
    foreach ($links as $link) {
        $student = core_user::get_user((int)$link->studentid);
        if ($student) {
            $students[(int)$link->studentid] = fullname($student);
        }
    }
    asort($students);
}

if ($ispost) {
    $do = (string)($body['do'] ?? '');

    // -- write: create (legacy action=create, verbatim) --
    if ($do === 'create') {
        if (!$tablesready) {
            pqpd_fail(403, 'The exam tables are not installed yet.');
        }
        $title = trim(clean_param((string)($body['title'] ?? ''), PARAM_TEXT));
        $description = trim(clean_param((string)($body['description'] ?? ''), PARAM_TEXT));
        $knowncontent = trim(clean_param((string)($body['knowncontent'] ?? ''), PARAM_RAW));
        $customurl = trim(clean_param((string)($body['embedurl'] ?? ''), PARAM_RAW));
        $embedurl = $customurl !== '' ? $customurl : $knowncontent;
        $mode = clean_param((string)($body['mode'] ?? 'seb'), PARAM_ALPHANUMEXT) === 'focus' ? 'focus' : 'seb';
        $proctoring = ($mode === 'focus' && (int)clean_param((string)($body['proctoring'] ?? 0), PARAM_BOOL)) ? 1 : 0;
        $duration = max(5, min(240, (int)clean_param((string)($body['duration'] ?? 30), PARAM_INT)));
        $quitpassword = trim(clean_param((string)($body['quitpassword'] ?? ''), PARAM_TEXT));
        $windowstartraw = trim(clean_param((string)($body['window_start'] ?? ''), PARAM_RAW));
        $windowendraw = trim(clean_param((string)($body['window_end'] ?? ''), PARAM_RAW));
        $studentidsin = is_array($body['studentids'] ?? null) ? $body['studentids'] : [];
        $studentids = array_values(array_unique(array_filter(array_map('intval', $studentidsin))));
        $studentids = array_values(array_intersect($studentids, array_keys($students)));

        $usertz = core_date::get_user_timezone_object();
        $parsetime = static function(string $raw) use ($usertz): int {
            if ($raw === '') {
                return 0;
            }
            try {
                return (new DateTime($raw, $usertz))->getTimestamp();
            } catch (Throwable $e) {
                return -1;
            }
        };
        $windowstart = $parsetime($windowstartraw);
        $windowend = $parsetime($windowendraw);

        if ($title === '') {
            pqpd_fail(400, 'Enter an exam title.');
        } else if ($embedurl === '') {
            pqpd_fail(400, 'Choose exam content or enter a content URL.');
        } else if (!$studentids) {
            pqpd_fail(400, 'Tick at least one student.');
        } else if ($windowstart < 0 || $windowend < 0) {
            pqpd_fail(400, 'Enter valid window dates.');
        } else if ($windowstart > 0 && $windowend > 0 && $windowend <= $windowstart) {
            pqpd_fail(400, 'The window must end after it starts.');
        }

        $now = time();
        $exam = (object)[
            'workspaceid' => $workspaceid,
            'createdby' => $userid,
            'title' => $title,
            'description' => $description,
            'embedurl' => $embedurl,
            'mode' => $mode,
            'proctoring' => $proctoring,
            'duration_minutes' => $duration,
            'quitpassword' => $quitpassword !== '' ? $quitpassword : 'ehel-unlock',
            'window_start' => $windowstart,
            'window_end' => $windowend,
            'status' => 'active',
            'allowjson' => json_encode(['*.b-cdn.net/*']),
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $exam->id = (int)$DB->insert_record('local_prequran_seb_exam', $exam);
        foreach ($studentids as $studentid) {
            $DB->insert_record('local_prequran_seb_exam_student', (object)[
                'examid' => (int)$exam->id,
                'studentid' => $studentid,
                'timecreated' => $now,
            ]);
        }
        pqh_seb_audit('seb_exam_created', (int)$exam->id, [
            'students' => $studentids,
            'mode' => $mode,
            'duration' => $duration,
            'window_start' => $windowstart,
            'window_end' => $windowend,
        ]);
        echo json_encode([
            'ok' => true,
            'message' => 'Exam created. Share the exam link with the assigned students.',
            'examid' => (int)$exam->id,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: archive (legacy action=archive, verbatim) --
    if ($do === 'archive') {
        if (!$tablesready) {
            pqpd_fail(403, 'The exam tables are not installed yet.');
        }
        $archiveid = (int)($body['examid'] ?? 0);
        $exam = pqh_seb_exam_record($archiveid);
        if ($exam && pqh_seb_can_manage($exam, $userid)) {
            $exam->status = 'archived';
            $exam->timemodified = time();
            $DB->update_record('local_prequran_seb_exam', $exam);
            pqh_seb_audit('seb_exam_archived', $archiveid);
            echo json_encode([
                'ok' => true,
                'message' => 'Exam archived.',
                'examid' => $archiveid,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        }
        pqpd_fail(400, 'You cannot archive that exam.');
    }

    pqpd_fail(400, 'Unknown seb-exams action.');
}

// -- GET: the exam manager state (same queries as the page) --
$exams = $tablesready ? pqh_seb_exams_for_manager($userid, $workspaceid) : [];
$examsout = [];
$nameids = [];
foreach ($exams as $exam) {
    $mode = pqh_seb_exam_mode($exam);
    $windowstart = (int)$exam->window_start;
    $windowend = (int)$exam->window_end;
    $windowline = 'Any time';
    if ($windowstart > 0) {
        $windowline = userdate($windowstart, get_string('strftimedatetimeshort'))
            . ($windowend > 0 ? ' - ' . userdate($windowend, get_string('strftimedatetimeshort')) : '');
    }
    $nameids[] = (int)$exam->createdby;
    // Curated view: the SEB quit password and raw allow-list are deliberately
    // NOT emitted — a credential/config must never leave the server.
    $examsout[] = [
        'id' => (int)$exam->id,
        'title' => (string)$exam->title,
        'description' => (string)$exam->description,
        'mode' => $mode,
        'mode_label' => $mode === 'focus' ? 'Focus mode' : 'SEB locked',
        'proctored' => pqh_seb_exam_proctoring($exam),
        'duration_minutes' => (int)$exam->duration_minutes,
        'status' => (string)$exam->status,
        'has_content' => trim((string)$exam->embedurl) !== '',
        'window_start' => $windowstart,
        'window_end' => $windowend,
        'window_line' => $windowline,
        'createdby' => (int)$exam->createdby,
        'assigned' => count(pqh_seb_exam_studentids((int)$exam->id)),
        'finished' => (int)$DB->count_records('local_prequran_seb_attempt', ['examid' => (int)$exam->id, 'status' => 'finished']),
        // Legacy Moodle links (need a Moodle session) — stay on the live page.
        'results_url' => pqh_seb_results_url((int)$exam->id)->out(false),
        'exam_url' => pqh_seb_exam_url((int)$exam->id)->out(false),
        'config_url' => $mode === 'seb' ? pqh_seb_config_download_url((int)$exam->id)->out(false) : '',
    ];
}

$studentsout = [];
foreach ($students as $studentid => $name) {
    $studentsout[] = ['id' => (int)$studentid, 'name' => (string)$name];
}

$knowncontent = [];
foreach (pqh_seb_known_content() as $url => $meta) {
    $knowncontent[] = ['url' => (string)$url, 'label' => (string)($meta['label'] ?? $url)];
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'tablesready' => $tablesready,
    'workspaceid' => $workspaceid,
    'exams' => $examsout,
    'students' => $studentsout,
    'knowncontent' => $knowncontent,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
