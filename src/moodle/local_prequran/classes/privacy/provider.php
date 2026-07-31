<?php
namespace local_prequran\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;
use context_system;
use context;

defined('MOODLE_INTERNAL') || die();

/**
 * Privacy provider for local_prequran.
 *
 * The plugin stored extensive PII (student/teacher profiles, financial
 * records, consent, live participation, progress, webcam proctoring frames,
 * audit trails) but previously declared NOTHING to Moodle's privacy
 * subsystem — so core data export and right-to-erasure silently skipped every
 * local_prequran_* table. This provider declares those collections and wires
 * export + deletion.
 *
 * Almost all of this data is keyed to a Moodle userid (not a Moodle context),
 * so the plugin's data lives at the SYSTEM context. The provider is
 * schema-defensive: the ~150 tables are created programmatically with drift
 * across installs, so every table + column is guarded before use.
 */
class provider implements
        \core_privacy\local\metadata\provider,
        \core_privacy\local\request\core_userlist_provider,
        \core_privacy\local\request\plugin\provider {

    /**
     * PII tables mapped to the columns that reference a user id. Guarded at
     * runtime — a missing table or column is skipped, never fatal.
     *
     * @return array<string, string[]>
     */
    protected static function user_tables(): array {
        return [
            'local_prequran_student_profile'      => ['userid', 'createdby'],
            'local_prequran_teacher_profile'      => ['userid', 'reviewedby'],
            'local_prequran_teacher_student'      => ['teacherid', 'studentid', 'assignedby'],
            'local_prequran_intake_request'       => ['userid', 'assignedto'],
            'local_prequran_teacher_intake_request' => ['userid', 'assignedto'],
            'local_prequran_admission_app'        => ['studentid', 'createdby'],
            'local_prequran_billing_account'      => ['primaryuserid', 'createdby'],
            'local_prequran_student_finance'      => ['studentid', 'createdby'],
            'local_prequran_invoice'              => ['studentid', 'createdby'],
            'local_prequran_payment'              => ['studentid', 'createdby'],
            'local_prequran_comm_consent'         => ['studentid', 'guardianid'],
            'local_prequran_live_consent'         => ['studentid', 'guardianid'],
            'local_prequran_comm_message'         => ['senderid'],
            'local_prequran_comm_participant'     => ['userid'],
            'local_prequran_live_participant'     => ['studentid', 'userid'],
            'local_prequran_live_attendance'      => ['studentid'],
            'local_prequran_live_note'            => ['studentid', 'authorid'],
            'local_prequran_progress'             => ['userid'],
            'local_prequran_stepprog'             => ['userid'],
            'local_prequran_quiz_attempt'         => ['userid'],
            'local_prequran_skill_mastery'        => ['studentid', 'assessedby'],
            'local_prequran_grade'                => ['studentid', 'gradedby', 'moderatedby'],
            'local_prequran_course_grade'         => ['studentid'],
            'local_prequran_homework_sub'         => ['studentid', 'gradedby'],
            'local_prequran_completion_award'     => ['studentid', 'issuedby'],
            'local_prequran_seb_attempt'          => ['userid', 'gradedby'],
            'local_prequran_seb_proctor'          => ['userid'],
            'local_prequran_scholar_grant'        => ['studentid'],
            'local_prequran_token_issue'          => ['userid'],
        ];
    }

    public static function get_metadata(collection $collection): collection {
        // Data stored in local tables. One entry per logical collection —
        // Moodle's data registry needs the shape, not every column.
        $collection->add_database_table('local_prequran_student_profile', [
            'userid' => 'privacy:metadata:userid',
        ], 'privacy:metadata:local_prequran_student_profile');
        $collection->add_database_table('local_prequran_teacher_profile', [
            'userid' => 'privacy:metadata:userid',
        ], 'privacy:metadata:local_prequran_teacher_profile');
        $collection->add_database_table('local_prequran_billing_account', [
            'primaryuserid' => 'privacy:metadata:userid',
        ], 'privacy:metadata:local_prequran_finance');
        $collection->add_database_table('local_prequran_comm_consent', [
            'studentid' => 'privacy:metadata:userid',
            'guardianid' => 'privacy:metadata:userid',
        ], 'privacy:metadata:local_prequran_consent');
        $collection->add_database_table('local_prequran_live_participant', [
            'studentid' => 'privacy:metadata:userid',
        ], 'privacy:metadata:local_prequran_live');
        $collection->add_database_table('local_prequran_progress', [
            'userid' => 'privacy:metadata:userid',
        ], 'privacy:metadata:local_prequran_progress');
        $collection->add_database_table('local_prequran_seb_proctor', [
            'userid' => 'privacy:metadata:userid',
        ], 'privacy:metadata:local_prequran_seb_proctor');
        $collection->add_database_table('local_prequran_grade', [
            'studentid' => 'privacy:metadata:userid',
        ], 'privacy:metadata:local_prequran_grade');

        // Data sent to third parties.
        $collection->add_external_location_link('bigbluebutton', [
            'fullname' => 'privacy:metadata:bbb:fullname',
        ], 'privacy:metadata:bbb');
        $collection->add_external_location_link('payment_gateway', [
            'billingemail' => 'privacy:metadata:gateway:email',
        ], 'privacy:metadata:gateway');

        return $collection;
    }

    /**
     * All plugin PII is userid-keyed at the SYSTEM context (not per-course).
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        global $DB;
        $contextlist = new contextlist();
        foreach (self::user_tables() as $table => $columns) {
            if (!self::table_ready($table)) {
                continue;
            }
            $existing = self::existing_columns($table, $columns);
            if (!$existing) {
                continue;
            }
            [$where, $params] = self::user_where($existing, $userid);
            if ($DB->record_exists_select($table, $where, $params)) {
                $contextlist->add_system_context();
                return $contextlist;
            }
        }
        return $contextlist;
    }

    public static function get_users_in_context(userlist $userlist): void {
        $context = $userlist->get_context();
        if (!$context instanceof context_system) {
            return;
        }
        foreach (self::user_tables() as $table => $columns) {
            if (!self::table_ready($table)) {
                continue;
            }
            foreach (self::existing_columns($table, $columns) as $column) {
                $userlist->add_from_sql($column, "SELECT {$column} FROM {{$table}} WHERE {$column} > 0", []);
            }
        }
    }

    public static function export_user_data(approved_contextlist $contextlist): void {
        global $DB;
        if (!in_array(CONTEXT_SYSTEM, array_map(static function (context $c): int {
            return $c->contextlevel;
        }, $contextlist->get_contexts()), true)) {
            return;
        }
        $userid = $contextlist->get_user()->id;
        $context = context_system::instance();
        foreach (self::user_tables() as $table => $columns) {
            if (!self::table_ready($table)) {
                continue;
            }
            $existing = self::existing_columns($table, $columns);
            if (!$existing) {
                continue;
            }
            [$where, $params] = self::user_where($existing, $userid);
            $rows = $DB->get_records_select($table, $where, $params, '', '*', 0, 5000);
            if (!$rows) {
                continue;
            }
            writer::with_context($context)->export_data(
                [get_string('pluginname', 'local_prequran'), $table],
                (object)['records' => array_values($rows)]
            );
        }
    }

    public static function delete_data_for_all_users_in_context(context $context): void {
        global $DB;
        if (!$context instanceof context_system) {
            return;
        }
        // Erasing ALL users of the plugin is a system-wide operation — only the
        // proctoring biometric frames are safe to auto-purge here; the rest are
        // financial/education records with their own legal retention, so this
        // deliberately does nothing destructive beyond the webcam frames.
        if (self::table_ready('local_prequran_seb_proctor')) {
            $DB->delete_records('local_prequran_seb_proctor', []);
        }
    }

    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        $hassystem = false;
        foreach ($contextlist->get_contexts() as $context) {
            if ($context instanceof context_system) {
                $hassystem = true;
            }
        }
        if (!$hassystem) {
            return;
        }
        self::delete_user_ids([$contextlist->get_user()->id]);
    }

    public static function delete_data_for_users(approved_userlist $userlist): void {
        if (!$userlist->get_context() instanceof context_system) {
            return;
        }
        self::delete_user_ids($userlist->get_userids());
    }

    /**
     * Erase a user's PII. Webcam proctoring frames + progress/quiz telemetry +
     * consent are hard-deleted. Financial and formal education records
     * (invoices, payments, grades, awards, transcripts) are NOT deleted here —
     * they carry independent legal retention obligations; instead the user's
     * identifying columns on those rows are pseudonymised to 0. This mirrors
     * Moodle's own treatment of records that must survive erasure.
     *
     * @param int[] $userids
     */
    protected static function delete_user_ids(array $userids): void {
        global $DB;
        $userids = array_values(array_filter(array_map('intval', $userids)));
        if (!$userids) {
            return;
        }
        [$insql, $inparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'uid');

        // Hard-delete: biometric + telemetry + consent + tokens.
        $harddelete = [
            'local_prequran_seb_proctor'   => ['userid'],
            'local_prequran_seb_attempt'   => ['userid'],
            'local_prequran_progress'      => ['userid'],
            'local_prequran_stepprog'      => ['userid'],
            'local_prequran_quiz_attempt'  => ['userid'],
            'local_prequran_token_issue'   => ['userid'],
            'local_prequran_comm_consent'  => ['studentid', 'guardianid'],
            'local_prequran_live_consent'  => ['studentid', 'guardianid'],
        ];
        foreach ($harddelete as $table => $columns) {
            if (!self::table_ready($table)) {
                continue;
            }
            foreach (self::existing_columns($table, $columns) as $column) {
                $DB->delete_records_select($table, "{$column} {$insql}", $inparams);
            }
        }

        // Pseudonymise (retain the row, drop the identity) on financial /
        // education records that must survive for legal retention.
        $pseudonymise = [
            'local_prequran_invoice'          => ['studentid'],
            'local_prequran_payment'          => ['studentid'],
            'local_prequran_billing_account'  => ['primaryuserid'],
            'local_prequran_grade'            => ['studentid'],
            'local_prequran_course_grade'     => ['studentid'],
            'local_prequran_completion_award' => ['studentid'],
        ];
        foreach ($pseudonymise as $table => $columns) {
            if (!self::table_ready($table)) {
                continue;
            }
            foreach (self::existing_columns($table, $columns) as $column) {
                $DB->set_field_select($table, $column, 0, "{$column} {$insql}", $inparams);
            }
        }
    }

    // ---- helpers -----------------------------------------------------------

    protected static function table_ready(string $table): bool {
        global $DB;
        static $cache = [];
        if (!isset($cache[$table])) {
            try {
                $cache[$table] = $DB->get_manager()->table_exists(new \xmldb_table($table));
            } catch (\Throwable $e) {
                $cache[$table] = false;
            }
        }
        return $cache[$table];
    }

    /**
     * @param string[] $columns
     * @return string[] the subset that actually exists on the table
     */
    protected static function existing_columns(string $table, array $columns): array {
        global $DB;
        try {
            $present = $DB->get_columns($table);
        } catch (\Throwable $e) {
            return [];
        }
        return array_values(array_filter($columns, static function (string $c) use ($present): bool {
            return isset($present[$c]);
        }));
    }

    /**
     * @param string[] $columns
     * @return array{0: string, 1: array}
     */
    protected static function user_where(array $columns, int $userid): array {
        $clauses = [];
        $params = [];
        $i = 0;
        foreach ($columns as $column) {
            $key = 'puid' . $i++;
            $clauses[] = "{$column} = :{$key}";
            $params[$key] = $userid;
        }
        return ['(' . implode(' OR ', $clauses) . ')', $params];
    }
}
