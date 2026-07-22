<?php
// ---- report: workspace-people (school staff & learners management) ----------
// Ported from local_hubredirect/workspace_people.php via
// workspace_people_portallib (pqwpl_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the full workspace people state (teachers/students/parents, all
//        members, assignments, parent links, pending invites, candidates).
// POST = do=add_member | create_member | assign_student | link_parent_student |
//        bulk_import_members | clear_invite | set_member_status — each the
//        legacy action=... write VERBATIM (same guards, whitelists and
//        messages). confirm_sesskey() dropped: token auth replaces it.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->dirroot . '/local/hubredirect/account_ids.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/workspace_people_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// -- workspace resolution + entry access check (same order and messages as the
// -- legacy page): current-workspace fallback, manage check, record check.
$requestedworkspaceid = $ispost
    ? (int)($body['workspaceid'] ?? 0)
    : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace owners and admins can manage workspace people.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening workspace people.');
}

$ready = pqh_table_exists_safe('local_prequran_workspace_member');

if ($ispost) {
    // Legacy gates every POST on $ready (otherwise the page silently rerenders
    // its "tables not ready" empty state) — the API says so explicitly.
    if (!$ready) {
        pqpd_fail(403, 'Workspace membership tables are not ready. Run the local_prequran Moodle upgrade first.');
    }
    $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    $message = '';
    try {
        if ($do === 'add_member') {
            // -- write: add_member (legacy action=add_member, verbatim) --
            $role = clean_param((string)($body['workspace_role'] ?? 'student'), PARAM_ALPHANUMEXT);
            $selecteduserid = (int)($body['member_userid'] ?? 0);
            $needle = trim(clean_param((string)($body['member'] ?? ''), PARAM_TEXT));
            if (!array_key_exists($role, pqh_workspace_roles())) {
                throw new invalid_parameter_exception('Invalid workspace role.');
            }
            if (!in_array($role, ['owner', 'admin', 'teacher', 'assistant_teacher', 'coordinator', 'registrar', 'finance', 'support', 'auditor', 'sponsor', 'parent', 'student'], true)) {
                throw new invalid_parameter_exception('That role cannot be added from this page.');
            }
            $member = $selecteduserid > 0 ? core_user::get_user($selecteduserid, '*', IGNORE_MISSING) : pqwpl_find_user($needle);
            if (!$member) {
                throw new invalid_parameter_exception('Choose a user from the dropdown or enter a valid user ID, email, or username.');
            }
            if (!empty($member->deleted) || !empty($member->suspended)) {
                throw new invalid_parameter_exception('That Moodle user is deleted or suspended.');
            }
            pqwpl_upsert_member($workspaceid, (int)$member->id, $role, (int)$USER->id);
            $message = 'Workspace member added.';
        } else if ($do === 'create_member') {
            // -- write: create_member (legacy action=create_member, verbatim) --
            $role = clean_param((string)($body['workspace_role'] ?? 'coordinator'), PARAM_ALPHANUMEXT);
            $firstname = trim(clean_param((string)($body['new_firstname'] ?? ''), PARAM_TEXT));
            $lastname = trim(clean_param((string)($body['new_lastname'] ?? ''), PARAM_TEXT));
            $email = clean_param(trim(clean_param((string)($body['new_email'] ?? ''), PARAM_EMAIL)), PARAM_EMAIL);
            $username = clean_param(trim(clean_param((string)($body['new_username'] ?? ''), PARAM_USERNAME)), PARAM_USERNAME);
            if (!array_key_exists($role, pqh_workspace_roles())) {
                throw new invalid_parameter_exception('Invalid workspace role.');
            }
            if (!in_array($role, ['owner', 'admin', 'coordinator', 'registrar', 'finance', 'support', 'auditor', 'sponsor', 'parent'], true)) {
                throw new invalid_parameter_exception('Use student intake for students and teacher intake for teachers.');
            }
            if ($email === '' || !validate_email($email)) {
                throw new invalid_parameter_exception('Enter a valid email address for the new workspace member.');
            }
            $member = pqwpl_find_user($email);
            if (!$member && $username !== '') {
                $member = pqwpl_find_user($username);
            }
            $created = false;
            $createdusername = '';
            $createdpassword = '';
            if ($member) {
                if (!empty($member->deleted) || !empty($member->suspended)) {
                    throw new invalid_parameter_exception('A Moodle user with that email exists but is deleted or suspended.');
                }
            } else {
                [$newuserid, $createdusername, $createdpassword, $createdidnumber] = pqwpl_create_moodle_user($firstname, $lastname, $email, $username, $role);
                $member = core_user::get_user($newuserid, '*', MUST_EXIST);
                $created = true;
            }
            pqwpl_upsert_member($workspaceid, (int)$member->id, $role, (int)$USER->id);
            $message = $created
                ? 'Moodle user created and added to workspace. User ID ' . (int)$member->id . ', Account No. ' . $createdidnumber . ', username ' . $createdusername . ', temporary password ' . $createdpassword . '.'
                : 'Existing Moodle user #' . (int)$member->id . ' added to workspace.';
        } else if ($do === 'assign_student') {
            // -- write: assign_student (legacy action=assign_student, verbatim) --
            $teacherid = (int)($body['teacherid'] ?? 0);
            $studentid = (int)($body['studentid'] ?? 0);
            if (!pqwpl_is_workspace_member($workspaceid, $teacherid, ['teacher', 'assistant_teacher', 'owner', 'admin'])) {
                throw new invalid_parameter_exception('Teacher is not an active teaching member of this workspace.');
            }
            if (!pqwpl_is_workspace_member($workspaceid, $studentid, ['student'])) {
                throw new invalid_parameter_exception('Student is not an active student member of this workspace.');
            }
            pqwpl_upsert_assignment($workspaceid, $teacherid, $studentid, (int)$USER->id);
            $message = 'Student assigned to teacher.';
        } else if ($do === 'link_parent_student') {
            // -- write: link_parent_student (legacy action=link_parent_student, verbatim) --
            $parentid = (int)($body['parentid'] ?? 0);
            $studentid = (int)($body['studentid'] ?? 0);
            pqwpl_upsert_parent_link($workspaceid, $studentid, $parentid, (int)$USER->id);
            $message = 'Parent linked to student.';
        } else if ($do === 'bulk_import_members') {
            // -- write: bulk_import_members (legacy action=bulk_import_members, verbatim) --
            $importtext = clean_param((string)($body['bulk_members'] ?? ''), PARAM_RAW_TRIMMED);
            $stats = pqwpl_bulk_import($workspace, $importtext, (int)$USER->id);
            $message = 'Bulk import processed: ' . (int)$stats['added'] . ' members added, '
                . (int)$stats['invited'] . ' pending invites, '
                . (int)$stats['linked'] . ' relationships created, '
                . (int)$stats['skipped'] . ' rows skipped.';
        } else if ($do === 'clear_invite') {
            // -- write: clear_invite (legacy action=clear_invite, verbatim) --
            $invitekey = clean_param((string)($body['invitekey'] ?? ''), PARAM_RAW_TRIMMED);
            $message = pqwpl_clear_pending_invite($workspace, $invitekey) ? 'Pending invite removed.' : 'Pending invite was not found.';
        } else if ($do === 'set_member_status') {
            // -- write: set_member_status (legacy action=set_member_status, verbatim) --
            $memberid = (int)($body['memberid'] ?? 0);
            $status = clean_param((string)($body['member_status'] ?? 'inactive'), PARAM_ALPHANUMEXT);
            $message = pqwpl_set_member_status($workspaceid, $memberid, $status, (int)$USER->id);
        } else {
            pqpd_fail(400, 'Unknown workspace-people action.');
        }
    } catch (Throwable $e) {
        // Legacy catches every write error and shows it as the page alert —
        // same message text, delivered as JSON.
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $message,
        'workspaceid' => $workspaceid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: the workspace people lists exactly as the legacy page builds them --
$teachers = pqwpl_workspace_members($workspaceid, ['owner', 'admin', 'teacher', 'assistant_teacher']);
$students = pqwpl_workspace_members($workspaceid, ['student']);
$parents = pqwpl_workspace_members($workspaceid, ['parent']);
$allmembers = pqwpl_all_workspace_members($workspaceid);
$inactivecount = 0;
foreach ($allmembers as $memberrow) {
    if ((string)$memberrow->status !== 'active') {
        $inactivecount++;
    }
}
$assignments = pqwpl_assignments($workspaceid);
$parentlinks = pqwpl_parent_links($workspaceid);
$pendinginvites = pqwpl_pending_invites($workspace);
$assignmentmap = pqwpl_assignment_map($assignments);
$assignedstudentmap = pqwpl_assigned_student_map($assignments);
$membershipmap = pqwpl_membership_map([$teachers, $students, $parents]);
$candidateusers = pqwpl_candidate_users();

// Decorate rows with the server-side labels the page renders inline
// (fullname() and pqh_account_no_label() are PHP-only).
$decoratemember = static function (stdClass $row): array {
    return [
        'id' => (int)$row->id,
        'userid' => (int)$row->userid,
        'workspace_role' => (string)$row->workspace_role,
        'role_label' => pqwpl_role_label((string)$row->workspace_role),
        'status' => (string)$row->status,
        'timemodified' => (int)$row->timemodified,
        'fullname' => fullname($row),
        'email' => (string)($row->email ?? ''),
        'username' => (string)($row->username ?? ''),
        'account_label' => pqh_account_no_label($row),
    ];
};
$teachersout = array_map($decoratemember, $teachers);
$studentsout = array_map($decoratemember, $students);
$parentsout = array_map($decoratemember, $parents);
$allmembersout = array_map($decoratemember, $allmembers);

$assignmentsout = [];
foreach ($assignments as $assignment) {
    $assignmentsout[] = [
        'id' => (int)$assignment->id,
        'teacherid' => (int)$assignment->teacherid,
        'studentid' => (int)$assignment->studentid,
        'status' => (string)$assignment->status,
        'timemodified' => (int)$assignment->timemodified,
        'teacher_name' => fullname((object)['firstname' => $assignment->teacher_firstname, 'lastname' => $assignment->teacher_lastname]),
        'teacher_email' => (string)$assignment->teacher_email,
        'teacher_account_label' => pqh_account_no_label((object)['userid' => $assignment->teacherid, 'idnumber' => $assignment->teacher_idnumber]),
        'student_name' => fullname((object)['firstname' => $assignment->student_firstname, 'lastname' => $assignment->student_lastname]),
        'student_email' => (string)$assignment->student_email,
        'student_account_label' => pqh_account_no_label((object)['userid' => $assignment->studentid, 'idnumber' => $assignment->student_idnumber]),
    ];
}

$parentlinksout = [];
foreach ($parentlinks as $link) {
    $parentlinksout[] = [
        'id' => (int)$link->id,
        'studentid' => (int)$link->studentid,
        'guardianid' => (int)$link->guardianid,
        'parent_visible' => (int)$link->parent_visible,
        'timemodified' => (int)$link->timemodified,
        'parent_name' => fullname((object)['firstname' => $link->parent_firstname, 'lastname' => $link->parent_lastname]),
        'parent_email' => (string)$link->parent_email,
        'parent_account_label' => pqh_account_no_label((object)['userid' => $link->guardianid, 'idnumber' => $link->parent_idnumber]),
        'student_name' => fullname((object)['firstname' => $link->student_firstname, 'lastname' => $link->student_lastname]),
        'student_email' => (string)$link->student_email,
        'student_account_label' => pqh_account_no_label((object)['userid' => $link->studentid, 'idnumber' => $link->student_idnumber]),
    ];
}

$invitesout = [];
foreach ($pendinginvites as $invite) {
    $invitekey = strtolower((string)($invite['email'] ?? '')) . ':' . (string)($invite['role'] ?? '');
    $invitesout[] = [
        'invitekey' => $invitekey,
        'email' => (string)($invite['email'] ?? ''),
        'name' => (string)($invite['name'] ?? ''),
        'role' => (string)($invite['role'] ?? ''),
        'role_label' => pqwpl_role_label((string)($invite['role'] ?? '')),
        'status' => (string)($invite['status'] ?? 'pending'),
        'timemodified' => (int)($invite['timemodified'] ?? $invite['timecreated'] ?? time()),
    ];
}

$candidatesout = [];
foreach ($candidateusers as $candidate) {
    $candidatesout[] = [
        'id' => (int)$candidate->id,
        'fullname' => fullname($candidate),
        'email' => (string)($candidate->email ?? ''),
        'username' => (string)($candidate->username ?? ''),
        'account_label' => pqh_account_no_label($candidate),
        'account_no' => pqh_account_no_value($candidate),
        'likely_role' => pqwpl_likely_role($candidate),
        'existing_roles' => array_keys($membershipmap[(int)$candidate->id] ?? []),
    ];
}

$nameids = [];
foreach ($allmembers as $row) {
    $nameids[] = (int)$row->userid;
}
foreach ($assignments as $row) {
    $nameids[] = (int)$row->teacherid;
    $nameids[] = (int)$row->studentid;
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'teacher_student_ready' => pqh_table_exists_safe('local_prequran_teacher_student'),
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'roles' => pqh_workspace_roles(),
    'teachers' => $teachersout,
    'students' => $studentsout,
    'parents' => $parentsout,
    'allmembers' => $allmembersout,
    'inactivecount' => $inactivecount,
    'assignments' => $assignmentsout,
    'parentlinks' => $parentlinksout,
    'pendinginvites' => $invitesout,
    'assignmentmap' => (object)$assignmentmap,
    'assignedstudentmap' => (object)$assignedstudentmap,
    'candidates' => $candidatesout,
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/workspace_people.php?workspaceid=' . $workspaceid,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
