<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/finance_lib.php');

function pqml_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_mobile_client')
        && pqh_table_exists_safe('local_prequran_mobile_check')
        && pqh_table_exists_safe('local_prequran_locale_profile')
        && pqh_table_exists_safe('local_prequran_currency_rate')
        && pqh_table_exists_safe('local_prequran_tax_region');
}

function pqml_context_for_workspace(int $workspaceid, $consumercontext): stdClass {
    return pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
}

function pqml_service_inventory(): array {
    global $CFG;

    $files = [
        $CFG->dirroot . '/local/prequran/db/services.php',
        $CFG->dirroot . '/local/prequran/services.php',
    ];
    $functions = [];
    $services = [];
    foreach ($files as $file) {
        if (!is_readable($file)) {
            continue;
        }
        $loadedfunctions = [];
        $loadedservices = [];
        include($file);
        if (isset($functions) && is_array($functions)) {
            $loadedfunctions = $functions;
        }
        if (isset($services) && is_array($services)) {
            $loadedservices = $services;
        }
        if ($loadedfunctions || $loadedservices) {
            return ['functions' => $loadedfunctions, 'services' => $loadedservices, 'source' => basename(dirname($file)) . '/' . basename($file)];
        }
    }
    return ['functions' => [], 'services' => [], 'source' => 'none'];
}

function pqml_readiness_checks(int $workspaceid, int $clientid = 0): array {
    global $CFG, $DB;

    $inventory = pqml_service_inventory();
    $functioncount = count($inventory['functions']);
    $token = (string)get_config('local_prequran', 'ws_token');
    $checks = [];
    $checks[] = [
        'key' => 'rest_endpoint',
        'label' => 'REST endpoint',
        'status' => !empty($CFG->wwwroot) ? 'ok' : 'fail',
        'severity' => !empty($CFG->wwwroot) ? 'low' : 'critical',
        'summary' => rtrim((string)$CFG->wwwroot, '/') . '/webservice/rest/server.php',
    ];
    $checks[] = [
        'key' => 'service_inventory',
        'label' => 'Service inventory',
        'status' => $functioncount > 0 ? 'ok' : 'fail',
        'severity' => $functioncount > 0 ? 'low' : 'critical',
        'summary' => $functioncount . ' registered local_prequran function(s) from ' . $inventory['source'],
    ];
    $checks[] = [
        'key' => 'configured_token',
        'label' => 'Configured shared token',
        'status' => $token !== '' ? 'ok' : 'warning',
        'severity' => $token !== '' ? 'low' : 'high',
        'summary' => $token !== '' ? 'Server-side ws_token is configured.' : 'local_prequran/ws_token is empty.',
    ];
    $enabled = !empty($CFG->enablewebservices);
    $checks[] = [
        'key' => 'moodle_webservices',
        'label' => 'Moodle web services',
        'status' => $enabled ? 'ok' : 'warning',
        'severity' => $enabled ? 'low' : 'high',
        'summary' => $enabled ? 'Moodle web services are enabled.' : 'CFG enablewebservices is not enabled.',
    ];
    $service = false;
    if (pqh_table_exists_safe('external_services')) {
        $service = $DB->get_record('external_services', ['shortname' => 'prequran_ws'], '*', IGNORE_MISSING);
    }
    $checks[] = [
        'key' => 'external_service',
        'label' => 'External service',
        'status' => ($service && (int)$service->enabled === 1) ? 'ok' : 'warning',
        'severity' => ($service && (int)$service->enabled === 1) ? 'low' : 'medium',
        'summary' => $service ? 'prequran_ws service exists; enabled=' . (int)$service->enabled : 'prequran_ws external service not found yet.',
    ];
    $activeclients = pqh_table_exists_safe('local_prequran_mobile_client')
        ? (int)$DB->count_records('local_prequran_mobile_client', ['workspaceid' => $workspaceid, 'status' => 'active'])
        : 0;
    $checks[] = [
        'key' => 'mobile_clients',
        'label' => 'Mobile client registry',
        'status' => $activeclients > 0 ? 'ok' : 'warning',
        'severity' => $activeclients > 0 ? 'low' : 'medium',
        'summary' => $activeclients . ' active client profile(s) in this workspace.',
    ];
    return $checks;
}

function pqml_save_readiness_snapshot(int $workspaceid, $consumercontext, int $clientid, int $actorid): void {
    global $DB;

    if (!pqml_schema_ready()) {
        return;
    }
    $context = pqml_context_for_workspace($workspaceid, $consumercontext);
    $now = time();
    foreach (pqml_readiness_checks($workspaceid, $clientid) as $check) {
        $existing = $DB->get_record('local_prequran_mobile_check', [
            'workspaceid' => $workspaceid,
            'clientid' => $clientid,
            'checkkey' => $check['key'],
        ], '*', IGNORE_MISSING);
        $record = (object)[
            'consumerid' => (int)($context->consumerid ?? 0),
            'workspaceid' => $workspaceid,
            'clientid' => $clientid,
            'checkkey' => $check['key'],
            'status' => $check['status'],
            'severity' => $check['severity'],
            'summary' => $check['summary'],
            'detailsjson' => pqfin_metadata($check),
            'checkedat' => $now,
            'createdby' => $actorid,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        if ($existing) {
            $record->id = (int)$existing->id;
            $record->createdby = (int)$existing->createdby;
            $record->timecreated = (int)$existing->timecreated;
            $DB->update_record('local_prequran_mobile_check', $record);
        } else {
            $DB->insert_record('local_prequran_mobile_check', $record);
        }
    }
    if ($clientid > 0) {
        $DB->set_field('local_prequran_mobile_client', 'lastcheckat', $now, ['id' => $clientid, 'workspaceid' => $workspaceid]);
    }
}

function pqml_upsert_mobile_client(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;

    if (!pqml_schema_ready()) {
        throw new invalid_parameter_exception('Mobile readiness schema is not ready.');
    }
    $context = pqml_context_for_workspace($workspaceid, $consumercontext);
    $clientid = (int)($data['clientid'] ?? 0);
    $now = time();
    $record = $clientid > 0 ? $DB->get_record('local_prequran_mobile_client', ['id' => $clientid, 'workspaceid' => $workspaceid], '*', MUST_EXIST) : new stdClass();
    $record->consumerid = (int)($context->consumerid ?? 0);
    $record->workspaceid = $workspaceid;
    $record->clientname = core_text::substr(trim((string)($data['clientname'] ?? 'Mobile app')), 0, 120);
    $record->platform = core_text::substr((string)($data['platform'] ?? 'mobile'), 0, 40);
    $record->clientkey = core_text::substr((string)($data['clientkey'] ?? ('mob-' . $workspaceid . '-' . substr(hash('sha256', $record->clientname . $now), 0, 10))), 0, 80);
    $record->status = core_text::substr((string)($data['status'] ?? 'draft'), 0, 40);
    $record->min_app_version = core_text::substr((string)($data['min_app_version'] ?? ''), 0, 40);
    $record->current_app_version = core_text::substr((string)($data['current_app_version'] ?? ''), 0, 40);
    $record->api_scope = core_text::substr((string)($data['api_scope'] ?? 'student,parent,teacher,finance'), 0, 255);
    $record->redirecturis = trim((string)($data['redirecturis'] ?? ''));
    $record->notes = trim((string)($data['notes'] ?? ''));
    $record->metadatajson = pqfin_metadata(['source' => 'mobile_api_readiness']);
    $record->modifiedby = $actorid;
    $record->timemodified = $now;
    if ($clientid > 0) {
        $DB->update_record('local_prequran_mobile_client', $record);
        return $clientid;
    }
    $record->lastcheckat = 0;
    $record->createdby = $actorid;
    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_mobile_client', $record);
}

function pqml_locale_profile(int $workspaceid): ?stdClass {
    global $DB;
    if (!pqml_schema_ready()) {
        return null;
    }
    $profile = $DB->get_record('local_prequran_locale_profile', ['workspaceid' => $workspaceid, 'status' => 'active'], '*', IGNORE_MULTIPLE);
    return $profile ?: null;
}

function pqml_save_locale_profile(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;

    if (!pqml_schema_ready()) {
        throw new invalid_parameter_exception('Localization schema is not ready.');
    }
    $context = pqml_context_for_workspace($workspaceid, $consumercontext);
    $profile = pqml_locale_profile($workspaceid) ?: new stdClass();
    $now = time();
    $profile->consumerid = (int)($context->consumerid ?? 0);
    $profile->workspaceid = $workspaceid;
    $profile->locale = core_text::substr((string)($data['locale'] ?? 'en_US'), 0, 40);
    $profile->language = core_text::substr((string)($data['language'] ?? 'en'), 0, 40);
    $profile->country = core_text::substr((string)($data['country'] ?? ''), 0, 80);
    $profile->timezone = core_text::substr((string)($data['timezone'] ?? 'UTC'), 0, 100);
    $profile->date_format = core_text::substr((string)($data['date_format'] ?? 'Y-m-d'), 0, 80);
    $profile->time_format = core_text::substr((string)($data['time_format'] ?? 'H:i'), 0, 80);
    $profile->week_start = core_text::substr((string)($data['week_start'] ?? 'sunday'), 0, 20);
    $profile->number_format = core_text::substr((string)($data['number_format'] ?? '1,234.56'), 0, 80);
    $profile->currency_position = core_text::substr((string)($data['currency_position'] ?? 'before'), 0, 20);
    $profile->default_currency = pqfin_normalize_currency((string)($data['default_currency'] ?? pqfin_default_currency()));
    $profile->enabled_currencies = implode(',', array_values(array_filter(array_map('pqfin_normalize_currency', preg_split('/[,\s]+/', (string)($data['enabled_currencies'] ?? $profile->default_currency))))));
    $profile->tax_region = core_text::substr((string)($data['tax_region'] ?? ''), 0, 80);
    $profile->tax_behavior = core_text::substr((string)($data['tax_behavior'] ?? 'not_configured'), 0, 40);
    $profile->status = 'active';
    $profile->notes = trim((string)($data['notes'] ?? ''));
    $profile->modifiedby = $actorid;
    $profile->timemodified = $now;
    if (!empty($profile->id)) {
        $DB->update_record('local_prequran_locale_profile', $profile);
        return (int)$profile->id;
    }
    $profile->createdby = $actorid;
    $profile->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_locale_profile', $profile);
}

function pqml_save_currency_rate(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;

    if (!pqml_schema_ready()) {
        throw new invalid_parameter_exception('Currency rate schema is not ready.');
    }
    $rate = trim((string)($data['rate'] ?? ''));
    if ($rate === '' || !is_numeric($rate) || (float)$rate <= 0) {
        throw new invalid_parameter_exception('Exchange rate must be greater than zero.');
    }
    $context = pqml_context_for_workspace($workspaceid, $consumercontext);
    $now = time();
    return (int)$DB->insert_record('local_prequran_currency_rate', (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'base_currency' => pqfin_normalize_currency((string)($data['base_currency'] ?? pqfin_default_currency())),
        'quote_currency' => pqfin_normalize_currency((string)($data['quote_currency'] ?? pqfin_default_currency())),
        'rate' => core_text::substr($rate, 0, 40),
        'provider' => core_text::substr((string)($data['provider'] ?? 'manual'), 0, 80),
        'status' => core_text::substr((string)($data['status'] ?? 'active'), 0, 40),
        'effectiveat' => (int)($data['effectiveat'] ?? $now),
        'expiresat' => (int)($data['expiresat'] ?? 0),
        'notes' => trim((string)($data['notes'] ?? '')),
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqml_save_tax_region(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;

    if (!pqml_schema_ready()) {
        throw new invalid_parameter_exception('Tax region schema is not ready.');
    }
    $context = pqml_context_for_workspace($workspaceid, $consumercontext);
    $now = time();
    return (int)$DB->insert_record('local_prequran_tax_region', (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'regioncode' => core_text::substr((string)($data['regioncode'] ?? ''), 0, 80),
        'regionname' => core_text::substr((string)($data['regionname'] ?? ''), 0, 160),
        'taxname' => core_text::substr((string)($data['taxname'] ?? 'Tax'), 0, 80),
        'taxrate' => core_text::substr((string)($data['taxrate'] ?? '0.0000'), 0, 40),
        'behavior' => core_text::substr((string)($data['behavior'] ?? 'not_configured'), 0, 40),
        'status' => core_text::substr((string)($data['status'] ?? 'active'), 0, 40),
        'exemptionnote' => trim((string)($data['exemptionnote'] ?? '')),
        'effectiveat' => (int)($data['effectiveat'] ?? $now),
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}
