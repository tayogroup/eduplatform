<?php
// Purge-evidence query library — the page-defined helpers of
// local_hubredirect/live_parent_trust_purge_evidence.php extracted VERBATIM
// (renamed pqlptpe_ -> pqlptpel_) for the token-gated portal endpoint. The
// legacy page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.
//
// NOT ported (deliberate): the page's pqlptpe_download_json / pqlptpe_download_csv
// helpers set HTTP file-download headers and exit — that transport cannot live in
// a JSON endpoint. Per the portal contract the handler returns the dataset and the
// Bunny page builds the JSON/CSV artifact client-side (byte layout mirrored in JS).

defined('MOODLE_INTERNAL') || die();

function pqlptpel_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlptpel_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlptpel_decode_details(string $json): array {
    $details = json_decode($json, true);
    return is_array($details) ? $details : [];
}

function pqlptpel_audit(string $action, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqlptpel_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'parent_trust_purge_evidence',
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}
