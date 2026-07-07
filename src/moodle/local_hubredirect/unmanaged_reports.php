<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->libdir . '/ddllib.php');
require_once(__DIR__ . '/accesslib.php');

if (!pqh_can_manage_academy_operations((int)$USER->id)) {
    pqh_access_denied(
        'Unmanaged student reports are available to academy operations users only.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Unmanaged reports are not available for this account'
    );
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/unmanaged_reports.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Unmanaged Student Reports');
$PAGE->set_heading('Unmanaged Student Reports');
$PAGE->add_body_class('pqh-unmanaged-report-page');

function pqur_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqur_table_has_field(string $table, string $field): bool {
    global $DB;
    if (!pqur_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqur_is_managed_student(int $userid): bool {
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

function pqur_profile(int $userid): ?stdClass {
    global $DB;
    if (!pqur_table_exists('local_prequran_student_profile') || !pqur_table_has_field('local_prequran_student_profile', 'userid')) {
        return null;
    }
    return $DB->get_record('local_prequran_student_profile', ['userid' => $userid], '*', IGNORE_MISSING) ?: null;
}

function pqur_profile_field(?stdClass $profile, string $field): string {
    if (!$profile || !property_exists($profile, $field)) {
        return '';
    }
    return trim((string)$profile->{$field});
}

function pqur_user_courses(int $userid): array {
    global $DB;
    $rows = $DB->get_records_sql(
        "SELECT DISTINCT c.id, c.fullname, c.shortname, c.visible
           FROM {course} c
           JOIN {context} ctx ON ctx.instanceid = c.id AND ctx.contextlevel = :coursecontext
           JOIN {role_assignments} ra ON ra.contextid = ctx.id AND ra.userid = :userid
           JOIN {role} r ON r.id = ra.roleid
          WHERE c.id <> :sitecourse
            AND (r.shortname = :studentshortname OR r.archetype = :studentarchetype)
       ORDER BY c.fullname ASC",
        [
            'coursecontext' => CONTEXT_COURSE,
            'userid' => $userid,
            'sitecourse' => SITEID,
            'studentshortname' => 'student',
            'studentarchetype' => 'student',
        ],
        0,
        12
    );
    $out = [];
    foreach ($rows as $row) {
        $out[] = [
            'id' => (int)$row->id,
            'fullname' => (string)$row->fullname,
            'shortname' => (string)$row->shortname,
            'visible' => (int)$row->visible,
        ];
    }
    return $out;
}

function pqur_user_class_groups(int $userid): array {
    global $DB;
    if (!pqur_table_exists('local_prequran_group_member') || !pqur_table_exists('local_prequran_class_group')) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT cg.id, cg.title, cg.course_type, cg.current_level, cg.status
           FROM {local_prequran_group_member} gm
           JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
          WHERE gm.studentid = :userid
            AND gm.assignment_status = :status
       ORDER BY cg.title ASC",
        ['userid' => $userid, 'status' => 'active'],
        0,
        12
    );
    $out = [];
    foreach ($rows as $row) {
        $out[] = [
            'id' => (int)$row->id,
            'title' => (string)$row->title,
            'course_type' => (string)$row->course_type,
            'current_level' => (string)$row->current_level,
            'status' => (string)$row->status,
        ];
    }
    return $out;
}

function pqur_source_userids(string $search, int $courseid, int $groupid, int $limit): array {
    global $DB;
    $ids = [];
    $search = trim($search);

    if ($search !== '' && ctype_digit($search)) {
        $ids[(int)$search] = (int)$search;
    }

    if (pqur_table_exists('local_prequran_student_profile') && pqur_table_has_field('local_prequran_student_profile', 'userid')) {
        $profileparams = [];
        $profilewhere = ['sp.userid > 0'];
        if ($search !== '') {
            $like = $DB->sql_like('sp.student_display_name', ':profilesearch', false);
            $profilewhere[] = "({$like} OR sp.parent_email = :profileexact OR sp.parent_phone = :profileexact)";
            $profileparams['profilesearch'] = '%' . $DB->sql_like_escape($search) . '%';
            $profileparams['profileexact'] = $search;
        }
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT sp.userid
               FROM {local_prequran_student_profile} sp
              WHERE " . implode(' AND ', $profilewhere) . "
           ORDER BY sp.userid ASC",
            $profileparams,
            0,
            max(1, min(750, $limit * 3))
        );
        foreach ($rows as $row) {
            $ids[(int)$row->userid] = (int)$row->userid;
        }
    }

    $roleparams = [
        'coursecontext' => CONTEXT_COURSE,
        'sitecourse' => SITEID,
        'studentshortname' => 'student',
        'studentarchetype' => 'student',
    ];
    $rolewhere = [
        'u.deleted = 0',
        'c.id <> :sitecourse',
        '(r.shortname = :studentshortname OR r.archetype = :studentarchetype)',
    ];
    if ($courseid > 0) {
        $rolewhere[] = 'c.id = :courseid';
        $roleparams['courseid'] = $courseid;
    }
    if ($search !== '') {
        $like = $DB->sql_like($DB->sql_fullname('u.firstname', 'u.lastname'), ':searchname', false);
        $rolewhere[] = "(u.id = :searchid OR u.idnumber = :searchexact OR u.username = :searchexact OR u.email = :searchexact OR {$like})";
        $roleparams['searchid'] = ctype_digit($search) ? (int)$search : 0;
        $roleparams['searchexact'] = $search;
        $roleparams['searchname'] = '%' . $DB->sql_like_escape($search) . '%';
    }
    $rows = $DB->get_records_sql(
        "SELECT DISTINCT u.id
           FROM {user} u
           JOIN {context} ctx ON ctx.contextlevel = :coursecontext
           JOIN {course} c ON c.id = ctx.instanceid
           JOIN {role_assignments} ra ON ra.contextid = ctx.id AND ra.userid = u.id
           JOIN {role} r ON r.id = ra.roleid
          WHERE " . implode(' AND ', $rolewhere) . "
       ORDER BY u.id ASC",
        $roleparams,
        0,
        max(1, min(750, $limit * 3))
    );
    foreach ($rows as $row) {
        $ids[(int)$row->id] = (int)$row->id;
    }

    if ($groupid > 0 && pqur_table_exists('local_prequran_group_member')) {
        $groupids = [];
        $rows = $DB->get_records('local_prequran_group_member', ['groupid' => $groupid, 'assignment_status' => 'active'], '', 'id, studentid', 0, max(1, min(750, $limit * 3)));
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if (isset($ids[$studentid]) || ($search === '' && $courseid <= 0)) {
                $groupids[$studentid] = $studentid;
            }
        }
        $ids = $groupids;
    }

    return array_values($ids);
}

function pqur_candidate_users(string $search, int $courseid, int $groupid, int $limit): array {
    global $DB;

    $userids = pqur_source_userids($search, $courseid, $groupid, $limit);
    if (!$userids) {
        return [];
    }

    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'pquruserid');
    $fullname = $DB->sql_fullname('u.firstname', 'u.lastname');
    $records = $DB->get_records_sql(
        "SELECT DISTINCT u.id, u.username, u.idnumber, u.firstname, u.lastname, u.email, u.suspended, u.lastaccess, {$fullname} AS fullname
           FROM {user} u
          WHERE u.deleted = 0
            AND u.id {$insql}
       ORDER BY u.lastname ASC, u.firstname ASC, u.id ASC",
        $params,
        0,
        max(1, min(500, $limit * 3))
    );

    $out = [];
    foreach ($records as $record) {
        $userid = (int)$record->id;
        if (pqur_is_managed_student($userid)) {
            continue;
        }
        $profile = pqur_profile($userid);
        $out[] = [
            'userid' => $userid,
            'fullname' => (string)$record->fullname,
            'username' => (string)$record->username,
            'idnumber' => (string)$record->idnumber,
            'email' => (string)$record->email,
            'suspended' => (int)$record->suspended,
            'lastaccess' => (int)$record->lastaccess,
            'profile' => $profile,
            'courses' => pqur_user_courses($userid),
            'groups' => pqur_user_class_groups($userid),
        ];
        if (count($out) >= $limit) {
            break;
        }
    }
    return $out;
}

$search = optional_param('q', '', PARAM_TEXT);
$courseid = optional_param('courseid', 0, PARAM_INT);
$groupid = optional_param('groupid', 0, PARAM_INT);
$limit = optional_param('limit', 100, PARAM_INT);
$limit = max(25, min(250, $limit));
$rows = pqur_candidate_users($search, $courseid, $groupid, $limit);

$courses = $DB->get_records_sql(
    "SELECT DISTINCT c.id, c.fullname, c.shortname
       FROM {course} c
       JOIN {context} ctx ON ctx.instanceid = c.id AND ctx.contextlevel = :coursecontext
       JOIN {role_assignments} ra ON ra.contextid = ctx.id
       JOIN {role} r ON r.id = ra.roleid
      WHERE c.id <> :sitecourse
        AND (r.shortname = :studentshortname OR r.archetype = :studentarchetype)
   ORDER BY c.fullname ASC",
    [
        'coursecontext' => CONTEXT_COURSE,
        'sitecourse' => SITEID,
        'studentshortname' => 'student',
        'studentarchetype' => 'student',
    ],
    0,
    500
);
$classgroups = pqur_table_exists('local_prequran_class_group')
    ? $DB->get_records_select('local_prequran_class_group', "status <> ?", ['archived'], 'title ASC', 'id, title, course_type, current_level, status')
    : [];

echo $OUTPUT->header();
?>
<style>
body.pqh-unmanaged-report-page header,
body.pqh-unmanaged-report-page footer,
body.pqh-unmanaged-report-page nav.navbar,
body.pqh-unmanaged-report-page #page-header,
body.pqh-unmanaged-report-page #page-footer,
body.pqh-unmanaged-report-page .drawer,
body.pqh-unmanaged-report-page .drawer-toggles,
body.pqh-unmanaged-report-page .block-region,
body.pqh-unmanaged-report-page [data-region="drawer"],
body.pqh-unmanaged-report-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-unmanaged-report-page #page,
body.pqh-unmanaged-report-page #page-content,
body.pqh-unmanaged-report-page #region-main,
body.pqh-unmanaged-report-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqur-shell{min-height:100vh;padding:26px 16px 52px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqur-wrap{max-width:1280px;margin:0 auto}
.pqur-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;margin-bottom:14px;padding:20px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}
.pqur-title{margin:0;color:#221b22;font-size:30px;line-height:1.1;font-weight:950}
.pqur-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}
.pqur-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.pqur-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:1px solid rgba(23,48,68,.14);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none!important;font-size:13px;font-weight:950}
.pqur-btn--primary{background:#2f6f4e;border-color:#2f6f4e;color:#fff!important}
.pqur-filter{display:grid;grid-template-columns:1.1fr 1fr 1fr .55fr auto;gap:10px;margin-bottom:14px;padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}
.pqur-field label{display:block;margin:0 0 5px;color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}
.pqur-input,.pqur-select{width:100%;min-height:40px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:14px;font-weight:800}
.pqur-card{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}
.pqur-summary{margin:0 0 12px;color:#5e7280;font-size:13px;font-weight:900}
.pqur-table{width:100%;border-collapse:separate;border-spacing:0}
.pqur-table th,.pqur-table td{padding:11px 10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqur-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}
.pqur-table td{color:#173044;font-size:13px;font-weight:800}
.pqur-name{display:block;color:#173044;font-size:14px;font-weight:950}
.pqur-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}
.pqur-pill{display:inline-flex;min-height:25px;margin:0 5px 5px 0;align-items:center;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pqur-empty{padding:22px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;background:#fff;color:#5e7280;font-weight:900}
@media(max-width:980px){.pqur-top,.pqur-filter{grid-template-columns:1fr}.pqur-actions{justify-content:flex-start}.pqur-table,.pqur-table tbody,.pqur-table tr,.pqur-table td{display:block;width:100%}.pqur-table thead{display:none}.pqur-table tr{border-bottom:1px solid rgba(23,48,68,.12)}.pqur-table td{border:0}.pqur-table td::before{content:attr(data-label);display:block;margin-bottom:3px;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}}
@media(max-width:560px){.pqur-shell{padding:18px 10px 42px}.pqur-title{font-size:24px}.pqur-btn{width:100%}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqur-shell">
  <div class="pqur-wrap">
    <section class="pqur-top pqh-workspace-top">
      <div>
        <h1 class="pqur-title pqh-workspace-title">Unmanaged Student Reports</h1>
        <p class="pqur-sub pqh-workspace-sub">Limited student directory report for Moodle students who are not marked as managed. No tracking or progress data is shown.</p>
      </div>
      <nav class="pqur-actions pqh-workspace-actions" aria-label="Report links">
        <a class="pqur-btn pqur-btn--primary" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
        <a class="pqur-btn" href="<?php echo (new moodle_url('/local/hubredirect/master_dashboard.php'))->out(false); ?>">Master Dashboard</a>
        <a class="pqur-btn" href="<?php echo (new moodle_url('/local/hubredirect/managed_reports.php'))->out(false); ?>">Managed Reports</a>
      </nav>
    </section>

    <form class="pqur-filter" method="get" aria-label="Unmanaged report filters">
      <div class="pqur-field">
        <label for="pqur-q">Search</label>
        <input class="pqur-input" id="pqur-q" name="q" value="<?php echo s($search); ?>" placeholder="name, username, email, or idnumber">
      </div>
      <div class="pqur-field">
        <label for="pqur-course">Course</label>
        <select class="pqur-select" id="pqur-course" name="courseid">
          <option value="0">All courses</option>
          <?php foreach ($courses as $course): ?>
            <option value="<?php echo (int)$course->id; ?>" <?php echo $courseid === (int)$course->id ? 'selected' : ''; ?>><?php echo s($course->fullname); ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="pqur-field">
        <label for="pqur-group">Class Group</label>
        <select class="pqur-select" id="pqur-group" name="groupid">
          <option value="0">All groups</option>
          <?php foreach ($classgroups as $group): ?>
            <option value="<?php echo (int)$group->id; ?>" <?php echo $groupid === (int)$group->id ? 'selected' : ''; ?>><?php echo s($group->title); ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="pqur-field">
        <label for="pqur-limit">Limit</label>
        <select class="pqur-select" id="pqur-limit" name="limit">
          <?php foreach ([25, 50, 100, 250] as $option): ?>
            <option value="<?php echo $option; ?>" <?php echo $limit === $option ? 'selected' : ''; ?>><?php echo $option; ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <button class="pqur-btn pqur-btn--primary" type="submit">Apply</button>
    </form>

    <?php if (!$rows): ?>
      <div class="pqur-empty">No unmanaged students matched these filters.</div>
    <?php else: ?>
      <section class="pqur-card" aria-label="Unmanaged student table">
        <p class="pqur-summary">Showing <?php echo count($rows); ?> unmanaged student<?php echo count($rows) === 1 ? '' : 's'; ?>. This report intentionally excludes progress, tracking, focus, quiz, and recording metrics.</p>
        <table class="pqur-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Account</th>
              <th>Course Information</th>
              <th>Class Groups</th>
              <th>Profile Context</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($rows as $row): ?>
              <?php $profile = $row['profile']; ?>
              <tr>
                <td data-label="Student">
                  <span class="pqur-name"><?php echo s($row['fullname']); ?></span>
                  <span class="pqur-muted">User ID: <?php echo (int)$row['userid']; ?></span>
                  <span class="pqur-muted"><?php echo s(pqh_account_no_label((object)['userid' => $row['userid'], 'idnumber' => $row['idnumber']])); ?></span>
                </td>
                <td data-label="Account">
                  <span class="pqur-muted">Username: <?php echo s($row['username']); ?></span>
                  <span class="pqur-muted">Email: <?php echo s($row['email'] !== '' ? $row['email'] : 'not set'); ?></span>
                  <span class="pqur-pill"><?php echo (int)$row['suspended'] === 1 ? 'Suspended' : 'Active'; ?></span>
                  <span class="pqur-muted">Last access: <?php echo (int)$row['lastaccess'] > 0 ? userdate((int)$row['lastaccess'], get_string('strftimedatetimeshort')) : 'never'; ?></span>
                </td>
                <td data-label="Course Information">
                  <?php if (!$row['courses']): ?>
                    <span class="pqur-muted">No student course role found.</span>
                  <?php else: ?>
                    <?php foreach ($row['courses'] as $course): ?>
                      <span class="pqur-pill"><?php echo s($course['fullname']); ?> #<?php echo (int)$course['id']; ?></span>
                    <?php endforeach; ?>
                  <?php endif; ?>
                </td>
                <td data-label="Class Groups">
                  <?php if (!$row['groups']): ?>
                    <span class="pqur-muted">No class groups</span>
                  <?php else: ?>
                    <?php foreach ($row['groups'] as $group): ?>
                      <span class="pqur-pill"><?php echo s($group['title']); ?> #<?php echo (int)$group['id']; ?></span>
                    <?php endforeach; ?>
                  <?php endif; ?>
                </td>
                <td data-label="Profile Context">
                  <?php
                    $profilebits = array_filter([
                        pqur_profile_field($profile, 'course_type') !== '' ? 'Course: ' . pqur_profile_field($profile, 'course_type') : '',
                        pqur_profile_field($profile, 'current_level') !== '' ? 'Level: ' . pqur_profile_field($profile, 'current_level') : '',
                        pqur_profile_field($profile, 'timezone') !== '' ? 'TZ: ' . pqur_profile_field($profile, 'timezone') : '',
                        pqur_profile_field($profile, 'country') !== '' ? 'Country: ' . pqur_profile_field($profile, 'country') : '',
                        pqur_profile_field($profile, 'city') !== '' ? 'City: ' . pqur_profile_field($profile, 'city') : '',
                    ]);
                  ?>
                  <?php if (!$profilebits): ?>
                    <span class="pqur-muted">No Pre-Quraan profile context</span>
                  <?php else: ?>
                    <?php foreach ($profilebits as $bit): ?><span class="pqur-pill"><?php echo s($bit); ?></span><?php endforeach; ?>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
