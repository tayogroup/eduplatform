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
$return = optional_param('return', '', PARAM_LOCALURL);
$returnurl = $return !== '' ? new moodle_url($return) : new moodle_url('/local/hubredirect/live_sessions.php', $urlparams);

if (!confirm_sesskey()) {
    pqh_access_denied('Please reopen the live session page and try the agenda upload again.', $returnurl, 'Agenda upload expired');
}

function pqlagu_stop(string $message, string $title = 'Agenda upload unavailable'): void {
    global $returnurl;
    pqh_access_denied($message, $returnurl, $title);
}

function pqlagu_has_required_fields(): bool {
    foreach (['agenda_slides_path', 'agenda_slides_filename', 'agenda_slides_mimetype', 'agenda_slides_size', 'agenda_slides_uploadedby', 'agenda_slides_uploadedat'] as $field) {
        if (!pqh_table_has_field_safe('local_prequran_live_session', $field)) {
            return false;
        }
    }
    return true;
}

function pqlagu_can_attach_slides(stdClass $session, int $userid): bool {
    global $DB;
    if ($userid <= 0) {
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

function pqlagu_uploaded_agenda_file(array $upload): array {
    if ((int)($upload['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        pqlagu_stop('Choose a completed agenda slide deck to upload.');
    }
    if ((int)($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || empty($upload['tmp_name']) || !is_uploaded_file((string)$upload['tmp_name'])) {
        pqlagu_stop('The uploaded agenda slide deck could not be read.');
    }
    $filename = clean_filename((string)($upload['name'] ?? 'live-session-agenda.pptx'));
    if ($filename === '') {
        $filename = 'live-session-agenda.pptx';
    }
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $mimetypes = [
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'ppt' => 'application/vnd.ms-powerpoint',
        'pdf' => 'application/pdf',
    ];
    if (!isset($mimetypes[$extension])) {
        pqlagu_stop('Upload a PowerPoint or PDF agenda file.');
    }
    $size = (int)($upload['size'] ?? 0);
    if ($size <= 0 || $size > 100 * 1024 * 1024) {
        pqlagu_stop('The agenda file must be between 1 byte and 100 MB.');
    }
    return [
        'tmpname' => (string)$upload['tmp_name'],
        'filename' => $filename,
        'mimetype' => $mimetypes[$extension],
        'size' => $size,
    ];
}

if (!pqh_table_exists_safe('local_prequran_live_session')) {
    pqlagu_stop('Live session tables are not installed.', 'Agenda upload unavailable');
}
if (!pqlagu_has_required_fields()) {
    pqlagu_stop('Run the local_prequran Moodle upgrade before uploading session agenda slides.', 'Agenda upload unavailable');
}

$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqlagu_stop('Choose a valid live session before uploading agenda slides.', 'Agenda upload unavailable');
}
if (!pqh_record_belongs_to_consumer_context($session)) {
    pqlagu_stop('This live session does not belong to the active consumer.', 'Agenda upload unavailable');
}
if (!pqlagu_can_attach_slides($session, (int)$USER->id)) {
    pqh_access_denied('Only the session teacher and academy admins can attach agenda slides.', $returnurl, 'Live-session agenda access required');
}

$upload = isset($_FILES['agenda_file']) && is_array($_FILES['agenda_file']) ? pqlagu_uploaded_agenda_file($_FILES['agenda_file']) : null;
if (!$upload) {
    pqlagu_stop('Choose a completed agenda slide deck to upload.');
}

$config = pqh_bunny_storage_config('bunny_live_session_slides_prefix', 'pre_quraan/live-session-slides');
$path = pqh_live_session_agenda_storage_path($sessionid, (string)$upload['filename']);
try {
    pqh_upload_to_bunny_storage($path, (string)$upload['tmpname'], (string)$upload['mimetype'], $config);
} catch (Throwable $e) {
    pqlagu_stop('The agenda file could not be saved. Please ask support to review the live-session storage setup.', 'Agenda upload failed');
}

$session->agenda_slides_path = $path;
$session->agenda_slides_filename = (string)$upload['filename'];
$session->agenda_slides_mimetype = (string)$upload['mimetype'];
$session->agenda_slides_size = (int)$upload['size'];
$session->agenda_slides_uploadedby = (int)$USER->id;
$session->agenda_slides_uploadedat = time();
$session->timemodified = time();
$DB->update_record('local_prequran_live_session', $session);

if (pqh_table_exists_safe('local_prequran_live_audit')) {
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => 'agenda_slides_uploaded',
        'targettype' => 'session',
        'targetid' => $sessionid,
        'details' => json_encode([
            'filename' => (string)$upload['filename'],
            'mimetype' => (string)$upload['mimetype'],
            'size' => (int)$upload['size'],
            'storage' => 'bunny',
        ]),
        'timecreated' => time(),
    ]);
}

redirect($returnurl, 'Agenda slides attached to the live session.', 2, \core\output\notification::NOTIFY_SUCCESS);
