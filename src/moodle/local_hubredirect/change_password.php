<?php
declare(strict_types=1);

// Branded replacement for Moodle's /login/change_password.php.
//
// Every rule Moodle's own page enforces is enforced here too — the checks are
// lifted from login/change_password.php and login/change_password_form.php so
// that changing the page cannot quietly change the password policy. What is
// different is only what the learner sees: the consumer's brand, colours and
// logo (the same context consumer_login.php uses) and a live checklist of the
// site's real password rules instead of one long sentence.
//
// Users are sent here by local_prequran_before_http_headers(); this page never
// calls require_login(), because require_login() is what redirects a forced
// user to the core page in the first place and would loop. It repeats core's
// own manual login check instead.

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->dirroot . '/webservice/lib.php');
require_once($CFG->dirroot . '/login/lib.php');
require_once($CFG->libdir . '/authlib.php');
require_once(__DIR__ . '/accesslib.php');

$systemcontext = context_system::instance();
$PAGE->set_context($systemcontext);

$consumer = pqh_requested_consumer_context();
$slug = (string)($consumer->consumerslug ?? '');
$workspaceid = (int)($consumer->workspaceid ?? 0);
$consumertype = (string)($consumer->consumer_type ?? '');
$usesworkspacecontext = $workspaceid > 0 && !in_array($consumertype, ['academy_consumer', 'platform_foundation'], true);

$params = [];
if ($slug !== '') {
    $params['consumer'] = $slug;
}
if ($usesworkspacecontext) {
    $params['workspaceid'] = $workspaceid;
}

$pageurl = new moodle_url('/local/hubredirect/change_password.php', $params);
$PAGE->set_url($pageurl);

// Require a real login; a guest can not change a password. Mirrors core.
if (!isloggedin() || isguestuser()) {
    if (empty($SESSION->wantsurl)) {
        $SESSION->wantsurl = $pageurl->out(false);
    }
    redirect(get_login_url());
}

$forced = (bool)get_user_preferences('auth_forcepasswordchange', false);

// Do not require the change-own-password capability when the change is forced.
if (!$forced) {
    require_capability('moodle/user:changeownpassword', $systemcontext);
}

// Never let a "logged in as" session change anybody's password.
if (\core\session\manager::is_loggedinas()) {
    throw new \moodle_exception('cannotcallscript');
}

// Anything Moodle handles specially goes back to Moodle's own page rather than
// being half-supported here.
if (is_mnet_remote_user($USER)) {
    redirect(new moodle_url('/login/change_password.php', ['pqhcore' => 1]));
}

$userauth = get_auth_plugin((string)$USER->auth);
if (!$userauth->can_change_password()) {
    throw new \moodle_exception('nopasswordchange', 'auth');
}
if ($changeurl = $userauth->change_password_url()) {
    redirect($changeurl);
}

$theme = pqh_consumer_theme($consumer);
$primarycolor = (string)$theme['primary_color'];
$accentcolor = (string)$theme['accent_color'];
$fontbase = (new moodle_url('/local/hubredirect/pix/fonts/'))->out(false);

// Brand from the consumer when the request host resolves to one, and from the
// site otherwise — this page is reached whether or not the host is registered
// in local_prequran_consumer_domain, so it can never depend on that.
$brand = trim((string)($consumer->consumername ?? ''));
if ($brand === '') {
    $brand = trim(format_string($SITE->fullname)) ?: 'Ehel Academy';
}
$brandlogo = trim((string)($consumer->logourl ?? ''));
$brandinitial = core_text::strtoupper(core_text::substr((string)preg_replace('/[^a-z0-9]/i', '', $brand), 0, 1)) ?: 'E';

$maxchars = defined('MAX_PASSWORD_CHARACTERS') ? MAX_PASSWORD_CHARACTERS : 128;

/**
 * Where the learner goes once the password is set.
 *
 * require_login() parks the page they actually wanted in $SESSION->wantsurl
 * before bouncing them here, so honour that; fall back to the consumer's own
 * role router. Either change-password page is refused as a destination — that
 * is the loop this whole flow exists to leave.
 */
$destination = null;
if (!empty($SESSION->wantsurl)) {
    $wantsurl = clean_param((string)$SESSION->wantsurl, PARAM_LOCALURL);
    if ($wantsurl !== '' && !preg_match('#/(login|local/hubredirect)/change_password\.php#', $wantsurl)) {
        $destination = new moodle_url($wantsurl);
    }
}
if ($destination === null) {
    $destination = new moodle_url('/local/hubredirect/role_redirect.php', $params);
}

// The site's real password policy, read from config so the checklist below can
// never promise a rule the server does not enforce.
$policyrules = [];
if (!empty($CFG->passwordpolicy)) {
    $minlength = (int)($CFG->minpasswordlength ?? 8);
    if ($minlength > 0) {
        $policyrules[] = ['rule' => 'length', 'value' => $minlength,
            'label' => 'At least ' . $minlength . ' characters long'];
    }
    $mindigits = (int)($CFG->minpassworddigits ?? 0);
    if ($mindigits > 0) {
        $policyrules[] = ['rule' => 'digits', 'value' => $mindigits,
            'label' => $mindigits === 1 ? 'At least 1 number' : 'At least ' . $mindigits . ' numbers'];
    }
    $minlower = (int)($CFG->minpasswordlower ?? 0);
    if ($minlower > 0) {
        $policyrules[] = ['rule' => 'lower', 'value' => $minlower,
            'label' => $minlower === 1 ? 'At least 1 small letter (a-z)' : 'At least ' . $minlower . ' small letters (a-z)'];
    }
    $minupper = (int)($CFG->minpasswordupper ?? 0);
    if ($minupper > 0) {
        $policyrules[] = ['rule' => 'upper', 'value' => $minupper,
            'label' => $minupper === 1 ? 'At least 1 capital letter (A-Z)' : 'At least ' . $minupper . ' capital letters (A-Z)'];
    }
    $minspecial = (int)($CFG->minpasswordnonalphanum ?? 0);
    if ($minspecial > 0) {
        $policyrules[] = ['rule' => 'special', 'value' => $minspecial,
            'label' => ($minspecial === 1 ? 'At least 1 special character' : 'At least ' . $minspecial . ' special characters')
                . ' such as * - or #'];
    }
    $maxrepeat = (int)($CFG->maxconsecutiveidentchars ?? 0);
    if ($maxrepeat > 0) {
        $policyrules[] = ['rule' => 'repeat', 'value' => $maxrepeat,
            'label' => 'No more than ' . $maxrepeat . ' of the same character in a row'];
    }
}
$policyrules[] = ['rule' => 'different', 'value' => 0, 'label' => 'Different from your current password'];
$policyrules[] = ['rule' => 'match', 'value' => 0, 'label' => 'Both new password boxes match'];

$reusenote = '';
if (!empty($CFG->passwordreuselimit) && (int)$CFG->passwordreuselimit > 0) {
    $reusenote = get_string('informminpasswordreuselimit', 'auth', (int)$CFG->passwordreuselimit);
}

$hastokens = !empty(webservice::get_active_tokens($USER->id));
$forcedlogout = !empty($CFG->passwordchangelogout);

$errors = [];
// check_password_policy() hands back its reasons as <div> markup, so that one
// message is echoed rather than escaped. Every other message is plain text.
$errorsashtml = [];
$changed = false;
$logoutothers = true;
$signoutservices = true;

if (data_submitted()) {
    require_sesskey();

    // PARAM_RAW, never a trimmed type: a leading or trailing space is a
    // legitimate part of a password and trimming it would reject a correct one.
    $current = (string)optional_param('currentpassword', '', PARAM_RAW);
    $new1 = (string)optional_param('newpassword1', '', PARAM_RAW);
    $new2 = (string)optional_param('newpassword2', '', PARAM_RAW);
    $logoutothers = (bool)optional_param('logoutothersessions', 0, PARAM_BOOL);
    $signoutservices = (bool)optional_param('signoutofotherservices', 0, PARAM_BOOL);

    // The order and the messages are core's, from login_change_password_form::validation().
    $reason = null;
    if ($current === '' || $new1 === '' || $new2 === '') {
        $errors['form'] = get_string('required');
    } else if (!authenticate_user_login($USER->username, $current, true, $reason, false)) {
        $errors['currentpassword'] = get_string('invalidlogin');
    } else if ($new1 !== $new2) {
        $errors['newpassword2'] = get_string('passwordsdiffer');
    } else if ($current === $new1) {
        $errors['newpassword1'] = get_string('mustchangepassword');
    } else if (user_is_previously_used_password($USER->id, $new1)) {
        $errors['newpassword1'] = get_string('errorpasswordreused', 'core_auth');
    } else {
        $errmsg = '';
        if (!check_password_policy($new1, $errmsg, $USER)) {
            $errors['newpassword1'] = $errmsg;
            $errorsashtml['newpassword1'] = true;
        }
    }

    if (!$errors) {
        if (!$userauth->user_update_password($USER, $new1)) {
            throw new \moodle_exception('errorpasswordupdate', 'auth');
        }

        user_add_password_history($USER->id, $new1);

        if ($forcedlogout || $logoutothers) {
            if (method_exists('\core\session\manager', 'destroy_user_sessions')) {
                \core\session\manager::destroy_user_sessions($USER->id, session_id());
            } else {
                \core\session\manager::kill_user_sessions($USER->id, session_id());
            }
        }

        if ($signoutservices) {
            webservice::delete_user_ws_tokens($USER->id);
        }

        // Reset login lockout - we want to prevent any accidental confusion here.
        login_unlock_account($USER);

        unset_user_preference('auth_forcepasswordchange', $USER);
        unset_user_preference('create_password', $USER);

        // Plugins can perform post password change actions once data has been validated.
        core_login_post_change_password_requests((object)[
            'id' => SITEID,
            'newpassword1' => $new1,
            'newpassword2' => $new2,
            'logoutothersessions' => $logoutothers ? 1 : 0,
            'signoutofotherservices' => $signoutservices ? 1 : 0,
        ]);

        unset($SESSION->wantsurl);
        $changed = true;
        $forced = false;
    }
}

$PAGE->set_pagelayout('embedded');
$PAGE->set_title($brand . ' - ' . ($changed ? get_string('passwordchanged') : get_string('changepassword')));
$PAGE->set_heading($brand);
$PAGE->add_body_class('pqh-change-password-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}

$firstname = trim((string)($USER->firstname ?? ''));

// Resolved here rather than above because reaching for $OUTPUT initialises the
// theme, and the $PAGE calls above must land first.
if ($brandlogo === '') {
    $sitelogo = $OUTPUT->get_compact_logo_url(300, 60);
    $brandlogo = $sitelogo ? $sitelogo->out(false) : '/local/hubredirect/pix/login-crest-default.png';
}

echo $OUTPUT->header();
?>
<style>
@font-face{font-family:'Inter';font-style:normal;font-weight:300 700;font-display:swap;src:url('<?php echo s($fontbase); ?>Inter-normal-300-700.woff2') format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-style:normal;font-weight:500;font-display:swap;src:url('<?php echo s($fontbase); ?>IBMPlexMono-normal-500.woff2') format('woff2')}
body.pqh-change-password-page{margin:0;background:#f6fafd;color:#0f2b47;font-family:'Inter',system-ui,-apple-system,"Segoe UI",Arial,sans-serif;-webkit-font-smoothing:antialiased}
body.pqh-change-password-page header,
body.pqh-change-password-page footer,
body.pqh-change-password-page nav.navbar,
body.pqh-change-password-page #page-header,
body.pqh-change-password-page #page-footer,
body.pqh-change-password-page .drawer,
body.pqh-change-password-page .drawer-toggles,
body.pqh-change-password-page [data-region="drawer"],
body.pqh-change-password-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-change-password-page #page,
body.pqh-change-password-page #page-content,
body.pqh-change-password-page #region-main,
body.pqh-change-password-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important;background:transparent!important}
.pqhcp-shell{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:
  radial-gradient(60% 50% at 85% 0%, color-mix(in srgb, var(--pqh-primary,#2166d1) 30%, transparent), transparent 70%),
  radial-gradient(50% 40% at 10% 100%, color-mix(in srgb, var(--pqh-primary,#2166d1) 14%, transparent), transparent 70%),
  linear-gradient(180deg,#e9f4fc 0%,#f6fafd 55%,#ffffff 100%)}
.pqhcp-card{width:100%;max-width:520px;background:#fff;border:1px solid rgba(15,43,71,.1);border-radius:22px;box-shadow:0 24px 70px rgba(15,43,71,.12);padding:clamp(28px,5vw,44px);box-sizing:border-box;animation:pqhcp-rise .7s cubic-bezier(.32,0,.1,1) both}
@keyframes pqhcp-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
.pqhcp-brand{display:flex;align-items:center;gap:14px;margin-bottom:26px}
.pqhcp-brand-mark{display:flex;align-items:center;height:54px;max-width:220px;flex-shrink:0}
.pqhcp-brand-mark img{display:block;height:100%;width:auto;max-width:220px;object-fit:contain}
.pqhcp-brand-fallback{display:none;width:54px;height:54px;flex:0 0 auto;border-radius:16px;align-items:center;justify-content:center;background:var(--pqh-primary,#2166d1);color:#fff;font-size:1.35rem;font-weight:700}
.pqhcp-brand strong{display:block;font-size:1.05rem;font-weight:700;letter-spacing:-.02em}
.pqhcp-brand small{display:block;font-family:'IBM Plex Mono',ui-monospace,Consolas,monospace;font-size:.6rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--pqh-accent,#4d8be0);margin-top:3px}
.pqhcp-card h1{margin:0 0 8px;font-size:clamp(1.7rem,5vw,2.2rem);font-weight:700;letter-spacing:-.035em}
.pqhcp-sub{margin:0 0 22px;font-size:.92rem;line-height:1.6;color:rgba(15,43,71,.62)}
.pqhcp-alert{margin:0 0 20px;padding:12px 14px;border-radius:12px;background:#fff4d9;border:1px solid rgba(217,154,38,.35);color:#5f4210;font-size:13px;font-weight:600;line-height:1.5}
.pqhcp-alert--error{background:#fdeceb;border-color:rgba(197,48,48,.3);color:#8a2020}
.pqhcp-alert--ok{background:#e7f7ee;border-color:rgba(35,134,84,.3);color:#1c5c3b}
.pqhcp-who{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 20px;padding:12px 14px;border-radius:12px;background:#f1f7fd;font-size:.85rem}
.pqhcp-who span{color:rgba(15,43,71,.62);font-weight:500}
.pqhcp-who strong{font-family:'IBM Plex Mono',ui-monospace,Consolas,monospace;font-weight:500;letter-spacing:.02em}
.pqhcp-field{margin-bottom:16px}
.pqhcp-field label{display:block;margin:0 0 7px;font-size:.82rem;font-weight:600}
.pqhcp-inputwrap{position:relative;display:block}
.pqhcp-input{width:100%;font:inherit;font-size:.95rem;color:#0f2b47;background:#ecf5fc;border:1px solid transparent;border-radius:12px;padding:.95em 3.2em .95em 1.1em;outline:none;box-sizing:border-box;transition:border-color .3s,background-color .3s,box-shadow .3s}
.pqhcp-input:focus{background:#fff;border-color:var(--pqh-primary,#2166d1);box-shadow:0 0 0 4px color-mix(in srgb,var(--pqh-primary,#2166d1) 14%,transparent)}
.pqhcp-input[aria-invalid="true"]{background:#fdeceb;border-color:rgba(197,48,48,.45)}
.pqhcp-reveal{position:absolute;top:50%;right:8px;transform:translateY(-50%);border:0;background:transparent;font:inherit;font-size:.75rem;font-weight:600;color:var(--pqh-accent,#4d8be0);cursor:pointer;padding:6px 8px;border-radius:8px}
.pqhcp-reveal:hover{background:rgba(15,43,71,.06)}
.pqhcp-error{display:block;margin:7px 2px 0;font-size:.78rem;font-weight:600;color:#8a2020;line-height:1.45}
.pqhcp-rules{margin:4px 0 20px;padding:14px 16px;border-radius:14px;background:#f6fafd;border:1px solid rgba(15,43,71,.08);list-style:none}
.pqhcp-rules li{display:flex;align-items:flex-start;gap:9px;font-size:.82rem;line-height:1.5;color:rgba(15,43,71,.62);font-weight:500;padding:3px 0}
.pqhcp-rules li:before{content:"";flex:0 0 auto;width:16px;height:16px;margin-top:2px;border-radius:50%;border:2px solid rgba(15,43,71,.22);box-sizing:border-box;transition:background-color .25s,border-color .25s}
.pqhcp-rules li.pqhcp-met{color:#1c5c3b}
.pqhcp-rules li.pqhcp-met:before{border-color:#238654;background:#238654 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23fff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round' d='M4 8.4l2.6 2.6L12 5.6'/%3E%3C/svg%3E") center/12px no-repeat}
.pqhcp-check{display:flex;align-items:flex-start;gap:10px;margin:0 0 14px;font-size:.85rem;font-weight:500;color:rgba(15,43,71,.62);cursor:pointer;line-height:1.5}
.pqhcp-check input{width:17px;height:17px;margin-top:2px;flex:0 0 auto;accent-color:var(--pqh-primary,#2166d1);cursor:pointer}
.pqhcp-btn{display:block;width:100%;font:inherit;font-size:.95rem;font-weight:600;text-align:center;text-decoration:none;border:none;border-radius:100px;padding:1em 1.5em;cursor:pointer;box-sizing:border-box;transition:background-color .35s,color .35s,box-shadow .35s,transform .35s,border-color .35s}
.pqhcp-btn--primary{background:var(--pqh-primary,#2166d1);color:#fff;box-shadow:0 10px 28px color-mix(in srgb,var(--pqh-primary,#2166d1) 35%,transparent);margin-top:6px}
.pqhcp-btn--primary:hover{background:var(--pqh-accent,#4d8be0);transform:translateY(-2px);box-shadow:0 14px 34px color-mix(in srgb,var(--pqh-accent,#4d8be0) 40%,transparent)}
.pqhcp-btn--ghost{margin-top:10px;background:transparent;color:var(--pqh-accent,#4d8be0);border:1px solid rgba(15,43,71,.14)}
.pqhcp-btn--ghost:hover{background:#f1f7fd}
.pqhcp-note{margin-top:20px;font-size:.76rem;line-height:1.7;color:rgba(15,43,71,.62);opacity:.85}
@media(prefers-reduced-motion:reduce){.pqhcp-card{animation:none}.pqhcp-btn{transition:none}}
</style>
<style><?php echo pqh_openproject_skin_css('pqhcp', 'pqh-change-password-page'); ?></style>
<main class="pqhcp-shell" style="--pqh-primary: <?php echo s($primarycolor); ?>; --pqh-accent: <?php echo s($accentcolor); ?>;">
  <div class="pqhcp-card">
    <div class="pqhcp-brand">
      <span class="pqhcp-brand-mark">
        <img src="<?php echo s($brandlogo); ?>" alt="<?php echo s($brand); ?> logo" id="pqhcp-logo">
      </span>
      <span class="pqhcp-brand-fallback" id="pqhcp-logo-fallback" aria-hidden="true"><?php echo s($brandinitial); ?></span>
      <div>
        <strong><?php echo s($brand); ?></strong>
        <small>Account security</small>
      </div>
    </div>

<?php if ($changed): ?>
    <h1>Password updated</h1>
    <p class="pqhcp-sub">Your new password is saved. Use it the next time you log in — and keep it to yourself.</p>
    <div class="pqhcp-alert pqhcp-alert--ok">You are all set. Nobody else can sign in with your old password now.</div>
    <a class="pqhcp-btn pqhcp-btn--primary" href="<?php echo $destination->out(false); ?>">Continue</a>
<?php else: ?>
    <h1><?php echo $firstname !== '' ? 'Hello, ' . s($firstname) : 'Choose a new password'; ?></h1>
    <p class="pqhcp-sub"><?php echo $forced
        ? 'Before you carry on, please replace the password you were given with one only you know.'
        : 'Set a new password for your account.'; ?></p>

    <?php if ($forced): ?>
      <div class="pqhcp-alert">You must change your password before you can continue.</div>
    <?php endif; ?>
    <?php if (!empty($errors['form'])): ?>
      <div class="pqhcp-alert pqhcp-alert--error"><?php echo s($errors['form']); ?></div>
    <?php endif; ?>

    <div class="pqhcp-who">
      <span>Signed in as</span>
      <strong><?php echo s($USER->username); ?></strong>
    </div>

    <form action="<?php echo $pageurl->out(false); ?>" method="post" autocomplete="off">
      <input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>">

      <div class="pqhcp-field">
        <label for="pqhcp-current">Current password</label>
        <span class="pqhcp-inputwrap">
          <input class="pqhcp-input" id="pqhcp-current" name="currentpassword" type="password"
                 autocomplete="current-password" maxlength="<?php echo (int)$maxchars; ?>" required
                 <?php echo !empty($errors['currentpassword']) ? 'aria-invalid="true"' : ''; ?>>
          <button class="pqhcp-reveal" type="button" data-reveal="pqhcp-current">Show</button>
        </span>
        <?php if (!empty($errors['currentpassword'])): ?>
          <span class="pqhcp-error"><?php echo s($errors['currentpassword']); ?></span>
        <?php endif; ?>
      </div>

      <div class="pqhcp-field">
        <label for="pqhcp-new1">New password</label>
        <span class="pqhcp-inputwrap">
          <input class="pqhcp-input" id="pqhcp-new1" name="newpassword1" type="password"
                 autocomplete="new-password" maxlength="<?php echo (int)$maxchars; ?>" required
                 <?php echo !empty($errors['newpassword1']) ? 'aria-invalid="true"' : ''; ?>>
          <button class="pqhcp-reveal" type="button" data-reveal="pqhcp-new1">Show</button>
        </span>
        <?php if (!empty($errors['newpassword1'])): ?>
          <span class="pqhcp-error"><?php echo !empty($errorsashtml['newpassword1'])
              ? $errors['newpassword1'] : s($errors['newpassword1']); ?></span>
        <?php endif; ?>
      </div>

      <div class="pqhcp-field">
        <label for="pqhcp-new2">New password again</label>
        <span class="pqhcp-inputwrap">
          <input class="pqhcp-input" id="pqhcp-new2" name="newpassword2" type="password"
                 autocomplete="new-password" maxlength="<?php echo (int)$maxchars; ?>" required
                 <?php echo !empty($errors['newpassword2']) ? 'aria-invalid="true"' : ''; ?>>
          <button class="pqhcp-reveal" type="button" data-reveal="pqhcp-new2">Show</button>
        </span>
        <?php if (!empty($errors['newpassword2'])): ?>
          <span class="pqhcp-error"><?php echo s($errors['newpassword2']); ?></span>
        <?php endif; ?>
      </div>

      <ul class="pqhcp-rules" id="pqhcp-rules" aria-live="polite">
        <?php foreach ($policyrules as $rule): ?>
          <li data-rule="<?php echo s($rule['rule']); ?>" data-value="<?php echo (int)$rule['value']; ?>"><?php echo s($rule['label']); ?></li>
        <?php endforeach; ?>
      </ul>

      <?php if ($reusenote !== ''): ?>
        <p class="pqhcp-note" style="margin-top:-8px;margin-bottom:16px"><?php echo s($reusenote); ?></p>
      <?php endif; ?>

      <label class="pqhcp-check">
        <input type="checkbox" name="logoutothersessions" value="1"
               <?php echo ($logoutothers || $forcedlogout) ? 'checked' : ''; ?>
               <?php echo $forcedlogout ? 'disabled' : ''; ?>>
        <span>Log out of every other device and browser</span>
      </label>
      <?php if ($forcedlogout): ?>
        <input type="hidden" name="logoutothersessions" value="1">
      <?php endif; ?>

      <?php if ($hastokens): ?>
        <label class="pqhcp-check">
          <input type="checkbox" name="signoutofotherservices" value="1" <?php echo $signoutservices ? 'checked' : ''; ?>>
          <span><?php echo s(get_string('signoutofotherservices')); ?></span>
        </label>
      <?php endif; ?>

      <button class="pqhcp-btn pqhcp-btn--primary" type="submit">Save my new password</button>
      <?php if (!$forced): ?>
        <a class="pqhcp-btn pqhcp-btn--ghost" href="<?php echo $destination->out(false); ?>">Cancel</a>
      <?php endif; ?>
    </form>

    <p class="pqhcp-note">Never share your password, not even with a classmate. Staff will never ask you for it.</p>
<?php endif; ?>
  </div>
</main>
<script>
// A broken crest on a learner's first screen looks worse than no crest, so an
// image that fails to load is swapped for the brand's initial.
(function () {
  var logo = document.getElementById('pqhcp-logo');
  var fallback = document.getElementById('pqhcp-logo-fallback');
  if (!logo || !fallback) {
    return;
  }
  function useFallback() {
    logo.parentNode.style.display = 'none';
    fallback.style.display = 'flex';
  }
  logo.addEventListener('error', useFallback);
  if (logo.complete && logo.naturalWidth === 0) {
    useFallback();
  }
}());
</script>
<?php if (!$changed): ?>
<script>
(function () {
  var current = document.getElementById('pqhcp-current');
  var one = document.getElementById('pqhcp-new1');
  var two = document.getElementById('pqhcp-new2');
  var rules = Array.prototype.slice.call(document.querySelectorAll('#pqhcp-rules li'));
  if (!one || !two) {
    return;
  }

  function chars(value) {
    return Array.from(value);
  }

  function countMatching(value, test) {
    return chars(value).filter(test).length;
  }

  function longestRun(value) {
    var list = chars(value);
    var best = 0;
    var run = 0;
    for (var i = 0; i < list.length; i++) {
      run = (i > 0 && list[i] === list[i - 1]) ? run + 1 : 1;
      if (run > best) {
        best = run;
      }
    }
    return best;
  }

  function met(rule, value, pw, confirm, old) {
    switch (rule) {
      case 'length': return chars(pw).length >= value;
      case 'digits': return countMatching(pw, function (c) { return c >= '0' && c <= '9'; }) >= value;
      case 'lower': return countMatching(pw, function (c) { return /[a-z]/.test(c); }) >= value;
      case 'upper': return countMatching(pw, function (c) { return /[A-Z]/.test(c); }) >= value;
      case 'special': return countMatching(pw, function (c) { return !/[A-Za-z0-9]/.test(c); }) >= value;
      case 'repeat': return pw !== '' && longestRun(pw) <= value;
      // Ticks before the current-password box is filled and un-ticks only if
      // what is typed there actually matches: an empty box is not a clash.
      case 'different': return pw !== '' && (old === '' || pw !== old);
      case 'match': return pw !== '' && pw === confirm;
      default: return false;
    }
  }

  function refresh() {
    var pw = one.value;
    var confirmValue = two.value;
    var old = current ? current.value : '';
    rules.forEach(function (item) {
      var ok = met(item.getAttribute('data-rule'), parseInt(item.getAttribute('data-value'), 10) || 0, pw, confirmValue, old);
      item.classList.toggle('pqhcp-met', ok);
    });
  }

  [current, one, two].forEach(function (input) {
    if (input) {
      input.addEventListener('input', refresh);
    }
  });
  refresh();

  document.querySelectorAll('[data-reveal]').forEach(function (button) {
    button.addEventListener('click', function () {
      var target = document.getElementById(button.getAttribute('data-reveal'));
      if (!target) {
        return;
      }
      var hidden = target.type === 'password';
      target.type = hidden ? 'text' : 'password';
      button.textContent = hidden ? 'Hide' : 'Show';
    });
  });
}());
</script>
<?php endif; ?>
<?php
echo $OUTPUT->footer();
