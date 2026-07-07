<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

pqh_require_platform_operations('Only platform administrators can view the platform user roster.');

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/platform_user_roster.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Platform User Roster');
$PAGE->set_heading('Platform User Roster');
$PAGE->add_body_class('pqpur-page');

function pqpur_consumer_type_label(string $type): string {
    $labels = [
        'platform_foundation' => 'Foundation',
        'academy_consumer' => 'Academy',
        'institution' => 'Institution',
        'marketplace' => 'Marketplace',
        'teacher_workspace' => 'Independent teacher',
    ];
    return $labels[$type] ?? ucwords(str_replace('_', ' ', $type !== '' ? $type : 'consumer'));
}

function pqpur_role_label(string $role): string {
    $roles = pqh_workspace_roles();
    if (isset($roles[$role])) {
        return $roles[$role];
    }
    if ($role === 'independent_teacher') {
        return 'Independent teacher';
    }
    return ucwords(str_replace('_', ' ', $role !== '' ? $role : 'user'));
}

function pqpur_status_class(string $status): string {
    return preg_replace('/[^a-z0-9_-]/i', '', strtolower($status !== '' ? $status : 'unknown'));
}

function pqpur_short_list(array $items, int $limit = 4): string {
    $items = array_values(array_unique(array_filter(array_map('trim', $items))));
    if (!$items) {
        return '';
    }
    if (count($items) <= $limit) {
        return implode(', ', $items);
    }
    return implode(', ', array_slice($items, 0, $limit)) . ' +' . (count($items) - $limit) . ' more';
}

function pqpur_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_workspace')
        && pqh_table_exists_safe('local_prequran_workspace_member')
        && pqh_table_exists_safe('local_prequran_consumer');
}

function pqpur_consumer_options(): array {
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

function pqpur_workspace_options(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace')) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_workspace', null, 'name ASC', 'id,name,slug,workspace_type,status'));
}

function pqpur_fetch_member_rows(array $filters): array {
    global $DB;
    if (!pqpur_schema_ready()) {
        return [];
    }

    $where = ['u.deleted = 0'];
    $params = [];
    if ((int)$filters['consumerid'] > 0) {
        $where[] = 'c.id = :consumerid';
        $params['consumerid'] = (int)$filters['consumerid'];
    }
    if ((int)$filters['workspaceid'] > 0) {
        $where[] = 'wm.workspaceid = :workspaceid';
        $params['workspaceid'] = (int)$filters['workspaceid'];
    }
    if ((string)$filters['role'] !== '') {
        $where[] = 'wm.workspace_role = :role';
        $params['role'] = (string)$filters['role'];
    }
    if ((string)$filters['status'] !== '') {
        $where[] = 'wm.status = :memberstatus';
        $params['memberstatus'] = (string)$filters['status'];
    }
    $q = trim((string)$filters['q']);
    if ($q !== '') {
        $like = '%' . $DB->sql_like_escape($q) . '%';
        $searchparts = [
            $DB->sql_like('u.firstname', ':qfirst', false),
            $DB->sql_like('u.lastname', ':qlast', false),
            $DB->sql_like('u.email', ':qemail', false),
            $DB->sql_like('u.username', ':qusername', false),
            $DB->sql_like('c.name', ':qconsumer', false),
            $DB->sql_like('w.name', ':qworkspace', false),
        ];
        $params['qfirst'] = $like;
        $params['qlast'] = $like;
        $params['qemail'] = $like;
        $params['qusername'] = $like;
        $params['qconsumer'] = $like;
        $params['qworkspace'] = $like;
        if (ctype_digit($q)) {
            $searchparts[] = 'u.id = :quserid';
            $params['quserid'] = (int)$q;
        }
        $where[] = '(' . implode(' OR ', $searchparts) . ')';
    }

    $sql = "SELECT wm.id AS rosterid, wm.workspaceid, wm.userid, wm.workspace_role AS rosterrole,
                   wm.status AS rosterstatus, wm.timemodified AS rosterupdated,
                   u.firstname, u.lastname, u.email, u.username, u.idnumber,
                   w.name AS workspacename, w.slug AS workspaceslug, w.workspace_type, w.status AS workspacestatus,
                   c.id AS consumerid, c.name AS consumername, c.slug AS consumerslug, c.consumer_type, c.status AS consumerstatus
              FROM {local_prequran_workspace_member} wm
              JOIN {user} u ON u.id = wm.userid
         LEFT JOIN {local_prequran_workspace} w ON w.id = wm.workspaceid
         LEFT JOIN {local_prequran_consumer} c ON c.primaryworkspaceid = w.id
             WHERE " . implode(' AND ', $where) . "
          ORDER BY c.name ASC, w.name ASC,
                   CASE wm.workspace_role
                    WHEN 'owner' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'coordinator' THEN 3
                    WHEN 'teacher' THEN 4
                    WHEN 'assistant_teacher' THEN 5
                    WHEN 'parent' THEN 6
                    WHEN 'student' THEN 7
                    ELSE 8 END,
                   u.lastname ASC, u.firstname ASC, u.id ASC";
    return array_values($DB->get_records_sql($sql, $params));
}

function pqpur_fetch_independent_teacher_rows(array $filters, array $existinguserids): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_teacher_profile')) {
        return [];
    }

    $hasconsumer = pqh_table_has_field_safe('local_prequran_teacher_profile', 'consumerid');
    $hasworkspace = pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid');
    $where = ['u.deleted = 0'];
    $params = [];
    if ($existinguserids) {
        [$notinsql, $notinparams] = $DB->get_in_or_equal($existinguserids, SQL_PARAMS_NAMED, 'knownuser', false);
        $where[] = 'tp.userid ' . $notinsql;
        $params += $notinparams;
    }
    if ((int)$filters['consumerid'] > 0 && $hasconsumer) {
        $where[] = 'tp.consumerid = :tpconsumerid';
        $params['tpconsumerid'] = (int)$filters['consumerid'];
    } else if ((int)$filters['consumerid'] > 0 && !$hasconsumer) {
        return [];
    }
    if ((int)$filters['workspaceid'] > 0 && $hasworkspace) {
        $where[] = 'tp.workspaceid = :tpworkspaceid';
        $params['tpworkspaceid'] = (int)$filters['workspaceid'];
    } else if ((int)$filters['workspaceid'] > 0 && !$hasworkspace) {
        return [];
    }
    if ((string)$filters['role'] !== '' && (string)$filters['role'] !== 'independent_teacher') {
        return [];
    }
    if ((string)$filters['status'] !== '') {
        $where[] = 'tp.status = :tpstatus';
        $params['tpstatus'] = (string)$filters['status'];
    }
    $q = trim((string)$filters['q']);
    if ($q !== '') {
        $like = '%' . $DB->sql_like_escape($q) . '%';
        $searchparts = [
            $DB->sql_like('u.firstname', ':tqfirst', false),
            $DB->sql_like('u.lastname', ':tqlast', false),
            $DB->sql_like('u.email', ':tqemail', false),
            $DB->sql_like('u.username', ':tqusername', false),
            $DB->sql_like('tp.teacher_display_name', ':tqdisplay', false),
        ];
        $params['tqfirst'] = $like;
        $params['tqlast'] = $like;
        $params['tqemail'] = $like;
        $params['tqusername'] = $like;
        $params['tqdisplay'] = $like;
        if (ctype_digit($q)) {
            $searchparts[] = 'u.id = :tquserid';
            $params['tquserid'] = (int)$q;
        }
        $where[] = '(' . implode(' OR ', $searchparts) . ')';
    }

    $consumerfield = $hasconsumer ? 'tp.consumerid' : '0';
    $workspacefield = $hasworkspace ? 'tp.workspaceid' : '0';
    $consumerjoin = $hasconsumer ? 'LEFT JOIN {local_prequran_consumer} c ON c.id = tp.consumerid' : 'LEFT JOIN {local_prequran_consumer} c ON 1 = 0';
    $workspacejoin = $hasworkspace ? 'LEFT JOIN {local_prequran_workspace} w ON w.id = tp.workspaceid' : 'LEFT JOIN {local_prequran_workspace} w ON 1 = 0';

    $sql = "SELECT tp.id AS rosterid, {$workspacefield} AS workspaceid, tp.userid,
                   'independent_teacher' AS rosterrole, tp.status AS rosterstatus, tp.timemodified AS rosterupdated,
                   u.firstname, u.lastname, u.email, u.username, u.idnumber,
                   w.name AS workspacename, w.slug AS workspaceslug, w.workspace_type, w.status AS workspacestatus,
                   {$consumerfield} AS consumerid, c.name AS consumername, c.slug AS consumerslug, c.consumer_type, c.status AS consumerstatus
              FROM {local_prequran_teacher_profile} tp
              JOIN {user} u ON u.id = tp.userid
              {$consumerjoin}
              {$workspacejoin}
             WHERE " . implode(' AND ', $where) . "
          ORDER BY c.name ASC, tp.teacher_display_name ASC, u.lastname ASC, u.firstname ASC";
    return array_values($DB->get_records_sql($sql, $params));
}

function pqpur_moodle_courses_by_user(array $userids): array {
    global $DB;
    if (!$userids) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'muser');
    $params['siteid'] = SITEID;
    $rows = $DB->get_records_sql(
        "SELECT ue.id AS rowkey, ue.userid, c.id AS courseid,
                c.fullname, c.shortname, c.visible, ue.status AS enrolstatus
           FROM {user_enrolments} ue
           JOIN {enrol} e ON e.id = ue.enrolid
           JOIN {course} c ON c.id = e.courseid
          WHERE ue.userid {$insql}
            AND c.id <> :siteid
       ORDER BY c.fullname ASC",
        $params
    );
    $byuser = [];
    foreach ($rows as $row) {
        $label = trim((string)$row->fullname) !== '' ? (string)$row->fullname : (string)$row->shortname;
        if (!(int)$row->visible) {
            $label .= ' (hidden)';
        }
        if ((int)$row->enrolstatus !== 0) {
            $label .= ' (suspended)';
        }
        $byuser[(int)$row->userid][] = $label;
    }
    return $byuser;
}

function pqpur_offerings_by_user(array $userids): array {
    global $DB;
    if (!$userids || !pqh_table_exists_safe('local_prequran_course_offering') || !pqh_table_exists_safe('local_prequran_course_enrol_req')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'ouser');
    $rows = $DB->get_records_sql(
        "SELECT r.id, r.studentid AS userid, r.status, r.workspaceid, o.title, o.course_key
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
          WHERE r.studentid {$insql}
       ORDER BY r.timemodified DESC, r.id DESC",
        $params
    );
    $byuser = [];
    foreach ($rows as $row) {
        $userid = (int)$row->userid;
        $status = (string)$row->status;
        $title = trim((string)$row->title) !== '' ? (string)$row->title : (string)$row->course_key;
        $byuser[$userid]['all'][] = $title . ' (' . $status . ')';
        if (in_array($status, ['approved', 'enrolled'], true)) {
            $byuser[$userid]['active'][] = $title;
        } else if ($status === 'pending') {
            $byuser[$userid]['pending'][] = $title;
        }
    }
    return $byuser;
}

function pqpur_assignment_counts(array $userids): array {
    global $DB;
    if (!$userids || !pqh_table_exists_safe('local_prequran_teacher_student')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'auser');
    $params['status'] = 'active';
    $teacherrows = $DB->get_records_sql(
        "SELECT teacherid AS userid, COUNT(1) AS total
           FROM {local_prequran_teacher_student}
          WHERE status = :status AND teacherid {$insql}
       GROUP BY teacherid",
        $params
    );
    [$studentinsql, $studentparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'suser');
    $studentparams['status'] = 'active';
    $studentrows = $DB->get_records_sql(
        "SELECT studentid AS userid, COUNT(1) AS total
           FROM {local_prequran_teacher_student}
          WHERE status = :status AND studentid {$studentinsql}
       GROUP BY studentid",
        $studentparams
    );
    $counts = [];
    foreach ($teacherrows as $row) {
        $counts[(int)$row->userid]['students'] = (int)$row->total;
    }
    foreach ($studentrows as $row) {
        $counts[(int)$row->userid]['teachers'] = (int)$row->total;
    }
    return $counts;
}

function pqpur_build_rows(array $filters): array {
    $rows = pqpur_fetch_member_rows($filters);
    $knownuserids = [];
    foreach ($rows as $row) {
        $knownuserids[(int)$row->userid] = (int)$row->userid;
    }
    foreach (pqpur_fetch_independent_teacher_rows($filters, array_values($knownuserids)) as $row) {
        $rows[] = $row;
        $knownuserids[(int)$row->userid] = (int)$row->userid;
    }

    $userids = array_values($knownuserids);
    $moodlecourses = pqpur_moodle_courses_by_user($userids);
    $offerings = pqpur_offerings_by_user($userids);
    $assignments = pqpur_assignment_counts($userids);
    foreach ($rows as $row) {
        $userid = (int)$row->userid;
        $row->fullname = fullname($row);
        $row->moodlecourses = $moodlecourses[$userid] ?? [];
        $row->offeringactive = $offerings[$userid]['active'] ?? [];
        $row->offeringpending = $offerings[$userid]['pending'] ?? [];
        $row->offeringall = $offerings[$userid]['all'] ?? [];
        $row->assignedstudents = (int)($assignments[$userid]['students'] ?? 0);
        $row->assignedteachers = (int)($assignments[$userid]['teachers'] ?? 0);
    }
    return $rows;
}

function pqpur_emit_csv(array $rows): void {
    $filename = 'platform-user-roster-' . date('Ymd-His') . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo "\xEF\xBB\xBF";
    $out = fopen('php://output', 'w');
    fputcsv($out, [
        'consumer_id', 'consumer', 'consumer_type', 'workspace_id', 'workspace',
        'workspace_type', 'role', 'member_status', 'userid', 'name', 'username',
        'email', 'account_no', 'moodle_courses', 'course_offerings', 'pending_offerings',
        'assigned_students', 'assigned_teachers', 'last_updated',
    ]);
    foreach ($rows as $row) {
        fputcsv($out, [
            (int)($row->consumerid ?? 0),
            (string)($row->consumername ?? ''),
            pqpur_consumer_type_label((string)($row->consumer_type ?? '')),
            (int)($row->workspaceid ?? 0),
            (string)($row->workspacename ?? ''),
            (string)($row->workspace_type ?? ''),
            pqpur_role_label((string)$row->rosterrole),
            (string)$row->rosterstatus,
            (int)$row->userid,
            (string)$row->fullname,
            (string)$row->username,
            (string)$row->email,
            pqh_account_no_value($row),
            implode('; ', (array)$row->moodlecourses),
            implode('; ', (array)$row->offeringall),
            implode('; ', (array)$row->offeringpending),
            (int)$row->assignedstudents,
            (int)$row->assignedteachers,
            (int)$row->rosterupdated > 0 ? userdate((int)$row->rosterupdated) : '',
        ]);
    }
    fclose($out);
    exit;
}

$filters = [
    'consumerid' => optional_param('consumerid', 0, PARAM_INT),
    'workspaceid' => optional_param('workspaceid', 0, PARAM_INT),
    'role' => optional_param('role', '', PARAM_ALPHANUMEXT),
    'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
    'q' => optional_param('q', '', PARAM_TEXT),
];
$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$rows = pqpur_build_rows($filters);
if ($export === 'csv') {
    pqpur_emit_csv($rows);
}

$consumers = pqpur_consumer_options();
$workspaces = pqpur_workspace_options();
$roles = ['' => 'All roles', 'independent_teacher' => 'Independent teacher'] + pqh_workspace_roles();
$statuses = ['' => 'All statuses', 'active' => 'Active', 'inactive' => 'Inactive', 'archived' => 'Archived'];
$stats = [
    'rows' => count($rows),
    'users' => count(array_unique(array_map(static fn($row): int => (int)$row->userid, $rows))),
    'consumers' => count(array_unique(array_filter(array_map(static fn($row): int => (int)($row->consumerid ?? 0), $rows)))),
    'workspaces' => count(array_unique(array_filter(array_map(static fn($row): int => (int)($row->workspaceid ?? 0), $rows)))),
];
$baseparams = array_filter($filters, static fn($value) => $value !== '' && $value !== 0);
$csvurl = new moodle_url('/local/hubredirect/platform_user_roster.php', $baseparams + ['export' => 'csv']);

echo $OUTPUT->header();
?>
<style>
body.pqpur-page header,body.pqpur-page footer,body.pqpur-page nav.navbar,body.pqpur-page #page-header,body.pqpur-page #page-footer,body.pqpur-page .drawer,body.pqpur-page .drawer-toggles,body.pqpur-page .block-region,body.pqpur-page [data-region="drawer"],body.pqpur-page [data-region="right-hand-drawer"]{display:none!important}
body.pqpur-page #page,body.pqpur-page #page-content,body.pqpur-page #region-main,body.pqpur-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqpur-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqpur-wrap{max-width:1380px;margin:0 auto}.pqpur-top,.pqpur-card,.pqpur-panel{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqpur-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#eaffea 0%,#fff 62%,#fff7e7 100%)}.pqpur-mark{display:grid;place-items:center;width:46px;height:46px;border-radius:12px;background:#2f6f4e;color:#fff;font-weight:950}.pqpur-brand{display:flex;align-items:center;gap:12px}.pqpur-title{margin:0;color:#221b22;font-size:32px;line-height:1.05;font-weight:950}.pqpur-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqpur-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqpur-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:12px;font-weight:950}.pqpur-btn--gold{background:#d6a642;border-color:#d6a642;color:#211b12!important}.pqpur-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}.pqpur-card{padding:15px}.pqpur-num{display:block;color:#221b22;font-size:30px;line-height:1;font-weight:950}.pqpur-label{display:block;margin-top:6px;color:#60707d;font-size:12px;font-weight:900;text-transform:uppercase}.pqpur-panel{padding:16px;margin-bottom:14px}.pqpur-filters{display:grid;grid-template-columns:1.2fr 1.2fr .8fr .8fr 1fr auto;gap:10px;align-items:end}.pqpur-field label{display:block;margin-bottom:5px;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqpur-input,.pqpur-select{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fff;color:#173044;font-size:13px;font-weight:800;padding:0 10px}.pqpur-tablewrap{overflow:auto;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fff}.pqpur-table{width:100%;border-collapse:collapse;min-width:1180px}.pqpur-table th,.pqpur-table td{padding:11px 10px;border-bottom:1px solid rgba(23,48,68,.09);vertical-align:top;text-align:left;font-size:13px}.pqpur-table th{background:#f2f6f8;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqpur-table tr:last-child td{border-bottom:0}.pqpur-name{display:block;color:#221b22;font-weight:950}.pqpur-meta{display:block;margin-top:3px;color:#667886;font-size:12px;font-weight:750}.pqpur-pill{display:inline-flex;align-items:center;min-height:24px;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:11px;font-weight:950}.pqpur-pill--active,.pqpur-pill--approved,.pqpur-pill--enrolled{background:#eaf8ed;color:#2d6339}.pqpur-pill--inactive,.pqpur-pill--pending,.pqpur-pill--draft{background:#fff4d9;color:#6d4d21}.pqpur-pill--archived,.pqpur-pill--rejected,.pqpur-pill--cancelled{background:#fff0ed;color:#883526}.pqpur-list{max-width:290px;color:#30495c;font-size:12px;font-weight:780;line-height:1.35}.pqpur-empty{padding:16px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}
@media(max-width:1100px){.pqpur-top,.pqpur-filters{grid-template-columns:1fr}.pqpur-actions{justify-content:flex-start}.pqpur-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.pqpur-stats{grid-template-columns:1fr}.pqpur-title{font-size:26px}}
</style>
<main class="pqpur-shell">
  <div class="pqpur-wrap">
    <section class="pqpur-top">
      <div class="pqpur-brand">
        <span class="pqpur-mark">UR</span>
        <div>
          <h1 class="pqpur-title">Platform User Roster</h1>
          <p class="pqpur-sub">Users by institution, independent teacher workspace, role, Moodle courses, course offerings, and assignment activity.</p>
        </div>
      </div>
      <nav class="pqpur-actions">
        <a class="pqpur-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
        <a class="pqpur-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_consumers.php'))->out(false); ?>">Consumers</a>
        <a class="pqpur-btn pqpur-btn--gold" href="<?php echo $csvurl->out(false); ?>">Export CSV</a>
      </nav>
    </section>

    <section class="pqpur-stats" aria-label="Roster summary">
      <div class="pqpur-card"><span class="pqpur-num"><?php echo (int)$stats['rows']; ?></span><span class="pqpur-label">roster rows</span></div>
      <div class="pqpur-card"><span class="pqpur-num"><?php echo (int)$stats['users']; ?></span><span class="pqpur-label">unique users</span></div>
      <div class="pqpur-card"><span class="pqpur-num"><?php echo (int)$stats['consumers']; ?></span><span class="pqpur-label">consumers</span></div>
      <div class="pqpur-card"><span class="pqpur-num"><?php echo (int)$stats['workspaces']; ?></span><span class="pqpur-label">workspaces</span></div>
    </section>

    <section class="pqpur-panel">
      <form class="pqpur-filters" method="get">
        <div class="pqpur-field">
          <label for="pqpur-consumer">Institution / consumer</label>
          <select class="pqpur-select" id="pqpur-consumer" name="consumerid">
            <option value="0">All institutions and teacher workspaces</option>
            <?php foreach ($consumers as $consumer): ?>
              <option value="<?php echo (int)$consumer->id; ?>"<?php echo (int)$filters['consumerid'] === (int)$consumer->id ? ' selected' : ''; ?>>
                <?php echo s((string)$consumer->name . ' - ' . pqpur_consumer_type_label((string)$consumer->consumer_type)); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="pqpur-field">
          <label for="pqpur-workspace">Workspace</label>
          <select class="pqpur-select" id="pqpur-workspace" name="workspaceid">
            <option value="0">All workspaces</option>
            <?php foreach ($workspaces as $workspace): ?>
              <option value="<?php echo (int)$workspace->id; ?>"<?php echo (int)$filters['workspaceid'] === (int)$workspace->id ? ' selected' : ''; ?>>
                <?php echo s((string)$workspace->name . ' #' . (int)$workspace->id); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="pqpur-field">
          <label for="pqpur-role">Role</label>
          <select class="pqpur-select" id="pqpur-role" name="role">
            <?php foreach ($roles as $key => $label): ?>
              <option value="<?php echo s((string)$key); ?>"<?php echo (string)$filters['role'] === (string)$key ? ' selected' : ''; ?>><?php echo s((string)$label); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="pqpur-field">
          <label for="pqpur-status">Status</label>
          <select class="pqpur-select" id="pqpur-status" name="status">
            <?php foreach ($statuses as $key => $label): ?>
              <option value="<?php echo s((string)$key); ?>"<?php echo (string)$filters['status'] === (string)$key ? ' selected' : ''; ?>><?php echo s((string)$label); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="pqpur-field">
          <label for="pqpur-q">Search</label>
          <input class="pqpur-input" id="pqpur-q" name="q" value="<?php echo s((string)$filters['q']); ?>" placeholder="Name, email, user ID">
        </div>
        <button class="pqpur-btn pqpur-btn--gold" type="submit">Apply</button>
      </form>
    </section>

    <section class="pqpur-panel">
      <?php if (!pqpur_schema_ready()): ?>
        <div class="pqpur-empty">Workspace or consumer schema is not ready yet. Run the local_prequran Moodle upgrade, then reopen this report.</div>
      <?php elseif (!$rows): ?>
        <div class="pqpur-empty">No users match the current filters.</div>
      <?php else: ?>
        <div class="pqpur-tablewrap">
          <table class="pqpur-table">
            <thead>
              <tr>
                <th>Institution / workspace</th>
                <th>Role</th>
                <th>User</th>
                <th>Moodle courses</th>
                <th>Course offerings</th>
                <th>Assignments</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($rows as $row): ?>
                <tr>
                  <td>
                    <span class="pqpur-name"><?php echo s((string)($row->consumername ?? 'Unlinked consumer')); ?></span>
                    <span class="pqpur-meta"><?php echo s(pqpur_consumer_type_label((string)($row->consumer_type ?? ''))); ?><?php echo (int)($row->consumerid ?? 0) > 0 ? ' #' . (int)$row->consumerid : ''; ?></span>
                    <span class="pqpur-meta"><?php echo s((string)($row->workspacename ?? 'No workspace')); ?><?php echo (int)($row->workspaceid ?? 0) > 0 ? ' #' . (int)$row->workspaceid : ''; ?></span>
                  </td>
                  <td><span class="pqpur-pill"><?php echo s(pqpur_role_label((string)$row->rosterrole)); ?></span></td>
                  <td>
                    <span class="pqpur-name"><?php echo s((string)$row->fullname); ?></span>
                    <span class="pqpur-meta"><?php echo s(pqh_account_no_label($row)); ?> - Moodle ID <?php echo (int)$row->userid; ?> - <?php echo s((string)$row->username); ?></span>
                    <span class="pqpur-meta"><?php echo s((string)$row->email); ?></span>
                  </td>
                  <td><div class="pqpur-list"><?php echo s(pqpur_short_list((array)$row->moodlecourses)); ?></div></td>
                  <td>
                    <div class="pqpur-list"><?php echo s(pqpur_short_list((array)$row->offeringactive)); ?></div>
                    <?php if ($row->offeringpending): ?><span class="pqpur-pill pqpur-pill--pending"><?php echo count((array)$row->offeringpending); ?> pending</span><?php endif; ?>
                  </td>
                  <td>
                    <?php if ((int)$row->assignedstudents > 0): ?><span class="pqpur-pill"><?php echo (int)$row->assignedstudents; ?> students</span><?php endif; ?>
                    <?php if ((int)$row->assignedteachers > 0): ?><span class="pqpur-pill"><?php echo (int)$row->assignedteachers; ?> teachers</span><?php endif; ?>
                  </td>
                  <td>
                    <span class="pqpur-pill pqpur-pill--<?php echo s(pqpur_status_class((string)$row->rosterstatus)); ?>"><?php echo s((string)$row->rosterstatus); ?></span>
                    <span class="pqpur-meta"><?php echo (int)$row->rosterupdated > 0 ? s(userdate((int)$row->rosterupdated)) : ''; ?></span>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
