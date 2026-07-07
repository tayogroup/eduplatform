<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_offeringlib.php');

pqh_require_platform_operations('Only platform administrators can view the platform course roster.');

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/platform_course_roster.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Platform Course Roster');
$PAGE->set_heading('Platform Course Roster');
$PAGE->add_body_class('pqpcr-page');

function pqpcr_ready(): bool {
    return pqh_table_exists_safe('local_prequran_course_offering')
        && pqh_table_exists_safe('local_prequran_course_enrol_req')
        && pqh_table_exists_safe('local_prequran_workspace');
}

function pqpcr_consumer_options(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_consumer')) {
        return [];
    }
    return array_values($DB->get_records_select(
        'local_prequran_consumer',
        "consumer_type <> ?",
        ['platform_foundation'],
        'name ASC',
        'id,name,slug,consumer_type,status'
    ));
}

function pqpcr_workspace_options(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace')) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_workspace', null, 'name ASC', 'id,name,slug,workspace_type,status'));
}

function pqpcr_date_label(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedate')) : 'Not set';
}

function pqpcr_short(string $value, int $limit = 140): string {
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    return core_text::strlen($value) > $limit ? core_text::substr($value, 0, $limit) . '...' : $value;
}

function pqpcr_status_class(string $status): string {
    return preg_replace('/[^a-z0-9_-]/i', '', strtolower($status !== '' ? $status : 'unknown'));
}

function pqpcr_fetch_rows(array $filters): array {
    global $DB;
    if (!pqpcr_ready()) {
        return [];
    }

    $where = ['1 = 1'];
    $params = [];
    if ((int)$filters['consumerid'] > 0) {
        $where[] = '(o.consumerid = :consumerid OR ci.id = :consumeridbyid OR cw.id = :consumeridbyworkspace)';
        $params['consumerid'] = (int)$filters['consumerid'];
        $params['consumeridbyid'] = (int)$filters['consumerid'];
        $params['consumeridbyworkspace'] = (int)$filters['consumerid'];
    }
    if ((int)$filters['workspaceid'] > 0) {
        $where[] = 'o.workspaceid = :workspaceid';
        $params['workspaceid'] = (int)$filters['workspaceid'];
    }
    if ((string)$filters['status'] !== '') {
        $where[] = 'o.status = :status';
        $params['status'] = (string)$filters['status'];
    }
    if ((string)$filters['visibility'] !== '') {
        $where[] = 'o.visibility = :visibility';
        $params['visibility'] = (string)$filters['visibility'];
    }
    $q = trim((string)$filters['q']);
    if ($q !== '') {
        $like = '%' . $DB->sql_like_escape($q) . '%';
        $parts = [
            $DB->sql_like('o.title', ':qtitle', false),
            $DB->sql_like('o.course_key', ':qkey', false),
            $DB->sql_like('w.name', ':qworkspace', false),
            $DB->sql_like('ci.name', ':qconsumerid', false),
            $DB->sql_like('cw.name', ':qconsumerworkspace', false),
            $DB->sql_like('mc.fullname', ':qmoodlefull', false),
            $DB->sql_like('mc.shortname', ':qmoodleshort', false),
        ];
        $params['qtitle'] = $like;
        $params['qkey'] = $like;
        $params['qworkspace'] = $like;
        $params['qconsumerid'] = $like;
        $params['qconsumerworkspace'] = $like;
        $params['qmoodlefull'] = $like;
        $params['qmoodleshort'] = $like;
        if (ctype_digit($q)) {
            $parts[] = 'o.id = :qofferingid';
            $parts[] = 'o.moodlecourseid = :qmoodleid';
            $params['qofferingid'] = (int)$q;
            $params['qmoodleid'] = (int)$q;
        }
        $where[] = '(' . implode(' OR ', $parts) . ')';
    }

    $sql = "SELECT o.id AS offeringid, o.consumerid AS offeringconsumerid, o.workspaceid, o.moodlecourseid,
                   o.course_key, o.title, o.summary, o.syllabus, o.prerequisites, o.startdate, o.enddate,
                   o.capacity, o.visibility, o.approval_mode, o.status, o.timemodified,
                   w.name AS workspacename, w.slug AS workspaceslug, w.workspace_type, w.status AS workspacestatus,
                   COALESCE(ci.id, cw.id, 0) AS consumerid,
                   COALESCE(ci.name, cw.name, '') AS consumername,
                   COALESCE(ci.slug, cw.slug, '') AS consumerslug,
                   COALESCE(ci.consumer_type, cw.consumer_type, '') AS consumer_type,
                   COALESCE(ci.status, cw.status, '') AS consumerstatus,
                   mc.fullname AS moodlefullname, mc.shortname AS moodleshortname, mc.visible AS moodlevisible,
                   cc.name AS moodlecategory,
                   COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) AS approvedcount,
                   COUNT(CASE WHEN r.status = 'pending' THEN 1 END) AS pendingcount,
                   COUNT(CASE WHEN r.status = 'drop_requested' THEN 1 END) AS droprequestedcount,
                   COUNT(CASE WHEN r.status = 'dropped' THEN 1 END) AS droppedcount,
                   COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) AS rejectedcount,
                   COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) AS cancelledcount,
                   COUNT(r.id) AS requestcount
              FROM {local_prequran_course_offering} o
         LEFT JOIN {local_prequran_workspace} w ON w.id = o.workspaceid
         LEFT JOIN {local_prequran_consumer} ci ON ci.id = o.consumerid
         LEFT JOIN {local_prequran_consumer} cw ON cw.primaryworkspaceid = o.workspaceid
         LEFT JOIN {course} mc ON mc.id = o.moodlecourseid
         LEFT JOIN {course_categories} cc ON cc.id = mc.category
         LEFT JOIN {local_prequran_course_enrol_req} r ON r.offeringid = o.id
             WHERE " . implode(' AND ', $where) . "
          GROUP BY o.id, o.consumerid, o.workspaceid, o.moodlecourseid, o.course_key, o.title, o.summary, o.syllabus,
                   o.prerequisites, o.startdate, o.enddate, o.capacity, o.visibility, o.approval_mode, o.status, o.timemodified,
                   w.name, w.slug, w.workspace_type, w.status,
                   ci.id, ci.name, ci.slug, ci.consumer_type, ci.status,
                   cw.id, cw.name, cw.slug, cw.consumer_type, cw.status,
                   mc.fullname, mc.shortname, mc.visible, cc.name
          ORDER BY consumername ASC, w.name ASC, o.status ASC, o.startdate ASC, o.title ASC, o.id ASC";
    return array_values($DB->get_records_sql($sql, $params, 0, 500));
}

function pqpcr_open_seats($row): string {
    $capacity = (int)($row->capacity ?? 0);
    if ($capacity <= 0) {
        return 'Unlimited';
    }
    $open = $capacity - (int)($row->approvedcount ?? 0);
    return $open <= 0 ? 'Full' : (string)$open;
}

function pqpcr_url_params(array $filters, array $extra = []): array {
    $params = [];
    foreach (['consumerid', 'workspaceid'] as $key) {
        if ((int)$filters[$key] > 0) {
            $params[$key] = (int)$filters[$key];
        }
    }
    foreach (['status', 'visibility', 'q'] as $key) {
        if ((string)$filters[$key] !== '') {
            $params[$key] = (string)$filters[$key];
        }
    }
    return array_merge($params, $extra);
}

$filters = [
    'consumerid' => optional_param('consumerid', 0, PARAM_INT),
    'workspaceid' => optional_param('workspaceid', 0, PARAM_INT),
    'status' => optional_param('status', '', PARAM_ALPHANUMEXT),
    'visibility' => optional_param('visibility', '', PARAM_ALPHANUMEXT),
    'q' => trim(optional_param('q', '', PARAM_TEXT)),
];
$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$consumers = pqpcr_consumer_options();
$workspaces = pqpcr_workspace_options();
$rows = pqpcr_fetch_rows($filters);

$stats = [
    'offerings' => count($rows),
    'published' => 0,
    'institutions' => [],
    'approved' => 0,
    'pending' => 0,
    'drop_requested' => 0,
    'dropped' => 0,
    'open' => 0,
];
foreach ($rows as $row) {
    if ((string)$row->status === 'published') {
        $stats['published']++;
    }
    if ((int)$row->workspaceid > 0) {
        $stats['institutions'][(int)$row->workspaceid] = true;
    }
    $stats['approved'] += (int)$row->approvedcount;
    $stats['pending'] += (int)$row->pendingcount;
    $stats['drop_requested'] += (int)$row->droprequestedcount;
    $stats['dropped'] += (int)$row->droppedcount;
    $open = pqpcr_open_seats($row);
    if (ctype_digit($open)) {
        $stats['open'] += (int)$open;
    }
}

if ($export === 'csv') {
    $filename = clean_filename('platform-course-roster-' . date('Ymd-His') . '.csv');
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, [
        'institution', 'workspaceid', 'consumer', 'offeringid', 'title', 'course_key', 'moodlecourseid',
        'moodle_course', 'moodle_shortname', 'moodle_category', 'status', 'visibility', 'approval_mode',
        'startdate', 'enddate', 'capacity', 'approved_or_enrolled', 'pending_requests', 'drop_requested', 'dropped', 'open_seats',
        'summary', 'syllabus', 'prerequisites', 'updated',
    ]);
    foreach ($rows as $row) {
        fputcsv($out, [
            (string)($row->workspacename ?? ''),
            (int)$row->workspaceid,
            (string)($row->consumername ?? ''),
            (int)$row->offeringid,
            (string)$row->title,
            (string)$row->course_key,
            (int)$row->moodlecourseid,
            (string)($row->moodlefullname ?? ''),
            (string)($row->moodleshortname ?? ''),
            (string)($row->moodlecategory ?? ''),
            (string)$row->status,
            (string)$row->visibility,
            (string)$row->approval_mode,
            pqpcr_date_label((int)$row->startdate),
            pqpcr_date_label((int)$row->enddate),
            (int)$row->capacity,
            (int)$row->approvedcount,
            (int)$row->pendingcount,
            (int)$row->droprequestedcount,
            (int)$row->droppedcount,
            pqpcr_open_seats($row),
            (string)$row->summary,
            (string)$row->syllabus,
            (string)$row->prerequisites,
            (int)$row->timemodified > 0 ? userdate((int)$row->timemodified, get_string('strftimedatetimeshort')) : '',
        ]);
    }
    fclose($out);
    exit;
}

echo $OUTPUT->header();
?>
<style>
body.pqpcr-page header,body.pqpcr-page footer,body.pqpcr-page nav.navbar,body.pqpcr-page #page-header,body.pqpcr-page #page-footer,body.pqpcr-page .drawer,body.pqpcr-page .drawer-toggles,body.pqpcr-page .block-region,body.pqpcr-page [data-region="drawer"],body.pqpcr-page [data-region="right-hand-drawer"]{display:none!important}
body.pqpcr-page #page,body.pqpcr-page #page-content,body.pqpcr-page #region-main,body.pqpcr-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqpcr-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqpcr-wrap{max-width:1360px;margin:0 auto}.pqpcr-top,.pqpcr-card,.pqpcr-panel,.pqpcr-filter{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqpcr-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#eaffea 0%,#fff 62%,#fff7e7 100%)}.pqpcr-title{margin:0;color:#221b22;font-size:31px;line-height:1.08;font-weight:950}.pqpcr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqpcr-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqpcr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:12px;font-weight:950;cursor:pointer}.pqpcr-btn--gold{background:#d6a642;border-color:#d6a642;color:#211b12!important}.pqpcr-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqpcr-card{padding:14px}.pqpcr-card strong{display:block;color:#221b22;font-size:28px;line-height:1;font-weight:950}.pqpcr-card span{display:block;margin-top:6px;color:#60707d;font-size:12px;font-weight:900;text-transform:uppercase}.pqpcr-filter{display:grid;grid-template-columns:1fr 1fr .7fr .8fr 1fr auto auto;gap:10px;align-items:end;padding:14px;margin-bottom:14px}.pqpcr-field{display:grid;gap:5px}.pqpcr-field label{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqpcr-input{width:100%;min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:850}.pqpcr-panel{padding:16px}.pqpcr-panel h2{margin:0 0 12px;color:#221b22;font-size:21px;font-weight:950}.pqpcr-table{width:100%;border-collapse:separate;border-spacing:0}.pqpcr-table th,.pqpcr-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqpcr-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqpcr-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqpcr-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800;line-height:1.4}.pqpcr-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqpcr-pill--published,.pqpcr-pill--active{background:#edf9ef;color:#245c35}.pqpcr-pill--draft,.pqpcr-pill--pending,.pqpcr-pill--drop_requested,.pqpcr-pill--workspace{background:#fff4dc;color:#7a5637}.pqpcr-pill--closed,.pqpcr-pill--archived,.pqpcr-pill--hidden,.pqpcr-pill--dropped{background:#fff0ed;color:#883526}.pqpcr-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}
@media(max-width:1180px){.pqpcr-top,.pqpcr-filter{grid-template-columns:1fr}.pqpcr-actions{justify-content:flex-start}.pqpcr-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.pqpcr-table{display:block;overflow-x:auto}}@media(max-width:560px){.pqpcr-stats{grid-template-columns:1fr}.pqpcr-title{font-size:26px}.pqpcr-btn{width:100%}}
</style>
<main class="pqpcr-shell">
  <div class="pqpcr-wrap">
    <section class="pqpcr-top">
      <div>
        <h1 class="pqpcr-title">Platform Course Roster</h1>
        <p class="pqpcr-sub">All institution course offerings, linked Moodle courses, seats, dates, visibility, and enrollment request status.</p>
      </div>
      <nav class="pqpcr-actions">
        <a class="pqpcr-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
        <a class="pqpcr-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_user_roster.php'))->out(false); ?>">User roster</a>
        <a class="pqpcr-btn pqpcr-btn--gold" href="<?php echo (new moodle_url('/local/hubredirect/platform_course_roster.php', pqpcr_url_params($filters, ['export' => 'csv'])))->out(false); ?>">Export CSV</a>
      </nav>
    </section>

    <section class="pqpcr-stats">
      <div class="pqpcr-card"><strong><?php echo (int)$stats['offerings']; ?></strong><span>offerings shown</span></div>
      <div class="pqpcr-card"><strong><?php echo (int)$stats['published']; ?></strong><span>published</span></div>
      <div class="pqpcr-card"><strong><?php echo count($stats['institutions']); ?></strong><span>institutions</span></div>
      <div class="pqpcr-card"><strong><?php echo (int)$stats['approved']; ?></strong><span>approved/enrolled</span></div>
      <div class="pqpcr-card"><strong><?php echo (int)$stats['pending']; ?></strong><span>pending requests</span></div>
      <div class="pqpcr-card"><strong><?php echo (int)$stats['drop_requested']; ?></strong><span>drop requests</span></div>
    </section>

    <form class="pqpcr-filter" method="get" aria-label="Course roster filters">
      <div class="pqpcr-field"><label>Institution / consumer</label><select class="pqpcr-input" name="consumerid"><option value="0">All consumers</option><?php foreach ($consumers as $consumer): ?><option value="<?php echo (int)$consumer->id; ?>" <?php echo (int)$consumer->id === (int)$filters['consumerid'] ? 'selected' : ''; ?>><?php echo s((string)$consumer->name); ?></option><?php endforeach; ?></select></div>
      <div class="pqpcr-field"><label>Workspace</label><select class="pqpcr-input" name="workspaceid"><option value="0">All workspaces</option><?php foreach ($workspaces as $workspace): ?><option value="<?php echo (int)$workspace->id; ?>" <?php echo (int)$workspace->id === (int)$filters['workspaceid'] ? 'selected' : ''; ?>><?php echo s((string)$workspace->name); ?> #<?php echo (int)$workspace->id; ?></option><?php endforeach; ?></select></div>
      <div class="pqpcr-field"><label>Status</label><select class="pqpcr-input" name="status"><option value="">All statuses</option><?php foreach (pqco_status_options() as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo (string)$filters['status'] === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
      <div class="pqpcr-field"><label>Visibility</label><select class="pqpcr-input" name="visibility"><option value="">All visibility</option><?php foreach (pqco_visibility_options() as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo (string)$filters['visibility'] === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
      <div class="pqpcr-field"><label>Search</label><input class="pqpcr-input" name="q" value="<?php echo s((string)$filters['q']); ?>" placeholder="Title, Moodle course, institution, ID"></div>
      <button class="pqpcr-btn pqpcr-btn--gold" type="submit">Apply</button>
      <a class="pqpcr-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_course_roster.php'))->out(false); ?>">Clear</a>
    </form>

    <section class="pqpcr-panel">
      <h2>Course Listings</h2>
      <?php if (!pqpcr_ready()): ?>
        <div class="pqpcr-empty">Course offering schema is not ready yet. Run the local_prequran Moodle upgrade first.</div>
      <?php elseif (!$rows): ?>
        <div class="pqpcr-empty">No course offerings match these filters.</div>
      <?php else: ?>
        <table class="pqpcr-table">
          <thead><tr><th>Institution</th><th>Offering</th><th>Moodle Course</th><th>Dates</th><th>Seats</th><th>Status</th><th>Requests</th><th>Actions</th></tr></thead>
          <tbody>
            <?php foreach ($rows as $row): ?>
              <?php
              $workspaceparams = ['workspaceid' => (int)$row->workspaceid];
              if (trim((string)($row->consumerslug ?? '')) !== '') {
                  $workspaceparams['consumer'] = (string)$row->consumerslug;
              }
              $moodlestatus = (int)($row->moodlevisible ?? 0) === 1 ? 'visible' : 'hidden';
              ?>
              <tr>
                <td data-label="Institution">
                  <span class="pqpcr-name"><?php echo s((string)($row->workspacename ?: 'Workspace #' . (int)$row->workspaceid)); ?></span>
                  <span class="pqpcr-muted"><?php echo s((string)($row->consumername ?: 'No consumer linked')); ?><?php echo (int)$row->workspaceid > 0 ? ' / workspace #' . (int)$row->workspaceid : ''; ?></span>
                </td>
                <td data-label="Offering">
                  <span class="pqpcr-name"><?php echo s((string)$row->title); ?></span>
                  <span class="pqpcr-muted">Offering #<?php echo (int)$row->offeringid; ?> / <?php echo s((string)$row->course_key); ?></span>
                  <?php if (trim((string)$row->summary) !== ''): ?><span class="pqpcr-muted"><?php echo s(pqpcr_short((string)$row->summary)); ?></span><?php endif; ?>
                </td>
                <td data-label="Moodle Course">
                  <span class="pqpcr-name"><?php echo (int)$row->moodlecourseid > 0 ? s((string)($row->moodlefullname ?: 'Course #' . (int)$row->moodlecourseid)) : 'Not linked'; ?></span>
                  <span class="pqpcr-muted"><?php echo (int)$row->moodlecourseid > 0 ? 'Moodle #' . (int)$row->moodlecourseid . ' / ' . s((string)$row->moodleshortname) : 'Approval sync unavailable until linked'; ?></span>
                  <?php if (trim((string)($row->moodlecategory ?? '')) !== ''): ?><span class="pqpcr-muted"><?php echo s((string)$row->moodlecategory); ?></span><?php endif; ?>
                </td>
                <td data-label="Dates"><?php echo s(pqpcr_date_label((int)$row->startdate)); ?><span class="pqpcr-muted">to <?php echo s(pqpcr_date_label((int)$row->enddate)); ?></span></td>
                <td data-label="Seats"><span class="pqpcr-pill"><?php echo (int)$row->capacity <= 0 ? 'Unlimited capacity' : ((int)$row->capacity . ' capacity'); ?></span><span class="pqpcr-pill"><?php echo (int)$row->approvedcount; ?> approved</span><span class="pqpcr-pill"><?php echo s(pqpcr_open_seats($row)); ?> open</span></td>
                <td data-label="Status"><span class="pqpcr-pill pqpcr-pill--<?php echo s(pqpcr_status_class((string)$row->status)); ?>"><?php echo s((string)$row->status); ?></span><span class="pqpcr-pill pqpcr-pill--<?php echo s(pqpcr_status_class((string)$row->visibility)); ?>"><?php echo s((string)$row->visibility); ?></span><span class="pqpcr-pill pqpcr-pill--<?php echo s($moodlestatus); ?>">Moodle <?php echo s($moodlestatus); ?></span></td>
                <td data-label="Requests"><span class="pqpcr-pill"><?php echo (int)$row->pendingcount; ?> pending</span><span class="pqpcr-pill pqpcr-pill--drop_requested"><?php echo (int)$row->droprequestedcount; ?> drop requested</span><span class="pqpcr-pill pqpcr-pill--dropped"><?php echo (int)$row->droppedcount; ?> dropped</span><span class="pqpcr-pill"><?php echo (int)$row->requestcount; ?> total</span></td>
                <td data-label="Actions">
                  <?php if ((int)$row->workspaceid > 0): ?>
                    <a class="pqpcr-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $workspaceparams + ['editid' => (int)$row->offeringid]))->out(false); ?>">Manage</a>
                    <a class="pqpcr-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_catalog_browse.php', $workspaceparams))->out(false); ?>">Catalog</a>
                  <?php else: ?>
                    <span class="pqpcr-muted">No workspace link</span>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
