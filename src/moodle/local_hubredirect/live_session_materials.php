<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

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
$action = optional_param('action', '', PARAM_ALPHANUMEXT);
$materialid = optional_param('materialid', 0, PARAM_INT);
$compact = optional_param('compact', 0, PARAM_BOOL);
$returnparams = $urlparams + ['sessionid' => $sessionid];
if ($compact) {
    $returnparams['compact'] = 1;
}
$returnurl = pqlmat_url('/local/hubredirect/live_session_materials.php', $returnparams);
$safecloseurl = pqlmat_url($workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/live_sessions.php', $urlparams);

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url($returnurl);
$PAGE->set_pagelayout('popup');
$PAGE->set_title('Teacher Materials');
$PAGE->set_heading('Teacher Materials');
$PAGE->add_body_class('pqlmat-page');

if (!pqh_table_exists_safe('local_prequran_live_session')) {
    pqh_access_denied('Live-session tables are not ready. Please ask support to complete the live-session upgrade.', $safecloseurl, 'Teacher Materials unavailable');
}

$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqh_access_denied('Choose a valid live session before opening Teacher Materials.', $safecloseurl, 'Teacher Materials unavailable');
}
if ($workspaceid <= 0 && !empty($session->workspaceid)) {
    $workspaceid = (int)$session->workspaceid;
    $urlparams['workspaceid'] = $workspaceid;
    $returnparams['workspaceid'] = $workspaceid;
    $returnurl = pqlmat_url('/local/hubredirect/live_session_materials.php', $returnparams);
    $safecloseurl = pqlmat_url('/local/hubredirect/workspace_dashboard.php', $urlparams);
}
// The session's own teacher always manages their own materials. The shared
// guard vetoes by consumer context first, which wrongly denies independent
// teachers on marketplace hosts (their personal workspaceid is not in the
// consumer's workspace list), so check teachership before consulting it.
if ((int)$session->teacherid !== (int)$USER->id
        && !pqh_live_session_user_can_manage_agenda($session, (int)$USER->id)) {
    pqh_access_denied(
        'Only the session teacher and academy admins can swap live-session materials.',
        $safecloseurl,
        'Live-session materials access required'
    );
}

function pqlmat_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

function pqlmat_stop(string $message, string $title = 'Teacher Materials unavailable'): void {
    global $returnurl;
    pqh_access_denied($message, $returnurl, $title);
}

function pqlmat_workspace_id($session): int {
    global $USER;
    $workspaceid = (int)($session->workspaceid ?? 0);
    if ($workspaceid > 0) {
        return $workspaceid;
    }
    return pqh_current_workspace_id((int)$USER->id, 0);
}

function pqlmat_audit(int $sessionid, string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqlmat_max_embedded_document_bytes(): int {
    return 10 * 1024 * 1024;
}

function pqlmat_blank_whiteboard_pdf(): string {
    // A minimal valid one-page empty PDF (960x540, 16:9) built with correct
    // xref offsets so BBB's converter accepts it. Annotating happens on the
    // BBB whiteboard layer, so the page itself stays empty.
    $objects = [
        "1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n",
        "2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n",
        "3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 960 540]/Resources<<>>/Contents 4 0 R>>\nendobj\n",
        "4 0 obj\n<</Length 0>>\nstream\n\nendstream\nendobj\n",
    ];
    $pdf = "%PDF-1.4\n";
    $offsets = [];
    foreach ($objects as $object) {
        $offsets[] = strlen($pdf);
        $pdf .= $object;
    }
    $xrefpos = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
    foreach ($offsets as $offset) {
        $pdf .= sprintf("%010d 00000 n \n", $offset);
    }
    $pdf .= "trailer\n<</Size " . (count($objects) + 1) . "/Root 1 0 R>>\nstartxref\n" . $xrefpos . "\n%%EOF";
    return $pdf;
}

function pqlmat_insert_document_bytes($session, string $bytes, string $filename, bool $removable, string $auditaction, string $targettype, int $targetid, array $details = []): void {
    global $CFG;
    if (empty($session->bbb_created) || (string)($session->status ?? '') !== 'live') {
        pqlmat_stop('The BBB room is not live yet. Start class before swapping materials.', 'Live room not started');
    }
    if (strlen($bytes) > pqlmat_max_embedded_document_bytes()) {
        pqlmat_stop('This file is too large for a safe live swap. Use an optimized PDF under 10 MB, then try again.', 'Material too large');
    }
    $locallib = $CFG->dirroot . '/local/prequran/locallib.php';
    if (!file_exists($locallib)) {
        pqlmat_stop('The live classroom service is not ready. Please ask support to review the live-room configuration.', 'Live classroom unavailable');
    }
    require_once($locallib);

    local_prequran_bbb_insert_document_bytes((string)$session->bbb_meeting_id, $bytes, $filename, true, false, $removable, [
        'fitToWidth' => 'true',
        'fitToPage' => 'true',
    ]);
    pqlmat_audit((int)$session->id, $auditaction, $targettype, $targetid, [
        'filename' => $filename,
        'bytes' => strlen($bytes),
        'transfer' => 'embedded',
    ] + $details);
}

function pqlmat_add_query_param(string $url, string $name, string $value): string {
    if ($url === '') {
        return '';
    }
    return $url . (strpos($url, '?') === false ? '?' : '&') . rawurlencode($name) . '=' . rawurlencode($value);
}

function pqlmat_agenda_public_url($session): string {
    $url = pqh_live_session_agenda_public_url($session);
    if ($url === '') {
        return '';
    }
    $version = max((int)($session->agenda_slides_uploadedat ?? 0), (int)($session->timemodified ?? 0), 1);
    return pqlmat_add_query_param($url, 'v', (string)$version);
}

function pqlmat_insert_agenda_url($session, string $filename): void {
    global $CFG;
    if (empty($session->bbb_created) || (string)($session->status ?? '') !== 'live') {
        pqlmat_stop('The BBB room is not live yet. Start class before swapping materials.', 'Live room not started');
    }
    $locallib = $CFG->dirroot . '/local/prequran/locallib.php';
    if (!file_exists($locallib)) {
        pqlmat_stop('The live classroom service is not ready. Please ask support to review the live-room configuration.', 'Live classroom unavailable');
    }
    require_once($locallib);
    if (!function_exists('local_prequran_bbb_insert_document')) {
        pqlmat_stop('The live classroom document service is not ready.', 'Live classroom unavailable');
    }
    $url = pqlmat_agenda_public_url($session);
    if ($url === '') {
        pqlmat_stop('The agenda deck does not have a public document URL.', 'Agenda deck unavailable');
    }

    local_prequran_bbb_insert_document((string)$session->bbb_meeting_id, $url, $filename, true, false, false, [
        'fitToWidth' => 'true',
        'fitToPage' => 'true',
    ]);
    pqlmat_audit((int)$session->id, 'bbb_agenda_restored', 'session', (int)$session->id, [
        'filename' => $filename,
        'transfer' => 'public_url',
        'url' => $url,
        'bunny_path' => trim((string)($session->agenda_slides_path ?? '')),
    ]);
}

function pqlmat_material_public_url($material): string {
    $url = pqh_workspace_material_public_url($material);
    if ($url === '') {
        return '';
    }
    $version = max((int)($material->timemodified ?? 0), 1);
    return pqlmat_add_query_param($url, 'v', (string)$version);
}

function pqlmat_insert_material_url($session, $material, string $filename): void {
    global $CFG;
    if (empty($session->bbb_created) || (string)($session->status ?? '') !== 'live') {
        pqlmat_stop('The BBB room is not live yet. Start class before swapping materials.', 'Live room not started');
    }
    $locallib = $CFG->dirroot . '/local/prequran/locallib.php';
    if (!file_exists($locallib)) {
        pqlmat_stop('The live classroom service is not ready. Please ask support to review the live-room configuration.', 'Live classroom unavailable');
    }
    require_once($locallib);
    if (!function_exists('local_prequran_bbb_insert_document')) {
        pqlmat_stop('The live classroom document service is not ready.', 'Live classroom unavailable');
    }
    $url = pqlmat_material_public_url($material);
    if ($url === '') {
        pqlmat_stop('Choose a PDF or PowerPoint file stored in Bunny.', 'Material unavailable');
    }

    local_prequran_bbb_insert_document((string)$session->bbb_meeting_id, $url, $filename, true, false, true, [
        'fitToWidth' => 'true',
        'fitToPage' => 'true',
    ]);
    pqlmat_audit((int)$session->id, 'bbb_material_inserted', 'workspace_material', (int)$material->id, [
        'filename' => $filename,
        'transfer' => 'public_url',
        'url' => $url,
        'bunny_path' => pqh_workspace_material_bunny_path($material),
    ]);
}

function pqlmat_fetch_agenda_bytes($session): string {
    $path = trim((string)($session->agenda_slides_path ?? ''));
    if ($path === '') {
        pqlmat_stop('This session does not have an agenda deck attached yet.', 'Agenda deck unavailable');
    }
    $config = pqh_bunny_storage_config('bunny_live_session_slides_prefix', 'pre_quraan/live-session-slides');
    return pqh_fetch_from_bunny_storage($path, $config);
}

function pqlmat_fetch_material_bytes($material): string {
    $path = pqh_workspace_material_bunny_path($material);
    if ($path === '') {
        pqlmat_stop('Choose a PDF or PowerPoint file stored in Bunny.', 'Material unavailable');
    }
    $config = pqh_bunny_storage_config('bunny_workspace_material_prefix', 'pre_quraan/workspace_materials');
    return pqh_fetch_from_bunny_storage($path, $config);
}

function pqlmat_materials(int $workspaceid): array {
    global $DB;
    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_material')) {
        return [];
    }
    $rows = $DB->get_records_select(
        'local_prequran_workspace_material',
        'workspaceid = ? AND status = ?',
        [$workspaceid, 'active'],
        'timemodified DESC, title ASC',
        'id,workspaceid,title,material_type,course_key,description,source_url,metadatajson,visibility,createdby,timemodified'
    );
    $materials = [];
    foreach ($rows as $row) {
        if (pqh_workspace_material_live_supported($row)) {
            $materials[] = $row;
        }
    }
    return $materials;
}

$workspaceid = pqlmat_workspace_id($session);
if ($workspaceid > 0 && (int)$session->teacherid !== (int)$USER->id
        && !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace teaching and admin users can use this materials library.',
        $safecloseurl,
        'Workspace materials access required'
    );
}

$notice = '';
if ($action === 'whiteboard') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen Teacher Materials and try again.', $returnurl, 'Teacher Materials action expired');
    }
    try {
        pqlmat_insert_document_bytes(
            $session,
            pqlmat_blank_whiteboard_pdf(),
            'Whiteboard.pdf',
            true,
            'bbb_whiteboard_inserted',
            'session',
            (int)$session->id
        );
        redirect($returnurl, 'Blank whiteboard opened in the live room.', 2, \core\output\notification::NOTIFY_SUCCESS);
    } catch (Throwable $e) {
        pqlmat_audit($sessionid, 'bbb_whiteboard_insert_failed', 'session', $sessionid, ['error' => $e->getMessage()]);
        pqh_access_denied('The whiteboard could not be sent to the live room. Please ask support to review the live-room material setup.', $returnurl, 'Whiteboard unavailable');
    }
}
if ($action === 'insert') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen Teacher Materials and try again.', $returnurl, 'Teacher Materials action expired');
    }
    if ($materialid <= 0) {
        try {
            $agendafile = clean_filename((string)($session->agenda_slides_filename ?? 'Live Session Agenda template.pptx'));
            pqlmat_insert_agenda_url($session, $agendafile !== '' ? $agendafile : 'Live Session Agenda template.pptx');
            redirect($returnurl, 'Agenda restored in the live room.', 2, \core\output\notification::NOTIFY_SUCCESS);
        } catch (Throwable $e) {
            pqlmat_audit($sessionid, 'bbb_agenda_restore_failed', 'session', $sessionid, ['error' => $e->getMessage()]);
            pqh_access_denied('The agenda could not be sent to the live room. Please ask support to review the live-room material setup.', $returnurl, 'Agenda restore unavailable');
        }
    }

    $material = $DB->get_record('local_prequran_workspace_material', [
        'id' => $materialid,
        'workspaceid' => $workspaceid,
        'status' => 'active',
    ]);
    if (!$material) {
        pqh_access_denied('Choose an active workspace material before sending it to the live room.', $returnurl, 'Material unavailable');
    }
    if (!pqh_workspace_material_live_supported($material)) {
        pqh_access_denied('Choose a PDF or PowerPoint file stored in Bunny.', $returnurl, 'Material unavailable');
    }
    try {
        $filename = pqh_workspace_material_filename($material);
        pqlmat_insert_material_url($session, $material, $filename);
        redirect($returnurl, 'Material sent to the live room.', 2, \core\output\notification::NOTIFY_SUCCESS);
    } catch (Throwable $e) {
        pqlmat_audit($sessionid, 'bbb_material_insert_failed', 'workspace_material', $materialid, ['error' => $e->getMessage()]);
        pqh_access_denied('The material could not be sent to the live room. Please ask support to review the live-room material setup.', $returnurl, 'Material swap unavailable');
    }
}

$materials = pqlmat_materials($workspaceid);
$agendaurl = pqh_live_session_agenda_public_url($session);

echo $OUTPUT->header();
?>
<style>
.pqlmat-wrap{max-width:980px;margin:0 auto;padding:18px;color:#173044;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
.pqlmat-wrap--compact{max-width:720px;padding:12px}
.pqlmat-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px;padding:16px 18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef8ee}
.pqlmat-top h1{margin:0;color:#173044;font-size:24px;font-weight:950;line-height:1.15;letter-spacing:0}
.pqlmat-sub{margin:5px 0 0;color:#5e7280;font-size:13px;font-weight:800}
.pqlmat-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.pqlmat-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 13px;border:1px solid rgba(23,48,68,.14);border-radius:8px;background:#fff;color:#173044;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlmat-btn:hover{background:#e7f4e7;text-decoration:none}
.pqlmat-btn--primary{background:#2f6f4e;color:#fff;border-color:#2f6f4e}
.pqlmat-btn--primary:hover{background:#285f43;color:#fff}
.pqlmat-panel{margin-top:12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;overflow:hidden}
.pqlmat-panel--compact{margin-top:0}
.pqlmat-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;background:#fbfdff;border-bottom:1px solid rgba(23,48,68,.1)}
.pqlmat-panel-head h2{margin:0;font-size:16px;font-weight:950;color:#173044;letter-spacing:0}
.pqlmat-table{width:100%;border-collapse:collapse}
.pqlmat-table th,.pqlmat-table td{padding:12px 14px;border-bottom:1px solid rgba(23,48,68,.08);text-align:left;vertical-align:middle;font-size:13px}
.pqlmat-table th{color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}
.pqlmat-name{display:block;font-size:14px;font-weight:950;color:#173044}
.pqlmat-muted{display:block;margin-top:3px;color:#718392;font-size:12px;font-weight:750}
.pqlmat-pill{display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border-radius:999px;background:#fff7e7;color:#4d3522;font-size:12px;font-weight:950}
.pqlmat-empty{padding:24px;color:#5e7280;font-size:14px;font-weight:850;text-align:center}
.pqlmat-inline{display:inline;margin:0}
.pqlmat-return{display:flex;gap:8px;justify-content:flex-end;padding:12px 14px;background:#fff}
body.pqlmat-page #page-footer,body.pqlmat-page footer,body.pqlmat-page [data-region="footer-container"],body.pqlmat-page .logininfo,body.pqlmat-page .tool_dataprivacy,body.pqlmat-page .homelink,body.pqlmat-page .mobilelink{display:none!important}
@media(max-width:760px){.pqlmat-wrap{padding:12px}.pqlmat-top{display:block}.pqlmat-actions{justify-content:flex-start;margin-top:12px}.pqlmat-table,.pqlmat-table tbody,.pqlmat-table tr,.pqlmat-table td{display:block;width:100%}.pqlmat-table thead{display:none}.pqlmat-table td{border-bottom:0;padding:8px 12px}.pqlmat-table tr{border-bottom:1px solid rgba(23,48,68,.1);padding:8px 0}}
</style>
<main class="pqlmat-wrap<?php echo $compact ? ' pqlmat-wrap--compact' : ''; ?>">
  <?php if (!$compact): ?>
  <section class="pqlmat-top">
    <div>
      <h1>Teacher Materials</h1>
      <p class="pqlmat-sub"><?php echo s((string)$session->title); ?> - swaps the active BBB presentation for this live room.</p>
    </div>
    <div class="pqlmat-actions">
      <?php if ($workspaceid > 0): ?><a class="pqlmat-btn" href="<?php echo pqlmat_url('/local/hubredirect/workspace_materials.php', $urlparams)->out(false); ?>" target="_blank" rel="noopener">Manage library</a><?php endif; ?>
      <a class="pqlmat-btn" href="<?php echo pqlmat_url('/local/hubredirect/live_sessions.php', $urlparams)->out(false); ?>" target="_blank" rel="noopener">Live sessions</a>
    </div>
  </section>
  <?php endif; ?>

  <?php if (!$compact): ?>
  <section class="pqlmat-panel">
    <div class="pqlmat-panel-head">
      <h2>Session Deck</h2>
      <div class="pqlmat-actions">
        <form class="pqlmat-inline" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="whiteboard">
          <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
          <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
          <button class="pqlmat-btn" type="submit">Blank whiteboard</button>
        </form>
        <?php if ($agendaurl !== ''): ?>
        <form class="pqlmat-inline" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="insert">
          <input type="hidden" name="materialid" value="0">
          <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
          <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
          <button class="pqlmat-btn pqlmat-btn--primary" type="submit">Return to Agenda</button>
        </form>
        <?php endif; ?>
      </div>
    </div>
    <?php if ($agendaurl === ''): ?>
      <div class="pqlmat-empty">No agenda deck is attached to this session yet.</div>
    <?php else: ?>
      <table class="pqlmat-table"><tbody><tr>
        <td><span class="pqlmat-name"><?php echo s((string)($session->agenda_slides_filename ?? 'Live Session Agenda template.pptx')); ?></span><span class="pqlmat-muted">Default lecture deck loaded when class starts.</span></td>
        <td><span class="pqlmat-pill">Agenda</span></td>
      </tr></tbody></table>
    <?php endif; ?>
  </section>
  <?php else: ?>
  <section class="pqlmat-panel pqlmat-panel--compact">
    <div class="pqlmat-return">
      <form class="pqlmat-inline" method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="action" value="whiteboard">
        <input type="hidden" name="compact" value="1">
        <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
        <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
        <button class="pqlmat-btn" type="submit">Blank whiteboard</button>
      </form>
      <?php if ($agendaurl !== ''): ?>
      <form class="pqlmat-inline" method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="action" value="insert">
        <input type="hidden" name="materialid" value="0">
        <input type="hidden" name="compact" value="1">
        <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
        <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
        <button class="pqlmat-btn pqlmat-btn--primary" type="submit">Return to Agenda</button>
      </form>
      <?php endif; ?>
    </div>
    <?php if ($agendaurl === ''): ?>
      <div class="pqlmat-empty">No agenda deck is attached to this session yet.</div>
    <?php endif; ?>
  </section>
  <?php endif; ?>

  <section class="pqlmat-panel">
    <div class="pqlmat-panel-head"><h2>Workspace Library</h2><?php if (!$compact): ?><span class="pqlmat-muted">PDF is fastest; PowerPoint may take longer while BBB converts it.</span><?php endif; ?></div>
    <?php if (!$materials): ?>
      <div class="pqlmat-empty">No Bunny-backed PDF or PowerPoint materials are available in this workspace yet.</div>
    <?php else: ?>
      <table class="pqlmat-table">
        <thead><tr><th>Material</th><th>Type</th><th>Updated</th><th>Action</th></tr></thead>
        <tbody>
        <?php foreach ($materials as $material): ?>
          <tr>
            <td><span class="pqlmat-name"><?php echo s((string)$material->title); ?></span><span class="pqlmat-muted"><?php echo s((string)($material->description ?? '')); ?></span></td>
            <td><span class="pqlmat-pill"><?php echo s(strtoupper(pathinfo(pqh_workspace_material_filename($material), PATHINFO_EXTENSION))); ?></span></td>
            <td><?php echo s(userdate((int)$material->timemodified, get_string('strftimedatetimeshort'))); ?></td>
            <td>
              <form class="pqlmat-inline" method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="insert">
                <input type="hidden" name="materialid" value="<?php echo (int)$material->id; ?>">
                <?php if ($compact): ?><input type="hidden" name="compact" value="1"><?php endif; ?>
                <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
                <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
                <button class="pqlmat-btn pqlmat-btn--primary" type="submit">Use Live</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </section>
</main>
<script>
(function(){
  var sessionId = '<?php echo (int)$sessionid; ?>';
  var closeKey = 'pqa_live_session_closed_' + sessionId;
  var maxSignalAgeMs = 12 * 60 * 60 * 1000;

  function recentCloseSignal() {
    try {
      var value = parseInt(window.localStorage.getItem(closeKey) || '0', 10);
      return value > 0 && Date.now() - value < maxSignalAgeMs;
    } catch (e) {
      return false;
    }
  }

  function closeMaterials() {
    try {
      window.close();
    } catch (e) {}
    window.setTimeout(function(){
      if (!window.closed && document.body) {
        document.body.innerHTML = '<main class="pqlmat-wrap"><section class="pqlmat-panel"><div class="pqlmat-empty">The live session has ended. You can close this Teacher Materials window.</div></section></main>';
      }
    }, 300);
  }

  if (recentCloseSignal()) {
    closeMaterials();
    return;
  }

  window.addEventListener('storage', function(event) {
    if (event.key === closeKey && recentCloseSignal()) {
      closeMaterials();
    }
  });

  window.setInterval(function(){
    try {
      if (window.opener && window.opener.closed) {
        closeMaterials();
        return;
      }
    } catch (e) {}
    if (recentCloseSignal()) {
      closeMaterials();
    }
  }, 1500);
})();
</script>
<?php
echo $OUTPUT->footer();
