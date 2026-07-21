<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

// Ehel Safe Internet — shared helpers for the parent portal (safenet.php) and
// the AdGuard Home bridge. The filtering service is offered per consumer via
// the 'safe_internet' feature flag; all rows are scoped consumerid+workspaceid.

// Learning Mode (allowlist-only) marker. AdGuard rejects custom client tags, so
// we repurpose the predefined 'user_regular' tag purely as our Learning-Mode
// flag: rules scoped $ctag=user_regular apply only to devices carrying it.
const PQSN_LEARN_TAG = 'user_regular';

function pqsn_config(): stdClass {
    $cfg = new stdClass();
    // dnsdomain is the SHARED device hostname base (e.g. dns.safe.eduplatform.ai)
    // that resolves to every resolver IP, giving single-hostname OSes automatic
    // failover. dnsdomain2 stays supported for legacy per-server setups.
    $cfg->dnsdomain = trim((string)get_config('local_prequran', 'safenet_dns_domain'));
    $cfg->dnsdomain2 = trim((string)get_config('local_prequran', 'safenet_dns_domain2'));
    // One or more AdGuard control endpoints. A device client is pushed to ALL of
    // them so its per-device policy applies whichever resolver it reaches.
    $cfg->endpoints = [];
    foreach ([
        ['safenet_api_url', 'safenet_api_user', 'safenet_api_pass'],
        ['safenet_api_url2', 'safenet_api_user2', 'safenet_api_pass2'],
    ] as $keys) {
        $url = rtrim(trim((string)get_config('local_prequran', $keys[0])), '/');
        $user = trim((string)get_config('local_prequran', $keys[1]));
        $pass = (string)get_config('local_prequran', $keys[2]);
        if ($url !== '' && $user !== '') {
            $ep = new stdClass();
            $ep->url = $url;
            $ep->user = $user;
            $ep->pass = $pass;
            $cfg->endpoints[] = $ep;
        }
    }
    // Back-compat single-endpoint accessors (first endpoint).
    $cfg->apiurl = $cfg->endpoints[0]->url ?? '';
    $cfg->apiuser = $cfg->endpoints[0]->user ?? '';
    $cfg->apipass = $cfg->endpoints[0]->pass ?? '';
    $cfg->configured = $cfg->dnsdomain !== '';
    $cfg->apiready = count($cfg->endpoints) > 0;
    return $cfg;
}

/**
 * Domains permitted in Learning Mode (allowlist-only). Platform + a curated
 * educational set; extendable per install via the safenet_learn_extra config
 * (comma/space separated). This is the school-owned list — parents only toggle.
 */
function pqsn_learning_allowlist(): array {
    $base = [
        'eduplatform.ai', 'edufortomorrow.com', 'uniso.site', 'quraantest.academy', 'b-cdn.net',
        'wikipedia.org', 'wikimedia.org', 'wiktionary.org', 'khanacademy.org',
    ];
    $extra = trim((string)get_config('local_prequran', 'safenet_learn_extra'));
    if ($extra !== '') {
        foreach (preg_split('/[\s,]+/', $extra) as $d) {
            $d = trim($d);
            if ($d !== '') {
                $base[] = $d;
            }
        }
    }
    return array_values(array_unique($base));
}

/**
 * The full AdGuard user-rule set: the always-on platform allowlist, plus the
 * Learning-Mode rules (dormant until a device carries PQSN_LEARN_TAG). Keeping
 * the learning rules always present means toggling a device is just a tag change.
 */
function pqsn_base_user_rules(): array {
    $rules = [
        '@@||eduplatform.ai^$important',
        '@@||edufortomorrow.com^$important',
        '@@||uniso.site^$important',
        '@@||quraantest.academy^$important',
        '@@||b-cdn.net^$important',
    ];
    foreach (pqsn_learning_allowlist() as $d) {
        $rules[] = '@@||' . $d . '^$ctag=' . PQSN_LEARN_TAG;
    }
    // Block everything else — but only for devices tagged as being in Learning Mode.
    $rules[] = '*$ctag=' . PQSN_LEARN_TAG;
    return $rules;
}

/**
 * Is the given weekly learning schedule active at $now? Schedule JSON:
 * {"days":[1..7 ISO],"start":"HH:MM","end":"HH:MM","tz":"Area/City"}.
 * Supports overnight windows (start > end).
 */
function pqsn_schedule_is_active(?string $json, ?int $now = null): bool {
    $now = $now ?? time();
    $sch = json_decode((string)$json, true);
    if (!is_array($sch) || empty($sch['days']) || empty($sch['start']) || empty($sch['end'])) {
        return false;
    }
    $tz = (string)($sch['tz'] ?? 'UTC');
    try {
        $dt = new DateTime('@' . $now);
        $dt->setTimezone(new DateTimeZone($tz !== '' ? $tz : 'UTC'));
    } catch (Throwable $e) {
        return false;
    }
    $dow = (int)$dt->format('N');
    if (!in_array($dow, array_map('intval', (array)$sch['days']), true)) {
        return false;
    }
    $cur = $dt->format('H:i');
    $start = (string)$sch['start'];
    $end = (string)$sch['end'];
    if ($start <= $end) {
        return $cur >= $start && $cur < $end;
    }
    return $cur >= $start || $cur < $end; // overnight window
}

/** Short human summary of a schedule, or '' if none. */
function pqsn_schedule_summary(?string $json): string {
    $sch = json_decode((string)$json, true);
    if (!is_array($sch) || empty($sch['days']) || empty($sch['start']) || empty($sch['end'])) {
        return '';
    }
    $names = [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'];
    $days = array_map(static function ($d) use ($names) {
        return $names[(int)$d] ?? '';
    }, (array)$sch['days']);
    $days = array_filter($days);
    return implode(' ', $days) . ' · ' . (string)$sch['start'] . '–' . (string)$sch['end'];
}

/**
 * Latest query time (unix) per ClientID seen across all resolvers' recent logs.
 * Used to keep each device's lastseen fresh and to detect silence (bypass/off).
 */
function pqsn_recent_client_activity(int $limit = 800): array {
    $cfg = pqsn_config();
    $seen = [];
    foreach ($cfg->endpoints as $ep) {
        [$ok, $res] = pqsn_api_request_ep($ep, 'GET', '/control/querylog?limit=' . (int)$limit, null);
        if (!$ok || !is_array($res) || empty($res['data'])) {
            continue;
        }
        foreach ($res['data'] as $entry) {
            $cid = (string)($entry['client_id'] ?? '');
            if ($cid === '') {
                continue;
            }
            $t = strtotime((string)($entry['time'] ?? ''));
            if ($t === false) {
                continue;
            }
            if (!isset($seen[$cid]) || $t > $seen[$cid]) {
                $seen[$cid] = $t;
            }
        }
    }
    return $seen;
}

/**
 * Email the device's parent (or enroller) that it stopped reporting while it was
 * expected to be online and filtered — the fingerprint of a VPN, a changed/removed
 * DNS setting, or a switch to another device.
 */
function pqsn_notify_silent_device(stdClass $device): bool {
    $parentid = (int)$device->parentid > 0 ? (int)$device->parentid : (int)$device->enrolledby;
    if ($parentid <= 0) {
        return false;
    }
    $parent = core_user::get_user($parentid, '*', IGNORE_MISSING);
    if (!$parent || !empty($parent->deleted) || empty($parent->email)) {
        return false;
    }
    $childname = 'the student';
    $child = core_user::get_user((int)$device->childid, '*', IGNORE_MISSING);
    if ($child && empty($child->deleted)) {
        $childname = fullname($child);
    }
    $label = trim((string)$device->label) !== '' ? (string)$device->label : 'A device';
    $from = core_user::get_support_user();
    $subject = 'Safe Internet: "' . $label . '" stopped reporting';
    $body = $label . " (" . $childname . ") is expected to be online and filtered right now, but it has stopped sending requests to Safe Internet.\n\n"
        . "This usually means one of:\n"
        . " - a VPN was switched on,\n"
        . " - the DNS/Private DNS setting was changed or removed,\n"
        . " - or the child is using a different device.\n\n"
        . "Please check the device. If you use Family Link / Screen Time / a standard (non-admin) account, confirm those are still in place.";
    return email_to_user($parent, $from, $subject, $body);
}

/** Push the base+learning ruleset to every resolver (idempotent). */
function pqsn_ensure_learning_rules(): void {
    $cfg = pqsn_config();
    $body = ['rules' => pqsn_base_user_rules()];
    foreach ($cfg->endpoints as $ep) {
        pqsn_api_request_ep($ep, 'POST', '/control/filtering/set_rules', $body);
    }
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
    // A bare 12- or 16-hex-char string is parsed by AdGuard as a MAC address
    // (e.g. d12feaf72d4c -> d1:2f:ea:f7:2d:4c), which breaks ClientID matching.
    // Use a 14-char mixed lowercase alphanumeric label: DNS-safe, never a MAC/IP.
    $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    $len = strlen($alphabet);
    for ($i = 0; $i < 20; $i++) {
        $candidate = 'd';
        for ($j = 0; $j < 13; $j++) {
            $candidate .= $alphabet[random_int(0, $len - 1)];
        }
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

/** Basic-auth JSON call to one AdGuard Home control endpoint. Returns [ok, payload|errorstring]. */
function pqsn_api_request_ep(stdClass $ep, string $method, string $path, ?array $body = null): array {
    $ch = curl_init($ep->url . $path);
    $headers = ['Content-Type: application/json'];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_USERPWD => $ep->user . ':' . $ep->pass,
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

/** Convenience call against the first configured endpoint (e.g. a status probe). */
function pqsn_api_request(string $method, string $path, ?array $body = null): array {
    $cfg = pqsn_config();
    if (!$cfg->apiready) {
        return [false, 'AdGuard API is not configured'];
    }
    return pqsn_api_request_ep($cfg->endpoints[0], $method, $path, $body);
}

function pqsn_api_client_payload(stdClass $device): array {
    $policy = (string)$device->policy;
    $active = $policy !== 'paused';
    $tags = ['user_child'];
    if ($policy === 'learning') {
        // The Learning-Mode tag activates the allowlist-only $ctag rules.
        $tags[] = PQSN_LEARN_TAG;
    }
    return [
        'name' => trim((string)$device->label) !== '' ? (string)$device->label : ('Device ' . $device->clientid),
        'ids' => [(string)$device->clientid],
        'tags' => $tags,
        'use_global_settings' => $active,
        'filtering_enabled' => $active,
        'parental_enabled' => $active,
        'safebrowsing_enabled' => true,
        'safe_search' => ['enabled' => $active],
        'use_global_blocked_services' => true,
        'blocked_services' => [],
        'upstreams' => [],
    ];
}

/**
 * Push one device to EVERY configured resolver (create, falling back to update),
 * so the per-device policy applies whichever server the device reaches. syncstatus
 * becomes 'synced' only when all endpoints accepted it, else 'pending' for retry.
 */
function pqsn_sync_device(stdClass $device): array {
    global $DB;
    $cfg = pqsn_config();
    $payload = pqsn_api_client_payload($device);
    $allok = count($cfg->endpoints) > 0;
    $lasterr = '';
    foreach ($cfg->endpoints as $ep) {
        [$ok, $result] = pqsn_api_request_ep($ep, 'POST', '/control/clients/add', $payload);
        if (!$ok && is_string($result) && strpos($result, 'already exists') !== false) {
            [$ok, $result] = pqsn_api_request_ep($ep, 'POST', '/control/clients/update', [
                'name' => $payload['name'],
                'data' => $payload,
            ]);
        }
        if (!$ok) {
            $allok = false;
            $lasterr = is_string($result) ? $result : '';
        }
    }
    $device->syncstatus = $allok ? 'synced' : 'pending';
    $device->timemodified = time();
    $DB->update_record('local_prequran_safenet_dev', $device);
    return [$allok, $lasterr];
}

function pqsn_remove_device_from_server(stdClass $device): void {
    $cfg = pqsn_config();
    $payload = pqsn_api_client_payload($device);
    foreach ($cfg->endpoints as $ep) {
        pqsn_api_request_ep($ep, 'POST', '/control/clients/delete', ['name' => $payload['name']]);
    }
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

/**
 * One-click Windows setup script (.bat). Self-elevates, then runs an embedded
 * (base64-encoded, so no cmd-escaping pitfalls) PowerShell block that: registers
 * the device's DoH template for each resolver IP, points every active adapter's
 * DNS at the resolvers (encrypted), and locks Chrome/Edge/Firefox to the same
 * DoH so no browser can bypass the system filter. The parent just double-clicks
 * and approves the elevation prompt.
 */
function pqsn_windows_setup_bat(stdClass $device): string {
    $cfg = pqsn_config();
    $shared = $cfg->dnsdomain !== '' ? $cfg->dnsdomain : 'dns.safe.eduplatform.ai';
    $t = 'https://' . $device->clientid . '.' . $shared . '/dns-query';
    $ps = implode("\n", [
        "\$ErrorActionPreference='Stop'",
        "\$t='{$t}'",
        "\$shared='{$shared}'",
        "\$ips=@((Resolve-DnsName \$shared -Type A).IPAddress)",
        "foreach(\$ip in \$ips){ netsh dns add encryption server=\$ip dohtemplate=\$t autoupgrade=yes | Out-Null }",
        "Get-NetAdapter -Physical | Where-Object {\$_.Status -eq 'Up'} | ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex \$_.ifIndex -ServerAddresses \$ips }",
        "\$c='HKLM:\\SOFTWARE\\Policies\\Google\\Chrome'; New-Item \$c -Force | Out-Null; Set-ItemProperty \$c DnsOverHttpsMode 'secure'; Set-ItemProperty \$c DnsOverHttpsTemplates \$t",
        "\$e='HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge'; New-Item \$e -Force | Out-Null; Set-ItemProperty \$e DnsOverHttpsMode 'secure'; Set-ItemProperty \$e DnsOverHttpsTemplates \$t",
        "\$f='HKLM:\\SOFTWARE\\Policies\\Mozilla\\Firefox\\DNSOverHTTPS'; New-Item \$f -Force | Out-Null; Set-ItemProperty \$f Enabled 1 -Type DWord; Set-ItemProperty \$f ProviderURL \$t; Set-ItemProperty \$f Locked 1 -Type DWord",
        "Clear-DnsClientCache",
        "Write-Host ''; Write-Host '  Done - Safe Internet now protects every app on this PC.' -ForegroundColor Green",
        "Write-Host '  Keep the child on a standard (non-admin) Windows account.' -ForegroundColor Yellow",
    ]);
    $encoded = base64_encode(mb_convert_encoding($ps, 'UTF-16LE', 'UTF-8'));
    $lines = [
        '@echo off',
        'title Ehel Safe Internet Setup',
        'net session >nul 2>&1',
        'if %errorlevel% neq 0 (',
        '  powershell -NoProfile -Command "Start-Process -FilePath \'%~f0\' -Verb RunAs"',
        '  exit /b',
        ')',
        'echo Applying Safe Internet to this PC (all apps)...',
        'powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ' . $encoded,
        'pause',
    ];
    return implode("\r\n", $lines) . "\r\n";
}

/**
 * Matching removal script (.bat). Self-elevates, resets every adapter's DNS to
 * automatic, deletes the DoH encryption templates, and removes the browser DoH
 * locks — fully undoing pqsn_windows_setup_bat().
 */
function pqsn_windows_uninstall_bat(stdClass $device): string {
    $cfg = pqsn_config();
    $shared = $cfg->dnsdomain !== '' ? $cfg->dnsdomain : 'dns.safe.eduplatform.ai';
    $ps = implode("\n", [
        "\$ErrorActionPreference='SilentlyContinue'",
        "\$shared='{$shared}'",
        "Get-NetAdapter -Physical | Where-Object {\$_.Status -eq 'Up'} | ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex \$_.ifIndex -ResetServerAddresses }",
        "try { \$ips=@((Resolve-DnsName \$shared -Type A -ErrorAction Stop).IPAddress); foreach(\$ip in \$ips){ netsh dns delete encryption server=\$ip | Out-Null } } catch {}",
        "Remove-ItemProperty 'HKLM:\\SOFTWARE\\Policies\\Google\\Chrome' -Name DnsOverHttpsMode,DnsOverHttpsTemplates -ErrorAction SilentlyContinue",
        "Remove-ItemProperty 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge' -Name DnsOverHttpsMode,DnsOverHttpsTemplates -ErrorAction SilentlyContinue",
        "Remove-Item 'HKLM:\\SOFTWARE\\Policies\\Mozilla\\Firefox\\DNSOverHTTPS' -Recurse -Force -ErrorAction SilentlyContinue",
        "Clear-DnsClientCache",
        "Write-Host ''; Write-Host '  Safe Internet has been removed from this PC.' -ForegroundColor Green",
    ]);
    $encoded = base64_encode(mb_convert_encoding($ps, 'UTF-16LE', 'UTF-8'));
    $lines = [
        '@echo off',
        'title Ehel Safe Internet - Remove',
        'net session >nul 2>&1',
        'if %errorlevel% neq 0 (',
        '  powershell -NoProfile -Command "Start-Process -FilePath \'%~f0\' -Verb RunAs"',
        '  exit /b',
        ')',
        'echo Removing Safe Internet from this PC...',
        'powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ' . $encoded,
        'pause',
    ];
    return implode("\r\n", $lines) . "\r\n";
}
