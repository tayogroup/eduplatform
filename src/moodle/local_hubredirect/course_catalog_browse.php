<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_offeringlib.php');
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || pqh_user_workspace_role((int)$USER->id, $workspaceid) === '') {
    pqh_access_denied(
        'This account is not linked to a teaching workspace with course offerings.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Course catalog unavailable'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$role = pqh_user_workspace_role((int)$USER->id, $workspaceid);
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$canrequestenrollment = in_array($role, ['student', 'parent'], true);
$students = pqco_workspace_students_for_user($workspaceid, (int)$USER->id);
$requeststudents = $canrequestenrollment ? $students : [];
$studentids = array_keys($requeststudents);
$ready = pqco_table_ready();
$message = '';
$error = '';
$catalog = pqh_course_catalog();
$financepolicyinfo = pqfin_workspace_finance_policy($workspaceid, $consumercontext);
$financepolicy = pqfin_normalize_policy($financepolicyinfo['policy']);
$showpricing = pqfin_pricing_visible_for_role($financepolicy, $role);
$coursefilter = pqh_normalize_course_key(optional_param('course', '', PARAM_ALPHANUMEXT));
if ($coursefilter !== '' && !isset($catalog[$coursefilter])) {
    $coursefilter = '';
}
$availableonly = optional_param('available_only', 0, PARAM_BOOL);

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/course_catalog_browse.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Course Catalog');
$PAGE->set_heading('Course Catalog');
$PAGE->add_body_class('pqcb-page');

function pqcb_filter_url_params(array $baseparams, string $coursefilter, bool $availableonly, array $extra = []): array {
    if ($coursefilter !== '') {
        $baseparams['course'] = $coursefilter;
    }
    if ($availableonly) {
        $baseparams['available_only'] = 1;
    }
    return array_merge($baseparams, $extra);
}

function pqcb_short_text(string $text, int $limit = 180): string {
    $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');
    if ($text === '') {
        return '';
    }
    return core_text::strlen($text) > $limit ? core_text::substr($text, 0, $limit) . '...' : $text;
}

function pqcb_detail_html(string $text): string {
    $text = trim($text);
    if ($text === '') {
        return '<span class="pqcb-muted">Not specified</span>';
    }
    $lines = array_values(array_filter(array_map(static function(string $line): string {
        return trim(preg_replace('/^[\-\*\x{2022}\d\.\)\s]+/u', '', $line) ?? '');
    }, preg_split('/\R+/', $text) ?: []), static fn(string $line): bool => $line !== ''));
    if (count($lines) > 1) {
        $items = array_map(static fn(string $line): string => '<li>' . s($line) . '</li>', $lines);
        return '<ul class="pqcb-detail-list">' . implode('', $items) . '</ul>';
    }
    return '<span class="pqcb-text">' . nl2br(s($text)) . '</span>';
}

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This enrollment request form expired. Please refresh and try again.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        if (!in_array($action, ['request_enrollment', 'cancel_request', 'request_drop'], true)) {
            throw new invalid_parameter_exception('Choose a valid course catalog action.');
        }
        if (!$canrequestenrollment) {
            throw new invalid_parameter_exception('Only students and parents can request or cancel course enrollment from the catalog.');
        }
        if ($action === 'cancel_request') {
            $requestid = optional_param('requestid', 0, PARAM_INT);
            $request = $DB->get_record('local_prequran_course_enrol_req', [
                'id' => $requestid,
                'workspaceid' => $workspaceid,
            ], '*', IGNORE_MISSING);
            if (!$request || !isset($requeststudents[(int)$request->studentid])) {
                throw new invalid_parameter_exception('Choose a valid enrollment request linked to this account.');
            }
            if ((string)$request->status !== 'pending') {
                throw new invalid_parameter_exception('Only pending enrollment requests can be cancelled.');
            }
            $request->status = 'cancelled';
            $request->timemodified = time();
            $DB->update_record('local_prequran_course_enrol_req', $request);
            pqco_course_audit('enrollment_request_cancelled', 'course_enrol_req', (int)$request->id, [
                'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$request->offeringid,
                'requestid' => (int)$request->id,
                'studentid' => (int)$request->studentid,
                'previous_status' => 'pending',
                'status' => 'cancelled',
            ]);
            $message = 'Enrollment request cancelled.';
        } else if ($action === 'request_drop') {
            $requestid = optional_param('requestid', 0, PARAM_INT);
            $request = $DB->get_record_sql(
                "SELECT r.*, o.title AS offering_title, o.course_key
                   FROM {local_prequran_course_enrol_req} r
                   JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
                  WHERE r.id = :requestid
                    AND r.workspaceid = :workspaceid",
                ['requestid' => $requestid, 'workspaceid' => $workspaceid],
                IGNORE_MISSING
            );
            if (!$request || !isset($requeststudents[(int)$request->studentid])) {
                throw new invalid_parameter_exception('Choose a valid enrollment linked to this account.');
            }
            if ((string)$request->status !== 'enrolled') {
                throw new invalid_parameter_exception('Only active enrollments can request a drop.');
            }
            $previousstatus = (string)$request->status;
            $request->status = 'drop_requested';
            $request->request_notes = trim(optional_param('request_notes', '', PARAM_TEXT));
            $request->timemodified = time();
            $DB->update_record('local_prequran_course_enrol_req', $request);
            pqco_course_audit('drop_requested', 'course_enrol_req', (int)$request->id, [
                'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$request->offeringid,
                'requestid' => (int)$request->id,
                'studentid' => (int)$request->studentid,
                'previous_status' => $previousstatus,
                'status' => 'drop_requested',
                'request_notes' => (string)$request->request_notes,
            ]);
            $student = core_user::get_user((int)$request->studentid);
            pqco_notify_workspace_admins(
                $workspaceid,
                'Course drop request received',
                ($student ? fullname($student) : 'Student #' . (int)$request->studentid) . ' requested to drop ' . (string)$request->offering_title . '.',
                new moodle_url('/local/hubredirect/course_offerings.php', $urlparams + ['request_status' => 'drop_requested']),
                'Review drop request',
                'course_drop_requested',
                [
                    'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                    'workspaceid' => $workspaceid,
                    'offeringid' => (int)$request->offeringid,
                    'requestid' => (int)$request->id,
                    'studentid' => (int)$request->studentid,
                ]
            );
            $message = 'Drop request sent for admin review.';
        } else {
        $offeringid = optional_param('offeringid', 0, PARAM_INT);
        $studentid = optional_param('studentid', 0, PARAM_INT);
        if (!isset($requeststudents[$studentid])) {
            throw new invalid_parameter_exception('Choose a student linked to this workspace account.');
        }
        $offering = $DB->get_record('local_prequran_course_offering', [
            'id' => $offeringid,
            'workspaceid' => $workspaceid,
            'status' => 'published',
        ], '*', IGNORE_MISSING);
        if (!$offering) {
            throw new invalid_parameter_exception('Choose a published course offering in this workspace.');
        }
        if (!pqco_offering_accepts_requests($offering)) {
            throw new invalid_parameter_exception('Enrollment has closed for this course offering.');
        }
        $counts = pqco_offering_counts([$offeringid]);
        if (pqco_open_seats($offering, $counts) <= 0) {
            throw new invalid_parameter_exception('This course offering has no open seats.');
        }
        $now = time();
        $existing = $DB->get_record('local_prequran_course_enrol_req', [
            'offeringid' => $offeringid,
            'studentid' => $studentid,
        ], '*', IGNORE_MISSING);
        $record = (object)[
            'offeringid' => $offeringid,
            'consumerid' => (int)($consumercontext->consumerid ?? 0),
            'workspaceid' => $workspaceid,
            'studentid' => $studentid,
            'requesterid' => (int)$USER->id,
            'requester_role' => $role,
            'status' => 'pending',
            'request_notes' => trim(optional_param('request_notes', '', PARAM_TEXT)),
            'admin_notes' => '',
            'approvedby' => 0,
            'approvedat' => 0,
            'moodleenrolledat' => 0,
            'droppedby' => 0,
            'droppedat' => 0,
            'timemodified' => $now,
        ];
        if ($existing) {
            if (in_array((string)$existing->status, ['pending', 'approved', 'enrolled', 'drop_requested'], true)) {
                throw new invalid_parameter_exception('This student already has an active request for that offering.');
            }
            $record->id = (int)$existing->id;
            $record->timecreated = (int)$existing->timecreated;
            $DB->update_record('local_prequran_course_enrol_req', $record);
        } else {
            $record->timecreated = $now;
            $record->id = (int)$DB->insert_record('local_prequran_course_enrol_req', $record);
        }
        pqco_course_audit('enrollment_requested', 'course_enrol_req', (int)$record->id, [
            'consumerid' => (int)($consumercontext->consumerid ?? 0),
            'workspaceid' => $workspaceid,
            'offeringid' => $offeringid,
            'requestid' => (int)$record->id,
            'studentid' => $studentid,
            'status' => 'pending',
            'request_notes' => (string)$record->request_notes,
        ]);
        pqco_notify_new_enrollment_request($record, $offering, $workspaceid, $urlparams);
        $message = 'Enrollment request sent for admin approval.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$offerings = [];
$counts = [];
$requestmap = [];
$myrequests = [];
if ($ready) {
    [$statussql, $statusparams] = $DB->get_in_or_equal(pqco_learner_visible_statuses(), SQL_PARAMS_QM);
    $where = ["workspaceid = ? AND status {$statussql}"];
    $params = array_merge([$workspaceid], $statusparams);
    if ($coursefilter !== '') {
        $where[] = 'course_key = ?';
        $params[] = $coursefilter;
    }
    $offerings = array_values($DB->get_records_select(
        'local_prequran_course_offering',
        implode(' AND ', $where),
        $params,
        'status ASC, startdate ASC, title ASC'
    ));
    $offeringids = array_map(static fn($offering): int => (int)$offering->id, $offerings);
    $counts = pqco_offering_counts($offeringids);
    if ($availableonly) {
        $offerings = array_values(array_filter($offerings, static function($offering) use ($counts): bool {
            return pqco_offering_accepts_requests($offering) && pqco_open_seats($offering, $counts) > 0;
        }));
        $offeringids = array_map(static fn($offering): int => (int)$offering->id, $offerings);
    }
    $requestmap = pqco_request_map_for_students($offeringids, $studentids);
    $myrequests = pqco_requests_for_students($workspaceid, $studentids);
}

echo $OUTPUT->header();
?>
<style>
body.pqcb-page header,body.pqcb-page footer,body.pqcb-page nav.navbar,body.pqcb-page #page-header,body.pqcb-page #page-footer,body.pqcb-page .drawer,body.pqcb-page .drawer-toggles,body.pqcb-page .block-region,body.pqcb-page [data-region="drawer"],body.pqcb-page [data-region="right-hand-drawer"]{display:none!important}
body.pqcb-page #page,body.pqcb-page #page-content,body.pqcb-page #region-main,body.pqcb-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqcb-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqcb-wrap{max-width:1180px;margin:0 auto}.pqcb-top,.pqcb-card,.pqcb-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqcb-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqcb-panel{margin-bottom:14px}.pqcb-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqcb-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqcb-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqcb-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqcb-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqcb-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pqcb-card h2,.pqcb-panel h2{margin:0;color:#221b22;font-size:22px;font-weight:950;line-height:1.15}.pqcb-meta{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.pqcb-pill{display:inline-flex;min-height:26px;align-items:center;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqcb-pill--ok{background:#edf9ef;color:#245c35}.pqcb-pill--warn{background:#fff4dc;color:#7a5637}.pqcb-text{color:#516879;font-size:14px;font-weight:750;line-height:1.5}.pqcb-detail{margin-top:10px;padding:11px;border-radius:8px;background:#fbfdff;border:1px solid rgba(23,48,68,.1)}.pqcb-detail strong{display:block;margin-bottom:4px;color:#6f4e32;font-size:12px;text-transform:uppercase}.pqcb-detail-list{margin:4px 0 0 18px;padding:0;color:#516879;font-size:14px;font-weight:750;line-height:1.5}.pqcb-field{display:grid;gap:5px;margin-top:10px}.pqcb-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqcb-select,.pqcb-input{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800}.pqcb-filter{display:grid;grid-template-columns:1fr auto auto auto;gap:10px;align-items:end;margin-bottom:14px}.pqcb-table{width:100%;border-collapse:separate;border-spacing:0;margin-top:10px}.pqcb-table th,.pqcb-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqcb-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqcb-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqcb-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800;line-height:1.4}.pqcb-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqcb-alert--ok{background:#edf9ef;color:#245c35}.pqcb-alert--bad{background:#fff0ed;color:#883526}.pqcb-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}.pqcb-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:flex-start;justify-content:center;padding:42px 18px;background:rgba(14,28,39,.62);overflow:auto}.pqcb-modal:target{display:flex}.pqcb-modal-box{width:min(760px,100%);padding:18px;border-radius:8px;background:#fff;box-shadow:0 20px 54px rgba(0,0,0,.22)}.pqcb-modal-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px}.pqcb-close{display:inline-flex;align-items:center;justify-content:center;min-width:38px;min-height:38px;border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-weight:950}
@media(max-width:900px){.pqcb-top{display:block}.pqcb-actions{justify-content:flex-start;margin-top:12px}.pqcb-grid,.pqcb-filter{grid-template-columns:1fr}}
<?php echo pqh_workspace_header_css(); ?>
</style>
<main class="pqcb-shell">
  <div class="pqcb-wrap">
    <section class="pqcb-top pqh-workspace-top">
      <div>
        <h1 class="pqcb-title pqh-workspace-title"><?php echo s($workspace->name); ?> Course Catalog</h1>
        <p class="pqcb-sub pqh-workspace-sub">Browse available institution course seats, dates, syllabus, prerequisites, and request enrollment.</p>
      </div>
      <nav class="pqcb-actions pqh-workspace-actions">
        <?php if ($canmanage): ?><a class="pqcb-btn pqcb-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams))->out(false); ?>">Manage offerings</a><?php endif; ?>
        <a class="pqcb-btn pqcb-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a>
        <a class="pqcb-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqcb-alert pqcb-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqcb-alert pqcb-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if (!$ready): ?>
      <section class="pqcb-panel"><div class="pqcb-empty">Course offering tables are not ready yet.</div></section>
    <?php else: ?>
      <form class="pqcb-panel pqcb-filter" method="get" aria-label="Course catalog filters">
        <?php foreach ($urlparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
        <div class="pqcb-field"><label>Course track</label><select class="pqcb-select" name="course">
          <option value="">All course tracks</option>
          <?php foreach ($catalog as $key => $course): ?><option value="<?php echo s($key); ?>"<?php echo $coursefilter === $key ? ' selected' : ''; ?>><?php echo s((string)$course['title']); ?></option><?php endforeach; ?>
        </select></div>
        <label class="pqcb-field"><span>Available only</span><select class="pqcb-select" name="available_only"><option value="0"<?php echo !$availableonly ? ' selected' : ''; ?>>Show all visible</option><option value="1"<?php echo $availableonly ? ' selected' : ''; ?>>Only open seats</option></select></label>
        <button class="pqcb-btn" type="submit">Filter</button>
        <a class="pqcb-btn pqcb-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_catalog_browse.php', $urlparams))->out(false); ?>">Clear</a>
      </form>
      <?php if (!$offerings): ?>
        <section class="pqcb-panel"><div class="pqcb-empty">No course offerings match these filters.</div></section>
      <?php else: ?>
      <?php if ($canrequestenrollment && !$requeststudents): ?>
        <section class="pqcb-panel"><div class="pqcb-empty">No student is linked to this account in this workspace yet.</div></section>
      <?php endif; ?>
      <?php if ($myrequests): ?>
        <section class="pqcb-panel" aria-label="Enrollment request status">
          <h2>Enrollment Request Status</h2>
          <table class="pqcb-table">
            <thead><tr><th>Student</th><th>Course</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
            <tbody>
              <?php foreach ($myrequests as $request): ?>
                <tr>
                  <td data-label="Student"><span class="pqcb-name"><?php echo s(fullname($request)); ?></span><span class="pqcb-muted"><?php echo s(pqh_account_no_label($request)); ?> / <?php echo s($request->email); ?></span></td>
                  <td data-label="Course"><span class="pqcb-name"><?php echo s((string)$request->offering_title); ?></span><span class="pqcb-muted"><?php echo s($catalog[(string)$request->course_key]['title'] ?? (string)$request->course_key); ?></span></td>
                  <td data-label="Status"><span class="pqcb-pill"><?php echo s(pqco_request_status_label((string)$request->status)); ?></span><?php if (trim((string)$request->admin_notes) !== ''): ?><span class="pqcb-muted"><?php echo s((string)$request->admin_notes); ?></span><?php endif; ?></td>
                  <td data-label="Updated"><?php echo s(userdate((int)$request->timemodified, get_string('strftimedatetimeshort'))); ?></td>
                  <td data-label="Actions">
                    <?php if ((string)$request->status === 'pending'): ?>
                      <form method="post">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="cancel_request">
                        <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
                        <button class="pqcb-btn pqcb-btn--light" type="submit">Cancel</button>
                      </form>
                    <?php elseif ((string)$request->status === 'enrolled' && pqco_user_has_moodle_offering_access((int)$request->studentid, (string)$request->course_key)): ?>
                      <a class="pqcb-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_launch.php', ['course' => (string)$request->course_key, 'studentid' => (int)$request->studentid]))->out(false); ?>">Open course</a>
                      <form method="post" style="margin-top:8px">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="request_drop">
                        <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
                        <button class="pqcb-btn pqcb-btn--light" type="submit">Request drop</button>
                      </form>
                    <?php elseif ((string)$request->status === 'approved'): ?>
                      <span class="pqcb-muted">Course access is pending Moodle sync.</span>
                    <?php else: ?>
                      <span class="pqcb-muted">No action needed</span>
                    <?php endif; ?>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </section>
      <?php endif; ?>
      <section class="pqcb-grid" aria-label="Available course offerings">
        <?php foreach ($offerings as $offering): ?>
          <?php
            $open = pqco_open_seats($offering, $counts);
            $availability = pqco_offering_availability_label($offering, $open);
            $canrequestoffering = pqco_offering_accepts_requests($offering) && $open > 0;
            $course = $catalog[(string)$offering->course_key] ?? null;
            $pricing = pqfin_offering_pricing_summary($offering, $financepolicy);
          ?>
          <article class="pqcb-card">
            <h2><?php echo s((string)$offering->title); ?></h2>
            <div class="pqcb-meta">
              <span class="pqcb-pill"><?php echo s($course ? (string)$course['title'] : (string)$offering->course_key); ?></span>
              <span class="pqcb-pill <?php echo $open > 0 ? 'pqcb-pill--ok' : 'pqcb-pill--warn'; ?>"><?php echo (int)$offering->capacity <= 0 ? 'Unlimited seats' : ((int)$open . ' seats open'); ?></span>
              <span class="pqcb-pill <?php echo $canrequestoffering ? 'pqcb-pill--ok' : 'pqcb-pill--warn'; ?>"><?php echo s($availability); ?></span>
              <?php if (trim((string)$offering->prerequisites) !== ''): ?><span class="pqcb-pill pqcb-pill--warn">Prerequisites</span><?php endif; ?>
              <?php if ((int)$offering->startdate > 0): ?><span class="pqcb-pill">Starts <?php echo s(userdate((int)$offering->startdate, get_string('strftimedate'))); ?></span><?php endif; ?>
              <?php if ((int)$offering->enddate > 0): ?><span class="pqcb-pill">Ends <?php echo s(userdate((int)$offering->enddate, get_string('strftimedate'))); ?></span><?php endif; ?>
              <?php if ($showpricing && $pricing['has_price']): ?><span class="pqcb-pill"><?php echo s($pricing['currency'] . ' ' . $pricing['total']); ?></span><?php endif; ?>
            </div>
            <?php if (trim((string)$offering->summary) !== ''): ?><p class="pqcb-text"><?php echo s(pqcb_short_text((string)$offering->summary)); ?></p><?php endif; ?>
            <?php if ($showpricing && $pricing['has_price']): ?>
              <div class="pqcb-detail"><strong>Tuition</strong><span class="pqcb-text"><?php echo s($pricing['currency'] . ' ' . $pricing['total']); ?><?php echo $pricing['installment_eligible'] ? ' / installments may be available' : ''; ?><?php echo $pricing['scholarship_eligible'] ? ' / scholarship eligible' : ''; ?></span></div>
            <?php endif; ?>
            <div class="pqcb-actions pqh-workspace-actions" style="justify-content:flex-start;margin-top:10px">
              <a class="pqcb-btn pqcb-btn--light" href="#course-detail-<?php echo (int)$offering->id; ?>">View details</a>
            </div>

            <?php if ($requeststudents): ?>
              <?php
                $hasrequestable = false;
                foreach ($requeststudents as $studentcheck) {
                    $existingrequest = $requestmap[(int)$offering->id . ':' . (int)$studentcheck->id] ?? null;
                    if (!$existingrequest || in_array((string)$existingrequest->status, ['rejected', 'cancelled', 'dropped'], true)) {
                        $hasrequestable = true;
                        break;
                    }
                }
              ?>
              <form method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="request_enrollment">
                <input type="hidden" name="offeringid" value="<?php echo (int)$offering->id; ?>">
                <div class="pqcb-field"><label>Student</label><select class="pqcb-select" name="studentid">
                  <?php foreach ($requeststudents as $student): ?>
                    <?php $request = $requestmap[(int)$offering->id . ':' . (int)$student->id] ?? null; ?>
                    <?php $disabled = $request && in_array((string)$request->status, ['pending', 'approved', 'enrolled', 'drop_requested'], true); ?>
                    <option value="<?php echo (int)$student->id; ?>" <?php echo $disabled ? 'disabled' : ''; ?>><?php echo s(fullname($student)); ?> - <?php echo s(pqh_account_no_label($student)); ?><?php echo $request ? ' - ' . s(pqco_request_status_label((string)$request->status)) : ''; ?></option>
                  <?php endforeach; ?>
                </select></div>
                <div class="pqcb-field"><label>Optional note</label><input class="pqcb-input" name="request_notes" placeholder="Schedule, placement, or parent note"></div>
                <div class="pqcb-actions pqh-workspace-actions" style="margin-top:10px">
                  <button class="pqcb-btn" type="submit" <?php echo !$canrequestoffering || !$hasrequestable ? 'disabled' : ''; ?>>Request enrollment</button>
                </div>
              </form>
            <?php elseif (!$canrequestenrollment): ?>
              <div class="pqcb-detail"><strong>Staff preview</strong><span class="pqcb-text"><?php echo $canmanage ? 'Use Manage offerings to publish changes or review requests.' : 'Enrollment requests are submitted by students or parents.'; ?></span></div>
            <?php endif; ?>
            <div class="pqcb-modal" id="course-detail-<?php echo (int)$offering->id; ?>" aria-label="Course details">
              <div class="pqcb-modal-box">
                <div class="pqcb-modal-head">
                  <div>
                    <h2><?php echo s((string)$offering->title); ?></h2>
                    <div class="pqcb-meta">
                      <span class="pqcb-pill"><?php echo s($course ? (string)$course['title'] : (string)$offering->course_key); ?></span>
                      <span class="pqcb-pill"><?php echo (int)$offering->capacity <= 0 ? 'Unlimited seats' : ((int)$open . ' seats open'); ?></span>
                      <span class="pqcb-pill"><?php echo s($availability); ?></span>
                    </div>
                  </div>
                  <a class="pqcb-close" href="#">Close</a>
                </div>
                <div class="pqcb-detail"><strong>Summary</strong><?php echo pqcb_detail_html((string)$offering->summary); ?></div>
                <div class="pqcb-detail"><strong>Syllabus</strong><?php echo pqcb_detail_html((string)$offering->syllabus); ?></div>
                <div class="pqcb-detail"><strong>Prerequisites</strong><?php echo pqcb_detail_html((string)$offering->prerequisites); ?></div>
                <?php if ($showpricing && $pricing['has_price']): ?>
                  <div class="pqcb-detail"><strong>Pricing</strong><span class="pqcb-text">Tuition <?php echo s((string)$pricing['tuition_amount']); ?>, registration <?php echo s((string)$pricing['registration_fee']); ?>, materials <?php echo s((string)$pricing['materials_fee']); ?>. Total <?php echo s($pricing['currency'] . ' ' . $pricing['total']); ?>.</span></div>
                  <?php if (trim((string)$pricing['refund_policy_label']) !== ''): ?><div class="pqcb-detail"><strong>Refund policy</strong><span class="pqcb-text"><?php echo s((string)$pricing['refund_policy_label']); ?></span></div><?php endif; ?>
                <?php endif; ?>
                <div class="pqcb-detail"><strong>Dates</strong><span class="pqcb-text"><?php echo (int)$offering->startdate > 0 ? s(userdate((int)$offering->startdate, get_string('strftimedate'))) : 'Start date not set'; ?> to <?php echo (int)$offering->enddate > 0 ? s(userdate((int)$offering->enddate, get_string('strftimedate'))) : 'End date not set'; ?></span></div>
              </div>
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
