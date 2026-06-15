<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->libdir . '/ddllib.php');

if (!is_siteadmin((int)$USER->id)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can view SQL tools.');
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/sql_tools.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('SQL Tools');
$PAGE->set_heading('SQL Tools');
$PAGE->add_body_class('pqh-sql-tools-page');

function pqhst_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqhst_table_has_field(string $table, string $field): bool {
    global $DB;
    $dbman = $DB->get_manager();
    $xtable = new xmldb_table($table);
    return $dbman->table_exists($xtable) && $dbman->field_exists($xtable, new xmldb_field($field));
}

function pqhst_normalize_environment(string $value): string {
    $value = strtolower(trim($value));
    if (in_array($value, ['integration', 'int', 'qa'], true)) {
        return 'integration';
    }
    if (in_array($value, ['staging', 'stage'], true)) {
        return 'staging';
    }
    return 'production';
}

function pqhst_allowed_environment(string $environment): bool {
    return in_array($environment, ['integration', 'staging'], true);
}

function pqhst_step_config_rows(string $environment, string $lessonid, string $unitid): array {
    global $DB;

    if (!pqhst_table_exists('local_prequran_stepcfg') || !pqhst_table_has_field('local_prequran_stepcfg', 'environment')) {
        return [];
    }
    if (!pqhst_allowed_environment($environment) || $lessonid === '' || $unitid === '') {
        return [];
    }

    return array_values($DB->get_records(
        'local_prequran_stepcfg',
        [
            'environment' => $environment,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'active' => 1,
        ],
        'step_index ASC, id ASC',
        'id, lessonid, unitid, step_index, step_id, step_title, default_passes_required, default_repeats_per_letter, active, environment'
    ));
}

function pqhst_update_step_config_progress(string $environment, string $lessonid, string $unitid, string $stepid, int $passes, int $repeats): int {
    global $DB;

    if (!pqhst_table_exists('local_prequran_stepprog')) {
        return 0;
    }

    $conditions = [
        'lessonid' => $lessonid,
        'unitid' => $unitid,
        'step_id' => $stepid,
    ];
    if (pqhst_table_has_field('local_prequran_stepprog', 'environment')) {
        $conditions['environment'] = $environment;
    }

    $rows = $DB->get_records('local_prequran_stepprog', $conditions);
    $count = 0;
    foreach ($rows as $row) {
        if (pqhst_table_has_field('local_prequran_stepprog', 'passes_required')) {
            $row->passes_required = $passes;
        }
        if (pqhst_table_has_field('local_prequran_stepprog', 'repeats_per_letter')) {
            $row->repeats_per_letter = $repeats;
        }
        if (pqhst_table_has_field('local_prequran_stepprog', 'passes_done')
                && isset($row->passes_done)
                && (int)$row->passes_done > $passes
                && (string)($row->step_status ?? '') !== 'completed') {
            $row->passes_done = $passes;
        }
        if (pqhst_table_has_field('local_prequran_stepprog', 'timemodified')) {
            $row->timemodified = time();
        }
        $DB->update_record('local_prequran_stepprog', $row);
        $count++;
    }

    return $count;
}

function pqhst_update_step_config(string $environment, string $lessonid, string $unitid, string $stepid, int $passes, int $repeats): array {
    global $DB;

    if (!pqhst_allowed_environment($environment)) {
        return ['type' => 'error', 'message' => 'Step configuration can only be edited for integration or staging.'];
    }
    if (!pqhst_table_exists('local_prequran_stepcfg') || !pqhst_table_has_field('local_prequran_stepcfg', 'environment')) {
        return ['type' => 'error', 'message' => 'The step configuration table is not environment-aware yet.'];
    }
    if ($lessonid === '' || $unitid === '' || $stepid === '') {
        return ['type' => 'error', 'message' => 'Lesson, unit, and step are required.'];
    }

    $passes = max(1, min(100, $passes));
    $repeats = max(1, min(100, $repeats));
    $record = $DB->get_record('local_prequran_stepcfg', [
        'environment' => $environment,
        'lessonid' => $lessonid,
        'unitid' => $unitid,
        'step_id' => $stepid,
        'active' => 1,
    ], '*', IGNORE_MISSING);

    if (!$record && ctype_digit($stepid)) {
        $record = $DB->get_record('local_prequran_stepcfg', [
            'environment' => $environment,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'step_index' => (int)$stepid,
            'active' => 1,
        ], '*', IGNORE_MISSING);
    }
    if (!$record) {
        return ['type' => 'error', 'message' => 'No active step configuration row matched that environment, lesson, unit, and step.'];
    }

    $record->default_passes_required = $passes;
    $record->default_repeats_per_letter = $repeats;
    if (pqhst_table_has_field('local_prequran_stepcfg', 'timemodified')) {
        $record->timemodified = time();
    }
    $DB->update_record('local_prequran_stepcfg', $record);

    $progressrows = pqhst_update_step_config_progress($environment, $lessonid, $unitid, (string)$record->step_id, $passes, $repeats);

    return [
        'type' => 'success',
        'message' => sprintf(
            'Updated %s / %s / %s in %s. Existing progress rows refreshed: %d.',
            $lessonid,
            $unitid,
            (string)$record->step_id,
            $environment,
            $progressrows
        ),
    ];
}

function pqhst_sql_table(string $name): string {
    global $CFG;
    return preg_replace('/[^a-zA-Z0-9_]/', '', (string)$CFG->prefix . $name);
}

function pqhst_step_progress_cleanup_sql(string $environment): string {
    $environment = pqhst_normalize_environment($environment);
    if (!pqhst_allowed_environment($environment)) {
        return "-- Production step progress cleanup is blocked from this tool.\n"
            . "-- Use a reviewed backup-and-approval runbook before touching production learner progress.\n";
    }

    $lessonprog = pqhst_sql_table('local_prequran_lessonprog');
    $stepprog = pqhst_sql_table('local_prequran_stepprog');
    $preferences = pqhst_sql_table('user_preferences');

    return "-- Pre-Quraan step progress cleanup for {$environment}.\n"
        . "-- Preview first, then run the transaction if the counts match your intent.\n\n"
        . "SELECT 'lessonprog' AS table_name, COUNT(*) AS rows_count\n"
        . "FROM {$lessonprog}\n"
        . "WHERE BINARY environment = BINARY '{$environment}';\n\n"
        . "SELECT 'stepprog' AS table_name, COUNT(*) AS rows_count\n"
        . "FROM {$stepprog}\n"
        . "WHERE BINARY environment = BINARY '{$environment}';\n\n"
        . "-- Legacy Moodle user preference snapshots are not environment-scoped.\n"
        . "-- On quraantest/staging databases this removes Pre-Quraan state snapshots for that non-production site.\n"
        . "SELECT 'user_preferences' AS table_name, COUNT(*) AS rows_count\n"
        . "FROM {$preferences}\n"
        . "WHERE name REGEXP '^prequran_.*_state_v1$';\n\n"
        . "START TRANSACTION;\n\n"
        . "DELETE FROM {$stepprog}\n"
        . "WHERE BINARY environment = BINARY '{$environment}';\n\n"
        . "DELETE FROM {$lessonprog}\n"
        . "WHERE BINARY environment = BINARY '{$environment}';\n\n"
        . "DELETE FROM {$preferences}\n"
        . "WHERE name REGEXP '^prequran_.*_state_v1$';\n\n"
        . "COMMIT;\n";
}

$qaenv = pqhst_normalize_environment(optional_param('qa_env', 'integration', PARAM_ALPHANUMEXT));
if (!pqhst_allowed_environment($qaenv)) {
    $qaenv = 'integration';
}
$qalesson = trim(optional_param('qa_lessonid', 'alphabet', PARAM_ALPHANUMEXT));
$qaunit = trim(optional_param('qa_unitid', 'alphabet_listen', PARAM_ALPHANUMEXT));
$message = null;

if (optional_param('pqh_action', '', PARAM_ALPHANUMEXT) === 'update_step_config') {
    if (!confirm_sesskey()) {
        $message = ['type' => 'error', 'message' => 'Session key expired. Refresh the page and try again.'];
    } else {
        $qaenv = pqhst_normalize_environment(required_param('qa_env', PARAM_ALPHANUMEXT));
        $qalesson = trim(required_param('qa_lessonid', PARAM_ALPHANUMEXT));
        $qaunit = trim(required_param('qa_unitid', PARAM_ALPHANUMEXT));
        $message = pqhst_update_step_config(
            $qaenv,
            $qalesson,
            $qaunit,
            trim(required_param('qa_step_id', PARAM_RAW_TRIMMED)),
            required_param('qa_passes', PARAM_INT),
            required_param('qa_repeats', PARAM_INT)
        );
    }
}

$rows = pqhst_step_config_rows($qaenv, $qalesson, $qaunit);
$integrationSql = pqhst_step_progress_cleanup_sql('integration');
$stagingSql = pqhst_step_progress_cleanup_sql('staging');
$productionSql = pqhst_step_progress_cleanup_sql('production');

echo $OUTPUT->header();
?>
<style>
body.pqh-sql-tools-page #page-header,
body.pqh-sql-tools-page #page-footer,
body.pqh-sql-tools-page .navbar,
body.pqh-sql-tools-page .drawer,
body.pqh-sql-tools-page [data-region="drawer"]{display:none!important}
body.pqh-sql-tools-page #page,
body.pqh-sql-tools-page #page-content,
body.pqh-sql-tools-page #region-main{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhst-shell{min-height:100vh;background:linear-gradient(180deg,#f1fff4 0,#fff 48%);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#17324a}
.pqhst-wrap{max-width:1180px;margin:0 auto;padding:30px 18px 54px}
.pqhst-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;padding:24px;border-radius:16px;background:linear-gradient(135deg,#eaffea 0%,#fff 54%,#fff7e7 100%);border:1px solid rgba(111,78,50,.13)}
.pqhst-kicker{margin:0 0 6px;color:#6f4e32;font-size:13px;font-weight:950;text-transform:uppercase}
.pqhst-title{margin:0;color:#4d3522;font-size:30px;font-weight:950;line-height:1.1}
.pqhst-sub{margin:8px 0 0;color:#64745a;font-size:15px;font-weight:750}
.pqhst-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border-radius:9px;background:#6f4e32;color:#fff!important;text-decoration:none;font-size:14px;font-weight:900;border:0;cursor:pointer}
.pqhst-btn--light{background:#f4fff0;color:#4d3522!important;border:1px solid rgba(111,78,50,.16)}
.pqhst-card{margin:0 0 18px;padding:18px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqhst-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
.pqhst-head h2{margin:0;color:#4d3522;font-size:20px;font-weight:950}
.pqhst-head p,.pqhst-card p{margin:5px 0 0;color:#64745a;font-size:13px;font-weight:750}
.pqhst-badge{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border-radius:999px;background:#fff4dc;color:#7b5a3a;font-size:12px;font-weight:950;white-space:nowrap}
.pqhst-alert{margin:0 0 12px;padding:11px 12px;border-radius:10px;font-size:13px;font-weight:850}
.pqhst-alert--success{background:#eaffea;color:#2d6b43;border:1px solid rgba(63,138,85,.25)}
.pqhst-alert--error{background:#fff0e6;color:#8a3e2e;border:1px solid rgba(138,62,46,.25)}
.pqhst-filter{display:grid;grid-template-columns:170px minmax(160px,1fr) minmax(180px,1fr) auto;gap:10px;align-items:end;margin-bottom:14px}
.pqhst-field label{display:block;margin:0 0 5px;color:#6f4e32;font-size:12px;font-weight:950;text-transform:uppercase}
.pqhst-input,.pqhst-select{width:100%;min-height:42px;border-radius:9px;border:1px solid rgba(23,50,74,.18);padding:0 12px;background:#fff;color:#4d3522;font-weight:850}
.pqhst-table{width:100%;border-collapse:separate;border-spacing:0 8px}
.pqhst-table th{padding:0 8px;color:#6f4e32;font-size:11px;font-weight:950;text-align:left;text-transform:uppercase}
.pqhst-table td{padding:9px 8px;background:#f9fff6;border-top:1px solid rgba(111,78,50,.10);border-bottom:1px solid rgba(111,78,50,.10);vertical-align:middle}
.pqhst-table td:first-child{border-left:1px solid rgba(111,78,50,.10);border-radius:10px 0 0 10px}
.pqhst-table td:last-child{border-right:1px solid rgba(111,78,50,.10);border-radius:0 10px 10px 0}
.pqhst-step{display:block;color:#17324a;font-size:14px;font-weight:950}
.pqhst-meta{display:block;margin-top:2px;color:#64745a;font-size:11px;font-weight:800}
.pqhst-number{width:86px;min-height:36px;border-radius:8px;border:1px solid rgba(23,50,74,.18);padding:0 9px;background:#fff;color:#17324a;font-weight:900}
.pqhst-grid{display:grid;grid-template-columns:1fr;gap:14px}
.pqhst-sql{width:100%;min-height:250px;border-radius:10px;border:1px solid rgba(23,50,74,.18);padding:12px;background:#0b1020;color:#eaffea;font:12px/1.45 ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;resize:vertical;white-space:pre}
.pqhst-blocked{background:#fff8f4;border-color:rgba(138,62,46,.25)}
.pqhst-empty{padding:24px;border:1px dashed rgba(23,50,74,.22);border-radius:12px;background:#fff;color:#516879;font-weight:800}
@media(max-width:820px){.pqhst-top{display:block}.pqhst-filter{grid-template-columns:1fr}.pqhst-table,.pqhst-table tbody,.pqhst-table tr,.pqhst-table td{display:block;width:100%}.pqhst-table thead{display:none}}
</style>
<main class="pqhst-shell">
  <div class="pqhst-wrap">
    <section class="pqhst-top">
      <div>
        <p class="pqhst-kicker">Admin SQL Tools</p>
        <h1 class="pqhst-title">SQL Tools</h1>
        <p class="pqhst-sub">QA step configuration and non-production cleanup SQL. Production step progress cleanup is blocked.</p>
      </div>
      <a class="pqhst-btn pqhst-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
    </section>

    <section class="pqhst-card" aria-label="QA step configuration">
      <div class="pqhst-head">
        <div>
          <h2>QA Step Config</h2>
          <p>Update passes and repeats for staging or integration only. Production is blocked here.</p>
        </div>
        <span class="pqhst-badge"><?php echo s($qaenv); ?> only</span>
      </div>

      <?php if ($message): ?>
        <div class="pqhst-alert pqhst-alert--<?php echo $message['type'] === 'success' ? 'success' : 'error'; ?>">
          <?php echo s($message['message']); ?>
        </div>
      <?php endif; ?>

      <form class="pqhst-filter" method="get">
        <div class="pqhst-field">
          <label for="pqhst-env">Environment</label>
          <select class="pqhst-select" id="pqhst-env" name="qa_env">
            <option value="integration" <?php echo $qaenv === 'integration' ? 'selected' : ''; ?>>Integration</option>
            <option value="staging" <?php echo $qaenv === 'staging' ? 'selected' : ''; ?>>Staging</option>
          </select>
        </div>
        <div class="pqhst-field">
          <label for="pqhst-lesson">Lesson</label>
          <input class="pqhst-input" id="pqhst-lesson" name="qa_lessonid" value="<?php echo s($qalesson); ?>">
        </div>
        <div class="pqhst-field">
          <label for="pqhst-unit">Unit</label>
          <input class="pqhst-input" id="pqhst-unit" name="qa_unitid" value="<?php echo s($qaunit); ?>">
        </div>
        <button class="pqhst-btn pqhst-btn--light" type="submit">Load steps</button>
      </form>

      <?php if (!$rows): ?>
        <div class="pqhst-empty">No active step configuration rows found for this environment, lesson, and unit.</div>
      <?php else: ?>
        <table class="pqhst-table">
          <thead><tr><th>Step</th><th>Passes</th><th>Repeats</th><th>Action</th></tr></thead>
          <tbody>
            <?php foreach ($rows as $step): ?>
              <?php $formid = 'pqhst-stepcfg-form-' . (int)$step->id; ?>
              <tr>
                <td>
                  <span class="pqhst-step">Step <?php echo (int)$step->step_index; ?>: <?php echo s($step->step_title ?: $step->step_id); ?></span>
                  <span class="pqhst-meta"><?php echo s($step->step_id); ?> - <?php echo s($step->lessonid); ?> / <?php echo s($step->unitid); ?></span>
                </td>
                <td>
                  <form id="<?php echo s($formid); ?>" method="post">
                    <input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>">
                    <input type="hidden" name="pqh_action" value="update_step_config">
                    <input type="hidden" name="qa_env" value="<?php echo s($qaenv); ?>">
                    <input type="hidden" name="qa_lessonid" value="<?php echo s($qalesson); ?>">
                    <input type="hidden" name="qa_unitid" value="<?php echo s($qaunit); ?>">
                    <input type="hidden" name="qa_step_id" value="<?php echo s($step->step_id); ?>">
                  </form>
                  <input class="pqhst-number" form="<?php echo s($formid); ?>" name="qa_passes" type="number" min="1" max="100" value="<?php echo max(1, (int)$step->default_passes_required); ?>">
                </td>
                <td>
                  <input class="pqhst-number" form="<?php echo s($formid); ?>" name="qa_repeats" type="number" min="1" max="100" value="<?php echo max(1, (int)$step->default_repeats_per_letter); ?>">
                </td>
                <td><button class="pqhst-btn" form="<?php echo s($formid); ?>" type="submit">Update</button></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </section>

    <section class="pqhst-grid" aria-label="Step progress cleanup SQL">
      <article class="pqhst-card">
        <h2>Step Progress Cleanup: Integration</h2>
        <p>Copy this SQL into phpMyAdmin on the integration/quraantest database after confirming the preview counts.</p>
        <textarea class="pqhst-sql" readonly spellcheck="false"><?php echo s($integrationSql); ?></textarea>
      </article>
      <article class="pqhst-card">
        <h2>Step Progress Cleanup: Staging</h2>
        <p>Copy this SQL into phpMyAdmin on the staging database after confirming the preview counts.</p>
        <textarea class="pqhst-sql" readonly spellcheck="false"><?php echo s($stagingSql); ?></textarea>
      </article>
      <article class="pqhst-card pqhst-blocked">
        <h2>Step Progress Cleanup: Production</h2>
        <p>Blocked in this tool. Production learner progress cleanup must use a reviewed backup-and-approval runbook.</p>
        <textarea class="pqhst-sql" readonly spellcheck="false"><?php echo s($productionSql); ?></textarea>
      </article>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
