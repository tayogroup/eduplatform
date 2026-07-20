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
$out = ['marker' => 'domain-setup-v89', 'wwwroot' => (string)$CFG->wwwroot];

try {
    $out['domains'] = array_values(array_map(static function($r) {
        return [
            'id' => (int)$r->id,
            'consumerid' => (int)$r->consumerid,
            'slug' => (string)$r->slug,
            'consumer_type' => (string)$r->consumer_type,
            'domain' => (string)$r->domain,
            'domain_type' => (string)$r->domain_type,
            'isprimarydomain' => (int)$r->isprimarydomain,
            'trusted_domain' => (int)$r->trusted_domain,
            'workspaceid' => (int)($r->workspaceid ?? 0),
        ];
    }, $DB->get_records_sql(
        "SELECT d.id, d.consumerid, d.domain, d.domain_type, d.isprimarydomain,
                d.trusted_domain, d.workspaceid, c.slug, c.consumer_type
           FROM {local_prequran_consumer_domain} d
           JOIN {local_prequran_consumer} c ON c.id = d.consumerid
       ORDER BY c.slug, d.domain"
    )));
} catch (Throwable $e) {
    $out['domains_error'] = $e->getMessage();
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
            $existing = $DB->get_record('local_prequran_consumer_domain', ['domain' => 'eduplatform.ai']);
            if ($existing) {
                $existing->consumerid = (int)$platform->id;
                $existing->domain_type = 'public';
                $existing->isprimarydomain = 1;
                $existing->trusted_domain = 1;
                if (property_exists($existing, 'timemodified')) {
                    $existing->timemodified = time();
                }
                $DB->update_record('local_prequran_consumer_domain', $existing);
                $out['apply'] = 'updated existing eduplatform.ai row (id ' . (int)$existing->id . ')';
            } else {
                $columns = $DB->get_columns('local_prequran_consumer_domain');
                $record = new stdClass();
                $record->consumerid = (int)$platform->id;
                $record->domain = 'eduplatform.ai';
                $record->domain_type = 'public';
                $record->isprimarydomain = 1;
                $record->trusted_domain = 1;
                if (isset($columns['workspaceid'])) {
                    $record->workspaceid = 0;
                }
                if (isset($columns['status'])) {
                    $record->status = 'active';
                }
                if (isset($columns['timecreated'])) {
                    $record->timecreated = time();
                }
                if (isset($columns['timemodified'])) {
                    $record->timemodified = time();
                }
                $newid = $DB->insert_record('local_prequran_consumer_domain', $record);
                $out['apply'] = 'inserted eduplatform.ai as trusted primary domain (id ' . (int)$newid . ')';
            }
        } catch (Throwable $e) {
            $out['apply_error'] = $e->getMessage();
        }
    }
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
