<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!pqh_can_view_sqa_dashboard((int)$USER->id)) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'SQA access required']);
    exit;
}

require_once($CFG->libdir . '/ddl/database_manager.php');
require_once($CFG->dirroot . '/local/prequran/db/upgradelib.php');
if (function_exists('xmldb_local_prequran_ensure_sqa_tracker_schema')) {
    xmldb_local_prequran_ensure_sqa_tracker_schema();
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if (!pqh_table_exists_safe('local_prequran_sqa_run')) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'SQA tracker storage is not ready']);
    exit;
}

$action = optional_param('action', 'load', PARAM_ALPHA);
$artifact = optional_param('artifact', 'alphabet-tracker', PARAM_ALPHANUMEXT);
$allowedartifacts = ['alphabet-tracker'];
if (!in_array($artifact, $allowedartifacts, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unsupported tracker artifact']);
    exit;
}

if ($action === 'load') {
    $runid = optional_param('runid', '', PARAM_ALPHANUMEXT);
    $params = [
        'artifactkey' => $artifact,
        'userid' => (int)$USER->id,
    ];
    $where = 'artifactkey = :artifactkey AND userid = :userid';
    if ($runid !== '') {
        $params['runid'] = $runid;
        $where .= ' AND runid = :runid';
    }
    if ($runid !== '') {
        $record = $DB->get_record('local_prequran_sqa_run', $params, '*', IGNORE_MISSING);
    } else {
        $records = $DB->get_records_select('local_prequran_sqa_run', $where, $params, 'timemodified DESC', '*', 0, 1);
        $record = $records ? reset($records) : false;
    }
    $payload = null;
    if ($record && !empty($record->payloadjson)) {
        $payload = json_decode((string)$record->payloadjson, true);
    }
    echo json_encode([
        'ok' => true,
        'runid' => $record ? (string)$record->runid : '',
        'timemodified' => $record ? (int)$record->timemodified : 0,
        'payload' => $payload,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

if ($action !== 'save') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unsupported action']);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
    exit;
}

$sesskey = (string)($body['sesskey'] ?? '');
if (!confirm_sesskey($sesskey)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Invalid session key']);
    exit;
}

$bodyartifact = clean_param((string)($body['artifact'] ?? $artifact), PARAM_ALPHANUMEXT);
if ($bodyartifact !== $artifact) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Artifact mismatch']);
    exit;
}

$runid = clean_param((string)($body['runid'] ?? ''), PARAM_ALPHANUMEXT);
if ($runid === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Run ID is required']);
    exit;
}

$payload = $body['payload'] ?? null;
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Tracker payload is required']);
    exit;
}

$payloadjson = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if ($payloadjson === false) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Tracker payload could not be encoded']);
    exit;
}

$summary = [
    'tracker' => (string)($payload['tracker'] ?? ''),
    'meta' => $payload['meta'] ?? [],
    'casecount' => is_array($payload['cases'] ?? null) ? count($payload['cases']) : 0,
];
$summaryjson = json_encode($summary, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
$now = time();

$existing = $DB->get_record('local_prequran_sqa_run', [
    'artifactkey' => $artifact,
    'runid' => $runid,
    'userid' => (int)$USER->id,
], '*', IGNORE_MISSING);

if ($existing) {
    $existing->status = 'saved';
    $existing->summaryjson = $summaryjson;
    $existing->payloadjson = $payloadjson;
    $existing->timemodified = $now;
    $DB->update_record('local_prequran_sqa_run', $existing);
    $id = (int)$existing->id;
} else {
    $id = (int)$DB->insert_record('local_prequran_sqa_run', (object)[
        'artifactkey' => $artifact,
        'runid' => $runid,
        'userid' => (int)$USER->id,
        'status' => 'saved',
        'summaryjson' => $summaryjson,
        'payloadjson' => $payloadjson,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

echo json_encode([
    'ok' => true,
    'id' => $id,
    'runid' => $runid,
    'timemodified' => $now,
], JSON_UNESCAPED_SLASHES);
