<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

pqh_require_academy_operations('Only academy operations users can manage teaching workspaces.');

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspaces.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teaching Workspaces');
$PAGE->set_heading('Teaching Workspaces');
$PAGE->add_body_class('pqw-workspaces-page');

function pqw_clean_slug(string $value): string {
    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    return $slug !== '' ? substr($slug, 0, 120) : 'workspace-' . time();
}

function pqw_unique_slug(string $name): string {
    global $DB;
    $base = pqw_clean_slug($name);
    $slug = $base;
    $suffix = 1;
    while ($DB->record_exists('local_prequran_workspace', ['slug' => $slug])) {
        $suffix++;
        $slug = substr($base, 0, 112) . '-' . $suffix;
    }
    return $slug;
}

function pqw_normalize_domain(string $domain): string {
    $domain = strtolower(trim($domain));
    $domain = preg_replace('/^https?:\/\//', '', $domain) ?? '';
    $domain = preg_replace('/\/.*$/', '', $domain) ?? '';
    $domain = preg_replace('/:\d+$/', '', $domain) ?? '';
    $domain = trim($domain, " \t\n\r\0\x0B.");
    return $domain !== '' ? clean_param($domain, PARAM_HOST) : '';
}

function pqw_consumer_slug_available(string $slug, int $consumerid = 0): bool {
    global $DB;
    if ($slug === '' || !pqh_table_exists_safe('local_prequran_consumer')) {
        return false;
    }
    $existingid = (int)$DB->get_field('local_prequran_consumer', 'id', ['slug' => $slug], IGNORE_MISSING);
    return $existingid <= 0 || $existingid === $consumerid;
}

function pqw_json_array(string $json): array {
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function pqw_clean_hex_color(string $value): string {
    $value = trim($value);
    if (preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
        return strtolower($value);
    }
    return '';
}

function pqw_clean_url(string $value): string {
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    return clean_param($value, PARAM_URL);
}

function pqw_upsert_consumer_for_workspace(int $workspaceid, string $workspace_name, string $slug, int $ownerid, string $supportemail, array $branding = []): int {
    global $DB, $USER;

    if (!pqh_consumer_schema_ready()) {
        throw new invalid_parameter_exception('Consumer/domain tables are not ready. Run the local_prequran Moodle upgrade first.');
    }
    if ($workspaceid <= 0) {
        throw new invalid_parameter_exception('Workspace is required before creating a consumer.');
    }
    $slug = pqw_clean_slug($slug !== '' ? $slug : $workspace_name);
    if (!pqw_consumer_slug_available($slug)) {
        throw new invalid_parameter_exception('Consumer slug is already used.');
    }

    $now = time();
    $supportemail = clean_param($supportemail, PARAM_EMAIL);
    $existing = $DB->get_record('local_prequran_consumer', ['primaryworkspaceid' => $workspaceid], '*', IGNORE_MISSING);
    if ($supportemail === '' && $existing) {
        $supportemail = clean_param((string)($existing->supportemail ?? ''), PARAM_EMAIL);
    }
    $existingtheme = $existing ? pqw_json_array((string)($existing->themejson ?? '')) : [];
    $existingcopy = $existing ? pqw_json_array((string)($existing->copyjson ?? '')) : ['created_from' => 'workspaces_page'];
    $displayname = trim((string)($branding['displayname'] ?? ''));
    $displayname = $displayname !== '' ? clean_param($displayname, PARAM_TEXT) : (string)($existing->name ?? $workspace_name);
    $logourl = array_key_exists('logourl', $branding) ? pqw_clean_url((string)$branding['logourl']) : (string)($existing->logourl ?? '');
    $primarycolor = array_key_exists('primarycolor', $branding) ? pqw_clean_hex_color((string)$branding['primarycolor']) : (string)($existingtheme['primary_color'] ?? '');
    $accentcolor = array_key_exists('accentcolor', $branding) ? pqw_clean_hex_color((string)$branding['accentcolor']) : (string)($existingtheme['accent_color'] ?? '');
    $headline = array_key_exists('headline', $branding) ? trim(clean_param((string)$branding['headline'], PARAM_TEXT)) : (string)($existingcopy['landing_headline'] ?? '');
    $subtitle = array_key_exists('subtitle', $branding) ? trim(clean_param((string)$branding['subtitle'], PARAM_TEXT)) : (string)($existingcopy['landing_subtitle'] ?? '');
    $theme = $existingtheme;
    if ($primarycolor !== '') {
        $theme['primary_color'] = $primarycolor;
    }
    if ($accentcolor !== '') {
        $theme['accent_color'] = $accentcolor;
    }
    $copy = $existingcopy;
    if ($headline !== '') {
        $copy['landing_headline'] = $headline;
    }
    if ($subtitle !== '') {
        $copy['landing_subtitle'] = $subtitle;
    }
    $record = (object)[
        'slug' => $slug,
        'name' => $displayname,
        'consumer_type' => 'institution',
        'status' => 'active',
        'primaryworkspaceid' => $workspaceid,
        'owneruserid' => $ownerid,
        'supportemail' => $supportemail,
        'logourl' => $logourl,
        'themejson' => $theme ? json_encode($theme, JSON_UNESCAPED_SLASHES) : '',
        'copyjson' => json_encode($copy, JSON_UNESCAPED_SLASHES),
        'defaultpublicpath' => '/local/hubredirect/consumer_landing.php',
        'defaultdashboardpath' => '/local/hubredirect/workspace_dashboard.php',
        'emailfromname' => $displayname,
        'emailreplyto' => $supportemail,
        'createdby' => (int)$USER->id,
        'timemodified' => $now,
    ];
    if ($existing) {
        if (!pqw_consumer_slug_available($slug, (int)$existing->id)) {
            throw new invalid_parameter_exception('Consumer slug is already used.');
        }
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_consumer', $record);
        return (int)$existing->id;
    }

    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_consumer', $record);
}

function pqw_upsert_consumer_domain(int $consumerid, int $workspaceid, string $domain, string $domaintype, int $isprimary): void {
    global $DB, $USER;

    $domain = pqw_normalize_domain($domain);
    if ($domain === '') {
        return;
    }
    if (!in_array($domaintype, ['public', 'app'], true)) {
        $domaintype = 'public';
    }

    $now = time();
    $existing = $DB->get_record('local_prequran_consumer_domain', ['domain' => $domain], '*', IGNORE_MISSING);
    $record = (object)[
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'domain' => $domain,
        'domain_type' => $domaintype,
        'isprimary' => $isprimary,
        'sslstatus' => 'not_checked',
        'verificationstatus' => 'pending_dns',
        'verifiedat' => 0,
        'status' => 'active',
        'createdby' => (int)$USER->id,
        'timemodified' => $now,
    ];
    if ($existing) {
        if ((int)$existing->consumerid !== $consumerid) {
            throw new invalid_parameter_exception('Domain ' . $domain . ' is already assigned to another consumer.');
        }
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_consumer_domain', $record);
        return;
    }

    $record->timecreated = $now;
    $DB->insert_record('local_prequran_consumer_domain', $record);
}

function pqw_workspace_ownerid(int $workspaceid): int {
    global $DB;
    if ($workspaceid <= 0) {
        return 0;
    }
    return (int)$DB->get_field('local_prequran_workspace', 'ownerid', ['id' => $workspaceid], IGNORE_MISSING);
}

function pqw_find_user(string $needle): ?stdClass {
    global $DB, $CFG;
    $needle = trim($needle);
    if ($needle === '') {
        return null;
    }
    if (ctype_digit($needle)) {
        $user = core_user::get_user((int)$needle, '*', IGNORE_MISSING);
        return $user && empty($user->deleted) ? $user : null;
    }
    $user = $DB->get_record('user', [
        'email' => $needle,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MULTIPLE);
    if ($user) {
        return $user;
    }
    return $DB->get_record('user', [
        'username' => strtolower($needle),
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MULTIPLE) ?: null;
}

function pqw_upsert_member(int $workspaceid, int $userid, string $role, int $createdby): void {
    global $DB;
    $now = time();
    $existing = $DB->get_record('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ], '*', IGNORE_MISSING);
    $record = (object)[
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
        'status' => 'active',
        'notes' => '',
        'createdby' => $createdby,
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_workspace_member', $record);
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_workspace_member', $record);
}

$ready = pqh_table_exists_safe('local_prequran_workspace') && pqh_table_exists_safe('local_prequran_workspace_member');
$message = '';
$error = '';

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $action = optional_param('action', '', PARAM_ALPHANUMEXT);
    try {
        if ($action === 'create_workspace') {
            $name = trim(optional_param('name', '', PARAM_TEXT));
            $type = optional_param('workspace_type', 'solo_teacher', PARAM_ALPHANUMEXT);
            $ownerneedle = trim(optional_param('owner', '', PARAM_TEXT));
            $plan = trim(optional_param('plan_code', 'pilot', PARAM_ALPHANUMEXT));
            $consumerenabled = optional_param('provision_consumer', 0, PARAM_INT) === 1;
            $consumerslug = trim(optional_param('consumer_slug', '', PARAM_ALPHANUMEXT));
            $publicdomain = pqw_normalize_domain(optional_param('public_domain', '', PARAM_TEXT));
            $appdomain = pqw_normalize_domain(optional_param('app_domain', '', PARAM_TEXT));
            $supportemail = trim(optional_param('supportemail', '', PARAM_EMAIL));
            $branding = [
                'displayname' => trim(optional_param('display_name', '', PARAM_TEXT)),
                'logourl' => trim(optional_param('logo_url', '', PARAM_URL)),
                'primarycolor' => trim(optional_param('primary_color', '', PARAM_TEXT)),
                'accentcolor' => trim(optional_param('accent_color', '', PARAM_TEXT)),
                'headline' => trim(optional_param('landing_headline', '', PARAM_TEXT)),
                'subtitle' => trim(optional_param('landing_subtitle', '', PARAM_TEXT)),
            ];
            if ($name === '') {
                throw new invalid_parameter_exception('Workspace name is required.');
            }
            if (!array_key_exists($type, pqh_workspace_types())) {
                throw new invalid_parameter_exception('Invalid workspace type.');
            }
            $owner = $ownerneedle !== '' ? pqw_find_user($ownerneedle) : null;
            $ownerid = $owner ? (int)$owner->id : 0;
            $now = time();
            $workspaceid = (int)$DB->insert_record('local_prequran_workspace', (object)[
                'name' => $name,
                'slug' => pqw_unique_slug($name),
                'workspace_type' => $type,
                'ownerid' => $ownerid,
                'status' => 'active',
                'plan_code' => $plan !== '' ? $plan : 'pilot',
                'student_limit' => optional_param('student_limit', 0, PARAM_INT),
                'teacher_limit' => optional_param('teacher_limit', 0, PARAM_INT),
                'session_limit' => optional_param('session_limit', 0, PARAM_INT),
                'storage_limit_mb' => optional_param('storage_limit_mb', 0, PARAM_INT),
                'settingsjson' => json_encode(['created_from' => 'workspaces_page'], JSON_UNESCAPED_SLASHES),
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            if ($ownerid > 0) {
                pqw_upsert_member($workspaceid, $ownerid, 'owner', (int)$USER->id);
            }
            $consumerid = 0;
            if ($consumerenabled || $publicdomain !== '' || $appdomain !== '') {
                $consumerid = pqw_upsert_consumer_for_workspace($workspaceid, $name, $consumerslug, $ownerid, $supportemail, $branding);
                pqw_upsert_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1);
                pqw_upsert_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0);
            }
            $message = $consumerid > 0 ? 'Workspace and institution consumer created.' : 'Workspace created.';
        } else if ($action === 'add_member') {
            $workspaceid = optional_param('workspaceid', 0, PARAM_INT);
            $role = optional_param('workspace_role', 'teacher', PARAM_ALPHANUMEXT);
            $needle = trim(optional_param('member', '', PARAM_TEXT));
            if (!$DB->record_exists('local_prequran_workspace', ['id' => $workspaceid])) {
                throw new invalid_parameter_exception('Workspace was not found.');
            }
            if (!array_key_exists($role, pqh_workspace_roles())) {
                throw new invalid_parameter_exception('Invalid workspace role.');
            }
            $member = pqw_find_user($needle);
            if (!$member) {
                throw new invalid_parameter_exception('User was not found by ID, email, or username.');
            }
            pqw_upsert_member($workspaceid, (int)$member->id, $role, (int)$USER->id);
            $message = 'Workspace member added.';
        } else if ($action === 'update_consumer') {
            $workspaceid = optional_param('consumer_workspaceid', 0, PARAM_INT);
            $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
            if (!$workspace) {
                throw new invalid_parameter_exception('Workspace was not found.');
            }
            $consumerslug = trim(optional_param('consumer_slug_existing', '', PARAM_ALPHANUMEXT));
            $supportemail = trim(optional_param('supportemail_existing', '', PARAM_EMAIL));
            $publicdomain = pqw_normalize_domain(optional_param('public_domain_existing', '', PARAM_TEXT));
            $appdomain = pqw_normalize_domain(optional_param('app_domain_existing', '', PARAM_TEXT));
            $branding = [
                'displayname' => trim(optional_param('display_name_existing', '', PARAM_TEXT)),
                'logourl' => trim(optional_param('logo_url_existing', '', PARAM_URL)),
                'primarycolor' => trim(optional_param('primary_color_existing', '', PARAM_TEXT)),
                'accentcolor' => trim(optional_param('accent_color_existing', '', PARAM_TEXT)),
                'headline' => trim(optional_param('landing_headline_existing', '', PARAM_TEXT)),
                'subtitle' => trim(optional_param('landing_subtitle_existing', '', PARAM_TEXT)),
            ];
            $consumerid = pqw_upsert_consumer_for_workspace(
                $workspaceid,
                (string)$workspace->name,
                $consumerslug,
                pqw_workspace_ownerid($workspaceid),
                $supportemail,
                $branding
            );
            pqw_upsert_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1);
            pqw_upsert_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0);
            $message = 'Institution consumer and domains updated.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$workspaces = $ready ? array_values($DB->get_records_select(
    'local_prequran_workspace',
    "status <> ?",
    ['archived'],
    'name ASC',
    '*',
    0,
    200
)) : [];

$membercounts = [];
$recentmembers = [];
$workspaceconsumers = [];
$workspacedomains = [];
if ($ready && $workspaces) {
    $ids = array_map(static function(stdClass $workspace): int {
        return (int)$workspace->id;
    }, $workspaces);
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'pqw');
    $rows = $DB->get_records_sql(
        "SELECT workspaceid, COUNT(1) AS membercount
           FROM {local_prequran_workspace_member}
          WHERE workspaceid {$insql}
            AND status = :status
       GROUP BY workspaceid",
        $params + ['status' => 'active']
    );
    foreach ($rows as $row) {
        $membercounts[(int)$row->workspaceid] = (int)$row->membercount;
    }
    $members = $DB->get_records_sql(
        "SELECT wm.id, wm.workspaceid, wm.userid, wm.workspace_role, u.firstname, u.lastname, u.email
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid {$insql}
            AND wm.status = :status
       ORDER BY wm.timemodified DESC, wm.id DESC",
        $params + ['status' => 'active'],
        0,
        80
    );
    foreach ($members as $member) {
        $recentmembers[(int)$member->workspaceid][] = $member;
    }
    if (pqh_consumer_schema_ready()) {
        $consumers = $DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_consumer}
              WHERE primaryworkspaceid {$insql}
                AND status = :status
           ORDER BY id ASC",
            $params + ['status' => 'active']
        );
        foreach ($consumers as $consumer) {
            $workspaceconsumers[(int)$consumer->primaryworkspaceid] = $consumer;
        }
        $domains = $DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_consumer_domain}
              WHERE workspaceid {$insql}
                AND status = :status
           ORDER BY isprimary DESC, domain ASC",
            $params + ['status' => 'active']
        );
        foreach ($domains as $domain) {
            $workspacedomains[(int)$domain->workspaceid][] = $domain;
        }
    }
}

$editworkspaceid = optional_param('editworkspaceid', 0, PARAM_INT);
$editworkspace = $workspaces[0] ?? null;
if ($editworkspaceid > 0) {
    foreach ($workspaces as $candidateworkspace) {
        if ((int)$candidateworkspace->id === $editworkspaceid) {
            $editworkspace = $candidateworkspace;
            break;
        }
    }
}
$editconsumer = $editworkspace ? ($workspaceconsumers[(int)$editworkspace->id] ?? null) : null;
$editdomains = $editworkspace ? ($workspacedomains[(int)$editworkspace->id] ?? []) : [];
$editpublicdomain = '';
$editappdomain = '';
foreach ($editdomains as $editdomain) {
    if ((string)$editdomain->domain_type === 'public' && $editpublicdomain === '') {
        $editpublicdomain = (string)$editdomain->domain;
    }
    if ((string)$editdomain->domain_type === 'app' && $editappdomain === '') {
        $editappdomain = (string)$editdomain->domain;
    }
}
$edittheme = $editconsumer ? pqw_json_array((string)($editconsumer->themejson ?? '')) : [];
$editcopy = $editconsumer ? pqw_json_array((string)($editconsumer->copyjson ?? '')) : [];

echo $OUTPUT->header();
?>
<style>
body.pqw-workspaces-page header,body.pqw-workspaces-page footer,body.pqw-workspaces-page nav.navbar,body.pqw-workspaces-page #page-header,body.pqw-workspaces-page #page-footer,body.pqw-workspaces-page .drawer,body.pqw-workspaces-page .drawer-toggles,body.pqw-workspaces-page .block-region,body.pqw-workspaces-page [data-region="drawer"],body.pqw-workspaces-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-workspaces-page #page,body.pqw-workspaces-page #page-content,body.pqw-workspaces-page #region-main,body.pqw-workspaces-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqw-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqw-wrap{max-width:1280px;margin:0 auto}.pqw-top,.pqw-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqw-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqw-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqw-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqw-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqw-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqw-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqw-grid{display:grid;grid-template-columns:1.1fr .95fr .95fr;gap:14px;margin-bottom:14px}.pqw-field{display:grid;gap:5px;margin-bottom:10px}.pqw-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqw-input,.pqw-select{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800}.pqw-inline{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.pqw-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqw-alert--ok{background:#edf9ef;color:#245c35}.pqw-alert--bad{background:#fff0ed;color:#883526}.pqw-table{width:100%;border-collapse:separate;border-spacing:0}.pqw-table th,.pqw-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqw-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqw-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqw-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}.pqw-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqw-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}
@media(max-width:980px){.pqw-top,.pqw-grid,.pqw-inline{grid-template-columns:1fr}.pqw-actions{justify-content:flex-start}.pqw-table,.pqw-table tbody,.pqw-table tr,.pqw-table td{display:block;width:100%}.pqw-table thead{display:none}.pqw-table tr{border-bottom:1px solid rgba(23,48,68,.12)}.pqw-table td{border:0}.pqw-table td::before{content:attr(data-label);display:block;margin-bottom:4px;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqw-shell">
  <div class="pqw-wrap">
    <section class="pqw-top pqh-workspace-top">
      <div>
        <h1 class="pqw-title pqh-workspace-title">Teaching Workspaces</h1>
        <p class="pqw-sub pqh-workspace-sub">Create solo-teacher and institution workspaces, then attach owners, admins, teachers, parents, and students.</p>
      </div>
      <nav class="pqw-actions pqh-workspace-actions" aria-label="Workspace navigation">
        <a class="pqw-btn pqw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/institution_onboarding.php'))->out(false); ?>">Institution onboarding</a>
        <a class="pqw-btn pqw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Live admin</a>
        <a class="pqw-btn pqw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqw-alert pqw-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqw-alert pqw-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if (!$ready): ?>
      <div class="pqw-empty">Workspace tables are not ready. Run the Moodle plugin upgrade for local_prequran first.</div>
    <?php else: ?>
      <section class="pqw-grid">
        <form class="pqw-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="create_workspace">
          <h2>Create Workspace</h2>
          <div class="pqw-field"><label>Name</label><input class="pqw-input" name="name" required placeholder="Teacher name, masjid, school, or institute"></div>
          <div class="pqw-field"><label>Type</label><select class="pqw-select" name="workspace_type"><?php foreach (pqh_workspace_types() as $key => $label): ?><option value="<?php echo s($key); ?>" <?php echo $key === 'institution' ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field"><label>Owner user ID, email, or username</label><input class="pqw-input" name="owner" placeholder="optional"></div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Plan</label><input class="pqw-input" name="plan_code" value="pilot"></div>
            <div class="pqw-field"><label>Students</label><input class="pqw-input" type="number" name="student_limit" min="0" value="0"></div>
            <div class="pqw-field"><label>Teachers</label><input class="pqw-input" type="number" name="teacher_limit" min="0" value="0"></div>
            <div class="pqw-field"><label>Sessions</label><input class="pqw-input" type="number" name="session_limit" min="0" value="0"></div>
          </div>
          <h3>Institution consumer and domains</h3>
          <div class="pqw-field"><label><input type="checkbox" name="provision_consumer" value="1"> Create linked institution consumer</label></div>
          <div class="pqw-field"><label>Consumer slug</label><input class="pqw-input" name="consumer_slug" placeholder="auto from workspace name"></div>
          <div class="pqw-field"><label>Display name</label><input class="pqw-input" name="display_name" placeholder="public institution name"></div>
          <div class="pqw-field"><label>Logo URL</label><input class="pqw-input" name="logo_url" placeholder="https://example.org/logo.png"></div>
          <div class="pqw-field"><label>Support email</label><input class="pqw-input" type="email" name="supportemail" placeholder="support@example.org"></div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Primary color</label><input class="pqw-input" name="primary_color" placeholder="#2f6f4e"></div>
            <div class="pqw-field"><label>Accent color</label><input class="pqw-input" name="accent_color" placeholder="#d99a26"></div>
          </div>
          <div class="pqw-field"><label>Landing headline</label><input class="pqw-input" name="landing_headline" placeholder="optional custom headline"></div>
          <div class="pqw-field"><label>Landing subtitle</label><input class="pqw-input" name="landing_subtitle" placeholder="optional custom subtitle"></div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Public domain</label><input class="pqw-input" name="public_domain" placeholder="school.example.org"></div>
            <div class="pqw-field"><label>App domain</label><input class="pqw-input" name="app_domain" placeholder="app.school.example.org"></div>
          </div>
          <button class="pqw-btn" type="submit">Create workspace</button>
        </form>

        <form class="pqw-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="update_consumer">
          <h2>Update Institution Consumer</h2>
          <div class="pqw-field"><label>Workspace</label><select class="pqw-select" name="consumer_workspaceid"><?php foreach ($workspaces as $workspace): ?><option value="<?php echo (int)$workspace->id; ?>" <?php echo $editworkspace && (int)$workspace->id === (int)$editworkspace->id ? 'selected' : ''; ?>><?php echo s($workspace->name . ' #' . $workspace->id); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field"><label>Consumer slug</label><input class="pqw-input" name="consumer_slug_existing" value="<?php echo s((string)($editconsumer->slug ?? '')); ?>" placeholder="auto from workspace name"></div>
          <div class="pqw-field"><label>Display name</label><input class="pqw-input" name="display_name_existing" value="<?php echo s((string)($editconsumer->name ?? ($editworkspace->name ?? ''))); ?>" placeholder="public institution name"></div>
          <div class="pqw-field"><label>Logo URL</label><input class="pqw-input" name="logo_url_existing" value="<?php echo s((string)($editconsumer->logourl ?? '')); ?>" placeholder="https://example.org/logo.png"></div>
          <div class="pqw-field"><label>Support email</label><input class="pqw-input" type="email" name="supportemail_existing" value="<?php echo s((string)($editconsumer->supportemail ?? '')); ?>" placeholder="support@example.org"></div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Primary color</label><input class="pqw-input" name="primary_color_existing" value="<?php echo s((string)($edittheme['primary_color'] ?? '')); ?>" placeholder="#2f6f4e"></div>
            <div class="pqw-field"><label>Accent color</label><input class="pqw-input" name="accent_color_existing" value="<?php echo s((string)($edittheme['accent_color'] ?? '')); ?>" placeholder="#d99a26"></div>
          </div>
          <div class="pqw-field"><label>Landing headline</label><input class="pqw-input" name="landing_headline_existing" value="<?php echo s((string)($editcopy['landing_headline'] ?? '')); ?>" placeholder="optional custom headline"></div>
          <div class="pqw-field"><label>Landing subtitle</label><input class="pqw-input" name="landing_subtitle_existing" value="<?php echo s((string)($editcopy['landing_subtitle'] ?? '')); ?>" placeholder="optional custom subtitle"></div>
          <div class="pqw-field"><label>Public domain</label><input class="pqw-input" name="public_domain_existing" value="<?php echo s($editpublicdomain); ?>" placeholder="school.example.org"></div>
          <div class="pqw-field"><label>App domain</label><input class="pqw-input" name="app_domain_existing" value="<?php echo s($editappdomain); ?>" placeholder="app.school.example.org"></div>
          <button class="pqw-btn" type="submit">Save consumer/domain</button>
        </form>

        <form class="pqw-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="add_member">
          <h2>Add Member</h2>
          <div class="pqw-field"><label>Workspace</label><select class="pqw-select" name="workspaceid"><?php foreach ($workspaces as $workspace): ?><option value="<?php echo (int)$workspace->id; ?>"><?php echo s($workspace->name . ' #' . $workspace->id); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field"><label>User ID, email, or username</label><input class="pqw-input" name="member" required></div>
          <div class="pqw-field"><label>Role</label><select class="pqw-select" name="workspace_role"><?php foreach (pqh_workspace_roles() as $key => $label): ?><option value="<?php echo s($key); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <button class="pqw-btn" type="submit">Add member</button>
        </form>
      </section>

      <section class="pqw-panel">
        <h2>Active Workspaces</h2>
        <?php if (!$workspaces): ?>
          <div class="pqw-empty">No workspaces found.</div>
        <?php else: ?>
          <table class="pqw-table">
            <thead><tr><th>Workspace</th><th>Type and Plan</th><th>Consumer / Domains</th><th>Limits</th><th>Members</th><th>Recent Members</th></tr></thead>
            <tbody>
              <?php foreach ($workspaces as $workspace): ?>
                <?php $consumer = $workspaceconsumers[(int)$workspace->id] ?? null; ?>
                <tr>
                  <td data-label="Workspace"><span class="pqw-name"><?php echo s($workspace->name); ?></span><span class="pqw-muted">#<?php echo (int)$workspace->id; ?> / <?php echo s($workspace->slug); ?></span><a class="pqw-btn pqw-btn--light" style="margin-top:8px" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => (int)$workspace->id]))->out(false); ?>">Open dashboard</a> <a class="pqw-btn pqw-btn--light" style="margin-top:8px" href="<?php echo (new moodle_url('/local/hubredirect/institution_settings.php', ['workspaceid' => (int)$workspace->id]))->out(false); ?>">Institution settings</a> <a class="pqw-btn pqw-btn--light" style="margin-top:8px" href="<?php echo (new moodle_url('/local/hubredirect/workspaces.php', ['editworkspaceid' => (int)$workspace->id]))->out(false); ?>">Quick edit</a></td>
                  <td data-label="Type and Plan"><span class="pqw-pill"><?php echo s(pqh_workspace_types()[$workspace->workspace_type] ?? $workspace->workspace_type); ?></span><span class="pqw-pill"><?php echo s($workspace->plan_code); ?></span><span class="pqw-muted">Status: <?php echo s($workspace->status); ?></span></td>
                  <td data-label="Consumer / Domains">
                    <?php if ($consumer): ?>
                      <span class="pqw-name"><?php echo s((string)$consumer->name); ?></span>
                      <span class="pqw-muted"><?php echo s((string)$consumer->slug); ?> / <?php echo s((string)$consumer->consumer_type); ?></span>
                      <?php $theme = pqw_json_array((string)($consumer->themejson ?? '')); ?>
                      <?php $copy = pqw_json_array((string)($consumer->copyjson ?? '')); ?>
                      <?php if (trim((string)($consumer->logourl ?? '')) !== ''): ?><span class="pqw-muted">Logo: <?php echo s((string)$consumer->logourl); ?></span><?php endif; ?>
                      <?php if (!empty($theme['primary_color']) || !empty($theme['accent_color'])): ?><span class="pqw-muted">Colors: <?php echo s((string)($theme['primary_color'] ?? '')); ?> <?php echo s((string)($theme['accent_color'] ?? '')); ?></span><?php endif; ?>
                      <?php if (!empty($copy['landing_headline'])): ?><span class="pqw-muted">Headline: <?php echo s((string)$copy['landing_headline']); ?></span><?php endif; ?>
                      <a class="pqw-btn pqw-btn--light" style="margin-top:8px" href="<?php echo (new moodle_url('/local/hubredirect/consumer_diagnostics.php', ['consumer' => (string)$consumer->slug]))->out(false); ?>">Diagnostics</a>
                      <?php foreach ($workspacedomains[(int)$workspace->id] ?? [] as $domain): ?>
                        <span class="pqw-pill"><?php echo s((string)$domain->domain); ?> - <?php echo s((string)$domain->domain_type); ?> / <?php echo s((string)$domain->verificationstatus); ?></span>
                      <?php endforeach; ?>
                    <?php else: ?>
                      <span class="pqw-muted">No linked consumer yet</span>
                    <?php endif; ?>
                  </td>
                  <td data-label="Limits"><span class="pqw-muted">Students: <?php echo (int)$workspace->student_limit; ?>, teachers: <?php echo (int)$workspace->teacher_limit; ?>, sessions: <?php echo (int)$workspace->session_limit; ?></span></td>
                  <td data-label="Members"><span class="pqw-name"><?php echo (int)($membercounts[(int)$workspace->id] ?? 0); ?></span><span class="pqw-muted">active members</span></td>
                  <td data-label="Recent Members">
                    <?php foreach (array_slice($recentmembers[(int)$workspace->id] ?? [], 0, 5) as $member): ?>
                      <span class="pqw-pill"><?php echo s(fullname($member) . ' - ' . ($member->workspace_role ?? 'member')); ?></span>
                    <?php endforeach; ?>
                    <?php if (empty($recentmembers[(int)$workspace->id])): ?><span class="pqw-muted">No members yet</span><?php endif; ?>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
