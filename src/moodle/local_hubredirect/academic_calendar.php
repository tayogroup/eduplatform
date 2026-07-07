<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/admissionslib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_current_consumer_context();
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Academic calendar management requires workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Calendar access denied');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/academic_calendar.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Academic Calendar');
$PAGE->set_heading('Academic Calendar');

$notice = '';
$error = '';
$ready = pqh_table_exists_safe('local_prequran_acad_term') && pqh_table_exists_safe('local_prequran_acad_event');
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!$ready) {
            throw new invalid_parameter_exception('Academic calendar tables are not installed yet. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_term') {
            $termid = optional_param('termid', 0, PARAM_INT);
            $existing = $termid > 0 ? $DB->get_record('local_prequran_acad_term', ['id' => $termid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'consumerid' => (int)($consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'term_code' => optional_param('term_code', '', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'term_type' => optional_param('term_type', 'term', PARAM_ALPHANUMEXT),
                'startdate' => pqadm_date_to_time(optional_param('startdate', '', PARAM_TEXT)),
                'enddate' => pqadm_date_to_time(optional_param('enddate', '', PARAM_TEXT)),
                'enrollment_open' => pqadm_date_to_time(optional_param('enrollment_open', '', PARAM_TEXT)),
                'enrollment_close' => pqadm_date_to_time(optional_param('enrollment_close', '', PARAM_TEXT)),
                'add_drop_deadline' => pqadm_date_to_time(optional_param('add_drop_deadline', '', PARAM_TEXT)),
                'withdrawal_deadline' => pqadm_date_to_time(optional_param('withdrawal_deadline', '', PARAM_TEXT)),
                'refund_deadline' => pqadm_date_to_time(optional_param('refund_deadline', '', PARAM_TEXT)),
                'status' => optional_param('status', 'planned', PARAM_ALPHANUMEXT),
                'notes' => optional_param('notes', '', PARAM_TEXT),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_acad_term', $record);
            } else {
                $DB->insert_record('local_prequran_acad_term', $record);
            }
            $notice = 'Term saved.';
        } else if ($action === 'save_event') {
            $eventid = optional_param('eventid', 0, PARAM_INT);
            $existing = $eventid > 0 ? $DB->get_record('local_prequran_acad_event', ['id' => $eventid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'termid' => optional_param('termid', 0, PARAM_INT),
                'event_type' => optional_param('event_type', 'holiday', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'startdate' => pqadm_date_to_time(optional_param('startdate', '', PARAM_TEXT)),
                'enddate' => pqadm_date_to_time(optional_param('enddate', '', PARAM_TEXT)),
                'blackout' => optional_param('blackout', 0, PARAM_INT) ? 1 : 0,
                'notes' => optional_param('notes', '', PARAM_TEXT),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_acad_event', $record);
            } else {
                $DB->insert_record('local_prequran_acad_event', $record);
            }
            $notice = 'Calendar event saved.';
        } else if ($action === 'bind_offering') {
            if (!pqh_table_exists_safe('local_prequran_course_offering') || !pqh_table_has_field_safe('local_prequran_course_offering', 'termid')) {
                throw new invalid_parameter_exception('Course offering term fields are not installed yet.');
            }
            $offering = $DB->get_record('local_prequran_course_offering', ['id' => optional_param('offeringid', 0, PARAM_INT), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $offering->termid = optional_param('termid', 0, PARAM_INT);
            $offering->schedule_json = pqadm_metadata([
                'days' => optional_param('schedule_days', '', PARAM_TEXT),
                'time' => optional_param('schedule_time', '', PARAM_TEXT),
                'timezone' => optional_param('schedule_timezone', '', PARAM_TEXT),
                'room' => optional_param('schedule_room', '', PARAM_TEXT),
            ]);
            $offering->add_drop_deadline = pqadm_date_to_time(optional_param('add_drop_deadline', '', PARAM_TEXT));
            $offering->withdrawal_deadline = pqadm_date_to_time(optional_param('withdrawal_deadline', '', PARAM_TEXT));
            $offering->refund_deadline = pqadm_date_to_time(optional_param('refund_deadline', '', PARAM_TEXT));
            $offering->timemodified = $now;
            $DB->update_record('local_prequran_course_offering', $offering);
            $notice = 'Course section schedule and deadlines saved.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$terms = $ready ? array_values($DB->get_records('local_prequran_acad_term', ['workspaceid' => $workspaceid], 'startdate DESC, id DESC')) : [];
$events = $ready ? array_values($DB->get_records('local_prequran_acad_event', ['workspaceid' => $workspaceid], 'startdate DESC, id DESC', '*', 0, 80)) : [];
$offerings = pqh_table_exists_safe('local_prequran_course_offering') ? array_values($DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'startdate DESC, title ASC')) : [];

echo $OUTPUT->header();
echo '<style>.pqcal-wrap{max-width:1180px;margin:0 auto}.pqcal-top{display:flex;justify-content:space-between;gap:12px;margin-bottom:16px}.pqcal-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqcal-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqcal-field{margin-bottom:10px}.pqcal-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqcal-input,.pqcal-select,.pqcal-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqcal-textarea{min-height:70px}.pqcal-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqcal-btn--light{background:#f7fbf8;color:#173044}.pqcal-table{width:100%;border-collapse:collapse}.pqcal-table th,.pqcal-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqcal-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqcal-muted{color:#617064;font-size:12px}.pqcal-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqcal-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqcal-grid,.pqcal-top{display:block}}</style>';
echo '<div class="pqcal-wrap"><div class="pqcal-top"><div><h2>Academic Calendar And Terms</h2><div class="pqcal-muted">' . s($workspace->name) . ' terms, holidays, blackout dates, enrollment windows, schedules, and deadlines.</div></div><a class="pqcal-btn pqcal-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqcal-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqcal-error">' . s($error) . '</div>'; }
if (!$ready) { echo '<div class="pqcal-error">Academic calendar schema is not ready. Run the Moodle local_prequran upgrade.</div>'; }
echo '<div class="pqcal-grid"><section class="pqcal-panel"><h3>Term</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_term">';
foreach ([['term_code','Term code'],['title','Title'],['term_type','Type'],['startdate','Start date'],['enddate','End date'],['enrollment_open','Enrollment opens'],['enrollment_close','Enrollment closes'],['add_drop_deadline','Add/drop deadline'],['withdrawal_deadline','Withdrawal deadline'],['refund_deadline','Refund deadline'],['status','Status']] as $field) {
    echo '<div class="pqcal-field"><label>' . s($field[1]) . '</label><input class="pqcal-input" name="' . s($field[0]) . '"></div>';
}
echo '<div class="pqcal-field"><label>Notes</label><textarea class="pqcal-textarea" name="notes"></textarea></div><button class="pqcal-btn" type="submit">Save Term</button></form>';
echo '<hr><h3>Holiday / Blackout</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_event"><div class="pqcal-field"><label>Term</label><select class="pqcal-select" name="termid"><option value="0">Workspace-wide</option>';
foreach ($terms as $term) { echo '<option value="' . (int)$term->id . '">' . s($term->title) . '</option>'; }
echo '</select></div>';
foreach ([['title','Title'],['event_type','Type'],['startdate','Start date'],['enddate','End date'],['status','Status']] as $field) {
    echo '<div class="pqcal-field"><label>' . s($field[1]) . '</label><input class="pqcal-input" name="' . s($field[0]) . '"></div>';
}
echo '<div class="pqcal-field"><label><input type="checkbox" name="blackout" value="1"> Blackout scheduling</label></div><div class="pqcal-field"><label>Notes</label><textarea class="pqcal-textarea" name="notes"></textarea></div><button class="pqcal-btn" type="submit">Save Event</button></form></section>';
echo '<section class="pqcal-panel"><h3>Course Section Schedule</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="bind_offering"><div class="pqcal-field"><label>Offering</label><select class="pqcal-select" name="offeringid">';
foreach ($offerings as $offering) { echo '<option value="' . (int)$offering->id . '">' . s($offering->title) . '</option>'; }
echo '</select></div><div class="pqcal-field"><label>Term</label><select class="pqcal-select" name="termid"><option value="0">No term</option>';
foreach ($terms as $term) { echo '<option value="' . (int)$term->id . '">' . s($term->title) . '</option>'; }
echo '</select></div>';
foreach ([['schedule_days','Meeting days'],['schedule_time','Meeting time'],['schedule_timezone','Timezone'],['schedule_room','Room or link'],['add_drop_deadline','Add/drop deadline'],['withdrawal_deadline','Withdrawal deadline'],['refund_deadline','Refund deadline']] as $field) {
    echo '<div class="pqcal-field"><label>' . s($field[1]) . '</label><input class="pqcal-input" name="' . s($field[0]) . '"></div>';
}
echo '<button class="pqcal-btn" type="submit">Save Schedule</button></form><hr><h3>Terms</h3><table class="pqcal-table"><thead><tr><th>Term</th><th>Enrollment</th><th>Deadlines</th></tr></thead><tbody>';
foreach ($terms as $term) {
    echo '<tr><td><strong>' . s($term->title) . '</strong><div class="pqcal-muted">' . s($term->term_code . ' / ' . $term->status) . '</div><span class="pqcal-pill">' . s(pqadm_time_to_date((int)$term->startdate) . ' to ' . pqadm_time_to_date((int)$term->enddate)) . '</span></td><td>' . s(pqadm_time_to_date((int)$term->enrollment_open) . ' to ' . pqadm_time_to_date((int)$term->enrollment_close)) . '</td><td>Add/drop ' . s(pqadm_time_to_date((int)$term->add_drop_deadline)) . '<br>Withdraw ' . s(pqadm_time_to_date((int)$term->withdrawal_deadline)) . '<br>Refund ' . s(pqadm_time_to_date((int)$term->refund_deadline)) . '</td></tr>';
}
if (!$terms) { echo '<tr><td colspan="3" class="pqcal-muted">No terms yet.</td></tr>'; }
echo '</tbody></table><h3>Events</h3><table class="pqcal-table"><thead><tr><th>Event</th><th>Dates</th><th>Scope</th></tr></thead><tbody>';
foreach ($events as $event) {
    echo '<tr><td><strong>' . s($event->title) . '</strong><div class="pqcal-muted">' . s($event->event_type . ' / ' . $event->status) . '</div></td><td>' . s(pqadm_time_to_date((int)$event->startdate) . ' to ' . pqadm_time_to_date((int)$event->enddate)) . '</td><td>' . ((int)$event->blackout ? '<span class="pqcal-pill">blackout</span>' : '<span class="pqcal-pill">informational</span>') . '</td></tr>';
}
if (!$events) { echo '<tr><td colspan="3" class="pqcal-muted">No holidays or blackout dates yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
