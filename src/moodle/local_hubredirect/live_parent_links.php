<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can view student parent links.');
}

function pqlpl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlpl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlpl_user_email(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? (string)$user->email : '';
}

function pqlpl_csv(string $filename, array $headers, array $rows): void {
    @header('Content-Type: text/csv; charset=utf-8');
    @header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

function pqlpl_bool_label($value): string {
    return !empty($value) ? 'yes' : 'no';
}

function pqlpl_live_consent_map(): array {
    global $DB;
    $map = [];
    if (!pqlpl_table_exists('local_prequran_live_consent')) {
        return $map;
    }
    $rows = $DB->get_records_sql(
        "SELECT id, studentid, guardianid, consent_type, granted
           FROM {local_prequran_live_consent}
       ORDER BY studentid ASC, guardianid ASC, consent_type ASC"
    );
    foreach ($rows as $row) {
        $key = (int)$row->studentid . ':' . (int)$row->guardianid;
        $type = (string)$row->consent_type;
        $map[$key][$type] = !empty($row->granted) ? 'yes' : 'no';
    }
    return $map;
}

function pqlpl_rows(): array {
    global $DB;
    $rows = [];
    $seenstudents = [];
    $consents = pqlpl_live_consent_map();

    if (pqlpl_table_exists('local_prequran_comm_consent')) {
        $links = $DB->get_records_sql(
            "SELECT id, studentid, guardianid, student_messaging_enabled, free_text_enabled, parent_visible, consent_source, timemodified
               FROM {local_prequran_comm_consent}
           ORDER BY studentid ASC, guardianid ASC"
        );
        foreach ($links as $link) {
            $studentid = (int)$link->studentid;
            $guardianid = (int)$link->guardianid;
            $key = $studentid . ':' . $guardianid;
            $rows[] = [
                'studentid' => $studentid,
                'student' => pqlpl_user_name($studentid, 'Student ' . $studentid),
                'studentemail' => pqlpl_user_email($studentid),
                'parentid' => $guardianid,
                'parent' => pqlpl_user_name($guardianid, 'Parent ' . $guardianid),
                'parentemail' => pqlpl_user_email($guardianid),
                'profileparent' => '',
                'profilecontact' => '',
                'source' => 'communication link',
                'messaging' => pqlpl_bool_label($link->student_messaging_enabled),
                'free_text' => pqlpl_bool_label($link->free_text_enabled),
                'parent_visible' => pqlpl_bool_label($link->parent_visible),
                'live_consent' => $consents[$key]['live_session'] ?? '',
                'recording_consent' => $consents[$key]['recording'] ?? '',
                'notes' => (string)$link->consent_source,
                'updated' => (int)$link->timemodified,
            ];
            $seenstudents[$studentid] = true;
        }
    }

    if (pqlpl_table_exists('local_prequran_student_profile')) {
        $profiles = $DB->get_records_sql(
            "SELECT id, userid, student_display_name, parent_name, parent_email, parent_phone, live_class_consent, recording_consent, timemodified
               FROM {local_prequran_student_profile}
           ORDER BY userid ASC"
        );
        foreach ($profiles as $profile) {
            $studentid = (int)$profile->userid;
            if (isset($seenstudents[$studentid])
                || (trim((string)$profile->parent_name) === '' && trim((string)$profile->parent_email) === '' && trim((string)$profile->parent_phone) === '')) {
                continue;
            }
            $studentname = trim((string)$profile->student_display_name);
            $rows[] = [
                'studentid' => $studentid,
                'student' => $studentname !== '' ? $studentname : pqlpl_user_name($studentid, 'Student ' . $studentid),
                'studentemail' => pqlpl_user_email($studentid),
                'parentid' => 0,
                'parent' => '',
                'parentemail' => '',
                'profileparent' => (string)$profile->parent_name,
                'profilecontact' => trim((string)$profile->parent_email . ' ' . (string)$profile->parent_phone),
                'source' => 'profile contact only',
                'messaging' => '',
                'free_text' => '',
                'parent_visible' => '',
                'live_consent' => pqlpl_bool_label($profile->live_class_consent),
                'recording_consent' => pqlpl_bool_label($profile->recording_consent),
                'notes' => 'No linked guardian account found in communication consent.',
                'updated' => (int)$profile->timemodified,
            ];
        }
    }

    usort($rows, function(array $a, array $b): int {
        return strcasecmp((string)$a['student'], (string)$b['student'])
            ?: ((int)$a['studentid'] <=> (int)$b['studentid'])
            ?: strcasecmp((string)$a['parent'], (string)$b['parent']);
    });
    return $rows;
}

$q = trim(optional_param('q', '', PARAM_TEXT));
$source = optional_param('source', 'all', PARAM_ALPHANUMEXT);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);

$rows = pqlpl_rows();
$filtered = [];
foreach ($rows as $row) {
    if ($source === 'linked' && (int)$row['parentid'] <= 0) {
        continue;
    }
    if ($source === 'profile' && (int)$row['parentid'] > 0) {
        continue;
    }
    if ($q !== '') {
        $haystack = strtolower(implode(' ', array_map('strval', $row)));
        if (strpos($haystack, strtolower($q)) === false) {
            continue;
        }
    }
    $filtered[] = $row;
}

if ($export === 'csv') {
    $csvrows = [];
    foreach ($filtered as $row) {
        $csvrows[] = [
            $row['studentid'],
            $row['student'],
            $row['studentemail'],
            $row['parentid'],
            $row['parent'],
            $row['parentemail'],
            $row['profileparent'],
            $row['profilecontact'],
            $row['source'],
            $row['messaging'],
            $row['free_text'],
            $row['parent_visible'],
            $row['live_consent'],
            $row['recording_consent'],
            $row['notes'],
            $row['updated'] > 0 ? userdate((int)$row['updated'], get_string('strftimedatetimeshort')) : '',
        ];
    }
    pqlpl_csv('quraan-student-parent-links.csv', ['studentid', 'student', 'student_email', 'parentid', 'parent', 'parent_email', 'profile_parent', 'profile_contact', 'source', 'messaging', 'free_text', 'parent_visible', 'live_consent', 'recording_consent', 'notes', 'updated'], $csvrows);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_parent_links.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student Parent Links');
$PAGE->set_heading('Student Parent Links');
$PAGE->add_body_class('pqh-parent-links-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-parent-links-page header,
body.pqh-parent-links-page footer,
body.pqh-parent-links-page nav.navbar,
body.pqh-parent-links-page #page-header,
body.pqh-parent-links-page #page-footer,
body.pqh-parent-links-page .drawer,
body.pqh-parent-links-page .drawer-toggles,
body.pqh-parent-links-page .block-region,
body.pqh-parent-links-page [data-region="drawer"],
body.pqh-parent-links-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-parent-links-page #page,
body.pqh-parent-links-page #page-content,
body.pqh-parent-links-page #region-main,
body.pqh-parent-links-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlpl-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlpl-wrap{max-width:1260px;margin:0 auto}
.pqlpl-top,.pqlpl-panel{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlpl-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqlpl-title{margin:0;font-size:28px;line-height:1.12;font-weight:950;color:#241b24}
.pqlpl-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlpl-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlpl-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlpl-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlpl-filters{display:grid;grid-template-columns:2fr 1fr auto;gap:10px;margin-bottom:16px;align-items:end}
.pqlpl-field{display:grid;gap:6px}
.pqlpl-field label{font-size:12px;font-weight:900;color:#415665}
.pqlpl-input,.pqlpl-select{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 13px/1.2 system-ui;background:#fff;color:#173044}
.pqlpl-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}
.pqlpl-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlpl-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqlpl-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlpl-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlpl-table th,.pqlpl-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlpl-table th{background:#f7fafc;font-size:12px;color:#415665}
.pqlpl-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlpl-pill--warn{background:#fff7e6;color:#7a4a00}
.pqlpl-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlpl-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
@media(max-width:1050px){.pqlpl-filters{grid-template-columns:1fr}.pqlpl-metrics{grid-template-columns:1fr}.pqlpl-top{display:block}.pqlpl-actions{margin-top:12px}.pqlpl-table{display:block;overflow:auto}}
</style>
<main class="pqlpl-shell">
  <div class="pqlpl-wrap">
    <section class="pqlpl-top">
      <div>
        <h1 class="pqlpl-title">Student Parent Links</h1>
        <p class="pqlpl-sub">Guardian account links, profile-only parent contacts, and live-session consent status.</p>
      </div>
      <div class="pqlpl-actions">
        <a class="pqlpl-btn pqlpl-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php'))->out(false); ?>">Reports</a>
        <a class="pqlpl-btn pqlpl-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust.php'))->out(false); ?>">Parent trust</a>
        <a class="pqlpl-btn pqlpl-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
        <a class="pqlpl-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <section class="pqlpl-panel">
      <form method="get">
        <div class="pqlpl-filters">
          <div class="pqlpl-field"><label for="q">Search</label><input class="pqlpl-input" id="q" name="q" value="<?php echo s($q); ?>" placeholder="Student, parent, email, Moodle ID"></div>
          <div class="pqlpl-field"><label for="source">Source</label><select class="pqlpl-select" id="source" name="source"><option value="all" <?php echo $source === 'all' ? 'selected' : ''; ?>>All links</option><option value="linked" <?php echo $source === 'linked' ? 'selected' : ''; ?>>Linked parent accounts</option><option value="profile" <?php echo $source === 'profile' ? 'selected' : ''; ?>>Profile contact only</option></select></div>
          <div class="pqlpl-actions"><button class="pqlpl-btn" type="submit">Apply filters</button><a class="pqlpl-btn pqlpl-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_links.php'))->out(false); ?>">Reset</a><a class="pqlpl-btn pqlpl-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_links.php', ['q' => $q, 'source' => $source, 'export' => 'csv']))->out(false); ?>">Export CSV</a></div>
        </div>
      </form>
    </section>

    <section class="pqlpl-metrics" aria-label="Student parent link metrics">
      <div class="pqlpl-metric"><strong><?php echo count($filtered); ?></strong><span>visible rows</span></div>
      <div class="pqlpl-metric"><strong><?php echo count(array_filter($filtered, function($row) { return (int)$row['parentid'] > 0; })); ?></strong><span>linked parent accounts</span></div>
      <div class="pqlpl-metric"><strong><?php echo count(array_filter($filtered, function($row) { return (int)$row['parentid'] <= 0; })); ?></strong><span>profile contacts only</span></div>
    </section>

    <section class="pqlpl-panel">
      <table class="pqlpl-table">
        <tr><th>Student</th><th>Parent / Guardian</th><th>Source</th><th>Messaging</th><th>Live Consent</th><th>Recording Consent</th><th>Updated</th><th>Notes</th></tr>
        <?php foreach ($filtered as $row): ?>
          <tr>
            <td><?php echo s((string)$row['student']); ?><br><span class="pqlpl-code">#<?php echo (int)$row['studentid']; ?> <?php echo s((string)$row['studentemail']); ?></span></td>
            <td>
              <?php if ((int)$row['parentid'] > 0): ?>
                <?php echo s((string)$row['parent']); ?><br><span class="pqlpl-code">#<?php echo (int)$row['parentid']; ?> <?php echo s((string)$row['parentemail']); ?></span>
              <?php else: ?>
                <?php echo s((string)$row['profileparent']); ?><br><span class="pqlpl-code"><?php echo s((string)$row['profilecontact']); ?></span>
              <?php endif; ?>
            </td>
            <td><span class="pqlpl-pill <?php echo (int)$row['parentid'] > 0 ? '' : 'pqlpl-pill--warn'; ?>"><?php echo s((string)$row['source']); ?></span></td>
            <td><?php echo s((string)$row['messaging']); ?><?php echo $row['free_text'] !== '' ? '<br><span class="pqlpl-code">free text: ' . s((string)$row['free_text']) . '</span>' : ''; ?><?php echo $row['parent_visible'] !== '' ? '<br><span class="pqlpl-code">parent visible: ' . s((string)$row['parent_visible']) . '</span>' : ''; ?></td>
            <td><?php echo s((string)$row['live_consent']); ?></td>
            <td><?php echo s((string)$row['recording_consent']); ?></td>
            <td><?php echo (int)$row['updated'] > 0 ? userdate((int)$row['updated'], get_string('strftimedatetimeshort')) : ''; ?></td>
            <td><span class="pqlpl-code"><?php echo s((string)$row['notes']); ?></span></td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$filtered): ?><tr><td colspan="8">No student parent links match these filters.</td></tr><?php endif; ?>
      </table>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
