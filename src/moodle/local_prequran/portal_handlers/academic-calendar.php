<?php
// ---- report: academic-calendar (workspace academic terms + calendar) ---------
// Ported from local_hubredirect/academic_calendar.php (which stays live in
// parallel). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
//
// GET  = the workspace calendar state (terms + events + course-section
//        offerings, exactly as the legacy page loads them, plus createdby names).
// POST = do=save_term | save_event | bind_offering — each is the legacy
//        action=... write ported verbatim over a JSON body. require_sesskey()
//        is dropped (token auth replaces the session key); the legacy page's
//        HTML redirect/notice becomes an ok JSON payload with the same message.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/admissionslib.php');
require_once($CFG->dirroot . '/local/hubredirect/academic_calendar_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- Access: identical to the legacy page (workspace administrator only). ------
// pqh_access_denied(...) on the page becomes pqpd_fail(403, <same message>).
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_current_consumer_context();
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Academic calendar management requires workspace administrator access.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$ready = pqh_table_exists_safe('local_prequran_acad_term') && pqh_table_exists_safe('local_prequran_acad_event');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid request body.');
    }
    $action = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);

    // require_sesskey() dropped: token auth replaces the session key.
    if (!$ready) {
        pqpd_fail(409, 'Academic calendar tables are not installed yet. Run Moodle upgrade.');
    }

    // JSON-body equivalents of the page's optional_param reads.
    $bint = static function (string $name, int $default = 0) use ($body): int {
        return (int)clean_param($body[$name] ?? $default, PARAM_INT);
    };
    $balpha = static function (string $name, string $default = '') use ($body): string {
        return clean_param((string)($body[$name] ?? $default), PARAM_ALPHANUMEXT);
    };
    $btext = static function (string $name, string $default = '') use ($body): string {
        return clean_param((string)($body[$name] ?? $default), PARAM_TEXT);
    };

    $now = time();
    try {
        // -- write: save_term (legacy action=save_term, verbatim) --------------
        if ($action === 'save_term') {
            $termid = $bint('termid');
            $existing = $termid > 0 ? $DB->get_record('local_prequran_acad_term', ['id' => $termid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'consumerid' => (int)($consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'term_code' => $balpha('term_code'),
                'title' => $btext('title'),
                'term_type' => $balpha('term_type', 'term'),
                'startdate' => pqadm_date_to_time($btext('startdate')),
                'enddate' => pqadm_date_to_time($btext('enddate')),
                'enrollment_open' => pqadm_date_to_time($btext('enrollment_open')),
                'enrollment_close' => pqadm_date_to_time($btext('enrollment_close')),
                'add_drop_deadline' => pqadm_date_to_time($btext('add_drop_deadline')),
                'withdrawal_deadline' => pqadm_date_to_time($btext('withdrawal_deadline')),
                'refund_deadline' => pqadm_date_to_time($btext('refund_deadline')),
                'status' => $balpha('status', 'planned'),
                'notes' => $btext('notes'),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_acad_term', $record);
                $termid = (int)$existing->id;
            } else {
                $termid = (int)$DB->insert_record('local_prequran_acad_term', $record);
            }
            echo json_encode(['ok' => true, 'message' => 'Term saved.', 'termid' => $termid], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: save_event (legacy action=save_event, verbatim) ------------
        if ($action === 'save_event') {
            $eventid = $bint('eventid');
            $existing = $eventid > 0 ? $DB->get_record('local_prequran_acad_event', ['id' => $eventid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'termid' => $bint('termid'),
                'event_type' => $balpha('event_type', 'holiday'),
                'title' => $btext('title'),
                'startdate' => pqadm_date_to_time($btext('startdate')),
                'enddate' => pqadm_date_to_time($btext('enddate')),
                'blackout' => $bint('blackout') ? 1 : 0,
                'notes' => $btext('notes'),
                'status' => $balpha('status', 'active'),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_acad_event', $record);
                $eventid = (int)$existing->id;
            } else {
                $eventid = (int)$DB->insert_record('local_prequran_acad_event', $record);
            }
            echo json_encode(['ok' => true, 'message' => 'Calendar event saved.', 'eventid' => $eventid], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: bind_offering (legacy action=bind_offering, verbatim) ------
        if ($action === 'bind_offering') {
            if (!pqh_table_exists_safe('local_prequran_course_offering') || !pqh_table_has_field_safe('local_prequran_course_offering', 'termid')) {
                pqpd_fail(409, 'Course offering term fields are not installed yet.');
            }
            $offering = $DB->get_record('local_prequran_course_offering', ['id' => $bint('offeringid'), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $offering->termid = $bint('termid');
            $offering->schedule_json = pqadm_metadata([
                'days' => $btext('schedule_days'),
                'time' => $btext('schedule_time'),
                'timezone' => $btext('schedule_timezone'),
                'room' => $btext('schedule_room'),
            ]);
            $offering->add_drop_deadline = pqadm_date_to_time($btext('add_drop_deadline'));
            $offering->withdrawal_deadline = pqadm_date_to_time($btext('withdrawal_deadline'));
            $offering->refund_deadline = pqadm_date_to_time($btext('refund_deadline'));
            $offering->timemodified = $now;
            $DB->update_record('local_prequran_course_offering', $offering);
            echo json_encode(['ok' => true, 'message' => 'Course section schedule and deadlines saved.', 'offeringid' => (int)$offering->id], JSON_UNESCAPED_SLASHES);
            exit;
        }

        pqpd_fail(400, 'Unknown academic-calendar action.');
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: the calendar state (same loads + ordering as the page) ---------------
$terms = $ready ? array_values($DB->get_records('local_prequran_acad_term', ['workspaceid' => $workspaceid], 'startdate DESC, id DESC')) : [];
$events = $ready ? array_values($DB->get_records('local_prequran_acad_event', ['workspaceid' => $workspaceid], 'startdate DESC, id DESC', '*', 0, 80)) : [];
$offerings = pqh_table_exists_safe('local_prequran_course_offering') ? array_values($DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'startdate DESC, title ASC')) : [];

$nameids = [];
foreach ($terms as $term) {
    $nameids[] = (int)($term->createdby ?? 0);
}
foreach ($events as $event) {
    $nameids[] = (int)($event->createdby ?? 0);
}

echo json_encode([
    'ok' => true, 'ready' => $ready,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'offerings_field_ready' => pqh_table_has_field_safe('local_prequran_course_offering', 'termid'),
    'terms' => $terms,
    'events' => $events,
    'offerings' => $offerings,
    'supporturl' => $CFG->wwwroot . '/local/hubredirect/academic_calendar.php?workspaceid=' . $workspaceid,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
