<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

// Ehel Safe Internet — shared helpers for the parent portal (safenet.php) and
// the AdGuard Home bridge. The filtering service is offered per consumer via
// the 'safe_internet' feature flag; all rows are scoped consumerid+workspaceid.

function pqsn_config(): stdClass {
    $cfg = new stdClass();
    $cfg->dnsdomain = trim((string)get_config('local_prequran', 'safenet_dns_domain'));
    $cfg->dnsdomain2 = trim((string)get_config('local_prequran', 'safenet_dns_domain2'));
    $cfg->apiurl = rtrim(trim((string)get_config('local_prequran', 'safenet_api_url')), '/');
    $cfg->apiuser = trim((string)get_config('local_prequran', 'safenet_api_user'));
    $cfg->apipass = (string)get_config('local_prequran', 'safenet_api_pass');
    $cfg->configured = $cfg->dnsdomain !== '';
    $cfg->apiready = $cfg->apiurl !== '' && $cfg->apiuser !== '';
    return $cfg;
}

function pqsn_feature_enabled(?stdClass $consumer): bool {
    if (!$consumer) {
        return false;
    }
    return pqh_consumer_feature_enabled($consumer, 'safe_internet', false);
}

function pqsn_consumer_record(int $consumerid): ?stdClass {
    global $DB;
    if ($consumerid <= 0) {
        return null;
    }
    try {
        $record = $DB->get_record('local_prequran_consumer', ['id' => $consumerid], '*', IGNORE_MISSING);
        return $record ?: null;
    } catch (Throwable $e) {
        return null;
    }
}

function pqsn_generate_clientid(): string {
    global $DB;
    for ($i = 0; $i < 20; $i++) {
        $candidate = 'd' . substr(bin2hex(random_bytes(8)), 0, 11);
        if (!$DB->record_exists('local_prequran_safenet_dev', ['clientid' => $candidate])) {
            return $candidate;
        }
    }
    throw new moodle_exception('generalexceptionmessage', 'error', '', 'Could not allocate a device id.');
}

function pqsn_dns_hostnames(string $clientid): array {
    $cfg = pqsn_config();
    $hosts = [];
    if ($cfg->dnsdomain !== '') {
        $hosts[] = $clientid . '.' . $cfg->dnsdomain;
    }
    if ($cfg->dnsdomain2 !== '') {
        $hosts[] = $clientid . '.' . $cfg->dnsdomain2;
    }
    return $hosts;
}

/**
 * Children a parent/guardian may manage devices for. Mirrors the consent-based
 * links used by the parent dashboard, kept dependency-free so any page can use it.
 */
function pqsn_children_of(int $parentid): array {
    global $DB;
    $children = [];
    foreach ([
        ['local_prequran_comm_consent', 'guardianid', 'studentid'],
        ['local_prequran_live_consent', 'guardianid', 'studentid'],
    ] as [$table, $guardianfield, $studentfield]) {
        try {
            $rows = $DB->get_records($table, [$guardianfield => $parentid]);
            foreach ($rows as $row) {
                $sid = (int)$row->{$studentfield};
                if ($sid > 0) {
                    $children[$sid] = $sid;
                }
            }
        } catch (Throwable $e) {
            // Table absent on older schemas.
        }
    }
    $named = [];
    foreach ($children as $sid) {
        $user = core_user::get_user($sid, '*', IGNORE_MISSING);
        if ($user && empty($user->deleted)) {
            $named[$sid] = fullname($user);
        }
    }
    asort($named);
    return $named;
}

/** Students of a workspace, for staff registering devices. */
function pqsn_workspace_students(int $workspaceid): array {
    global $DB;
    if ($workspaceid <= 0) {
        return [];
    }
    try {
        $rows = $DB->get_records_sql(
            "SELECT u.id, u.firstname, u.lastname, u.middlename, u.alternatename, u.firstnamephonetic, u.lastnamephonetic
               FROM {local_prequran_workspace_member} m
               JOIN {user} u ON u.id = m.userid AND u.deleted = 0
              WHERE m.workspaceid = ?
                AND m.status = 'active'
                AND m.workspace_role = 'student'
           ORDER BY u.firstname, u.lastname",
            [$workspaceid]
        );
    } catch (Throwable $e) {
        return [];
    }
    $students = [];
    foreach ($rows as $row) {
        $students[(int)$row->id] = fullname($row);
    }
    return $students;
}

function pqsn_audit(int $consumerid, int $workspaceid, int $deviceid, string $action, array $details = []): void {
    global $DB, $USER;
    $event = new stdClass();
    $event->consumerid = $consumerid;
    $event->workspaceid = $workspaceid;
    $event->deviceid = $deviceid;
    $event->actorid = (int)$USER->id;
    $event->action = $action;
    $event->detailsjson = json_encode($details);
    $event->timecreated = time();
    $DB->insert_record('local_prequran_safenet_evt', $event);
}

/** Basic-auth JSON call to the AdGuard Home control API. Returns [ok, payload|errorstring]. */
function pqsn_api_request(string $method, string $path, ?array $body = null): array {
    $cfg = pqsn_config();
    if (!$cfg->apiready) {
        return [false, 'AdGuard API is not configured'];
    }
    $ch = curl_init($cfg->apiurl . $path);
    $headers = ['Content-Type: application/json'];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_USERPWD => $cfg->apiuser . ':' . $cfg->apipass,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $response = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($errno !== 0) {
        return [false, 'Connection failed (' . $errno . ')'];
    }
    if ($status < 200 || $status >= 300) {
        return [false, 'API status ' . $status . ': ' . substr((string)$response, 0, 200)];
    }
    $decoded = json_decode((string)$response, true);
    return [true, is_array($decoded) ? $decoded : []];
}

function pqsn_api_client_payload(stdClass $device): array {
    return [
        'name' => trim((string)$device->label) !== '' ? (string)$device->label : ('Device ' . $device->clientid),
        'ids' => [(string)$device->clientid],
        'tags' => ['user_child'],
        'use_global_settings' => (string)$device->policy !== 'paused',
        'filtering_enabled' => (string)$device->policy !== 'paused',
        'parental_enabled' => (string)$device->policy !== 'paused',
        'safebrowsing_enabled' => true,
        'safe_search' => ['enabled' => (string)$device->policy !== 'paused'],
        'use_global_blocked_services' => true,
        'blocked_services' => [],
        'upstreams' => [],
    ];
}

/** Push one device to AdGuard (create, falling back to update). Updates syncstatus. */
function pqsn_sync_device(stdClass $device): array {
    global $DB;
    $payload = pqsn_api_client_payload($device);
    [$ok, $result] = pqsn_api_request('POST', '/control/clients/add', $payload);
    if (!$ok && is_string($result) && strpos($result, 'already exists') !== false) {
        [$ok, $result] = pqsn_api_request('POST', '/control/clients/update', [
            'name' => $payload['name'],
            'data' => $payload,
        ]);
    }
    $device->syncstatus = $ok ? 'synced' : 'pending';
    $device->timemodified = time();
    $DB->update_record('local_prequran_safenet_dev', $device);
    return [$ok, is_string($result) ? $result : ''];
}

function pqsn_remove_device_from_server(stdClass $device): void {
    $payload = pqsn_api_client_payload($device);
    pqsn_api_request('POST', '/control/clients/delete', ['name' => $payload['name']]);
}

/** Unsigned Apple configuration profile pinning encrypted DNS to this device's hostname. */
function pqsn_mobileconfig_xml(stdClass $device): string {
    $hosts = pqsn_dns_hostnames((string)$device->clientid);
    $servername = $hosts[0] ?? '';
    $label = trim((string)$device->label) !== '' ? (string)$device->label : 'Ehel Safe Internet';
    $uuid1 = strtoupper(bin2hex(random_bytes(4)) . '-' . bin2hex(random_bytes(2)) . '-' . bin2hex(random_bytes(2)) . '-' . bin2hex(random_bytes(2)) . '-' . bin2hex(random_bytes(6)));
    $uuid2 = strtoupper(bin2hex(random_bytes(4)) . '-' . bin2hex(random_bytes(2)) . '-' . bin2hex(random_bytes(2)) . '-' . bin2hex(random_bytes(2)) . '-' . bin2hex(random_bytes(6)));
    $labelxml = s($label);
    $serverxml = s($servername);
    return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadType</key><string>com.apple.dnsSettings.managed</string>
      <key>PayloadVersion</key><integer>1</integer>
      <key>PayloadIdentifier</key><string>academy.ehel.safenet.dns.{$device->clientid}</string>
      <key>PayloadUUID</key><string>{$uuid1}</string>
      <key>PayloadDisplayName</key><string>{$labelxml} DNS</string>
      <key>DNSSettings</key>
      <dict>
        <key>DNSProtocol</key><string>TLS</string>
        <key>ServerName</key><string>{$serverxml}</string>
      </dict>
      <key>ProhibitDisablement</key><true/>
    </dict>
  </array>
  <key>PayloadType</key><string>Configuration</string>
  <key>PayloadVersion</key><integer>1</integer>
  <key>PayloadIdentifier</key><string>academy.ehel.safenet.{$device->clientid}</string>
  <key>PayloadUUID</key><string>{$uuid2}</string>
  <key>PayloadDisplayName</key><string>{$labelxml} — Ehel Safe Internet</string>
  <key>PayloadRemovalDisallowed</key><false/>
</dict>
</plist>
XML;
}
