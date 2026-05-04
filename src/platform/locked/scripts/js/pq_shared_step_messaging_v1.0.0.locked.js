// pq_shared_step_messaging_v2.0.0.js
// Fully unified shared step messaging engine
// ------------------------------------------------------------
// Purpose:
// - Single source of truth for lesson messages
// - Handles step entry messages
// - Handles pass-level entry messages
// - Handles final unit completion messages
// - Handles optional visual effects
// - Replaces legacy completion-feedback and completion-effects audio flow
// ------------------------------------------------------------

(function (window) {
  'use strict';

  const VERSION = 'v2.0.0';

  if (
    window.PQSharedStepMessagingV2 &&
    typeof window.PQSharedStepMessagingV2 === 'object' &&
    window.PQSharedStepMessagingV2.__version
  ) {
    return;
  }

  function toStr(value) {
    return String(value == null ? '' : value).trim();
  }

  function safeArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function isObj(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeStepId(stepId) {
    const raw = toStr(stepId).toLowerCase();
    if (!raw) return '';
    if (raw === 'write' || raw === 'trace') return 'trace1';
    return raw;
  }

  function resolveAudio(base, value) {
    const raw = toStr(value);
    if (!raw) return '';
    if (/^https?:/i.test(raw)) return raw;
    return toStr(base) + raw;
  }

  function createAudioController() {
    const audio = new Audio();
    audio.preload = 'auto';

    let token = 0;

    async function play(url) {
      const myToken = ++token;
      const src = toStr(url);
      if (!src) return false;

      try {
        audio.pause();
      } catch (_e) {}

      try {
        audio.currentTime = 0;
      } catch (_e) {}

      audio.src = src;

      try {
        await audio.play();
        if (myToken !== token) return false;
        return true;
      } catch (_e) {
        return false;
      }
    }

    function stop() {
      token += 1;
      try {
        audio.pause();
      } catch (_e) {}
      try {
        audio.currentTime = 0;
      } catch (_e) {}
    }

    return { play, stop };
  }

  function ensureModal(titleText, continueText) {
    let root = document.getElementById('__pq_msg_v2_modal');
    if (root) {
      const titleEl = root.querySelector('[data-role="title"]');
      const btnEl = root.querySelector('[data-role="continue"]');
      if (titleEl) titleEl.textContent = titleText || '😊 Message';
      if (btnEl) btnEl.textContent = continueText || 'Continue';
      return root;
    }

    const styleId = '__pq_msg_v2_style';
    if (!document.getElementById(styleId)) {
      const st = document.createElement('style');
      st.id = styleId;
      st.textContent = `
#__pq_msg_v2_modal{
  position:fixed; inset:0; display:none; align-items:center; justify-content:center;
  background:rgba(0,0,0,.38); z-index:2147483646; padding:20px;
}
#__pq_msg_v2_modal.show{ display:flex; }
#__pq_msg_v2_modal .pq-msg-card{
  width:min(680px,92vw);
  background:#fff;
  border-radius:22px;
  box-shadow:0 18px 70px rgba(0,0,0,.24);
  overflow:hidden;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
}
#__pq_msg_v2_modal .pq-msg-head{
  padding:18px 22px 10px;
  font-size:24px;
  font-weight:800;
  color:#10223a;
}
#__pq_msg_v2_modal .pq-msg-body{
  padding:0 22px 18px;
  font-size:21px;
  line-height:1.55;
  color:#21354b;
  white-space:pre-wrap;
}
#__pq_msg_v2_modal .pq-msg-foot{
  display:flex;
  justify-content:flex-end;
  padding:0 22px 22px;
}
#__pq_msg_v2_modal .pq-msg-btn{
  border:0;
  border-radius:14px;
  background:#1e88e5;
  color:#fff;
  padding:12px 20px;
  font-size:16px;
  font-weight:800;
  cursor:pointer;
}
#__pq_msg_v2_fx{
  position:fixed; inset:0; pointer-events:none; z-index:2147483647;
}
#__pq_msg_v2_fx .s{
  position:absolute; will-change:transform,opacity;
}
@keyframes pqMsgV2StarPop{
  0%{transform:translate(0,0) scale(.75);opacity:0}
  10%{opacity:1}
  65%{opacity:1}
  100%{transform:translate(var(--dx),var(--dy)) scale(1.0);opacity:0}
}
`;
      document.head.appendChild(st);
    }

    root = document.createElement('div');
    root.id = '__pq_msg_v2_modal';
    root.innerHTML = `
      <div class="pq-msg-card" role="dialog" aria-modal="true" aria-labelledby="__pq_msg_v2_title">
        <div class="pq-msg-head" id="__pq_msg_v2_title" data-role="title">${titleText || '😊 Message'}</div>
        <div class="pq-msg-body" data-role="body"></div>
        <div class="pq-msg-foot">
          <button class="pq-msg-btn" type="button" data-role="continue">${continueText || 'Continue'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  function ensureFxHost() {
    let host = document.getElementById('__pq_msg_v2_fx');
    if (host) return host;
    host = document.createElement('div');
    host.id = '__pq_msg_v2_fx';
    document.body.appendChild(host);
    return host;
  }

  function runStars() {
    const host = ensureFxHost();
    host.innerHTML = '';

    const cx = Math.round(window.innerWidth * 0.5);
    const cy = Math.round(window.innerHeight * 0.30);
    const count = 26;

    for (let i = 0; i < count; i += 1) {
      const el = document.createElement('div');
      el.className = 's';
      el.textContent = '⭐';
      el.style.left = cx + 'px';
      el.style.top = cy + 'px';
      el.style.fontSize = (18 + Math.floor(Math.random() * 24)) + 'px';

      const ang = (Math.PI * 2) * (i / count);
      const dist = 120 + Math.random() * 160;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;

      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      el.style.animation =
        `pqMsgV2StarPop ${1400 + Math.floor(Math.random() * 500)}ms cubic-bezier(.2,.8,.2,1) forwards`;

      host.appendChild(el);
    }

    setTimeout(function () {
      try {
        host.innerHTML = '';
      } catch (_e) {}
    }, 2500);
  }

  function create(options) {
    const opts = isObj(options) ? options : {};
    const unitCfg = isObj(opts.unitCfg) ? opts.unitCfg : (window.UNIT_CFG || {});
    const getProgress =
      typeof opts.getProgress === 'function'
        ? opts.getProgress
        : function () { return null; };
    const getSteps =
      typeof opts.getSteps === 'function'
        ? opts.getSteps
        : function () { return safeArray(unitCfg.messageStepKeys); };

    const titleText = toStr(opts.titleText || '😊 Message');
    const continueText = toStr(opts.continueText || 'Continue');

    const messages = isObj(unitCfg.messages) ? unitCfg.messages : {};
    const messageBase = toStr(messages.base || '');
    const entryMap = isObj(messages.entry) ? messages.entry : {};
    const entryPasses = isObj(messages.entryPasses) ? messages.entryPasses : {};
    const completionMap = isObj(messages.completion) ? messages.completion : {};
    const effectsCfg = isObj(messages.effects) ? messages.effects : {};

    const modal = ensureModal(titleText, continueText);
    const bodyEl = modal.querySelector('[data-role="body"]');
    const btnEl = modal.querySelector('[data-role="continue"]');
    const audioCtl = createAudioController();

    let lastStateKey = '';
    let completionShownForState = false;
    let modalToken = 0;

    function getProgressObj() {
      return getProgress() || {};
    }

    function getCurrentStepId() {
      const progress = getProgressObj();
      return normalizeStepId(progress.currentStepId || '');
    }

    function getProgressForStep(stepId) {
      const progress = getProgressObj();
      const sid = normalizeStepId(stepId);
      return (
        progress[sid] ||
        progress[stepId] ||
        progress.trace1 ||
        progress.write ||
        null
      );
    }

    function allStepsCompleted() {
      try {
        const steps = safeArray(getSteps());
        if (!steps.length) return false;

        return steps.every(function (step) {
          const rawId = isObj(step) ? step.id : step;
          const p = getProgressForStep(rawId);
          return !!(p && p.completed);
        });
      } catch (_e) {
        return false;
      }
    }

    function messageStateKey() {
      try {
        const currentStepId = getCurrentStepId();
        const done = allStepsCompleted() ? 'done' : 'open';

        let completedMarks = '';
        const steps = safeArray(getSteps());
        if (steps.length) {
          completedMarks = steps.map(function (step) {
            const rawId = isObj(step) ? step.id : step;
            const p = getProgressForStep(rawId);
            return (p && p.completed) ? '1' : '0';
          }).join('');
        }

        let passToken = '';
        if (currentStepId === 'trace1') {
          const p = getProgressForStep('trace1');
          const passesDone = Math.max(
            0,
            Number(p && (p.passesDone ?? p.passes_done ?? 0)) || 0
          );
          passToken = '|p:' + passesDone;
        }

        return [currentStepId, done, completedMarks].join('|') + passToken;
      } catch (_e) {
        return '';
      }
    }

    function resolveEntryMessage(stepId) {
      const sid = normalizeStepId(stepId);
      if (!sid) return null;

      const baseNode = isObj(entryMap[sid]) ? entryMap[sid] : {};
      const p = getProgressForStep(sid);
      const passesDone = Math.max(
        0,
        Number(p && (p.passesDone ?? p.passes_done ?? 0)) || 0
      );

      const variants = Array.isArray(entryPasses[sid]) ? entryPasses[sid] : null;

      let node = baseNode;

      // Pass 1 stays in entry.trace1
      // Dynamic pass variants start after pass 1 is completed
      if (sid === 'trace1' && variants && variants.length && passesDone > 0) {
        const idx = Math.min(variants.length - 1, passesDone - 1);
        if (isObj(variants[idx])) {
          node = variants[idx];
        }
      }

      const audio = resolveAudio(messageBase, node.audio);
      const text = toStr(node.text);

      if (!audio && !text) return null;

      return {
        kind: 'entry',
        stepId: sid,
        audio: audio,
        text: text
      };
    }

    function resolveCompletionMessage() {
      const audio = resolveAudio(messageBase, completionMap.audio);
      const text = toStr(completionMap.text);

      if (!audio && !text) return null;

      return {
        kind: 'completion',
        stepId: '__unit_completion__',
        audio: audio,
        text: text
      };
    }

    function effectsEnabled() {
      if (effectsCfg.enabled === false) return false;
      return true;
    }

    function shouldShowStars() {
      if (!effectsEnabled()) return false;
      if (effectsCfg.stars === false) return false;
      return true;
    }

    async function showMessage(message) {
      if (!message || (!message.audio && !message.text)) return false;

      modalToken += 1;
      const myToken = modalToken;

      if (bodyEl) {
        bodyEl.textContent = message.text || '';
      }

      modal.classList.add('show');

      if (shouldShowStars()) {
        try {
          runStars();
        } catch (_e) {}
      }

      const playPromise = message.audio
        ? audioCtl.play(message.audio)
        : Promise.resolve(false);

      await new Promise(function (resolve) {
        function close() {
          if (myToken !== modalToken) {
            return resolve();
          }
          modal.classList.remove('show');
          btnEl.removeEventListener('click', close);
          resolve();
        }

        btnEl.addEventListener('click', close, { once: true });
        playPromise.finally(function () {});
      });

      return true;
    }

    async function afterProgressChange(forceStepMessage) {
      const stateKey = messageStateKey();
      const done = allStepsCompleted();

      if (done) {
        if (completionShownForState && stateKey === lastStateKey) return false;
        const msg = resolveCompletionMessage();
        lastStateKey = stateKey;
        completionShownForState = true;
        return showMessage(msg);
      }

      completionShownForState = false;

      if (!forceStepMessage && stateKey && stateKey === lastStateKey) {
        return false;
      }

      const currentStepId = getCurrentStepId();
      const msg = resolveEntryMessage(currentStepId);
      lastStateKey = stateKey;
      return showMessage(msg);
    }

    function reset() {
      lastStateKey = '';
      completionShownForState = false;
      modalToken += 1;
      audioCtl.stop();

      try {
        modal.classList.remove('show');
      } catch (_e) {}
    }

    function destroy() {
      reset();
    }

    return Object.freeze({
      __version: VERSION,
      afterProgressChange: afterProgressChange,
      reset: reset,
      destroy: destroy,
      resolveEntryMessage: resolveEntryMessage,
      resolveCompletionMessage: resolveCompletionMessage
    });
  }

  window.PQSharedStepMessagingV2 = Object.freeze({
    __version: VERSION,
    create: create
  });
})(window);