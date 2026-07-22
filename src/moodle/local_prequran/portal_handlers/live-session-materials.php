<?php
// ---- report: live-session-materials (materials attached to a live session) -----
// Ported from local_hubredirect/live_session_materials.php via
// live_session_materials_portallib (pqlmat_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the session deck (agenda) + the workspace's Bunny-backed PDF/PowerPoint
//        materials, decorated exactly as the legacy page renders them.
// POST = do=whiteboard (grid/blank whiteboard swap) | do=insert (materialid=0 =>
//        restore agenda; materialid>0 => send a workspace material) — each the
//        legacy action=... write, calling the same verbatim pqlmat_* insert
//        helpers. confirm_sesskey() dropped: token auth replaces it. There is NO
//        file upload on this page (materials come from the workspace library that
//        the separate workspace-materials page maintains), so nothing is skipped
//        for upload reasons. The legacy access_denied/redirect (pqh_access_denied)
//        is HTML and cannot ride a JSON response, so the entry guards below and
//        the live-room preconditions are mirrored with pqpd_fail(...) using the
//        legacy message text verbatim; the verbatim helpers still guard the
//        deeper "service not ready" cases via pqlmat_stop (see caveat).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_session_materials_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// -- session + workspace resolution + entry access check (same order and message
// -- text as the legacy page). pqh_access_denied(...) -> pqpd_fail(403, same). --
$consumercontext = pqh_requested_consumer_context();
$sessionid = $ispost
    ? (int)($body['sessionid'] ?? 0)
    : optional_param('sessionid', 0, PARAM_INT);
$workspaceid = $ispost
    ? (int)($body['workspaceid'] ?? 0)
    : optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if (!pqh_table_exists_safe('local_prequran_live_session')) {
    pqpd_fail(403, 'Live-session tables are not ready. Please ask support to complete the live-session upgrade.');
}
$session = $sessionid > 0
    ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING)
    : false;
if (!$session) {
    pqpd_fail(403, 'Choose a valid live session before opening Teacher Materials.');
}
if ($workspaceid <= 0 && !empty($session->workspaceid)) {
    $workspaceid = (int)$session->workspaceid;
    $urlparams['workspaceid'] = $workspaceid;
}
// The session's own teacher always manages their own materials; the shared guard
// vetoes by consumer context first, so check teachership before consulting it.
if ((int)$session->teacherid !== $userid
        && !pqh_live_session_user_can_manage_agenda($session, $userid)) {
    pqpd_fail(403, 'Only the session teacher and academy admins can swap live-session materials.');
}
$workspaceid = pqlmat_workspace_id($session);
if ($workspaceid > 0 && (int)$session->teacherid !== $userid
        && !pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace teaching and admin users can use this materials library.');
}

if ($ispost) {
    $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);

    if ($do === 'whiteboard') {
        // -- write: whiteboard (legacy action=whiteboard, verbatim insert) --
        $wbstyle = clean_param((string)($body['wbstyle'] ?? 'grid'), PARAM_ALPHA) === 'blank' ? 'blank' : 'grid';
        if (empty($session->bbb_created) || (string)($session->status ?? '') !== 'live') {
            pqpd_fail(400, 'The BBB room is not live yet. Start class before swapping materials.');
        }
        try {
            pqlmat_insert_whiteboard($session, $wbstyle);
        } catch (Throwable $e) {
            pqlmat_audit($sessionid, 'bbb_whiteboard_insert_failed', 'session', $sessionid, ['error' => $e->getMessage()]);
            pqpd_fail(400, 'The whiteboard could not be sent to the live room. Please ask support to review the live-room material setup.');
        }
        echo json_encode([
            'ok' => true,
            'message' => ($wbstyle === 'blank' ? 'Blank' : 'Grid') . ' whiteboard opened in the live room.',
            'sessionid' => $sessionid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'insert') {
        // -- write: insert (legacy action=insert, verbatim insert helpers) --
        $materialid = (int)($body['materialid'] ?? 0);
        if (empty($session->bbb_created) || (string)($session->status ?? '') !== 'live') {
            pqpd_fail(400, 'The BBB room is not live yet. Start class before swapping materials.');
        }
        if ($materialid <= 0) {
            // Restore the session's own agenda deck.
            if (pqlmat_agenda_public_url($session) === '') {
                pqpd_fail(400, 'The agenda deck does not have a public document URL.');
            }
            try {
                $agendafile = clean_filename((string)($session->agenda_slides_filename ?? 'Live Session Agenda template.pptx'));
                pqlmat_insert_agenda_url($session, $agendafile !== '' ? $agendafile : 'Live Session Agenda template.pptx');
            } catch (Throwable $e) {
                pqlmat_audit($sessionid, 'bbb_agenda_restore_failed', 'session', $sessionid, ['error' => $e->getMessage()]);
                pqpd_fail(400, 'The agenda could not be sent to the live room. Please ask support to review the live-room material setup.');
            }
            echo json_encode([
                'ok' => true,
                'message' => 'Agenda restored in the live room.',
                'sessionid' => $sessionid,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        }

        $material = $DB->get_record('local_prequran_workspace_material', [
            'id' => $materialid,
            'workspaceid' => $workspaceid,
            'status' => 'active',
        ]);
        if (!$material) {
            pqpd_fail(400, 'Choose an active workspace material before sending it to the live room.');
        }
        if (!pqh_workspace_material_live_supported($material)) {
            pqpd_fail(400, 'Choose a PDF or PowerPoint file stored in Bunny.');
        }
        try {
            $filename = pqh_workspace_material_filename($material);
            pqlmat_insert_material_url($session, $material, $filename);
        } catch (Throwable $e) {
            pqlmat_audit($sessionid, 'bbb_material_insert_failed', 'workspace_material', $materialid, ['error' => $e->getMessage()]);
            pqpd_fail(400, 'The material could not be sent to the live room. Please ask support to review the live-room material setup.');
        }
        echo json_encode([
            'ok' => true,
            'message' => 'Material sent to the live room.',
            'sessionid' => $sessionid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown live-session-materials action.');
}

// -- GET: the session deck + workspace library exactly as the legacy page builds --
$materials = pqlmat_materials($workspaceid);
$agendaurl = pqh_live_session_agenda_public_url($session);

$materialsout = [];
foreach ($materials as $material) {
    $filename = pqh_workspace_material_filename($material);
    $materialsout[] = [
        'id' => (int)$material->id,
        'title' => (string)$material->title,
        'description' => (string)($material->description ?? ''),
        'material_type' => (string)$material->material_type,
        'ext' => strtoupper(pathinfo($filename, PATHINFO_EXTENSION)),
        'timemodified' => (int)$material->timemodified,
        'timemodified_label' => userdate((int)$material->timemodified, get_string('strftimedatetimeshort')),
    ];
}

$bbblive = !empty($session->bbb_created) && (string)($session->status ?? '') === 'live';

echo json_encode([
    'ok' => true,
    'ready' => true,
    'session' => [
        'id' => (int)$session->id,
        'title' => (string)$session->title,
        'status' => (string)($session->status ?? ''),
        'teacherid' => (int)$session->teacherid,
        'bbb_live' => $bbblive,
    ],
    'agenda' => [
        'attached' => $agendaurl !== '',
        'filename' => (string)($session->agenda_slides_filename ?? 'Live Session Agenda template.pptx'),
    ],
    'workspaceid' => $workspaceid,
    'materials' => $materialsout,
    'legacyurl' => (new moodle_url('/local/hubredirect/live_session_materials.php', $urlparams + ['sessionid' => $sessionid]))->out(false),
    'names' => pqpd_names([(int)$session->teacherid]),
], JSON_UNESCAPED_SLASHES);
exit;
