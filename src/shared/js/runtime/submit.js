/*
  EduPlatform shared Submit step.
  Audio-only, full-unit teacher submission with practice media.
*/

const __pqSubmitState = {
  mounted: false,
  stream: null,
  recorder: null,
  chunks: [],
  blob: null,
  blobUrl: '',
  startedAt: 0,
  durationMs: 0,
  selectedKey: '',
  practiceMode: 'listen',
  uploading: false,
  submitted: false,
  lastResult: null
};

function __pqSubmitIsCurrentStep() {
  try {
    const cur = (typeof getCurrentStep === 'function') ? getCurrentStep() : null;
    return !!(cur && cur.step && String(cur.step.id || '').toLowerCase() === 'submit');
  } catch (_e) {
    return false;
  }
}

function __pqSubmitCfg(path, fallback) {
  return __cfg('submit.' + path, fallback);
}

function __pqSubmitText(path, fallback) {
  return String(__pqSubmitCfg('uiText.' + path, fallback));
}

function __pqSubmitMount() {
  let mount = document.getElementById('submitMount');
  if (mount) return mount;

  const speakMount = document.getElementById('speakMount');
  mount = document.createElement('section');
  mount.id = 'submitMount';
  mount.className = 'pq-submit-mount';
  mount.setAttribute('aria-label', 'Submit recording');

  if (speakMount && speakMount.parentNode) {
    speakMount.parentNode.insertBefore(mount, speakMount.nextSibling);
  } else {
    const gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap && gridWrap.parentNode) {
      gridWrap.parentNode.insertBefore(mount, gridWrap);
    } else {
      document.body.appendChild(mount);
    }
  }
  return mount;
}

function __pqSubmitItems() {
  try {
    const limit = Number(__cfg('wordLimit', 0) || 0);
    const arr = Array.isArray(LETTERS) ? LETTERS.slice() : [];
    return limit > 0 ? arr.slice(0, limit) : arr;
  } catch (_e) {
    return [];
  }
}

function __pqSubmitItemLabel(item) {
  const en = String((item && (item.en || item.name)) || '').trim();
  const ar = String((item && (item.ar || item.text || item.small)) || '').trim();
  if (en && ar) return en + ' - ' + ar;
  return en || ar || String((item && item.key) || '');
}

function __pqSubmitSafePart(value, fallback) {
  const clean = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return clean || fallback || 'recording';
}

function __pqSubmitMimeToExtension(mime) {
  const m = String(mime || '').toLowerCase();
  if (m.indexOf('ogg') >= 0) return 'ogg';
  if (m.indexOf('mp4') >= 0) return 'm4a';
  if (m.indexOf('mpeg') >= 0 || m.indexOf('mp3') >= 0) return 'mp3';
  if (m.indexOf('wav') >= 0) return 'wav';
  return 'webm';
}

function __pqSubmitPickMime() {
  try {
    if (!window.MediaRecorder || typeof MediaRecorder.isTypeSupported !== 'function') return '';
    const types = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm'];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  } catch (_e) {
    return '';
  }
}

function __pqSubmitBlobToBase64(blob) {
  if (typeof __pqSpeakBlobToBase64 === 'function') return __pqSpeakBlobToBase64(blob);
  return new Promise(function (resolve, reject) {
    try {
      const reader = new FileReader();
      reader.onload = function () {
        const value = String(reader.result || '');
        resolve(value.indexOf(',') >= 0 ? value.split(',').pop() : value);
      };
      reader.onerror = function () {
        reject(reader.error || new Error('Could not read recording.'));
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      reject(err);
    }
  });
}

async function __pqSubmitCallMoodleWs(params) {
  if (typeof __pqSpeakCallMoodleWs === 'function') return __pqSpeakCallMoodleWs(params);
  const core = (typeof pqResolveCore === 'function') ? pqResolveCore() : null;
  if (core && typeof core.wsGet === 'function') return core.wsGet(params);
  throw new Error('Moodle web service bridge is not available.');
}

function __pqSubmitFilename(uid, mime) {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return [
    'user_' + __pqSubmitSafePart(uid, 'unknown'),
    __pqSubmitSafePart(__cfg('unitid', __PQ_UNIT_ID), 'unit'),
    'full_unit',
    stamp
  ].join('_') + '.' + __pqSubmitMimeToExtension(mime);
}

function __pqSubmitSetStatus(message, tone) {
  const el = document.getElementById('pqSubmitStatus');
  if (!el) return;
  el.textContent = String(message || '');
  el.dataset.tone = tone || '';
}

function __pqSubmitRefreshPracticeMode() {
  const listen = document.getElementById('pqSubmitPlayAudio');
  const watch = document.getElementById('pqSubmitPlayVideo');
  const mode = __pqSubmitState.practiceMode === 'watch' ? 'watch' : 'listen';
  if (listen) {
    listen.classList.toggle('is-active', mode === 'listen');
    listen.setAttribute('aria-pressed', mode === 'listen' ? 'true' : 'false');
  }
  if (watch) {
    watch.classList.toggle('is-active', mode === 'watch');
    watch.setAttribute('aria-pressed', mode === 'watch' ? 'true' : 'false');
  }
}

function __pqSubmitSetPracticeMode(mode) {
  __pqSubmitState.practiceMode = mode === 'watch' ? 'watch' : 'listen';
  __pqSubmitRefreshPracticeMode();
}

function __pqSubmitRefreshButtons() {
  const start = document.getElementById('pqSubmitStart');
  const stop = document.getElementById('pqSubmitStop');
  const retry = document.getElementById('pqSubmitRetry');
  const send = document.getElementById('pqSubmitSend');
  const playback = document.getElementById('pqSubmitPlayback');
  const isRecording = !!(__pqSubmitState.recorder && __pqSubmitState.recorder.state !== 'inactive');

  if (start) start.disabled = isRecording || __pqSubmitState.uploading || __pqSubmitState.submitted;
  if (stop) stop.disabled = !isRecording;
  if (retry) retry.disabled = isRecording || __pqSubmitState.uploading || !__pqSubmitState.blob || __pqSubmitState.submitted;
  if (send) send.disabled = isRecording || __pqSubmitState.uploading || !__pqSubmitState.blob || __pqSubmitState.submitted;
  if (playback) playback.disabled = !__pqSubmitState.blob;
}

function __pqSubmitApplySubmitted(result) {
  __pqSubmitState.submitted = true;
  __pqSubmitState.lastResult = result || __pqSubmitState.lastResult;
  const card = document.getElementById('pqSubmitCard');
  if (card) card.classList.add('is-submitted');
  __pqSubmitSetStatus(__pqSubmitText('submittedStatus', 'Submitted for teacher review.'), 'success');
  __pqSubmitRefreshButtons();
}

async function __pqSubmitCompleteStep(result) {
  try {
    window.__pq_last_submit_upload_result = result;
  } catch (_e) {}

  try {
    if (__LessonRuntime && typeof __LessonRuntime.completeStep === 'function') {
      const runtimeResult = await __LessonRuntime.completeStep('submit');
      if (typeof __pqApplyRuntimeCompletion === 'function') {
        __pqApplyRuntimeCompletion('submit', runtimeResult);
      }
    } else if (managedProgress && managedProgress.submit) {
      managedProgress.submit.passesDone = Math.max(
        Number(managedProgress.submit.passesDone || 0),
        Number(managedProgress.submit.passesRequired || 1)
      );
      managedProgress.submit.completed = true;
      if (typeof advanceStepIfNeeded === 'function') advanceStepIfNeeded();
    }
  } catch (_e) {}

  try { renderStepper(); } catch (_e) {}
  try { updateControlsForCurrentStep(); } catch (_e) {}
  try { __pqSyncSubmitUi(); } catch (_e) {}
  try { __pqAfterProgressChange(true); } catch (_e) {}
}

function __pqSubmitReleaseMic() {
  try {
    if (__pqSubmitState.stream) {
      __pqSubmitState.stream.getTracks().forEach((track) => {
        try { track.stop(); } catch (_e) {}
      });
    }
  } catch (_e) {}
  __pqSubmitState.stream = null;
}

async function __pqSubmitStartRecording() {
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    __pqSubmitSetStatus('Recording is not supported in this browser.', 'error');
    return;
  }
  if (!window.MediaRecorder) {
    __pqSubmitSetStatus('MediaRecorder is not supported in this browser.', 'error');
    return;
  }

  try {
    __pqSubmitReleaseMic();
    __pqSubmitState.chunks = [];
    __pqSubmitState.blob = null;
    __pqSubmitState.durationMs = 0;
    if (__pqSubmitState.blobUrl) {
      try { URL.revokeObjectURL(__pqSubmitState.blobUrl); } catch (_e) {}
      __pqSubmitState.blobUrl = '';
    }

    const constraints = { audio: { echoCancellation: true, noiseSuppression: true } };
    __pqSubmitState.stream = await navigator.mediaDevices.getUserMedia(constraints);
    const mt = __pqSubmitPickMime();
    const rec = new MediaRecorder(__pqSubmitState.stream, mt ? { mimeType: mt } : undefined);
    __pqSubmitState.recorder = rec;
    __pqSubmitState.startedAt = Date.now();

    rec.ondataavailable = function (ev) {
      try {
        if (ev.data && ev.data.size) __pqSubmitState.chunks.push(ev.data);
      } catch (_e) {}
    };

    rec.onstop = function () {
      const chunks = __pqSubmitState.chunks || [];
      const blob = chunks.length ? new Blob(chunks, { type: rec.mimeType || mt || 'audio/webm' }) : null;
      __pqSubmitState.blob = blob;
      __pqSubmitState.durationMs = Math.max(0, Date.now() - (__pqSubmitState.startedAt || Date.now()));
      __pqSubmitState.recorder = null;
      __pqSubmitReleaseMic();

      const playback = document.getElementById('pqSubmitPlayback');
      if (blob && playback) {
        __pqSubmitState.blobUrl = URL.createObjectURL(blob);
        playback.src = __pqSubmitState.blobUrl;
        playback.load();
      }

      __pqSubmitSetStatus(
        blob ? __pqSubmitText('readyStatus', 'Listen to your recording, then submit it.') : 'No recording captured. Try again.',
        blob ? 'ready' : 'error'
      );
      __pqSubmitRefreshButtons();
    };

    rec.start();
    __pqSubmitSetStatus(__pqSubmitText('recordingStatus', 'Recording...'), 'recording');
    __pqSubmitRefreshButtons();
  } catch (err) {
    __pqSubmitReleaseMic();
    __pqSubmitSetStatus('Microphone error: ' + ((err && err.message) || 'Please allow microphone access.'), 'error');
    __pqSubmitRefreshButtons();
  }
}

function __pqSubmitStopRecording() {
  try {
    if (__pqSubmitState.recorder && __pqSubmitState.recorder.state !== 'inactive') {
      __pqSubmitState.recorder.stop();
    }
  } catch (_e) {
    __pqSubmitReleaseMic();
  }
  __pqSubmitRefreshButtons();
}

function __pqSubmitRetryRecording() {
  try {
    if (__pqSubmitState.blobUrl) URL.revokeObjectURL(__pqSubmitState.blobUrl);
  } catch (_e) {}
  __pqSubmitState.blob = null;
  __pqSubmitState.blobUrl = '';
  __pqSubmitState.durationMs = 0;
  const playback = document.getElementById('pqSubmitPlayback');
  if (playback) {
    playback.removeAttribute('src');
    try { playback.load(); } catch (_e) {}
  }
  __pqSubmitSetStatus(__pqSubmitText('idleStatus', 'Ready when you are.'), '');
  __pqSubmitRefreshButtons();
}

async function __pqSubmitUpload() {
  if (!__pqSubmitState.blob || __pqSubmitState.uploading || __pqSubmitState.submitted) return;

  const maxBytes = Number(__pqSubmitCfg('recordingUpload.maxBytes', 6000000) || 6000000);
  if (maxBytes > 0 && __pqSubmitState.blob.size > maxBytes) {
    __pqSubmitSetStatus('Recording is too large. Please record a shorter version.', 'error');
    return;
  }

  if (
    typeof pqWaitForIframeTokens === 'function' &&
    (!((typeof pqGetUid === 'function') ? pqGetUid() : '') ||
    !((typeof pqGetToken === 'function') ? pqGetToken() : ''))
  ) {
    try { await pqWaitForIframeTokens(2500); } catch (_e) {}
  }

  const uid = (typeof pqGetUid === 'function') ? pqGetUid() : '';
  const token = (typeof pqGetToken === 'function') ? pqGetToken() : '';
  const wsFunction = String(__pqSubmitCfg('recordingUpload.wsFunction', 'local_prequran_save_submit_recording') || '');
  if (!uid || !token || !wsFunction) {
    __pqSubmitSetStatus('Missing Moodle session. Please reload from the Academy portal.', 'error');
    return;
  }

  __pqSubmitState.uploading = true;
  __pqSubmitRefreshButtons();
  __pqSubmitSetStatus(__pqSubmitText('uploadingStatus', 'Uploading for your teacher...'), 'recording');

  try {
    const blob = __pqSubmitState.blob;
    const mime = blob.type || 'audio/webm';
    const audioBase64 = await __pqSubmitBlobToBase64(blob);
    const result = await __pqSubmitCallMoodleWs({
      wsfunction: wsFunction,
      wstoken: token,
      userid: uid,
      lessonid: String(__cfg('lessonid', __pqIdentity('lessonId', 'tajweed'))),
      unitid: String(__cfg('unitid', __PQ_UNIT_ID)),
      step_id: 'submit',
      mime_type: mime,
      filename: __pqSubmitFilename(uid, mime),
      duration_ms: String(__pqSubmitState.durationMs || 0),
      audio_base64: audioBase64
    });

    __pqSubmitState.lastResult = result;
    try { window.__pq_last_submit_upload_result = result; } catch (_e) {}

    if (!result || result.ok === false || result.saved === false) {
      throw new Error((result && result.message) || 'Upload failed.');
    }

    __pqSubmitApplySubmitted(result);
    await __pqSubmitCompleteStep(result);
  } catch (err) {
    __pqSubmitSetStatus('Upload failed: ' + ((err && err.message) || 'Unknown error'), 'error');
  } finally {
    __pqSubmitState.uploading = false;
    __pqSubmitRefreshButtons();
  }
}

function __pqSubmitPracticeSelect(key) {
  __pqSubmitState.selectedKey = String(key || '');
  const items = __pqSubmitItems();
  const item = items.find((x) => x && x.key === key) || items[0] || null;
  const label = document.getElementById('pqSubmitSelectedLabel');
  if (label) label.textContent = item ? __pqSubmitItemLabel(item) : '';
}

function __pqSubmitPracticeAudio() {
  const key = __pqSubmitState.selectedKey;
  if (!key) return;
  try {
    const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1') || 1;
    playLetter(key, 1, rate, 'submit');
  } catch (_e) {}
}

function __pqSubmitPracticeVideo() {
  const key = __pqSubmitState.selectedKey;
  if (!key) return;
  try {
    const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1') || 1;
    playWatchVideoForKey(key, rate, 'watch').catch(function () {
      __pqSubmitSetStatus('Video is not available for this item yet.', 'error');
    });
  } catch (_e) {}
}

function __pqSubmitPracticeCurrentMode() {
  if (__pqSubmitState.practiceMode === 'watch') {
    __pqSubmitPracticeVideo();
  } else {
    __pqSubmitPracticeAudio();
  }
}

function __pqSubmitInstallStyle() {
  if (document.getElementById('pqSubmitStyle')) return;
  const style = document.createElement('style');
  style.id = 'pqSubmitStyle';
  style.textContent = `
.pq-submit-mount{display:none;margin:18px 0 24px;width:100%;direction:ltr}
.pq-submit-card{border-radius:28px;background:linear-gradient(180deg,#ffffff 0%,#f3fff7 100%);border:5px solid #d8f5df;box-shadow:0 18px 48px rgba(28,91,61,.14);padding:20px;color:#15382d}
.pq-submit-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px}
.pq-submit-badge{width:58px;height:58px;border-radius:20px;background:#78d895;color:#fff;display:grid;place-items:center;font-weight:1000;font-size:1.6rem;box-shadow:inset 0 -4px 0 rgba(0,0,0,.10)}
.pq-submit-title{font-size:clamp(1.35rem,2.4vw,2rem);font-weight:1000;letter-spacing:0;color:#10283a}
.pq-submit-record-title{font-size:1.08rem;font-weight:1000;color:#1b4c37;margin-top:2px}
.pq-submit-subtitle{font-size:.98rem;font-weight:900;color:#476255}
.pq-submit-grid{display:grid;grid-template-columns:1fr;gap:16px}
.pq-submit-panel{border:3px solid #e1f2e7;background:#fff;border-radius:22px;padding:16px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.7)}
.pq-submit-panel h3{margin:0 0 12px;color:#15382d;font-size:1.12rem;font-weight:1000;letter-spacing:0}
.pq-submit-picker{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px;max-height:min(42vh,360px);overflow:auto;padding:4px}
.pq-submit-item{border:2px solid #d8eddf;background:#f7fff9;border-radius:16px;padding:9px 8px;cursor:pointer;font-weight:1000;color:#1d4936;text-align:center;min-height:62px}
.pq-submit-item[aria-selected="true"]{background:#dcf7e5;border-color:#74cf91;box-shadow:0 8px 16px rgba(64,151,95,.16)}
.pq-submit-item-ar{display:block;font-family:"Noto Naskh Arabic","Noto Sans Arabic",serif;font-size:1.55rem;line-height:1.1}
.pq-submit-item-en{display:block;font-size:.82rem;color:#476255;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pq-submit-practice-actions,.pq-submit-rec-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px}
.pq-submit-btn{border:0;border-radius:16px;padding:12px 16px;font-weight:1000;cursor:pointer;background:#eef6ff;color:#18364a;box-shadow:inset 0 -3px 0 rgba(0,0,0,.08)}
.pq-submit-btn:hover{transform:translateY(-1px)}
.pq-submit-btn:disabled{opacity:.48;cursor:not-allowed;transform:none}
.pq-submit-btn.is-active{background:#7cda94;color:#103622;box-shadow:0 0 0 4px rgba(124,218,148,.22),inset 0 -3px 0 rgba(0,0,0,.10)}
.pq-submit-btn--green{background:#7cda94;color:#103622}
.pq-submit-btn--yellow{background:#ffc96a;color:#4b3102}
.pq-submit-btn--primary{background:#4fae69;color:#fff;font-size:1.02rem}
.pq-submit-selected{display:inline-flex;align-items:center;min-height:42px;padding:8px 12px;border-radius:999px;border:2px solid #dbeee2;background:#f8fffb;font-weight:1000;color:#1d4936}
.pq-submit-recbox{border:3px solid #e2f2e8;border-radius:20px;background:#f8fffb;padding:12px}
.pq-submit-wave{min-height:84px;border-radius:18px;background:linear-gradient(135deg,#e7f8ee,#fff7d6);display:grid;place-items:center;border:2px dashed #c8ecd2;color:#24613f;font-weight:1000;text-align:center;padding:14px}
.pq-submit-playback{width:100%;margin-top:12px}
.pq-submit-status{margin-top:12px;min-height:26px;font-weight:1000;color:#476255}
.pq-submit-status[data-tone="success"]{color:#19713c}
.pq-submit-status[data-tone="error"]{color:#a02f2f}
.pq-submit-status[data-tone="recording"]{color:#9a6412}
.pq-submit-done{display:none;margin-top:12px;border:2px solid #bfeacb;background:#edfff2;color:#176337;border-radius:18px;padding:12px 14px;font-weight:1000}
.pq-submit-card.is-submitted .pq-submit-done{display:block}
@media(max-width:820px){.pq-submit-card{border-radius:22px;padding:14px}.pq-submit-picker{grid-template-columns:repeat(auto-fill,minmax(88px,1fr));max-height:260px}}
`;
  document.head.appendChild(style);
}

function __pqSubmitRender() {
  const mount = __pqSubmitMount();
  if (!mount || __pqSubmitState.mounted) return;
  __pqSubmitInstallStyle();

  const items = __pqSubmitItems();
  const first = items[0] || null;
  __pqSubmitState.selectedKey = first ? first.key : '';

  mount.innerHTML = `
    <div class="pq-submit-card" id="pqSubmitCard">
      <div class="pq-submit-head">
        <div class="pq-submit-badge" aria-hidden="true">✓</div>
        <div>
          <div class="pq-submit-title">${__pqSubmitText('title', 'Submit')}</div>
          <div class="pq-submit-record-title">${__pqSubmitText('recordTitle', 'Record the whole unit')}</div>
          <div class="pq-submit-subtitle">${__pqSubmitText('subtitle', 'Practice, record the whole unit, then send it to your teacher.')}</div>
        </div>
      </div>
      <div class="pq-submit-grid">
        <section class="pq-submit-panel">
          <h3>${__pqSubmitText('practiceTitle', 'Practice first')}</h3>
          <div class="pq-submit-selected" id="pqSubmitSelectedLabel"></div>
          <div class="pq-submit-practice-actions">
            <button type="button" class="pq-submit-btn" id="pqSubmitPlayAudio">${__pqSubmitText('listenButton', 'Listen')}</button>
            <button type="button" class="pq-submit-btn" id="pqSubmitPlayVideo">${__pqSubmitText('watchButton', 'Watch')}</button>
          </div>
          <div class="pq-submit-picker" id="pqSubmitPicker" aria-label="Practice items"></div>
        </section>
        <section class="pq-submit-panel">
          <div class="pq-submit-recbox">
            <div class="pq-submit-wave">${__pqSubmitText('recordHint', 'Say all letters or words together in one clear recording.')}</div>
            <div class="pq-submit-rec-actions">
              <button type="button" class="pq-submit-btn pq-submit-btn--green" id="pqSubmitStart">${__pqSubmitText('startButton', 'Start recording')}</button>
              <button type="button" class="pq-submit-btn pq-submit-btn--yellow" id="pqSubmitStop" disabled>${__pqSubmitText('stopButton', 'Stop')}</button>
              <button type="button" class="pq-submit-btn" id="pqSubmitRetry" disabled>${__pqSubmitText('retryButton', 'Try again')}</button>
            </div>
            <audio class="pq-submit-playback" id="pqSubmitPlayback" controls></audio>
            <div class="pq-submit-rec-actions">
              <button type="button" class="pq-submit-btn pq-submit-btn--primary" id="pqSubmitSend" disabled>${__pqSubmitText('submitButton', 'Submit for teacher')}</button>
            </div>
            <div class="pq-submit-status" id="pqSubmitStatus"></div>
            <div class="pq-submit-done">${__pqSubmitText('doneMessage', 'Your recording was sent to your teacher.')}</div>
          </div>
        </section>
      </div>
    </div>
  `;

  const picker = document.getElementById('pqSubmitPicker');
  if (picker) {
    items.forEach(function (item) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pq-submit-item';
      btn.dataset.key = item.key;
      btn.setAttribute('aria-selected', item.key === __pqSubmitState.selectedKey ? 'true' : 'false');
      btn.innerHTML = '<span class="pq-submit-item-ar"></span><span class="pq-submit-item-en"></span>';
      const ar = btn.querySelector('.pq-submit-item-ar');
      const en = btn.querySelector('.pq-submit-item-en');
      if (ar) ar.textContent = String(item.ar || item.text || item.small || '');
      if (en) en.textContent = String(item.en || item.name || item.key || '');
      btn.addEventListener('click', function () {
        picker.querySelectorAll('.pq-submit-item').forEach((node) => node.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        __pqSubmitPracticeSelect(item.key);
        __pqSubmitPracticeCurrentMode();
      });
      picker.appendChild(btn);
    });
  }

  __pqSubmitPracticeSelect(__pqSubmitState.selectedKey);
  document.getElementById('pqSubmitPlayAudio')?.addEventListener('click', function () {
    __pqSubmitSetPracticeMode('listen');
    __pqSubmitPracticeAudio();
  });
  document.getElementById('pqSubmitPlayVideo')?.addEventListener('click', function () {
    __pqSubmitSetPracticeMode('watch');
    __pqSubmitPracticeVideo();
  });
  document.getElementById('pqSubmitStart')?.addEventListener('click', __pqSubmitStartRecording);
  document.getElementById('pqSubmitStop')?.addEventListener('click', __pqSubmitStopRecording);
  document.getElementById('pqSubmitRetry')?.addEventListener('click', __pqSubmitRetryRecording);
  document.getElementById('pqSubmitSend')?.addEventListener('click', __pqSubmitUpload);

  __pqSubmitState.mounted = true;
  __pqSubmitRefreshPracticeMode();
  __pqSubmitSetStatus(__pqSubmitText('idleStatus', 'Ready when you are.'), '');
  __pqSubmitRefreshButtons();
}

function __pqSyncSubmitUi() {
  try {
    const mount = __pqSubmitMount();
    __pqSubmitRender();
    const active = __pqSubmitIsCurrentStep();
    mount.style.display = active ? 'block' : 'none';
    document.body.classList.toggle('pq-submit-step-active', active);

    const gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap) {
      gridWrap.style.display = active ? 'none' : '';
    }

    const progress = managedProgress && managedProgress.submit;
    if (progress && progress.completed) {
      __pqSubmitApplySubmitted(__pqSubmitState.lastResult || { ok: true, saved: true, duplicate: true });
    }
    __pqSubmitRefreshButtons();
  } catch (_e) {}
}

function __pqEnsureSubmitBoot() {
  try {
    __pqSubmitRender();
    __pqSyncSubmitUi();
  } catch (_e) {}
}

try {
  document.addEventListener('DOMContentLoaded', function () {
    try { __pqEnsureSubmitBoot(); } catch (_e) {}
  });
  document.addEventListener('pq:open-step-review', function () {
    setTimeout(function () { try { __pqSyncSubmitUi(); } catch (_e) {} }, 0);
  });
} catch (_e) {}
