<?php
// Communications query library — extracted VERBATIM from communications.php
// (renamed pqh_comm_ -> pqcomml_) for the token-gated portal endpoint. The
// legacy page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_* helpers).

defined('MOODLE_INTERNAL') || die();

function pqcomml_context_url(string $path, array $contextparams, array $params = []): moodle_url {
    return new moodle_url($path, $contextparams + $params);
}

function pqcomml_current_user_ws_token(string $fallback = ''): string {
    global $DB;

    try {
        $service = $DB->get_record('external_services', [
            'shortname' => 'prequran_ws',
            'enabled' => 1,
        ]);
        if (!$service || !function_exists('external_generate_token_for_current_user')) {
            return $fallback;
        }

        $token = external_generate_token_for_current_user($service);
        if (is_object($token) && !empty($token->token)) {
            return (string)$token->token;
        }
    } catch (Throwable $e) {
        return $fallback;
    }

    return $fallback;
}

function pqcomml_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqcomml_student_in_workspace(int $workspaceid, int $studentid): bool {
    global $DB;

    if ($workspaceid <= 0 || $studentid <= 0) {
        return true;
    }

    $checked = false;
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        $checked = true;
        if ($DB->record_exists('local_prequran_workspace_member', [
            'workspaceid' => $workspaceid,
            'userid' => $studentid,
            'workspace_role' => 'student',
            'status' => 'active',
        ])) {
            return true;
        }
    }
    if (pqh_table_exists_safe('local_prequran_student_profile')
            && pqh_table_has_field_safe('local_prequran_student_profile', 'workspaceid')) {
        $checked = true;
        if ($DB->record_exists('local_prequran_student_profile', [
            'workspaceid' => $workspaceid,
            'userid' => $studentid,
        ])) {
            return true;
        }
    }
    if (pqh_table_exists_safe('local_prequran_teacher_student')
            && pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
        $checked = true;
        if ($DB->record_exists('local_prequran_teacher_student', [
            'workspaceid' => $workspaceid,
            'studentid' => $studentid,
            'status' => 'active',
        ])) {
            return true;
        }
    }

    return !$checked;
}

function pqcomml_direct_tables_ready(): bool {
    return pqcomml_table_exists('local_prequran_comm_thread')
        && pqcomml_table_exists('local_prequran_comm_participant')
        && pqcomml_table_exists('local_prequran_comm_message');
}

function pqcomml_direct_can_read($thread, int $userid, int $workspaceid = 0): bool {
    global $DB;
    if (!$thread || empty($thread->id) || $userid <= 0) {
        return false;
    }
    if (!pqcomml_student_in_workspace($workspaceid, (int)($thread->studentid ?? 0))) {
        return false;
    }
    if ((int)($thread->studentid ?? 0) > 0 && !pqh_user_belongs_to_consumer_context((int)$thread->studentid)) {
        return false;
    }
    if ($DB->record_exists('local_prequran_comm_participant', [
        'threadid' => (int)$thread->id,
        'userid' => $userid,
    ])) {
        return true;
    }
    if ((int)$thread->createdby === $userid) {
        return true;
    }
    return is_siteadmin($userid) && (string)$thread->type !== 'parent_teacher';
}

function pqcomml_direct_can_reply($thread, int $userid): bool {
    global $DB;
    if (!$thread || empty($thread->id) || (string)$thread->status !== 'active' || (string)$thread->type === 'announcement') {
        return false;
    }
    return $DB->record_exists('local_prequran_comm_participant', [
        'threadid' => (int)$thread->id,
        'userid' => $userid,
        'canreply' => 1,
    ]);
}

function pqcomml_direct_clean_body(string $body, int $max = 1000): string {
    $body = trim($body);
    if (core_text::strlen($body) > $max) {
        $body = core_text::substr($body, 0, $max);
    }
    return clean_param($body, PARAM_TEXT);
}

function pqcomml_direct_user_name(int $userid): string {
    global $DB;
    if ($userid <= 0) {
        return 'EduPlatform';
    }
    $user = $DB->get_record('user', ['id' => $userid, 'deleted' => 0], 'id, firstname, lastname, email');
    if (!$user) {
        return 'EduPlatform';
    }
    return fullname($user);
}

// ==== Canvas-model communications layer =====================================
// Role-aware messaging modeled on Canvas Inbox: every role can COMPOSE to the
// recipients its relationships permit (teachers -> their students/parents/
// staff/groups; parents -> their children's teachers + admins; students ->
// their assigned teachers, parent-enabled; admins -> anyone + role audiences).
// Replies push a notification to the other participants (Canvas notifies on
// every conversation message; previously replies here were silent). Bodies
// authored by parents/students pass a contact-exchange filter (minor-adjacent
// channel). Threads can be closed. Academy-ops get an AUDITED oversight view
// of any thread (each access logged) — auditable oversight over absolute
// privacy on a school platform.

/** The caller's communication role in this workspace (highest wins). */
function pqcomml_comm_role(int $userid, int $workspaceid): string {
    global $DB;
    if (pqh_can_manage_academy_operations($userid)
            || ($workspaceid > 0 && pqh_user_can_manage_workspace($userid, $workspaceid))) {
        return 'admin';
    }
    if ($workspaceid > 0 && pqcomml_table_exists('local_prequran_workspace_member')) {
        $roles = $DB->get_fieldset_select('local_prequran_workspace_member', 'workspace_role',
            "workspaceid = :ws AND userid = :uid AND status = 'active'",
            ['ws' => $workspaceid, 'uid' => $userid]);
        if (array_intersect($roles, ['teacher', 'assistant_teacher', 'owner', 'admin'])) {
            return 'teacher';
        }
        if (in_array('student', $roles, true)) {
            // Guardian rank outranks a stray student row only when pairs exist.
            if (!pqcomml_guardian_children($userid)) {
                return 'student';
            }
        }
    }
    if (pqcomml_guardian_children($userid)) {
        return 'parent';
    }
    if ($workspaceid > 0 && pqcomml_table_exists('local_prequran_workspace_member')
            && $DB->record_exists('local_prequran_workspace_member',
                ['workspaceid' => $workspaceid, 'userid' => $userid, 'workspace_role' => 'student', 'status' => 'active'])) {
        return 'student';
    }
    return '';
}

/** Consented (non-revoked) children of a guardian. */
function pqcomml_guardian_children(int $userid): array {
    global $DB;
    $children = [];
    if (pqcomml_table_exists('local_prequran_comm_consent')) {
        foreach ($DB->get_records('local_prequran_comm_consent', ['guardianid' => $userid, 'consented' => 1], '', 'id,studentid') as $r) {
            if ((int)$r->studentid > 0) {
                $children[(int)$r->studentid] = (int)$r->studentid;
            }
        }
    }
    if (pqcomml_table_exists('local_prequran_live_consent')) {
        foreach ($DB->get_records('local_prequran_live_consent', ['guardianid' => $userid, 'granted' => 1], '', 'id,studentid') as $r) {
            if ((int)$r->studentid > 0) {
                $children[(int)$r->studentid] = (int)$r->studentid;
            }
        }
    }
    return array_values($children);
}

/**
 * May this student compose messages? Wires the previously-DEAD per-family
 * consent flag: a guardian/admin sets student_messaging_enabled=1 on the
 * consent link; default 0 keeps student composing off (they can still reply
 * on threads a teacher opened with them).
 */
function pqcomml_student_may_compose(int $studentid): bool {
    global $DB;
    if (!pqcomml_table_exists('local_prequran_comm_consent')) {
        return false;
    }
    try {
        return $DB->record_exists_select('local_prequran_comm_consent',
            'studentid = :sid AND student_messaging_enabled = 1', ['sid' => $studentid]);
    } catch (Throwable $e) {
        return false;
    }
}

/** Canvas-style recipient resolution: who may THIS user compose to? */
function pqcomml_compose_recipients(int $userid, int $workspaceid, string $role): array {
    global $DB;
    $out = [];
    $adduser = static function (int $uid, string $prefix) use (&$out): void {
        if ($uid <= 0 || isset($out['user:' . $uid])) {
            return;
        }
        $out['user:' . $uid] = ['id' => 'user:' . $uid, 'label' => $prefix . ': ' . pqcomml_direct_user_name($uid)];
    };

    if ($role === 'admin') {
        $out['role:all'] = ['id' => 'role:all', 'label' => 'Announcement: everyone in workspace'];
        $out['role:teacher'] = ['id' => 'role:teacher', 'label' => 'Announcement: all teachers'];
        $out['role:parent'] = ['id' => 'role:parent', 'label' => 'Announcement: all parents'];
        $out['role:student'] = ['id' => 'role:student', 'label' => 'Announcement: all students'];
        if ($workspaceid > 0 && pqcomml_table_exists('local_prequran_workspace_member')) {
            $members = $DB->get_records_sql(
                "SELECT DISTINCT wm.userid, wm.workspace_role
                   FROM {local_prequran_workspace_member} wm
                   JOIN {user} u ON u.id = wm.userid AND u.deleted = 0 AND u.suspended = 0
                  WHERE wm.workspaceid = :ws AND wm.status = 'active'", ['ws' => $workspaceid], 0, 200);
            foreach ($members as $m) {
                if ((int)$m->userid !== $userid) {
                    $adduser((int)$m->userid, ucfirst((string)$m->workspace_role));
                }
            }
        }
    } else if ($role === 'teacher') {
        if (pqcomml_table_exists('local_prequran_teacher_student')) {
            $students = $DB->get_records('local_prequran_teacher_student',
                ['workspaceid' => $workspaceid, 'teacherid' => $userid, 'status' => 'active'], '', 'id,studentid');
            foreach ($students as $s) {
                $adduser((int)$s->studentid, 'Student');
                if (pqcomml_table_exists('local_prequran_comm_consent')) {
                    foreach ($DB->get_records('local_prequran_comm_consent',
                        ['studentid' => (int)$s->studentid, 'consented' => 1], '', 'id,guardianid') as $g) {
                        if ((int)$g->guardianid > 0) {
                            $out['user:' . (int)$g->guardianid] = [
                                'id' => 'user:' . (int)$g->guardianid,
                                'label' => 'Parent: ' . pqcomml_direct_user_name((int)$g->guardianid)
                                    . ' (' . pqcomml_direct_user_name((int)$s->studentid) . ')',
                            ];
                        }
                    }
                }
            }
        }
        if (pqcomml_table_exists('local_prequran_class_group')) {
            $groups = $DB->get_records_select('local_prequran_class_group',
                "workspaceid = :ws AND teacherid = :uid AND status IN ('open', 'active')",
                ['ws' => $workspaceid, 'uid' => $userid], '', 'id,title');
            foreach ($groups as $g) {
                $out['group:' . (int)$g->id] = ['id' => 'group:' . (int)$g->id, 'label' => 'Class group: ' . (string)$g->title];
            }
        }
        if ($workspaceid > 0 && pqcomml_table_exists('local_prequran_workspace_member')) {
            $staff = $DB->get_records_sql(
                "SELECT DISTINCT wm.userid
                   FROM {local_prequran_workspace_member} wm
                   JOIN {user} u ON u.id = wm.userid AND u.deleted = 0 AND u.suspended = 0
                  WHERE wm.workspaceid = :ws AND wm.status = 'active'
                    AND wm.workspace_role IN ('teacher', 'assistant_teacher', 'owner', 'admin')",
                ['ws' => $workspaceid], 0, 100);
            foreach ($staff as $m) {
                if ((int)$m->userid !== $userid) {
                    $adduser((int)$m->userid, 'Staff');
                }
            }
        }
    } else if ($role === 'parent') {
        foreach (pqcomml_guardian_children($userid) as $childid) {
            if (pqcomml_table_exists('local_prequran_teacher_student')) {
                $teachers = $DB->get_records('local_prequran_teacher_student',
                    ['studentid' => $childid, 'status' => 'active'], '', 'id,teacherid');
                foreach ($teachers as $t) {
                    $out['user:' . (int)$t->teacherid] = [
                        'id' => 'user:' . (int)$t->teacherid,
                        'label' => 'Teacher: ' . pqcomml_direct_user_name((int)$t->teacherid)
                            . ' (' . pqcomml_direct_user_name($childid) . ')',
                    ];
                }
            }
        }
        if ($workspaceid > 0 && pqcomml_table_exists('local_prequran_workspace_member')) {
            $admins = $DB->get_records_sql(
                "SELECT DISTINCT wm.userid
                   FROM {local_prequran_workspace_member} wm
                   JOIN {user} u ON u.id = wm.userid AND u.deleted = 0 AND u.suspended = 0
                  WHERE wm.workspaceid = :ws AND wm.status = 'active'
                    AND wm.workspace_role IN ('owner', 'admin')", ['ws' => $workspaceid], 0, 20);
            foreach ($admins as $m) {
                $adduser((int)$m->userid, 'Admin');
            }
        }
    } else if ($role === 'student') {
        if (pqcomml_student_may_compose($userid) && pqcomml_table_exists('local_prequran_teacher_student')) {
            $teachers = $DB->get_records('local_prequran_teacher_student',
                ['studentid' => $userid, 'status' => 'active'], '', 'id,teacherid');
            foreach ($teachers as $t) {
                $adduser((int)$t->teacherid, 'Teacher');
            }
        }
        // System-issue lane: ALWAYS available regardless of the messaging
        // consent flag — a student who cannot log in or whose lesson is broken
        // must be able to tell their SCHOOL's administrators (never EduPlatform
        // directly; the school escalates platform problems on their behalf).
        if ($workspaceid > 0 && pqcomml_table_exists('local_prequran_workspace_member')) {
            $admins = $DB->get_records_sql(
                "SELECT DISTINCT wm.userid
                   FROM {local_prequran_workspace_member} wm
                   JOIN {user} u ON u.id = wm.userid AND u.deleted = 0 AND u.suspended = 0
                  WHERE wm.workspaceid = :ws AND wm.status = 'active'
                    AND wm.workspace_role IN ('owner', 'admin')", ['ws' => $workspaceid], 0, 20);
            foreach ($admins as $m) {
                $out['user:' . (int)$m->userid] = [
                    'id' => 'user:' . (int)$m->userid,
                    'label' => 'School support: ' . pqcomml_direct_user_name((int)$m->userid),
                ];
            }
        }
    }
    return array_values($out);
}

/**
 * Contact-exchange filter for parent/student-authored bodies (URLs, emails,
 * phone numbers, @handles → [removed]). The student SUPPORT channel already
 * had this; the parent↔teacher channel did not.
 */
function pqcomml_filter_contact_details(string $body): string {
    $patterns = [
        '~https?://\S+~i',
        '~\bwww\.\S+~i',
        '~[\w.+-]+@[\w-]+\.[\w.]+~',
        '~(?<!\d)(\+?\d[\d\s\-()]{7,}\d)(?!\d)~',
        '~(?<![\w.])@[\w.]{3,}~',
    ];
    return trim((string)preg_replace($patterns, '[removed]', $body));
}

/** Notify every other (non-muted, live) participant about a new message. */
function pqcomml_notify_thread_participants($thread, int $senderid, string $snippet): void {
    global $DB;
    try {
        $participants = $DB->get_records('local_prequran_comm_participant',
            ['threadid' => (int)$thread->id], '', 'id,userid,muted', 0, 100);
        $sendername = pqcomml_direct_user_name($senderid);
        $subject = 'New message from ' . $sendername . ': ' . (string)$thread->subject;
        $bodytext = $sendername . ' wrote in "' . (string)$thread->subject . '":' . "\n\n"
            . core_text::substr($snippet, 0, 300)
            . "\n\nOpen Communications in your portal to read and reply.";
        foreach ($participants as $p) {
            $recipientid = (int)$p->userid;
            if ($recipientid === $senderid || !empty($p->muted)) {
                continue;
            }
            $recipient = core_user::get_user($recipientid);
            if (!$recipient || !empty($recipient->deleted) || !empty($recipient->suspended)) {
                continue;
            }
            $message = new \core\message\message();
            $message->component = 'local_prequran';
            $message->name = 'live_session_update';
            $message->userfrom = core_user::get_noreply_user();
            $message->userto = $recipient;
            $message->subject = $subject;
            $message->fullmessage = $bodytext;
            $message->fullmessageformat = FORMAT_PLAIN;
            $message->fullmessagehtml = '';
            $message->smallmessage = $subject;
            $message->notification = 1;
            $message->courseid = SITEID;
            message_send($message);
        }
    } catch (Throwable $e) {
        // Notification failure never blocks the message write.
    }
}

/**
 * Compose a new thread (Canvas Inbox compose). $recipientids are entries from
 * pqcomml_compose_recipients — every one is re-validated against the caller's
 * allowed set. Individual recipients => a two-way thread typed by the pair;
 * role:/group: audience (admin/teacher) => a read-only announcement thread.
 * Returns the new thread id.
 */
function pqcomml_compose_thread(int $workspaceid, int $creatorid, string $creatorrole, array $recipientids, string $subject, string $bodytext): int {
    global $DB;

    $allowed = [];
    foreach (pqcomml_compose_recipients($creatorid, $workspaceid, $creatorrole) as $entry) {
        $allowed[$entry['id']] = true;
    }
    $userids = [];
    $audience = '';
    $groupid = 0;
    foreach ($recipientids as $rid) {
        $rid = (string)$rid;
        if (!isset($allowed[$rid])) {
            throw new invalid_parameter_exception('One of the chosen recipients is not in your permitted list.');
        }
        if (strpos($rid, 'user:') === 0) {
            $userids[(int)substr($rid, 5)] = (int)substr($rid, 5);
        } else if (strpos($rid, 'role:') === 0) {
            $audience = substr($rid, 5);
        } else if (strpos($rid, 'group:') === 0) {
            $groupid = (int)substr($rid, 6);
        }
    }
    if (!$userids && $audience === '' && $groupid <= 0) {
        throw new invalid_parameter_exception('Choose at least one recipient.');
    }

    $now = time();
    $isbroadcast = ($audience !== '' || $groupid > 0);

    // Resolve broadcast audiences to user ids (cap 500).
    if ($audience !== '') {
        $roleclause = $audience === 'all' ? '' : ' AND wm.workspace_role = :wrole';
        $params = ['ws' => $workspaceid];
        if ($audience !== 'all') {
            $params['wrole'] = $audience;
        }
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT wm.userid
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid AND u.deleted = 0 AND u.suspended = 0
              WHERE wm.workspaceid = :ws AND wm.status = 'active'" . $roleclause, $params, 0, 500);
        foreach ($rows as $r) {
            $userids[(int)$r->userid] = (int)$r->userid;
        }
    } else if ($groupid > 0 && pqcomml_table_exists('local_prequran_group_member')) {
        $rows = $DB->get_records('local_prequran_group_member',
            ['groupid' => $groupid, 'assignment_status' => 'active'], '', 'id,studentid', 0, 500);
        foreach ($rows as $r) {
            $userids[(int)$r->studentid] = (int)$r->studentid;
        }
    }
    unset($userids[$creatorid]);
    if (!$userids) {
        throw new invalid_parameter_exception('No live recipients resolved for that audience.');
    }

    // Type by pair (Canvas: conversation context follows the relationship).
    if ($isbroadcast) {
        $type = 'announcement';
    } else if ($creatorrole === 'student') {
        // Student -> school admins = the internal helpdesk lane; student ->
        // teacher = academic messaging.
        $type = 'student_helpdesk';
        foreach ($userids as $uid) {
            if (pqcomml_table_exists('local_prequran_teacher_student')
                    && $DB->record_exists('local_prequran_teacher_student',
                        ['studentid' => $creatorid, 'teacherid' => $uid, 'status' => 'active'])) {
                $type = 'student_teacher';
                break;
            }
        }
    } else if ($creatorrole === 'parent') {
        $type = 'parent_teacher';
    } else {
        // Staff composing: guardian recipient => parent_teacher, student
        // recipient => student_teacher, else staff_direct.
        $type = 'staff_direct';
        foreach ($userids as $uid) {
            if (pqcomml_guardian_children($uid)) {
                $type = 'parent_teacher';
                break;
            }
            if ($DB->record_exists('local_prequran_workspace_member',
                    ['workspaceid' => $workspaceid, 'userid' => $uid, 'workspace_role' => 'student', 'status' => 'active'])) {
                $type = 'student_teacher';
            }
        }
    }

    // Subject student (for the thread's studentid context).
    $studentid = null;
    if ($creatorrole === 'student') {
        $studentid = $creatorid;
    } else if ($creatorrole === 'parent') {
        $children = pqcomml_guardian_children($creatorid);
        $studentid = $children ? (int)$children[0] : null;
    } else if ($type === 'student_teacher') {
        foreach ($userids as $uid) {
            if ($DB->record_exists('local_prequran_workspace_member',
                    ['workspaceid' => $workspaceid, 'userid' => $uid, 'workspace_role' => 'student', 'status' => 'active'])) {
                $studentid = $uid;
                break;
            }
        }
    }

    $transaction = $DB->start_delegated_transaction();
    $threadid = (int)$DB->insert_record('local_prequran_comm_thread', (object)[
        'type' => $type,
        'cohortid' => $groupid,
        'studentid' => $studentid,
        'createdby' => $creatorid,
        'status' => 'active',
        'subject' => core_text::substr($subject !== '' ? $subject : core_text::substr($bodytext, 0, 60), 0, 255),
        'lastmessageat' => $now,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $addparticipant = static function (int $uid, string $prole, int $canreply) use ($DB, $threadid, $now): void {
        $DB->insert_record('local_prequran_comm_participant', (object)[
            'threadid' => $threadid, 'userid' => $uid, 'role' => $prole,
            'canreply' => $canreply, 'lastreadmessageid' => 0, 'muted' => 0,
            'timecreated' => $now, 'timemodified' => $now,
        ]);
    };
    $addparticipant($creatorid, $creatorrole, 1);
    foreach ($userids as $uid) {
        $addparticipant($uid, 'recipient', $isbroadcast ? 0 : 1);
    }
    $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
        'threadid' => $threadid, 'senderid' => $creatorid, 'studentid' => $studentid,
        'messagekind' => 'text', 'body' => $bodytext, 'templatekey' => '',
        'status' => 'visible', 'moderationflags' => '',
        'timecreated' => $now, 'timemodified' => $now,
    ]);
    if (pqcomml_table_exists('local_prequran_comm_audit')) {
        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => $threadid, 'messageid' => $messageid, 'actorid' => $creatorid,
            'action' => 'created',
            'details' => json_encode(['type' => $type, 'compose' => true, 'role' => $creatorrole,
                'recipients' => count($userids), 'audience' => $audience, 'groupid' => $groupid], JSON_UNESCAPED_SLASHES),
            'timecreated' => $now,
        ]);
    }
    $transaction->allow_commit();

    $thread = $DB->get_record('local_prequran_comm_thread', ['id' => $threadid]);
    pqcomml_notify_thread_participants($thread, $creatorid, $bodytext);
    return $threadid;
}

/** Close (archive) a thread — creator or admin-role only. */
function pqcomml_close_thread($thread, int $userid, string $role): void {
    global $DB;
    if ((int)$thread->createdby !== $userid && $role !== 'admin') {
        throw new invalid_parameter_exception('Only the thread creator or a workspace admin can close a thread.');
    }
    $DB->update_record('local_prequran_comm_thread', (object)[
        'id' => (int)$thread->id, 'status' => 'archived', 'timemodified' => time(),
    ]);
    if (pqcomml_table_exists('local_prequran_comm_audit')) {
        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => (int)$thread->id, 'messageid' => 0, 'actorid' => $userid,
            'action' => 'closed', 'details' => json_encode(['role' => $role]), 'timecreated' => time(),
        ]);
    }
}

/** Audited safeguarding oversight: academy-ops may read ANY thread; every access is logged. */
function pqcomml_oversight_allowed(int $userid): bool {
    return is_siteadmin($userid) || pqh_can_manage_academy_operations($userid);
}
