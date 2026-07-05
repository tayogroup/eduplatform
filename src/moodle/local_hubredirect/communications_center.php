<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/operations_layerlib.php');

function pqcom_name(?stdClass $user): string {
    return $user ? fullname($user) : 'User';
}

function pqcom_campaign_recipients(int $workspaceid, string $audience): array {
    $recipients = [];
    foreach (['parents' => 'parent', 'students' => 'student', 'teachers' => 'teacher'] as $key => $role) {
        if ($audience !== $key && $audience !== 'all') {
            continue;
        }
        foreach (pqops_workspace_users($workspaceid, $role) as $user) {
            $recipients[(int)$user->id] = ['user' => $user, 'role' => $role];
        }
    }
    return $recipients;
}

function pqcom_existing_columns_record(string $table, stdClass $record): stdClass {
    global $DB;

    if (!pqh_table_exists_safe($table)) {
        return $record;
    }

    $columns = $DB->get_columns($table);
    $filtered = new stdClass();
    foreach ((array)$record as $key => $value) {
        if (isset($columns[$key])) {
            $filtered->{$key} = $value;
        }
    }
    return $filtered;
}

function pqcom_existing_consent_conditions(int $workspaceid, int $studentid, int $guardianid, string $channel): array {
    global $DB;

    $columns = $DB->get_columns('local_prequran_comm_consent');
    $conditions = [
        'studentid' => $studentid,
        'guardianid' => $guardianid,
    ];
    if (isset($columns['workspaceid'])) {
        $conditions['workspaceid'] = $workspaceid;
    }
    if (isset($columns['channel'])) {
        $conditions['channel'] = $channel;
    }
    return $conditions;
}

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Communications Center requires teacher or workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Communications access denied');
}
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!pqops_comm_tables_ready()) {
            throw new invalid_parameter_exception('Communication tables are not ready. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'send_message') {
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $participants = [];
            foreach (['parentid' => 'parent', 'teacherid' => 'teacher', 'studentid' => 'student'] as $param => $role) {
                $userid = optional_param($param, 0, PARAM_INT);
                if ($userid > 0) {
                    $participants[$userid] = $role;
                }
            }
            $caseid = optional_param('caseid', 0, PARAM_INT);
            $threadid = pqops_create_thread_message(
                $workspaceid,
                $studentid,
                $participants,
                optional_param('thread_type', 'parent_teacher', PARAM_ALPHANUMEXT),
                optional_param('subject', '', PARAM_TEXT),
                optional_param('body', '', PARAM_TEXT),
                (int)$USER->id,
                $caseid
            );
            $notice = 'Message thread #' . $threadid . ' created.';
        } else if ($action === 'save_template' && $canmanage) {
            $DB->insert_record('local_prequran_comm_template', (object)[
                'workspaceid' => $workspaceid,
                'templatekey' => core_text::substr(optional_param('templatekey', '', PARAM_ALPHANUMEXT), 0, 120),
                'channel' => optional_param('channel', 'email', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'subject' => optional_param('subject', '', PARAM_TEXT),
                'body' => optional_param('body', '', PARAM_TEXT),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            $notice = 'Communication template saved.';
        } else if ($action === 'save_campaign' && $canmanage) {
            $audience = optional_param('audience', 'parents', PARAM_ALPHANUMEXT);
            $campaignid = (int)$DB->insert_record('local_prequran_comm_campaign', (object)[
                'workspaceid' => $workspaceid,
                'campaign_type' => optional_param('campaign_type', 'announcement', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'channel' => optional_param('channel', 'email', PARAM_ALPHANUMEXT),
                'templateid' => optional_param('templateid', 0, PARAM_INT),
                'audience' => $audience,
                'status' => optional_param('status', 'queued', PARAM_ALPHANUMEXT),
                'scheduledat' => pqops_datetime_from_parts(optional_param('scheduled_date', '', PARAM_TEXT), optional_param('scheduled_time', '', PARAM_TEXT)),
                'sentat' => 0,
                'messagebody' => optional_param('messagebody', '', PARAM_TEXT),
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            $created = 0;
            foreach (pqcom_campaign_recipients($workspaceid, $audience) as $userid => $entry) {
                $user = $entry['user'];
                $DB->insert_record('local_prequran_comm_delivery', (object)[
                    'workspaceid' => $workspaceid,
                    'campaignid' => $campaignid,
                    'threadid' => 0,
                    'messageid' => 0,
                    'studentid' => 0,
                    'recipientid' => $userid,
                    'channel' => optional_param('channel', 'email', PARAM_ALPHANUMEXT),
                    'recipient_address' => (string)($user->email ?? ''),
                    'status' => 'queued',
                    'provider_response' => pqops_json(['audience_role' => $entry['role']]),
                    'sentat' => 0,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ]);
                $created++;
            }
            $notice = 'Campaign queued with ' . $created . ' delivery log row(s).';
        } else if ($action === 'save_consent' && $canmanage) {
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $guardianid = optional_param('guardianid', 0, PARAM_INT);
            $channel = optional_param('channel', 'email', PARAM_ALPHANUMEXT);
            $existing = $DB->get_record('local_prequran_comm_consent', pqcom_existing_consent_conditions($workspaceid, $studentid, $guardianid, $channel), '*', IGNORE_MISSING);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'guardianid' => $guardianid,
                'channel' => $channel,
                'consented' => optional_param('consented', 1, PARAM_INT) ? 1 : 0,
                'source' => optional_param('source', 'manual', PARAM_ALPHANUMEXT),
                'consent_source' => optional_param('source', 'manual', PARAM_ALPHANUMEXT),
                'student_messaging_enabled' => 1,
                'free_text_enabled' => 1,
                'parent_visible' => 1,
                'details' => optional_param('notes', '', PARAM_TEXT),
                'notes' => optional_param('notes', '', PARAM_TEXT),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_comm_consent', pqcom_existing_columns_record('local_prequran_comm_consent', $record));
            } else {
                $DB->insert_record('local_prequran_comm_consent', pqcom_existing_columns_record('local_prequran_comm_consent', $record));
            }
            $notice = 'Communication consent saved.';
        } else if ($action === 'save_case') {
            $caseid = optional_param('caseid', 0, PARAM_INT);
            $existing = $caseid > 0 ? $DB->get_record('local_prequran_comm_case', ['id' => $caseid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'studentid' => optional_param('studentid', (int)($existing->studentid ?? 0), PARAM_INT),
                'case_type' => optional_param('case_type', 'general', PARAM_ALPHANUMEXT),
                'priority' => optional_param('priority', 'normal', PARAM_ALPHANUMEXT),
                'status' => optional_param('status', 'open', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'summary' => optional_param('summary', '', PARAM_TEXT),
                'ownerid' => optional_param('ownerid', (int)$USER->id, PARAM_INT),
                'openedby' => (int)($existing->openedby ?? $USER->id),
                'closedby' => optional_param('status', 'open', PARAM_ALPHANUMEXT) === 'closed' ? (int)$USER->id : 0,
                'closedat' => optional_param('status', 'open', PARAM_ALPHANUMEXT) === 'closed' ? $now : 0,
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_comm_case', $record);
                $notice = 'Case updated.';
            } else {
                $DB->insert_record('local_prequran_comm_case', $record);
                $notice = 'Case opened.';
            }
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/communications_center.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Communications Center');
$PAGE->set_heading('Communications Center');

$students = pqops_workspace_users($workspaceid, 'student');
$parents = pqops_workspace_users($workspaceid, 'parent');
$teachers = pqops_workspace_users($workspaceid, 'teacher');
$templates = pqh_table_exists_safe('local_prequran_comm_template') ? array_values($DB->get_records('local_prequran_comm_template', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 80)) : [];
$campaigns = pqh_table_exists_safe('local_prequran_comm_campaign') ? array_values($DB->get_records('local_prequran_comm_campaign', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 60)) : [];
$deliveries = pqh_table_exists_safe('local_prequran_comm_delivery') ? array_values($DB->get_records('local_prequran_comm_delivery', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$consents = pqh_table_exists_safe('local_prequran_comm_consent') ? array_values($DB->get_records('local_prequran_comm_consent', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 80)) : [];
$cases = pqh_table_exists_safe('local_prequran_comm_case') ? array_values($DB->get_records('local_prequran_comm_case', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 80)) : [];
$threads = pqh_table_exists_safe('local_prequran_comm_thread') ? array_values($DB->get_records_sql("SELECT t.*, u.firstname, u.lastname FROM {local_prequran_comm_thread} t LEFT JOIN {user} u ON u.id = t.studentid WHERE t.workspaceid = :workspaceid ORDER BY t.lastmessageat DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$messages = pqh_table_exists_safe('local_prequran_comm_message') ? array_values($DB->get_records_sql("SELECT m.*, t.subject, t.workspaceid, u.firstname, u.lastname FROM {local_prequran_comm_message} m JOIN {local_prequran_comm_thread} t ON t.id = m.threadid LEFT JOIN {user} u ON u.id = m.senderid WHERE t.workspaceid = :workspaceid ORDER BY m.timecreated DESC", ['workspaceid' => $workspaceid], 0, 100)) : [];

echo $OUTPUT->header();
echo '<style>.pqcom{max-width:1180px;margin:0 auto}.pqcom-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqcom-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqcom-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqcom-field{margin-bottom:10px}.pqcom-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqcom-input,.pqcom-select,.pqcom-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqcom-textarea{min-height:74px}.pqcom-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqcom-btn--light{background:#f7fbf8;color:#173044}.pqcom-table{width:100%;border-collapse:collapse}.pqcom-table th,.pqcom-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqcom-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqcom-muted{color:#617064;font-size:12px}.pqcom-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqcom-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqcom-grid,.pqcom-top{display:block}}</style>';
echo '<div class="pqcom"><div class="pqcom-top"><div><h2>Communications Center</h2><div class="pqcom-muted">' . s($workspace->name) . ' messaging, announcements, templates, consent, delivery logs, and student case history.</div></div><a class="pqcom-btn pqcom-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqcom-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqcom-error">' . s($error) . '</div>'; }
if (!pqops_comm_tables_ready()) { echo '<div class="pqcom-error">Communications schema is not ready. Run Moodle upgrade.</div>'; }
echo '<div class="pqcom-grid"><section class="pqcom-panel"><h3>Message Thread</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="send_message"><div class="pqcom-field"><label>Student</label><select class="pqcom-select" name="studentid">';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(pqcom_name($student)) . '</option>'; }
echo '</select></div><div class="pqcom-field"><label>Parent</label><select class="pqcom-select" name="parentid"><option value="0">None</option>';
foreach ($parents as $parent) { echo '<option value="' . (int)$parent->id . '">' . s(pqcom_name($parent)) . '</option>'; }
echo '</select></div><div class="pqcom-field"><label>Teacher</label><select class="pqcom-select" name="teacherid"><option value="0">None</option>';
foreach ($teachers as $teacher) { echo '<option value="' . (int)$teacher->id . '">' . s(pqcom_name($teacher)) . '</option>'; }
echo '</select></div><div class="pqcom-field"><label>Case</label><select class="pqcom-select" name="caseid"><option value="0">No case</option>';
foreach ($cases as $case) { echo '<option value="' . (int)$case->id . '">' . s($case->title) . '</option>'; }
echo '</select></div><div class="pqcom-field"><label>Thread type</label><select class="pqcom-select" name="thread_type"><option value="parent_teacher">Parent / teacher</option><option value="student_support">Student support</option><option value="announcement">Announcement</option></select></div><div class="pqcom-field"><label>Subject</label><input class="pqcom-input" name="subject"></div><div class="pqcom-field"><label>Message</label><textarea class="pqcom-textarea" name="body"></textarea></div><button class="pqcom-btn" type="submit">Send Message</button></form><hr><h3>Case</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_case"><div class="pqcom-field"><label>Student</label><select class="pqcom-select" name="studentid">';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(pqcom_name($student)) . '</option>'; }
echo '</select></div>';
foreach ([['title','Title'],['case_type','Case type'],['priority','Priority'],['status','Status']] as $field) { echo '<div class="pqcom-field"><label>' . s($field[1]) . '</label><input class="pqcom-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqcom-field"><label>Owner</label><select class="pqcom-select" name="ownerid">';
foreach ($teachers as $teacher) { echo '<option value="' . (int)$teacher->id . '">' . s(pqcom_name($teacher)) . '</option>'; }
echo '</select></div><div class="pqcom-field"><label>Summary</label><textarea class="pqcom-textarea" name="summary"></textarea></div><button class="pqcom-btn" type="submit">Save Case</button></form>';
if ($canmanage) {
    echo '<hr><h3>Consent</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_consent"><div class="pqcom-field"><label>Student</label><select class="pqcom-select" name="studentid">';
    foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(pqcom_name($student)) . '</option>'; }
    echo '</select></div><div class="pqcom-field"><label>Guardian</label><select class="pqcom-select" name="guardianid">';
    foreach ($parents as $parent) { echo '<option value="' . (int)$parent->id . '">' . s(pqcom_name($parent)) . '</option>'; }
    echo '</select></div><div class="pqcom-field"><label>Channel</label><select class="pqcom-select" name="channel"><option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option></select></div><div class="pqcom-field"><label><input type="checkbox" name="consented" value="1" checked> Consented</label></div><div class="pqcom-field"><label>Source</label><input class="pqcom-input" name="source" value="manual"></div><div class="pqcom-field"><label>Notes</label><textarea class="pqcom-textarea" name="notes"></textarea></div><button class="pqcom-btn" type="submit">Save Consent</button></form>';
}
echo '</section><section class="pqcom-panel">';
if ($canmanage) {
    echo '<h3>Template</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_template">';
    foreach ([['templatekey','Template key'],['title','Title'],['subject','Subject'],['status','Status']] as $field) { echo '<div class="pqcom-field"><label>' . s($field[1]) . '</label><input class="pqcom-input" name="' . s($field[0]) . '"></div>'; }
    echo '<div class="pqcom-field"><label>Channel</label><select class="pqcom-select" name="channel"><option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option></select></div><div class="pqcom-field"><label>Body</label><textarea class="pqcom-textarea" name="body"></textarea></div><button class="pqcom-btn" type="submit">Save Template</button></form><hr><h3>Announcement Campaign</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_campaign"><div class="pqcom-field"><label>Title</label><input class="pqcom-input" name="title"></div><div class="pqcom-field"><label>Template</label><select class="pqcom-select" name="templateid"><option value="0">No template</option>';
    foreach ($templates as $template) { echo '<option value="' . (int)$template->id . '">' . s($template->title) . '</option>'; }
    echo '</select></div><div class="pqcom-field"><label>Channel</label><select class="pqcom-select" name="channel"><option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option></select></div><div class="pqcom-field"><label>Audience</label><select class="pqcom-select" name="audience"><option value="parents">Parents</option><option value="students">Students</option><option value="teachers">Teachers</option><option value="all">All</option></select></div><div class="pqcom-field"><label>Status</label><input class="pqcom-input" name="status" value="queued"></div><div class="pqcom-field"><label>Scheduled date</label><input class="pqcom-input" name="scheduled_date"></div><div class="pqcom-field"><label>Scheduled time HH:MM</label><input class="pqcom-input" name="scheduled_time"></div><div class="pqcom-field"><label>Message body</label><textarea class="pqcom-textarea" name="messagebody"></textarea></div><button class="pqcom-btn" type="submit">Queue Campaign</button></form><hr>';
}
echo '<h3>Student Thread History</h3><table class="pqcom-table"><thead><tr><th>Thread</th><th>Student</th><th>Status</th></tr></thead><tbody>';
foreach ($threads as $thread) { echo '<tr><td><strong>' . s($thread->subject) . '</strong><div class="pqcom-muted">' . s($thread->type) . ' / ' . s(userdate((int)$thread->lastmessageat)) . '</div></td><td>' . s(trim($thread->firstname . ' ' . $thread->lastname)) . '</td><td><span class="pqcom-pill">' . s($thread->status) . '</span></td></tr>'; }
if (!$threads) { echo '<tr><td colspan="3" class="pqcom-muted">No message threads yet.</td></tr>'; }
echo '</tbody></table><h3>Recent Messages</h3><table class="pqcom-table"><thead><tr><th>Subject</th><th>Sender</th><th>Message</th></tr></thead><tbody>';
foreach ($messages as $message) { echo '<tr><td>' . s($message->subject) . '<div class="pqcom-muted">' . s(userdate((int)$message->timecreated)) . '</div></td><td>' . s(trim($message->firstname . ' ' . $message->lastname)) . '</td><td>' . s(core_text::substr($message->body, 0, 180)) . '</td></tr>'; }
if (!$messages) { echo '<tr><td colspan="3" class="pqcom-muted">No messages yet.</td></tr>'; }
echo '</tbody></table><h3>Campaigns</h3><table class="pqcom-table"><thead><tr><th>Campaign</th><th>Audience</th><th>Status</th></tr></thead><tbody>';
foreach ($campaigns as $campaign) { echo '<tr><td>' . s($campaign->title) . '<div class="pqcom-muted">' . s($campaign->channel) . '</div></td><td>' . s($campaign->audience) . '</td><td><span class="pqcom-pill">' . s($campaign->status) . '</span></td></tr>'; }
if (!$campaigns) { echo '<tr><td colspan="3" class="pqcom-muted">No campaigns yet.</td></tr>'; }
echo '</tbody></table><h3>Delivery Logs</h3><table class="pqcom-table"><thead><tr><th>Recipient</th><th>Channel</th><th>Status</th></tr></thead><tbody>';
foreach ($deliveries as $delivery) { echo '<tr><td>User #' . (int)$delivery->recipientid . '<div class="pqcom-muted">' . s($delivery->recipient_address) . '</div></td><td>' . s($delivery->channel) . '</td><td><span class="pqcom-pill">' . s($delivery->status) . '</span></td></tr>'; }
if (!$deliveries) { echo '<tr><td colspan="3" class="pqcom-muted">No delivery logs yet.</td></tr>'; }
echo '</tbody></table><h3>Consent Records</h3><table class="pqcom-table"><thead><tr><th>Student</th><th>Guardian</th><th>Consent</th></tr></thead><tbody>';
foreach ($consents as $consent) { echo '<tr><td>User #' . (int)$consent->studentid . '</td><td>User #' . (int)$consent->guardianid . '</td><td><span class="pqcom-pill">' . ((int)$consent->consented ? 'consented' : 'declined') . '</span><div class="pqcom-muted">' . s($consent->channel) . '</div></td></tr>'; }
if (!$consents) { echo '<tr><td colspan="3" class="pqcom-muted">No consent records yet.</td></tr>'; }
echo '</tbody></table><h3>Cases</h3><table class="pqcom-table"><thead><tr><th>Case</th><th>Student</th><th>Status</th></tr></thead><tbody>';
foreach ($cases as $case) { echo '<tr><td><strong>' . s($case->title) . '</strong><div class="pqcom-muted">' . s($case->case_type . ' / ' . $case->priority) . '</div></td><td>User #' . (int)$case->studentid . '</td><td><span class="pqcom-pill">' . s($case->status) . '</span></td></tr>'; }
if (!$cases) { echo '<tr><td colspan="3" class="pqcom-muted">No cases yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
