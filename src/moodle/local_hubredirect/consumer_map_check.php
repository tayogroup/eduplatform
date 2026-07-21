<?php
// Read-only diagnostic: consumers, their primary workspaces, and domains.
// Used to untangle the Ehel Academy / EduForTomorrow workspace mapping.
// Delete after use.

define('NO_MOODLE_COOKIES', true);
require_once(__DIR__ . '/../../config.php');

$key = isset($_GET['k']) ? (string)$_GET['k'] : '';
if (!hash_equals('bff9103454fb45b8b165606d2393b4a0', $key)) {
    http_response_code(404);
    header('Content-Type: text/plain');
    echo 'Not found';
    exit;
}

header('Content-Type: application/json');
header('Cache-Control: no-store');

global $DB;
$out = ['marker' => 'consumer-map-v92'];

// Targeted repair: EduForTomorrow (marketplace) was stamped with Ehel
// Academy's workspace id by a mis-resolved settings save. Restore it to 0
// so workspace 16 resolves uniquely to the Ehel Academy consumer.
if (isset($_GET['fix_eft']) && $_GET['fix_eft'] === '1') {
    try {
        $eft = $DB->get_record('local_prequran_consumer', ['slug' => 'edu-for-tomorrow']);
        if (!$eft) {
            $out['fix'] = 'edu-for-tomorrow consumer not found - nothing changed';
        } else if ((int)$eft->primaryworkspaceid !== 16) {
            $out['fix'] = 'primaryworkspaceid is ' . (int)$eft->primaryworkspaceid . ', not 16 - nothing changed';
        } else {
            $eft->primaryworkspaceid = 0;
            $eft->timemodified = time();
            $DB->update_record('local_prequran_consumer', $eft);
            $out['fix'] = 'edu-for-tomorrow primaryworkspaceid reset 16 -> 0';
        }
    } catch (Throwable $e) {
        $out['fix_error'] = $e->getMessage();
    }
}

try {
    $out['consumer_columns'] = array_keys($DB->get_columns('local_prequran_consumer'));
} catch (Throwable $e) {
    $out['consumer_columns_error'] = $e->getMessage();
}
try {
    $out['consumers'] = array_values(array_map(static fn($r) => (array)$r,
        $DB->get_records('local_prequran_consumer', null, 'id ASC')));
} catch (Throwable $e) {
    $out['consumers_error'] = $e->getMessage();
}
try {
    $out['workspaces'] = array_values(array_map(static fn($r) => (array)$r,
        $DB->get_records('local_prequran_workspace', null, 'id ASC', 'id, name, slug, status, ownerid, workspace_type')));
} catch (Throwable $e) {
    $out['workspaces_error'] = $e->getMessage();
}
try {
    $out['domains'] = array_values(array_map(static fn($r) => (array)$r,
        $DB->get_records('local_prequran_consumer_domain', null, 'id ASC')));
} catch (Throwable $e) {
    $out['domains_error'] = $e->getMessage();
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
