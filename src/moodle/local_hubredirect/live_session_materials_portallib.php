<?php
// Live-session-materials helper library — extracted VERBATIM from
// local_hubredirect/live_session_materials.php (the pqlmat_* page functions) for
// the token-gated portal endpoint. The prefix is grep-confirmed unique to that
// one page, so the bodies are copied unchanged (no rename). The legacy page keeps
// its own inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (shared pqh_* helpers).
// Pure function definitions only — no top-level code, zero output on include.

defined('MOODLE_INTERNAL') || die();

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

function pqlmat_whiteboard_pdf(string $style = 'grid'): string {
    // A minimal valid one-page 16:9 PDF (960x540), either ruled with
    // horizontal lines ("grid") or empty ("blank"), built with correct xref
    // offsets so BBB's converter accepts it. Keep in sync with
    // whiteboard_pdf.php, which serves the same pages by URL.
    $content = '';
    if ($style !== 'blank') {
        $content = "0.5 w\n0.87 0.90 0.93 RG\n";
        for ($y = 30; $y < 540; $y += 30) {
            if ($y % 150 === 0) {
                continue;
            }
            $content .= "0 " . $y . " m 960 " . $y . " l S\n";
        }
        $content .= "0.76 0.81 0.87 RG\n";
        for ($y = 150; $y < 540; $y += 150) {
            $content .= "0 " . $y . " m 960 " . $y . " l S\n";
        }
    }
    $objects = [
        "1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n",
        "2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n",
        "3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 960 540]/Resources<<>>/Contents 4 0 R>>\nendobj\n",
        "4 0 obj\n<</Length " . strlen($content) . ">>\nstream\n" . $content . "endstream\nendobj\n",
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

function pqlmat_insert_whiteboard($session, string $style = 'grid'): void {
    global $CFG;
    if (empty($session->bbb_created) || (string)($session->status ?? '') !== 'live') {
        pqlmat_stop('The BBB room is not live yet. Start class before swapping materials.', 'Live room not started');
    }
    $locallib = $CFG->dirroot . '/local/prequran/locallib.php';
    if (!file_exists($locallib)) {
        pqlmat_stop('The live classroom service is not ready. Please ask support to review the live-room configuration.', 'Live classroom unavailable');
    }
    require_once($locallib);
    $options = ['fitToWidth' => 'true', 'fitToPage' => 'true'];
    $filename = $style === 'blank' ? 'Blank Whiteboard.pdf' : 'Grid Whiteboard.pdf';
    // Prefer the public-URL insert - the same proven path Return to Agenda
    // uses - and fall back to embedding the bytes in the API call.
    try {
        if (!function_exists('local_prequran_bbb_insert_document')) {
            throw new moodle_exception('bbb_api_error', 'local_prequran', '', 'insert_document unavailable');
        }
        $url = (new moodle_url('/local/hubredirect/whiteboard_pdf.php', ['style' => $style, 'v' => (string)time()]))->out(false);
        local_prequran_bbb_insert_document((string)$session->bbb_meeting_id, $url, $filename, true, false, true, $options);
        pqlmat_audit((int)$session->id, 'bbb_whiteboard_inserted', 'session', (int)$session->id, [
            'style' => $style,
            'transfer' => 'public_url',
            'url' => $url,
        ]);
    } catch (Throwable $e) {
        local_prequran_bbb_insert_document_bytes((string)$session->bbb_meeting_id, pqlmat_whiteboard_pdf($style), $filename, true, false, true, $options);
        pqlmat_audit((int)$session->id, 'bbb_whiteboard_inserted', 'session', (int)$session->id, [
            'style' => $style,
            'transfer' => 'embedded',
            'urlerror' => $e->getMessage(),
        ]);
    }
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
