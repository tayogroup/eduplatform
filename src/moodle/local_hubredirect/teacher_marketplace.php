<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqtm_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtm_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtm_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqtm_ready(): bool {
    return pqtm_table_exists('local_prequran_teacher_profile')
        && pqtm_column_exists('local_prequran_teacher_profile', 'marketplace_visible')
        && pqtm_column_exists('local_prequran_teacher_profile', 'marketplace_status')
        && pqtm_column_exists('local_prequran_teacher_profile', 'vetting_status');
}

function pqtm_short(string $value, int $max = 180): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
$brandname = (string)$consumercontext->consumername;
$loggedin = isloggedin() && !isguestuser();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brandname . ' Teacher Marketplace');
$PAGE->set_heading($brandname . ' Teacher Marketplace');
$PAGE->add_body_class('pqh-teacher-marketplace-page');

$query = trim(optional_param('q', '', PARAM_TEXT));
$course = trim(optional_param('course', '', PARAM_TEXT));
$language = trim(optional_param('language', '', PARAM_TEXT));
$ready = pqtm_ready();
$teachers = [];

if ($ready) {
    $where = [
        'tp.status = :activestatus',
        'tp.marketplace_visible = 1',
        'tp.marketplace_status = :marketstatus',
        'tp.vetting_status = :vettingstatus',
        'u.deleted = 0',
        'u.suspended = 0',
    ];
    $params = [
        'activestatus' => 'active',
        'marketstatus' => 'published',
        'vettingstatus' => 'approved',
    ];
    if (pqtm_column_exists('local_prequran_teacher_profile', 'consumerid') && (int)$consumercontext->consumerid > 0) {
        $where[] = 'tp.consumerid = :consumerid';
        $params['consumerid'] = (int)$consumercontext->consumerid;
    }
    if ($query !== '') {
        $like = '%' . $DB->sql_like_escape($query) . '%';
        $where[] = '(' . $DB->sql_like('tp.teacher_display_name', ':qname', false)
            . ' OR ' . $DB->sql_like('tp.marketplace_bio', ':qbio', false)
            . ' OR ' . $DB->sql_like('tp.marketplace_skills', ':qskills', false)
            . ' OR ' . $DB->sql_like('tp.marketplace_experience', ':qexp', false) . ')';
        $params['qname'] = $like;
        $params['qbio'] = $like;
        $params['qskills'] = $like;
        $params['qexp'] = $like;
    }
    if ($course !== '') {
        $where[] = '(' . $DB->sql_like('tp.courses_taught', ':course', false)
            . ' OR ' . $DB->sql_like('tp.marketplace_courses', ':marketcourse', false) . ')';
        $params['course'] = '%' . $DB->sql_like_escape($course) . '%';
        $params['marketcourse'] = '%' . $DB->sql_like_escape($course) . '%';
    }
    if ($language !== '') {
        $where[] = '(tp.primary_language = :language OR ' . $DB->sql_like('tp.other_languages', ':otherlanguage', false) . ')';
        $params['language'] = $language;
        $params['otherlanguage'] = '%' . $DB->sql_like_escape($language) . '%';
    }
    $teachers = array_values($DB->get_records_sql(
        "SELECT tp.*, u.firstname, u.lastname
           FROM {local_prequran_teacher_profile} tp
           JOIN {user} u ON u.id = tp.userid
          WHERE " . implode(' AND ', $where) . "
       ORDER BY tp.vetting_reviewedat DESC, tp.timemodified DESC",
        $params,
        0,
        100
    ));
}

echo $OUTPUT->header();
?>
<style>
body.pqh-teacher-marketplace-page header,body.pqh-teacher-marketplace-page footer,body.pqh-teacher-marketplace-page nav.navbar,body.pqh-teacher-marketplace-page #page-header,body.pqh-teacher-marketplace-page #page-footer,body.pqh-teacher-marketplace-page .drawer,body.pqh-teacher-marketplace-page .drawer-toggles,body.pqh-teacher-marketplace-page .block-region,body.pqh-teacher-marketplace-page [data-region="drawer"],body.pqh-teacher-marketplace-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-teacher-marketplace-page #page,body.pqh-teacher-marketplace-page #page-content,body.pqh-teacher-marketplace-page #region-main,body.pqh-teacher-marketplace-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqtm-shell{min-height:100vh;padding:28px 18px 54px;background:#f4f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqtm-wrap{max-width:1120px;margin:0 auto}.pqtm-top,.pqtm-filter,.pqtm-card,.pqtm-note{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqtm-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:14px}.pqtm-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqtm-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqtm-actions{display:flex;gap:9px;flex-wrap:wrap}.pqtm-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 13px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}.pqtm-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqtm-note{padding:14px 16px;margin-bottom:14px;color:#4f6472;font-size:14px;font-weight:850;line-height:1.45}.pqtm-filter{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:10px;padding:14px;margin-bottom:14px}.pqtm-input{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}
.pqtm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pqtm-card{padding:18px}.pqtm-name{margin:0;color:#241b24;font-size:22px;font-weight:950;line-height:1.15}.pqtm-meta{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.pqtm-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#eef7ee;color:#2f5d42;font-size:12px;font-weight:950}.pqtm-pill--gold{background:#fff6de;color:#745323}.pqtm-text{margin:10px 0 0;color:#4f6472;font-size:14px;font-weight:780;line-height:1.48}.pqtm-card-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.pqtm-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;background:#fff;color:#5e7280;font-weight:850}
@media(max-width:760px){.pqtm-top{display:block}.pqtm-actions{margin-top:12px}.pqtm-filter,.pqtm-grid{grid-template-columns:1fr}.pqtm-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqtm-shell">
  <div class="pqtm-wrap">
    <section class="pqtm-top pqh-workspace-top">
      <div>
        <h1 class="pqtm-title pqh-workspace-title"><?php echo s($brandname); ?> Teacher Marketplace</h1>
        <p class="pqtm-sub pqh-workspace-sub">Browse reviewed private teachers and tutors for <?php echo s($brandname); ?> learning paths.</p>
      </div>
      <div class="pqtm-actions pqh-workspace-actions">
        <?php if ($loggedin): ?>
          <a class="pqtm-btn pqtm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace_requests.php', $consumerparams))->out(false); ?>">My requests</a>
          <a class="pqtm-btn pqtm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
        <?php else: ?>
          <a class="pqtm-btn pqtm-btn--light" href="<?php echo (new moodle_url('/login/index.php', $consumerparams))->out(false); ?>">Log in</a>
        <?php endif; ?>
      </div>
    </section>
    <section class="pqtm-note"><?php echo s($brandname); ?> performs initial marketplace review and controls which profiles are visible. Visibility is not a guarantee of fit, outcome, or assignment. Families should review profiles, communicate with teachers or tutors, and make the final selection for their child or for themselves.</section>
    <?php if (!$ready): ?>
      <div class="pqtm-empty">Teacher marketplace schema is not ready yet. Please run the local_prequran Moodle upgrade.</div>
    <?php else: ?>
      <form class="pqtm-filter" method="get">
        <input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
        <input class="pqtm-input" name="q" value="<?php echo s($query); ?>" placeholder="Search skills, bio, or experience">
        <input class="pqtm-input" name="course" value="<?php echo s($course); ?>" placeholder="Course">
        <input class="pqtm-input" name="language" value="<?php echo s($language); ?>" placeholder="Language">
        <button class="pqtm-btn" type="submit">Search</button>
      </form>
      <?php if (!$teachers): ?>
        <div class="pqtm-empty">No published teacher profiles matched your search.</div>
      <?php else: ?>
        <section class="pqtm-grid">
          <?php foreach ($teachers as $teacher): ?>
            <?php $name = trim((string)$teacher->teacher_display_name) !== '' ? (string)$teacher->teacher_display_name : fullname($teacher); ?>
            <article class="pqtm-card">
              <h2 class="pqtm-name"><?php echo s($name); ?></h2>
              <div class="pqtm-meta">
                <?php if ((string)$teacher->primary_language !== ''): ?><span class="pqtm-pill"><?php echo s((string)$teacher->primary_language); ?></span><?php endif; ?>
                <?php if ((string)$teacher->timezone !== ''): ?><span class="pqtm-pill"><?php echo s((string)$teacher->timezone); ?></span><?php endif; ?>
                <span class="pqtm-pill pqtm-pill--gold">Academy reviewed</span>
              </div>
              <?php if ((string)$teacher->courses_taught !== ''): ?><p class="pqtm-text"><strong>Courses:</strong> <?php echo s(pqtm_short((string)$teacher->courses_taught, 130)); ?></p><?php endif; ?>
              <?php if ((string)$teacher->marketplace_skills !== ''): ?><p class="pqtm-text"><strong>Skills:</strong> <?php echo s(pqtm_short((string)$teacher->marketplace_skills, 150)); ?></p><?php endif; ?>
              <?php if ((string)$teacher->marketplace_bio !== ''): ?><p class="pqtm-text"><?php echo s(pqtm_short((string)$teacher->marketplace_bio)); ?></p><?php endif; ?>
              <?php
              $profileurl = pqh_teacher_public_profile_url($teacher, $consumercontext)->out(false);
              $requesturl = (new moodle_url('/local/hubredirect/teacher_marketplace_request.php', ['teacherid' => (int)$teacher->userid] + $consumerparams))->out(false);
              ?>
              <div class="pqtm-card-actions">
                <a class="pqtm-btn pqtm-btn--light" href="<?php echo $profileurl; ?>">View profile</a>
                <a class="pqtm-btn" href="<?php echo $requesturl; ?>">Request teacher</a>
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
