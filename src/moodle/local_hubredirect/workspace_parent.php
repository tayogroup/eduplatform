<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$childid = optional_param('childid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($childid > 0) {
    $urlparams['childid'] = $childid;
}
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspace_parent.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Parent Workspace');
$PAGE->set_heading('Parent Workspace');
$PAGE->add_body_class('pqw-parent-page');

function pqwp_parent_children(int $parentid): array {
    global $DB;
    $ids = [];
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (pqh_table_exists_safe($table)) {
            foreach ($DB->get_records($table, ['guardianid' => $parentid], 'timemodified DESC', 'id,studentid') as $row) {
                $ids[(int)$row->studentid] = (int)$row->studentid;
            }
        }
    }
    if (pqh_table_exists_safe('local_prequran_comm_thread') && pqh_table_exists_safe('local_prequran_comm_participant')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT t.studentid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = :parentid
                AND p.role = :role
                AND t.studentid > 0",
            ['parentid' => $parentid, 'role' => 'parent']
        );
        foreach ($rows as $row) {
            $ids[(int)$row->studentid] = (int)$row->studentid;
        }
    }
    $children = [];
    foreach (array_values(array_filter($ids)) as $id) {
        if (!pqh_user_belongs_to_consumer_context((int)$id)) {
            continue;
        }
        $user = core_user::get_user((int)$id, 'id,firstname,lastname,email,username', IGNORE_MISSING);
        $children[] = (object)[
            'id' => (int)$id,
            'name' => $user ? fullname($user) : 'Student ' . (int)$id,
            'email' => $user ? (string)$user->email : '',
        ];
    }
    usort($children, static function($a, $b): int {
        return strcasecmp((string)$a->name, (string)$b->name);
    });
    return $children;
}

function pqwp_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $parentid <= 0) {
        return false;
    }
    if (!pqh_user_belongs_to_consumer_context($studentid)) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (pqh_table_exists_safe($table) && $DB->record_exists($table, ['guardianid' => $parentid, 'studentid' => $studentid])) {
            return true;
        }
    }
    return pqh_table_exists_safe('local_prequran_comm_thread')
        && pqh_table_exists_safe('local_prequran_comm_participant')
        && $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = ?
                AND p.role = ?
                AND t.studentid = ?",
            [$parentid, 'parent', $studentid]
        );
}

function pqwp_materials(int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT a.id, a.workspaceid, a.workflow_status, a.startedat, a.completedat, a.reviewedat, a.timemodified,
                m.id AS materialid, m.title, m.material_type, m.course_key, m.description, m.source_url, w.name AS workspace_name
           FROM {local_prequran_workspace_mat_assign} a
           JOIN {local_prequran_workspace_material} m ON m.id = a.materialid
           JOIN {local_prequran_workspace} w ON w.id = a.workspaceid
          WHERE a.target_type = :targettype
            AND a.targetid = :studentid
            AND a.status = :status
            AND m.status = :materialstatus
       ORDER BY a.timemodified DESC, a.id DESC",
        ['targettype' => 'student', 'studentid' => $studentid, 'status' => 'active', 'materialstatus' => 'active'],
        0,
        40
    ));
}

function pqwp_attendance_summary(int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_attendance')) {
        return ['total' => 0, 'present' => 0, 'recent' => []];
    }
    $total = (int)$DB->count_records('local_prequran_live_attendance', ['studentid' => $studentid]);
    $present = (int)$DB->count_records_select(
        'local_prequran_live_attendance',
        "studentid = ? AND attendance_status IN ('present','late','attended')",
        [$studentid]
    );
    $recent = array_values($DB->get_records_sql(
        "SELECT a.id, a.sessionid, a.attendance_status, a.participation_status, a.join_time, a.timemodified,
                s.title, s.scheduled_start, s.teacherid
           FROM {local_prequran_live_attendance} a
      LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
          WHERE a.studentid = :studentid
       ORDER BY COALESCE(s.scheduled_start, a.timemodified) DESC, a.id DESC",
        ['studentid' => $studentid],
        0,
        12
    ));
    return ['total' => $total, 'present' => $present, 'recent' => $recent];
}

function pqwp_parent_notes(int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_note')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT n.id, n.sessionid, n.teacherid, n.strengths, n.needs_practice, n.homework, n.parent_summary, n.followup_status, n.timemodified,
                s.title, s.scheduled_start
           FROM {local_prequran_live_note} n
      LEFT JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.studentid = :studentid
            AND n.visible_to_parent = 1
       ORDER BY n.timemodified DESC, n.id DESC",
        ['studentid' => $studentid],
        0,
        12
    ));
}

function pqwp_recordings(int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_recording')
        || !pqh_table_exists_safe('local_prequran_live_participant')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT r.id, r.sessionid, r.name, r.playback_url, r.playback_format, r.duration_minutes,
                r.published, r.visible_to_parent, r.status, r.expiresat, r.timemodified,
                s.title, s.scheduled_start, s.teacherid
           FROM {local_prequran_live_recording} r
           JOIN {local_prequran_live_session} s ON s.id = r.sessionid
           JOIN {local_prequran_live_participant} p ON p.sessionid = r.sessionid
          WHERE p.studentid = :studentid
            AND p.status = :participantstatus
            AND r.published = 1
            AND r.visible_to_parent = 1
            AND r.status = :recordstatus
            AND r.playback_url <> ''
            AND (r.expiresat = 0 OR r.expiresat > :now)
       ORDER BY COALESCE(s.scheduled_start, r.timemodified) DESC, r.id DESC",
        ['studentid' => $studentid, 'participantstatus' => 'active', 'recordstatus' => 'available', 'now' => time()],
        0,
        12
    ));
}

function pqwp_status_label(string $status): string {
    $labels = [
        'assigned' => 'Assigned',
        'in_progress' => 'In progress',
        'completed' => 'Completed',
        'reviewed' => 'Reviewed',
    ];
    return $labels[$status] ?? 'Assigned';
}

$children = pqwp_parent_children((int)$USER->id);
if (!$children) {
    pqh_access_denied(
        'No student is linked to this parent account yet.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Parent workspace access required'
    );
}
if ($childid <= 0) {
    $childid = (int)$children[0]->id;
}
if (!pqwp_parent_can_access_child((int)$USER->id, $childid)) {
    pqh_access_denied(
        'This student is not linked to your parent account.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Parent workspace access required'
    );
}
$child = core_user::get_user($childid, 'id,firstname,lastname,email,username', IGNORE_MISSING);
if (!$child) {
    pqh_access_denied(
        'The selected student account was not found.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Parent workspace unavailable'
    );
}
$materials = pqwp_materials($childid);
$attendance = pqwp_attendance_summary($childid);
$notes = pqwp_parent_notes($childid);
$recordings = pqwp_recordings($childid);

echo $OUTPUT->header();
?>
<style>
body.pqw-parent-page header,body.pqw-parent-page footer,body.pqw-parent-page nav.navbar,body.pqw-parent-page #page-header,body.pqw-parent-page #page-footer,body.pqw-parent-page .drawer,body.pqw-parent-page .drawer-toggles,body.pqw-parent-page .block-region,body.pqw-parent-page [data-region="drawer"],body.pqw-parent-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-parent-page #page,body.pqw-parent-page #page-content,body.pqw-parent-page #region-main,body.pqw-parent-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwp-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqwp-wrap{max-width:1180px;margin:0 auto}.pqwp-top,.pqwp-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwp-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqwp-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqwp-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqwp-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqwp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqwp-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqwp-select{min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:850;padding:0 10px}.pqwp-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqwp-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}.pqwp-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950;line-height:1}.pqwp-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqwp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pqwp-panel h2{margin:0 0 12px;color:#221b22;font-size:22px;font-weight:950}.pqwp-table{width:100%;border-collapse:separate;border-spacing:0}.pqwp-table th,.pqwp-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqwp-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwp-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqwp-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}.pqwp-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqwp-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}.pqwp-note{padding:12px;border-bottom:1px solid rgba(23,48,68,.1)}.pqwp-note:last-child{border-bottom:0}
@media(max-width:900px){.pqwp-top,.pqwp-grid{grid-template-columns:1fr}.pqwp-actions{justify-content:flex-start}.pqwp-metrics{grid-template-columns:1fr}}
<?php echo pqh_workspace_header_css(); ?>
</style>
<main class="pqwp-shell">
  <div class="pqwp-wrap">
    <section class="pqwp-top pqh-workspace-top">
      <div>
        <h1 class="pqwp-title pqh-workspace-title">Parent Workspace</h1>
        <p class="pqwp-sub pqh-workspace-sub"><?php echo s(fullname($child)); ?> - assigned materials, attendance, and teacher notes.</p>
      </div>
      <form class="pqwp-actions pqh-workspace-actions" method="get">
        <?php if (count($children) > 1): ?>
          <select class="pqwp-select" name="childid" onchange="this.form.submit()">
            <?php foreach ($children as $option): ?><option value="<?php echo (int)$option->id; ?>"<?php echo (int)$option->id === $childid ? ' selected' : ''; ?>><?php echo s($option->name); ?></option><?php endforeach; ?>
          </select>
        <?php endif; ?>
        <button class="pqwp-btn pqwp-btn--light" type="button" onclick="window.history.back()">Back</button>
        <a class="pqwp-btn pqwp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php', ['childid' => $childid]))->out(false); ?>">Dashboard</a>
        <a class="pqwp-btn pqwp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/parent_billing.php', ['childid' => $childid] + $urlparams))->out(false); ?>">Billing</a>
        <a class="pqwp-btn pqwp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_summaries.php', ['childid' => $childid]))->out(false); ?>">Live summaries</a>
        <a class="pqwp-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </form>
    </section>
    <section class="pqwp-metrics">
      <div class="pqwp-metric"><strong><?php echo count($materials); ?></strong><span>assigned materials</span></div>
      <div class="pqwp-metric"><strong><?php echo (int)$attendance['present']; ?>/<?php echo (int)$attendance['total']; ?></strong><span>attendance present/total</span></div>
      <div class="pqwp-metric"><strong><?php echo count($notes); ?></strong><span>parent-visible notes</span></div>
      <div class="pqwp-metric"><strong><?php echo count($recordings); ?></strong><span>approved recordings</span></div>
    </section>
    <section class="pqwp-grid">
      <article class="pqwp-panel">
        <h2>Assigned Materials</h2>
        <?php if (!$materials): ?><div class="pqwp-empty">No assigned materials yet.</div><?php else: ?>
          <table class="pqwp-table"><thead><tr><th>Material</th><th>Status</th><th>Open</th></tr></thead><tbody>
            <?php foreach ($materials as $material): ?><tr><td><span class="pqwp-name"><?php echo s($material->title); ?></span><span class="pqwp-muted"><?php echo s((string)$material->workspace_name); ?></span></td><td><span class="pqwp-pill"><?php echo s(pqwp_status_label((string)($material->workflow_status ?? 'assigned'))); ?></span></td><td><?php if (!empty($material->source_url)): ?><a class="pqwp-btn pqwp-btn--light" href="<?php echo s($material->source_url); ?>" target="_blank" rel="noopener">Open</a><?php endif; ?></td></tr><?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
      </article>
      <article class="pqwp-panel">
        <h2>Attendance</h2>
        <?php if (!$attendance['recent']): ?><div class="pqwp-empty">No attendance records yet.</div><?php else: ?>
          <table class="pqwp-table"><thead><tr><th>Session</th><th>Status</th><th>When</th></tr></thead><tbody>
            <?php foreach ($attendance['recent'] as $row): ?><tr><td><span class="pqwp-name"><?php echo s((string)($row->title ?? 'Session #' . (int)$row->sessionid)); ?></span><span class="pqwp-muted"><?php echo s($row->teacherid ? 'Teacher #' . (int)$row->teacherid : ''); ?></span></td><td><span class="pqwp-pill"><?php echo s((string)$row->attendance_status); ?></span></td><td><?php echo s(userdate((int)($row->scheduled_start ?? $row->timemodified ?? 0), get_string('strftimedatetimeshort'))); ?></td></tr><?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
      </article>
      <article class="pqwp-panel" style="grid-column:1/-1">
        <h2>Approved Recordings</h2>
        <?php if (!$recordings): ?><div class="pqwp-empty">No approved class recordings are available yet.</div><?php else: ?>
          <table class="pqwp-table"><thead><tr><th>Session</th><th>Recording</th><th>When</th><th>Open</th></tr></thead><tbody>
            <?php foreach ($recordings as $recording): ?><tr><td><span class="pqwp-name"><?php echo s((string)($recording->title ?: 'Session #' . (int)$recording->sessionid)); ?></span><span class="pqwp-muted"><?php echo s($recording->teacherid ? 'Teacher #' . (int)$recording->teacherid : ''); ?></span></td><td><?php echo s((string)($recording->name ?: 'Class recording')); ?><span class="pqwp-muted"><?php echo s((string)$recording->playback_format); ?><?php echo (int)$recording->duration_minutes > 0 ? ' / ' . (int)$recording->duration_minutes . ' min' : ''; ?></span></td><td><?php echo s(userdate((int)($recording->scheduled_start ?? $recording->timemodified ?? 0), get_string('strftimedatetimeshort'))); ?></td><td><a class="pqwp-btn pqwp-btn--light" href="<?php echo s((string)$recording->playback_url); ?>" target="_blank" rel="noopener">Open</a></td></tr><?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
      </article>
      <article class="pqwp-panel" style="grid-column:1/-1">
        <h2>Teacher Notes</h2>
        <?php if (!$notes): ?><div class="pqwp-empty">No parent-visible teacher notes yet.</div><?php else: ?>
          <?php foreach ($notes as $note): ?><div class="pqwp-note"><span class="pqwp-name"><?php echo s((string)($note->title ?? 'Session #' . (int)$note->sessionid)); ?></span><span class="pqwp-muted"><?php echo s(userdate((int)$note->timemodified, get_string('strftimedatetimeshort'))); ?><?php echo !empty($note->followup_status) ? ' / follow-up: ' . s((string)$note->followup_status) : ''; ?></span><?php if (!empty($note->parent_summary)): ?><p><?php echo s((string)$note->parent_summary); ?></p><?php endif; ?><?php if (!empty($note->strengths)): ?><p><strong>Strengths:</strong> <?php echo s((string)$note->strengths); ?></p><?php endif; ?><?php if (!empty($note->needs_practice)): ?><p><strong>Needs practice:</strong> <?php echo s((string)$note->needs_practice); ?></p><?php endif; ?><?php if (!empty($note->homework)): ?><p><strong>Homework:</strong> <?php echo s((string)$note->homework); ?></p><?php endif; ?></div><?php endforeach; ?>
        <?php endif; ?>
      </article>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
