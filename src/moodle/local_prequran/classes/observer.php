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

        self::identity_audit('account_created', $userid, ['createdby' => (int)$event->userid]);
    }

    /** Failed logins land in the identity trail (with a flood cap). */
    public static function user_login_failed(\core\event\user_login_failed $event): void {
        global $DB;

        try {
            if (!$DB->get_manager()->table_exists(new \xmldb_table('local_prequran_course_audit'))) {
                return;
            }
            // Flood guard: under brute force, core logs keep the full record;
            // the identity trail caps itself instead of ballooning.
            $recent = (int)$DB->count_records_select('local_prequran_course_audit',
                "action = 'login_failed' AND timecreated > :cutoff", ['cutoff' => time() - HOURSECS]);
            if ($recent >= 300) {
                return;
            }
            $other = $event->other ?? [];
            self::identity_audit('login_failed', (int)($event->relateduserid ?? 0), [
                'username' => (string)($other['username'] ?? ''),
                'reason' => (string)($other['reason'] ?? ''),
                'ip' => (string)getremoteaddr(),
            ]);
        } catch (\Throwable $e) {
            // Identity auditing must never break authentication.
        }
    }

    public static function user_password_updated(\core\event\user_password_updated $event): void {
        self::identity_audit('password_updated', (int)$event->relateduserid, [
            'byuserid' => (int)$event->userid,
            'forgottenreset' => !empty(($event->other ?? [])['forgottenreset']),
        ]);
    }

    public static function role_assigned(\core\event\role_assigned $event): void {
        self::role_change_audit('core_role_assigned', $event);
    }

    public static function role_unassigned(\core\event\role_unassigned $event): void {
        self::role_change_audit('core_role_unassigned', $event);
    }

    private static function role_change_audit(string $action, \core\event\base $event): void {
        global $DB;

        try {
            $roleid = (int)$event->objectid;
            $shortname = (string)$DB->get_field('role', 'shortname', ['id' => $roleid]);
            // The plugin's own nightly parent-observer sync would flood the
            // trail with its ehel_parent churn — it audits itself already.
            if ((string)(($event->other ?? [])['component'] ?? '') === 'local_prequran') {
                return;
            }
            self::identity_audit($action, (int)$event->relateduserid, [
                'role' => $shortname !== '' ? $shortname : ('roleid ' . $roleid),
                'contextid' => (int)$event->contextid,
                'byuserid' => (int)$event->userid,
            ]);
        } catch (\Throwable $e) {
            // Best-effort.
        }
    }

    /** Guarded insert into the shared course_audit identity trail. */
    private static function identity_audit(string $action, int $targetuserid, array $details): void {
        global $DB;

        try {
            if (!$DB->get_manager()->table_exists(new \xmldb_table('local_prequran_course_audit'))) {
                return;
            }
            $DB->insert_record('local_prequran_course_audit', (object)[
                'consumerid' => 0, 'workspaceid' => 0, 'offeringid' => 0, 'requestid' => 0,
                'studentid' => 0, 'actorid' => (int)($details['byuserid'] ?? 0),
                'action' => $action, 'targettype' => 'user', 'targetid' => $targetuserid,
                'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
                'timecreated' => time(),
            ]);
        } catch (\Throwable $e) {
            // The audit trail must never break the triggering operation.
        }
    }
}
