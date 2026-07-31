<?php
// Enrolment reconcile — closes the two lifecycle gaps left by the lazy
// enrolment model (best-practice hardening, modelled on how Canvas treats
// enrollments as first-class synced data rather than one-way side effects):
//
// 1) TEACHER RECONCILE. Teacher→course enrolment normally happens only as a
//    side effect of a student sync (course_offerings save/sync), and nothing
//    ever REMOVES a teacher whose teacher↔student assignment was taken away.
//    This task recomputes, for every offering-linked Moodle course, the
//    EXPECTED teacher set (union, over the course's active students, of their
//    assigned teachers: teacher_student rows, class groups, solo-teacher
//    workspace staff — the same three sources pqco_teacher_ids_for_student
//    uses) and diffs it against the ACTUAL 'teacher'-role enrolments.
//    Missing teachers are enrolled; stale manual-enrolled teachers are
//    unenrolled (enforce mode only, with guards: never site admins, never
//    users holding any other role in the course, never non-manual enrolments).
//    Catalog courses (ehel-*) are OUT of scope — only courses referenced by
//    local_prequran_course_offering.moodlecourseid are touched.
//
// 2) PARENT OBSERVERS. Mirrors the Canvas "observer" pattern with native
//    Moodle machinery: ensures the ehel_parent role (seeded by upgradelib) is
//    assigned in the STUDENT's user context for every distinct
//    guardian↔student pair recorded in the consent tables (comm_consent +
//    live_consent — the same source the portal already treats as
//    authoritative, see pqmrl_parent_children / pqmrl_role). Assignments are
//    component-tagged 'local_prequran' so the task only ever removes its own;
//    stale ones are removed when the pair disappears (enforce mode only).
//
// INERT until configured: each phase runs only when its mode setting is set —
// local_prequran/teacher_reconcile_mode and local_prequran/parent_observer_mode,
// each '' (off, default) | 'report' (log what would change, change nothing)
// | 'enforce' (apply changes). Start with 'report' and read the task log.

namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

class enrolment_reconcile extends \core\task\scheduled_task {

    public function get_name(): string {
        return get_string('task_enrolment_reconcile', 'local_prequran');
    }

    public function execute(): void {
        $teachermode = trim((string)get_config('local_prequran', 'teacher_reconcile_mode'));
        $parentmode = trim((string)get_config('local_prequran', 'parent_observer_mode'));
        $holdmode = trim((string)get_config('local_prequran', 'finance_hold_suspend_mode'));
        $concludemode = trim((string)get_config('local_prequran', 'enrol_conclude_mode'));
        $vettingmode = trim((string)get_config('local_prequran', 'teacher_vetting_mode'));

        $earlyadminmode = trim((string)get_config('local_prequran', 'admin_review_mode'));
        $earlyidentitymode = trim((string)get_config('local_prequran', 'identity_offboard_mode'));
        if ($teachermode === '' && $parentmode === '' && $holdmode === '' && $concludemode === ''
                && $vettingmode === '' && $earlyadminmode === '' && $earlyidentitymode === '') {
            mtrace('Enrolment reconcile skipped: all mode settings are off.');
            return;
        }
        if ($teachermode !== '') {
            $this->reconcile_teachers($teachermode === 'enforce');
        }
        if ($parentmode !== '') {
            $this->reconcile_parent_observers($parentmode === 'enforce');
        }
        if ($holdmode !== '') {
            $this->reconcile_finance_holds($holdmode === 'enforce');
        }
        if ($concludemode !== '') {
            $this->conclude_ended_enrolments($concludemode === 'enforce');
        }
        if ($vettingmode !== '') {
            $this->reconcile_teacher_vetting($vettingmode === 'enforce');
        }
        $adminmode = trim((string)get_config('local_prequran', 'admin_review_mode'));
        if ($adminmode !== '') {
            $this->review_admin_access($adminmode === 'enforce');
        }
        $identitymode = trim((string)get_config('local_prequran', 'identity_offboard_mode'));
        if ($identitymode !== '') {
            $this->reconcile_dead_account_memberships($identitymode === 'enforce');
        }
        // Task-health stamp: admins can see the last successful run without
        // digging through cron logs (config_plugins: lastrun_enrolment_reconcile).
        set_config('lastrun_enrolment_reconcile', time(), 'local_prequran');
    }

    // ---- phase 7: identity hygiene ----------------------------------------

    /**
     * Suspended/deleted Moodle accounts must not keep ACTIVE workspace
     * memberships (any role — review_admin_access only flags manager rows,
     * and never acts). Report lists them; enforce deactivates the membership
     * rows (safe: the account cannot log in anyway) with an audit trail.
     * Also prunes portal-token registry rows expired more than 7 days ago.
     */
    private function reconcile_dead_account_memberships(bool $enforce): void {
        global $DB;

        if (!$DB->get_manager()->table_exists(new \xmldb_table('local_prequran_workspace_member'))) {
            return;
        }
        $rows = $DB->get_records_sql(
            "SELECT wm.id, wm.workspaceid, wm.userid, wm.workspace_role,
                    u.suspended, u.deleted
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid
              WHERE wm.status = 'active'
                AND (u.suspended = 1 OR u.deleted = 1)",
            [], 0, 500
        );
        $count = 0;
        foreach ($rows as $row) {
            $why = (int)$row->deleted === 1 ? 'deleted' : 'suspended';
            if (!$enforce) {
                mtrace("  [report] dead-account membership: user {$row->userid} ({$why}) still {$row->workspace_role} in workspace {$row->workspaceid}");
                continue;
            }
            $DB->update_record('local_prequran_workspace_member', (object)[
                'id' => (int)$row->id, 'status' => 'inactive', 'timemodified' => time(),
            ]);
            try {
                $DB->insert_record('local_prequran_course_audit', (object)[
                    'consumerid' => 0, 'workspaceid' => (int)$row->workspaceid, 'offeringid' => 0,
                    'requestid' => 0, 'studentid' => 0, 'actorid' => 0,
                    'action' => 'membership_deactivated_dead_account',
                    'targettype' => 'user', 'targetid' => (int)$row->userid,
                    'details' => json_encode(['role' => (string)$row->workspace_role, 'account' => $why], JSON_UNESCAPED_SLASHES),
                    'timecreated' => time(),
                ]);
            } catch (\Throwable $e) {
                // Audit best-effort.
            }
            $count++;
        }
        mtrace('  dead-account memberships ' . ($enforce ? 'deactivated: ' : 'found: ') . ($enforce ? $count : count($rows)));

        if ($DB->get_manager()->table_exists(new \xmldb_table('local_prequran_token_issue'))) {
            $DB->delete_records_select('local_prequran_token_issue',
                'expiresat < :cutoff', ['cutoff' => time() - (7 * DAYSECS)]);
        }
    }

    // ---- phase 6: privileged-access review + task health ------------------

    /**
     * Access-governance review (the recertification pass that never existed):
     * (a) users holding SITE-level power (siteadmin / school_principal) with
     * NO active workspace membership — the classic offboarded-but-still-
     * privileged case, since workspace offboarding cannot touch core roles;
     * (b) suspended/deleted accounts still holding active workspace
     * owner/admin rows; (c) scheduled tasks in fail-delay (task health).
     * Report logs; enforce also writes admin_access_flagged audit rows
     * (deduped 7 days). This phase never revokes anything itself — core-role
     * removal stays a deliberate human action in Moodle admin.
     */
    private function review_admin_access(bool $enforce): void {
        global $DB;

        $mode = $enforce ? 'enforce' : 'report';
        $now = time();
        $flagged = 0;

        $hasactivemembership = function (int $userid) use ($DB): bool {
            if (!$this->table_exists('local_prequran_workspace_member')) {
                return true; // No membership data — nothing to conclude.
            }
            return $DB->record_exists('local_prequran_workspace_member',
                ['userid' => $userid, 'status' => 'active']);
        };
        $flag = function (int $userid, string $why) use (&$flagged, $enforce, $mode, $now, $DB): void {
            mtrace("  [{$mode}] PRIVILEGED-ACCESS flag user {$userid}: {$why}");
            if (!$enforce || !$this->table_exists('local_prequran_course_audit')) {
                return;
            }
            $recent = $DB->record_exists_select('local_prequran_course_audit',
                "action = 'admin_access_flagged' AND targetid = :uid AND timecreated > :since",
                ['uid' => $userid, 'since' => $now - (7 * DAYSECS)]);
            if (!$recent) {
                $this->audit('admin_access_flagged', 0, $userid, null);
                $flagged++;
            }
        };

        // (a) Site-level power without active workspace membership.
        foreach (get_admins() as $admin) {
            if (!$hasactivemembership((int)$admin->id)) {
                $flag((int)$admin->id, 'Moodle SITEADMIN with no active workspace membership');
            }
        }
        $principalrole = $DB->get_record('role', ['shortname' => 'school_principal'], 'id');
        if ($principalrole) {
            $holders = $DB->get_records_sql(
                "SELECT DISTINCT ra.userid
                   FROM {role_assignments} ra
                   JOIN {user} u ON u.id = ra.userid AND u.deleted = 0
                  WHERE ra.roleid = :rid", ['rid' => (int)$principalrole->id]);
            foreach ($holders as $h) {
                $u = $DB->get_record('user', ['id' => (int)$h->userid], 'id,suspended', IGNORE_MISSING);
                if ($u && !empty($u->suspended)) {
                    $flag((int)$h->userid, 'SUSPENDED account still holds school_principal');
                } else if (!$hasactivemembership((int)$h->userid)) {
                    $flag((int)$h->userid, 'school_principal with no active workspace membership');
                }
            }
        }

        // (b) Suspended/deleted users still holding active manager rows.
        if ($this->table_exists('local_prequran_workspace_member')) {
            $stale = $DB->get_records_sql(
                "SELECT DISTINCT wm.userid
                   FROM {local_prequran_workspace_member} wm
                   JOIN {user} u ON u.id = wm.userid
                  WHERE wm.status = 'active' AND wm.workspace_role IN ('platform_admin', 'owner', 'admin')
                    AND (u.deleted = 1 OR u.suspended = 1)");
            foreach ($stale as $s) {
                $flag((int)$s->userid, 'suspended/deleted account still holds an ACTIVE workspace manager role');
            }
        }

        // (c) Task health: anything Moodle has put in fail-delay.
        $failing = $DB->get_records_select('task_scheduled', 'faildelay > 0', [], '', 'id,classname,faildelay,lastruntime');
        foreach ($failing as $t) {
            mtrace("  [info] TASK FAILING: {$t->classname} (faildelay {$t->faildelay}s, last run " . ($t->lastruntime ? userdate((int)$t->lastruntime) : 'never') . ')');
        }

        mtrace('Admin access review (' . $mode . '): ' . ($enforce ? "{$flagged} newly flagged, " : '') . count($failing) . ' failing task(s).');
    }

    // ---- phase 5: teacher vetting staleness (periodic re-vetting cadence) --

    /**
     * Safeguarding best practice: an approval is not forever. Approved teacher
     * vettings older than teacher_vetting_expiry_days are flipped back to
     * 'needs_update' (enforce) so they resurface in the review queue; report
     * mode only logs. Also reports (never acts on) teachers whose marketplace
     * profile is PUBLISHED while their vetting is not approved — the publish
     * gate checks vetting once, at publish time, and nothing rechecks it.
     */
    private function reconcile_teacher_vetting(bool $enforce): void {
        global $DB;

        if (!$this->table_exists('local_prequran_teacher_profile')) {
            mtrace('Teacher vetting reconcile skipped: teacher profile table missing.');
            return;
        }
        $mode = $enforce ? 'enforce' : 'report';
        $days = (int)get_config('local_prequran', 'teacher_vetting_expiry_days');
        if ($days <= 0) {
            $days = 365;
        }
        $cutoff = time() - ($days * DAYSECS);

        $stale = $DB->get_records_select('local_prequran_teacher_profile',
            "vetting_status = 'approved' AND vetting_reviewedat > 0 AND vetting_reviewedat < :cutoff",
            ['cutoff' => $cutoff], '', 'id,userid,vetting_reviewedat');
        $expired = 0;
        foreach ($stale as $profile) {
            if ($enforce) {
                $DB->update_record('local_prequran_teacher_profile', (object)[
                    'id' => (int)$profile->id,
                    'vetting_status' => 'needs_update',
                    'timemodified' => time(),
                ]);
                $this->audit('teacher_vetting_expired', 0, (int)$profile->userid, null);
                $expired++;
                mtrace("  [{$mode}] vetting expired for teacher {$profile->userid} (approved " . userdate((int)$profile->vetting_reviewedat) . ') -> needs_update');
            } else {
                mtrace("  [{$mode}] WOULD expire vetting for teacher {$profile->userid} (approved " . userdate((int)$profile->vetting_reviewedat) . ')');
            }
        }

        // Report-only: published marketplace profiles whose vetting lapsed.
        $lapsed = $DB->get_records_select('local_prequran_teacher_profile',
            "marketplace_status = 'published' AND vetting_status <> 'approved'",
            [], '', 'id,userid,vetting_status');
        foreach ($lapsed as $profile) {
            mtrace("  [info] teacher {$profile->userid} is PUBLISHED on the marketplace with vetting '{$profile->vetting_status}' - review the listing.");
        }

        // Certificate expiry sweep: verified certs past their expiry date flip
        // to 'expired' (enforce); certs expiring within 30 days are reported so
        // renewal starts before the lapse.
        $certsexpired = 0; $certsexpiring = 0;
        if ($this->table_exists('local_prequran_teacher_cert')) {
            $nowts = time();
            $rows = $DB->get_records_select('local_prequran_teacher_cert',
                "status = 'verified' AND expiresat > 0 AND expiresat < :now",
                ['now' => $nowts], '', 'id,teacherid,cert_type,title,expiresat');
            foreach ($rows as $cert) {
                if ($enforce) {
                    $DB->update_record('local_prequran_teacher_cert', (object)[
                        'id' => (int)$cert->id, 'status' => 'expired', 'timemodified' => $nowts,
                    ]);
                    $this->audit('teacher_cert_expired', 0, (int)$cert->teacherid, null);
                    $certsexpired++;
                    mtrace("  [{$mode}] certificate EXPIRED: teacher {$cert->teacherid}, {$cert->cert_type} '{$cert->title}' (expired " . userdate((int)$cert->expiresat) . ')');
                } else {
                    mtrace("  [{$mode}] WOULD expire certificate: teacher {$cert->teacherid}, {$cert->cert_type} '{$cert->title}'");
                }
            }
            $soon = $DB->get_records_select('local_prequran_teacher_cert',
                "status = 'verified' AND expiresat > :now AND expiresat < :soon",
                ['now' => $nowts, 'soon' => $nowts + (30 * DAYSECS)], 'expiresat ASC', 'id,teacherid,cert_type,title,expiresat');
            foreach ($soon as $cert) {
                $certsexpiring++;
                mtrace("  [info] certificate expiring soon: teacher {$cert->teacherid}, {$cert->cert_type} '{$cert->title}' (" . userdate((int)$cert->expiresat) . ')');
            }
        }

        mtrace('Teacher vetting reconcile (' . $mode . '): ' . count($stale) . " stale approval(s)" . ($enforce ? ", {$expired} expired" : '') . ', ' . count($lapsed) . ' published-but-unvetted, ' . ($enforce ? $certsexpired . ' cert(s) expired, ' : '') . $certsexpiring . ' cert(s) expiring within 30d, window ' . $days . 'd.');
    }

    // ---- phase 1: teacher enrolment reconcile -----------------------------

    private function reconcile_teachers(bool $enforce): void {
        global $CFG, $DB;
        require_once($CFG->libdir . '/enrollib.php');

        if (!$this->table_exists('local_prequran_course_offering')) {
            mtrace('Teacher reconcile skipped: course offering table does not exist.');
            return;
        }
        $teacherrole = $DB->get_record('role', ['shortname' => 'teacher']);
        $studentrole = $DB->get_record('role', ['shortname' => 'student']);
        if (!$teacherrole || !$studentrole) {
            mtrace('Teacher reconcile failed: teacher/student roles missing on this site.');
            return;
        }

        // Offering-linked courses only; remember every workspace that offers each course.
        $offerings = $DB->get_records_select('local_prequran_course_offering',
            'moodlecourseid > 0', [], '', 'id,moodlecourseid,workspaceid');
        $courseworkspaces = [];
        foreach ($offerings as $o) {
            $courseworkspaces[(int)$o->moodlecourseid][(int)$o->workspaceid] = true;
        }
        if (!$courseworkspaces) {
            mtrace('Teacher reconcile: no offering-linked courses.');
            return;
        }

        $mode = $enforce ? 'enforce' : 'report';
        $enrolled = 0; $unenrolled = 0; $wouldenrol = 0; $wouldunenrol = 0;

        foreach ($courseworkspaces as $courseid => $workspaceids) {
            if (!$DB->record_exists('course', ['id' => $courseid])) {
                continue;
            }
            $ctx = \context_course::instance($courseid, IGNORE_MISSING);
            if (!$ctx) {
                continue;
            }

            // Expected teachers = union over the course's student-role holders.
            $expected = [];
            $students = $DB->get_records('role_assignments',
                ['roleid' => (int)$studentrole->id, 'contextid' => $ctx->id], '', 'id,userid');
            foreach ($students as $s) {
                foreach (array_keys($workspaceids) as $wsid) {
                    foreach ($this->teacher_ids_for_student((int)$s->userid, $wsid) as $tid) {
                        $expected[$tid] = true;
                    }
                }
            }

            // Actual teacher-role holders in this course.
            $actual = [];
            $ras = $DB->get_records('role_assignments',
                ['roleid' => (int)$teacherrole->id, 'contextid' => $ctx->id], '', 'id,userid');
            foreach ($ras as $ra) {
                $actual[(int)$ra->userid] = true;
            }

            // Missing → enrol.
            foreach (array_keys($expected) as $tid) {
                if (isset($actual[$tid])) {
                    continue;
                }
                if ($enforce && $this->manual_enrol($courseid, $tid, (int)$teacherrole->id)) {
                    $enrolled++;
                    mtrace("  [{$mode}] enrolled teacher {$tid} into course {$courseid}");
                } else if (!$enforce) {
                    $wouldenrol++;
                    mtrace("  [{$mode}] WOULD enrol teacher {$tid} into course {$courseid}");
                }
            }

            // Stale → unenrol (guarded).
            foreach (array_keys($actual) as $tid) {
                if (isset($expected[$tid]) || is_siteadmin($tid)) {
                    continue;
                }
                // Skip anyone holding any OTHER role in this course (manager,
                // editingteacher, student, custom) — they are not ours to prune.
                $otherroles = $DB->count_records_select('role_assignments',
                    'contextid = :ctx AND userid = :uid AND roleid <> :rid',
                    ['ctx' => $ctx->id, 'uid' => $tid, 'rid' => (int)$teacherrole->id]);
                if ($otherroles > 0) {
                    continue;
                }
                if ($enforce && $this->manual_unenrol($courseid, $tid)) {
                    $unenrolled++;
                    mtrace("  [{$mode}] unenrolled stale teacher {$tid} from course {$courseid}");
                } else if (!$enforce) {
                    $wouldunenrol++;
                    mtrace("  [{$mode}] WOULD unenrol stale teacher {$tid} from course {$courseid}");
                }
            }
        }

        $summary = $enforce
            ? "enrolled={$enrolled}, unenrolled={$unenrolled}"
            : "would-enrol={$wouldenrol}, would-unenrol={$wouldunenrol}";
        mtrace('Teacher reconcile (' . $mode . '): ' . count($courseworkspaces) . " offering courses checked, {$summary}.");
    }

    /**
     * The student's assigned teachers, from the same three sources
     * pqco_teacher_ids_for_student uses (replicated here so the task stays
     * self-contained like catalog_sync/cohort_sync — no cross-plugin include).
     */
    private function teacher_ids_for_student(int $studentid, int $workspaceid): array {
        global $DB;
        $ids = [];

        if ($this->table_exists('local_prequran_teacher_student')) {
            $rows = $DB->get_records('local_prequran_teacher_student',
                ['studentid' => $studentid, 'status' => 'active'], '', 'id,teacherid');
            foreach ($rows as $r) {
                if ((int)$r->teacherid > 0 && (int)$r->teacherid !== $studentid) {
                    $ids[(int)$r->teacherid] = (int)$r->teacherid;
                }
            }
        }

        if ($this->table_exists('local_prequran_group_member') && $this->table_exists('local_prequran_class_group')) {
            $rows = $DB->get_records_sql(
                "SELECT DISTINCT cg.teacherid
                   FROM {local_prequran_group_member} gm
                   JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
                  WHERE gm.studentid = :studentid
                    AND gm.assignment_status = 'active'
                    AND cg.status <> 'archived'",
                ['studentid' => $studentid]
            );
            foreach ($rows as $r) {
                if ((int)$r->teacherid > 0 && (int)$r->teacherid !== $studentid) {
                    $ids[(int)$r->teacherid] = (int)$r->teacherid;
                }
            }
        }

        if ($workspaceid > 0
                && $this->table_exists('local_prequran_workspace')
                && $this->table_exists('local_prequran_workspace_member')) {
            $rows = $DB->get_records_sql(
                "SELECT wm.userid
                   FROM {local_prequran_workspace_member} wm
                   JOIN {local_prequran_workspace} w ON w.id = wm.workspaceid
                  WHERE wm.workspaceid = :workspaceid
                    AND wm.status = 'active'
                    AND wm.workspace_role IN ('owner', 'teacher', 'assistant_teacher')
                    AND w.workspace_type = 'solo_teacher'
                    AND w.status <> 'archived'",
                ['workspaceid' => $workspaceid]
            );
            foreach ($rows as $r) {
                if ((int)$r->userid > 0 && (int)$r->userid !== $studentid) {
                    $ids[(int)$r->userid] = (int)$r->userid;
                }
            }
        }

        return array_keys($ids);
    }

    private function manual_enrol(int $courseid, int $userid, int $roleid): bool {
        global $DB;
        $manual = enrol_get_plugin('manual');
        if (!$manual || !$DB->record_exists('user', ['id' => $userid, 'deleted' => 0])) {
            return false;
        }
        foreach (enrol_get_instances($courseid, true) as $instance) {
            if ((string)$instance->enrol === 'manual' && (int)$instance->status === ENROL_INSTANCE_ENABLED) {
                $manual->enrol_user($instance, $userid, $roleid, time(), 0, ENROL_USER_ACTIVE);
                return true;
            }
        }
        return false;
    }

    private function manual_unenrol(int $courseid, int $userid): bool {
        global $DB;
        $manual = enrol_get_plugin('manual');
        if (!$manual) {
            return false;
        }
        // Only remove a MANUAL enrolment; cohort/self enrolments are untouched.
        foreach (enrol_get_instances($courseid, true) as $instance) {
            if ((string)$instance->enrol !== 'manual') {
                continue;
            }
            if ($DB->record_exists('user_enrolments', ['enrolid' => $instance->id, 'userid' => $userid])) {
                $manual->unenrol_user($instance, $userid);
                return true;
            }
        }
        return false;
    }

    // ---- phase 2: parent observer role in the student's user context ------

    private function reconcile_parent_observers(bool $enforce): void {
        global $DB;

        $role = $DB->get_record('role', ['shortname' => 'ehel_parent']);
        if (!$role) {
            mtrace('Parent observer reconcile skipped: ehel_parent role missing (run the plugin upgrade).');
            return;
        }
        $roleid = (int)$role->id;
        $mode = $enforce ? 'enforce' : 'report';

        // Expected pairs: every distinct guardian↔student with LIVE consent.
        // Revoked links (unlink action: consented=0 / granted=0) are excluded,
        // so withdrawal also removes the observer role on the next run.
        $expected = []; // "guardianid:studentid" => [guardianid, studentid]
        $consentselects = [
            'local_prequran_comm_consent' => 'guardianid > 0 AND studentid > 0 AND consented = 1',
            'local_prequran_live_consent' => 'guardianid > 0 AND studentid > 0 AND granted = 1',
        ];
        foreach ($consentselects as $table => $select) {
            if (!$this->table_exists($table)) {
                continue;
            }
            $rows = $DB->get_records_select($table, $select, [], '', 'id,guardianid,studentid');
            foreach ($rows as $r) {
                $expected[(int)$r->guardianid . ':' . (int)$r->studentid] = [(int)$r->guardianid, (int)$r->studentid];
            }
        }

        $assigned = 0; $unassigned = 0; $would = 0;

        foreach ($expected as $pair) {
            [$guardianid, $studentid] = $pair;
            if (!$DB->record_exists('user', ['id' => $guardianid, 'deleted' => 0])
                    || !$DB->record_exists('user', ['id' => $studentid, 'deleted' => 0])) {
                continue;
            }
            $ctx = \context_user::instance($studentid, IGNORE_MISSING);
            if (!$ctx) {
                continue;
            }
            if ($DB->record_exists('role_assignments', ['roleid' => $roleid, 'contextid' => $ctx->id, 'userid' => $guardianid])) {
                continue;
            }
            if ($enforce) {
                role_assign($roleid, $guardianid, $ctx->id, 'local_prequran', 0);
                $assigned++;
                mtrace("  [{$mode}] assigned parent observer {$guardianid} on student {$studentid}");
            } else {
                $would++;
                mtrace("  [{$mode}] WOULD assign parent observer {$guardianid} on student {$studentid}");
            }
        }

        // Stale: only assignments THIS component made, whose pair no longer exists.
        $ours = $DB->get_records('role_assignments', ['roleid' => $roleid, 'component' => 'local_prequran'], '', 'id,userid,contextid');
        foreach ($ours as $ra) {
            $ctx = $DB->get_record('context', ['id' => $ra->contextid, 'contextlevel' => CONTEXT_USER], 'id,instanceid');
            if (!$ctx) {
                continue;
            }
            $key = (int)$ra->userid . ':' . (int)$ctx->instanceid;
            if (isset($expected[$key])) {
                continue;
            }
            if ($enforce) {
                role_unassign($roleid, (int)$ra->userid, (int)$ra->contextid, 'local_prequran', 0);
                $unassigned++;
                mtrace("  [{$mode}] removed stale parent observer {$ra->userid} on student {$ctx->instanceid}");
            } else {
                mtrace("  [{$mode}] WOULD remove stale parent observer {$ra->userid} on student {$ctx->instanceid}");
            }
        }

        // Lingering parent memberships: an active workspace_member 'parent' row
        // whose user has ZERO live consent pairs keeps portal access with no
        // linked child (unlink/withdrawal never touched it). Deactivate in
        // enforce; the row reactivates automatically on re-link via intake.
        $lingering = 0;
        if ($this->table_exists('local_prequran_workspace_member')) {
            $guardianswithpairs = [];
            foreach ($expected as $pair) {
                $guardianswithpairs[(int)$pair[0]] = true;
            }
            $parentmembers = $DB->get_records('local_prequran_workspace_member',
                ['workspace_role' => 'parent', 'status' => 'active'], '', 'id,userid,workspaceid');
            foreach ($parentmembers as $pm) {
                if (isset($guardianswithpairs[(int)$pm->userid])) {
                    continue;
                }
                // Comm-thread parenthood also counts as linkage (parent-billing
                // and workspace-parent resolve children from threads too).
                if ($this->table_exists('local_prequran_comm_thread')
                        && $this->table_exists('local_prequran_comm_participant')
                        && $DB->record_exists_sql(
                            "SELECT 1
                               FROM {local_prequran_comm_thread} t
                               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
                              WHERE p.userid = :uid AND p.role = 'parent' AND t.studentid > 0",
                            ['uid' => (int)$pm->userid])) {
                    continue;
                }
                if ($enforce) {
                    $DB->update_record('local_prequran_workspace_member', (object)[
                        'id' => (int)$pm->id, 'status' => 'inactive', 'timemodified' => time(),
                    ]);
                    $lingering++;
                    mtrace("  [{$mode}] deactivated lingering parent membership: user {$pm->userid} in workspace {$pm->workspaceid} (no linked children)");
                } else {
                    mtrace("  [{$mode}] WOULD deactivate lingering parent membership: user {$pm->userid} in workspace {$pm->workspaceid} (no linked children)");
                }
            }
        }

        $summary = $enforce ? "assigned={$assigned}, removed={$unassigned}, lingering-deactivated={$lingering}" : "would-assign={$would}";
        mtrace('Parent observer reconcile (' . $mode . '): ' . count($expected) . " consent pairs, {$summary}.");
    }

    // ---- phase 3: finance-hold suspension (Canvas "inactive" for unpaid) --

    /**
     * Suspend (never unenrol) the Moodle enrolments of students carrying an
     * ACTIVE finance hold whose policyaction is in the configured set
     * (finance_hold_suspend_policyactions, CSV). Restores ONLY suspensions this
     * task itself applied (tracked via course_audit rows), so an admin's manual
     * suspension is never overridden. Grades survive; roster row stays.
     */
    private function reconcile_finance_holds(bool $enforce): void {
        global $DB;

        if (!$this->table_exists('local_prequran_finance_hold')
                || !$this->table_exists('local_prequran_course_enrol_req')
                || !$this->table_exists('local_prequran_course_offering')) {
            mtrace('Finance-hold suspension skipped: required tables missing.');
            return;
        }
        $actions = array_filter(array_map('trim', explode(',',
            (string)get_config('local_prequran', 'finance_hold_suspend_policyactions') ?: 'suspend_access')));
        if (!$actions) {
            mtrace('Finance-hold suspension skipped: no policy actions configured.');
            return;
        }
        $mode = $enforce ? 'enforce' : 'report';

        [$insql, $inparams] = $DB->get_in_or_equal($actions, SQL_PARAMS_NAMED, 'pa');
        $held = $DB->get_records_select('local_prequran_finance_hold',
            "status = 'active' AND studentid > 0 AND policyaction {$insql}", $inparams, '', 'id,studentid');
        $heldstudents = [];
        foreach ($held as $h) {
            $heldstudents[(int)$h->studentid] = true;
        }

        $suspended = 0; $restored = 0; $would = 0;

        // Suspend: every enrolled request of a held student.
        foreach (array_keys($heldstudents) as $studentid) {
            $rows = $DB->get_records_sql(
                "SELECT r.id, r.offeringid, r.workspaceid, r.consumerid, o.moodlecourseid
                   FROM {local_prequran_course_enrol_req} r
                   JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
                  WHERE r.studentid = :studentid AND r.status = 'enrolled' AND o.moodlecourseid > 0",
                ['studentid' => $studentid]
            );
            foreach ($rows as $r) {
                $courseid = (int)$r->moodlecourseid;
                if ($enforce) {
                    if ($this->set_manual_enrol_status($studentid, $courseid, ENROL_USER_SUSPENDED)) {
                        $suspended++;
                        $this->audit('finance_hold_suspend_applied', $studentid, $courseid, $r);
                        mtrace("  [{$mode}] suspended student {$studentid} in course {$courseid} (active finance hold)");
                    }
                } else if ($this->enrol_status($studentid, $courseid) === ENROL_USER_ACTIVE) {
                    $would++;
                    mtrace("  [{$mode}] WOULD suspend student {$studentid} in course {$courseid} (active finance hold)");
                }
            }
        }

        // Restore: only pairs WE suspended (audit applied newer than released) whose hold cleared.
        if ($this->table_exists('local_prequran_course_audit')) {
            $applied = $DB->get_records_sql(
                "SELECT studentid, targetid AS courseid,
                        MAX(CASE WHEN action = 'finance_hold_suspend_applied' THEN timecreated ELSE 0 END) AS appliedat,
                        MAX(CASE WHEN action = 'finance_hold_suspend_released' THEN timecreated ELSE 0 END) AS releasedat
                   FROM {local_prequran_course_audit}
                  WHERE action IN ('finance_hold_suspend_applied', 'finance_hold_suspend_released')
               GROUP BY studentid, targetid"
            );
            foreach ($applied as $a) {
                $studentid = (int)$a->studentid;
                $courseid = (int)$a->courseid;
                if ((int)$a->appliedat <= (int)$a->releasedat || isset($heldstudents[$studentid])) {
                    continue; // Already released, or still held.
                }
                if ($this->enrol_status($studentid, $courseid) !== ENROL_USER_SUSPENDED) {
                    continue;
                }
                if ($enforce) {
                    if ($this->set_manual_enrol_status($studentid, $courseid, ENROL_USER_ACTIVE)) {
                        $restored++;
                        $this->audit('finance_hold_suspend_released', $studentid, $courseid, null);
                        mtrace("  [{$mode}] restored student {$studentid} in course {$courseid} (hold cleared)");
                    }
                } else {
                    $would++;
                    mtrace("  [{$mode}] WOULD restore student {$studentid} in course {$courseid} (hold cleared)");
                }
            }
        }

        $summary = $enforce ? "suspended={$suspended}, restored={$restored}" : "would-change={$would}";
        mtrace('Finance-hold suspension (' . $mode . '): ' . count($heldstudents) . " held students, {$summary}.");
    }

    // ---- phase 4: term-end conclude (Canvas "completed") ------------------

    /**
     * Enrolled requests whose offering ended more than the grace period ago:
     * suspend the Moodle enrolment (read-only-equivalent: access closes, every
     * grade and the roster row survive) and mark the request 'completed'. The
     * business record then reflects the term boundary instead of enrolments
     * running forever. Also reports the waitlist backlog per offering.
     */
    private function conclude_ended_enrolments(bool $enforce): void {
        global $DB;

        if (!$this->table_exists('local_prequran_course_enrol_req')
                || !$this->table_exists('local_prequran_course_offering')) {
            mtrace('Term-end conclude skipped: required tables missing.');
            return;
        }
        $mode = $enforce ? 'enforce' : 'report';
        $gracedays = max(0, (int)get_config('local_prequran', 'enrol_conclude_grace'));
        $cutoff = time() - ($gracedays * DAYSECS);

        $rows = $DB->get_records_sql(
            "SELECT r.id, r.studentid, r.offeringid, r.workspaceid, r.consumerid, o.moodlecourseid, o.enddate
               FROM {local_prequran_course_enrol_req} r
               JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
              WHERE r.status = 'enrolled' AND o.enddate > 0 AND o.enddate < :cutoff AND o.moodlecourseid > 0",
            ['cutoff' => $cutoff]
        );

        $concluded = 0;
        foreach ($rows as $r) {
            $studentid = (int)$r->studentid;
            $courseid = (int)$r->moodlecourseid;
            if ($enforce) {
                $this->set_manual_enrol_status($studentid, $courseid, ENROL_USER_SUSPENDED); // False (already suspended) is fine.
                $DB->update_record('local_prequran_course_enrol_req', (object)[
                    'id' => (int)$r->id,
                    'status' => 'completed',
                    'timemodified' => time(),
                ]);
                $this->audit('enrollment_completed_term_end', $studentid, $courseid, $r);
                $concluded++;
                mtrace("  [{$mode}] concluded request {$r->id}: student {$studentid}, course {$courseid} (offering ended)");
            } else {
                mtrace("  [{$mode}] WOULD conclude request {$r->id}: student {$studentid}, course {$courseid} (offering ended)");
            }
        }

        // Informational: waitlist backlog per offering (promotion happens in the
        // portal on seat release; a lingering backlog means seats stayed full).
        $backlog = $DB->get_records_sql(
            "SELECT offeringid, COUNT(1) AS waiting
               FROM {local_prequran_course_enrol_req}
              WHERE status = 'waitlisted'
           GROUP BY offeringid"
        );
        foreach ($backlog as $b) {
            mtrace("  [info] offering {$b->offeringid}: {$b->waiting} waitlisted request(s)");
        }

        mtrace('Term-end conclude (' . $mode . '): ' . count($rows) . " ended enrolments found" . ($enforce ? ", {$concluded} concluded" : '') . ', grace ' . $gracedays . 'd.');
    }

    /**
     * Flip a user's MANUAL enrolment status (suspend/restore) — mirror of
     * pqco_set_student_enrol_status, replicated so the task stays
     * self-contained (no cross-plugin include). True when a change applied.
     */
    private function set_manual_enrol_status(int $userid, int $courseid, int $status): bool {
        global $CFG, $DB;
        require_once($CFG->libdir . '/enrollib.php');
        $manual = enrol_get_plugin('manual');
        if (!$manual || $userid <= 0 || $courseid <= 0) {
            return false;
        }
        foreach (enrol_get_instances($courseid, false) as $instance) {
            if ((string)$instance->enrol !== 'manual') {
                continue;
            }
            $ue = $DB->get_record('user_enrolments', ['enrolid' => $instance->id, 'userid' => $userid]);
            if (!$ue) {
                continue;
            }
            if ((int)$ue->status === $status) {
                return false;
            }
            $manual->update_user_enrol($instance, $userid, $status);
            return true;
        }
        return false;
    }

    /** Current manual-enrolment status for user in course; -1 when not manually enrolled. */
    private function enrol_status(int $userid, int $courseid): int {
        global $DB;
        $sql = "SELECT ue.status
                  FROM {user_enrolments} ue
                  JOIN {enrol} e ON e.id = ue.enrolid
                 WHERE e.courseid = :courseid AND e.enrol = 'manual' AND ue.userid = :userid";
        $status = $DB->get_field_sql($sql, ['courseid' => $courseid, 'userid' => $userid], IGNORE_MULTIPLE);
        return $status === false ? -1 : (int)$status;
    }

    /** Audit write mirroring pqco_course_audit's row shape (self-contained). */
    private function audit(string $action, int $studentid, int $courseid, $req): void {
        global $DB;
        if (!$this->table_exists('local_prequran_course_audit')) {
            return;
        }
        try {
            $DB->insert_record('local_prequran_course_audit', (object)[
                'consumerid' => (int)($req->consumerid ?? 0),
                'workspaceid' => (int)($req->workspaceid ?? 0),
                'offeringid' => (int)($req->offeringid ?? 0),
                'requestid' => (int)($req->id ?? 0),
                'studentid' => $studentid,
                'actorid' => 0, // Scheduled task.
                'action' => substr($action, 0, 80),
                'targettype' => 'user_enrolment',
                'targetid' => $courseid,
                'details' => json_encode(['source' => 'enrolment_reconcile'], JSON_UNESCAPED_SLASHES),
                'timecreated' => time(),
            ]);
        } catch (\Throwable $e) {
            // Audit must never break the reconcile.
        }
    }

    // ---- helpers ----------------------------------------------------------

    private $tablecache = [];

    private function table_exists(string $table): bool {
        global $DB;
        if (!array_key_exists($table, $this->tablecache)) {
            $this->tablecache[$table] = $DB->get_manager()->table_exists(new \xmldb_table($table));
        }
        return $this->tablecache[$table];
    }
}
