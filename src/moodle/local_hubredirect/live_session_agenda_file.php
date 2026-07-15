<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
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
$sessionid = optional_param('sessionid', 0, PARAM_INT);
$returnurl = new moodle_url($workspaceid > 0 ? '/local/hubredirect/live_sessions.php' : '/local/hubredirect/dashboard.php', $urlparams);

function pqlagf_can_download_slides(stdClass $session, int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    $sessionworkspaceid = (int)($session->workspaceid ?? 0);
    if ($sessionworkspaceid > 0 && !pqh_consumer_context_allows_workspace(null, $sessionworkspaceid)) {
        return false;
    }
    if (pqh_can_manage_academy_operations($userid) || (int)$session->teacherid === $userid) {
        return true;
    }
    if (!empty($session->workspaceid) && pqh_user_can_teach_in_workspace($userid, (int)$session->workspaceid)) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_live_participant')
        && $DB->record_exists('local_prequran_live_participant', [
            'sessionid' => (int)$session->id,
            'userid' => $userid,
            'role' => 'teacher',
            'status' => 'active',
        ])) {
        return true;
    }
    return pqh_user_has_role_shortname($userid, ['editingteacher', 'teacher', 'manager']);
}

if (!pqh_table_exists_safe('local_prequran_live_session')) {
    pqh_access_denied('Live session tables are not installed.', $returnurl, 'Agenda slides unavailable');
}
$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqh_access_denied('Choose a valid live session before opening agenda slides.', $returnurl, 'Agenda slides unavailable');
}
if ($workspaceid <= 0 && !empty($session->workspaceid)) {
    $workspaceid = (int)$session->workspaceid;
    $urlparams['workspaceid'] = $workspaceid;
    $returnurl = new moodle_url('/local/hubredirect/live_sessions.php', $urlparams);
}
if (!pqlagf_can_download_slides($session, (int)$USER->id)) {
    pqh_access_denied('Only the session teacher and academy admins can open attached agenda slides.', $returnurl, 'Live-session agenda access required');
}
if (empty($session->agenda_slides_path)) {
    pqh_access_denied('No agenda slides are attached to this live session yet.', $returnurl, 'Agenda slides unavailable');
}

try {
    $bytes = pqh_live_session_agenda_bytes($session);
} catch (Throwable $e) {
    pqh_access_denied('The agenda slides could not be loaded. Please ask support to review the live-session storage setup.', $returnurl, 'Agenda slides unavailable');
}
$filename = clean_filename((string)($session->agenda_slides_filename ?? 'live-session-agenda.pptx'));
if ($filename === '') {
    $filename = 'live-session-agenda.pptx';
}
$mimetype = trim((string)($session->agenda_slides_mimetype ?? 'application/octet-stream'));

@header('Content-Type: ' . ($mimetype !== '' ? $mimetype : 'application/octet-stream'));
@header('Content-Length: ' . strlen($bytes));
@header('Content-Disposition: attachment; filename="' . str_replace('"', '', $filename) . '"');
@header('Cache-Control: private, max-age=300');
@header('X-Content-Type-Options: nosniff');
echo $bytes;
exit;
