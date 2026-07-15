<?php
declare(strict_types=1);

namespace local_prequran;

defined('MOODLE_INTERNAL') || die();

class observer {
    public static function user_created(\core\event\user_created $event): void {
        global $CFG, $DB;

        $userid = (int)$event->objectid;
        if ($userid <= 0) {
            return;
        }

        try {
            $user = $DB->get_record('user', [
                'id' => $userid,
                'deleted' => 0,
                'mnethostid' => $CFG->mnet_localhost_id,
            ], 'id,idnumber', IGNORE_MISSING);
            if (!$user || preg_match('/^[0-9]{5}$/', trim((string)($user->idnumber ?? '')))) {
                return;
            }

            $accountids = (string)$CFG->dirroot . '/local/hubredirect/account_ids.php';
            if (is_readable($accountids)) {
                require_once($accountids);
            }

            if (function_exists('pqh_assign_account_id')) {
                pqh_assign_account_id($userid, 'user');
                return;
            }

            for ($attempt = 0; $attempt < 120; $attempt++) {
                $idnumber = (string)random_int(10000, 99999);
                if (!$DB->record_exists('user', ['idnumber' => $idnumber])) {
                    $DB->set_field('user', 'idnumber', $idnumber, ['id' => $userid]);
                    return;
                }
            }
        } catch (\Throwable $e) {
            debugging('local_prequran could not assign a random 5-digit user ID number: ' . $e->getMessage(), DEBUG_DEVELOPER);
        }
    }
}
