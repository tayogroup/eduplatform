<?php
// Workspace requests queue: every pending approval across the workspace in one
// list, oldest first.
//
// Deliberately READ-ONLY. Each row links to the page that already owns the
// decision rather than approving here, because approving is never a status
// flip: an enrolment approval re-checks the offering is published, unexpired
// and has open seats, performs the real Moodle enrolment with an access window,
// auto-enrols the student's teachers, notifies the family, and holds at
// 'approved' with a retry path when the sync fails. Re-implementing that here
// would duplicate it and drift.
//
// Adding a source = one more entry in the adapter list below. Each is wrapped
// in table/field existence guards so a schema that predates a feature simply
// contributes nothing instead of fataling the whole queue.
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace owners and administrators can review the requests queue.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Requests queue access required'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'The selected workspace was not found.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php'),
        'Workspace not found'
    );
}
pqh_enforce_role_domain($consumercontext, $workspaceid, (int)$USER->id);

/** First non-empty value among candidate properties on a record. */
function pqwr_first(stdClass $row, array $props, string $fallback = ''): string {
    foreach ($props as $prop) {
        if (property_exists($row, $prop)) {
            $value = trim((string)$row->{$prop});
            if ($value !== '') {
                return $value;
            }
        }
    }
    return $fallback;
}

/** Rows of a table for this workspace whose status is in $statuses. */
function pqwr_fetch(string $table, int $workspaceid, string $statusfield, array $statuses): array {
    global $DB;
    if (!pqh_table_exists_safe($table) || !pqh_table_has_field_safe($table, $statusfield)) {
        return [];
    }
    $where = [];
    $params = [];
    if (pqh_table_has_field_safe($table, 'workspaceid')) {
        $where[] = 'workspaceid = :ws';
        $params['ws'] = $workspaceid;
    }
    [$insql, $inparams] = $DB->get_in_or_equal($statuses, SQL_PARAMS_NAMED, 'st');
    $where[] = "{$statusfield} {$insql}";
    $params += $inparams;
    try {
        return array_values($DB->get_records_select($table, implode(' AND ', $where), $params, 'id ASC'));
    } catch (Throwable $e) {
        return [];
    }
}

$requests = [];
$userids = [];
$courseids = [];
$offeringids = [];

// 1. Course enrolment requests -> decided on Course Offerings.
foreach (pqwr_fetch('local_prequran_course_enrol_req', $workspaceid, 'status', ['pending']) as $row) {
    $userids[(int)($row->studentid ?? 0)] = true;
    $offeringids[(int)($row->offeringid ?? 0)] = true;
    $requests[] = [
        'type' => 'enrolment',
        'typelabel' => 'Course enrolment',
        'subject' => '',
        'offeringid' => (int)($row->offeringid ?? 0),
        'userid' => (int)($row->studentid ?? 0),
        'requester' => '',
        'time' => (int)($row->timecreated ?? 0),
        'url' => new moodle_url('/local/hubredirect/course_offerings.php', $urlparams + ['request_status' => 'pending']),
        'ref' => '#' . (int)$row->id,
    ];
}

// 2. Public student intake -> decided on Intake Requests.
foreach (pqwr_fetch('local_prequran_intake_request', $workspaceid, 'status', ['new', 'reviewing', 'needs_alternative']) as $row) {
    $student = trim(pqwr_first($row, ['student_display_name']) !== ''
        ? pqwr_first($row, ['student_display_name'])
        : trim(pqwr_first($row, ['student_firstname']) . ' ' . pqwr_first($row, ['student_lastname'])));
    $requests[] = [
        'type' => 'intake',
        'typelabel' => 'Student intake',
        'subject' => $student !== '' ? $student : 'Prospective student',
        'offeringid' => 0,
        'userid' => 0,
        'requester' => pqwr_first($row, ['parent_name', 'parent_email', 'student_email'], 'Public enquiry'),
        'time' => (int)($row->timecreated ?? 0),
        'url' => new moodle_url('/local/hubredirect/intake_requests.php', $urlparams),
        'ref' => '#' . (int)$row->id,
    ];
}

// 3. Public teacher applications -> decided on Teacher Onboarding.
foreach (pqwr_fetch('local_prequran_teacher_intake_request', $workspaceid, 'status', ['new', 'reviewing']) as $row) {
    $applicant = trim(pqwr_first($row, ['teacher_display_name']) !== ''
        ? pqwr_first($row, ['teacher_display_name'])
        : trim(pqwr_first($row, ['firstname', 'applicant_firstname']) . ' ' . pqwr_first($row, ['lastname', 'applicant_lastname'])));
    $requests[] = [
        'type' => 'teacher',
        'typelabel' => 'Teacher application',
        'subject' => pqwr_first($row, ['subject_areas', 'teaching_offer_summary'], 'Educator application'),
        'offeringid' => 0,
        'userid' => 0,
        'requester' => $applicant !== '' ? $applicant : pqwr_first($row, ['email'], 'Applicant'),
        'time' => (int)($row->timecreated ?? 0),
        'url' => new moodle_url('/local/hubredirect/teacher_intake.php', $urlparams),
        'ref' => '#' . (int)$row->id,
    ];
}

// 4. Admissions applications -> decided on Admissions Pipeline.
foreach (pqwr_fetch('local_prequran_admission_app', $workspaceid, 'review_status', ['pending']) as $row) {
    $userids[(int)($row->studentid ?? 0)] = true;
    $requests[] = [
        'type' => 'admission',
        'typelabel' => 'Admission application',
        'subject' => pqwr_first($row, ['application_no'], 'Application'),
        'offeringid' => 0,
        'userid' => (int)($row->studentid ?? 0),
        'requester' => '',
        'time' => (int)($row->timecreated ?? 0),
        'url' => new moodle_url('/local/hubredirect/admissions.php', $urlparams),
        'ref' => '#' . (int)$row->id,
    ];
}

// 5. Syllabi awaiting approval -> decided on the Syllabus page.
foreach (pqwr_fetch('local_prequran_syllabus', $workspaceid, 'status', ['in_review']) as $row) {
    $courseids[(int)($row->moodlecourseid ?? 0)] = true;
    $userids[(int)($row->modifiedby ?? 0)] = true;
    $requests[] = [
        'type' => 'syllabus',
        'typelabel' => 'Syllabus approval',
        'subject' => '',
        'courseid' => (int)($row->moodlecourseid ?? 0),
        'offeringid' => 0,
        'userid' => (int)($row->modifiedby ?? 0),
        'requester' => '',
        'time' => (int)($row->timemodified ?? 0),
        'url' => new moodle_url('/local/hubredirect/syllabus.php', $urlparams + [
            'courseid' => (int)($row->moodlecourseid ?? 0),
            'year' => (int)($row->academicyear ?? 0),
        ]),
        'ref' => '#' . (int)$row->id,
    ];
}

// 6. Scholarship applications -> decided on the Scholarship portal.
foreach (pqwr_fetch('local_prequran_scholar_app', $workspaceid, 'status', ['submitted', 'in_review']) as $row) {
    $userids[(int)($row->studentid ?? 0)] = true;
    $userids[(int)($row->applicantid ?? 0)] = true;
    $requests[] = [
        'type' => 'scholarship',
        'typelabel' => 'Scholarship application',
        'subject' => pqwr_first($row, ['applicationnumber'], 'Scholarship request'),
        'offeringid' => 0,
        'userid' => (int)($row->studentid ?? 0),
        'requester' => '',
        'time' => (int)($row->timecreated ?? 0),
        'url' => new moodle_url('/local/hubredirect/scholarship_portal.php', $urlparams),
        'ref' => '#' . (int)$row->id,
    ];
}

// Resolve names and titles in batches rather than per row.
$usernames = [];
$userids = array_values(array_filter(array_keys($userids)));
if ($userids) {
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'u');
    $namefields = 'id,firstname,lastname,middlename,alternatename,firstnamephonetic,lastnamephonetic';
    foreach ($DB->get_records_select('user', "id {$insql}", $params, '', $namefields) as $user) {
        $usernames[(int)$user->id] = fullname($user);
    }
}
$coursenames = [];
$courseids = array_values(array_filter(array_keys($courseids)));
if ($courseids) {
    [$insql, $params] = $DB->get_in_or_equal($courseids, SQL_PARAMS_NAMED, 'c');
    foreach ($DB->get_records_select('course', "id {$insql}", $params, '', 'id,fullname') as $course) {
        $coursenames[(int)$course->id] = (string)$course->fullname;
    }
}
$offeringtitles = [];
$offeringids = array_values(array_filter(array_keys($offeringids)));
if ($offeringids && pqh_table_exists_safe('local_prequran_course_offering')) {
    [$insql, $params] = $DB->get_in_or_equal($offeringids, SQL_PARAMS_NAMED, 'o');
    foreach ($DB->get_records_select('local_prequran_course_offering', "id {$insql}", $params, '', 'id,title') as $offering) {
        $offeringtitles[(int)$offering->id] = (string)$offering->title;
    }
}

$now = time();
foreach ($requests as $index => $request) {
    if ($request['requester'] === '' && (int)$request['userid'] > 0) {
        $requests[$index]['requester'] = $usernames[(int)$request['userid']] ?? ('User #' . (int)$request['userid']);
    }
    if ($request['subject'] === '') {
        if (!empty($request['courseid'])) {
            $requests[$index]['subject'] = $coursenames[(int)$request['courseid']] ?? ('Course #' . (int)$request['courseid']);
        } else if (!empty($request['offeringid'])) {
            $requests[$index]['subject'] = $offeringtitles[(int)$request['offeringid']] ?? ('Offering #' . (int)$request['offeringid']);
        }
    }
    $requests[$index]['days'] = (int)$request['time'] > 0 ? (int)floor(($now - (int)$request['time']) / 86400) : -1;
}

// Oldest first: an ageing backlog is the whole point of the queue.
usort($requests, static function(array $a, array $b): int {
    $at = (int)$a['time'] > 0 ? (int)$a['time'] : PHP_INT_MAX;
    $bt = (int)$b['time'] > 0 ? (int)$b['time'] : PHP_INT_MAX;
    return $at <=> $bt;
});

$typecounts = [];
foreach ($requests as $request) {
    $typecounts[$request['type']] = ($typecounts[$request['type']] ?? 0) + 1;
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspace_requests.php', $urlparams));
$PAGE->set_pagelayout('standard');
$pagetitle = trim((string)$workspace->name) !== '' ? $workspace->name . ' Requests' : 'Workspace Requests';
$PAGE->set_title($pagetitle);
$PAGE->set_heading($pagetitle);
$PAGE->add_body_class('pqwr-page');

echo $OUTPUT->header();
?>
<style>
body.pqwr-page header,body.pqwr-page footer,body.pqwr-page nav.navbar,body.pqwr-page #page-header,body.pqwr-page #page-footer,body.pqwr-page .drawer,body.pqwr-page .drawer-toggles,body.pqwr-page .block-region,body.pqwr-page [data-region="drawer"],body.pqwr-page [data-region="right-hand-drawer"]{display:none!important}
body.pqwr-page #page,body.pqwr-page #page-content,body.pqwr-page #region-main,body.pqwr-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwr-shell{min-height:100vh;padding:28px 18px 56px;background:#fff;color:#173044;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6}
.pqwr-wrap{max-width:1180px;margin:0 auto}
.pqwr-top,.pqwr-panel{padding:20px 22px;border:1px solid var(--pqh-line,#e4e9ef);border-radius:14px;background:var(--pqh-surface,#fff);box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);margin-bottom:14px}
.pqwr-title{margin:0;color:var(--pqh-ink,#0f2237);font-size:26px;font-weight:800;letter-spacing:-.02em}
.pqwr-sub{margin:7px 0 0;color:var(--pqh-muted,#5b6b7c);font-size:14px;font-weight:500}
.pqwr-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.pqwr-chip{display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border:1px solid var(--pqh-line,#e4e9ef);border-radius:999px;background:var(--pqh-surface,#fff);color:var(--pqh-ink,#0f2237);font-size:13px;font-weight:650;cursor:pointer}
.pqwr-chip[aria-pressed="true"]{background:var(--pqh-primary,#2166d1);border-color:var(--pqh-primary,#2166d1);color:#fff}
.pqwr-chip b{font-weight:800}
.pqwr-bar{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:end;margin-bottom:12px}
.pqwr-field{display:grid;gap:5px;flex:1 1 280px}
.pqwr-field label{color:var(--pqh-faint,#8494a5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.pqwr-input{width:100%;min-height:38px;border:1px solid var(--pqh-line,#e4e9ef);border-radius:10px;padding:8px 11px;background:var(--pqh-surface,#fff);color:var(--pqh-ink,#0f2237);font:inherit;font-size:14px;box-sizing:border-box}
.pqwr-table{width:100%;border-collapse:separate;border-spacing:0;font-size:13.5px}
.pqwr-table th,.pqwr-table td{padding:9px 10px;border-bottom:1px solid var(--pqh-line,#e4e9ef);text-align:left;vertical-align:top}
.pqwr-table th{color:var(--pqh-faint,#8494a5);font-size:11px;font-weight:700;text-transform:uppercase}
.pqwr-name{display:block;color:var(--pqh-ink,#0f2237);font-weight:650}
.pqwr-muted{display:block;margin-top:2px;color:var(--pqh-muted,#5b6b7c);font-size:12px}
.pqwr-pill{display:inline-flex;min-height:24px;align-items:center;padding:0 9px;border-radius:999px;background:var(--pqh-tint,#edf3fc);color:var(--pqh-primary-ink,#17498f);font-size:12px;font-weight:700}
.pqwr-age{font-weight:700}
.pqwr-age--old{color:#c0392b}
.pqwr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 13px;border:1px solid var(--pqh-line,#e4e9ef);border-radius:9px;background:var(--pqh-surface,#fff);color:var(--pqh-ink,#0f2237)!important;text-decoration:none;font-size:13px;font-weight:650}
.pqwr-btn:hover{background:var(--pqh-tint,#edf3fc);border-color:var(--pqh-tint-2,#e0ebfa)}
.pqwr-empty{padding:22px;border:1px dashed var(--pqh-line,#e4e9ef);border-radius:12px;color:var(--pqh-muted,#5b6b7c);font-weight:550;text-align:center}
.pqwr-row-hidden{display:none}
<?php echo pqh_design_shell_css('.pqwr-shell'); ?>
</style>
<style><?php echo pqh_openproject_skin_css('pqwr', 'pqwr-page'); ?></style>
<main class="pqwr-shell">
<?php
echo pqh_design_shell_html('pqwr-shell', 'workspace', [
    'title' => $pagetitle,
    'appbar' => [
        ['Workspace', new moodle_url('/local/hubredirect/admin_workspace.php', $urlparams)],
        ['Dashboard', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams)],
    ],
]);
?>
  <div class="pqwr-wrap">
    <section class="pqwr-top">
      <h1 class="pqwr-title">Requests Queue</h1>
      <p class="pqwr-sub">Everything waiting on a decision across this workspace, oldest first. Each row opens the page that owns that decision.</p>
      <?php if ($requests): ?>
        <div class="pqwr-chips" role="group" aria-label="Filter by request type">
          <button type="button" class="pqwr-chip" data-type="" aria-pressed="true">All <b><?php echo count($requests); ?></b></button>
          <?php
            $typelabels = [];
            foreach ($requests as $request) {
                $typelabels[$request['type']] = $request['typelabel'];
            }
            ksort($typelabels);
          ?>
          <?php foreach ($typelabels as $typekey => $typelabel): ?>
            <button type="button" class="pqwr-chip" data-type="<?php echo s((string)$typekey); ?>" aria-pressed="false"><?php echo s((string)$typelabel); ?> <b><?php echo (int)($typecounts[$typekey] ?? 0); ?></b></button>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </section>

    <section class="pqwr-panel">
      <?php if (!$requests): ?>
        <div class="pqwr-empty">Nothing is waiting on a decision right now.</div>
      <?php else: ?>
        <div class="pqwr-bar">
          <div class="pqwr-field">
            <label for="pqwr-search">Search requests</label>
            <input class="pqwr-input" id="pqwr-search" type="search" placeholder="Requester, course, student, or reference">
          </div>
          <span class="pqwr-sub" style="margin:0 0 8px auto"><?php echo count($requests); ?> waiting</span>
        </div>
        <table class="pqwr-table" id="pqwr-table">
          <thead><tr><th>Request</th><th>Requester</th><th>Waiting</th><th>Open</th></tr></thead>
          <tbody>
            <?php foreach ($requests as $request): ?>
              <?php
                $days = (int)$request['days'];
                $agetext = $days < 0 ? 'unknown' : ($days === 0 ? 'today' : $days . ' day' . ($days === 1 ? '' : 's'));
                $haystack = strtolower(trim(
                    (string)$request['typelabel'] . ' ' . (string)$request['subject'] . ' '
                    . (string)$request['requester'] . ' ' . (string)$request['ref']
                ));
              ?>
              <tr data-filter="<?php echo s($haystack); ?>" data-type="<?php echo s((string)$request['type']); ?>">
                <td>
                  <span class="pqwr-name"><?php echo s((string)$request['subject'] !== '' ? (string)$request['subject'] : (string)$request['typelabel']); ?></span>
                  <span class="pqwr-muted"><span class="pqwr-pill"><?php echo s((string)$request['typelabel']); ?></span> <?php echo s((string)$request['ref']); ?></span>
                </td>
                <td><?php echo (string)$request['requester'] !== '' ? s((string)$request['requester']) : '<span class="pqwr-muted">&mdash;</span>'; ?></td>
                <td><span class="pqwr-age<?php echo $days >= 7 ? ' pqwr-age--old' : ''; ?>"><?php echo s($agetext); ?></span><?php if ((int)$request['time'] > 0): ?><span class="pqwr-muted"><?php echo s(userdate((int)$request['time'], get_string('strftimedate'))); ?></span><?php endif; ?></td>
                <td><a class="pqwr-btn" href="<?php echo $request['url']->out(false); ?>">Open</a></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </section>
  </div>
</main>
<script>
(function() {
  var search = document.getElementById('pqwr-search');
  var table = document.getElementById('pqwr-table');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.pqwr-chip'));
  if (!table) {
    return;
  }
  var activeType = '';
  function apply() {
    var needle = search ? search.value.toLowerCase().trim() : '';
    table.querySelectorAll('tbody tr').forEach(function(row) {
      var haystack = row.getAttribute('data-filter') || '';
      var matchesText = needle === '' || haystack.indexOf(needle) !== -1;
      var matchesType = activeType === '' || row.getAttribute('data-type') === activeType;
      row.classList.toggle('pqwr-row-hidden', !(matchesText && matchesType));
    });
  }
  if (search) {
    search.addEventListener('input', apply);
  }
  chips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      activeType = chip.getAttribute('data-type') || '';
      chips.forEach(function(other) {
        other.setAttribute('aria-pressed', other === chip ? 'true' : 'false');
      });
      apply();
    });
  });
}());
</script>
<?php
echo $OUTPUT->footer();
