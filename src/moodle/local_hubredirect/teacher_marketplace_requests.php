<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

require_login();

function pqtmr_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtmr_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtmr_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqtmr_ready(): bool {
    return pqtmr_table_exists('local_prequran_teacher_request')
        && pqtmr_table_exists('local_prequran_teacher_profile');
}

function pqtmr_short(string $value, int $max = 180): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqtmr_status_label(string $status): string {
    $labels = [
        'new' => 'Submitted',
        'selection_requested' => 'Selection requested',
        'academy_review' => 'Academy review',
        'teacher_contacted' => 'Teacher contacted',
        'parent_confirmed' => 'Parent confirmed',
        'matched' => 'Matched',
        'contacted' => 'Contacted',
        'shortlisted' => 'Shortlisted',
        'assigned' => 'Assigned',
        'declined' => 'Declined',
        'closed' => 'Closed',
    ];
    return $labels[$status] ?? $status;
}

function pqtmr_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : ($userid > 0 ? 'User ' . $userid : 'Not selected');
}

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $consumerparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
$brandname = (string)$consumercontext->consumername;

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_marketplace_requests.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brandname . ' Teacher Requests');
$PAGE->set_heading($brandname . ' Teacher Requests');
$PAGE->add_body_class('pqh-teacher-marketplace-requests-page');

$ready = pqtmr_ready();
$requests = [];

if ($ready) {
    $consumerselect = ", '' AS consumer_slug, '' AS consumer_name";
    $consumerjoin = '';
    $consumerwhere = '';
    $params = ['parentid' => (int)$USER->id];
    if (pqtmr_column_exists('local_prequran_teacher_request', 'consumerid')) {
        $consumerselect = ', c.slug AS consumer_slug, c.name AS consumer_name';
        $consumerjoin = 'LEFT JOIN {local_prequran_consumer} c ON c.id = tr.consumerid';
        if ((int)$consumercontext->consumerid > 0) {
            $consumerwhere = ' AND tr.consumerid = :consumerid';
            $params['consumerid'] = (int)$consumercontext->consumerid;
        }
    }
    $assignmentselect = pqtmr_table_exists('local_prequran_teacher_student')
        ? ", COALESCE((SELECT MAX(ts.id)
                         FROM {local_prequran_teacher_student} ts
                        WHERE ts.teacherid = tr.teacherid
                          AND ts.studentid = tr.studentid
                          AND ts.status = 'active'), 0) AS assignmentid,
             COALESCE((SELECT MAX(ts.workspaceid)
                         FROM {local_prequran_teacher_student} ts
                        WHERE ts.teacherid = tr.teacherid
                          AND ts.studentid = tr.studentid
                          AND ts.status = 'active'), 0) AS assignmentworkspaceid"
        : ', 0 AS assignmentid, 0 AS assignmentworkspaceid';

    $requests = array_values($DB->get_records_sql(
        "SELECT tr.*, tp.teacher_display_name {$consumerselect} {$assignmentselect}
           FROM {local_prequran_teacher_request} tr
      LEFT JOIN {local_prequran_teacher_profile} tp ON tp.userid = tr.teacherid
           {$consumerjoin}
          WHERE tr.parentid = :parentid
            {$consumerwhere}
       ORDER BY tr.timemodified DESC, tr.timecreated DESC",
        $params,
        0,
        100
    ));
    $requests = array_values(array_filter($requests, static function($request) use ($consumercontext): bool {
        $studentid = (int)($request->studentid ?? 0);
        if ($studentid > 0 && !pqh_user_belongs_to_consumer_context($studentid, $consumercontext)) {
            return false;
        }
        $assignmentworkspaceid = (int)($request->assignmentworkspaceid ?? 0);
        if ($assignmentworkspaceid > 0 && !pqh_consumer_context_allows_workspace($consumercontext, $assignmentworkspaceid)) {
            return false;
        }
        return true;
    }));
}

echo $OUTPUT->header();
?>
<style>
body.pqh-teacher-marketplace-requests-page header,body.pqh-teacher-marketplace-requests-page footer,body.pqh-teacher-marketplace-requests-page nav.navbar,body.pqh-teacher-marketplace-requests-page #page-header,body.pqh-teacher-marketplace-requests-page #page-footer,body.pqh-teacher-marketplace-requests-page .drawer,body.pqh-teacher-marketplace-requests-page .drawer-toggles,body.pqh-teacher-marketplace-requests-page .block-region,body.pqh-teacher-marketplace-requests-page [data-region="drawer"],body.pqh-teacher-marketplace-requests-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-teacher-marketplace-requests-page #page,body.pqh-teacher-marketplace-requests-page #page-content,body.pqh-teacher-marketplace-requests-page #region-main,body.pqh-teacher-marketplace-requests-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqtmr-shell{min-height:100vh;padding:28px 18px 54px;background:#f4f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqtmr-wrap{max-width:1080px;margin:0 auto}.pqtmr-top,.pqtmr-panel,.pqtmr-card{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqtmr-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:14px}.pqtmr-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqtmr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqtmr-actions,.pqtmr-card-actions{display:flex;gap:8px;flex-wrap:wrap}.pqtmr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 13px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}.pqtmr-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqtmr-btn--tiny{min-height:30px;padding:0 9px;font-size:12px}
.pqtmr-panel{padding:18px;margin-bottom:14px}.pqtmr-panel h2{margin:0 0 10px;font-size:20px;font-weight:950;color:#241b24}.pqtmr-grid{display:grid;gap:12px}.pqtmr-card{padding:16px}.pqtmr-card-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}.pqtmr-name{margin:0;color:#241b24;font-size:20px;font-weight:950;line-height:1.15}.pqtmr-muted{color:#5e7280;font-weight:800}.pqtmr-text{margin:8px 0 0;color:#4f6472;font-size:14px;font-weight:780;line-height:1.45}.pqtmr-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#eef7ee;color:#2f5d42;font-size:12px;font-weight:950}.pqtmr-pill--warn{background:#fff6de;color:#745323}.pqtmr-pill--bad{background:#fff0ed;color:#883526}.pqtmr-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;background:#fff;color:#5e7280;font-weight:850}
@media(max-width:760px){.pqtmr-top,.pqtmr-card-head{display:block}.pqtmr-actions,.pqtmr-card-actions{margin-top:12px}.pqtmr-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqtmr-shell">
  <div class="pqtmr-wrap">
    <section class="pqtmr-top pqh-workspace-top">
      <div>
        <h1 class="pqtmr-title pqh-workspace-title">My Teacher Requests</h1>
        <p class="pqtmr-sub pqh-workspace-sub">Track teacher marketplace messages, selections, assignments, and next operational steps for <?php echo s($brandname); ?>.</p>
      </div>
      <div class="pqtmr-actions pqh-workspace-actions">
        <a class="pqtmr-btn pqtmr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams))->out(false); ?>">Marketplace</a>
        <a class="pqtmr-btn pqtmr-btn--light" href="<?php echo (new moodle_url((int)($consumercontext->workspaceid ?? 0) > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $consumerparams))->out(false); ?>">Dashboard</a>
      </div>
    </section>
    <?php if (!$ready): ?>
      <div class="pqtmr-empty">Teacher request schema is not ready yet. Please run the local_prequran Moodle upgrade.</div>
    <?php elseif (!$requests): ?>
      <section class="pqtmr-panel">
        <h2>No Requests Yet</h2>
        <div class="pqtmr-empty">You have not requested a marketplace teacher for <?php echo s($brandname); ?> yet.</div>
      </section>
    <?php else: ?>
      <section class="pqtmr-panel">
        <h2>Request Status</h2>
        <div class="pqtmr-grid">
          <?php foreach ($requests as $request): ?>
            <?php
            $status = (string)$request->request_status;
            $teachername = trim((string)($request->teacher_display_name ?? '')) !== '' ? (string)$request->teacher_display_name : pqtmr_user_name((int)$request->teacherid);
            $studentname = pqtmr_user_name((int)$request->studentid);
            $requestcontextparams = $consumerparams;
            if ((string)($request->consumer_slug ?? '') !== '') {
                $requestcontextparams['consumer'] = (string)$request->consumer_slug;
            }
            if ((int)($request->assignmentworkspaceid ?? 0) > 0) {
                $requestcontextparams['workspaceid'] = (int)$request->assignmentworkspaceid;
            }
            $profileparams = $requestcontextparams + ['teacherid' => (int)$request->teacherid];
            $studentworkspaceurl = (int)($request->assignmentworkspaceid ?? 0) > 0 && (int)$request->studentid > 0
                ? new moodle_url('/local/hubredirect/workspace_student.php', $requestcontextparams + ['studentid' => (int)$request->studentid])
                : null;
            $pillclass = in_array($status, ['assigned', 'matched', 'parent_confirmed'], true) ? '' : (in_array($status, ['declined', 'closed'], true) ? ' pqtmr-pill--bad' : ' pqtmr-pill--warn');
            ?>
            <article class="pqtmr-card">
              <div class="pqtmr-card-head">
                <div>
                  <h3 class="pqtmr-name"><?php echo s($teachername); ?></h3>
                  <div class="pqtmr-muted">Student: <?php echo s($studentname); ?> · Submitted <?php echo userdate((int)$request->timecreated); ?></div>
                  <?php if ((string)($request->consumer_name ?? '') !== ''): ?><div class="pqtmr-muted"><?php echo s((string)$request->consumer_name); ?></div><?php endif; ?>
                </div>
                <span class="pqtmr-pill<?php echo $pillclass; ?>"><?php echo s(pqtmr_status_label($status)); ?></span>
              </div>
              <?php if (trim((string)$request->message) !== ''): ?><p class="pqtmr-text"><?php echo s(pqtmr_short((string)$request->message, 260)); ?></p><?php endif; ?>
              <?php if (trim((string)$request->admin_notes) !== ''): ?><p class="pqtmr-text"><strong>Review notes:</strong> <?php echo s(pqtmr_short((string)$request->admin_notes, 220)); ?></p><?php endif; ?>
              <div class="pqtmr-card-actions">
                <a class="pqtmr-btn pqtmr-btn--light pqtmr-btn--tiny" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', $profileparams))->out(false); ?>">Teacher profile</a>
                <?php if ((int)$request->threadid > 0): ?><a class="pqtmr-btn pqtmr-btn--light pqtmr-btn--tiny" href="<?php echo (new moodle_url('/local/hubredirect/communications.php', $requestcontextparams + ['threadid' => (int)$request->threadid, 'opencomm' => 'messages']))->out(false); ?>">Messages</a><?php endif; ?>
                <?php if ((int)($request->assignmentid ?? 0) > 0 && (int)$request->studentid > 0): ?>
                  <a class="pqtmr-btn pqtmr-btn--tiny" href="<?php echo (new moodle_url('/local/hubredirect/live_calendar.php', $requestcontextparams + ['childid' => (int)$request->studentid]))->out(false); ?>">Calendar</a>
                  <?php if ($studentworkspaceurl): ?><a class="pqtmr-btn pqtmr-btn--light pqtmr-btn--tiny" href="<?php echo $studentworkspaceurl->out(false); ?>">Student workspace</a><?php endif; ?>
                <?php endif; ?>
              </div>
            </article>
          <?php endforeach; ?>
        </div>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
