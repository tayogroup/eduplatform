<?php
// Platform-settings query/write library — extracted VERBATIM from
// platform_settings.php (renamed pqps_ -> pqpsl_) for the token-gated portal
// endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Shared helpers the page uses (pqh_table_exists_safe,
// pqh_table_has_field_safe, pqhi_record_for_existing_columns) are NOT copied —
// they come from accesslib.php / institutionlib.php, required by the handler.
// Requires: local/hubredirect/accesslib.php + institutionlib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqpsl_clean_local_path(string $path, string $fallback): string {
    $path = trim($path);
    if ($path === '') {
        return $fallback;
    }
    if ($path[0] !== '/') {
        $path = '/' . $path;
    }
    $path = clean_param($path, PARAM_LOCALURL);
    if ($path === '' || strpos($path, '//') === 0 || preg_match('/^\/?https?:/i', $path)) {
        throw new invalid_parameter_exception('Choose a local Moodle path such as /local/hubredirect/platform_landing.php.');
    }
    return $path;
}

function pqpsl_json_array(string $json): array {
    if (trim($json) === '') {
        return [];
    }
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function pqpsl_clean_initials(string $initials, string $fallback): string {
    $initials = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $initials) ?? '');
    if ($initials === '') {
        $initials = $fallback;
    }
    return substr($initials, 0, 4);
}

function pqpsl_clean_hex_color(string $color, string $fallback): string {
    $color = trim($color);
    if ($color === '') {
        return $fallback;
    }
    if ($color[0] !== '#') {
        $color = '#' . $color;
    }
    return preg_match('/^#[0-9a-fA-F]{6}$/', $color) ? strtolower($color) : $fallback;
}

function pqpsl_clean_logo_url(string $url): string {
    $url = trim($url);
    if ($url === '') {
        return '';
    }
    if ($url[0] === '/') {
        return clean_param($url, PARAM_LOCALURL);
    }
    $url = clean_param($url, PARAM_URL);
    return preg_match('/^https:\/\//i', $url) ? $url : '';
}

function pqpsl_foundation_consumer(): ?stdClass {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_consumer')) {
        return null;
    }
    return $DB->get_record('local_prequran_consumer', ['slug' => 'eduplatform'], '*', IGNORE_MISSING) ?: null;
}

function pqpsl_foundation_domains(int $consumerid): array {
    global $DB;
    if ($consumerid <= 0 || !pqh_table_exists_safe('local_prequran_consumer_domain')) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_consumer_domain', ['consumerid' => $consumerid], 'isprimary DESC, domain ASC'));
}

function pqpsl_update_foundation_consumer(stdClass $consumer): void {
    global $DB;

    $supportemail = trim(optional_param('supportemail', '', PARAM_EMAIL));
    if ($supportemail !== '' && !validate_email($supportemail)) {
        throw new invalid_parameter_exception('Enter a valid support email address.');
    }

    $replyto = trim(optional_param('emailreplyto', '', PARAM_EMAIL));
    if ($replyto !== '' && !validate_email($replyto)) {
        throw new invalid_parameter_exception('Enter a valid reply-to email address.');
    }

    $fromname = trim(optional_param('emailfromname', 'EduPlatform', PARAM_TEXT));
    $consumer->name = trim(optional_param('name', 'EduPlatform', PARAM_TEXT)) ?: 'EduPlatform';
    $consumer->supportemail = $supportemail;
    $consumer->emailfromname = $fromname !== '' ? $fromname : 'EduPlatform';
    $consumer->emailreplyto = $replyto !== '' ? $replyto : $supportemail;
    $consumer->defaultpublicpath = pqpsl_clean_local_path(
        optional_param('defaultpublicpath', '/local/hubredirect/platform_landing.php', PARAM_RAW_TRIMMED),
        '/local/hubredirect/platform_landing.php'
    );
    $consumer->defaultdashboardpath = pqpsl_clean_local_path(
        optional_param('defaultdashboardpath', '/local/hubredirect/platform_dashboard.php', PARAM_RAW_TRIMMED),
        '/local/hubredirect/platform_dashboard.php'
    );

    $copy = pqpsl_json_array((string)($consumer->copyjson ?? ''));
    $copy['brand_initials'] = pqpsl_clean_initials(optional_param('brand_initials', 'EP', PARAM_RAW_TRIMMED), 'EP');
    $copy['logo_url'] = pqpsl_clean_logo_url(optional_param('logo_url', '', PARAM_RAW_TRIMMED));
    $copy['default_login_path'] = pqpsl_clean_local_path(
        optional_param('defaultloginpath', '/local/hubredirect/consumer_login.php', PARAM_RAW_TRIMMED),
        '/local/hubredirect/consumer_login.php'
    );
    $consumer->copyjson = json_encode($copy);

    $theme = pqpsl_json_array((string)($consumer->themejson ?? ''));
    $theme['primary_color'] = pqpsl_clean_hex_color(optional_param('primary_color', '#2f6f4e', PARAM_RAW_TRIMMED), '#2f6f4e');
    $theme['accent_color'] = pqpsl_clean_hex_color(optional_param('accent_color', '#d6a642', PARAM_RAW_TRIMMED), '#d6a642');
    $theme['surface_color'] = pqpsl_clean_hex_color(optional_param('surface_color', '#f5f8fb', PARAM_RAW_TRIMMED), '#f5f8fb');
    $consumer->themejson = json_encode($theme);

    if (pqh_table_has_field_safe('local_prequran_consumer', 'timemodified')) {
        $consumer->timemodified = time();
    }

    $DB->update_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $consumer));
}
