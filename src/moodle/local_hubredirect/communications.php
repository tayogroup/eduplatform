<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once($CFG->libdir . '/externallib.php');

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$contextparams = [];
if (!empty($consumercontext->consumerslug)) {
    $contextparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $contextparams['workspaceid'] = $workspaceid;
}
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';
$cohortid = optional_param('cohortid', 0, PARAM_INT);
$studentid = optional_param('studentid', optional_param('childid', 0, PARAM_INT), PARAM_INT);
$tab = optional_param('tab', '', PARAM_ALPHANUMEXT);
$opencomm = optional_param('opencomm', '', PARAM_ALPHANUMEXT);
$threadid = optional_param('threadid', 0, PARAM_INT);
if ($opencomm === '') {
    $opencomm = $tab;
}
if ($opencomm === 'message') {
    $opencomm = 'messages';
}
if ($opencomm === 'announcement') {
    $opencomm = 'announcements';
}
if (!in_array($opencomm, ['messages', 'announcements'], true)) {
    $opencomm = 'messages';
}

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/communications.php', $contextparams + [
    'cohortid' => $cohortid,
    'studentid' => $studentid,
    'opencomm' => $opencomm,
    'threadid' => $threadid,
]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brandname . ' Communications');
$PAGE->set_heading($brandname . ' Communications');
$PAGE->add_body_class('pqh-comm-standalone-page');

function pqh_comm_context_url(string $path, array $contextparams, array $params = []): moodle_url {
    return new moodle_url($path, $contextparams + $params);
}

function pqh_comm_current_user_ws_token(string $fallback = ''): string {
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

function pqh_comm_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqh_comm_student_in_workspace(int $workspaceid, int $studentid): bool {
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

function pqh_comm_direct_tables_ready(): bool {
    return pqh_comm_table_exists('local_prequran_comm_thread')
        && pqh_comm_table_exists('local_prequran_comm_participant')
        && pqh_comm_table_exists('local_prequran_comm_message');
}

function pqh_comm_direct_can_read($thread, int $userid, int $workspaceid = 0): bool {
    global $DB;
    if (!$thread || empty($thread->id) || $userid <= 0) {
        return false;
    }
    if (!pqh_comm_student_in_workspace($workspaceid, (int)($thread->studentid ?? 0))) {
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

function pqh_comm_direct_can_reply($thread, int $userid): bool {
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

function pqh_comm_direct_clean_body(string $body, int $max = 1000): string {
    $body = trim($body);
    if (core_text::strlen($body) > $max) {
        $body = core_text::substr($body, 0, $max);
    }
    return clean_param($body, PARAM_TEXT);
}

function pqh_comm_direct_user_name(int $userid): string {
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

$wstoken = pqh_comm_current_user_ws_token((string)get_config('local_prequran', 'ws_token'));
$cdnbase = pqh_shared_resource_cdn_base_url();
$assetpath = optional_param('assetpath', '', PARAM_ALPHANUMEXT);
if ($assetpath === 'staging') {
    $assetbase = rtrim($cdnbase, '/') . '/pre_quraan_staging';
} else {
    $assetbase = rtrim($cdnbase, '/') . '/pre_quraan';
}
$cachekey = 'comm-marketplace-thread-scope-20260621a';
$wsendpoint = rtrim((string)$CFG->wwwroot, '/') . '/webservice/rest/server.php';
$commts = time();
$commscope = $studentid > 0 ? $studentid : 0;
$commsecret = (string)($CFG->passwordsaltmain ?? '') . '|' . (string)get_config('local_prequran', 'ws_token');
$commsig = hash_hmac('sha256', (int)$USER->id . '|' . $commscope . '|' . $commts, $commsecret);

$directthread = null;
$directmessages = [];
$directthreads = [];
$directerror = '';
$directcanreply = false;
$directnotice = '';

if ($threadid > 0) {
    if (!pqh_comm_direct_tables_ready()) {
        $directerror = 'Communication tables are not ready yet.';
    } else {
        $directthread = $DB->get_record('local_prequran_comm_thread', ['id' => $threadid], '*', IGNORE_MISSING);
        if (!$directthread || !pqh_comm_direct_can_read($directthread, (int)$USER->id, $workspaceid)) {
            $directthread = null;
            $directerror = 'You cannot read this communication thread.';
        } else {
            $directcanreply = pqh_comm_direct_can_reply($directthread, (int)$USER->id);
            if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('comm_action', '', PARAM_ALPHANUMEXT) === 'reply') {
                if (!confirm_sesskey()) {
                    pqh_access_denied(
                        'Your security token expired. Open the message thread again before sending a reply.',
                        pqh_comm_context_url('/local/hubredirect/communications.php', $contextparams, [
                            'threadid' => (int)$directthread->id,
                            'opencomm' => 'messages',
                        ]),
                        'Message reply expired'
                    );
                }
                if (!$directcanreply) {
                    $directerror = 'You cannot reply to this communication thread.';
                } else {
                    $replybody = pqh_comm_direct_clean_body((string)optional_param('replybody', '', PARAM_RAW));
                    if ($replybody === '') {
                        $directerror = 'Type a message first.';
                    } else {
                        $now = time();
                        $transaction = $DB->start_delegated_transaction();
                        $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
                            'threadid' => (int)$directthread->id,
                            'senderid' => (int)$USER->id,
                            'studentid' => empty($directthread->studentid) ? null : (int)$directthread->studentid,
                            'messagekind' => 'text',
                            'body' => $replybody,
                            'templatekey' => '',
                            'status' => 'visible',
                            'moderationflags' => '',
                            'timecreated' => $now,
                            'timemodified' => $now,
                        ]);
                        $directthread->lastmessageat = $now;
                        $directthread->timemodified = $now;
                        $DB->update_record('local_prequran_comm_thread', $directthread);
                        $participant = $DB->get_record('local_prequran_comm_participant', [
                            'threadid' => (int)$directthread->id,
                            'userid' => (int)$USER->id,
                        ]);
                        if ($participant) {
                            $participant->lastreadmessageid = $messageid;
                            $participant->timemodified = $now;
                            $DB->update_record('local_prequran_comm_participant', $participant);
                        }
                        if (pqh_comm_table_exists('local_prequran_comm_audit')) {
                            $DB->insert_record('local_prequran_comm_audit', (object)[
                                'threadid' => (int)$directthread->id,
                                'messageid' => $messageid,
                                'actorid' => (int)$USER->id,
                                'action' => 'created',
                                'details' => json_encode(['type' => (string)$directthread->type, 'reply' => true, 'source' => 'communications_direct']),
                                'timecreated' => $now,
                            ]);
                        }
                        $transaction->allow_commit();
                        redirect(pqh_comm_context_url('/local/hubredirect/communications.php', $contextparams, [
                            'threadid' => (int)$directthread->id,
                            'opencomm' => 'messages',
                            'sent' => 1,
                        ]));
                    }
                }
            }
            $directnotice = optional_param('sent', 0, PARAM_INT) ? 'Message sent.' : '';
            $directmessages = $DB->get_records_sql(
                "SELECT *
                   FROM {local_prequran_comm_message}
                  WHERE threadid = :threadid
                    AND status = :status
               ORDER BY timecreated ASC, id ASC",
                ['threadid' => (int)$directthread->id, 'status' => 'visible'],
                0,
                100
            );
        }
    }
} else if ($opencomm === 'messages') {
    if (!pqh_comm_direct_tables_ready()) {
        $directerror = 'Communication tables are not ready yet.';
    } else {
        $candidateleads = $DB->get_records_sql(
            "SELECT t.*
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = :userid
                AND t.type = :type
                AND t.status <> :archived
           ORDER BY t.lastmessageat DESC, t.id DESC",
            [
                'userid' => (int)$USER->id,
                'type' => 'parent_teacher',
                'archived' => 'archived',
            ],
            0,
            100
        );
        foreach ($candidateleads as $candidate) {
            if (pqh_comm_direct_can_read($candidate, (int)$USER->id, $workspaceid)) {
                $directthreads[(int)$candidate->id] = $candidate;
            }
        }
    }
}

echo $OUTPUT->header();
?>
<link rel="stylesheet" href="<?php echo s($assetbase); ?>/shared/css/communications.css?v=<?php echo s($cachekey); ?>">
<style>
body.pqh-comm-standalone-page header,
body.pqh-comm-standalone-page nav.navbar,
body.pqh-comm-standalone-page #page-header,
body.pqh-comm-standalone-page #page-footer,
body.pqh-comm-standalone-page .navbar,
body.pqh-comm-standalone-page .primary-navigation,
body.pqh-comm-standalone-page .secondary-navigation,
body.pqh-comm-standalone-page .drawer-toggles,
body.pqh-comm-standalone-page [data-region="drawer"],
body.pqh-comm-standalone-page [data-region="right-hand-drawer"],
body.pqh-comm-standalone-page [data-region="popover-region-container"],
body.pqh-comm-standalone-page .footer-popover,
body.pqh-comm-standalone-page .btn-footer-popover,
body.pqh-comm-standalone-page .floating-buttons,
body.pqh-comm-standalone-page .block-region,
body.pqh-comm-standalone-page .block-region-side-pre,
body.pqh-comm-standalone-page .block-region-side-post {
  display: none !important;
}
body.pqh-comm-standalone-page #page,
body.pqh-comm-standalone-page #page-content,
body.pqh-comm-standalone-page #region-main,
body.pqh-comm-standalone-page .main-inner {
  margin: 0 !important;
  padding: 0 !important;
  max-width: none !important;
}
body.pqh-comm-standalone-page {
  --qa-ink: #1f2f25;
  --qa-muted: #60725d;
  --qa-brown: #735238;
  --qa-brown-dark: #503725;
  --qa-green: #2f6f4e;
  --qa-green-dark: #24593e;
  --qa-mint: #effbea;
  --qa-cream: #fff8ea;
  --qa-line: rgba(80, 55, 37, .12);
  background:
    linear-gradient(180deg, rgba(239, 251, 234, .9), rgba(248, 250, 246, .9) 220px),
    #f7faf5;
}
.pqh-comm-host {
  min-height: 100vh;
  padding: 0 18px 56px;
  background:
    radial-gradient(circle at 18% 0%, rgba(223, 244, 213, .55), transparent 30%),
    linear-gradient(180deg, #f0fbe9 0, #f7faf5 230px, #f4f7f3 100%);
  color: var(--qa-ink);
  font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-host__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: min(50vw, 900px);
  min-width: 620px;
  margin: 0 auto;
  padding: 28px 0 20px;
}
.pqh-comm-host__title {
  margin: 0;
  color: var(--qa-brown-dark);
  letter-spacing: 0;
  font: 950 28px/1.12 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-host__back {
  min-height: 38px;
  padding: 0 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #fff;
  color: var(--qa-brown-dark) !important;
  border: 1px solid var(--qa-line);
  box-shadow: 0 6px 16px rgba(80, 55, 37, .08);
  text-decoration: none;
  font: 900 14px/1 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-host__back:hover {
  background: var(--qa-cream);
  text-decoration: none;
}
.pqh-comm-host__empty {
  margin: 42px auto;
  max-width: 720px;
  padding: 28px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--qa-line);
  color: var(--qa-muted);
  box-shadow: 0 18px 42px rgba(80, 55, 37, .08);
  font: 800 15px/1.45 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-host__status[hidden] {
  display: none !important;
}
.pqh-comm-host__status {
  margin: 22px auto 0;
  max-width: 760px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid rgba(18, 48, 71, .14);
  color: #4d6474;
  font: 800 13px/1.45 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-direct {
  width: min(50vw, 900px);
  min-width: 620px;
  margin: 0 auto 26px;
  border-radius: 12px;
  background: rgba(255, 255, 255, .96);
  border: 1px solid var(--qa-line);
  box-shadow: 0 22px 54px rgba(80, 55, 37, .10);
  overflow: hidden;
  color: var(--qa-ink);
  font: 800 14px/1.45 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-direct__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 26px;
  background:
    linear-gradient(135deg, rgba(255, 248, 234, .92), rgba(239, 251, 234, .92)),
    #fff;
  border-bottom: 1px solid var(--qa-line);
}
.pqh-comm-direct__title {
  margin: 0;
  color: var(--qa-brown-dark);
  letter-spacing: 0;
  font: 950 24px/1.16 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-direct__meta {
  margin-top: 6px;
  color: var(--qa-muted);
  font-size: 13px;
  font-weight: 900;
}
.pqh-comm-direct__notice {
  margin: 16px 24px 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--qa-mint);
  color: var(--qa-green-dark);
  border: 1px solid rgba(47, 111, 78, .16);
}
.pqh-comm-direct__error {
  margin: 22px auto;
  width: min(760px, calc(100vw - 32px));
  padding: 14px 16px;
  border-radius: 8px;
  background: #fff1ef;
  color: #8a332b;
  border: 1px solid rgba(138, 51, 43, .16);
  font: 900 14px/1.45 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-direct__messages {
  padding: 24px 26px;
  display: grid;
  gap: 14px;
  background: #fbfdf9;
}
.pqh-comm-direct__message {
  max-width: 78%;
  padding: 13px 15px;
  border-radius: 12px 12px 12px 4px;
  background: #fff;
  border: 1px solid var(--qa-line);
  box-shadow: 0 10px 22px rgba(80, 55, 37, .06);
}
.pqh-comm-direct__message--mine {
  justify-self: end;
  border-radius: 12px 12px 4px 12px;
  background: var(--qa-green);
  border-color: rgba(47, 111, 78, .22);
  color: #fff;
}
.pqh-comm-direct__message-meta {
  color: var(--qa-muted);
  font-size: 12px;
  margin-bottom: 6px;
  font-weight: 950;
}
.pqh-comm-direct__message--mine .pqh-comm-direct__message-meta {
  color: rgba(255, 255, 255, .82);
}
.pqh-comm-direct__message-body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-weight: 780;
}
.pqh-comm-direct__reply {
  padding: 20px 26px 24px;
  border-top: 1px solid var(--qa-line);
  display: grid;
  gap: 10px;
  background: #fff;
}
.pqh-comm-direct__reply label {
  color: var(--qa-brown-dark);
  font-size: 13px;
  font-weight: 950;
}
.pqh-comm-direct__reply textarea {
  width: 100%;
  min-height: 110px;
  resize: vertical;
  border-radius: 8px;
  border: 1px solid rgba(80, 55, 37, .18);
  padding: 10px 12px;
  color: var(--qa-ink);
  font: 800 14px/1.45 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-direct__reply textarea:focus {
  border-color: var(--qa-green);
  box-shadow: 0 0 0 3px rgba(47, 111, 78, .14);
  outline: none;
}
.pqh-comm-direct__reply button {
  justify-self: start;
  border: 0;
  border-radius: 8px;
  background: var(--qa-brown);
  color: #fff;
  padding: 11px 16px;
  font: 950 14px/1 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  box-shadow: 0 8px 18px rgba(115, 82, 56, .18);
}
.pqh-comm-direct__reply button:hover {
  background: var(--qa-brown-dark);
}
.pqh-comm-direct__thread-list {
  padding: 20px 26px 26px;
  display: grid;
  gap: 12px;
  background: #fbfdf9;
}
.pqh-comm-direct__thread {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--qa-line);
  color: var(--qa-ink) !important;
  text-decoration: none;
  box-shadow: 0 8px 18px rgba(80, 55, 37, .05);
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease, background .16s ease;
}
.pqh-comm-direct__thread:hover {
  background: var(--qa-mint);
  border-color: rgba(47, 111, 78, .24);
  box-shadow: 0 14px 28px rgba(80, 55, 37, .09);
  transform: translateY(-1px);
  text-decoration: none;
}
.pqh-comm-direct__thread-badge {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--qa-green);
  color: #fff;
  font-size: 13px;
  font-weight: 950;
}
.pqh-comm-direct__thread-main {
  min-width: 0;
}
.pqh-comm-direct__thread strong {
  display: block;
  margin-bottom: 4px;
  font-size: 16px;
  color: var(--qa-brown-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pqh-comm-direct__thread span {
  display: block;
  color: var(--qa-muted);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pqh-comm-direct__thread-time {
  min-width: 92px;
  padding: 7px 9px;
  border-radius: 999px;
  background: var(--qa-cream);
  color: var(--qa-brown) !important;
  font-size: 12px !important;
  font-weight: 950;
  text-align: center;
  white-space: nowrap !important;
}
.pqh-comm-direct__empty {
  max-width: none;
  padding: 26px;
  text-align: center;
  border-style: dashed;
  background:
    linear-gradient(135deg, rgba(255, 248, 234, .78), rgba(239, 251, 234, .78)),
    #fff;
  color: var(--qa-brown-dark);
}
.pqh-comm-direct__empty strong,
.pqh-comm-direct__empty span {
  display: block;
}
.pqh-comm-direct__empty span {
  margin-top: 6px;
  color: var(--qa-muted);
  font-size: 13px;
}
body.pqh-comm-standalone-page .pq-comm-panel__scrim {
  display: none;
}
body.pqh-comm-standalone-page .pq-comm-panel__sheet {
  top: 76px;
  right: 50%;
  transform: translateX(50%);
  bottom: 18px;
  width: min(50vw, 900px);
  min-width: 620px;
  box-shadow: 0 18px 40px rgba(23, 50, 74, .16);
}
body.pqh-comm-standalone-page .pq-comm-panel__close {
  display: none;
}
@media(max-width: 760px) {
  .pqh-comm-host {
    padding: 0 12px 40px;
  }
  .pqh-comm-host__bar {
    align-items: flex-start;
    width: 100%;
    min-width: 0;
    padding: 20px 0 14px;
  }
  .pqh-comm-host__title {
    font-size: 24px;
  }
  .pqh-comm-direct {
    width: 100%;
    min-width: 0;
  }
  .pqh-comm-direct__head {
    display: block;
    padding: 20px;
  }
  .pqh-comm-direct__messages,
  .pqh-comm-direct__thread-list,
  .pqh-comm-direct__reply {
    padding-left: 16px;
    padding-right: 16px;
  }
  .pqh-comm-direct__message {
    max-width: 92%;
  }
  .pqh-comm-direct__thread {
    grid-template-columns: 40px minmax(0, 1fr);
  }
  .pqh-comm-direct__thread-time {
    grid-column: 2;
    justify-self: start;
    margin-top: -4px;
  }
  body.pqh-comm-standalone-page .pq-comm-panel__sheet {
    top: 70px;
    right: 0;
    left: 0;
    transform: none;
    bottom: 0;
    width: auto;
    min-width: 0;
    height: auto;
    border-radius: 8px 8px 0 0;
  }
}
</style>
<main class="pqh-comm-host">
  <div class="pqh-comm-host__bar">
    <h1 class="pqh-comm-host__title"><?php echo s($brandname); ?> Communications</h1>
    <a class="pqh-comm-host__back" href="<?php echo pqh_comm_context_url($workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $contextparams)->out(false); ?>">Back to dashboard</a>
  </div>
  <?php if ($wstoken === ''): ?>
    <div class="pqh-comm-host__empty">
      Communications are not ready for this account. Please check that this parent, student, or teacher has a linked communication relationship.
    </div>
  <?php else: ?>
    <div id="pqHeaderActionSlot" hidden></div>
    <?php if ($threadid > 0): ?>
      <?php if ($directthread): ?>
        <section class="pqh-comm-direct" aria-labelledby="pqhCommDirectTitle">
          <div class="pqh-comm-direct__head">
            <h2 id="pqhCommDirectTitle" class="pqh-comm-direct__title"><?php echo s((string)$directthread->subject ?: 'Message thread'); ?></h2>
            <div class="pqh-comm-direct__meta">
              <?php echo s((string)$directthread->type === 'parent_teacher' ? 'Parent-teacher message' : 'Communication thread'); ?>
              <?php if (!empty($directthread->lastmessageat)): ?> &middot; <?php echo userdate((int)$directthread->lastmessageat); ?><?php endif; ?>
            </div>
          </div>
          <?php if ($directnotice !== ''): ?><div class="pqh-comm-direct__notice"><?php echo s($directnotice); ?></div><?php endif; ?>
          <?php if ($directerror !== ''): ?><div class="pqh-comm-direct__error"><?php echo s($directerror); ?></div><?php endif; ?>
          <div class="pqh-comm-direct__messages">
            <?php if (!$directmessages): ?>
              <div class="pqh-comm-direct__message">No messages are visible in this thread yet.</div>
            <?php else: ?>
              <?php foreach ($directmessages as $directmessage): ?>
                <?php $mine = (int)$directmessage->senderid === (int)$USER->id; ?>
                <article class="pqh-comm-direct__message<?php echo $mine ? ' pqh-comm-direct__message--mine' : ''; ?>">
                  <div class="pqh-comm-direct__message-meta">
                    <?php echo s(pqh_comm_direct_user_name((int)$directmessage->senderid)); ?>
                    &middot; <?php echo userdate((int)$directmessage->timecreated); ?>
                  </div>
                  <div class="pqh-comm-direct__message-body"><?php echo s((string)$directmessage->body); ?></div>
                </article>
              <?php endforeach; ?>
            <?php endif; ?>
          </div>
          <?php if ($directcanreply): ?>
            <form class="pqh-comm-direct__reply" method="post" action="<?php echo pqh_comm_context_url('/local/hubredirect/communications.php', $contextparams, ['threadid' => (int)$directthread->id, 'opencomm' => 'messages'])->out(false); ?>">
              <input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>">
              <input type="hidden" name="comm_action" value="reply">
              <label for="pqhCommReply">Reply</label>
              <textarea id="pqhCommReply" name="replybody" maxlength="1000" required></textarea>
              <button type="submit">Send reply</button>
            </form>
          <?php endif; ?>
        </section>
      <?php else: ?>
        <div class="pqh-comm-direct__error"><?php echo s($directerror ?: 'This communication thread could not be loaded.'); ?></div>
      <?php endif; ?>
    <?php elseif ($opencomm === 'messages'): ?>
      <section class="pqh-comm-direct" aria-labelledby="pqhCommThreadListTitle">
        <div class="pqh-comm-direct__head">
          <h2 id="pqhCommThreadListTitle" class="pqh-comm-direct__title">Messages</h2>
          <div class="pqh-comm-direct__meta">Parent-teacher and independent teacher conversations</div>
        </div>
        <?php if ($directerror !== ''): ?>
          <div class="pqh-comm-direct__error"><?php echo s($directerror); ?></div>
        <?php elseif (!$directthreads): ?>
          <div class="pqh-comm-direct__messages">
            <div class="pqh-comm-direct__message pqh-comm-direct__empty">
              <strong>No messages yet.</strong>
              <span>When a parent or teacher starts a marketplace conversation, it will appear here.</span>
            </div>
          </div>
        <?php else: ?>
          <div class="pqh-comm-direct__thread-list">
            <?php foreach ($directthreads as $thread): ?>
              <?php
                $lastmessage = $DB->get_record_sql(
                    "SELECT body, timecreated
                       FROM {local_prequran_comm_message}
                      WHERE threadid = :threadid
                        AND status = :status
                   ORDER BY timecreated DESC, id DESC",
                    ['threadid' => (int)$thread->id, 'status' => 'visible'],
                    IGNORE_MULTIPLE
                );
                $threadurl = pqh_comm_context_url('/local/hubredirect/communications.php', $contextparams, ['threadid' => (int)$thread->id, 'opencomm' => 'messages']);
              ?>
              <a class="pqh-comm-direct__thread" href="<?php echo $threadurl->out(false); ?>">
                <span class="pqh-comm-direct__thread-badge">QA</span>
                <span class="pqh-comm-direct__thread-main">
                  <strong><?php echo s((string)$thread->subject ?: 'Message thread'); ?></strong>
                  <span><?php echo $lastmessage ? s(core_text::substr((string)$lastmessage->body, 0, 140)) : 'Open thread'; ?></span>
                </span>
                <span class="pqh-comm-direct__thread-time"><?php echo !empty($thread->lastmessageat) ? userdate((int)$thread->lastmessageat, '%e %b') : 'Open'; ?></span>
              </a>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </section>
    <?php else: ?>
      <div id="pqCommStandaloneStatus" class="pqh-comm-host__status">Loading communications...</div>
    <?php endif; ?>
  <?php endif; ?>
</main>
<?php if ($wstoken !== '' && $threadid <= 0 && $opencomm !== 'messages'): ?>
<script>
window.__prequran_ws_token = <?php echo json_encode($wstoken); ?>;
window.__prequran_ws_endpoint = <?php echo json_encode($wsendpoint); ?>;
window.__prequran_uid = <?php echo (int)$USER->id; ?>;
window.__prequran_cohortid = <?php echo (int)$cohortid; ?>;
window.__prequran_studentid = <?php echo (int)$studentid; ?>;
window.__prequran_open_threadid = <?php echo (int)$threadid; ?>;
window.__prequran_comm_force_thread_scope = <?php echo ($threadid > 0 && $studentid <= 0) ? 'true' : 'false'; ?>;
window.__prequran_comm_ignore_stored_scope = <?php echo ($cohortid <= 0 && $studentid <= 0) ? 'true' : 'false'; ?>;
window.__prequran_managed_student = '0';
window.__prequran_comm_asset_base = <?php echo json_encode($assetbase); ?>;
window.__prequran_comm_actorid = <?php echo (int)$USER->id; ?>;
window.__prequran_comm_scope_studentid = <?php echo (int)$commscope; ?>;
window.__prequran_comm_ts = <?php echo (int)$commts; ?>;
window.__prequran_comm_sig = <?php echo json_encode($commsig); ?>;
if (window.__prequran_comm_force_thread_scope || window.__prequran_comm_ignore_stored_scope) {
  try {
    sessionStorage.removeItem('pq_studentid');
    sessionStorage.removeItem('pq_childid');
    sessionStorage.removeItem('pq_cohortid');
    sessionStorage.removeItem('pq_cohort_id');
  } catch (e) {}
}
if (!new URLSearchParams(window.location.search).get('opencomm')) {
  const url = new URL(window.location.href);
  url.searchParams.set('opencomm', <?php echo json_encode($opencomm); ?>);
  window.history.replaceState(null, '', url.toString());
}
</script>
<script src="<?php echo s($assetbase); ?>/shared/js/shared-communications-panel.js?v=<?php echo s($cachekey); ?>"></script>
<script>
(function() {
  var status = document.getElementById('pqCommStandaloneStatus');
  function show(message) {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
  }
  function hide() {
    if (status) status.hidden = true;
  }
  var tab = <?php echo json_encode($opencomm === 'messages' ? 'parent_teacher' : 'announcement'); ?>;
  if (!window.PQAnnouncementsPanel) {
    show('Communications script did not load from ' + (window.__prequran_comm_asset_base || 'the CDN') + '. Refresh the page after clearing cache, or confirm the Bunny staging assets are reachable.');
    return;
  }
  try {
    window.PQAnnouncementsPanel.open(tab);
    setTimeout(function() {
      var panel = document.getElementById('pqAnnouncementsPanel');
      if (!panel || panel.hidden) {
        show('Communications loaded, but the panel did not open. Please refresh once; if this remains, check the browser console for a JavaScript error.');
        return;
      }
      hide();
    }, 700);
  } catch (error) {
    show(error && error.message ? error.message : 'Unable to open communications.');
  }
})();
</script>
<?php endif; ?>
<?php
echo $OUTPUT->footer();
