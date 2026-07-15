<?php

defined('MOODLE_INTERNAL') || die();

/**
 * Send guest front-page traffic to the custom Ehel login page.
 */
function local_ehelhome_before_http_headers(): void {
    global $SCRIPT;

    if ((defined('CLI_SCRIPT') && CLI_SCRIPT) || (defined('AJAX_SCRIPT') && AJAX_SCRIPT)) {
        return;
    }

    if ($SCRIPT !== '/index.php') {
        return;
    }

    if (isloggedin() && !isguestuser()) {
        return;
    }

    $consumerurl = local_ehelhome_custom_domain_landing_url();
    if ($consumerurl) {
        redirect($consumerurl);
    }

    redirect(new moodle_url('/local/ehelhome/index.php'));
}

function local_ehelhome_custom_domain_landing_url(): ?moodle_url {
    global $DB;

    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    $host = preg_replace('/:\d+$/', '', $host);
    $host = trim((string)$host, " \t\n\r\0\x0B.");
    if ($host === '') {
        return null;
    }

    try {
        $dbman = $DB->get_manager();
        if (!$dbman->table_exists('local_prequran_consumer_domain') || !$dbman->table_exists('local_prequran_consumer')) {
            return null;
        }
        $record = $DB->get_record_sql(
            "SELECT d.id, d.workspaceid, c.slug, c.consumer_type, c.defaultpublicpath
               FROM {local_prequran_consumer_domain} d
               JOIN {local_prequran_consumer} c ON c.id = d.consumerid
              WHERE d.domain = :domain
                AND d.status = :domainstatus
                AND c.status = :consumerstatus",
            [
                'domain' => $host,
                'domainstatus' => 'active',
                'consumerstatus' => 'active',
            ],
            IGNORE_MULTIPLE
        );
    } catch (Throwable $e) {
        return null;
    }

    if (!$record) {
        return null;
    }

    $path = trim((string)($record->defaultpublicpath ?? ''));
    if ((string)$record->consumer_type === 'platform_foundation') {
        $path = '/local/hubredirect/platform_landing.php';
    }
    if ($path === '' || $path === '/') {
        $path = '/local/hubredirect/consumer_landing.php';
    }

    $params = ['consumer' => (string)$record->slug];
    if ((int)$record->workspaceid > 0) {
        $params['workspaceid'] = (int)$record->workspaceid;
    }

    return new moodle_url($path, $params);
}
