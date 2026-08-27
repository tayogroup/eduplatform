<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once(__DIR__ . '/live_security.php');

$childid = optional_param('childid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
$returnurl = new moodle_url($workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $urlparams);

function pqlrp_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(pqlrp_url('/local/hubredirect/live_recordings.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Class Recordings');
$PAGE->set_heading('Live Class Recordings');
$PAGE->add_body_class('pqh-live-recordings-parent-page');

function pqlrp_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlrp_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqlrp_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlrp_table_exists('local_prequran_comm_participant') && pqlrp_table_exists('local_prequran_comm_thread')) {
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = ?
                AND p.role = ?
                AND t.studentid = ?",
            [$parentid, 'parent', $studentid]
        );
    }
    return false;
}

function pqlrp_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    if (pqlrp_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC');
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }
    if (pqlrp_table_exists('local_prequran_comm_participant') && pqlrp_table_exists('local_prequran_comm_thread')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT t.studentid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = :parentid
                AND p.role = :role
                AND t.studentid IS NOT NULL",
            ['parentid' => $parentid, 'role' => 'parent']
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }
    return pqlrp_enrich_children(array_values($children));
}

function pqlrp_is_managed_student(int $userid): bool {
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

function pqlrp_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlrp_table_exists('local_prequran_teacher_student')
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

function pqlrp_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (pqlrp_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $teacherid, 'studentid' => $studentid, 'status' => 'active']);
        }
    }
    if (!pqlrp_has_teacher_role($teacherid) || !pqlrp_is_managed_student($studentid)) {
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

function pqlrp_enrich_children(array $studentids): array {
    $children = [];
    foreach (array_unique(array_filter(array_map('intval', $studentids))) as $studentid) {
        $user = core_user::get_user($studentid);
        $children[] = ['studentid' => $studentid, 'name' => $user ? fullname($user) : 'Student ' . $studentid];
    }
    usort($children, function($a, $b) {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $children;
}

function pqlrp_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid) || $userid === $studentid) {
        return true;
    }
    return pqlrp_parent_can_access_child($userid, $studentid) || pqlrp_teacher_can_access_student($userid, $studentid);
}

function pqlrp_visible_recordings(int $studentid): array {
    global $DB;
    if (!pqlrp_table_exists('local_prequran_live_recording')
        || !pqlrp_table_exists('local_prequran_live_session')
        || !pqlrp_table_exists('local_prequran_live_participant')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT r.*,
                s.title AS session_title,
                s.teacherid,
                s.scheduled_start,
                s.lessonid,
                s.unitid
           FROM {local_prequran_live_recording} r
           JOIN {local_prequran_live_session} s ON s.id = r.sessionid
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
            AND r.visible_to_parent = 1
            AND r.status = :recordingstatus
            AND (r.expiresat = 0 OR r.expiresat > :now)
       ORDER BY s.scheduled_start DESC, r.id DESC",
        ['studentid' => $studentid, 'role' => 'student', 'participantstatus' => 'active', 'recordingstatus' => 'available', 'now' => time()]
    ));
}

$modechildren = [];
if ($childid <= 0) {
    $modechildren = pqlrp_parent_children((int)$USER->id);
    if (count($modechildren) === 1) {
        $childid = (int)$modechildren[0]['studentid'];
    }
}

if ($childid > 0 && !pqlrp_user_can_access_child((int)$USER->id, $childid)) {
    pqh_live_security_audit(
        'live_recording_access_denied',
        'student',
        $childid,
        ['studentid' => $childid]
    );
    pqh_access_denied(
        'You cannot view live-class recordings for this student.',
        $returnurl,
        'Live recording access required'
    );
}

$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');
$recordings = $childid > 0 ? pqlrp_visible_recordings($childid) : [];

pqh_enforce_role_domain($consumercontext, $workspaceid, (int)$USER->id);

echo $OUTPUT->header();
?>
<style>
body.pqh-live-recordings-parent-page header,
body.pqh-live-recordings-parent-page footer,
body.pqh-live-recordings-parent-page nav.navbar,
body.pqh-live-recordings-parent-page #page-header,
body.pqh-live-recordings-parent-page #page-footer,
body.pqh-live-recordings-parent-page .drawer,
body.pqh-live-recordings-parent-page .drawer-toggles,
body.pqh-live-recordings-parent-page .block-region,
body.pqh-live-recordings-parent-page [data-region="drawer"],
body.pqh-live-recordings-parent-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-recordings-parent-page #page,
body.pqh-live-recordings-parent-page #page-content,
body.pqh-live-recordings-parent-page #region-main,
body.pqh-live-recordings-parent-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlrp-shell{min-height:100vh;padding:34px 18px 54px;background:#fff;color:#0f2237;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6}
.pqlrp-wrap{max-width:980px;margin:0 auto}
.pqlrp-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;padding:22px;border-radius:14px;background:#fff;border:1px solid #e4e9ef;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14)}
.pqlrp-kicker{margin:0 0 6px;color:#5b6b7c;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.pqlrp-title{margin:0;font-size:26px;line-height:1.1;font-weight:800;color:#0f2237;letter-spacing:-.02em}
.pqlrp-subtitle{margin:8px 0 0;color:#5b6b7c;font-size:14px;font-weight:500}
.pqlrp-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlrp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 15px;border-radius:10px;background:#fff;border:1px solid #e4e9ef;color:#0f2237!important;text-decoration:none;font-size:13px;font-weight:650}
.pqlrp-btn:hover{background:#edf3fc;border-color:#e0ebfa;text-decoration:none}
.pqlrp-btn--light{background:#edf3fc;color:#17498f!important;border:1px solid #e0ebfa}
.pqlrp-list{display:grid;gap:14px}
.pqlrp-card{padding:18px;border-radius:14px;background:#fff;border:1px solid #e4e9ef;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14)}
.pqlrp-card h2{margin:0;color:#0f2237;font-size:19px;font-weight:750;letter-spacing:-.01em}
.pqlrp-meta{margin:5px 0 0;color:#5b6b7c;font-size:13px;font-weight:600}
.pqlrp-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}
.pqlrp-empty{padding:24px;border-radius:14px;background:#fff;border:1px dashed #e4e9ef;color:#5b6b7c;font-weight:550}
.pqlrp-students{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.pqlrp-student{padding:16px;border-radius:14px;background:#fff;border:1px solid #e4e9ef;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);text-decoration:none;color:#0f2237!important;font-weight:700}
.pqlrp-student span{display:block;margin-top:4px;color:#5b6b7c;font-size:12px;font-weight:600}
@media(max-width:720px){.pqlrp-top{display:block}.pqlrp-title{font-size:22px}.pqlrp-actions{margin-top:12px}.pqlrp-btn{width:100%}}
<?php echo pqh_dashboard_header_css(); ?>
/* ---- EduPlatform design system layer: same tokens as the
   student/teacher dashboard - light paper background, blue
   appbar/gnav tint, quiet white surfaces, single blue accent. ---- */
.pqlrp-shell{
  --pqh-ink:#0f2237;--pqh-muted:#5b6b7c;--pqh-faint:#8494a5;--pqh-line:#e4e9ef;--pqh-bg:#f7f4ec;--pqh-surface:#fff;
  --pqh-tint:#edf3fc;--pqh-tint-2:#e0ebfa;--pqh-primary:#2166d1;--pqh-primary-ink:#17498f;
  background:#fff!important;color:var(--pqh-ink)}
.pqlrp-shell .pqh-appbar{background:linear-gradient(90deg,#cfe9ff 0%,#e3f4ff 50%,#f2fbff 100%)}
.pqlrp-shell .pqh-workspace-top{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;box-shadow:none!important;border-radius:14px!important}
.pqlrp-shell .pqh-workspace-title{color:var(--pqh-ink)!important;font-size:26px!important;font-weight:800!important;letter-spacing:-.02em!important;text-shadow:none!important}
.pqlrp-shell .pqh-workspace-sub{color:var(--pqh-muted)!important;font-weight:500!important;opacity:1}
.pqlrp-shell .pqh-workspace-actions a,.pqlrp-shell .pqh-workspace-actions button,.pqlrp-btn{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;color:var(--pqh-ink)!important;font-weight:650!important;border-radius:10px!important;box-shadow:none!important}
.pqlrp-shell .pqh-workspace-actions a:hover,.pqlrp-shell .pqh-workspace-actions button:hover,.pqlrp-btn:hover{background:var(--pqh-tint)!important;border-color:var(--pqh-tint-2)!important;text-decoration:none!important}
.pqlrp-shell .pqh-workspace-actions a.pqh-workspace-logout{background:var(--pqh-ink)!important;border-color:var(--pqh-ink)!important;color:#fff!important}
.pqlrp-shell [class*="-card"],.pqlrp-shell [class*="-panel"]{background:var(--pqh-surface);border-color:var(--pqh-line)!important;border-radius:14px;box-shadow:0 1px 2px rgba(15,34,55,.05)}
.pqlrp-shell [class*="-pill"]{background:var(--pqh-tint)!important;color:var(--pqh-primary-ink)!important;border-radius:8px!important;font-weight:650!important}
.pqlrp-shell h1,.pqlrp-shell h2,.pqlrp-shell h3{color:var(--pqh-ink)}
<?php echo pqh_design_shell_css('.pqlrp-shell'); ?>
</style>
<style><?php echo pqh_openproject_skin_css('pqlrp', 'pqh-live-recordings-parent-page'); ?></style>
<style><?php echo pqh_learner_chrome_css('.pqlrp-shell'); ?></style>
<main class="pqlrp-shell">
<?php echo pqh_design_shell_html('pqlrp-shell', 'live', pqh_live_page_shell_opts('Live Recordings', $urlparams, $childid)); ?>
  <div class="pqlrp-wrap">
    <section class="pqlrp-top pqh-workspace-top">
      <div>
        <p class="pqlrp-kicker">Approved recordings</p>
        <h1 class="pqlrp-title pqh-workspace-title">Live class recordings for <?php echo s($childname); ?></h1>
        <p class="pqlrp-subtitle pqh-workspace-sub">Only recordings reviewed and published by <?php echo s((string)($consumercontext->consumername ?? 'EduPlatform')); ?> are shown here.</p>
      </div>
    </section>

    <?php if ($childid <= 0): ?>
      <?php if ($modechildren): ?>
        <section class="pqlrp-students" aria-label="Choose student">
          <?php foreach ($modechildren as $childrow): ?>
            <a class="pqlrp-student" href="<?php echo pqlrp_url('/local/hubredirect/live_recordings.php', $urlparams, ['childid' => (int)$childrow['studentid']])->out(false); ?>">
              <?php echo s((string)$childrow['name']); ?>
              <span>Open approved live recordings</span>
            </a>
          <?php endforeach; ?>
        </section>
      <?php else: ?>
        <div class="pqlrp-empty">Choose a student from the dashboard first.</div>
      <?php endif; ?>
    <?php else: ?>
      <?php if (!$recordings): ?>
        <div class="pqlrp-empty">No approved live-class recordings are available yet.</div>
      <?php else: ?>
        <section class="pqlrp-list" aria-label="Approved live recordings">
          <?php foreach ($recordings as $recording): ?>
            <?php
              $teacher = core_user::get_user((int)$recording->teacherid);
              $lesson = trim((string)$recording->lessonid . ' / ' . (string)$recording->unitid, ' /');
            ?>
            <article class="pqlrp-card">
              <h2><?php echo s((string)$recording->session_title); ?></h2>
              <p class="pqlrp-meta">
                <?php echo userdate((int)$recording->scheduled_start, get_string('strftimedatetimeshort')); ?>
                - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$recording->teacherid); ?>
              </p>
              <?php if ($lesson !== ''): ?><p class="pqlrp-meta"><?php echo s($lesson); ?></p><?php endif; ?>
              <p class="pqlrp-meta">Expires: <?php echo !empty($recording->expiresat) ? userdate((int)$recording->expiresat, get_string('strftimedatetimeshort')) : 'not set'; ?></p>
              <div class="pqlrp-actions pqh-workspace-actions">
                <?php if ((string)$recording->playback_url !== ''): ?>
                  <a class="pqlrp-btn" href="<?php echo s((string)$recording->playback_url); ?>" target="_blank" rel="noopener noreferrer">Open recording</a>
                <?php endif; ?>
              </div>
            </article>
          <?php endforeach; ?>
        </section>
      <?php endif; ?>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
