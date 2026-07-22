<?php
// ---- report: live-availability (teacher weekly availability grid) ------------
// Ported from local_hubredirect/live_availability.php via
// live_availability_portallib (pqlav_*). Dispatched from portal_data.php AFTER
// token auth: $claims is verified, $USER is the token user, JSON exception
// handler + CORS headers are installed. The legacy page stays live in parallel
// and is untouched. (live_availability.php has no pqh_live_security_audit calls
// — none to keep.)
//
// GET  = the teacher's weekly availability grid state: day/hour labels, the
//        slot length, and the currently-checked day|hour cells (computed with
//        the same pqlav_slot_is_checked the page uses while rendering).
// POST body JSON {"do":"save_calendar", teacherid, slots:["1|08:00", …]}
//        -> the legacy action=save_calendar block verbatim (validate against
//           the grid, deactivate active windows, insert the new windows, audit)
//           with confirm_sesskey dropped (token auth replaces the session key)
//           and the legacy redirect ?saved=1 replaced by ok JSON.
// POST body JSON {"do":"delete", id}
//        -> the legacy action=delete block verbatim (deactivate one window with
//           the same ownership/workspace checks) as ok JSON.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_availability_portallib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');

$userid = (int)($claims['sub'] ?? 0);
$context = context_system::instance();

// ---- workspace resolution (same order as the legacy page preamble) -----------
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspacecandidateid = $requestedworkspaceid > 0 ? $requestedworkspaceid : (int)($consumercontext->workspaceid ?? 0);
$workspaceid = pqh_current_workspace_id($userid, $workspacecandidateid);
if ($workspaceid <= 0 && $workspacecandidateid > 0) {
    $workspaceid = $workspacecandidateid;
}

// ---- entry access check (replicated from the legacy page preamble) -----------
// pqh_access_denied(...) -> pqpd_fail(403, same message).
$canmanageavailability = pqh_can_manage_academy_operations($userid)
    || has_capability('moodle/site:config', $context)
    || has_capability('moodle/site:configview', $context)
    || has_capability('moodle/user:update', $context)
    || has_capability('moodle/category:manage', $context);

$isavailabilityteacher = pqlav_is_teacher($userid);
if (!$canmanageavailability && !$isavailabilityteacher) {
    pqpd_fail(403, 'Only teachers and platform operations users can manage availability.');
}

$ready = pqlav_table_exists('local_prequran_live_availability');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid JSON body.');
    }
    $do = (string)($body['do'] ?? '');

    // A JSON body may carry the workspace context the legacy page took from GET.
    if (isset($body['workspaceid']) && (int)$body['workspaceid'] > 0) {
        $bodyworkspaceid = pqh_current_workspace_id($userid, (int)$body['workspaceid']);
        $workspaceid = $bodyworkspaceid > 0 ? $bodyworkspaceid : (int)$body['workspaceid'];
    }

    // -- write: save_calendar (legacy action=save_calendar, verbatim) ----------
    // confirm_sesskey() dropped: token auth replaces the session key.
    if ($do === 'save_calendar') {
        if (!$ready) {
            pqpd_fail(409, 'Run the Phase 19 availability SQL before managing availability windows.');
        }
        $requestedteacherid = (int)($body['teacherid'] ?? 0);
        $teacherid = $requestedteacherid > 0 ? $requestedteacherid : $userid;
        if (!$canmanageavailability) {
            $teacherid = $userid;
        }
        if ($canmanageavailability && $requestedteacherid > 0 && !pqlav_can_manage_teacher_for_workspace($workspaceid, $teacherid)) {
            pqpd_fail(403, 'This teacher is not linked to the selected workspace.');
        }

        $error = '';
        $slots = array_map('strval', array_values((array)($body['slots'] ?? [])));
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
        if ($error !== '') {
            pqpd_fail(400, $error);
        }
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
                'createdby' => $userid,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
        pqlav_audit($teacherid, ['slots' => $parsedslots]);
        echo json_encode([
            'ok' => true,
            'message' => 'Availability updated.',
            'teacherid' => $teacherid,
            'saved' => count($parsedslots),
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: delete (legacy action=delete, verbatim) ------------------------
    // confirm_sesskey() dropped: token auth replaces the session key.
    if ($do === 'delete') {
        if (!$ready) {
            pqpd_fail(409, 'Run the Phase 19 availability SQL before managing availability windows.');
        }
        $id = (int)($body['id'] ?? 0);
        if ($id <= 0) {
            pqpd_fail(403, 'Choose a valid availability window before removing it.');
        }
        $row = $DB->get_record('local_prequran_live_availability', ['id' => $id], '*', IGNORE_MISSING);
        if (!$row) {
            pqpd_fail(403, 'That availability window is no longer available. Please refresh the availability page.');
        }
        if ((!$canmanageavailability && (int)$row->teacherid !== $userid)
            || ($canmanageavailability && !pqlav_can_manage_teacher_for_workspace($workspaceid, (int)$row->teacherid))) {
            pqpd_fail(403, 'You cannot remove this availability window for the selected workspace.');
        }
        $row->status = 'inactive';
        $row->timemodified = time();
        $DB->update_record('local_prequran_live_availability', $row);
        pqlav_audit((int)$row->teacherid, ['removed' => $id]);
        echo json_encode([
            'ok' => true,
            'message' => 'Availability updated.',
            'teacherid' => (int)$row->teacherid,
            'removed' => $id,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown live-availability action.');
}

// ---- GET: the weekly availability grid state (same resolution as the page) ---
$requestedteacherid = optional_param('teacherid', 0, PARAM_INT);
$teacherid = $requestedteacherid > 0 ? $requestedteacherid : $userid;
if (!$canmanageavailability) {
    $teacherid = $userid;
}
if ($canmanageavailability && $requestedteacherid > 0 && !pqlav_can_manage_teacher_for_workspace($workspaceid, $teacherid)) {
    pqpd_fail(403, 'This teacher is not linked to the selected workspace.');
}

$days = pqlav_grid_days();
$hours = pqlav_grid_hours();
$slotminutes = pqlav_slot_minutes();
$slotlabel = ($slotminutes >= 60 && $slotminutes % 60 === 0)
    ? ((int)($slotminutes / 60)) . '-hour'
    : $slotminutes . '-minute';

$windows = $ready
    ? $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active'], 'weekday ASC, start_minute ASC')
    : [];
$calendar = pqlav_calendar_slots($windows);

// The page renders one checkbox per day×hour and marks it checked via
// pqlav_slot_is_checked — return the same checked set as "weekday|hour" values.
$checked = [];
foreach ($days as $day => $daylabel) {
    foreach ($hours as $hour => $hourlabel) {
        if (pqlav_slot_is_checked($calendar, (int)$day, (string)$hour)) {
            $checked[] = (int)$day . '|' . $hour;
        }
    }
}

$teacher = core_user::get_user($teacherid);

// Ordered day/hour lists so the client can build the grid in the page's order.
$daysout = [];
foreach ($days as $day => $daylabel) {
    $daysout[] = ['weekday' => (int)$day, 'label' => (string)$daylabel];
}
$hoursout = [];
foreach ($hours as $hour => $hourlabel) {
    $hoursout[] = ['hour' => (string)$hour, 'label' => (string)$hourlabel];
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'ready_message' => $ready ? '' : 'Run the Phase 19 availability SQL before managing availability windows.',
    'canmanage' => $canmanageavailability,
    'teacherid' => $teacherid,
    'teacher_name' => $teacher ? fullname($teacher) : ('Teacher ' . $teacherid),
    'slot_minutes' => $slotminutes,
    'slot_label' => $slotlabel,
    'days' => $daysout,
    'hours' => $hoursout,
    'checked' => $checked,
], JSON_UNESCAPED_SLASHES);
exit;
