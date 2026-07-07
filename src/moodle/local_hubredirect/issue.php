<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_catalog.php');

$accountidshelper = __DIR__ . '/account_ids.php';
if (is_readable($accountidshelper)) {
    require_once($accountidshelper);
}
if (!function_exists('pqh_assign_account_id')) {
    function pqh_assign_account_id(int $userid, string $accounttype): string {
        return '';
    }
}

$userid = (int)$USER->id;
$coursekeys = pqh_user_course_keys($userid);
if (!is_siteadmin($userid) && $coursekeys && !in_array('pre_quraan', $coursekeys, true)) {
    redirect(new moodle_url('/local/hubredirect/dashboard.php'));
}

/* A) Build user payload for your exchange.php */
$custom = profile_user_record($userid, false);

$tableexists = function(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
};

$resolveaccounttype = function(int $userid) use ($tableexists): string {
    global $DB;
    if ($userid <= 0) {
        return '';
    }
    try {
        if ($tableexists('local_prequran_student_profile')
            && $DB->record_exists('local_prequran_student_profile', ['userid' => $userid])) {
            return 'student';
        }
        if ($tableexists('local_prequran_teacher_profile')
            && $DB->record_exists('local_prequran_teacher_profile', ['userid' => $userid])) {
            return 'teacher';
        }
        if ($tableexists('local_prequran_live_consent')
            && $DB->record_exists('local_prequran_live_consent', ['guardianid' => $userid])) {
            return 'parent';
        }
        if ($tableexists('local_prequran_comm_consent')
            && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $userid])) {
            return 'parent';
        }
    } catch (Throwable $e) {
        return '';
    }
    return '';
};

$accountId = trim((string)($USER->idnumber ?? ''));
$accountType = '';
if (preg_match('/^EA-(STU|TCH|PAR)-\d{4}-\d+$/', $accountId, $matches)) {
    $accountType = ['STU' => 'student', 'TCH' => 'teacher', 'PAR' => 'parent'][$matches[1]] ?? '';
}
if ($accountId === '') {
    $accountType = $resolveaccounttype($userid);
    if ($accountType !== '') {
        $accountId = pqh_assign_account_id($userid, $accountType);
    }
}
$accountLabel = ['student' => 'Student ID', 'teacher' => 'Teacher ID', 'parent' => 'Parent ID'][$accountType] ?? 'Account ID';

$customvalue = function(array $shortnames) use ($custom): string {
    foreach ($shortnames as $name) {
        if (isset($custom->{$name}) && $custom->{$name} !== '' && $custom->{$name} !== null) {
            return trim((string)$custom->{$name});
        }
    }
    return '';
};

$normalizelang = function(string $value): string {
    $raw = strtolower(trim(str_replace('_', '-', $value)));
    $first = explode('-', $raw)[0] ?? '';
    $aliases = [
        'english' => 'en', 'eng' => 'en', 'en' => 'en',
        'arabic' => 'ar', 'ar' => 'ar',
        'somali' => 'so', 'som' => 'so', 'so' => 'so',
        'swahili' => 'sw', 'kiswahili' => 'sw', 'swa' => 'sw', 'sw' => 'sw',
        'punjabi' => 'pa', 'panjabi' => 'pa', 'pa' => 'pa',
        'urdu' => 'ur', 'ur' => 'ur',
    ];
    $code = $aliases[$raw] ?? ($aliases[$first] ?? $first);
    return in_array($code, ['en', 'ar', 'so', 'sw', 'pa', 'ur'], true) ? $code : 'en';
};

$normalizescope = function(string $value): string {
    $raw = strtolower(trim(preg_replace('/[\s\-]+/', '_', $value)));
    $aliases = [
        'ui' => 'ui', 'interface' => 'ui', 'ui_only' => 'ui',
        'content' => 'content', 'lecture' => 'content', 'lectures' => 'content',
        'message' => 'content', 'messages' => 'content', 'only_lectures' => 'content',
        'both' => 'both', 'all' => 'both', 'ui_and_content' => 'both',
    ];
    return $aliases[$raw] ?? 'both';
};

$preferredLanguage = $normalizelang($customvalue([
    'preferred_language', 'preferredlanguage', 'language_preference', 'languagepreference',
    'prequran_language', 'prequran_lang', 'ui_language', 'uilanguage', 'langpref', 'language'
]) ?: (string)($USER->lang ?? ''));
$languageScope = $normalizescope($customvalue([
    'language_scope', 'languagescope', 'translation_scope', 'translationscope',
    'localization_scope', 'localizationscope', 'prequran_language_scope', 'prequran_lang_scope',
    'ui_content_preference', 'uicontentpreference', 'translation_preference', 'translationpreference',
    'preferred_language_scope'
]));

$payload = [
    'name'        => fullname($USER),
    'email'       => $USER->email ?? '',
    'parent_name' => $custom->parent_name ?? '',
    'lang'        => $USER->lang ?? '',
    'preferred_language' => $preferredLanguage,
    'language_scope' => $languageScope,
    'account_id' => $accountId,
    'account_type' => $accountType,
    'account_label' => $accountLabel,
];

$normalizeenv = function(string $value): string {
    $env = strtolower(trim($value));
    return in_array($env, ['integration', 'staging', 'production'], true) ? $env : 'production';
};

$envbasepath = function(string $env): string {
    $configured = '';
    if (function_exists('get_config')) {
        $configured = trim((string)get_config('local_prequran', 'bunny_base_' . $env));
    }
    if ($configured === '') {
        $configured = [
            'integration' => '/pre_quraan_integration/',
            'staging' => '/pre_quraan_staging/',
            'production' => '/pre_quraan/',
        ][$env] ?? '/pre_quraan/';
    }
    return '/' . trim($configured, '/') . '/';
};

$appbaseurl = function(): string {
    global $CFG;

    $wwwroot = rtrim((string)$CFG->wwwroot, '/');
    $host = strtolower((string)(parse_url($wwwroot, PHP_URL_HOST) ?: ''));
    $isNonProductionHost = $host !== '' && (
        strpos($host, 'test') !== false
        || preg_match('/(^|[.\-])(staging|integration|qa)([.\-]|$)/', $host)
    );

    $configured = '';
    if (function_exists('get_config')) {
        $configured = trim((string)get_config('local_prequran', 'bunny_app_base_url'));
    }
    if ($isNonProductionHost) {
        return pqh_shared_resource_cdn_base_url('production');
    }
    if ($configured !== '') {
        $configuredhost = pqh_normalize_url_host($configured);
        if (pqh_is_legacy_quran_resource_host($configuredhost)) {
            return pqh_shared_resource_cdn_base_url('production');
        }
        return rtrim($configured, '/');
    }

    if ($isNonProductionHost) {
        return $wwwroot;
    }

    return pqh_shared_resource_cdn_base_url('production');
};

$requestedEnvRaw = optional_param('pq_env', '', PARAM_ALPHANUMEXT);
$requestedEnv = $normalizeenv($requestedEnvRaw);
$defaultEnv = $normalizeenv((string)get_config('local_prequran', 'bunny_environment'));
$allowNonProduction = is_siteadmin() || (bool)get_config('local_prequran', 'allow_nonproduction_launch');
$launchEnv = $requestedEnvRaw !== '' ? $requestedEnv : $defaultEnv;
if ($requestedEnvRaw !== '' && $launchEnv !== 'production' && !$allowNonProduction) {
    $launchEnv = 'production';
}
$payload['pq_env'] = $launchEnv;

/* B) Create short-lived Moodle token (used by /exchange.php) */
$mtoken = bin2hex(random_bytes(16));

$DB->insert_record('local_hubredirect_tok', (object) [
    'token'       => $mtoken,
    'payloadjson' => json_encode($payload, JSON_UNESCAPED_UNICODE),
    'expires'     => time() + 120,
    'consumed'    => 0,
    'timecreated' => time(),
]);

/* C) Redirect to app entry point on Bunny custom hostname */
$appBase = $appbaseurl();
$appPath = $envbasepath($launchEnv) . 'app/index.html';

$dest = $appBase . $appPath
    . '?mtoken=' . urlencode($mtoken)
    . '&pq_env=' . urlencode($launchEnv)
    . '&moodle_origin=' . urlencode(rtrim((string)$CFG->wwwroot, '/'))
    . '&pq_lang=' . urlencode($preferredLanguage)
    . '&pq_lang_scope=' . urlencode($languageScope);

redirect($dest);
