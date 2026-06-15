<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_availability.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Availability');
$PAGE->set_heading('Teacher Availability');
$PAGE->add_body_class('pqh-live-availability-page');

function pqlav_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlav_is_managed_student(int $userid): bool {
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

function pqlav_is_teacher(int $userid): bool {
    global $DB;
    if (is_siteadmin($userid)) {
        return true;
    }
    if (pqlav_table_exists('local_prequran_teacher_profile')
        && $DB->record_exists_select(
            'local_prequran_teacher_profile',
            'userid = ? AND status IN (?, ?)',
            [$userid, 'active', 'pending']
        )) {
        return true;
    }
    if (pqlav_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = ?
            AND r.shortname IN ('editingteacher', 'teacher', 'manager')",
        [$userid]
    );
}

function pqlav_audit(int $teacherid, array $details): void {
    global $DB, $USER;
    if (!pqlav_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => 'availability_updated',
        'targettype' => 'teacher',
        'targetid' => $teacherid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqlav_minutes(string $time): int {
    if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', $time, $matches)) {
        return -1;
    }
    $hour = min(23, (int)$matches[1]);
    return ($hour * 60) + (int)$matches[2];
}

function pqlav_format_minute(int $minute): string {
    $minute = max(0, min(24 * 60, $minute));
    if ($minute === 24 * 60) {
        return '24:00';
    }
    return sprintf('%02d:%02d', intdiv($minute, 60), $minute % 60);
}

function pqlav_calendar_slots(array $windows): array {
    $calendar = array_fill(0, 7, []);
    foreach ($windows as $window) {
        $weekday = (int)$window->weekday;
        if ($weekday < 0 || $weekday > 6) {
            continue;
        }
        $calendar[$weekday][] = $window;
    }
    return $calendar;
}

function pqlav_grid_days(): array {
    return [1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday', 4 => 'Thursday', 5 => 'Friday', 6 => 'Saturday', 0 => 'Sunday'];
}

function pqlav_teacher_config(): array {
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $configpath = __DIR__ . '/teacher_intake_config.php';
    if (!is_readable($configpath)) {
        $config = [];
        return $config;
    }

    $loaded = require($configpath);
    $config = is_array($loaded) ? $loaded : [];
    return $config;
}

function pqlav_slot_minutes(): int {
    $config = pqlav_teacher_config();
    $minutes = (int)($config['availability_slot_minutes'] ?? 120);
    return max(1, min(24 * 60, $minutes));
}

function pqlav_grid_hours(): array {
    $fallback = [
        '00:00' => '2:00 AM',
        '02:00' => '4:00 AM',
        '04:00' => '6:00 AM',
        '06:00' => '8:00 AM',
        '08:00' => '10:00 AM',
        '10:00' => '12:00 PM',
        '12:00' => '14:00 PM',
        '14:00' => '16:00 PM',
        '16:00' => '18:00 PM',
        '18:00' => '20:00 PM',
        '20:00' => '22:00 PM',
        '22:00' => '24:00 PM',
    ];
    $config = pqlav_teacher_config();
    if (empty($config['availability_time_windows']) || !is_array($config['availability_time_windows'])) {
        return $fallback;
    }
    return $config['availability_time_windows'];
}

function pqlav_slot_is_checked(array $calendar, int $weekday, string $hour): bool {
    $start = pqlav_minutes($hour);
    if ($start < 0) {
        return false;
    }
    $end = min(24 * 60, $start + pqlav_slot_minutes());
    foreach ($calendar[$weekday] ?? [] as $window) {
        if ((int)$window->start_minute <= $start && (int)$window->end_minute >= $end) {
            return true;
        }
    }
    return false;
}

$canmanageavailability = is_siteadmin((int)$USER->id)
    || has_capability('moodle/site:config', $context)
    || has_capability('moodle/site:configview', $context)
    || has_capability('moodle/user:update', $context)
    || has_capability('moodle/category:manage', $context);

if (!$canmanageavailability && (!pqlav_is_teacher((int)$USER->id) || pqlav_is_managed_student((int)$USER->id))) {
    throw new moodle_exception('nopermissions', '', '', 'Only teachers and administrators can manage availability.');
}

$ready = pqlav_table_exists('local_prequran_live_availability');
$teacherid = optional_param('teacherid', (int)$USER->id, PARAM_INT);
if (!$canmanageavailability) {
    $teacherid = (int)$USER->id;
}
$notice = '';
$error = '';

if ($ready && data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'save_calendar') {
    require_sesskey();
    $slots = optional_param_array('slots', [], PARAM_TEXT);
    $validdays = array_keys(pqlav_grid_days());
    $validhours = array_keys(pqlav_grid_hours());
    $slotminutes = pqlav_slot_minutes();
    $parsedslots = [];
    foreach (array_unique($slots) as $slot) {
        $parts = explode('|', (string)$slot, 2);
        if (count($parts) !== 2 || !ctype_digit($parts[0])) {
            $error = 'Choose availability from the weekly calendar.';
            break;
        }
        $weekday = (int)$parts[0];
        $hour = $parts[1];
        if (!in_array($weekday, $validdays, true) || !in_array($hour, $validhours, true)) {
            $error = 'Choose availability from the weekly calendar.';
            break;
        }
        $start = pqlav_minutes($hour);
        if ($start < 0 || $start + $slotminutes > 24 * 60) {
            $error = 'Choose availability from the weekly calendar.';
            break;
        }
        $parsedslots[] = ['weekday' => $weekday, 'start' => $start, 'end' => $start + $slotminutes];
    }
    if ($error === '') {
        $now = time();
        $oldwindows = $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active']);
        foreach ($oldwindows as $oldwindow) {
            $oldwindow->status = 'inactive';
            $oldwindow->timemodified = $now;
            $DB->update_record('local_prequran_live_availability', $oldwindow);
        }
        foreach ($parsedslots as $slot) {
            $DB->insert_record('local_prequran_live_availability', (object)[
                'teacherid' => $teacherid,
                'weekday' => $slot['weekday'],
                'start_minute' => $slot['start'],
                'end_minute' => $slot['end'],
                'timezone' => core_date::get_server_timezone(),
                'status' => 'active',
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
        pqlav_audit($teacherid, ['slots' => $parsedslots]);
        redirect(new moodle_url('/local/hubredirect/live_availability.php', ['teacherid' => $teacherid, 'saved' => 1]));
    }
}

if ($ready && optional_param('action', '', PARAM_ALPHANUMEXT) === 'delete') {
    require_sesskey();
    $id = required_param('id', PARAM_INT);
    $row = $DB->get_record('local_prequran_live_availability', ['id' => $id], '*', MUST_EXIST);
    if (!$canmanageavailability && (int)$row->teacherid !== (int)$USER->id) {
        throw new moodle_exception('nopermissions', '', '', 'You cannot remove this availability window.');
    }
    $row->status = 'inactive';
    $row->timemodified = time();
    $DB->update_record('local_prequran_live_availability', $row);
    pqlav_audit((int)$row->teacherid, ['removed' => $id]);
    redirect(new moodle_url('/local/hubredirect/live_availability.php', ['teacherid' => (int)$row->teacherid, 'saved' => 1]));
}

if (optional_param('saved', 0, PARAM_BOOL)) {
    $notice = 'Availability updated.';
}

$windows = $ready ? $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active'], 'weekday ASC, start_minute ASC') : [];
$teacher = core_user::get_user($teacherid);
$days = pqlav_grid_days();
$hours = pqlav_grid_hours();
$calendar = pqlav_calendar_slots($windows);
$slotminutes = pqlav_slot_minutes();
$slotlabel = ($slotminutes >= 60 && $slotminutes % 60 === 0)
    ? ((int)($slotminutes / 60)) . '-hour'
    : $slotminutes . '-minute';

echo $OUTPUT->header();
?>
<style>
body.pqh-live-availability-page header,
body.pqh-live-availability-page footer,
body.pqh-live-availability-page nav.navbar,
body.pqh-live-availability-page #page-header,
body.pqh-live-availability-page #page-footer,
body.pqh-live-availability-page .drawer,
body.pqh-live-availability-page .drawer-toggles,
body.pqh-live-availability-page .block-region,
body.pqh-live-availability-page [data-region="drawer"],
body.pqh-live-availability-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-availability-page #page,
body.pqh-live-availability-page #page-content,
body.pqh-live-availability-page #region-main,
body.pqh-live-availability-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlav-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlav-wrap{max-width:1320px;margin:0 auto}
.pqlav-top,.pqlav-panel{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlav-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqlav-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlav-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlav-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlav-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlav-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlav-grid{display:grid;grid-template-columns:1fr;gap:16px}
.pqlav-field{display:grid;gap:6px;margin-bottom:12px}
.pqlav-field label{font-size:13px;font-weight:900;color:#415665}
.pqlav-input{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}
.pqlav-list{display:grid;gap:10px}
.pqlav-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}
.pqlav-list-title{margin:0 0 12px;font-size:18px;line-height:1.2;font-weight:950;color:#173044}
.pqlav-matrix-wrap{overflow:auto;border:2px solid #d9e7f7;border-radius:18px;background:#fff;margin:8px 0 16px}
.pqlav-matrix{width:100%;min-width:1120px;border-collapse:separate;border-spacing:0}
.pqlav-matrix th,.pqlav-matrix td{border-right:1px solid #dfe8ef;border-bottom:1px solid #dfe8ef;text-align:center;vertical-align:middle}
.pqlav-matrix th{padding:16px 10px;background:#e9f8fb;color:#173044;font-size:15px;font-weight:950;white-space:pre-line}
.pqlav-matrix th:first-child{width:130px}
.pqlav-matrix td:first-child{padding:18px 12px;text-align:left;background:#fffdf8;color:#09213a;font-size:16px;font-weight:950}
.pqlav-matrix tr:nth-child(even) td:first-child{background:#fbfffb}
.pqlav-matrix td:not(:first-child){padding:12px 10px}
.pqlav-cell{display:inline-grid;place-items:center;width:42px;height:42px;border:1px solid #d4e9fb;border-radius:12px;background:#eef7ff;cursor:pointer}
.pqlav-cell input{width:22px;height:22px;accent-color:#2f6f4e;cursor:pointer}
.pqlav-cell:has(input:checked){background:#e4f5ea;border-color:#8fc39e}
.pqlav-helper{margin:0 0 8px;color:#415665;font-size:13px;font-weight:850}
.pqlav-alert{margin-bottom:14px;padding:12px 14px;border-radius:8px;font-size:14px;font-weight:850}
.pqlav-alert--ok{background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16)}
.pqlav-alert--bad{background:#fff0ed;color:#883526;border:1px solid rgba(136,53,38,.16)}
.pqlav-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
@media(max-width:760px){.pqlav-top{display:block}.pqlav-actions{margin-top:12px}.pqlav-title{font-size:24px}}
</style>
<main class="pqlav-shell">
  <div class="pqlav-wrap">
    <section class="pqlav-top">
      <div>
        <h1 class="pqlav-title">Teacher Availability</h1>
        <p class="pqlav-sub"><?php echo s($teacher ? fullname($teacher) : 'Teacher ' . $teacherid); ?> - weekly windows used by conflict prevention.</p>
      </div>
      <div class="pqlav-actions">
        <a class="pqlav-btn pqlav-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <a class="pqlav-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher.php'))->out(false); ?>">Teacher workspace</a>
      </div>
    </section>
    <?php if ($notice !== ''): ?><div class="pqlav-alert pqlav-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqlav-alert pqlav-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <?php if (!$ready): ?>
      <div class="pqlav-empty">Run the Phase 19 availability SQL before managing availability windows.</div>
    <?php else: ?>
      <section class="pqlav-grid">
        <article class="pqlav-panel">
          <form method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="save_calendar">
            <?php if ($canmanageavailability): ?>
              <div class="pqlav-field">
                <label for="teacherid">Teacher user ID</label>
                <input class="pqlav-input" id="teacherid" name="teacherid" type="number" min="1" value="<?php echo (int)$teacherid; ?>">
              </div>
            <?php endif; ?>
            <h2 class="pqlav-list-title">Select all recurring times this teacher can teach</h2>
            <p class="pqlav-helper">Checked times are saved as <?php echo s($slotlabel); ?> weekly availability windows and used by class-group matching and conflict prevention.</p>
            <div class="pqlav-matrix-wrap">
              <table class="pqlav-matrix" aria-label="Teacher weekly availability calendar">
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    <?php foreach ($hours as $hour => $label): ?>
                      <th scope="col"><?php echo s(str_replace(' ', "\n", $label)); ?></th>
                    <?php endforeach; ?>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach ($days as $day => $daylabel): ?>
                    <tr>
                      <td><?php echo s($daylabel); ?></td>
                      <?php foreach ($hours as $hour => $hourlabel): ?>
                        <?php $slotvalue = (int)$day . '|' . $hour; ?>
                        <td>
                          <label class="pqlav-cell" title="<?php echo s($daylabel . ' ' . $hourlabel); ?>">
                            <input type="checkbox" name="slots[]" value="<?php echo s($slotvalue); ?>" <?php echo pqlav_slot_is_checked($calendar, (int)$day, (string)$hour) ? 'checked' : ''; ?>>
                          </label>
                        </td>
                      <?php endforeach; ?>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
            <button class="pqlav-btn" type="submit">Save availability calendar</button>
          </form>
        </article>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
