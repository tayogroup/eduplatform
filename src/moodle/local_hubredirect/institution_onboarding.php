<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/institutionlib.php');

pqh_require_platform_operations('Only platform administrators can create institution workspaces.');

$message = '';
$error = '';
$created = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the institution onboarding wizard and try again.',
            new moodle_url('/local/hubredirect/institution_onboarding.php'),
            'Institution onboarding form expired'
        );
    }
    try {
        if (!pqh_table_exists_safe('local_prequran_workspace') || !pqh_table_exists_safe('local_prequran_workspace_member') || !pqh_consumer_schema_ready()) {
            throw new invalid_parameter_exception('Workspace and consumer tables are not ready.');
        }
        $name = trim(optional_param('name', '', PARAM_TEXT));
        $slug = pqhi_clean_slug(optional_param('slug', $name, PARAM_ALPHANUMEXT));
        $adminneedle = trim(optional_param('adminuser', '', PARAM_TEXT));
        $publicdomain = pqhi_normalize_domain(optional_param('publicdomain', '', PARAM_TEXT));
        $appdomain = pqhi_normalize_domain(optional_param('appdomain', '', PARAM_TEXT));
        if ($name === '') {
            throw new invalid_parameter_exception('Institution name is required.');
        }
        $admin = pqhi_find_user($adminneedle);
        if (!$admin || !empty($admin->deleted) || !empty($admin->suspended)) {
            throw new invalid_parameter_exception('Choose an active Moodle user for the first institution admin.');
        }
        $now = time();
        $settings = [
            'created_from' => 'institution_onboarding',
            'initial_courses' => trim(optional_param('initialcourses', 'Pre-Quraan', PARAM_TEXT)),
            'default_public_domain' => $publicdomain,
            'default_app_domain' => $appdomain,
        ];
        $workspaceid = (int)$DB->insert_record('local_prequran_workspace', pqhi_record_for_existing_columns('local_prequran_workspace', (object)[
            'name' => $name,
            'slug' => pqhi_unique_workspace_slug($slug),
            'workspace_type' => 'institution',
            'ownerid' => (int)$admin->id,
            'status' => 'active',
            'plan_code' => trim(optional_param('plancode', 'pilot', PARAM_ALPHANUMEXT)) ?: 'pilot',
            'student_limit' => optional_param('studentlimit', 0, PARAM_INT),
            'teacher_limit' => optional_param('teacherlimit', 0, PARAM_INT),
            'session_limit' => optional_param('sessionlimit', 0, PARAM_INT),
            'storage_limit_mb' => optional_param('storagelimit', 0, PARAM_INT),
            'settingsjson' => json_encode($settings, JSON_UNESCAPED_SLASHES),
            'createdby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ]));
        $consumerid = pqhi_upsert_consumer($workspaceid, $name, $slug, (int)$admin->id, [
            'supportemail' => trim(optional_param('supportemail', '', PARAM_EMAIL)),
            'logourl' => trim(optional_param('logourl', '', PARAM_URL)),
            'brand_initials' => trim(optional_param('brandinitials', '', PARAM_TEXT)),
            'primary_color' => trim(optional_param('primarycolor', '#2f6f4e', PARAM_TEXT)),
            'accent_color' => trim(optional_param('accentcolor', '#d99a26', PARAM_TEXT)),
            'surface_color' => trim(optional_param('surfacecolor', '#f4f8fb', PARAM_TEXT)),
            'landing_headline' => trim(optional_param('headline', $name, PARAM_TEXT)),
            'landing_subtitle' => trim(optional_param('subtitle', '', PARAM_TEXT)),
            'landing_body' => trim(optional_param('bodycopy', '', PARAM_TEXT)),
            'hero_image_url' => trim(optional_param('heroimage', '', PARAM_URL)),
            'initial_courses' => (string)$settings['initial_courses'],
        ], (int)$USER->id);
        pqhi_upsert_workspace_member($workspaceid, (int)$admin->id, 'owner', (int)$USER->id, 'Created by institution onboarding wizard.');
        pqhi_upsert_workspace_member($workspaceid, (int)$admin->id, 'admin', (int)$USER->id, 'Created by institution onboarding wizard.');
        if ($publicdomain !== '') {
            pqhi_upsert_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1, (int)$USER->id);
        }
        if ($appdomain !== '' && $appdomain !== $publicdomain) {
            pqhi_upsert_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0, (int)$USER->id);
        }
        $created = [
            'workspaceid' => $workspaceid,
            'consumerid' => $consumerid,
            'slug' => $slug,
            'adminname' => fullname($admin),
        ];
        $message = 'Institution workspace created.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$institutions = [];
if (pqh_table_exists_safe('local_prequran_workspace')) {
    $institutions = array_values($DB->get_records_select(
        'local_prequran_workspace',
        "workspace_type = ? AND status <> ?",
        ['institution', 'archived'],
        'timemodified DESC',
        '*',
        0,
        20
    ));
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_onboarding.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution Onboarding');
$PAGE->set_heading('Institution Onboarding');
$PAGE->add_body_class('pqhib-page');

echo $OUTPUT->header();
?>
<style>
body.pqhib-page header,body.pqhib-page footer,body.pqhib-page nav.navbar,body.pqhib-page #page-header,body.pqhib-page #page-footer,body.pqhib-page .drawer,body.pqhib-page .drawer-toggles,body.pqhib-page .block-region,body.pqhib-page [data-region="drawer"],body.pqhib-page [data-region="right-hand-drawer"]{display:none!important}
body.pqhib-page #page,body.pqhib-page #page-content,body.pqhib-page #region-main,body.pqhib-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhib-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqhib-wrap{max-width:1180px;margin:0 auto}.pqhib-top,.pqhib-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqhib-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqhib-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqhib-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqhib-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqhib-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqhib-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqhib-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.pqhib-formgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pqhib-field{display:grid;gap:5px;margin-bottom:10px}.pqhib-field--wide{grid-column:1/-1}.pqhib-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqhib-input,.pqhib-textarea{width:100%;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqhib-input{min-height:40px}.pqhib-textarea{min-height:88px;padding-top:10px}.pqhib-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqhib-alert--ok{background:#edf9ef;color:#245c35}.pqhib-alert--bad{background:#fff0ed;color:#883526}.pqhib-list{display:grid;gap:10px}.pqhib-row{padding:12px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fbfdff}.pqhib-row strong{display:block;color:#221b22}.pqhib-muted{display:block;margin-top:4px;color:#5e7280;font-size:12px;font-weight:800}.pqhib-step{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;margin-bottom:12px}.pqhib-step span:first-child{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:#edf9ef;color:#245c35;font-weight:950}.pqhib-step strong{display:block;color:#221b22}.pqhib-step em{display:block;color:#5e7280;font-style:normal;font-size:12px;font-weight:800}.pqhib-created{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
@media(max-width:900px){.pqhib-top,.pqhib-grid,.pqhib-formgrid{grid-template-columns:1fr}.pqhib-actions{justify-content:flex-start}}
<?php echo pqh_workspace_header_css(); ?>
</style>
<main class="pqhib-shell">
  <div class="pqhib-wrap">
    <section class="pqhib-top pqh-workspace-top">
      <div>
        <h1 class="pqhib-title pqh-workspace-title">Institution Onboarding</h1>
        <p class="pqhib-sub pqh-workspace-sub">Create the institution consumer, domain rows, workspace, first admin, defaults, landing page, and initial courses.</p>
      </div>
      <nav class="pqhib-actions pqh-workspace-actions" aria-label="Institution onboarding navigation">
        <a class="pqhib-btn pqhib-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/platform_consumers.php'))->out(false); ?>">Consumers</a>
        <a class="pqhib-btn pqhib-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
        <a class="pqhib-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqhib-alert pqhib-alert--ok"><?php echo s($message); ?>
      <?php if ($created): ?><div class="pqhib-created">
        <a class="pqhib-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['consumer' => $created['slug'], 'workspaceid' => $created['workspaceid']]))->out(false); ?>">Open workspace</a>
        <a class="pqhib-btn pqhib-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/institution_settings.php', ['consumer' => $created['slug'], 'workspaceid' => $created['workspaceid']]))->out(false); ?>">Settings</a>
        <a class="pqhib-btn pqhib-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/consumer_landing.php', ['consumer' => $created['slug'], 'workspaceid' => $created['workspaceid']]))->out(false); ?>">Landing</a>
      </div><?php endif; ?>
    </div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqhib-alert pqhib-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <section class="pqhib-grid">
      <form class="pqhib-panel" method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <div class="pqhib-formgrid">
          <div class="pqhib-field"><label>Institution name</label><input class="pqhib-input" name="name" required></div>
          <div class="pqhib-field"><label>Consumer slug</label><input class="pqhib-input" name="slug" placeholder="auto-generated if blank"></div>
          <div class="pqhib-field pqhib-field--wide"><label>First admin user</label><input class="pqhib-input" name="adminuser" placeholder="Moodle user ID, email, or username" required></div>
          <div class="pqhib-field"><label>Public domain</label><input class="pqhib-input" name="publicdomain" placeholder="example.org"></div>
          <div class="pqhib-field"><label>App domain</label><input class="pqhib-input" name="appdomain" placeholder="app.example.org"></div>
          <div class="pqhib-field"><label>Support email</label><input class="pqhib-input" name="supportemail"></div>
          <div class="pqhib-field"><label>Logo URL</label><input class="pqhib-input" name="logourl"></div>
          <div class="pqhib-field"><label>Initials</label><input class="pqhib-input" name="brandinitials" maxlength="6"></div>
          <div class="pqhib-field"><label>Plan code</label><input class="pqhib-input" name="plancode" value="pilot"></div>
          <div class="pqhib-field"><label>Primary color</label><input class="pqhib-input" name="primarycolor" value="#2f6f4e"></div>
          <div class="pqhib-field"><label>Accent color</label><input class="pqhib-input" name="accentcolor" value="#d99a26"></div>
          <div class="pqhib-field"><label>Surface color</label><input class="pqhib-input" name="surfacecolor" value="#f4f8fb"></div>
          <div class="pqhib-field"><label>Student limit</label><input class="pqhib-input" name="studentlimit" value="0"></div>
          <div class="pqhib-field"><label>Teacher limit</label><input class="pqhib-input" name="teacherlimit" value="0"></div>
          <div class="pqhib-field"><label>Session limit</label><input class="pqhib-input" name="sessionlimit" value="0"></div>
          <div class="pqhib-field"><label>Storage MB</label><input class="pqhib-input" name="storagelimit" value="0"></div>
          <div class="pqhib-field pqhib-field--wide"><label>Hero image URL</label><input class="pqhib-input" name="heroimage"></div>
          <div class="pqhib-field pqhib-field--wide"><label>Landing headline</label><input class="pqhib-input" name="headline"></div>
          <div class="pqhib-field pqhib-field--wide"><label>Landing subtitle</label><textarea class="pqhib-textarea" name="subtitle"></textarea></div>
          <div class="pqhib-field pqhib-field--wide"><label>Landing body</label><textarea class="pqhib-textarea" name="bodycopy"></textarea></div>
          <div class="pqhib-field pqhib-field--wide"><label>Initial courses</label><input class="pqhib-input" name="initialcourses" value="Pre-Quraan"></div>
        </div>
        <button class="pqhib-btn" type="submit">Create institution</button>
      </form>

      <aside class="pqhib-panel">
        <div class="pqhib-step"><span>1</span><div><strong>Consumer and domains</strong><em>Creates the institution brand and public/app host rows.</em></div></div>
        <div class="pqhib-step"><span>2</span><div><strong>Workspace and first admin</strong><em>Creates an institution workspace and grants owner/admin roles.</em></div></div>
        <div class="pqhib-step"><span>3</span><div><strong>Landing defaults</strong><em>Stores colors, logo, hero image, support email, and landing copy.</em></div></div>
        <div class="pqhib-step"><span>4</span><div><strong>Initial courses</strong><em>Stores starting course names in workspace settings for later enrollment setup.</em></div></div>
        <h2>Recent Institutions</h2>
        <div class="pqhib-list">
          <?php if (!$institutions): ?><div class="pqhib-row"><span class="pqhib-muted">No institution workspaces found yet.</span></div><?php endif; ?>
          <?php foreach ($institutions as $institution): ?>
            <div class="pqhib-row">
              <strong><?php echo s((string)$institution->name); ?></strong>
              <span class="pqhib-muted">#<?php echo (int)$institution->id; ?> / <?php echo s((string)$institution->slug); ?></span>
              <div class="pqhib-created">
                <a class="pqhib-btn pqhib-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => (int)$institution->id]))->out(false); ?>">Workspace</a>
                <a class="pqhib-btn pqhib-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/institution_settings.php', ['workspaceid' => (int)$institution->id]))->out(false); ?>">Settings</a>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      </aside>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
