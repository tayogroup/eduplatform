<?php
// One-time platform-domain setup probe for the eduplatform.ai cutover.
// Bootstraps Moodle so it can read $CFG->wwwroot and the consumer tables.
// ?k=<key>            -> report wwwroot, all consumer domains, platform consumer
// ?k=<key>&apply=1    -> idempotently add eduplatform.ai as the trusted primary
//                        domain of the platform_foundation consumer
// Delete this file after the cutover is verified.

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

global $DB, $CFG;
$out = ['marker' => 'domain-setup-v90', 'wwwroot' => (string)$CFG->wwwroot];

try {
    $out['domain_columns'] = array_keys($DB->get_columns('local_prequran_consumer_domain'));
} catch (Throwable $e) {
    $out['domain_columns_error'] = $e->getMessage();
}
try {
    $out['domains'] = array_values(array_map(static fn($r) => (array)$r,
        $DB->get_records('local_prequran_consumer_domain')));
} catch (Throwable $e) {
    $out['domains_error'] = $e->getMessage();
}
try {
    $out['consumers'] = array_values(array_map(static fn($r) => (array)$r,
        $DB->get_records('local_prequran_consumer', null, 'id ASC', 'id, slug, name, consumer_type')));
} catch (Throwable $e) {
    $out['consumers_error'] = $e->getMessage();
}

$platform = null;
try {
    $platform = $DB->get_record('local_prequran_consumer', ['slug' => 'eduplatform'])
        ?: $DB->get_record('local_prequran_consumer', ['consumer_type' => 'platform_foundation'], '*', IGNORE_MULTIPLE);
    $out['platform_consumer'] = $platform
        ? ['id' => (int)$platform->id, 'slug' => (string)$platform->slug, 'name' => (string)$platform->name,
           'consumer_type' => (string)$platform->consumer_type]
        : null;
} catch (Throwable $e) {
    $out['platform_error'] = $e->getMessage();
}

if (isset($_GET['apply']) && $_GET['apply'] === '1') {
    if (!$platform) {
        $out['apply'] = 'no platform_foundation consumer found - nothing changed';
    } else {
        try {
            $columns = $DB->get_columns('local_prequran_consumer_domain');
            $flags = [
                'domain_type' => 'public',
                'isprimarydomain' => 1,
                'is_primary' => 1,
                'trusted_domain' => 1,
                'istrusted' => 1,
                'trusted' => 1,
                'status' => 'active',
                'workspaceid' => 0,
            ];
            $existing = $DB->get_record('local_prequran_consumer_domain', ['domain' => 'eduplatform.ai']);
            if ($existing) {
                $existing->consumerid = (int)$platform->id;
                foreach ($flags as $field => $value) {
                    if (isset($columns[$field])) {
                        $existing->{$field} = $value;
                    }
                }
                if (isset($columns['timemodified'])) {
                    $existing->timemodified = time();
                }
                $DB->update_record('local_prequran_consumer_domain', $existing);
                $out['apply'] = 'updated existing eduplatform.ai row (id ' . (int)$existing->id . ')';
            } else {
                $record = new stdClass();
                $record->consumerid = (int)$platform->id;
                $record->domain = 'eduplatform.ai';
                foreach ($flags as $field => $value) {
                    if (isset($columns[$field])) {
                        $record->{$field} = $value;
                    }
                }
                foreach (['timecreated', 'timemodified'] as $field) {
                    if (isset($columns[$field])) {
                        $record->{$field} = time();
                    }
                }
                $newid = $DB->insert_record('local_prequran_consumer_domain', $record);
                $out['apply'] = 'inserted eduplatform.ai row (id ' . (int)$newid . ')';
            }
            $out['applied_row'] = (array)$DB->get_record('local_prequran_consumer_domain', ['domain' => 'eduplatform.ai']);
        } catch (Throwable $e) {
            $out['apply_error'] = $e->getMessage();
        }
    }
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
