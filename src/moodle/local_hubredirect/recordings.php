<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/recordings.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Speak Recordings');
$PAGE->set_heading('Speak Recordings');
$PAGE->add_body_class('pqh-recordings-page');

function pqr_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqr_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqr_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqr_table_exists('local_prequran_comm_participant') && pqr_table_exists('local_prequran_comm_thread')) {
        $exists = $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = ?
                AND p.role = ?
                AND t.studentid = ?",
            [$parentid, 'parent', $studentid]
        );
        if ($exists) {
            return true;
        }
    }

    return false;
}

function pqr_is_managed_student(int $userid): bool {
    require_once($GLOBALS['CFG']->dirroot . '/user/profile/lib.php');
    try {
        $profile = profile_user_record($userid, false);
    } catch (Throwable $e) {
        return false;
    }
    foreach (['managed_student', 'managedstudent', 'managed'] as $field) {
        if (isset($profile->{$field})) {
            $value = strtolower(trim((string)$profile->{$field}));
            return in_array($value, ['1', 'yes', 'true', 'on'], true);
        }
    }
    return false;
}

function pqr_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqr_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = ?
            AND r.shortname IN ('editingteacher', 'teacher', 'manager')",
        [$userid]
    );
}

function pqr_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }

    if (pqr_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', [
            'teacherid' => $teacherid,
            'status' => 'active',
        ]);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', [
                'teacherid' => $teacherid,
                'studentid' => $studentid,
                'status' => 'active',
            ]);
        }
    }

    if (!pqr_has_teacher_role($teacherid)) {
        return false;
    }

    if (!pqr_is_managed_student($studentid)) {
        return false;
    }

    return $DB->record_exists_sql(
        "SELECT 1
           FROM {cohort_members} teacher_cm
           JOIN {cohort_members} student_cm ON student_cm.cohortid = teacher_cm.cohortid
          WHERE teacher_cm.userid = ?
            AND student_cm.userid = ?",
        [$teacherid, $studentid]
    );
}

function pqr_safe_storage_path(string $path): string {
    $parts = array_filter(explode('/', str_replace('\\', '/', $path)), function($part) {
        return $part !== '' && $part !== '.' && $part !== '..';
    });
    return implode('/', array_map('rawurlencode', $parts));
}

function pqr_stream_bunny_file(string $path, string $mimetype): void {
    $zone = trim((string)get_config('local_prequran', 'bunny_storage_zone'));
    $host = trim((string)get_config('local_prequran', 'bunny_storage_host'));
    $accesskey = trim((string)get_config('local_prequran', 'bunny_storage_access_key'));

    if ($host === '') {
        $host = 'storage.bunnycdn.com';
    }
    if ($zone === '' || $accesskey === '' || $path === '' || !function_exists('curl_init')) {
        throw new moodle_exception('filenotfound', '', '', 'Recording storage is not configured.');
    }

    $url = 'https://' . $host . '/' . rawurlencode($zone) . '/' . pqr_safe_storage_path($path);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['AccessKey: ' . $accesskey]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    $bytes = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($errno || $status < 200 || $status >= 300 || $bytes === false) {
        throw new moodle_exception('filenotfound', '', '', 'Recording could not be loaded.');
    }

    @header('Content-Type: ' . ($mimetype !== '' ? $mimetype : 'audio/webm'));
    @header('Content-Length: ' . strlen($bytes));
    @header('Cache-Control: private, max-age=300');
    @header('X-Content-Type-Options: nosniff');
    echo $bytes;
    exit;
}

$childid = required_param('childid', PARAM_INT);
if (!pqr_parent_can_access_child((int)$USER->id, $childid) && !pqr_teacher_can_access_student((int)$USER->id, $childid)) {
    throw new moodle_exception('nopermissions', '', '', 'You cannot review recordings for this student.');
}

$recordingid = optional_param('id', 0, PARAM_INT);
$action = optional_param('action', '', PARAM_ALPHA);
if ($action === 'play' && $recordingid > 0) {
    if (!pqr_table_exists('local_prequran_speakrec')) {
        throw new moodle_exception('filenotfound', '', '', 'Speak recording table is not installed yet.');
    }
    $recording = $DB->get_record('local_prequran_speakrec', ['id' => $recordingid, 'userid' => $childid], '*', MUST_EXIST);
    pqr_stream_bunny_file((string)$recording->bunny_path, (string)$recording->mime_type);
}

$child = core_user::get_user($childid);
$childname = $child ? fullname($child) : 'Student ' . $childid;
$recordinggroups = [];
if (pqr_table_exists('local_prequran_speakrec')) {
    $speakrecords = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_speakrec}
          WHERE userid = ?
            AND status <> ?
       ORDER BY timecreated DESC, id DESC",
        [$childid, 'upload_failed'],
        0,
        50
    );
    if ($speakrecords) {
        $recordinggroups[] = [
            'key' => 'speak',
            'title' => 'Speak Recordings',
            'summary' => 'Play submitted Speak practice together, or review one recording at a time.',
            'records' => $speakrecords,
        ];
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqh-recordings-page header,
body.pqh-recordings-page footer,
body.pqh-recordings-page nav.navbar,
body.pqh-recordings-page #page-header,
body.pqh-recordings-page #page-footer,
body.pqh-recordings-page .drawer,
body.pqh-recordings-page .drawer-toggles,
body.pqh-recordings-page .block-region,
body.pqh-recordings-page [data-region="drawer"],
body.pqh-recordings-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-recordings-page #page,
body.pqh-recordings-page #page-content,
body.pqh-recordings-page #region-main,
body.pqh-recordings-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
body.pqh-recordings-page{background:#f4f7fb!important}
.pqr-shell{min-height:100vh;padding:34px 18px 54px;background:linear-gradient(180deg,#f1fff4 0,#fff 50%);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#4d3522}
.pqr-wrap{max-width:980px;margin:0 auto}
.pqr-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;padding:22px;border-radius:16px;background:linear-gradient(135deg,#eaffea 0,#fff 54%,#fff7e7 100%);border:1px solid rgba(111,78,50,.13);box-shadow:0 16px 38px rgba(105,76,45,.08)}
.pqr-kicker{margin:0 0 6px;color:#6f4e32;font-size:13px;font-weight:950;text-transform:uppercase;letter-spacing:.04em}
.pqr-title{margin:0;font-size:30px;line-height:1.1;font-weight:950;color:#4d3522}
.pqr-subtitle{margin:8px 0 0;color:#64745a;font-size:15px;font-weight:750}
.pqr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border-radius:10px;background:#6f4e32;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950}
.pqr-btn--green{background:#3f8a55}
.pqr-btn--light{background:#f4fff0;color:#4d3522!important;border:1px solid rgba(111,78,50,.16)}
.pqr-group{margin-top:16px;padding:18px;border-radius:16px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqr-group__head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}
.pqr-group h2{margin:0;color:#4d3522;font-size:22px;font-weight:950}
.pqr-group p{margin:5px 0 0;color:#64745a;font-size:14px;font-weight:750}
.pqr-chain{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.pqr-chain-status{width:100%;margin:2px 0 0;color:#64745a;font-size:13px;font-weight:850}
.pqr-list{display:grid;gap:12px}
.pqr-card{padding:18px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqr-group .pqr-card{box-shadow:none;background:#fff}
.pqr-card.is-chain-current{outline:3px solid rgba(63,138,85,.25);border-color:#3f8a55}
.pqr-card__head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}
.pqr-card h3{margin:0;color:#4d3522;font-size:18px;font-weight:950}
.pqr-meta{margin:4px 0 0;color:#64745a;font-size:13px;font-weight:800}
.pqr-pill{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border-radius:999px;background:#f4fff0;color:#3f8a55;font-size:12px;font-weight:950}
.pqr-audio{width:100%;margin-top:4px}
.pqr-empty{max-width:980px;margin:34px auto;padding:24px;border-radius:14px;background:#fff;border:1px dashed rgba(111,78,50,.22);color:#64745a;font-weight:850}
@media(max-width:640px){.pqr-top{display:block}.pqr-btn{margin-top:14px}.pqr-group__head{display:block}.pqr-chain{margin-top:12px}.pqr-card__head{display:block}.pqr-title{font-size:25px}}
</style>
<main class="pqr-shell">
  <div class="pqr-wrap">
    <section class="pqr-top">
      <div>
        <p class="pqr-kicker">Recording review</p>
        <h1 class="pqr-title">Student recordings for <?php echo s($childname); ?></h1>
        <p class="pqr-subtitle">Play submitted practice together, or review individual recordings when needed.</p>
      </div>
      <a class="pqr-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php', ['childid' => $childid]))->out(false); ?>">Back to dashboard</a>
    </section>

    <?php if (!$recordinggroups): ?>
      <div class="pqr-empty">No student recordings have been submitted yet.</div>
    <?php else: ?>
      <?php foreach ($recordinggroups as $group): ?>
        <section class="pqr-group" data-recording-group="<?php echo s($group['key']); ?>" aria-label="<?php echo s($group['title']); ?>">
          <div class="pqr-group__head">
            <div>
              <h2><?php echo s($group['title']); ?></h2>
              <p><?php echo s($group['summary']); ?></p>
            </div>
            <div class="pqr-chain">
              <button class="pqr-btn pqr-btn--green js-pqr-play-all" type="button" data-group="<?php echo s($group['key']); ?>">Play all</button>
              <button class="pqr-btn pqr-btn--light js-pqr-stop" type="button" data-group="<?php echo s($group['key']); ?>">Stop</button>
              <p class="pqr-chain-status" data-chain-status="<?php echo s($group['key']); ?>"><?php echo count($group['records']); ?> recordings ready.</p>
            </div>
          </div>
          <section class="pqr-list">
          <?php foreach ($group['records'] as $record): ?>
            <?php
              $title = trim((string)($record->letter_name ?: $record->letter_text ?: $record->letter_key ?: 'Speak recording'));
              $unit = trim((string)$record->unitid);
              $duration = (int)round(((int)$record->duration_ms) / 1000);
              $playurl = new moodle_url('/local/hubredirect/recordings.php', [
                  'childid' => $childid,
                  'action' => 'play',
                  'id' => (int)$record->id,
              ]);
            ?>
            <article class="pqr-card" data-chain-item="<?php echo s($group['key']); ?>" data-chain-title="<?php echo s($title); ?>">
              <div class="pqr-card__head">
                <div>
                  <h3><?php echo s($title); ?></h3>
                  <p class="pqr-meta"><?php echo s($unit !== '' ? $unit : 'Speak practice'); ?> - Attempt <?php echo (int)$record->attempt_no; ?> - <?php echo userdate((int)$record->timecreated, get_string('strftimedatetimeshort')); ?></p>
                </div>
                <span class="pqr-pill"><?php echo $duration > 0 ? s($duration . ' sec') : 'recorded'; ?></span>
              </div>
              <audio class="pqr-audio" controls preload="none" src="<?php echo $playurl->out(false); ?>"></audio>
            </article>
          <?php endforeach; ?>
          </section>
        </section>
        <?php endforeach; ?>
    <?php endif; ?>
  </div>
</main>
<script>
(function() {
  var chain = { audio: null, items: [], index: -1, group: '' };

  function status(group, text) {
    var el = document.querySelector('[data-chain-status="' + group + '"]');
    if (el) el.textContent = text;
  }

  function clearCurrent() {
    document.querySelectorAll('.pqr-card.is-chain-current').forEach(function(card) {
      card.classList.remove('is-chain-current');
    });
  }

  function stopChain(message) {
    if (chain.audio) {
      chain.audio.pause();
      chain.audio.removeAttribute('src');
      chain.audio.load();
    }
    clearCurrent();
    if (chain.group) status(chain.group, message || 'Playback stopped.');
    chain.items = [];
    chain.index = -1;
    chain.group = '';
  }

  function playAt(index) {
    if (!chain.items[index]) {
      stopChain('Playback complete.');
      return;
    }
    chain.index = index;
    clearCurrent();
    var card = chain.items[index];
    var audio = card.querySelector('audio');
    var title = card.getAttribute('data-chain-title') || 'Recording';
    if (!audio || !audio.src) {
      playAt(index + 1);
      return;
    }
    card.classList.add('is-chain-current');
    status(chain.group, 'Playing ' + (index + 1) + ' of ' + chain.items.length + ': ' + title);
    chain.audio.src = audio.src;
    chain.audio.play().catch(function() {
      status(chain.group, 'Browser blocked autoplay. Press Play all again.');
    });
  }

  document.querySelectorAll('.js-pqr-play-all').forEach(function(button) {
    button.addEventListener('click', function() {
      var group = button.getAttribute('data-group') || '';
      var items = Array.prototype.slice.call(document.querySelectorAll('[data-chain-item="' + group + '"]'));
      if (!items.length) {
        status(group, 'No recordings to play.');
        return;
      }
      document.querySelectorAll('.pqr-audio').forEach(function(audio) {
        audio.pause();
      });
      stopChain('');
      chain.audio = chain.audio || new Audio();
      chain.audio.onended = function() { playAt(chain.index + 1); };
      chain.group = group;
      chain.items = items;
      playAt(0);
    });
  });

  document.querySelectorAll('.js-pqr-stop').forEach(function(button) {
    button.addEventListener('click', function() {
      stopChain('Playback stopped.');
    });
  });

  document.querySelectorAll('.pqr-audio').forEach(function(audio) {
    audio.addEventListener('play', function() {
      if (chain.group) stopChain('Playback stopped for individual review.');
    });
  });
})();
</script>
<?php
echo $OUTPUT->footer();
