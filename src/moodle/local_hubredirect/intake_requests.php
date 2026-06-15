<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can review public intake requests.');
}

$options = require(__DIR__ . '/student_intake_config.php');

function pqireq_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqireq_audit(string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqireq_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqireq_json_slots($json): array {
    $decoded = json_decode((string)$json, true);
    if (!is_array($decoded) || empty($decoded['slots']) || !is_array($decoded['slots'])) {
        return [];
    }
    return $decoded['slots'];
}

function pqireq_slot_parts($json): array {
    $days = [];
    $times = [];
    foreach (pqireq_json_slots($json) as $slot) {
        if (!is_array($slot)) {
            continue;
        }
        $day = trim((string)($slot['day'] ?? ''));
        $time = trim((string)($slot['time'] ?? ''));
        if ($day !== '' && !in_array($day, $days, true)) {
            $days[] = $day;
        }
        if ($time !== '' && !in_array($time, $times, true)) {
            $times[] = $time;
        }
    }
    return [$days, $times];
}

function pqireq_split_csv(string $value): array {
    $parts = array_map('trim', explode(',', $value));
    return array_values(array_filter($parts, static fn($part) => $part !== ''));
}

function pqireq_prefill(stdClass $request): array {
    [$days, $times] = pqireq_slot_parts($request->availability_json ?? '');
    return [
        'requestid' => (string)$request->id,
        'student_firstname' => (string)$request->student_firstname,
        'student_lastname' => (string)$request->student_lastname,
        'student_display_name' => (string)$request->student_display_name,
        'student_email' => (string)$request->student_email,
        'date_of_birth' => (string)$request->date_of_birth,
        'age_years' => (string)(int)$request->age_years,
        'gender' => (string)$request->gender,
        'special_needs' => (string)($request->special_needs ?? ''),
        'course_type' => (string)($request->course_type ?? ''),
        'country' => (string)$request->country,
        'city' => (string)$request->city,
        'timezone' => (string)$request->timezone,
        'primary_language' => (string)$request->primary_language,
        'other_languages' => pqireq_split_csv((string)$request->other_languages),
        'current_level' => (string)$request->current_level,
        'learning_base' => (string)$request->learning_base,
        'availability_days' => $days,
        'availability_time_windows' => $times,
        'availability' => (string)$request->availability_summary,
        'parent_name' => (string)$request->parent_name,
        'parent_email' => (string)$request->parent_email,
        'parent_phone' => (string)$request->parent_phone,
        'parent_preferences' => (string)$request->parent_preferences,
        'live_class_consent' => (int)$request->live_class_consent,
        'recording_consent' => (int)$request->recording_consent,
        'consent_notes' => (string)$request->consent_notes,
    ];
}

function pqireq_normal(string $value): string {
    return core_text::strtolower(trim($value));
}

function pqireq_group_score(stdClass $request, stdClass $group): array {
    $score = 0;
    $reasons = [];
    if (pqireq_normal((string)($request->course_type ?? '')) !== '' && pqireq_normal((string)($request->course_type ?? '')) === pqireq_normal((string)($group->course_type ?? ''))) {
        $score += 20;
        $reasons[] = 'course';
    }
    if (pqireq_normal((string)$request->timezone) !== '' && pqireq_normal((string)$request->timezone) === pqireq_normal((string)$group->timezone)) {
        $score += 28;
        $reasons[] = 'timezone';
    }
    if (pqireq_normal((string)$request->primary_language) !== '' && pqireq_normal((string)$request->primary_language) === pqireq_normal((string)$group->language)) {
        $score += 20;
        $reasons[] = 'language';
    }
    if (pqireq_normal((string)$request->current_level) !== '' && pqireq_normal((string)$request->current_level) === pqireq_normal((string)$group->current_level)) {
        $score += 20;
        $reasons[] = 'level';
    }
    if (pqireq_normal((string)$request->learning_base) !== '' && pqireq_normal((string)$request->learning_base) === pqireq_normal((string)$group->learning_base)) {
        $score += 12;
        $reasons[] = 'base';
    }
    $age = (int)$request->age_years;
    if ($age > 0 && $age >= (int)$group->age_min && $age <= (int)$group->age_max) {
        $score += 10;
        $reasons[] = 'age';
    }
    $genderpolicy = pqireq_normal((string)$group->gender_policy);
    $gender = pqireq_normal((string)$request->gender);
    if ($genderpolicy === 'flexible' || $genderpolicy === 'mixed' || ($gender !== '' && $genderpolicy === $gender)) {
        $score += 5;
        $reasons[] = 'gender';
    }
    if (pqireq_normal((string)$request->country) !== '' && pqireq_normal((string)$request->country) === pqireq_normal((string)$group->country)) {
        $score += 3;
        $reasons[] = 'country';
    }
    if (pqireq_normal((string)$request->city) !== '' && pqireq_normal((string)$request->city) === pqireq_normal((string)$group->city)) {
        $score += 2;
        $reasons[] = 'city';
    }
    if ((int)$group->open_seats <= 0) {
        $score -= 20;
        $reasons[] = 'full';
    }
    return [max(0, min(100, $score)), implode(', ', $reasons)];
}

function pqireq_group_suggestions(stdClass $request, int $limit = 4): array {
    global $DB;
    if (!pqireq_table_exists('local_prequran_class_group') || !pqireq_table_exists('local_prequran_group_member')) {
        return [];
    }

    $groups = $DB->get_records_sql(
        "SELECT g.*, COUNT(DISTINCT gm.id) AS active_members
           FROM {local_prequran_class_group} g
      LEFT JOIN {local_prequran_group_member} gm
             ON gm.groupid = g.id AND gm.assignment_status = 'active'
          WHERE g.status IN ('open', 'active')
       GROUP BY g.id, g.poolid, g.teacherid, g.title, g.course_type, g.timezone, g.language, g.current_level, g.learning_base,
                g.country, g.city, g.age_min, g.age_max, g.gender_policy, g.schedule_summary, g.max_students,
                g.status, g.createdby, g.timecreated, g.timemodified
       ORDER BY g.timemodified DESC"
    );

    $ranked = [];
    foreach ($groups as $group) {
        $group->active_members = (int)($group->active_members ?? 0);
        $group->open_seats = max(0, (int)$group->max_students - $group->active_members);
        [$score, $reasons] = pqireq_group_score($request, $group);
        if ($score <= 0) {
            continue;
        }
        $group->match_score = $score;
        $group->match_reasons = $reasons;
        $ranked[] = $group;
    }
    usort($ranked, static function ($a, $b): int {
        if ((int)$a->match_score === (int)$b->match_score) {
            return (int)$b->open_seats <=> (int)$a->open_seats;
        }
        return (int)$b->match_score <=> (int)$a->match_score;
    });
    return array_slice($ranked, 0, $limit);
}

function pqireq_status_label(string $status): string {
    $labels = [
        'new' => 'New',
        'reviewing' => 'Reviewing',
        'needs_alternative' => 'Needs alternative',
        'rejected' => 'Rejected',
        'transferred' => 'Transferred',
    ];
    return $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/intake_requests.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Public Intake Requests');
$PAGE->set_heading('Public Intake Requests');
$PAGE->add_body_class('pqh-intake-requests-page');

$ready = pqireq_table_exists('local_prequran_intake_request');
$message = '';
$error = '';

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $action = required_param('action', PARAM_ALPHANUMEXT);
    $requestid = required_param('requestid', PARAM_INT);
    try {
        $request = $DB->get_record('local_prequran_intake_request', ['id' => $requestid], '*', MUST_EXIST);
        if ($action === 'load_intake') {
            $request->status = 'reviewing';
            $request->matched_groupid = optional_param('matched_groupid', (int)$request->matched_groupid, PARAM_INT);
            $request->admin_notes = trim(optional_param('admin_notes', (string)$request->admin_notes, PARAM_TEXT));
            $request->reviewedby = (int)$USER->id;
            $request->reviewedat = time();
            $request->timemodified = time();
            $DB->update_record('local_prequran_intake_request', $request);
            $SESSION->pqsi_prefill = pqireq_prefill($request);
            pqireq_audit('public_intake_loaded_for_transfer', 'intake_request', $requestid, [
                'matched_groupid' => (int)$request->matched_groupid,
            ]);
            redirect(new moodle_url('/local/hubredirect/student_intake.php', ['requestid' => $requestid]));
        }

        if ($action === 'save_review') {
            $request->status = required_param('status', PARAM_ALPHANUMEXT);
            $request->matched_groupid = optional_param('matched_groupid', 0, PARAM_INT);
            $request->admin_notes = trim(optional_param('admin_notes', '', PARAM_TEXT));
            $request->reviewedby = (int)$USER->id;
            $request->reviewedat = time();
            $request->timemodified = time();
            $DB->update_record('local_prequran_intake_request', $request);
            pqireq_audit('public_intake_review_saved', 'intake_request', $requestid, [
                'status' => (string)$request->status,
                'matched_groupid' => (int)$request->matched_groupid,
            ]);
            $message = 'Request #' . $requestid . ' review saved.';
        }
    } catch (Throwable $e) {
        $error = 'Request update failed: ' . $e->getMessage();
    }
}

$requests = [];
if ($ready) {
    $requests = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_intake_request}
       ORDER BY CASE status
                    WHEN 'new' THEN 1
                    WHEN 'reviewing' THEN 2
                    WHEN 'needs_alternative' THEN 3
                    WHEN 'transferred' THEN 4
                    ELSE 5
                END,
                timecreated DESC",
        [],
        0,
        50
    );
}

echo $OUTPUT->header();
?>
<style>
body.pqh-intake-requests-page header,body.pqh-intake-requests-page footer,body.pqh-intake-requests-page nav.navbar,body.pqh-intake-requests-page #page-header,body.pqh-intake-requests-page #page-footer,body.pqh-intake-requests-page .drawer,body.pqh-intake-requests-page .drawer-toggles,body.pqh-intake-requests-page .block-region,body.pqh-intake-requests-page [data-region="drawer"],body.pqh-intake-requests-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-intake-requests-page #page,body.pqh-intake-requests-page #page-content,body.pqh-intake-requests-page #region-main,body.pqh-intake-requests-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqir-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqir-wrap{max-width:1240px;margin:0 auto}.pqir-top,.pqir-card{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}.pqir-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:16px}.pqir-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqir-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqir-actions{display:flex;flex-wrap:wrap;gap:9px}.pqir-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}.pqir-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqir-btn--brown{background:#7a5637}.pqir-btn--red{background:#9c392b}.pqir-card{padding:18px;margin-bottom:14px}.pqir-cardhead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.pqir-card h2{margin:0;font-size:21px;font-weight:950}.pqir-meta{margin-top:5px;color:#5e7280;font-size:13px;font-weight:850}.pqir-pill{display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044;white-space:nowrap}.pqir-pill--new{background:#fff4dc;color:#7a5637}.pqir-pill--ok{background:#edf9ef;color:#245c35}.pqir-pill--bad{background:#fff0ed;color:#883526}.pqir-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.pqir-box{padding:11px;border:1px solid rgba(23,48,68,.1);border-radius:9px;background:#fbfdff;font-weight:850}.pqir-box strong{display:block;margin-bottom:4px;color:#7a5637}.pqir-suggestions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.pqir-suggestion{padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:9px;background:#f8fbfd}.pqir-suggestion strong{display:block;font-size:14px}.pqir-suggestion span{display:block;margin-top:4px;color:#5e7280;font-size:12px;font-weight:850}.pqir-form{display:grid;grid-template-columns:180px 180px 1fr auto auto;gap:8px;align-items:end;margin-top:12px;padding-top:12px;border-top:1px solid rgba(23,48,68,.1)}.pqir-field{display:grid;gap:5px}.pqir-field label{font-size:12px;font-weight:900;color:#415665}.pqir-input{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:7px 9px;font:800 13px/1.2 system-ui;background:#fff;color:#173044}.pqir-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}.pqir-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-weight:850}.pqir-alert--ok{background:#edf9ef;color:#245c35}.pqir-alert--bad{background:#fff0ed;color:#883526}
@media(max-width:980px){.pqir-top{display:block}.pqir-actions{margin-top:12px}.pqir-grid,.pqir-suggestions{grid-template-columns:1fr}.pqir-form{grid-template-columns:1fr}.pqir-btn{width:100%}}
</style>
<main class="pqir-shell">
  <div class="pqir-wrap">
    <section class="pqir-top">
      <div>
        <h1 class="pqir-title">Public Intake Requests</h1>
        <p class="pqir-sub">Review parent-submitted live-class preferences, choose a likely group, and transfer accepted students into the Moodle intake flow.</p>
      </div>
      <div class="pqir-actions">
        <a class="pqir-btn pqir-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/public_intake.php'))->out(false); ?>">Public form</a>
        <a class="pqir-btn pqir-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/student_intake.php'))->out(false); ?>">Student intake</a>
        <a class="pqir-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
      </div>
    </section>

    <?php if ($message !== ''): ?><div class="pqir-alert pqir-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqir-alert pqir-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if (!$ready): ?>
      <section class="pqir-card"><div class="pqir-empty">Public intake request table is not ready. Run the local_prequran upgrade or create the intake request table first.</div></section>
    <?php elseif (!$requests): ?>
      <section class="pqir-card"><div class="pqir-empty">No public intake requests yet.</div></section>
    <?php else: ?>
      <?php foreach ($requests as $request): ?>
        <?php $suggestions = pqireq_group_suggestions($request); ?>
        <article class="pqir-card">
          <div class="pqir-cardhead">
            <div>
              <h2><?php echo s((string)$request->student_display_name ?: trim((string)$request->student_firstname . ' ' . (string)$request->student_lastname)); ?></h2>
              <div class="pqir-meta">Request #<?php echo (int)$request->id; ?> - <?php echo userdate((int)$request->timecreated); ?> - Parent: <?php echo s((string)$request->parent_name); ?>, <?php echo s((string)$request->parent_email); ?></div>
            </div>
            <span class="pqir-pill <?php echo (string)$request->status === 'new' ? 'pqir-pill--new' : ((string)$request->status === 'transferred' ? 'pqir-pill--ok' : ''); ?>"><?php echo s(pqireq_status_label((string)$request->status)); ?></span>
          </div>

          <div class="pqir-grid">
            <div class="pqir-box"><strong>Student</strong>Age <?php echo (int)$request->age_years; ?>, <?php echo s((string)$request->gender); ?><br>Special Needs: <?php echo s((string)($request->special_needs ?? '') ?: 'Not set'); ?><br><?php echo s((string)$request->country); ?>, <?php echo s((string)$request->city); ?></div>
            <div class="pqir-box"><strong>Placement</strong><?php echo s((string)($options['course_types'][(string)($request->course_type ?? '')] ?? (($request->course_type ?? '') ?: 'Not set'))); ?><br><?php echo s((string)$request->current_level); ?><br><?php echo s((string)$request->learning_base); ?></div>
            <div class="pqir-box"><strong>Language</strong><?php echo s((string)$request->primary_language); ?><?php if ((string)$request->other_languages !== ''): ?><br>Also: <?php echo s((string)$request->other_languages); ?><?php endif; ?></div>
            <div class="pqir-box"><strong>Schedule</strong><?php echo s((string)$request->timezone); ?><br><?php echo s((string)$request->availability_summary); ?></div>
            <div class="pqir-box"><strong>Consent</strong>Live class: <?php echo (int)$request->live_class_consent === 1 ? 'Yes' : 'No'; ?><br>Recording: <?php echo (int)$request->recording_consent === 1 ? 'Yes' : 'No'; ?></div>
            <div class="pqir-box"><strong>Transfer</strong><?php echo (int)$request->transferred_userid > 0 ? 'Moodle student ID ' . (int)$request->transferred_userid : 'Not transferred yet'; ?></div>
          </div>

          <div class="pqir-suggestions">
            <?php if (!$suggestions): ?>
              <div class="pqir-empty">No active class group suggestions yet. Create groups in Student Grouping, or mark this request as needing an alternative time.</div>
            <?php else: ?>
              <?php foreach ($suggestions as $group): ?>
                <div class="pqir-suggestion">
                  <strong><?php echo s((string)$group->title); ?> <span class="pqir-pill"><?php echo (int)$group->match_score; ?>%</span></strong>
                  <span><?php echo s((string)$group->schedule_summary); ?></span>
                  <span><?php echo s((string)($options['course_types'][(string)($group->course_type ?? '')] ?? (($group->course_type ?? '') ?: 'Course not set'))); ?> - <?php echo s((string)$group->timezone); ?> - <?php echo s((string)$group->language); ?> - <?php echo s((string)$group->current_level); ?> - Seats open: <?php echo (int)$group->open_seats; ?></span>
                  <span>Match: <?php echo s((string)$group->match_reasons); ?></span>
                </div>
              <?php endforeach; ?>
            <?php endif; ?>
          </div>

          <form class="pqir-form" method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
            <div class="pqir-field">
              <label>Status</label>
              <select class="pqir-input" name="status">
                <?php foreach (['new', 'reviewing', 'needs_alternative', 'rejected', 'transferred'] as $status): ?>
                  <option value="<?php echo s($status); ?>"<?php echo (string)$request->status === $status ? ' selected' : ''; ?>><?php echo s(pqireq_status_label($status)); ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="pqir-field">
              <label>Matched group ID</label>
              <?php if ($suggestions): ?>
                <select class="pqir-input" name="matched_groupid">
                  <option value="0">No group selected</option>
                  <?php foreach ($suggestions as $group): ?>
                    <option value="<?php echo (int)$group->id; ?>"<?php echo (int)$request->matched_groupid === (int)$group->id ? ' selected' : ''; ?>>#<?php echo (int)$group->id; ?> - <?php echo s((string)$group->title); ?> (<?php echo (int)$group->match_score; ?>%)</option>
                  <?php endforeach; ?>
                </select>
              <?php else: ?>
                <input class="pqir-input" name="matched_groupid" type="number" min="0" value="<?php echo (int)$request->matched_groupid; ?>">
              <?php endif; ?>
            </div>
            <div class="pqir-field">
              <label>Admin notes</label>
              <input class="pqir-input" name="admin_notes" value="<?php echo s((string)$request->admin_notes); ?>" placeholder="Alternative offered, parent contacted, placement note">
            </div>
            <button class="pqir-btn pqir-btn--light" type="submit" name="action" value="save_review">Save review</button>
            <button class="pqir-btn pqir-btn--brown" type="submit" name="action" value="load_intake">Load into intake</button>
          </form>
        </article>
      <?php endforeach; ?>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
