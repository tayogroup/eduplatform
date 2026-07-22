<?php
// Safe Internet (SafeNet) query library — the ONLY two functions the page
// local_hubredirect/safenet.php defines inline, extracted VERBATIM (renamed
// pqsn_ -> pqsnpl_ so nothing collides with the shared safenetlib.php pqsn_*
// helpers, which are NOT copied) for the token-gated portal endpoint. Every
// other pqsn_* the page uses lives in local_hubredirect/safenetlib.php and is
// required by the handler, not duplicated here. The legacy page keeps its own
// inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/safenetlib.php loaded first for stdClass shape.

defined('MOODLE_INTERNAL') || die();

function pqsnpl_load_device(int $deviceid): ?stdClass {
    global $DB;
    $device = $DB->get_record('local_prequran_safenet_dev', ['id' => $deviceid], '*', IGNORE_MISSING);
    return $device ?: null;
}

function pqsnpl_user_may_touch(stdClass $device, bool $isstaff, array $children): bool {
    global $USER;
    if ($isstaff) {
        return true;
    }
    return (int)$device->parentid === (int)$USER->id || isset($children[(int)$device->childid]);
}
