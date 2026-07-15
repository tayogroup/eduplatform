<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$sessionid = optional_param('sessionid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
$requestedstudentid = optional_param('studentid', optional_param('childid', 0, PARAM_INT), PARAM_INT);
$embed = optional_param('embed', 0, PARAM_BOOL);
$panel = optional_param('panel', 0, PARAM_BOOL);
$floating = optional_param('floating', 0, PARAM_BOOL);
$popup = optional_param('popup', 0, PARAM_BOOL);
$launch = optional_param('launch', 0, PARAM_BOOL);

// Older BBB welcome links used popup=1&floating=1. When those links open as a
// browser tab, they cannot actually float over BBB, so render the compact popup
// layout instead of a misleading full-page dimmed overlay.
if ($popup) {
    $floating = false;
}

$returnurlraw = optional_param('returnurl', '', PARAM_LOCALURL);
$safecloseurl = new moodle_url($workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/live_sessions.php', $urlparams);
$returnurl = $returnurlraw !== ''
    ? new moodle_url($returnurlraw)
    : $safecloseurl;

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(pqlvt_url('/local/hubredirect/live_virtual_tutor.php', $urlparams, [
    'sessionid' => $sessionid,
    'studentid' => $requestedstudentid,
    'embed' => $embed ? 1 : 0,
    'panel' => $panel ? 1 : 0,
    'floating' => $floating ? 1 : 0,
    'popup' => $popup ? 1 : 0,
    'launch' => $launch ? 1 : 0,
]));
$PAGE->set_pagelayout(($embed || $popup) ? 'embedded' : 'popup');
$PAGE->set_title('Virtual Tutor');
$PAGE->set_heading('Virtual Tutor');
$PAGE->add_body_class('pqh-live-virtual-tutor-page');

if ($embed && !headers_sent()) {
    @header_remove('X-Frame-Options');
    $frameancestors = [rtrim((string)$CFG->wwwroot, '/')];
    foreach (pqh_resource_allowed_origins() as $origin) {
        $frameancestors[] = $origin;
    }
    if (pqh_consumer_schema_ready() && (int)($consumercontext->consumerid ?? 0) > 0) {
        $domains = $DB->get_records('local_prequran_consumer_domain', [
            'consumerid' => (int)$consumercontext->consumerid,
            'status' => 'active',
        ], '', 'domain');
        foreach ($domains as $domain) {
            $host = trim((string)($domain->domain ?? ''));
            if ($host !== '') {
                $frameancestors[] = 'https://' . $host;
            }
        }
    }
    @header('Content-Security-Policy: frame-ancestors ' . implode(' ', array_values(array_unique(array_filter($frameancestors)))));
}

function pqlvt_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqlvt_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

function pqlvt_can_access_student(int $studentid, int $userid): bool {
    global $DB;
    if ($studentid <= 0 || $userid <= 0) {
        return false;
    }
    if ($studentid === $userid || pqh_can_manage_academy_operations($userid)) {
        return true;
    }
    if (pqlvt_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $userid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlvt_table_exists('local_prequran_live_consent')
        && $DB->record_exists('local_prequran_live_consent', ['guardianid' => $userid, 'studentid' => $studentid])) {
        return true;
    }
    return pqlvt_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'studentid' => $studentid, 'status' => 'active']);
}

function pqlvt_virtual_tutor_tables_ready(): bool {
    return pqlvt_table_exists('local_prequran_vt_session') && pqlvt_table_exists('local_prequran_vt_message');
}

function pqlvt_safe_key(string $value, int $max = 100): string {
    $value = clean_param(trim($value), PARAM_ALPHANUMEXT);
    return core_text::substr($value, 0, $max);
}

function pqlvt_unit_help(string $unitid): array {
    $units = [
        'alphabet_listen' => [
            'title' => 'Alphabet Listen',
            'focus' => 'Arabic letters by name, sound, shape, dots, and writing direction.',
            'tip' => 'Name the letter first, check its dots and shape, then say the sound slowly three times.',
        ],
        'joint_connecting_forms' => [
            'title' => 'Connection Forms',
            'focus' => 'How Arabic letters change at the beginning, middle, end, or alone.',
            'tip' => 'First identify the base letter. Then ask whether it is alone, initial, medial, or final.',
        ],
        'harakat_listen' => [
            'title' => 'Harakat Listen',
            'focus' => 'Short vowel marks: fatha, kasra, and damma.',
            'tip' => 'Read the letter first, then read the mark: fatha is a, kasra is i, and damma is u.',
        ],
        'madd_listen' => [
            'title' => 'Madd',
            'focus' => 'Long vowel stretching.',
            'tip' => 'Compare the short sound with the stretched sound. Hold only as long as the rule asks.',
        ],
        'sakoon_jazm_listen' => [
            'title' => 'Sukoon and Jazm',
            'focus' => 'A consonant with no vowel after it.',
            'tip' => 'Stop the letter cleanly. Do not add a hidden a, i, or u sound after it.',
        ],
        'tanween_listen' => [
            'title' => 'Tanween',
            'focus' => 'Double vowel marks that add an n sound.',
            'tip' => 'Say the vowel first, then add the light ending n sound.',
        ],
        'tashdeed_shaddah_listen' => [
            'title' => 'Tashdeed and Shaddah',
            'focus' => 'Doubling or holding a letter.',
            'tip' => 'Hold the doubled letter briefly, then release it with the vowel. Do not skip the doubled sound.',
        ],
    ];
    $unitid = trim($unitid);
    return $units[$unitid] ?? [
        'title' => $unitid !== '' ? ucwords(str_replace('_', ' ', $unitid)) : 'Current Lesson',
        'focus' => 'The current Pre-Quran lesson step.',
        'tip' => 'Look at one small part first, try it slowly, then ask for the next step.',
    ];
}

function pqlvt_detect_letter_tip(string $message): string {
    $letters = [
        'alif' => 'Alif starts with a clean opening. Do not add an extra vowel unless the mark asks for it.',
        'ba' => 'Ba starts from both lips. Close the lips, then release softly.',
        'ta' => 'Light Ta uses the tongue tip near the gum ridge. Keep it light and clear.',
        'tha' => 'Tha uses the tongue near the teeth with a soft airy sound.',
        'jeem' => 'Jeem is voiced from the middle tongue area.',
        'ha' => 'Arabic has more than one h sound. Light Ha is gentle, while Ha and Kha come from the throat.',
        'kha' => 'Kha comes from the upper throat. Let the sound be full and slightly rough, not like English k.',
        'dal' => 'Dal is light. Touch the tongue tip, then release.',
        'ra' => 'Ra should be quick and controlled. It can be light or heavy depending on the vowel and context.',
        'seen' => 'Seen is light and thin. Keep the tongue forward.',
        'sheen' => 'Sheen is a light sh sound.',
        'sad' => 'Sad is the heavy partner of Seen. Lift the back of the tongue and make the sound fuller.',
        'qaf' => 'Qaf is deep from the back of the tongue touching the soft palate.',
        'kaf' => 'Kaf is lighter than Qaf and a little more forward.',
        'lam' => 'Lam uses the side and front of the tongue. Keep it clear.',
        'meem' => 'Meem closes both lips and carries nasal sound.',
        'noon' => 'Noon touches the gum ridge and carries nasal sound.',
        'waw' => 'Waw rounds the lips. Keep it smooth.',
        'ya' => 'Ya is light and soft from the middle tongue area.',
        'hamza' => 'Hamza starts deep in the throat with a clean stop and release.',
    ];
    $lower = core_text::strtolower($message);
    foreach ($letters as $key => $tip) {
        if (preg_match('/\b' . preg_quote($key, '/') . '\b/u', $lower)) {
            return $tip;
        }
    }
    return '';
}

function pqlvt_tutor_reply(string $message, string $lessonid, string $unitid): string {
    $clean = trim($message);
    $lower = core_text::strtolower($clean);
    $unit = pqlvt_unit_help($unitid);
    $lettertip = pqlvt_detect_letter_tip($clean);

    if ($clean === '') {
        return 'Type one thing that feels difficult, and I will help one step at a time.';
    }
    if (preg_match('/\b(right.?to.?left|direction|write|writing|start)\b/i', $clean)) {
        return 'Start from the right side. Point to the first letter, say its name, check its dots or mark, then move left one letter at a time.';
    }
    if (preg_match('/\b(shape|connect|connected|join|middle|beginning|end|final|initial)\b/i', $clean)) {
        return 'First identify the base letter. Then check its position: alone, beginning, middle, or end. Arabic letters can change shape depending on that position.';
    }
    if (preg_match('/\b(vowel|harakah|harakat|fatha|kasra|damma|mark|marks)\b/i', $clean)) {
        return 'Read the letter first, then read the vowel mark. Fatha gives a short a, kasra gives a short i, and damma gives a short u. Try the sound slowly before reading the whole item.';
    }
    if (preg_match('/\b(sukoon|sakoon|jazm|no vowel|stop)\b/i', $clean)) {
        return 'With sukoon, stop the letter cleanly. Do not add a hidden vowel after it. Say the letter, close the sound, then pause.';
    }
    if (preg_match('/\b(madd|stretch|long vowel)\b/i', $clean)) {
        return 'For madd, stretch the sound longer than a short vowel. Compare the short sound first, then stretch only as much as the lesson asks.';
    }
    if (preg_match('/\b(tanween|fathatan|kasratan|dammatan)\b/i', $clean)) {
        return 'Tanween adds a light n sound at the end. Read the vowel first, then add the ending n sound: an, in, or un.';
    }
    if (preg_match('/\b(shaddah|tashdeed|double|doubled)\b/i', $clean)) {
        return 'Shaddah means the letter is doubled. Hold the letter briefly, then release it with the vowel. Try it slowly twice before reading faster.';
    }
    if ($lettertip !== '') {
        return $lettertip . ' Now try this: say it slowly three times, then read it once with the mark from the lesson.';
    }
    if (preg_match('/\b(stuck|hard|difficult|confused|help|how)\b/i', $clean)) {
        return 'Let us take one small step. For ' . $unit['title'] . ', focus on this: ' . $unit['tip'] . ' After that, try one example and tell me which part is still difficult.';
    }

    return 'For this lesson, the main focus is ' . $unit['focus'] . ' Try this step: ' . $unit['tip'] . ' If it still feels unclear, ask me about the letter, mark, sound, or word you are looking at.';
}

function pqlvt_open_tutor_session(int $studentid, int $actorid, int $livesessionid, string $lessonid, string $unitid): int {
    global $DB;
    if (!pqlvt_virtual_tutor_tables_ready()) {
        return 0;
    }
    try {
        $now = time();
        $existing = $DB->get_record_sql(
            "SELECT *
               FROM {local_prequran_vt_session}
              WHERE studentid = :studentid
                AND createdby = :createdby
                AND source_type = :source_type
                AND session_status = :status
           ORDER BY timemodified DESC, id DESC",
            [
                'studentid' => $studentid,
                'createdby' => $actorid,
                'source_type' => 'teacher_live_session',
                'status' => 'active',
            ],
            IGNORE_MULTIPLE
        );
        $context = ['live_sessionid' => $livesessionid, 'lessonid' => $lessonid, 'unitid' => $unitid];
        if ($existing) {
            $existing->context_json = json_encode($context);
            $existing->lessonid = pqlvt_safe_key($lessonid);
            $existing->unitid = pqlvt_safe_key($unitid);
            $existing->timemodified = $now;
            $DB->update_record('local_prequran_vt_session', $existing);
            return (int)$existing->id;
        }
        return (int)$DB->insert_record('local_prequran_vt_session', (object)[
            'environment' => 'live',
            'studentid' => $studentid,
            'parentid' => 0,
            'teacherid' => $actorid,
            'createdby' => $actorid,
            'source_type' => 'teacher_live_session',
            'lessonid' => pqlvt_safe_key($lessonid),
            'unitid' => pqlvt_safe_key($unitid),
            'step_id' => '',
            'step_title' => '',
            'lesson_url' => '',
            'teacher_instructions' => 'Help the learner with the current live lesson one step at a time.',
            'context_json' => json_encode($context),
            'session_status' => 'active',
            'ai_mode' => 'guided_rule_based',
            'ai_model' => '',
            'summary' => '',
            'startedat' => $now,
            'closedat' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlvt_log_tutor_message(int $chatsessionid, int $senderid, string $role, string $message, string $source): void {
    global $DB;
    if ($chatsessionid <= 0 || !pqlvt_virtual_tutor_tables_ready()) {
        return;
    }
    try {
        $DB->insert_record('local_prequran_vt_message', (object)[
            'sessionid' => $chatsessionid,
            'senderid' => $senderid,
            'sender_role' => $role,
            'message' => $message,
            'prompt_json' => '',
            'message_source' => $source,
            'safety_status' => 'ok',
            'timecreated' => time(),
        ]);
    } catch (Throwable $e) {
        return;
    }
}

if (!pqlvt_table_exists('local_prequran_live_session')) {
    pqh_access_denied(
        'The live session table is not available yet. Please ask support to complete the live-session upgrade.',
        $returnurl,
        'Virtual Tutor unavailable'
    );
}

if ($sessionid <= 0) {
    $session = $DB->get_record_sql(
        "SELECT s.*
           FROM {local_prequran_live_session} s
      LEFT JOIN {local_prequran_live_participant} p
             ON p.sessionid = s.id
            AND p.status = :participantstatus
          WHERE s.status = :livestatus
            AND (s.teacherid = :teacherid OR p.userid = :participantuserid OR p.studentid = :participantstudentid)
       ORDER BY s.bbb_create_time DESC, s.scheduled_start DESC, s.id DESC",
        [
            'participantstatus' => 'active',
            'livestatus' => 'live',
            'teacherid' => (int)$USER->id,
            'participantuserid' => (int)$USER->id,
            'participantstudentid' => (int)$USER->id,
        ],
        IGNORE_MULTIPLE
    );
    if (!$session && pqh_can_manage_academy_operations((int)$USER->id)) {
        $session = $DB->get_record_sql(
            "SELECT s.*
               FROM {local_prequran_live_session} s
              WHERE s.status = :livestatus
           ORDER BY s.bbb_create_time DESC, s.scheduled_start DESC, s.id DESC",
            ['livestatus' => 'live'],
            IGNORE_MULTIPLE
        );
    }
    $sessionid = $session ? (int)$session->id : 0;
} else {
    $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING);
}
if (!$session) {
    if ($sessionid <= 0 && $requestedstudentid > 0) {
        $session = (object)[
            'id' => 0,
            'title' => 'Dashboard Tutor',
            'teacherid' => 0,
            'lessonid' => '',
            'unitid' => '',
        ];
    } else {
        pqh_access_denied(
            'Choose a valid live session before opening Virtual Tutor.',
            $returnurl,
            'Virtual Tutor unavailable'
        );
    }
}

if ($workspaceid <= 0 && !empty($session->workspaceid)) {
    $workspaceid = (int)$session->workspaceid;
    $urlparams['workspaceid'] = $workspaceid;
}

$participants = [];
if ($sessionid > 0 && pqlvt_table_exists('local_prequran_live_participant')) {
    $participants = $DB->get_records('local_prequran_live_participant', [
        'sessionid' => $sessionid,
        'status' => 'active',
    ], 'id ASC');
}

$isparticipant = false;
$studentid = $requestedstudentid > 0 ? $requestedstudentid : 0;
foreach ($participants as $participant) {
    $participantuserid = (int)($participant->userid ?? 0);
    $participantstudentid = (int)($participant->studentid ?? 0);
    if ($participantuserid === (int)$USER->id || $participantstudentid === (int)$USER->id) {
        $isparticipant = true;
        if ($studentid <= 0) {
            $studentid = $participantstudentid > 0 ? $participantstudentid : $participantuserid;
        }
        break;
    }
    if ($studentid <= 0 && $participantstudentid > 0) {
        $studentid = $participantstudentid;
    }
}

$canview = pqh_can_manage_academy_operations((int)$USER->id)
    || (int)$session->teacherid === (int)$USER->id
    || $isparticipant
    || ($sessionid <= 0 && pqlvt_can_access_student($studentid, (int)$USER->id));

if (!$canview) {
    pqh_access_denied(
        'Virtual Tutor is available only to this live session participant, teacher, or academy administrator.',
        $returnurl,
        'Virtual Tutor access not available'
    );
}

if ($embed && !$panel) {
    $popupurl = pqlvt_url('/local/hubredirect/live_virtual_tutor.php', $urlparams, [
        'sessionid' => $sessionid,
        'studentid' => $studentid,
        'popup' => 1,
    ]);
    echo $OUTPUT->header();
    ?>
    <style>
    html,body{min-height:100%;background:rgba(23,48,68,.42)!important;overflow:hidden}
    body{margin:0!important}
    body.pqh-live-virtual-tutor-page header,
    body.pqh-live-virtual-tutor-page footer,
    body.pqh-live-virtual-tutor-page nav.navbar,
    body.pqh-live-virtual-tutor-page #page-header,
    body.pqh-live-virtual-tutor-page #page-footer,
    body.pqh-live-virtual-tutor-page .drawer,
    body.pqh-live-virtual-tutor-page .drawer-toggles,
    body.pqh-live-virtual-tutor-page .block-region,
    body.pqh-live-virtual-tutor-page .secondary-navigation,
    body.pqh-live-virtual-tutor-page .footer-popover,
    body.pqh-live-virtual-tutor-page .popover-region,
    body.pqh-live-virtual-tutor-page .usermenu,
    body.pqh-live-virtual-tutor-page .logininfo,
    body.pqh-live-virtual-tutor-page .homelink,
    body.pqh-live-virtual-tutor-page [data-region="drawer"],
    body.pqh-live-virtual-tutor-page [data-region="right-hand-drawer"]{display:none!important}
    body.pqh-live-virtual-tutor-page #page-wrapper,
    body.pqh-live-virtual-tutor-page #page,
    body.pqh-live-virtual-tutor-page #page-content,
    body.pqh-live-virtual-tutor-page #region-main,
    body.pqh-live-virtual-tutor-page .main-inner,
    body.pqh-live-virtual-tutor-page .container,
    body.pqh-live-virtual-tutor-page .container-fluid{width:100%!important;max-width:none!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important}
    body.pqh-live-virtual-tutor-page #page.drawers{margin-top:0!important}
    .pqh-vt-bridge{width:min(520px,calc(100vw - 32px));position:fixed;top:32px;left:50%;transform:translateX(-50%);z-index:20;color:#243325}
    .pqh-vt-bridge__card{padding:22px;border:1px solid rgba(105,76,45,.14);border-radius:14px;background:#fff;box-shadow:0 26px 70px rgba(23,48,68,.28)}
    .pqh-vt-bridge h1{margin:0 0 8px;color:#3f2c1f;font-size:26px;line-height:1.08;font-weight:900}
    .pqh-vt-bridge p{margin:0 0 14px;color:#60735f;font-weight:800;line-height:1.45}
    .pqh-vt-bridge a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 14px;border-radius:10px;background:#6f4e32;color:#fff!important;text-decoration:none;font-weight:900}
    .pqh-vt-bridge__light{margin-left:8px!important;background:#fff7e7!important;color:#3f2c1f!important;border:1px solid rgba(105,76,45,.18)}
    <?php echo pqh_dashboard_header_css(); ?>
</style>
    <main class="pqh-vt-bridge">
      <section class="pqh-vt-bridge__card">
        <h1>Open Virtual Tutor</h1>
        <p>Click the button below to open the tutor in a small window. Keep your live class open in the other window.</p>
        <a id="pqh-vt-open-popup" href="<?php echo $popupurl->out(false); ?>" target="pqa_virtual_tutor_<?php echo (int)$sessionid; ?>">Open tutor window</a>
      </section>
    </main>
    <script>
    (function(){
      var popupUrl = <?php echo json_encode($popupurl->out(false)); ?>;
      var name = 'pqa_virtual_tutor_<?php echo (int)$sessionid; ?>';
      var shouldLaunch = <?php echo $launch ? 'true' : 'false'; ?>;
      var width = Math.max(420, Math.round((window.screen && window.screen.availWidth ? window.screen.availWidth : 1280) * 0.33));
      var height = Math.min(900, Math.max(720, Math.round((window.screen && window.screen.availHeight ? window.screen.availHeight : 800) * 0.92)));
      var left = Math.max(0, Math.round(((window.screen && window.screen.availWidth ? window.screen.availWidth : 1280) - width) / 2));
      var top = Math.max(0, Math.round(((window.screen && window.screen.availHeight ? window.screen.availHeight : 800) - height) / 2));
      var features = 'popup=yes,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes';
      function openTutorWindow() {
        var tutorWindow = window.open('about:blank', name, features);
        if (tutorWindow && tutorWindow.focus) {
          try {
            tutorWindow.opener = null;
          } catch (e) {}
          try {
            tutorWindow.location.replace(popupUrl);
          } catch (e) {
            tutorWindow.location.href = popupUrl;
          }
          tutorWindow.focus();
        }
        return !!tutorWindow;
      }
      function openTutorThenReturn() {
        openTutorWindow();
        return false;
      }
      var button = document.getElementById('pqh-vt-open-popup');
      if (button) {
        button.onclick = openTutorThenReturn;
      }
      if (shouldLaunch) {
        openTutorThenReturn();
      }
    })();
    </script>
    <?php
    echo $OUTPUT->footer();
    exit;
}

$student = $studentid > 0 ? core_user::get_user($studentid) : null;
$studentname = $student ? fullname($student) : 'Current learner';
$lessonid = trim((string)($session->lessonid ?? ''));
$unitid = trim((string)($session->unitid ?? ''));
$lessonurl = pqlvt_url('/local/hubredirect/issue_child.php', $urlparams, [
    'goto' => $unitid !== '' ? $unitid : 'alphabet_listen',
    'managed_student' => 0,
    'monitor_studentid' => $studentid,
]);
if ($sessionid > 0) {
    $lessonurl->param('live_sessionid', $sessionid);
}
$studentmessage = '';
$notice = '';
$latestreply = '';
$chatsessionid = pqlvt_open_tutor_session($studentid > 0 ? $studentid : (int)$USER->id, (int)$USER->id, $sessionid, $lessonid, $unitid);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('vt_action', '', PARAM_ALPHANUMEXT) === 'send') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen Virtual Tutor and try again.', $returnurl, 'Virtual Tutor action expired');
    }
    $studentmessage = trim(optional_param('student_message', '', PARAM_TEXT));
    if ($studentmessage === '') {
        $notice = 'Type a question or describe what is difficult.';
    } else {
        pqlvt_log_tutor_message($chatsessionid, (int)$USER->id, 'student', $studentmessage, 'user');
        $latestreply = pqlvt_tutor_reply($studentmessage, $lessonid, $unitid);
        pqlvt_log_tutor_message($chatsessionid, 0, 'virtual_tutor', $latestreply, 'guided_rule_based');
    }
}

$chatmessages = [];
if ($chatsessionid > 0 && pqlvt_virtual_tutor_tables_ready()) {
    try {
        $chatmessages = array_reverse(array_values($DB->get_records(
            'local_prequran_vt_message',
            ['sessionid' => $chatsessionid],
            'timecreated DESC, id DESC',
            '*',
            0,
            12
        )));
    } catch (Throwable $e) {
        $chatmessages = [];
    }
}

echo $OUTPUT->header();
?>
<style>
<?php if ($popup && !$floating): ?>
html,body{min-height:100%;background:#fff!important;overflow:auto}
body{margin:0!important}
body.pqh-live-virtual-tutor-page header,
body.pqh-live-virtual-tutor-page footer,
body.pqh-live-virtual-tutor-page nav.navbar,
body.pqh-live-virtual-tutor-page #page-header,
body.pqh-live-virtual-tutor-page #page-footer,
body.pqh-live-virtual-tutor-page .drawer,
body.pqh-live-virtual-tutor-page .drawer-toggles,
body.pqh-live-virtual-tutor-page .block-region,
body.pqh-live-virtual-tutor-page .secondary-navigation,
body.pqh-live-virtual-tutor-page .footer-popover,
body.pqh-live-virtual-tutor-page .popover-region,
body.pqh-live-virtual-tutor-page .usermenu,
body.pqh-live-virtual-tutor-page .logininfo,
body.pqh-live-virtual-tutor-page .homelink,
body.pqh-live-virtual-tutor-page [data-region="drawer"],
body.pqh-live-virtual-tutor-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-virtual-tutor-page #page-wrapper,
body.pqh-live-virtual-tutor-page #page,
body.pqh-live-virtual-tutor-page #page-content,
body.pqh-live-virtual-tutor-page #region-main,
body.pqh-live-virtual-tutor-page .main-inner,
body.pqh-live-virtual-tutor-page .container,
body.pqh-live-virtual-tutor-page .container-fluid{width:100%!important;max-width:none!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;background:#fff!important}
body.pqh-live-virtual-tutor-page #page.drawers{margin-top:0!important}
.pqh-vt-wrap{width:100%;margin:0;padding:0;color:#243325}
.pqh-vt-card{background:#fff;border:0;border-radius:0;box-shadow:none;overflow:hidden}
.pqh-vt-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:16px 18px;background:linear-gradient(135deg,#eaffea 0%,#fff7e7 100%);border-bottom:1px solid rgba(105,76,45,.1)}
.pqh-vt-title{margin:0;color:#3f2c1f;font-size:26px;line-height:1.05;font-weight:900}
.pqh-vt-sub{margin:6px 0 0;color:#60735f;font-weight:800}
.pqh-vt-close{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border-radius:10px;border:1px solid rgba(105,76,45,.18);background:#fff7e7;color:#3f2c1f;text-decoration:none;font-weight:900}
.pqh-vt-body{padding:16px}
.pqh-vt-meta{display:none}
.pqh-vt-ask{padding:16px;border:1px solid rgba(105,76,45,.14);border-radius:12px;background:#fff}
.pqh-vt-ask h2{margin:0 0 8px;color:#3f2c1f;font-size:22px}
.pqh-vt-ask p{margin:0 0 14px;color:#60735f;font-weight:800}
.pqh-vt-ask textarea{width:100%;min-height:170px;box-sizing:border-box;border:1px solid rgba(23,48,68,.16);border-radius:10px;padding:14px;font:inherit;font-weight:800}
.pqh-vt-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.pqh-vt-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:10px;border:1px solid rgba(105,76,45,.18);background:#6f4e32;color:#fff;text-decoration:none;font-weight:900}
.pqh-vt-btn--light{background:#fff7e7;color:#3f2c1f}
<?php elseif ($embed): ?>
<?php if ($panel && !$floating): ?>
html,body{min-height:100%;background:#fff!important}
body{margin:0!important}
.pqh-vt-wrap{width:100%;margin:0;padding:0;color:#243325}
.pqh-vt-card{background:#fff;border:0;border-radius:0;box-shadow:none;overflow:hidden}
.pqh-vt-head{display:none}
.pqh-vt-close{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border-radius:10px;border:1px solid rgba(105,76,45,.18);background:#fff7e7;color:#3f2c1f;text-decoration:none;font-weight:900}
.pqh-vt-body{padding:16px}
.pqh-vt-meta{display:none}
.pqh-vt-ask{padding:16px;border:1px solid rgba(105,76,45,.14);border-radius:12px;background:#fff}
.pqh-vt-ask h2{margin:0 0 8px;color:#3f2c1f;font-size:22px}
.pqh-vt-ask p{margin:0 0 14px;color:#60735f;font-weight:800}
.pqh-vt-ask textarea{width:100%;min-height:130px;box-sizing:border-box;border:1px solid rgba(23,48,68,.16);border-radius:10px;padding:14px;font:inherit;font-weight:800}
.pqh-vt-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.pqh-vt-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:10px;border:1px solid rgba(105,76,45,.18);background:#6f4e32;color:#fff;text-decoration:none;font-weight:900}
.pqh-vt-btn--light{background:#fff7e7;color:#3f2c1f}
<?php else: ?>
html,body{min-height:100%;background:rgba(23,48,68,.42)!important}
body{margin:0!important}
.pqh-vt-wrap{width:33vw;min-width:380px;max-width:560px;margin:0;padding:0;color:#243325;position:fixed;top:32px;bottom:24px;left:50%;transform:translateX(-50%);z-index:20;display:flex}
.pqh-vt-card{width:100%;min-height:100%;display:flex;flex-direction:column;background:#fff;border:1px solid rgba(105,76,45,.12);border-radius:14px;box-shadow:0 26px 70px rgba(23,48,68,.28);overflow:hidden}
.pqh-vt-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:16px 18px;background:linear-gradient(135deg,#eaffea 0%,#fff7e7 100%);border-bottom:1px solid rgba(105,76,45,.1)}
.pqh-vt-title{margin:0;color:#3f2c1f;font-size:26px;line-height:1.05;font-weight:900}
.pqh-vt-sub{margin:6px 0 0;color:#60735f;font-weight:800}
.pqh-vt-close{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border-radius:10px;border:1px solid rgba(105,76,45,.18);background:#fff7e7;color:#3f2c1f;text-decoration:none;font-weight:900}
.pqh-vt-body{flex:1;display:flex;min-height:0;padding:16px}
.pqh-vt-meta{display:none}
.pqh-vt-ask{flex:1;display:flex;flex-direction:column;min-height:0;padding:16px;border:1px solid rgba(105,76,45,.14);border-radius:12px;background:#fff}
.pqh-vt-ask h2{margin:0 0 8px;color:#3f2c1f;font-size:22px}
.pqh-vt-ask p{margin:0 0 14px;color:#60735f;font-weight:800}
.pqh-vt-ask form{flex:1;display:flex;flex-direction:column;min-height:0}
.pqh-vt-ask textarea{width:100%;flex:1;min-height:220px;box-sizing:border-box;border:1px solid rgba(23,48,68,.16);border-radius:10px;padding:14px;font:inherit;font-weight:800}
.pqh-vt-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.pqh-vt-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:10px;border:1px solid rgba(105,76,45,.18);background:#6f4e32;color:#fff;text-decoration:none;font-weight:900}
.pqh-vt-btn--light{background:#fff7e7;color:#3f2c1f}
@media(max-width:860px){.pqh-vt-wrap{width:calc(100vw - 24px);min-width:0;top:16px;bottom:16px}}
<?php endif; ?>
<?php else: ?>
html,body{min-height:100%;background:rgba(23,48,68,.42)!important;overflow:auto!important}
body{margin:0!important}
.pqh-vt-wrap{width:min(620px,calc(100vw - 32px));margin:32px auto;padding:0 0 32px;color:#243325;position:relative;z-index:20;display:block}
.pqh-vt-card{width:100%;display:flex;flex-direction:column;background:#fff;border:1px solid rgba(105,76,45,.12);border-radius:14px;box-shadow:0 18px 40px rgba(23,48,68,.08);overflow:visible}
.pqh-vt-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:18px 20px;background:linear-gradient(135deg,#eaffea 0%,#fff7e7 100%);border-bottom:1px solid rgba(105,76,45,.1)}
.pqh-vt-title{margin:0;color:#3f2c1f;font-size:28px;line-height:1.05;font-weight:900}
.pqh-vt-sub{margin:6px 0 0;color:#60735f;font-weight:800}
.pqh-vt-close{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:10px;border:1px solid rgba(105,76,45,.18);background:#fff7e7;color:#3f2c1f;text-decoration:none;font-weight:900}
.pqh-vt-body{display:flex;flex-direction:column;padding:20px}
.pqh-vt-meta{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:14px}
.pqh-vt-pill{padding:12px 14px;border:1px solid rgba(47,111,78,.15);border-radius:10px;background:#f7fff3;font-weight:850}
.pqh-vt-pill span{display:block;color:#60735f;font-size:12px;text-transform:uppercase;margin-bottom:4px}
.pqh-vt-ask{display:flex;flex-direction:column;padding:18px;border:1px solid rgba(105,76,45,.14);border-radius:12px;background:#fff}
.pqh-vt-ask h2{margin:0 0 8px;color:#3f2c1f;font-size:24px}
.pqh-vt-ask p{margin:0 0 14px;color:#60735f;font-weight:800}
.pqh-vt-ask form{display:grid;gap:10px}
.pqh-vt-ask textarea{width:100%;min-height:180px;box-sizing:border-box;border:1px solid rgba(23,48,68,.16);border-radius:10px;padding:14px;font:inherit;font-weight:800}
.pqh-vt-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.pqh-vt-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:10px;border:1px solid rgba(105,76,45,.18);background:#6f4e32;color:#fff;text-decoration:none;font-weight:900}
.pqh-vt-btn--light{background:#fff7e7;color:#3f2c1f}
@media(max-width:620px){.pqh-vt-wrap{width:calc(100vw - 20px);margin:16px auto;padding-bottom:24px}.pqh-vt-head{display:block}.pqh-vt-close{margin-top:12px}.pqh-vt-title{font-size:26px}}
<?php endif; ?>
.pqh-vt-alert{margin:0 0 12px;padding:11px 13px;border-radius:10px;background:#fff7e7;color:#6f4e32;font-weight:850}
.pqh-vt-ask textarea{display:block}
.pqh-vt-btn[type="submit"]{cursor:pointer}
.pqh-vt-messages{display:grid;gap:10px;margin-top:14px}
.pqh-vt-message{padding:12px 13px;border:1px solid rgba(105,76,45,.13);border-radius:12px;background:#fbfdf9;color:#243325;font-weight:800;line-height:1.42;white-space:pre-wrap}
.pqh-vt-message--mine{background:#2f6f4e;color:#fff;border-color:#2f6f4e}
.pqh-vt-message__meta{display:block;margin-bottom:5px;color:#60735f;font-size:12px;font-weight:950}
.pqh-vt-message--mine .pqh-vt-message__meta{color:rgba(255,255,255,.86)}
.pqh-vt-listen{display:inline-flex;align-items:center;justify-content:center;min-height:30px;margin-top:8px;padding:0 10px;border:1px solid rgba(47,111,78,.2);border-radius:8px;background:#effbea;color:#24593e;font-size:12px;font-weight:950;cursor:pointer}
.pqh-vt-voice-status{color:#60735f;font-size:12px;font-weight:850}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqh-vt-wrap">
  <section class="pqh-vt-card">
    <div class="pqh-vt-head pqh-workspace-top">
      <div>
        <h1 class="pqh-vt-title pqh-workspace-title">Virtual Tutor</h1>
        <p class="pqh-vt-sub pqh-workspace-sub">Live-session help for the current Pre-Quran lesson.</p>
      </div>
      <?php if (!$popup && !$floating && !$panel): ?>
        <a class="pqh-vt-close" href="<?php echo $returnurl->out(false); ?>"<?php echo $embed ? ' onclick="if (window.history.length > 1) { window.history.back(); return false; }"' : ''; ?>>Close</a>
      <?php endif; ?>
    </div>
    <div class="pqh-vt-body">
      <div class="pqh-vt-meta">
        <div class="pqh-vt-pill"><span>Student</span><?php echo s($studentname); ?></div>
        <div class="pqh-vt-pill"><span>Session</span><?php echo s((string)$session->title); ?></div>
        <div class="pqh-vt-pill"><span>Lesson</span><?php echo s($lessonid !== '' ? $lessonid : 'Pre-Quran lesson'); ?></div>
        <div class="pqh-vt-pill"><span>Unit</span><?php echo s($unitid !== '' ? $unitid : 'Current step'); ?></div>
      </div>

      <div class="pqh-vt-ask">
        <h2>Ask For Help</h2>
        <p>Type the question from the live lesson. The tutor should help one step at a time.</p>
        <?php if ($notice !== ''): ?>
          <div class="pqh-vt-alert"><?php echo s($notice); ?></div>
        <?php endif; ?>
        <form method="post">
          <input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>">
          <input type="hidden" name="vt_action" value="send">
          <textarea id="pqh-vt-student-message" name="student_message" maxlength="1000" required aria-label="Question for the Virtual Tutor" placeholder="Example: I am stuck on this step. How do I read this letter?"><?php echo s($notice !== '' ? $studentmessage : ''); ?></textarea>
          <div class="pqh-vt-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
            <button class="pqh-vt-btn" type="submit">Ask tutor</button>
            <button class="pqh-vt-btn pqh-vt-btn--light" id="pqh-vt-speech-start" type="button">Speak question</button>
            <a class="pqh-vt-btn pqh-vt-btn--light" href="<?php echo $lessonurl->out(false); ?>" target="pqa_virtual_tutor_lesson_<?php echo (int)$sessionid; ?>">Open current lesson</a>
            <?php if (!$popup && !$floating && !$panel): ?>
              <a class="pqh-vt-btn pqh-vt-btn--light" href="<?php echo $returnurl->out(false); ?>">Close</a>
            <?php endif; ?>
          </div>
          <span class="pqh-vt-voice-status" id="pqh-vt-voice-status" aria-live="polite"></span>
        </form>
        <?php if ($chatmessages || ($studentmessage !== '' && $latestreply !== '')): ?>
          <div class="pqh-vt-messages" aria-live="polite">
            <?php if ($chatmessages): ?>
              <?php foreach ($chatmessages as $msg): ?>
                <?php $mine = (int)$msg->senderid === (int)$USER->id && (string)$msg->message_source === 'user'; ?>
                <article class="pqh-vt-message<?php echo $mine ? ' pqh-vt-message--mine' : ''; ?>">
                  <span class="pqh-vt-message__meta"><?php echo $mine ? 'You' : 'Virtual Tutor'; ?></span>
                  <?php echo s((string)$msg->message); ?>
                  <?php if (!$mine): ?>
                    <button class="pqh-vt-listen" type="button" data-pqh-vt-speak="<?php echo s((string)$msg->message); ?>">Listen</button>
                  <?php endif; ?>
                </article>
              <?php endforeach; ?>
            <?php else: ?>
              <article class="pqh-vt-message pqh-vt-message--mine">
                <span class="pqh-vt-message__meta">You</span>
                <?php echo s($studentmessage); ?>
              </article>
              <article class="pqh-vt-message">
                <span class="pqh-vt-message__meta">Virtual Tutor</span>
                <?php echo s($latestreply); ?>
                <button class="pqh-vt-listen" type="button" data-pqh-vt-speak="<?php echo s($latestreply); ?>">Listen</button>
              </article>
            <?php endif; ?>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </section>
</main>
<script>
(function() {
  var status = document.getElementById('pqh-vt-voice-status');
  var message = document.getElementById('pqh-vt-student-message');
  var speechButton = document.getElementById('pqh-vt-speech-start');
  var questionForm = message ? message.closest('form') : null;
  var speechUnavailableKey = 'pqh_vt_speech_unavailable';

  function setStatus(text) {
    if (status) {
      status.textContent = text || '';
    }
  }

  async function speakTutorText(text) {
    if (!text) {
      return;
    }
    setStatus('Preparing tutor voice...');
    try {
      var response = await fetch('<?php echo pqlvt_url('/local/hubredirect/quiz_tts.php', $urlparams)->out(false); ?>', {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json', 'Accept': 'audio/mpeg, application/json'},
        body: JSON.stringify({text: text.slice(0, 650), purpose: 'virtual_tutor'})
      });
      if (!response.ok) {
        setStatus('Tutor voice is not available right now.');
        return;
      }
      var blob = await response.blob();
      var player = new Audio(URL.createObjectURL(blob));
      player.addEventListener('ended', function() {
        URL.revokeObjectURL(player.src);
      });
      await player.play();
      setStatus('Playing tutor voice.');
    } catch (e) {
      setStatus('Tutor voice is not available right now.');
    }
  }

  document.querySelectorAll('[data-pqh-vt-speak]').forEach(function(button) {
    button.addEventListener('click', function() {
      speakTutorText(button.getAttribute('data-pqh-vt-speak') || '');
    });
  });

  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  function disableSpeechButton(reason) {
    if (!speechButton) {
      return;
    }
    speechButton.hidden = true;
    speechButton.disabled = true;
    setStatus(reason || 'Voice input is not available in this browser. Type the question instead.');
    try {
      window.sessionStorage.setItem(speechUnavailableKey, '1');
    } catch (e) {}
  }
  try {
    if (window.sessionStorage.getItem(speechUnavailableKey) === '1') {
      disableSpeechButton('Voice input is not available in this browser. Type the question instead.');
    }
  } catch (e) {}
  if (!SpeechRecognition && speechButton) {
    disableSpeechButton('Voice input is not available in this browser. Type the question instead.');
  }
  if (SpeechRecognition && speechButton && message && !speechButton.hidden) {
    var recognition = new SpeechRecognition();
    var isListening = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = function() {
      isListening = true;
      speechButton.disabled = true;
      speechButton.textContent = 'Listening...';
      setStatus('Listening...');
    };
    recognition.onerror = function(event) {
      var error = event && event.error ? event.error : '';
      var help = 'Could not hear clearly. Try again.';
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        help = 'Microphone permission was blocked. Allow microphone access in the browser, then try again.';
      } else if (error === 'no-speech') {
        help = 'No speech was detected. Click Speak question, then speak after the listening message appears.';
      } else if (error === 'audio-capture') {
        help = 'No microphone was detected. Check the microphone selected in Edge.';
      } else if (error === 'network') {
        disableSpeechButton('Voice recognition could not connect in this browser. Type the question instead.');
        return;
      }
      setStatus(help);
    };
    recognition.onend = function() {
      isListening = false;
      speechButton.disabled = false;
      speechButton.textContent = 'Speak question';
      if (status && status.textContent === 'Listening...') {
        setStatus('No speech was detected. Click Speak question and try again.');
      }
    };
    recognition.onresult = function(event) {
      var transcript = event.results && event.results[0] && event.results[0][0] ? event.results[0][0].transcript : '';
      if (transcript) {
        message.value = transcript;
        message.focus();
        setStatus('Voice added. Asking tutor...');
        if (questionForm && questionForm.requestSubmit) {
          questionForm.requestSubmit();
        } else if (questionForm) {
          questionForm.submit();
        }
      }
    };
    speechButton.addEventListener('click', function() {
      if (isListening) {
        return;
      }
      try {
        recognition.start();
      } catch (e) {
        setStatus('Voice input is already starting. Wait a moment, then try again.');
      }
    });
  }
})();
</script>
<?php
echo $OUTPUT->footer();
