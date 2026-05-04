<?php
// /local/hubredirect/issue_child.php — Back-compat HTML router + audio (proxy) fast-path

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');

function b64url(string $bin): string {
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}


function hub_origin_from_url(string $url): string {
    $p = parse_url($url);
    if (!empty($p['scheme']) && !empty($p['host'])) {
        return $p['scheme'] . '://' . $p['host'] . (!empty($p['port']) ? (':' . $p['port']) : '');
    }
    return '';
}

function hub_render_lesson_iframe_wrapper(
    string $iframeSrc,
    ?int $uidToSend,
    string $wsTokenToSend,
    string $wsEndpoint,
    string $iframeOrigin = '*',
    string $title = 'Lesson'
): void {
    header('Content-Type: text/html; charset=utf-8');
    header('Permissions-Policy: microphone=(self "https://quraanacademy.b-cdn.net" "https://ehelacademy.b-cdn.net"), autoplay=(self "https://quraanacademy.b-cdn.net" "https://ehelacademy.b-cdn.net")');
    header("Feature-Policy: microphone 'self' https://quraanacademy.b-cdn.net https://ehelacademy.b-cdn.net");

    ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title><?php echo htmlspecialchars($title, ENT_QUOTES); ?></title>
  <style>
    html,body{
      margin:0;
      height:100%;
      background:linear-gradient(180deg,#f7fbff 0%, #fff8da 100%);
    }
    #pqBootLoader{
      position:fixed;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(180deg,#f7fbff 0%, #fff8da 100%);
      color:#17324a;
      font:800 20px/1.2 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;
      z-index:10;
    }
    .frame{
      position:fixed;
      inset:0;
      border:0;
      width:100%;
      height:100%;
      background:transparent;
    }
    body.pq-frame-ready #pqBootLoader{
      display:none;
    }
  </style>
</head>
<body>
  <div id="pqBootLoader" aria-live="polite">Loading lesson…</div>

  <iframe
    id="lessonFrame"
    class="frame"
    src="<?php echo htmlspecialchars($iframeSrc, ENT_QUOTES); ?>"
    allow="microphone; autoplay; fullscreen"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"></iframe>

  <script>
  (function PQTokenBroker(){
    const frame = document.getElementById('lessonFrame');
    if(!frame) return;

    const targetOrigin = <?php echo json_encode($iframeOrigin ?: '*'); ?>;

    const payload = {
      type: "PQ_TOKENS",
      uid: <?php echo json_encode($uidToSend); ?>,
      wstoken: <?php echo json_encode($wsTokenToSend); ?>,
      wsendpoint: <?php echo json_encode($wsEndpoint); ?>,
      managed: 1,
      ts: Date.now()
    };

    let iframeLoaded = false;

    function tryPost(win, msg, origin){
      try {
        win.postMessage(msg, origin);
        return true;
      } catch (e1) {
        try {
          win.postMessage(msg, '*');
          return true;
        } catch (e2) {
          return false;
        }
      }
    }

    function send(){
      if(!iframeLoaded && targetOrigin !== '*') return false;
      try{
        if(!frame.contentWindow) return false;
        return tryPost(frame.contentWindow, payload, targetOrigin);
      }catch(e){
        return false;
      }
    }

    frame.addEventListener('load', function(){
      iframeLoaded = true;
      try {
        document.body.classList.add('pq-frame-ready');
      } catch(e) {}
      send();
    });

    window.addEventListener('message', function(ev){
      if(!iframeLoaded) return;
      if(ev.source !== frame.contentWindow) return;
      const msg = ev.data || {};
      if(msg.type === "PQ_REQUEST_TOKENS") send();
    });

    let tries = 0, maxTries = 50;
    const t = setInterval(function(){
      tries++;
      if(send() || tries >= maxTries) clearInterval(t);
    }, 100);
  })();
  </script>
</body>
</html>
<?php
    exit;
}

// Load centralized settings
$localCfg = __DIR__ . '/config.local.php';
if (is_file($localCfg)) {
    require_once $localCfg;
}

// Settings with fallbacks
$cdnBase        = defined('HUB_CDN_BASE')       ? HUB_CDN_BASE       : 'https://quraanacademy.b-cdn.net';
$HTML_SIGN_MODE = defined('HUB_BUNNY_SIGN_MODE')? HUB_BUNNY_SIGN_MODE: 'urltoken';
$secKey         = defined('HUB_BUNNY_URLTOKEN_KEY') ? HUB_BUNNY_URLTOKEN_KEY : '';
$useIpBind      = defined('HUB_BUNNY_IPBIND')   ? HUB_BUNNY_IPBIND   : false;
$signHtml       = defined('HUB_BUNNY_SIGN_HTML')? HUB_BUNNY_SIGN_HTML: true;
$ttlCdn         = defined('HUB_BUNNY_TTL_CDN')  ? (int)HUB_BUNNY_TTL_CDN  : 300;
$ttlMTok        = defined('HUB_MTOKEN_TTL')     ? (int)HUB_MTOKEN_TTL     : 120;

// Where the audio proxy might live
$audioProxyCandidates = [
    __DIR__ . '/../audio/audio_proxy.php',
    __DIR__ . '/audio/audio_proxy.php',
];

/* Whitelist slugs */
$map = [
    // NOTE: Use versioned HTML filenames (e.g., *_v1.0.2.html) to avoid CDN/browser cache issues.
    // --- Core video / audio tools ---
    'video'              => '/pre_quraan/scripts/newui_letter_video_recorder15.html',
    'voice'              => '/pre_quraan/scripts/newui_letter_voice_recorder6_upload.html',

    // --- Alphabet core lessons ---
    'alphabet_lecture'   => '/pre_quraan/scripts/newui_alphabet_letters08.html',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/html_locked_test_v0.0.2.html?managed=1&v=0.0.30',
    
    //'alphabet_listen' => '/pre_quraan/scripts/html_locked_test_v0.0.3.html?managed=1&v=0.0.30',
    
    //'alphabet_listen' => '/pre_quraan/scripts/alphabet_listen_vNext_runner_test_v1.4.html?managed=1&v=0.0.13',
    
   // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_shared_design_v0-001.html?managed=1&v=0.0.18',
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_shared_design_working_copy_v0-001.html?managed=1&v=0.0.39',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_sqa_v001.html?managed=1&v=0.0.58',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_sqa_unmanaged_v001.html?managed=1&v=0.0.76',
    
     // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_sqa_unmanaged_v001_debug.html?managed=1&v=0.0.79',
     
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_sqa_final_v1.0.0.html?managed=1&v=0.0.89',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_v0.0.html?managed=1&v=0.0.115',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_html_v0.0_MOBILE_GUARD_FILTER_APPLY_FIX.html?managed=1&v=20260425_80',
    
     
    'alphabet_listen' => '/pre_quraan/units/alphabet/index.html?managed=1&v=20260504_001',
    // sssss s
    
     
    //  'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_html_v0.0.1.html?managed=1&v=20260425_74',
    
    // sss sssssss
    // new working copy
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_shared_design_v0-001 - working_copy.html?managed=1&v=1.0.46',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_v1.0.2.html?managed=1&v=2.0.13',
    // 
   // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_v1.0.7.html?managed=1&v=2.0.17',
    //  17
//     
// 'alphabet_watch' => '/pre_quraan/scripts/pq_unit_harakat_watch_v1.0.0.html?managed=1&v=1.0.23',

//'alphabet_watch' => '/pre_quraan/scripts/pq_unit_harakat_watch_v1.0.0.html?managed=1&v=1.0.24',

// 'alphabet_watch' => '/pre_quraan/scripts/pq_unit_alphabet_watch_v1.0.1.html?managed=1&v=1.0.33',

// ttt
// 'alphabet_watch' => '/pre_quraan/scripts/pq_unit_alphabet_watch_v1.0.1_debug.html?managed=1&v=1.0.39',

'alphabet_watch' => '/pre_quraan/scripts/pq_unit_alphabet_watch_sqa_final_v1.0.0.html?managed=1&v=1.0.49',
// ss

    
    // 'alphabet_listen'    => '/pre_quraan/scripts/alphabet_letters_listen_v2.html',
 //   'match01'            => '/pre_quraan/scripts/alphabet_match_v008.html?v=20251208001',

// 'match01'            => '/pre_quraan/scripts/pq_unit_alphabet_match_match_v1.1.0.html?managed=1&v=20251208032',

// 'match01'            => '/pre_quraan/scripts/pq_unit_alphabet_match_match_v1.1.0.html?managed=1&v=20251208041',

'match01'            => '/pre_quraan/scripts/pq_unit_alphabet_match_sqa_final_v1.0.0.html?managed=1&v=20251208042',

// ss


    // Alphabet Order + Trans pages go directly to Moodle (absolute URLs, no Bunny)
    'alphabet_order'     => 'https://quraan.academy/mod/page/view.php?id=345&inpopup=1',
    'alphabet_trans1'    => 'https://quraan.academy/mod/page/view.php?id=344&inpopup=1',
    'alphabet_trans2'    => 'https://quraan.academy/mod/page/view.php?id=342&inpopup=1',


    // 'speak01'            => '/pre_quraan/scripts/alphabet_speak_v9.html',
    
    // 'speak01'            => '/pre_quraan/scripts/pq_unit_alphabet_speak_v1.7.2.html?managed=1&v=202512080520',
    //   ssss
    
    // 'speak01'            => '/pre_quraan/scripts/pq_unit_alphabet_speak_v1.7.2.html?managed=1&v=202512080544',
    //   sss
    
    'speak01'            => '/pre_quraan/scripts/pq_unit_alphabet_speak_sqa_final_v1.0.1.html?managed=1&v=202512080554',
    
    
    // 'write03'            => '/pre_quraan/scripts/alphabet_write_ws10.html',
    // sssss
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_write_v1.3.2_patched_v4b.html?managed=1&v=202512080548',
    
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_write_v1.3.2_patched_v4_shell.html?managed=1&v=202512080558',
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_v1.0.5_STABLE.html?managed=1&pqdebug=1&v=2025120872',
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_v1.0.5_STABLE_backup.html?managed=1&pqdebug=1&v=2025120876',
    
    //   'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_v1.0.5_STABLE_backup5.html?managed=1&pqdebug=1&v=2025120936',
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_v1.0.5_STABLE_backup5_PATCHED.html?managed=1&pqdebug=1&v=2025120947',
    
    // ss
    // shss
    
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_sqa_final_v1.0.7.html?managed=1&v=2025120929',
    // ss
    
   // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_sqa_final_new_v1.0.1.html?managed=1&v=2025120932',
    // ss
    
    'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_sqa_final_new2_v1.0.0.html?managed=1&v=2025120950',
    // ss
    
    // Alphabet Dots (used by menu, adjust if you have a different file name)
    'alphabet_dots'      => '/pre_quraan/scripts/alphabet_dots1.html',

    // Alphabet diacritics
    //'diacritics01'       => '/pre_quraan/scripts/arabic_diacritics7.html',
    
    // Alphabet diacritics
    // 'diacritics01'       => '/pre_quraan/scripts/pq_unit_arabic_diacritics_listen_sqa_final_v1.0.1.html?managed=1&v=2025120965',
    
    //'diacritics01'       => '/pre_quraan/scripts/pq_unit_arabic_diacritics_write_sqa_final_v1.0.1.html?managed=1&v=2025120972',
    
      'diacritics01'       => '/pre_quraan/scripts/pq_unit_arabic_diacritics_listen_sqa_final_v1.0.13.html?managed=1&v=2025120993',


    // --- Harakat (Movements) ---
    // Managed Harakat Listen (PROD)
    'harakat_listen'      => '/pre_quraan/scripts/pq_unit_harakat_listen_v1.0_15.html?managed=1',

    // Managed Harakat Listen (TEST) - pass uid + wstoken explicitly for test harness stability
    // 'harakat_listen' => '/pre_quraan/scripts/harakat_listen_vNext_runner_test_v1.4.html?managed=1&v=0.0.35',
    //'harakat_listen' => '/pre_quraan/scripts/harakat_listen_vNext_managed_runner_test_v1.0.2.html?managed=1&v=0.0.1',
    // 'harakat_listen' => '/pre_quraan/scripts/harakat_listen_vNext_runner_test_v1.4.html?managed=1&v=0.0.36',
    
    // 'harakat_listen' => '/pre_quraan/scripts/harakat_listen_vNext_runner_test_v1.4_1.html?managed=1&v=0.0.37',
    
    // 'harakat_listen' => '/pre_quraan/scripts/pq_unit_harakat_listen_v1.0.2_standardized.html?managed=1&v=0.0.41',
    
    // 'harakat_listen' => '/pre_quraan/scripts/pq_unit_harakat_listen_v1.0.2_standardized.html?managed=1&v=0.0.44',
    
    //          sss
    
     'harakat_listen' => '/pre_quraan/scripts/pq_unit_harakat_listen_sqa_final_v1.0.0.html?managed=1&v=0.0.50',
    
    //          sss
    
    // Legacy / other Harakat pages
    // 'harakat_watch'       => '/pre_quraan/scripts/harakat_watch_v001.html',
    
    // 'harakat_match'       => '/pre_quraan/scripts/harakat_match_v005.html',
    
    // 'harakat_match' => '/pre_quraan/scripts/pq_unit_harakat_match_match_v1.1.0_clean2.html?managed=1&v=0.0.54',
    // ssss
    
     
    'harakat_match' => '/pre_quraan/scripts/pq_unit_harakat_match_sqa_final_v1.0.0.html?managed=1&v=0.0.56',
    // ssss
    
    // 'harakat_speak'       => '/pre_quraan/scripts/harakat_speak_v002.html',
    
    'harakat_speak' => '/pre_quraan/scripts/pq_unit_harakat_speak_v1.0.0_FINAL2.html?managed=1&v=0.0.63',
    
   // sss
   
   'harakat_speak' => '/pre_quraan/scripts/pq_unit_harakat_speak_sqa_final_v1.0.0.html?managed=1&v=0.0.64',
    
   // sss
    
    // 'harakat_video'       => '/pre_quraan/scripts/harakat_video_practice.html',
    // 'harakat_voice'       => '/pre_quraan/scripts/harakat_voice_practice.html',
    
    
    // 'harakt_write01'      => '/pre_quraan/scripts/newui_harakt_writing04.html',
    
    // 'harakt_write01' => '/pre_quraan/scripts/pq_unit_harakat_write_v1.0.5_clone_from_alphabet_write.html?managed=1&v=0.0.64',
    
    // sssss
    
    // 'harakt_write01' => '/pre_quraan/scripts/pq_unit_harakat_write_v1.0.0_CLONE_from_aw_v11.html?managed=1&v=0.0.107',
    
    // 'harakt_write01' => '/pre_quraan/scripts/pq_unit_harakat_write_sqa_final_v1.0.5_MODELED_AFTER_ALPHABET_LISTEN.html?managed=1&v=0.0.113',

    // 'harakt_write01' => '/pre_quraan/scripts/pq_unit_harakat_write_sqa_final_v1.0.9_MODELED_AFTER_ALPHABET_LISTEN_SERVERPDF.html?managed=1&v=0.0.122',
    
    'harakt_write01' => '/pre_quraan/scripts/pq_unit_harakat_write_sqa_final_v1.2.2.html?managed=1&v=0.0.149',
    
    
    
    // ssssssss
    
    // 'harakat_watch' => '/pre_quraan/scripts/pq_unit_harakat_watch_v1.0.1_arabic_filenames_lecturefix_src5.html?managed=1&v=1.0.62',
    
    // 'harakat_watch' => '/pre_quraan/scripts/pq_unit_harakat_watch_standarized_v1.0.2.html?managed=1&v=1.0.26',
    // test23
    
    'harakat_watch' => '/pre_quraan/scripts/pq_unit_harakat_watch_sqa_final_v1.0.0.html?managed=1&v=1.0.29',
    // test23
   

// --- Joint Letters ---
// --- Joint Letters ---
  //  'connections04'      => '/pre_quraan/scripts/newui_letter_connections14.html',
    
  //  'connections_ws'     => '/pre_quraan/scripts/newui_connections_worksheet22_mobile3.html',
    
  // 'connections_ws'     => '/pre_quraan/scripts/newui_connections_worksheet22_mobile3.html',
  
  
    // 'connections_ws' => '/pre_quraan/scripts/pq_unit_joint_connecting_forms_v1.0.0.html?managed=1&v=1.0.33',
    // test2
    
   // 'connections_ws'     => '/pre_quraan/scripts/newui_connections_worksheet22_mobile3_split.html?&v=1.0.37',
    
    
   // 'connections_ws'     => '/pre_quraan/scripts/pq_unit_connections_worksheet_sqa_final_v1.0.3.html?managed=1&v=1.0.37',
  
    'connections_ws'     => '/pre_quraan/scripts/pq_unit_joint_connecting_forms_sqa_final_v1.0.0.html?managed=1&v=1.0.44',
    

   // 'two_joined1'        => '/pre_quraan/scripts/joint_letters_v015.html',
    
    // 'two_joined1'        => '/pre_quraan/scripts/pq_unit_two_joined_letters_sqa_final_v1.0.1.html?managed=1&v=1.0.33',
    // ssss
    
    // 'two_joined1'        => '/pre_quraan/scripts/pq_unit_two_joint_letters_listen_sqa_final_v1.0.1.html?managed=1&v=1.0.58',
    // ssss
    
    'two_joined1'        => '/pre_quraan/scripts/pq_unit_two_joined_letters_sqa_final_v1.0.1.html?managed=1&v=1.0.96',
    // ssss
    
    // 'three_joined1'      => '/pre_quraan/scripts/three_joined_letters4.html',
    
  
    //'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_letters_joined_listen_sqa_final_v1.0.3.html?managed=1&v=1.0.41',
    
    // 'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_letters_joined_listen_sqa_final_v1.0.3.html?managed=1&v=1.0.41',
    
    
    // 'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_letters_joined_listen_sqa_final_v1.0.3.html?managed=1&v=1.0.41',
    
   // 'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_letters_joined_listen_sqa_final_v1.0.3.html?managed=1&v=1.0.42',
    
    // 'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_joined_letters_sqa_final_v1.0.0.html?managed=1&v=1.0.42',
    
  //  'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_joined_letters_sqa_final_v1.0.0.html?managed=1&v=1.0.61',
    
   'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_joined_letters_sqa_final_v1.0.1.html?managed=1&v=1.0.66',
   
   
   // 'four_joined2'       => '/pre_quraan/scripts/four_joined_letters.html',
    
    'four_joined2'       => '/pre_quraan/scripts/pq_unit_four_joined_letters_sqa_final_v1.0.3_4col.html?managed=1&v=1.0.45',

    // -------------------------------------------------------------------------
    // RULES / TAJWEED — ROOT SLUGS (same as before)
    // -------------------------------------------------------------------------
    //'muqattaat1'         => '/pre_quraan/scripts/muqattiat_listen_v001.html',
	
	// 'muqattiat_listen' => '/pre_quraan/scripts/pq_unit_muqattiat_listen_v1.4.35.html?managed=1&v=1.4.38',
//	'muqattiat_listen' => '/pre_quraan/scripts/muqattiat_listen_vNext_runner_test_CANON_v1.6_legacy_layout.html?managed=1&v=1.4.66',
	
// 'muqattiat_listen' => '/pre_quraan/scripts/pq_unit_muqattiat_listen_sqa_final_v1.0.1.html?managed=1&v=1.4.69',
	
	// 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.0.1.html?managed=1&v=1.0.403',
	
	// old version
	// 'tanween_listen' => '/pre_quraan/scripts/tanween_lesson_v6.html',
	
	// 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.0.5.html?managed=1&v=1.0.411',
	//  
	//	'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.1.17.html?managed=1&v=1.0.423',
	// ttt
	// 'tanween_listen' => '/pre_quraan/scripts/tanween_listen_vNext_runner_test_v1.0.html?managed=1&v=1.0.01',
	//'tanween_listen' => '/pre_quraan/scripts/	tanween_listen_vNext_runner_test_v1.0.html?managed=1&v=1.0.01',
	// 
    // 'tanween14'          => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'standing1'          => '/pre_quraan/scripts/Standing_harakat8.html',
    'tanween_mvt1'       => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.1.3.html?managed=1&v=1.0.12',
    // ss
    'maddoleen3'         => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'sakoon_jazm2'       => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',

    'tashdeed_w_shaddah' => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    'tashdeed_w_sukoon'  => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_w_tashdeed'=> '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_w_haroof_maddah'=> '/pre_quraan/scripts/tashdeed_with_haroof15.html',

    // -------------------------------------------------------------------------
    // RULES / TAJWEED — NEW DETAILED SLUGS TO MATCH app-config.js
    // For now, all detailed slugs for a unit point to the same main page.
    // You can later split them to separate files if you create them.
    // -------------------------------------------------------------------------
    //
    // Muqatta'at detailed lessons
    'muqattaat_intro'      => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',
    // 'muqattaat_listen'     => '/pre_quraan/scripts/muqattiat_listen_vNext_runner_test_CANON_v1.6_legacy_layout.html?managed=1&v=1.4.66',
    
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_v1.4.35.html?managed=1&v=1.4.66',
    
   // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_sqa_final_v1.0.2.html?managed=1&v=1.5.97',
    
    
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_sqa_final_v1.0.13_updated_subtitle.html?managed=1&v=1.5.120',
    
    //'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_sqa_final_v1.0.78_production_FINAL_ORDER.html?managed=1&v=1.5.198',
    
    // LOCKED VERSION
   // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_v1.0_PRODUCTION.html?managed=1&v=1.5.201',
    
    // DEV
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_from_template_v1.0_PATCHED_STABLE.html?managed=1&v=1.5.250',
    
    // CLONE
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_from_template_v1.0_CONFIG_DRIVEN_POC.html?managed=1&v=1.5.253',
    
    // FINAL CLONE
   // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_ui_v00.html?managed=1&v=1.5.268',
    
    
    // FINAL CLONE
   // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_tmvt_ui_v1.0.19_new_clone.html?managed=1&v=1.5.316',
    
        // FINAL CLONE
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_tmvt_ui_v1.0.20_new_clone.html?managed=1&v=1.5.347',
     
         // FINAL CLONE
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_tmvt_ui_v1.0.20_new_clone_copy.html?managed=1&v=1.5.355',
     
     'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_clone_html_muq_output2.html?managed=1&v=1.5.365',
     
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_clone_html_muq_output2.html?managed=1&v=1.5.365',
     
     'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_clean_v1.0.0.html?managed=1&v=1.5.366',
    
    
    
    // ssss   
    
    'muqattaat_match'      => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',
    'muqattaat_speak'      => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',
    'muqattaat_write'      => '/re_quraan/scripts/muqattaat_letters17_mobile14.html',
    'muqattaat_record'     => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',
    'muqattaat_practice'   => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',
    'muqattaat_quiz'       => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',

    // Tanween detailed lessons
    'tanween_intro'        => '/pre_quraan/scripts/tanween_lesson_v1.html',
    //'tanween_listen'       => '/pre_quraan/scripts/tanween_lesson_v6.html',
    
   // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.0.1.html?managed=1&v=1.0.403',
   
   // old version
   // 'tanween_listen' => '/pre_quraan/scripts/tanween_lesson_v6.html',
    
   // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.0.5.html?managed=1&v=1.0.411',
    // 
    // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.1.17.html?managed=1&v=1.0.423',
    //  ttt
    
    // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_sqa_final_v1.0.7.html?managed=1&v=1.0.446',
    //  tttt
    
   // 'tanween_listen' => '/pre_quraan/scripts/tanween_listen_vNext_runner_test_v1.0.html?managed=1&v=1.0.01',
   // 'tanween_listen' => '/pre_quraan/scripts/tanween_listen_vNext_runner_test_v1.0.html?managed=1&v=1.0.01',
   
   // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_sqa_final_v1.0.2.html?managed=1&v=1.0.03',
   
   //'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v3.0_CONFIG_DRIVEN_PATCHED.html?managed=1&v=1.0.19',
   
   // New1
   // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_from_template_v1.0_CONFIG_DRIVEN_MESSAGES_WRITEFIX_v1.html?managed=1&v=1.0.24',
   
   'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.4_COLUMN2_START.html?managed=1&v=1.0.26',
    	
    	
    	
    
    
    'tanween_match'        => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'tanween_speak'        => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'tanween_write'        => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'tanween_record'       => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'tanween_practice'     => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'tanween_quiz'         => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',

    // Tanween & Movement detailed lessons
    'tanween_mvt_intro'      => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.2.html?managed=1&v=1.0.08',
    
     
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.1.1.html?managed=1&v=1.0.37',
    //   
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.1.0.html?managed=1&v=1.0.40',
    // 888689
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html?v=1.0.43',
    
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_sqa_final_v1.0.0.html?managed=1&v=1.0.57',
    
    
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.2.html?managed=1&v=1.0.129',
    
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.3_SPEAK.html?managed=1&v=1.0.152',
    
    // old Stable version 
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.3_SPEAK_v16.html?managed=1&v=1.0.154',
    
    // recovered stable version
    //  'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.3_c.html?managed=1&v=1.0.190',
      
    // performance changes version
    //'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.3_d.html?managed=1&v=1.0.224',
      
    // mobile friendly
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.3_d_mobile_child_friendly.html?managed=1&v=1.0.261',
      
     // gemini 
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.24_mobile_2_gemini.html?managed=1&v=1.0.231',
     
      
     // Note script... good version
     // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.21_mobile_6.html?managed=1&v=1.0.323',
    
       // Note script
      // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.21_mobile_5.html?managed=1&v=1.0.339',
      
       
     // sandbox script
     // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.24_mobile_2_test.html?managed=1&v=1.0.370',
     
     // Note script
     // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.24_mobile_2.html?managed=1&v=1.0.366',
     
    
    // scroll
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.24_mobile_3.html?managed=1&v=1.0.407',
    
    // scroll redo html
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.24_mobile_10.html?managed=1&v=1.0.419',
    
    // resart version
   // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_mobile_v2c.html?managed=1&v=1.0.437',
    
    // browser dynamic columns
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_v1.0.3_j_browser_v4_cleaned.html?managed=1&v=1.0.447',
    
    // browser dynamic columns
   // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_v1.0.3_j_browser_v5_final.html?managed=1&v=1.0.451',
    
    // browser dynamic columns
   // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_v1.0.3_j_browser_v6_span.html?managed=1&v=1.0.454',
    
    //  new mobile
   // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tmvt_ui_v1.0.19.html?managed=1&v=1.0.665',

    //     
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tmvt_ui_v1.0.19_clone.html?managed=1&v=1.0.667',
     
    //     
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement.html?managed=1&v=1.0.671',
     
     //  cloned       
     'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_clone_html_output.html?managed=1&v=1.0.681',
    
    'tanween_mvt_match'      => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    'tanween_mvt_speak'      => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    'tanween_mvt_write'      => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    'tanween_mvt_record'     => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    'tanween_mvt_practice'   => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    'tanween_mvt_quiz'       => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',

    // Fatha–Kasra–Damma (Standing Harakat) detailed lessons
    // 'standing_listen'        => '/pre_quraan/scripts/pq_unit_madd_listen_v1.0.6.html?managed=1&v=1.0.15',
    
    // 'standing_listen'        => '/pre_quraan/scripts/Standing_harakat8.html?v=1.0.20',
    
    // new 
    
    // 'standing_listen'        => '/pre_quraan/scripts/pq_unit_madd_listen_v1.0.8.html?managed=1&v=1.0.41',
    // 
    
    // 'standing_listen'        => '/pre_quraan/scripts/pq_unit_madd_listen_sqa_final_v1.0.html?managed=1&v=1.0.45',
    // sss
    
    'standing_listen'        => '/pre_quraan/scripts/pq_unit_madd_listen_from_template_v1.0.4_FINAL_AUDIO_GRID_FIX.html?managed=1&v=1.0.54',
    // sss
    
   
    'standing_match'         => '/pre_quraan/scripts/Standing_harakat8.html',
    'standing_speak'         => '/pre_quraan/scripts/Standing_harakat8.html',
    'standing_write'         => '/pre_quraan/scripts/Standing_harakat8.html',
    'standing_record'        => '/pre_quraan/scripts/Standing_harakat8.html',
    'standing_practice'      => '/pre_quraan/scripts/Standing_harakat8.html',
    'standing_quiz'          => '/pre_quraan/scripts/Standing_harakat8.html',

    // MaddoLeen detailed lessons
    'maddoleen_listen'       => '/pre_quraan/scripts/maddoleen_listen_v002.html',
    //  'maddoleen_listen'       => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_sqa_final_v1.0.0.html?managed=1&v=1.0.46',
    
    
    'maddoleen_match'        => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'maddoleen_speak'        => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'maddoleen_write'        => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'maddoleen_record'       => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'maddoleen_practice'     => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'maddoleen_quiz'         => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',

    // Sakoon & Jazm detailed lessons
    // 'sakoon_jazm_listen'     => '/pre_quraan/scripts/sakoon_jazm_listen_v002.html',
    
    // 'sakoon_jazm_listen'     => '/pre_quraan/scripts/pq_unit_sakoon_jazm_listen_sqa_final_v1.0.html?managed=1&v=1.0.48',
    
    // 'sakoon_jazm_listen'     => '/pre_quraan/scripts/pq_unit_sakoon_jazm_listen_clean_clone_v2.html?managed=1&v=1.0.56',
    
    'sakoon_jazm_listen'     => '/pre_quraan/scripts/pq_unit_sakoon_jazm_listen_v1.4_COLUMN2_START.html?managed=1&v=1.0.77',
    
   
    
    
    'sakoon_jazm_match'      => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',
    'sakoon_jazm_speak'      => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',
    'sakoon_jazm_write'      => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',
    'sakoon_jazm_record'     => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',
    'sakoon_jazm_practice'   => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',
    'sakoon_jazm_quiz'       => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',

    // Ending of Rules detailed lessons
    // (adjust file name if your actual Ending Rules HTML is different)
    'ending_rules1'          => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_listen'    => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_match'     => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_speak'     => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_write'     => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_record'    => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_practice'  => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_quiz'      => '/pre_quraan/scripts/ending_rules1.html',

    // Tashdeed Shaddah detailed lessons
    'tashdeed_shaddah_intro'    => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    // 'tashdeed_shaddah_listen'   => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    // 'tashdeed_shaddah_listen'   => '/pre_quraan/scripts/tashdeed_shaddah_listen_v003.html',
    
    // 'tashdeed_shaddah_listen'   => '/pre_quraan/scripts/pq_unit_tashdeed_shaddah_listen_sqa_final_v1.0.html?managed=1&v=1.0.47',
    
    
    'tashdeed_shaddah_listen'   => '/pre_quraan/scripts/pq_unit_tashdeed_listen_v1.0_a.html?managed=1&v=1.0.82',
    
    
    
    // 'tashdeed_shaddah_match'    => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    
    'tashdeed_shaddah_match'    => '/pre_quraan/scripts/pq_unit_tashdeed_shaddah_match_sqa_final_v1.0.html?managed=1&v=1.0.57',
    
    // ssss
    
    'tashdeed_shaddah_speak'    => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    'tashdeed_shaddah_write'    => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    'tashdeed_shaddah_record'   => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    'tashdeed_shaddah_practice' => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    'tashdeed_shaddah_quiz'     => '/pre_quraan/scripts/tashdeed_shaddah12.html',

    // Tashdeed With Sukoon detailed lessons
    'tashdeed_sukoon_intro'    => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    // 'tashdeed_sukoon_listen'   => '/pre_quraan/scripts/tashdeed_sukoon_listen_v002.html',
    
    'tashdeed_sukoon_intro'    => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_listen'   => '/pre_quraan/scripts/pq_unit_tashdeed_sukoon_listen_sqa_final_v1.0.html?managed=1&v=1.0.48',
    
    
    
    'tashdeed_sukoon_match'    => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_speak'    => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_write'    => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_record'   => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_practice' => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_quiz'     => '/pre_quraan/scripts/tashdeed_sukoon2.html',

    // Tashdeed With tashdeed detailed lessons
    'tashdeed_tashdeed_intro'    => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_listen'   => '/pre_quraan/scripts/tashdeed_tashdeed_listen_v004.html',
    
    'tashdeed_tashdeed_listen'   => '/pre_quraan/scripts/pq_unit_tashdeed_tashdeed_listen_sqa_final_v1.html?managed=1&v=1.0.49',
    
    'tashdeed_tashdeed_match'    => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_speak'    => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_write'    => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_record'   => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_practice' => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_quiz'     => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',

    // Tashdeed With Haroof Maddah detailed lessons (and Haroof Maddah short aliases)
    'tashdeed_maddah_intro'    => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    // 'tashdeed_maddah_listen'   => '/pre_quraan/scripts/tashdeed_with_haroof12.html',
    
    'tashdeed_maddah_listen'   => '/pre_quraan/scripts/pq_unit_tashdeed_with_haroof_listen_sqa_final_v1.0.html?managed=1&v=1.0.49',
    
    'tashdeed_maddah_match'    => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    'tashdeed_maddah_speak'    => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    'tashdeed_maddah_write'    => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    'tashdeed_maddah_record'   => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    'tashdeed_maddah_practice' => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    'tashdeed_maddah_quiz'     => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
];

// Case-insensitive slug lookup (prevents 'not picking correct file' due to case/spacing)
$mapLower = array_change_key_case($map, CASE_LOWER);


// --- inputs (allow absolute paths) ---
$goto = optional_param('goto', '', PARAM_RAW_TRIMMED);
if ($goto === '') {
    foreach (['page', 'route', 'r', 'link', 'target', 'url', 'u'] as $pn) {
        $v = optional_param($pn, '', PARAM_RAW_TRIMMED);
        if ($v !== '') {
            $goto = $v;
            break;
        }
    }
}
$keyParam  = optional_param('key',  '', PARAM_ALPHANUMEXT);
$fileParam = optional_param('file', '', PARAM_RAW_TRIMMED);

// --- audio fast-path via origin proxy ---
$handleAudio = function(string $fileRel) use ($audioProxyCandidates) {
    $fileRel = ltrim($fileRel, '/');
    $proxyPath = null;
    foreach ($audioProxyCandidates as $cand) {
        if (is_file($cand)) {
            $proxyPath = $cand;
            break;
        }
    }
    if (!$proxyPath) {
        header('Content-Type: text/plain; charset=utf-8');
        http_response_code(500);
        echo "Server misconfigured: audio proxy not found.\nTried:\n - " . implode("\n - ", $audioProxyCandidates);
        exit;
    }
    if ($fileRel !== '') {
        $_GET['file'] = $fileRel;
    }
    require $proxyPath; // streams mp3 with CORS/Range
    exit;
};

if ($keyParam !== '')  {
    $handleAudio('arabic_alphabet/' . $keyParam . '.mp3');
}
if ($fileParam !== '') {
    $handleAudio($fileParam);
}
if ($goto !== '') {
    $low = strtolower($goto);
    if (substr($low, -4) === '.mp3' || strpos($low, 'arabic_alphabet/') !== false) {
        $rel = (substr($low, -4) === '.mp3') ? $goto : $goto . '.mp3';
        $handleAudio($rel);
    }
}

// --- HTML path resolution ---
$resolvePath = function(string $slugOrPath) use ($map, $mapLower): string {
    $s = trim($slugOrPath);
    if ($s === '') {
        return '/pre_quraan/scripts/newui_main_menu.html';
    }

    // If it's a known slug, return the mapped value (can be relative path or absolute URL)
    if (array_key_exists($s, $map)) {
        return $map[$s];
    }

    $k = strtolower($s);
    if (array_key_exists($k, $mapLower)) {
        return $mapLower[$k];
    }

    $low = strtolower($s);

    // If a direct filename is passed (e.g. pq_unit_xxx.html), allow it under /pre_quraan/scripts/
    if (preg_match('~^[a-z0-9_\-\.]+\.(html|htm)$~i', $s)) {
        return '/pre_quraan/scripts/' . $s;
    }

    // If it's already an absolute URL, keep as-is
    if (preg_match('~^https?://~', $low)) {
        return $s;
    }

    // Absolute internal path
    if ($low[0] === '/') {
        return $s;
    }

    // Speak pattern (legacy)
    if (preg_match('/^speak\s*0*([0-9]{1,3})$/i', $low, $m)) {
        $n  = (int)$m[1];
        $nn = ($n < 10 ? '0' . $n : (string)$n);
        return "/pre_quraan/scripts/newui_alphabet_speak{$nn}.html";
    }

    // Raw html file name
    if (substr($low, -5) === '.html') {
        return '/pre_quraan/scripts/' . $s;
    }

    // Clean fallback
    $safe = preg_replace('/[^A-Za-z0-9_\-\.]/', '', $s);
    if ($safe === '') {
        print_error('invalidarg');
    }
    if (substr(strtolower($safe), -5) !== '.html') {
        $safe .= '.html';
    }
    return '/pre_quraan/scripts/' . $safe;
};

$path = $resolvePath($goto);

// --- Moodle payload + mtoken ---

$custom  = profile_user_record($USER->id, false);

// =============================================================
// Lesson mode flag (Phase 1):
// Determine whether THIS user is a Managed Student.
// Priority: explicit query param managed_student (0/1) -> profile custom field -> default false
// NOTE: profile_user_record returns custom fields as properties by shortname.
// We support common shortnames: managed_student, managedstudent, managed
// =============================================================
$managedOverrideRaw = optional_param('managed_student', '', PARAM_RAW_TRIMMED);
$isManagedStudent = false;
if ($managedOverrideRaw !== '') {
    $v = strtolower(trim($managedOverrideRaw));
    $isManagedStudent = in_array($v, ['1','true','yes','on'], true);
} else {
    $candidates = ['managed_student', 'managedstudent', 'managed'];
    foreach ($candidates as $k) {
        if (isset($custom->{$k}) && $custom->{$k} !== '' && $custom->{$k} !== null) {
            $vv = strtolower(trim((string)$custom->{$k}));
            $isManagedStudent = in_array($vv, ['1','true','yes','on'], true);
            break;
        }
    }
}
$managedFlag = $isManagedStudent ? '1' : '0';

$payload = [
    'name'        => fullname($USER),
    'email'       => $USER->email ?? '',
    'parent_name' => $custom->parent_name ?? '',
    'lang'        => $USER->lang ?? '',
];
$mtoken = bin2hex(random_bytes(16));

$DB->insert_record('local_hubredirect_tok', (object)[
    'token'       => $mtoken,
    'payloadjson' => json_encode($payload, JSON_UNESCAPED_UNICODE),
    'expires'     => time() + $ttlMTok,
    'consumed'    => 0,
    'timecreated' => time(),
]);

// --- HTML signing & redirect ---
$expires  = time() + $ttlCdn;
$clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';

$append = function(string $url, string $k, string $v): string {
    return $url . (strpos($url, '?') === false ? '?' : '&')
           . rawurlencode($k) . '=' . rawurlencode($v);
};

// Determine if target is absolute (http/https). If yes, DO NOT prefix with CDN or sign.
$isAbsolute = (bool)preg_match('~^https?://~i', $path);

if ($isAbsolute) {
    $dest = $path;  // direct Moodle URL, no Bunny signing
} else {
    $dest = $cdnBase . $path;

    if ($signHtml && $secKey !== '' && $HTML_SIGN_MODE !== 'plain') {
        if ($HTML_SIGN_MODE === 'basic') {
            $concat = $secKey . $path . $expires . ($useIpBind ? $clientIp : '');
            $tokenB = b64url(md5($concat, true)); // BINARY md5 → base64url
            $dest   = $append($dest, 'token',   $tokenB);
            $dest   = $append($dest, 'expires', (string)$expires);
            if ($useIpBind) {
                $dest = $append($dest, 'ip', $clientIp);
            }
        } else { // 'urltoken'
            $concat = $secKey . $path . $expires . ($useIpBind ? $clientIp : '');
            $tokenH = md5($concat); // HEX md5
            $dest   = $append($dest, 'token',   $tokenH);
            $dest   = $append($dest, 'expires', (string)$expires);
            if ($useIpBind) {
                $dest = $append($dest, 'ip', $clientIp);
            }
        }
    }
}

// mtoken is appended for both Bunny-served pages and absolute Moodle pages
// mtoken is appended for both Bunny-served pages and absolute Moodle pages
$dest = $append($dest, 'mtoken', $mtoken);

// Phase 1: explicit lesson mode flag for unit scripts
$dest = $append($dest, 'managed_student', $managedFlag);

// Phase 1 safety: if user is NOT managed, strip any legacy managed=1 hints from the destination URL.
// This prevents "unmanaged" HTML pages (or map entries) from forcing managed behavior.
if ($managedFlag !== '1') {
    try {
        $partsU = parse_url($dest);
        $qU = [];
        if (!empty($partsU['query'])) {
            parse_str($partsU['query'], $qU);
            unset($qU['managed']);
            unset($qU['userid'], $qU['uid'], $qU['wstoken'], $qU['ws']);
        }
        $rebU = '';
        if (!empty($partsU['scheme']) && !empty($partsU['host'])) {
            $rebU .= $partsU['scheme'] . '://' . $partsU['host'] . (!empty($partsU['port']) ? (':' . $partsU['port']) : '');
        }
        $rebU .= ($partsU['path'] ?? '');
        if (!empty($qU)) {
            $rebU .= '?' . http_build_query($qU, '', '&', PHP_QUERY_RFC3986);
        }
        if (!empty($partsU['fragment'])) {
            $rebU .= '#' . $partsU['fragment'];
        }
        if (!empty($rebU)) $dest = $rebU;
    } catch (Throwable $e) {
        // ignore
    }
}



// NEW: append WS token for PreQuran managed lessons.
$wstoken = get_config('local_prequran', 'ws_token');

if (optional_param('showtoken', 0, PARAM_INT)) {
    header('Content-Type: text/plain; charset=utf-8');
    echo "uid={$USER->id}\n";
    echo "token_len=" . strlen((string)$wstoken) . "\n";
    echo "token_prefix=" . substr((string)$wstoken, 0, 6) . "\n";
    echo "token_suffix=" . substr((string)$wstoken, -6) . "\n";
    echo "service_user=prequran_ws@ehelacademy.org\n";
    exit;
}


if ($managedFlag === '1' && !empty($wstoken)) {
    // Back-compat: core reads wstoken/ws; some unit scripts used ws.
    $dest = $append($dest, 'wstoken', $wstoken);
}

// NEW: append the Moodle user id (managed units only)
if ($managedFlag === '1') {
    $dest = $append($dest, 'uid', $USER->id);
}

// Debug
$debug = optional_param('debug', 0, PARAM_INT);
if ($debug) {
    header('Content-Type: text/plain; charset=utf-8');
    echo "mode: {$HTML_SIGN_MODE}\n";
    echo "path: {$path}\n";
    echo "is_absolute: " . ($isAbsolute ? 'yes' : 'no') . "\n";
    echo "expires: {$expires}\n";
    echo "client_ip: " . ($useIpBind ? $clientIp : '[none]') . "\n";
    if (!$isAbsolute && $HTML_SIGN_MODE === 'basic') {
        $concat = $secKey . $path . $expires . ($useIpBind ? $clientIp : '');
        echo "basic_md5_input: {$concat}\n";
        echo "basic_token: " . b64url(md5($concat, true)) . "\n";
    } elseif (!$isAbsolute && $HTML_SIGN_MODE === 'urltoken') {
        $concat = $secKey . $path . $expires . ($useIpBind ? $clientIp : '');
        echo "urltoken_md5_input: {$concat}\n";
        echo "urltoken_token: " . md5($concat) . "\n";
    } else {
        echo "plain or absolute (no Bunny token)\n";
    }
    echo "dest:\n{$dest}\n";
    exit;
}


// ===== Unified iframe wrapper for managed CDN-served lessons =====

// --- Debug (add ?debug=1) ---
$debug = optional_param('debug', 0, PARAM_INT);
if ($debug) {
    header('Content-Type: text/plain; charset=utf-8');
    echo "goto={$goto}\n";
    echo "resolved_path={$path}\n";
    echo "dest={$dest}\n";
    echo "cdnBase={$cdnBase}\n";
    echo "isAbsolute=" . ($isAbsolute ? '1' : '0') . "\n";
    echo "signHtml=" . ($signHtml ? '1' : '0') . "\n";
    exit;
}

$useIframeWrapper = false;
try {
    // Only wrap MANAGED lessons served from CDN/relative paths.
    // Unmanaged lessons should remain free-practice and must not be wrapped.
    if ($managedFlag === '1' && !$isAbsolute) {
        $useIframeWrapper = true;
    }
} catch (Throwable $e) {
    $useIframeWrapper = false;
}

if ($useIframeWrapper) {
    $iframeSrc = $dest;
    $iframeOrigin = '';

    try {
        $parts = parse_url($iframeSrc);

        if (!empty($parts['scheme']) && !empty($parts['host'])) {
            $iframeOrigin = $parts['scheme'] . '://' . $parts['host'] . (!empty($parts['port']) ? (':' . $parts['port']) : '');
        } else {
            $iframeOrigin = hub_origin_from_url($cdnBase);
            if ($iframeOrigin === '') {
                $iframeOrigin = rtrim($cdnBase, '/');
            }
        }

        $pathOnly = $parts['path'] ?? $iframeSrc;
        $queryArr = [];
        if (!empty($parts['query'])) {
            parse_str($parts['query'], $queryArr);
        }

        // Preserve managed hints and cache-busters, but do not leak uid/wstoken in the iframe URL.
        unset($queryArr['uid'], $queryArr['userid'], $queryArr['wstoken'], $queryArr['ws'], $queryArr['wsendpoint']);
        $queryArr['managed'] = '1';

        $iframeSrc = $iframeOrigin . $pathOnly;
        if (!empty($queryArr)) {
            $iframeSrc .= '?' . http_build_query($queryArr, '', '&', PHP_QUERY_RFC3986);
        }
        if (!empty($parts['fragment'])) {
            $iframeSrc .= '#' . $parts['fragment'];
        }
    } catch (Throwable $e) {
        $iframeOrigin = hub_origin_from_url($cdnBase);
        if ($iframeOrigin === '') {
            $iframeOrigin = rtrim($cdnBase, '/');
        }
    }

    $uid_to_send = (int)$USER->id;
    $wstoken_to_send = (string)get_config('local_prequran', 'ws_token');
    $wsendpoint = 'https://quraan.academy/webservice/rest/server.php';

    hub_render_lesson_iframe_wrapper(
        $iframeSrc,
        $uid_to_send,
        $wstoken_to_send,
        $wsendpoint,
        $iframeOrigin,
        'Lesson'
    );
}

redirect($dest);
