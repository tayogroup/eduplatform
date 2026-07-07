<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');

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
        'Only workspace owners and admins can open the institution test matrix.',
        new moodle_url($workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/platform_consumers.php', $urlparams),
        'Institution test matrix access required'
    );
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'Choose a valid workspace before opening the institution test matrix.',
        new moodle_url('/local/hubredirect/platform_consumers.php'),
        'Institution test matrix unavailable'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_test_matrix.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution Test Matrix');
$PAGE->set_heading('Institution Test Matrix');
$PAGE->add_body_class('pqitm-page');

function pqitm_domain_url(string $domain, string $path, array $params): moodle_url {
    $domain = pqh_normalize_consumer_host($domain);
    if ($domain === '') {
        return new moodle_url($path, $params);
    }
    return new moodle_url('https://' . $domain . '/' . ltrim($path, '/'), $params);
}

function pqitm_count(string $table, array $conditions): int {
    global $DB;
    if (!pqh_table_exists_safe($table)) {
        return 0;
    }
    foreach (array_keys($conditions) as $field) {
        if (!pqh_table_has_field_safe($table, $field)) {
            return 0;
        }
    }
    return (int)$DB->count_records($table, $conditions);
}

function pqitm_member_count(int $workspaceid, string $role): int {
    return pqitm_count('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'workspace_role' => $role,
        'status' => 'active',
    ]);
}

function pqitm_first_member(int $workspaceid, array $roles): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member') || !$roles) {
        return 0;
    }
    [$insql, $params] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'role');
    $params['workspaceid'] = $workspaceid;
    $params['status'] = 'active';
    return (int)$DB->get_field_sql(
        "SELECT userid
           FROM {local_prequran_workspace_member}
          WHERE workspaceid = :workspaceid
            AND status = :status
            AND workspace_role {$insql}
       ORDER BY timemodified DESC, id DESC",
        $params,
        IGNORE_MULTIPLE
    );
}

function pqitm_first_session(int $workspaceid): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_session') || !pqh_table_has_field_safe('local_prequran_live_session', 'workspaceid')) {
        return 0;
    }
    return (int)$DB->get_field('local_prequran_live_session', 'id', ['workspaceid' => $workspaceid], IGNORE_MULTIPLE);
}

$primarydomain = (string)($consumercontext->domain ?? '');
$domains = pqhi_consumer_domains($workspaceid, (int)($consumercontext->consumerid ?? 0));
foreach ($domains as $domain) {
    if ((int)($domain->isprimary ?? 0) === 1) {
        $primarydomain = (string)$domain->domain;
        break;
    }
}
$consumerparams = $urlparams;
$studentid = pqitm_first_member($workspaceid, ['student']);
$teacherid = pqitm_first_member($workspaceid, ['teacher', 'assistant_teacher', 'owner', 'admin']);
$parentid = pqitm_first_member($workspaceid, ['parent']);
$sessionid = pqitm_first_session($workspaceid);
$checks = [
    'Institution consumer resolves' => !empty($consumercontext->trusted_domain) || !empty($consumercontext->consumerid),
    'Custom domain configured' => $primarydomain !== '',
    'Active institution admin/owner' => pqitm_member_count($workspaceid, 'owner') + pqitm_member_count($workspaceid, 'admin') > 0,
    'Active teacher' => pqitm_member_count($workspaceid, 'teacher') + pqitm_member_count($workspaceid, 'assistant_teacher') > 0,
    'Active parent' => pqitm_member_count($workspaceid, 'parent') > 0,
    'Active student' => pqitm_member_count($workspaceid, 'student') > 0,
    'Live sessions scoped' => pqitm_count('local_prequran_live_session', ['workspaceid' => $workspaceid]) > 0,
    'Materials scoped' => pqitm_count('local_prequran_workspace_material', ['workspaceid' => $workspaceid, 'status' => 'active']) > 0,
];
$matrix = [
    [
        'role' => 'Guest',
        'account' => 'Not logged in / incognito',
        'links' => [
            ['Landing', pqitm_domain_url($primarydomain, '/local/hubredirect/consumer_landing.php', $consumerparams)],
            ['Public profile', pqitm_domain_url($primarydomain, '/local/hubredirect/institution_profile.php', $consumerparams)],
            ['Contact form', pqitm_domain_url($primarydomain, '/local/hubredirect/institution_profile.php', $consumerparams)],
            ['Student intake', pqitm_domain_url($primarydomain, '/local/hubredirect/public_intake.php', $consumerparams)],
        ],
        'expected' => 'Public pages load under the institution domain and do not expose Moodle admin UI.',
    ],
    [
        'role' => 'Institution admin',
        'account' => 'Workspace owner/admin account',
        'links' => [
            ['Workspace dashboard', pqitm_domain_url($primarydomain, '/local/hubredirect/workspace_dashboard.php', $consumerparams)],
            ['People', pqitm_domain_url($primarydomain, '/local/hubredirect/workspace_people.php', $consumerparams)],
            ['Validation data', pqitm_domain_url($primarydomain, '/local/hubredirect/institution_sample_data.php', $consumerparams)],
            ['Reports', pqitm_domain_url($primarydomain, '/local/hubredirect/workspace_reports.php', $consumerparams)],
        ],
        'expected' => 'Can manage people, seed validation data, manage sessions/materials, and view reports.',
    ],
    [
        'role' => 'Teacher',
        'account' => $teacherid > 0 ? 'Teacher user #' . $teacherid : 'Create/assign a teacher first',
        'links' => [
            ['Teacher workspace', pqitm_domain_url($primarydomain, '/local/hubredirect/live_teacher.php', $consumerparams)],
            ['Live sessions', pqitm_domain_url($primarydomain, '/local/hubredirect/live_sessions.php', $consumerparams)],
            ['Review sample session', pqitm_domain_url($primarydomain, '/local/hubredirect/live_review.php', $consumerparams + ['sessionid' => $sessionid])],
        ],
        'expected' => 'Teacher sees scoped students/classes and cannot manage unrelated workspaces.',
    ],
    [
        'role' => 'Parent',
        'account' => $parentid > 0 ? 'Parent user #' . $parentid : 'Create/link a parent first',
        'links' => [
            ['Parent view', pqitm_domain_url($primarydomain, '/local/hubredirect/workspace_parent.php', $consumerparams)],
            ['Live trust', pqitm_domain_url($primarydomain, '/local/hubredirect/live_trust.php', $consumerparams + ['childid' => $studentid])],
            ['Recordings', pqitm_domain_url($primarydomain, '/local/hubredirect/live_recordings.php', $consumerparams + ['childid' => $studentid])],
        ],
        'expected' => 'Parent only sees linked child records, recordings, notes, and safety/trust pages.',
    ],
    [
        'role' => 'Student',
        'account' => $studentid > 0 ? 'Student user #' . $studentid : 'Create/assign a student first',
        'links' => [
            ['Student workspace', pqitm_domain_url($primarydomain, '/local/hubredirect/workspace_student.php', $consumerparams + ['studentid' => $studentid])],
            ['Live sessions', pqitm_domain_url($primarydomain, '/local/hubredirect/live_sessions.php', $consumerparams)],
            ['Materials', pqitm_domain_url($primarydomain, '/local/hubredirect/workspace_materials_files.php', $consumerparams + ['studentid' => $studentid])],
        ],
        'expected' => 'Student sees own profile, sessions, materials, and no admin controls.',
    ],
    [
        'role' => 'Platform admin',
        'account' => 'EduPlatform / site admin',
        'links' => [
            ['Platform consumers', new moodle_url('/local/hubredirect/platform_consumers.php')],
            ['Consumer diagnostics', new moodle_url('/local/hubredirect/consumer_diagnostics.php', ['consumer' => (string)($consumercontext->consumerslug ?? '')])],
            ['Institution settings', new moodle_url('/local/hubredirect/institution_settings.php', $consumerparams)],
        ],
        'expected' => 'Can manage all institution consumers, domains, workspace status, settings, and diagnostics.',
    ],
];
$domainmatrix = [
    'eduplatform.ai' => 'EduPlatform foundation',
    'quraantest.academy' => 'Quraan Academy app/test consumer',
    'quraanacademy.info' => 'Huda-school institution consumer',
    'edufortomorrow.com' => 'EduForTomorrow marketplace consumer',
];
$domainrows = [];
foreach ($domainmatrix as $domain => $expected) {
    $context = pqh_resolve_consumer_context($domain);
    $slug = (string)($context->consumerslug ?? '');
    $workspace = (int)($context->workspaceid ?? 0);
    $params = [];
    if ($slug !== '') {
        $params['consumer'] = $slug;
    }
    if ($workspace > 0) {
        $params['workspaceid'] = $workspace;
    }
    $domainrows[] = [
        'domain' => $domain,
        'expected' => $expected,
        'consumer' => (string)($context->consumername ?? ''),
        'slug' => $slug,
        'trusted' => !empty($context->trusted_domain),
        'workspace' => $workspace,
        'type' => (string)($context->domain_type ?? ''),
        'links' => [
            ['Probe', pqitm_domain_url($domain, '/local/hubredirect/consumer_probe.php', [])],
            ['Public', pqitm_domain_url($domain, (string)($context->defaultpublicpath ?? '/'), $params)],
            ['Login', pqitm_domain_url($domain, '/local/hubredirect/consumer_login.php', $params)],
            ['Dashboard', pqitm_domain_url($domain, (string)($context->defaultdashboardpath ?? '/local/hubredirect/dashboard.php'), $params)],
            ['Expired session', pqitm_domain_url($domain, '/local/hubredirect/session_expired.php', $params)],
            ['Invalid access', pqitm_domain_url($domain, '/local/hubredirect/access_denied.php', $params + ['title' => 'Invalid test access', 'message' => 'This verifies branded access handling.'])],
        ],
    ];
}

echo $OUTPUT->header();
?>
<style>
body.pqitm-page header,body.pqitm-page footer,body.pqitm-page nav.navbar,body.pqitm-page #page-header,body.pqitm-page #page-footer,body.pqitm-page .drawer,body.pqitm-page .drawer-toggles,body.pqitm-page .block-region,body.pqitm-page [data-region="drawer"],body.pqitm-page [data-region="right-hand-drawer"]{display:none!important}
body.pqitm-page #page,body.pqitm-page #page-content,body.pqitm-page #region-main,body.pqitm-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqitm-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqitm-wrap{max-width:1240px;margin:0 auto}.pqitm-top,.pqitm-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqitm-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqitm-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqitm-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqitm-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqitm-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 11px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:12px;font-weight:950;cursor:pointer}.pqitm-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqitm-checks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqitm-check{padding:12px;border-radius:8px;border:1px solid rgba(23,48,68,.12);background:#fff}.pqitm-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqitm-pill--ok{background:#edf9ef;color:#245c35}.pqitm-pill--bad{background:#fff0ed;color:#883526}.pqitm-table{width:100%;border-collapse:separate;border-spacing:0}.pqitm-table th,.pqitm-table td{padding:12px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqitm-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqitm-role{display:block;color:#221b22;font-size:15px;font-weight:950}.pqitm-muted{display:block;margin-top:4px;color:#728391;font-size:12px;font-weight:800}.pqitm-links{display:flex;gap:6px;flex-wrap:wrap}
@media(max-width:920px){.pqitm-top,.pqitm-checks{grid-template-columns:1fr}.pqitm-actions{justify-content:flex-start}.pqitm-table,.pqitm-table tbody,.pqitm-table tr,.pqitm-table td{display:block;width:100%}.pqitm-table thead{display:none}.pqitm-table tr{border-bottom:1px solid rgba(23,48,68,.12)}.pqitm-table td{border:0}.pqitm-table td::before{content:attr(data-label);display:block;margin-bottom:4px;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqitm-shell">
  <div class="pqitm-wrap">
    <section class="pqitm-top">
      <div>
        <h1 class="pqitm-title"><?php echo s($workspace->name); ?> Test Matrix</h1>
        <p class="pqitm-sub">Role-by-role validation for <?php echo s($primarydomain !== '' ? $primarydomain : $CFG->wwwroot); ?>.</p>
      </div>
      <nav class="pqitm-actions">
        <a class="pqitm-btn pqitm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $consumerparams))->out(false); ?>">Workspace</a>
        <a class="pqitm-btn pqitm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/institution_sample_data.php', $consumerparams))->out(false); ?>">Validation data</a>
        <a class="pqitm-btn pqitm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/platform_consumers.php'))->out(false); ?>">Platform consumers</a>
      </nav>
    </section>
    <section class="pqitm-checks">
      <?php foreach ($checks as $label => $ok): ?>
        <div class="pqitm-check"><span class="pqitm-pill <?php echo $ok ? 'pqitm-pill--ok' : 'pqitm-pill--bad'; ?>"><?php echo $ok ? 'PASS' : 'CHECK'; ?></span><span class="pqitm-muted"><?php echo s($label); ?></span></div>
      <?php endforeach; ?>
    </section>
    <section class="pqitm-panel" style="margin-bottom:14px">
      <h2 class="pqitm-title" style="font-size:22px;margin-bottom:10px">Domain Test Matrix</h2>
      <table class="pqitm-table">
        <thead><tr><th>Domain</th><th>Expected app</th><th>Resolved consumer</th><th>Status</th><th>Test links</th></tr></thead>
        <tbody>
          <?php foreach ($domainrows as $row): ?>
            <tr>
              <td data-label="Domain"><span class="pqitm-role"><?php echo s($row['domain']); ?></span><span class="pqitm-muted">domain type: <?php echo s($row['type']); ?></span></td>
              <td data-label="Expected app"><?php echo s($row['expected']); ?></td>
              <td data-label="Resolved consumer"><?php echo s($row['consumer']); ?><span class="pqitm-muted"><?php echo s($row['slug']); ?> / workspace #<?php echo (int)$row['workspace']; ?></span></td>
              <td data-label="Status"><span class="pqitm-pill <?php echo $row['trusted'] ? 'pqitm-pill--ok' : 'pqitm-pill--bad'; ?>"><?php echo $row['trusted'] ? 'trusted' : 'not trusted'; ?></span></td>
              <td data-label="Test links"><div class="pqitm-links"><?php foreach ($row['links'] as $link): ?><a class="pqitm-btn pqitm-btn--light" href="<?php echo $link[1]->out(false); ?>"><?php echo s($link[0]); ?></a><?php endforeach; ?></div></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
    <section class="pqitm-panel">
      <table class="pqitm-table">
        <thead><tr><th>Role</th><th>Account</th><th>Test links</th><th>Expected result</th></tr></thead>
        <tbody>
          <?php foreach ($matrix as $row): ?>
            <tr>
              <td data-label="Role"><span class="pqitm-role"><?php echo s($row['role']); ?></span></td>
              <td data-label="Account"><?php echo s($row['account']); ?></td>
              <td data-label="Test links"><div class="pqitm-links"><?php foreach ($row['links'] as $link): ?><a class="pqitm-btn pqitm-btn--light" href="<?php echo $link[1]->out(false); ?>"><?php echo s($link[0]); ?></a><?php endforeach; ?></div></td>
              <td data-label="Expected result"><?php echo s($row['expected']); ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
