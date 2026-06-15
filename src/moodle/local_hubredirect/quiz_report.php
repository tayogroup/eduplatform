<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->libdir . '/ddllib.php');

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/quiz_report.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Pre-Quraan Quiz Reports');
$PAGE->set_heading('Pre-Quraan Quiz Reports');
$PAGE->add_body_class('pqh-quiz-report-page');

function pqqr_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqqr_table_has_field(string $table, string $field): bool {
    global $DB;
    $dbman = $DB->get_manager();
    $xtable = new xmldb_table($table);
    return $dbman->table_exists($xtable) && $dbman->field_exists($xtable, new xmldb_field($field));
}

function pqqr_is_managed_student(int $userid): bool {
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

function pqqr_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqqr_table_exists('local_prequran_teacher_student')
            && pqqr_table_has_field('local_prequran_teacher_student', 'teacherid')
            && $DB->record_exists_select('local_prequran_teacher_student', 'teacherid = ? AND status = ?', [$userid, 'active'])) {
        return true;
    }
    if (pqqr_table_exists('local_prequran_class_group')
            && pqqr_table_has_field('local_prequran_class_group', 'teacherid')
            && $DB->record_exists_select('local_prequran_class_group', 'teacherid = ? AND status <> ?', [$userid, 'archived'])) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = ?
            AND (r.shortname IN ('editingteacher', 'teacher', 'manager')
                 OR r.archetype IN ('manager', 'editingteacher', 'teacher'))",
        [$userid]
    );
}

function pqqr_role(int $userid): string {
    global $DB;
    if (is_siteadmin($userid)) {
        return 'admin';
    }
    if (pqqr_has_teacher_role($userid)) {
        return 'teacher';
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (pqqr_table_exists($table)
                && pqqr_table_has_field($table, 'guardianid')
                && $DB->record_exists($table, ['guardianid' => $userid])) {
            return 'parent';
        }
    }
    return pqqr_is_managed_student($userid) ? 'student' : 'student';
}

function pqqr_user_label(int $userid): string {
    $user = core_user::get_user($userid);
    return $user ? fullname($user) : 'Student ' . $userid;
}

function pqqr_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];

    if (pqqr_table_exists('local_prequran_teacher_student')) {
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
                $students[$studentid] = [
                    'studentid' => $studentid,
                    'cohortid' => (int)$row->cohortid,
                    'name' => pqqr_user_label($studentid),
                ];
            }
        }
    }

    if (pqqr_table_exists('local_prequran_group_member') && pqqr_table_exists('local_prequran_class_group')) {
        $rows = $DB->get_records_sql(
            "SELECT gm.studentid, gm.groupid, cg.title
               FROM {local_prequran_group_member} gm
               JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
              WHERE cg.teacherid = :teacherid
                AND gm.assignment_status = :assignmentstatus
                AND cg.status <> :archived",
            ['teacherid' => $teacherid, 'assignmentstatus' => 'active', 'archived' => 'archived']
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid <= 0) {
                continue;
            }
            if (!isset($students[$studentid])) {
                $students[$studentid] = [
                    'studentid' => $studentid,
                    'cohortid' => 0,
                    'name' => pqqr_user_label($studentid),
                ];
            }
            $students[$studentid]['groupid'] = (int)$row->groupid;
            $students[$studentid]['groupname'] = (string)$row->title;
        }
    }

    uasort($students, static function(array $a, array $b): int {
        return strcasecmp((string)($a['name'] ?? ''), (string)($b['name'] ?? ''));
    });
    return array_values($students);
}

function pqqr_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (!pqqr_table_exists($table) || !pqqr_table_has_field($table, 'guardianid') || !pqqr_table_has_field($table, 'studentid')) {
            continue;
        }
        $rows = $DB->get_records($table, ['guardianid' => $parentid]);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = [
                    'studentid' => $studentid,
                    'cohortid' => 0,
                    'name' => pqqr_user_label($studentid),
                ];
            }
        }
    }
    uasort($children, static function(array $a, array $b): int {
        return strcasecmp((string)($a['name'] ?? ''), (string)($b['name'] ?? ''));
    });
    return array_values($children);
}

function pqqr_normalize_environment(string $value): string {
    $value = strtolower(trim($value));
    if (in_array($value, ['integration', 'int', 'qa'], true)) {
        return 'integration';
    }
    if (in_array($value, ['staging', 'stage'], true)) {
        return 'staging';
    }
    return 'production';
}

function pqqr_visible_students(string $role): array {
    global $USER, $DB;
    if ($role === 'admin') {
        if (!pqqr_table_exists('local_prequran_quiz_attempt')) {
            return [];
        }
        $rows = $DB->get_records_sql(
            "SELECT userid, MAX(last_activity_at) AS last_activity_at
               FROM {local_prequran_quiz_attempt}
              WHERE userid > 0
           GROUP BY userid
           ORDER BY MAX(last_activity_at) DESC",
            [],
            0,
            500
        );
        $students = [];
        foreach ($rows as $row) {
            $studentid = (int)$row->userid;
            $students[] = ['studentid' => $studentid, 'name' => pqqr_user_label($studentid)];
        }
        return $students;
    }
    if ($role === 'teacher') {
        return pqqr_teacher_students((int)$USER->id);
    }
    if ($role === 'parent') {
        return pqqr_parent_children((int)$USER->id);
    }
    return [['studentid' => (int)$USER->id, 'name' => pqqr_user_label((int)$USER->id)]];
}

function pqqr_filter_visible_students(array $students, int $selectedid): array {
    if ($selectedid <= 0) {
        return $students;
    }
    foreach ($students as $student) {
        if ((int)$student['studentid'] === $selectedid) {
            return [$student];
        }
    }
    throw new moodle_exception('nopermissions', '', '', 'You cannot view quiz reporting for this student.');
}

function pqqr_sql_scope(array $students, string $environment, string $lessonid, string $unitid, string $alias = ''): array {
    global $DB;
    $prefix = $alias === '' ? '' : $alias . '.';
    $where = [$prefix . 'environment = :environment'];
    $params = ['environment' => $environment];
    if ($lessonid !== '') {
        $where[] = $prefix . 'lessonid = :lessonid';
        $params['lessonid'] = $lessonid;
    }
    if ($unitid !== '') {
        $where[] = $prefix . 'unitid = :unitid';
        $params['unitid'] = $unitid;
    }
    $ids = array_values(array_unique(array_map(static function(array $student): int {
        return (int)$student['studentid'];
    }, $students)));
    if ($ids) {
        [$insql, $inparams] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'studentid');
        $where[] = $prefix . 'userid ' . $insql;
        $params += $inparams;
    } else {
        $where[] = '1 = 0';
    }
    return [implode(' AND ', $where), $params];
}

function pqqr_load_report(array $students, string $environment, string $lessonid, string $unitid): array {
    global $DB;
    $empty = [
        'summary' => ['attempts' => 0, 'completed' => 0, 'avg_percent' => 0, 'answered' => 0, 'correct' => 0],
        'students' => [],
        'passes' => [],
        'skills' => [],
        'missed' => [],
        'attempts' => [],
    ];
    if (!pqqr_table_exists('local_prequran_quiz_attempt')) {
        return $empty + ['schema_ready' => false];
    }
    [$where, $params] = pqqr_sql_scope($students, $environment, $lessonid, $unitid, 'a');

    $summary = $DB->get_record_sql(
        "SELECT COUNT(1) AS attempts,
                SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed,
                COALESCE(ROUND(AVG(a.percent)), 0) AS avg_percent,
                COALESCE(SUM(a.questions_answered), 0) AS answered,
                COALESCE(SUM(a.correct_count), 0) AS correct
           FROM {local_prequran_quiz_attempt} a
          WHERE {$where}",
        $params
    );

    $studentrows = $DB->get_records_sql(
        "SELECT MIN(a.id) AS id,
                a.userid,
                COUNT(1) AS attempts,
                MAX(a.last_activity_at) AS last_activity_at,
                COALESCE(ROUND(AVG(a.percent)), 0) AS avg_percent,
                COALESCE(SUM(a.questions_answered), 0) AS answered,
                COALESCE(SUM(a.correct_count), 0) AS correct
           FROM {local_prequran_quiz_attempt} a
          WHERE {$where}
       GROUP BY a.userid
       ORDER BY MAX(a.last_activity_at) DESC",
        $params,
        0,
        100
    );

    $attemptrows = $DB->get_records_sql(
        "SELECT a.*
           FROM {local_prequran_quiz_attempt} a
          WHERE {$where}
       ORDER BY a.last_activity_at DESC, a.id DESC",
        $params,
        0,
        20
    );

    $passrows = [];
    if (pqqr_table_exists('local_prequran_quiz_pass')) {
        $passrows = $DB->get_records_sql(
            "SELECT MIN(p.id) AS id,
                    p.pass_number,
                    MAX(p.pass_title) AS pass_title,
                    COUNT(1) AS rows_count,
                    COALESCE(ROUND(AVG(p.percent)), 0) AS avg_percent,
                    COALESCE(SUM(p.questions_answered), 0) AS answered,
                    COALESCE(SUM(p.correct_count), 0) AS correct
               FROM {local_prequran_quiz_pass} p
               JOIN {local_prequran_quiz_attempt} a ON a.id = p.attemptid
              WHERE {$where}
           GROUP BY p.pass_number
           ORDER BY p.pass_number ASC",
            $params
        );
    }

    $skillrows = [];
    $missedrows = [];
    if (pqqr_table_exists('local_prequran_quiz_question')) {
        $skillrows = $DB->get_records_sql(
            "SELECT MIN(q.id) AS id,
                    q.skill_area,
                    COUNT(1) AS answered,
                    COALESCE(SUM(q.is_correct), 0) AS correct
               FROM {local_prequran_quiz_question} q
               JOIN {local_prequran_quiz_attempt} a ON a.id = q.attemptid
              WHERE {$where}
           GROUP BY q.skill_area
           ORDER BY ROUND(COALESCE(SUM(q.is_correct), 0) / COUNT(1) * 100) ASC, q.skill_area ASC",
            $params
        );
        $missedrows = $DB->get_records_sql(
            "SELECT q.*
               FROM {local_prequran_quiz_question} q
               JOIN {local_prequran_quiz_attempt} a ON a.id = q.attemptid
              WHERE {$where}
                AND q.is_correct = 0
           ORDER BY q.answered_at DESC, q.id DESC",
            $params,
            0,
            25
        );
    }

    $studentstats = [];
    foreach ($studentrows as $row) {
        $userid = (int)$row->userid;
        $answered = (int)$row->answered;
        $correct = (int)$row->correct;
        $studentstats[] = [
            'userid' => $userid,
            'name' => pqqr_user_label($userid),
            'attempts' => (int)$row->attempts,
            'last_activity_at' => (int)$row->last_activity_at,
            'answered' => $answered,
            'correct' => $correct,
            'percent' => $answered > 0 ? (int)round(($correct / $answered) * 100) : (int)$row->avg_percent,
        ];
    }

    $passstats = [];
    foreach ($passrows as $row) {
        $answered = (int)$row->answered;
        $correct = (int)$row->correct;
        $passstats[] = [
            'pass_number' => (int)$row->pass_number,
            'pass_title' => (string)$row->pass_title,
            'answered' => $answered,
            'correct' => $correct,
            'percent' => $answered > 0 ? (int)round(($correct / $answered) * 100) : (int)$row->avg_percent,
        ];
    }

    $skillstats = [];
    foreach ($skillrows as $row) {
        $answered = (int)$row->answered;
        $correct = (int)$row->correct;
        $skillstats[] = [
            'skill_area' => (string)$row->skill_area,
            'answered' => $answered,
            'correct' => $correct,
            'percent' => $answered > 0 ? (int)round(($correct / $answered) * 100) : 0,
        ];
    }

    return [
        'schema_ready' => true,
        'summary' => [
            'attempts' => (int)$summary->attempts,
            'completed' => (int)$summary->completed,
            'avg_percent' => (int)$summary->avg_percent,
            'answered' => (int)$summary->answered,
            'correct' => (int)$summary->correct,
        ],
        'students' => $studentstats,
        'passes' => $passstats,
        'skills' => $skillstats,
        'missed' => array_values($missedrows),
        'attempts' => array_values($attemptrows),
    ];
}

$role = pqqr_role((int)$USER->id);
$environment = pqqr_normalize_environment(optional_param('pq_env', 'integration', PARAM_ALPHANUMEXT));
$lessonid = trim(optional_param('lessonid', 'alphabet', PARAM_ALPHANUMEXT));
$unitid = trim(optional_param('unitid', 'alphabet_quiz', PARAM_ALPHANUMEXT));
$selectedstudentid = optional_param('userid', 0, PARAM_INT);
$visible = pqqr_visible_students($role);
$scope = pqqr_filter_visible_students($visible, $selectedstudentid);
$selectedstudentid = count($scope) === 1 ? (int)$scope[0]['studentid'] : 0;
$report = pqqr_load_report($scope, $environment, $lessonid, $unitid);

echo $OUTPUT->header();
?>
<style>
body.pqh-quiz-report-page header,body.pqh-quiz-report-page footer,body.pqh-quiz-report-page nav.navbar,body.pqh-quiz-report-page #page-header,body.pqh-quiz-report-page #page-footer,body.pqh-quiz-report-page .drawer,body.pqh-quiz-report-page [data-region="drawer"],body.pqh-quiz-report-page .block-region{display:none!important}
body.pqh-quiz-report-page #page,body.pqh-quiz-report-page #page-content,body.pqh-quiz-report-page #region-main,body.pqh-quiz-report-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
body.pqh-quiz-report-page{background:#f5f8fb!important}
.pqqr-shell{min-height:100vh;color:#17324a;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:linear-gradient(180deg,#eef9ff 0,#fff 48%)}
.pqqr-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px max(18px,calc((100vw - 1180px)/2));background:#fff;border-bottom:1px solid rgba(23,50,74,.10)}
.pqqr-brand{display:flex;align-items:center;gap:12px;font-weight:950;color:#17324a}.pqqr-mark{width:42px;height:42px;border-radius:10px;display:grid;place-items:center;background:#ffbd62;color:#fff}
.pqqr-wrap{max-width:1180px;margin:0 auto;padding:28px 18px 56px}.pqqr-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:16px;padding:24px;border-radius:14px;background:linear-gradient(135deg,#e8fff3 0,#fff7dd 55%,#ffe8f2 100%);border:1px solid rgba(23,50,74,.10)}
.pqqr-kicker{margin:0 0 6px;color:#7b5a3a;font-size:12px;font-weight:950;text-transform:uppercase}.pqqr-title{margin:0;color:#12213c;font-size:30px;font-weight:950;line-height:1.1}.pqqr-sub{margin:7px 0 0;color:#58677a;font-weight:750}
.pqqr-form{display:grid;grid-template-columns:minmax(180px,1fr) 160px 160px 150px auto;gap:10px;align-items:end;margin-bottom:16px;padding:14px;border-radius:12px;background:#fff;border:1px solid rgba(23,50,74,.10)}
.pqqr-field label{display:block;margin:0 0 5px;color:#7b5a3a;font-size:11px;font-weight:950;text-transform:uppercase}.pqqr-input,.pqqr-select{width:100%;min-height:40px;border-radius:8px;border:1px solid rgba(23,50,74,.16);padding:0 10px;background:#fff;color:#17324a;font-weight:850}
.pqqr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:8px;border:0;background:#ffbd62;color:#12213c!important;text-decoration:none;font-weight:950;cursor:pointer}.pqqr-btn--light{background:#eef6ff;color:#17324a!important;border:1px solid rgba(23,50,74,.12)}
.pqqr-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.pqqr-card{padding:16px;border-radius:12px;background:#fff;border:1px solid rgba(23,50,74,.10);box-shadow:0 12px 28px rgba(23,50,74,.06)}.pqqr-card span{display:block;color:#58677a;font-size:12px;font-weight:850}.pqqr-card strong{display:block;margin-top:6px;color:#12213c;font-size:30px;font-weight:950}
.pqqr-section{margin-top:14px;padding:18px;border-radius:14px;background:#fff;border:1px solid rgba(23,50,74,.10)}.pqqr-section h2{margin:0 0 12px;color:#12213c;font-size:20px;font-weight:950}
.pqqr-table{width:100%;border-collapse:separate;border-spacing:0 8px}.pqqr-table th{text-align:left;color:#7b5a3a;font-size:11px;font-weight:950;text-transform:uppercase;padding:0 10px}.pqqr-table td{padding:11px 10px;background:#f8fbff;border-top:1px solid rgba(23,50,74,.08);border-bottom:1px solid rgba(23,50,74,.08);font-weight:800}.pqqr-table td:first-child{border-left:1px solid rgba(23,50,74,.08);border-radius:9px 0 0 9px}.pqqr-table td:last-child{border-right:1px solid rgba(23,50,74,.08);border-radius:0 9px 9px 0}
.pqqr-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#e8fff3;color:#276648;font-size:12px;font-weight:950}.pqqr-pill--warn{background:#fff4dc;color:#7b5a3a}.pqqr-pill--low{background:#fff0e6;color:#8a3e2e}
.pqqr-empty{padding:22px;border-radius:12px;border:1px dashed rgba(23,50,74,.22);color:#58677a;background:#fbfdff;font-weight:850}
@media(max-width:900px){.pqqr-hero{display:block}.pqqr-form{grid-template-columns:1fr}.pqqr-grid{grid-template-columns:1fr 1fr}.pqqr-table,.pqqr-table tbody,.pqqr-table tr,.pqqr-table td{display:block;width:100%}.pqqr-table thead{display:none}.pqqr-table tr{margin-bottom:10px}.pqqr-table td{border-left:1px solid rgba(23,50,74,.08);border-right:1px solid rgba(23,50,74,.08);border-radius:0}.pqqr-table td:first-child{border-radius:9px 9px 0 0}.pqqr-table td:last-child{border-radius:0 0 9px 9px}}
@media(max-width:540px){.pqqr-grid{grid-template-columns:1fr}.pqqr-wrap{padding:20px 12px 42px}.pqqr-title{font-size:25px}}
</style>
<main class="pqqr-shell">
  <div class="pqqr-top">
    <div class="pqqr-brand"><span class="pqqr-mark">Q</span><span>Quiz Reports</span></div>
    <div>
      <a class="pqqr-btn pqqr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      <a class="pqqr-btn pqqr-btn--light" href="<?php echo (new moodle_url('/login/logout.php', ['sesskey' => sesskey()]))->out(false); ?>">Logout</a>
    </div>
  </div>
  <div class="pqqr-wrap">
    <section class="pqqr-hero">
      <div>
        <p class="pqqr-kicker"><?php echo s(ucfirst($role)); ?> view</p>
        <h1 class="pqqr-title">Alphabet Quiz Performance</h1>
        <p class="pqqr-sub">Scores, passes, skills, and missed questions for reporting and support.</p>
      </div>
    </section>

    <form class="pqqr-form" method="get" aria-label="Quiz report filters">
      <div class="pqqr-field">
        <label for="pqqr-userid">Student</label>
        <select class="pqqr-select" id="pqqr-userid" name="userid">
          <?php if ($role === 'admin' || $role === 'teacher'): ?><option value="0">All visible students</option><?php endif; ?>
          <?php foreach ($visible as $student): ?>
            <option value="<?php echo (int)$student['studentid']; ?>" <?php echo (int)$student['studentid'] === $selectedstudentid ? 'selected' : ''; ?>>
              <?php echo s($student['name']); ?> #<?php echo (int)$student['studentid']; ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="pqqr-field">
        <label for="pqqr-env">Environment</label>
        <select class="pqqr-select" id="pqqr-env" name="pq_env">
          <option value="integration" <?php echo $environment === 'integration' ? 'selected' : ''; ?>>Integration</option>
          <option value="staging" <?php echo $environment === 'staging' ? 'selected' : ''; ?>>Staging</option>
          <option value="production" <?php echo $environment === 'production' ? 'selected' : ''; ?>>Production</option>
        </select>
      </div>
      <div class="pqqr-field">
        <label for="pqqr-lesson">Lesson</label>
        <input class="pqqr-input" id="pqqr-lesson" name="lessonid" value="<?php echo s($lessonid); ?>">
      </div>
      <div class="pqqr-field">
        <label for="pqqr-unit">Unit</label>
        <input class="pqqr-input" id="pqqr-unit" name="unitid" value="<?php echo s($unitid); ?>">
      </div>
      <button class="pqqr-btn" type="submit">Load Report</button>
    </form>

    <?php if (empty($report['schema_ready'])): ?>
      <div class="pqqr-empty">Quiz analytics tables are not installed yet.</div>
    <?php else: ?>
      <section class="pqqr-grid" aria-label="Quiz summary">
        <div class="pqqr-card"><span>Attempts</span><strong><?php echo (int)$report['summary']['attempts']; ?></strong></div>
        <div class="pqqr-card"><span>Completed Attempts</span><strong><?php echo (int)$report['summary']['completed']; ?></strong></div>
        <div class="pqqr-card"><span>Average Score</span><strong><?php echo (int)$report['summary']['avg_percent']; ?>%</strong></div>
        <div class="pqqr-card"><span>Questions Correct</span><strong><?php echo (int)$report['summary']['correct']; ?>/<?php echo (int)$report['summary']['answered']; ?></strong></div>
      </section>

      <section class="pqqr-section">
        <h2>Students</h2>
        <?php if (!$report['students']): ?>
          <div class="pqqr-empty">No quiz data has been saved for this filter yet.</div>
        <?php else: ?>
          <table class="pqqr-table">
            <thead><tr><th>Student</th><th>Attempts</th><th>Answered</th><th>Score</th><th>Last Activity</th><th>Open</th></tr></thead>
            <tbody>
            <?php foreach ($report['students'] as $student): ?>
              <tr>
                <td><?php echo s($student['name']); ?><br><span>#<?php echo (int)$student['userid']; ?></span></td>
                <td><?php echo (int)$student['attempts']; ?></td>
                <td><?php echo (int)$student['answered']; ?></td>
                <td><span class="pqqr-pill <?php echo (int)$student['percent'] < 60 ? 'pqqr-pill--low' : ((int)$student['percent'] < 80 ? 'pqqr-pill--warn' : ''); ?>"><?php echo (int)$student['percent']; ?>%</span></td>
                <td><?php echo (int)$student['last_activity_at'] > 0 ? s(userdate((int)$student['last_activity_at'], get_string('strftimedatetimeshort'))) : 'Not yet'; ?></td>
                <td><a class="pqqr-btn pqqr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/quiz_report.php', ['userid' => (int)$student['userid'], 'pq_env' => $environment, 'lessonid' => $lessonid, 'unitid' => $unitid]))->out(false); ?>">Details</a></td>
              </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>

      <section class="pqqr-section">
        <h2>Pass Summary</h2>
        <?php if (!$report['passes']): ?>
          <div class="pqqr-empty">No completed pass rows yet.</div>
        <?php else: ?>
          <table class="pqqr-table">
            <thead><tr><th>Pass</th><th>Title</th><th>Answered</th><th>Correct</th><th>Score</th></tr></thead>
            <tbody>
            <?php foreach ($report['passes'] as $pass): ?>
              <tr>
                <td>Pass <?php echo (int)$pass['pass_number']; ?></td>
                <td><?php echo s($pass['pass_title'] ?: ('Pass ' . (int)$pass['pass_number'])); ?></td>
                <td><?php echo (int)$pass['answered']; ?></td>
                <td><?php echo (int)$pass['correct']; ?></td>
                <td><span class="pqqr-pill <?php echo (int)$pass['percent'] < 60 ? 'pqqr-pill--low' : ((int)$pass['percent'] < 80 ? 'pqqr-pill--warn' : ''); ?>"><?php echo (int)$pass['percent']; ?>%</span></td>
              </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>

      <section class="pqqr-section">
        <h2>Skill Areas</h2>
        <?php if (!$report['skills']): ?>
          <div class="pqqr-empty">No question-level skill data yet.</div>
        <?php else: ?>
          <table class="pqqr-table">
            <thead><tr><th>Skill</th><th>Answered</th><th>Correct</th><th>Score</th></tr></thead>
            <tbody>
            <?php foreach ($report['skills'] as $skill): ?>
              <tr>
                <td><?php echo s($skill['skill_area'] ?: 'Unlabeled'); ?></td>
                <td><?php echo (int)$skill['answered']; ?></td>
                <td><?php echo (int)$skill['correct']; ?></td>
                <td><span class="pqqr-pill <?php echo (int)$skill['percent'] < 60 ? 'pqqr-pill--low' : ((int)$skill['percent'] < 80 ? 'pqqr-pill--warn' : ''); ?>"><?php echo (int)$skill['percent']; ?>%</span></td>
              </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>

      <section class="pqqr-section">
        <h2>Recent Missed Questions</h2>
        <?php if (!$report['missed']): ?>
          <div class="pqqr-empty">No missed questions in this filter.</div>
        <?php else: ?>
          <table class="pqqr-table">
            <thead><tr><th>When</th><th>Pass</th><th>Skill</th><th>Question</th><th>Student Answer</th><th>Correct Answer</th></tr></thead>
            <tbody>
            <?php foreach ($report['missed'] as $missed): ?>
              <tr>
                <td><?php echo (int)$missed->answered_at > 0 ? s(userdate((int)$missed->answered_at, get_string('strftimedatetimeshort'))) : 'Not saved'; ?></td>
                <td><?php echo (int)$missed->pass_number; ?></td>
                <td><?php echo s((string)$missed->skill_area); ?></td>
                <td><?php echo s((string)$missed->prompt); ?></td>
                <td><?php echo s((string)$missed->selected_answer); ?></td>
                <td><?php echo s((string)$missed->correct_answer); ?></td>
              </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
