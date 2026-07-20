<?php
declare(strict_types=1);

// Teacher exam manager (SEB Phase 2): create Safe Exam Browser exams, assign
// students, and hand out launch links and configs. Teachers manage their own
// exams; workspace managers and platform admins see the whole workspace.
require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
$urlparams = $workspaceid > 0 ? ['workspaceid' => $workspaceid] : [];
$selfurl = pqh_seb_manage_url($workspaceid);
$dashboardurl = new moodle_url('/local/hubredirect/dashboard.php');

$isteacher = pqh_user_can_create_live_sessions((int)$USER->id, $workspaceid)
    || ($workspaceid > 0 && pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid));
if (!$isteacher && !is_siteadmin($USER) && !pqh_can_manage_academy_operations((int)$USER->id)) {
    pqh_access_denied('Only teachers can manage exams.', $dashboardurl, 'Exam manager access required');
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url($selfurl);
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Exams');
$PAGE->set_heading('Exams');
$PAGE->add_body_class('pqsm-page');

$tablesready = pqh_seb_tables_ready();

// Teacher's assignable students (same source as live-session creation).
$students = [];
if (pqh_table_exists_safe('local_prequran_teacher_student')) {
    $links = $DB->get_records('local_prequran_teacher_student', ['teacherid' => (int)$USER->id, 'status' => 'active'], '', 'id, studentid');
    foreach ($links as $link) {
        $student = core_user::get_user((int)$link->studentid);
        if ($student) {
            $students[(int)$link->studentid] = fullname($student);
        }
    }
    asort($students);
}

$notice = '';
$error = '';

if ($tablesready && data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'create') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reload the exam manager and try again.', $selfurl, 'Exam action expired');
    }
    $title = trim(optional_param('title', '', PARAM_TEXT));
    $description = trim(optional_param('description', '', PARAM_TEXT));
    $knowncontent = trim(optional_param('knowncontent', '', PARAM_RAW));
    $customurl = trim(optional_param('embedurl', '', PARAM_RAW));
    $embedurl = $customurl !== '' ? $customurl : $knowncontent;
    $duration = max(5, min(240, optional_param('duration', 30, PARAM_INT)));
    $quitpassword = trim(optional_param('quitpassword', '', PARAM_TEXT));
    $windowstartraw = trim(optional_param('window_start', '', PARAM_RAW));
    $windowendraw = trim(optional_param('window_end', '', PARAM_RAW));
    $studentids = array_values(array_unique(array_filter(array_map('intval', optional_param_array('studentids', [], PARAM_INT)))));
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
        $error = 'Enter an exam title.';
    } else if ($embedurl === '') {
        $error = 'Choose exam content or enter a content URL.';
    } else if (!$studentids) {
        $error = 'Tick at least one student.';
    } else if ($windowstart < 0 || $windowend < 0) {
        $error = 'Enter valid window dates.';
    } else if ($windowstart > 0 && $windowend > 0 && $windowend <= $windowstart) {
        $error = 'The window must end after it starts.';
    } else {
        $now = time();
        $exam = (object)[
            'workspaceid' => $workspaceid,
            'createdby' => (int)$USER->id,
            'title' => $title,
            'description' => $description,
            'embedurl' => $embedurl,
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
            'duration' => $duration,
            'window_start' => $windowstart,
            'window_end' => $windowend,
        ]);
        redirect(new moodle_url($selfurl, ['created' => (int)$exam->id]));
    }
}

if ($tablesready && data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'archive') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reload the exam manager and try again.', $selfurl, 'Exam action expired');
    }
    $archiveid = optional_param('examid', 0, PARAM_INT);
    $exam = pqh_seb_exam_record($archiveid);
    if ($exam && pqh_seb_can_manage($exam, (int)$USER->id)) {
        $exam->status = 'archived';
        $exam->timemodified = time();
        $DB->update_record('local_prequran_seb_exam', $exam);
        pqh_seb_audit('seb_exam_archived', $archiveid);
        redirect(new moodle_url($selfurl, ['archived' => $archiveid]));
    }
    $error = 'You cannot archive that exam.';
}

if (optional_param('created', 0, PARAM_INT) > 0) {
    $notice = 'Exam created. Share the exam link with the assigned students.';
} else if (optional_param('archived', 0, PARAM_INT) > 0) {
    $notice = 'Exam archived.';
}

$exams = $tablesready ? pqh_seb_exams_for_manager((int)$USER->id, $workspaceid) : [];
$attemptcounts = [];
if ($exams) {
    foreach ($exams as $exam) {
        $attemptcounts[(int)$exam->id] = [
            'assigned' => count(pqh_seb_exam_studentids((int)$exam->id)),
            'finished' => (int)$DB->count_records('local_prequran_seb_attempt', ['examid' => (int)$exam->id, 'status' => 'finished']),
        ];
    }
}

echo $OUTPUT->header();
?>
<style>
<?php echo pqh_design_system_css('.pqsm-shell'); ?>
<?php echo pqh_design_shell_css('.pqsm-shell'); ?>
.pqsm-wrap{max-width:1100px;margin:0 auto;padding:26px 24px 60px;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqsm-head{margin:0 0 18px}
.pqsm-head h1{margin:0 0 4px;color:var(--pqh-ink);font-size:24px;font-weight:800;letter-spacing:-.02em}
.pqsm-head p{margin:0;color:var(--pqh-muted);font-weight:500;font-size:13.5px}
.pqsm-grid{display:grid;grid-template-columns:minmax(320px,380px) minmax(0,1fr);gap:16px;align-items:start}
.pqsm-card{background:var(--pqh-surface);border:1px solid var(--pqh-line);border-radius:14px;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);padding:20px}
.pqsm-card h2{margin:0 0 12px;color:var(--pqh-ink);font-size:16px;font-weight:750}
.pqsm-field{margin-bottom:12px}
.pqsm-field label{display:block;margin:0 0 4px;color:var(--pqh-faint);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.pqsm-input,.pqsm-select,.pqsm-field textarea{width:100%;box-sizing:border-box;min-height:38px;border:1px solid var(--pqh-line);border-radius:10px;padding:0 11px;background:var(--pqh-surface);color:var(--pqh-ink);font:550 13px/1.3 inherit}
.pqsm-field textarea{padding:9px 11px;min-height:56px;resize:vertical}
.pqsm-checks{max-height:170px;overflow:auto;border:1px solid var(--pqh-line);border-radius:10px;padding:6px}
.pqsm-check{display:flex;align-items:center;gap:8px;padding:5px 7px;border-radius:8px;font-size:13px;font-weight:550;color:var(--pqh-ink)}
.pqsm-check:hover{background:var(--pqh-tint)}
.pqsm-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 15px;border:0;border-radius:10px;background:var(--pqh-primary);color:#fff!important;text-decoration:none!important;font-size:13.5px;font-weight:650;cursor:pointer;box-shadow:0 6px 14px -8px rgba(33,102,209,.55)}
.pqsm-btn--light{background:var(--pqh-surface);color:var(--pqh-ink)!important;border:1px solid var(--pqh-line);box-shadow:none;min-height:32px;padding:0 11px;font-size:12.5px}
.pqsm-btn--light:hover{background:var(--pqh-tint)}
.pqsm-exam{border:1px solid var(--pqh-line);border-radius:12px;padding:14px 16px;margin-bottom:12px;background:var(--pqh-surface)}
.pqsm-exam--archived{opacity:.6}
.pqsm-exam h3{margin:0 0 3px;color:var(--pqh-ink);font-size:15px;font-weight:700}
.pqsm-exam .pqsm-meta{margin:0 0 10px;color:var(--pqh-muted);font-size:12.5px;font-weight:500}
.pqsm-exam .pqsm-rowactions{display:flex;gap:7px;flex-wrap:wrap}
.pqsm-pill{display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:8px;background:var(--pqh-tint);color:var(--pqh-primary-ink);font-size:11.5px;font-weight:650;margin-right:6px}
.pqsm-alert{margin:0 0 14px;padding:11px 13px;border-radius:11px;font-size:13px;font-weight:550}
.pqsm-alert--ok{background:var(--pqh-tint);color:var(--pqh-primary-ink);border:1px solid var(--pqh-tint-2)}
.pqsm-alert--bad{background:#fdeeee;color:#b3453e;border:1px solid #f3d2d0}
.pqsm-empty{border:1px dashed var(--pqh-line);border-radius:12px;padding:22px;text-align:center;color:var(--pqh-muted);font-weight:550}
@media(max-width:960px){.pqsm-grid{grid-template-columns:1fr}}
</style>
<main class="pqsm-shell">
<?php echo pqh_design_shell_html('pqsm-shell', '', ['title' => 'Exams']); ?>
  <div class="pqsm-wrap">
    <div class="pqsm-head">
      <h1>Safe Exam Browser exams</h1>
      <p>Create locked exams, assign students, and share launch links. Students need Safe Exam Browser installed (Windows, macOS, iPad).</p>
    </div>
    <?php if ($notice !== ''): ?><div class="pqsm-alert pqsm-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqsm-alert pqsm-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <?php if (!$tablesready): ?>
      <div class="pqsm-alert pqsm-alert--bad">The exam tables are not installed yet. Run <b>local_prequran/sql/create_seb_exam_tables.sql</b> in phpMyAdmin, then reload this page.</div>
    <?php else: ?>
    <div class="pqsm-grid">
      <section class="pqsm-card" aria-label="Create exam">
        <h2>Create exam</h2>
        <form method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="create">
          <div class="pqsm-field"><label for="pqsm-title">Title</label><input class="pqsm-input" id="pqsm-title" name="title" type="text" required></div>
          <div class="pqsm-field"><label for="pqsm-desc">Description</label><textarea id="pqsm-desc" name="description" placeholder="Shown to students on the launch page"></textarea></div>
          <div class="pqsm-field">
            <label for="pqsm-known">Exam content</label>
            <select class="pqsm-select" id="pqsm-known" name="knowncontent">
              <option value="">Choose content...</option>
              <?php foreach (pqh_seb_known_content() as $url => $label): ?>
                <option value="<?php echo s($url); ?>"><?php echo s($label); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="pqsm-field"><label for="pqsm-embed">Or custom content URL</label><input class="pqsm-input" id="pqsm-embed" name="embedurl" type="text" placeholder="/local/hubredirect/issue_child.php?goto=..."></div>
          <div class="pqsm-field"><label for="pqsm-duration">Duration (minutes)</label><input class="pqsm-input" id="pqsm-duration" name="duration" type="number" min="5" max="240" value="30"></div>
          <div class="pqsm-field"><label for="pqsm-wstart">Window opens</label><input class="pqsm-input" id="pqsm-wstart" name="window_start" type="datetime-local"></div>
          <div class="pqsm-field"><label for="pqsm-wend">Window closes</label><input class="pqsm-input" id="pqsm-wend" name="window_end" type="datetime-local"></div>
          <div class="pqsm-field"><label for="pqsm-quit">Emergency exit password</label><input class="pqsm-input" id="pqsm-quit" name="quitpassword" type="text" placeholder="ehel-unlock"></div>
          <div class="pqsm-field">
            <label>Students</label>
            <?php if ($students): ?>
              <div class="pqsm-checks">
                <?php foreach ($students as $studentid => $name): ?>
                  <label class="pqsm-check"><input type="checkbox" name="studentids[]" value="<?php echo (int)$studentid; ?>"> <?php echo s($name); ?></label>
                <?php endforeach; ?>
              </div>
            <?php else: ?>
              <div class="pqsm-empty">No assigned students found. Link students to your account first.</div>
            <?php endif; ?>
          </div>
          <button class="pqsm-btn" type="submit">Create exam</button>
        </form>
      </section>
      <section aria-label="Exams">
        <?php if (!$exams): ?>
          <div class="pqsm-empty">No exams yet. Create your first exam on the left.</div>
        <?php endif; ?>
        <?php foreach ($exams as $exam): ?>
          <?php
            $counts = $attemptcounts[(int)$exam->id] ?? ['assigned' => 0, 'finished' => 0];
            $windowline = 'Any time';
            if ((int)$exam->window_start > 0) {
                $windowline = userdate((int)$exam->window_start, get_string('strftimedatetimeshort'))
                    . ((int)$exam->window_end > 0 ? ' - ' . userdate((int)$exam->window_end, get_string('strftimedatetimeshort')) : '');
            }
          ?>
          <article class="pqsm-exam <?php echo (string)$exam->status === 'archived' ? 'pqsm-exam--archived' : ''; ?>">
            <h3><?php echo s((string)$exam->title); ?></h3>
            <p class="pqsm-meta">
              <span class="pqsm-pill"><?php echo (int)$exam->duration_minutes; ?> min</span>
              <span class="pqsm-pill"><?php echo s($windowline); ?></span>
              <span class="pqsm-pill"><?php echo (int)$counts['finished']; ?>/<?php echo (int)$counts['assigned']; ?> submitted</span>
              <?php if ((string)$exam->status === 'archived'): ?><span class="pqsm-pill">Archived</span><?php endif; ?>
              <?php if (trim((string)$exam->embedurl) === ''): ?><span class="pqsm-pill">No content URL</span><?php endif; ?>
            </p>
            <div class="pqsm-rowactions">
              <a class="pqsm-btn pqsm-btn--light" href="<?php echo pqh_seb_exam_url((int)$exam->id)->out(false); ?>">Open exam page</a>
              <a class="pqsm-btn pqsm-btn--light" href="<?php echo pqh_seb_config_download_url((int)$exam->id)->out(false); ?>">Download config</a>
              <?php if ((string)$exam->status === 'active'): ?>
                <form method="post" style="display:inline" onsubmit="return confirm('Archive this exam? Students will no longer be able to take it.');">
                  <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                  <input type="hidden" name="action" value="archive">
                  <input type="hidden" name="examid" value="<?php echo (int)$exam->id; ?>">
                  <button class="pqsm-btn pqsm-btn--light" type="submit">Archive</button>
                </form>
              <?php endif; ?>
            </div>
          </article>
        <?php endforeach; ?>
      </section>
    </div>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
