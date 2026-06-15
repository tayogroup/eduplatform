<?php
defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/filelib.php');

/**
 * Normalize a hosted BBB URL so API calls are always sent to /bigbluebutton/api/.
 */
function local_prequran_bbb_api_base_url(): string {
    $baseurl = trim((string)get_config('local_prequran', 'bbb_base_url'));
    if ($baseurl === '') {
        throw new moodle_exception('bbb_config_missing', 'local_prequran');
    }

    $baseurl = rtrim($baseurl, '/') . '/';
    if (preg_match('#/api/$#', $baseurl)) {
        return $baseurl;
    }
    if (preg_match('#/bigbluebutton/$#', $baseurl)) {
        return $baseurl . 'api/';
    }
    if (preg_match('#/bigbluebutton/[^/]+/$#', $baseurl)) {
        return $baseurl . 'api/';
    }

    return $baseurl . 'bigbluebutton/api/';
}

/**
 * Build a signed BigBlueButton API URL.
 *
 * BBB checksums are sha1(callname + querystring + sharedsecret).
 */
function local_prequran_bbb_build_url(string $callname, array $params = []): string {
    $secret = trim((string)get_config('local_prequran', 'bbb_shared_secret'));
    if ($secret === '') {
        throw new moodle_exception('bbb_config_missing', 'local_prequran');
    }

    $callname = clean_param($callname, PARAM_ALPHANUMEXT);
    if ($callname === '') {
        throw new invalid_parameter_exception('BBB call name is required.');
    }

    $cleanparams = [];
    foreach ($params as $key => $value) {
        if ($value === null) {
            continue;
        }
        if (is_bool($value)) {
            $value = $value ? 'true' : 'false';
        }
        $cleanparams[(string)$key] = (string)$value;
    }

    ksort($cleanparams);
    $query = http_build_query($cleanparams, '', '&', PHP_QUERY_RFC3986);
    $checksum = sha1($callname . $query . $secret);
    $separator = $query === '' ? '' : '?';

    return local_prequran_bbb_api_base_url() . rawurlencode($callname) . $separator . $query . ($query === '' ? '?' : '&') . 'checksum=' . $checksum;
}

/**
 * Call BBB and return the parsed XML response.
 */
function local_prequran_bbb_call(string $callname, array $params = [], bool $expectsuccess = true): SimpleXMLElement {
    $curl = new curl();
    $curl->setopt([
        'CURLOPT_CONNECTTIMEOUT' => 10,
        'CURLOPT_TIMEOUT' => 30,
        'CURLOPT_FOLLOWLOCATION' => true,
        'CURLOPT_MAXREDIRS' => 3,
    ]);

    $response = $curl->get(local_prequran_bbb_build_url($callname, $params));
    if ($response === false || $response === '') {
        throw new moodle_exception('bbb_api_error', 'local_prequran', '', 'empty response');
    }

    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($response);
    if (!$xml) {
        libxml_clear_errors();
        $preview = trim(preg_replace('/\s+/', ' ', strip_tags((string)$response)));
        if (core_text::strlen($preview) > 240) {
            $preview = core_text::substr($preview, 0, 240) . '...';
        }
        throw new moodle_exception('bbb_api_error', 'local_prequran', '', 'invalid XML response: ' . ($preview !== '' ? $preview : 'non-XML response'));
    }

    $returncode = strtoupper((string)($xml->returncode ?? ''));
    if ($expectsuccess && $returncode !== 'SUCCESS') {
        $message = (string)($xml->message ?? $xml->messageKey ?? 'unknown error');
        throw new moodle_exception('bbb_api_error', 'local_prequran', '', $message);
    }

    return $xml;
}

/**
 * Create a BBB meeting for a Quraan Academy live session.
 */
function local_prequran_bbb_create_meeting(array $meeting): SimpleXMLElement {
    foreach (['meetingID', 'name', 'attendeePW', 'moderatorPW'] as $required) {
        if (empty($meeting[$required])) {
            throw new invalid_parameter_exception($required . ' is required.');
        }
    }

    $defaults = [
        'record' => false,
        'autoStartRecording' => false,
        'allowStartStopRecording' => false,
        'muteOnStart' => true,
        'maxParticipants' => (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12,
        'duration' => 90,
    ];

    return local_prequran_bbb_call('create', array_merge($defaults, $meeting));
}

/**
 * Return active student IDs for a live session.
 */
function local_prequran_live_session_student_ids(int $sessionid): array {
    global $DB;

    if ($sessionid <= 0 || !$DB->get_manager()->table_exists('local_prequran_live_participant')) {
        return [];
    }

    $rows = $DB->get_records('local_prequran_live_participant', [
        'sessionid' => $sessionid,
        'role' => 'student',
        'status' => 'active',
    ]);
    $studentids = [];
    foreach ($rows as $row) {
        $studentid = (int)($row->studentid ?: $row->userid);
        if ($studentid > 0) {
            $studentids[$studentid] = $studentid;
        }
    }

    return array_values($studentids);
}

/**
 * Check whether a student has recording consent from any known source.
 */
function local_prequran_live_student_has_recording_consent(int $studentid): bool {
    global $DB;

    if ($studentid <= 0) {
        return false;
    }

    if ($DB->get_manager()->table_exists('local_prequran_live_consent')
        && $DB->record_exists('local_prequran_live_consent', [
            'studentid' => $studentid,
            'consent_type' => 'recording',
            'granted' => 1,
        ])) {
        return true;
    }

    if ($DB->get_manager()->table_exists('local_prequran_student_profile')
        && $DB->record_exists('local_prequran_student_profile', [
            'userid' => $studentid,
            'recording_consent' => 1,
            'status' => 'active',
        ])) {
        return true;
    }

    return false;
}

/**
 * Decide whether a live session may be recorded under the child-safety consent policy.
 */
function local_prequran_live_recording_consent_decision($session): array {
    $requested = !empty($session->recording_enabled);
    if (!$requested) {
        return [
            'requested' => false,
            'allowed' => false,
            'missing_studentids' => [],
            'studentids' => [],
            'reason' => 'recording_not_requested',
        ];
    }

    if (empty($session->recording_consent_required)) {
        return [
            'requested' => true,
            'allowed' => true,
            'missing_studentids' => [],
            'studentids' => local_prequran_live_session_student_ids((int)$session->id),
            'reason' => 'consent_not_required',
        ];
    }

    $studentids = local_prequran_live_session_student_ids((int)$session->id);
    $missing = [];
    foreach ($studentids as $studentid) {
        if (!local_prequran_live_student_has_recording_consent((int)$studentid)) {
            $missing[] = (int)$studentid;
        }
    }

    return [
        'requested' => true,
        'allowed' => empty($missing),
        'missing_studentids' => $missing,
        'studentids' => $studentids,
        'reason' => empty($missing) ? 'recording_consent_granted' : 'missing_recording_consent',
    ];
}

/**
 * Build a signed BBB join URL for a moderator, student, or approved observer.
 */
function local_prequran_bbb_join_url(
    string $meetingid,
    string $fullname,
    string $password,
    int $userid,
    array $extra = []
): string {
    if ($meetingid === '' || $fullname === '' || $password === '' || $userid <= 0) {
        throw new invalid_parameter_exception('meetingID, fullName, password, and userID are required.');
    }

    $params = array_merge([
        'meetingID' => $meetingid,
        'fullName' => $fullname,
        'password' => $password,
        'userID' => $userid,
        'redirect' => true,
    ], $extra);

    return local_prequran_bbb_build_url('join', $params);
}

/**
 * Fetch BBB recordings, optionally limited by meeting ID or record ID.
 */
function local_prequran_bbb_get_recordings(string $meetingid = '', string $recordid = ''): SimpleXMLElement {
    $params = [];
    if ($meetingid !== '') {
        $params['meetingID'] = $meetingid;
    }
    if ($recordid !== '') {
        $params['recordID'] = $recordid;
    }

    return local_prequran_bbb_call('getRecordings', $params);
}
