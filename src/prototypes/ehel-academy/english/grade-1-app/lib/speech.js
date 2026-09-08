  /* ==================================================================
     SPEAKING: record, convert, check, and say something useful back.

     Three steps use this - Let us talk, Say it out loud, and the Speaking
     Quest game - so the recorder, the converter and the feedback wording
     live here once.

     WHY A CONVERTER AT ALL. Azure's short-audio API accepts WAV PCM 16 kHz
     mono or OGG/Opus and nothing else. Chrome's MediaRecorder produces
     audio/webm;codecs=opus, which Azure rejects outright with a bare 400.
     Converting on the server would need ffmpeg on a shared cPanel host, so
     it happens here: decodeAudioData reads the webm fine, an
     OfflineAudioContext at 16 kHz does the downmix and the resample in one
     pass, and the WAV header is 44 bytes written by hand. No library.

     NOTHING HERE GATES A STEP. Azure scores against ADULT NATIVE speakers
     and these learners are five and six, in their second language. A score
     is coaching, never a pass mark: every one of the three steps completes
     on having a go, and a child who says it perfectly and gets a poor
     transcript loses nothing. The one thing that must never happen is a
     child being told they are wrong by a machine that is itself unsure.
     ================================================================== */

  /* The bridge to the platform module. The renderers run in a classic IIFE
     that cannot import, so the page's own module script hands the function
     over on window (build-lessons.py :: PAGE). In local dev those modules
     404 - they are deployed beside the pages, not beside the source - so the
     dev twin is used instead, which is the same DEV_API split wehel.js makes
     one directory up. */
  const SPEECH_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);
  async function postForCheck(audioBase64, referenceText) {
    if (SPEECH_DEV) {
      try {
        const r = await fetch("/api/azure-pronunciation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64, referenceText }),
        });
        const j = await r.json().catch(() => ({}));
        return r.ok ? j : { ok: false, code: "not-configured", message: j.message || "" };
      } catch (_) {
        return { ok: false, code: "offline" };
      }
    }
    const check = window.__ehelCheckPronunciation;
    if (typeof check !== "function") return { ok: false, code: "not-configured" };
    const q = new URLSearchParams(location.search);
    return check({
      audioBase64, referenceText,
      token: q.get("pwsToken") || "", launchToken: q.get("pwsToken") || "",
    });
  }

  const MIC_OK = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    && typeof MediaRecorder === "function");

  /* ---- webm/opus in, 16 kHz mono WAV out --------------------------- */
  function wavBytes(samples) {
    // 44-byte canonical header, then 16-bit little-endian PCM.
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const ascii = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
    ascii(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    ascii(8, "WAVEfmt ");
    view.setUint32(16, 16, true);          // fmt chunk size
    view.setUint16(20, 1, true);           // PCM
    view.setUint16(22, 1, true);           // mono
    view.setUint32(24, 16000, true);       // sample rate
    view.setUint32(28, 16000 * 2, true);   // byte rate
    view.setUint16(32, 2, true);           // block align
    view.setUint16(34, 16, true);          // bits per sample
    ascii(36, "data");
    view.setUint32(40, samples.length * 2, true);
    let at = 44;
    for (let i = 0; i < samples.length; i++, at += 2) {
      // clamp before scaling: a sample above 1 wraps to a loud click otherwise
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(at, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Uint8Array(buffer);
  }

  async function wavFromBlob(blob) {
    const raw = await blob.arrayBuffer();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const decoder = new Ctx();
    let decoded;
    try {
      decoded = await decoder.decodeAudioData(raw);
    } finally {
      try { decoder.close(); } catch (_) { /* Safari has closed it already */ }
    }
    // One offline pass does the downmix to mono AND the resample to 16 kHz;
    // doing either by hand is where the aliasing bugs live.
    const frames = Math.ceil(decoded.duration * 16000);
    const offline = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, frames, 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return wavBytes(rendered.getChannelData(0));
  }

  function base64Of(bytes) {
    // Chunked: String.fromCharCode.apply on a 300 KB array overflows the
    // argument limit in every browser that matters.
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    return btoa(binary);
  }

  /* ---- what the child is told -------------------------------------
     Led by WHICH WORDS to practise, not by the percentage. A number is the
     part a six-year-old can neither act on nor argue with, and Azure's is
     calibrated against adults; the words are the part they can do something
     about. The score is shown small, underneath, and never as a verdict.

     Azure's own Display is NOT printed. It is constrained by the reference
     text - audio saying "cat" scored against "cap" comes back "Cap." -
     so printing it as "we heard you say" would tell a child they said a
     word they did not.
     ------------------------------------------------------------------ */
  const PRACTISE_BELOW = 90;

  function feedbackHtml(result) {
    // `ok !== true`, not `ok === false`. An unauthenticated call currently
    // throws in the browser (the cross-origin redirect to Moodle's login page
    // carries no CORS headers) and lands on "offline", which is the right
    // message - but that is the FETCH failing, not this test. If that redirect
    // ever became readable the reply would be an object with no `ok` at all,
    // which `=== false` waves through to the "I could not hear any words"
    // branch: a microphone problem reported for an auth problem.
    if (!result || result.ok !== true) {
      const code = (result && result.code) || "error";
      if (code === "not-configured") {
        return '<p class="speech-note">The pronunciation check is not switched on yet. '
          + "Your recording still counts - press Done when you have said it.</p>";
      }
      if (code === "offline") {
        return '<p class="speech-note">I could not reach the checker just now. '
          + "That is nothing you did - press Done and carry on.</p>";
      }
      if (code === "rate-limit") {
        return '<p class="speech-note">That is a lot of checks at once. Wait a moment, then try again.</p>';
      }
      /* Two different waits, and telling them apart is the whole point of the
         endpoint answering with a code. "rate-limit" means slow down and try
         again in a minute; "daily-limit" means the checker is finished for
         today. A learner given the wrong one either waits for nothing or
         presses a button that cannot work again until tomorrow. */
      if (code === "daily-limit") {
        return '<p class="speech-note">That is all the sound-checking for today - you have done a lot. '
          + "Keep saying it out loud, press Done, and the checker comes back tomorrow.</p>";
      }
      return '<p class="speech-note">The check did not work this time. Press Done and carry on.</p>';
    }
    if (!result.heard) {
      return '<p class="speech-note">I could not hear any words. '
        + "Hold the microphone close, and say it once more.</p>";
    }
    const words = result.words || [];
    const practise = words.filter((w) => w.error === "Omission" ? false : w.score < PRACTISE_BELOW);
    const missed = words.filter((w) => w.error === "Omission");
    const chips = words.map((w) => {
      const cls = w.error === "Omission" ? "miss" : w.score >= PRACTISE_BELOW ? "good" : "soft";
      return '<span class="speech-word ' + cls + '">' + esc(w.word) + "</span>";
    }).join("");

    let line;
    if (!practise.length && !missed.length) {
      line = "<strong>" + cheer() + "</strong> Every word came out clearly.";
    } else if (missed.length && !practise.length) {
      line = "Say the whole sentence this time - I did not hear <strong>"
        + missed.map((w) => esc(w.word)).join("</strong>, <strong>") + "</strong>.";
    } else {
      line = "Good try. Say <strong>" + practise.slice(0, 2).map((w) => esc(w.word)).join("</strong> and <strong>")
        + "</strong> once more, slowly.";
    }

    // The sound itself, where Azure named one. This is the whole reason the
    // check is on Azure rather than on a transcript, so it is worth showing -
    // but only the worst sound of the worst word, because a five-year-old
    // cannot act on a list.
    let sound = "";
    const withPhonemes = practise.find((w) => (w.phonemes || []).length);
    if (withPhonemes) {
      const worst = withPhonemes.phonemes.reduce((a, b) => (b.score < a.score ? b : a));
      if (worst.score < PRACTISE_BELOW && worst.p) {
        sound = '<p class="speech-sound">The sound to practise in <strong>' + esc(withPhonemes.word)
          + '</strong> is <span class="phoneme">/' + esc(worst.p) + "/</span></p>";
      }
    }

    return '<div class="speech-words">' + chips + "</div>"
      + "<p>" + line + "</p>" + sound
      + '<p class="speech-score">Clarity ' + Math.round(result.accuracy) + "%"
      + " &middot; you said " + Math.round(result.completeness) + "% of the words</p>";
  }

  /* ---- the panel every speaking step draws -------------------------
     Hear it, say it, listen back, check. The child's recording never leaves
     the device until they press Check - said on the panel, because it is
     true and because a parent may be reading over their shoulder.
     ------------------------------------------------------------------ */
  function speakingPanel(host, o) {
    let blob = null;
    let recorder = null;
    let stream = null;
    let checking = false;

    function paint(feedback) {
      host.innerHTML =
        '<div class="speech">' +
        '<div class="speech-target"><span>Say this</span><p>' + esc(o.reference) + "</p></div>" +
        '<div class="bigbtns">' +
        (o.audio || o.reference ? '<button type="button" class="big small teal" data-speech="hear">&#128266; Hear it</button>' : "") +
        (MIC_OK
          ? '<button type="button" class="big small" data-speech="rec">&#127908; Say it</button>'
          : '<span class="speech-note">This device has no microphone, so just say it out loud.</span>') +
        (blob ? '<button type="button" class="big small ghost" data-speech="play">&#9654; Listen back</button>' : "") +
        (blob ? '<button type="button" class="big small" data-speech="check"' + (checking ? " disabled" : "") + ">"
          + (checking ? "Checking&hellip;" : "Check it") + "</button>" : "") +
        "</div>" +
        '<div class="speech-fb">' + (feedback || "") + "</div>" +
        '<div class="bigbtns"><button type="button" class="big small ghost" data-speech="done">I have said it &#10003;</button></div>' +
        '<p class="speech-note">Your recording stays on this device until you press Check it.</p>' +
        "</div>";
    }

    async function startRecording(button) {
      if (recorder && recorder.state === "recording") { recorder.stop(); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (_) {
        paint('<p class="speech-note">I cannot use the microphone. '
          + "You can still say it out loud and press Done.</p>");
        return;
      }
      const chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.addEventListener("dataavailable", (e) => { if (e.data.size) chunks.push(e.data); });
      recorder.addEventListener("stop", () => {
        stream.getTracks().forEach((t) => t.stop());
        blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        recorder = null;
        paint(blob.size ? '<p class="speech-note">Listen back, then press Check it.</p>' : "");
      });
      recorder.start();
      button.textContent = "⏹ Stop";
      button.classList.add("recording");
      // A hard ceiling well under Azure's 30 seconds: a five-year-old who
      // forgets to press stop must not lose the round to a rejected upload.
      setTimeout(() => { if (recorder && recorder.state === "recording") recorder.stop(); }, 15000);
    }

    async function check() {
      if (!blob || checking) return;
      checking = true;
      paint('<p class="speech-note">Listening to what you said&hellip;</p>');
      let result;
      try {
        const wav = await wavFromBlob(blob);
        result = await postForCheck(base64Of(wav), o.reference);
      } catch (_) {
        // A converter failure is ours, not the child's, and it must not read
        // as "you said it wrong".
        result = { ok: false, code: "error" };
      }
      checking = false;
      paint(feedbackHtml(result));
      if (o.onResult) o.onResult(result);
    }

    host.addEventListener("click", (e) => {
      const button = e.target.closest("[data-speech]");
      if (!button) return;
      const what = button.dataset.speech;
      if (what === "hear") { playClip(o.audio, o.reference); return; }
      if (what === "rec") { startRecording(button); return; }
      if (what === "play" && blob) { new Audio(URL.createObjectURL(blob)).play().catch(() => {}); return; }
      if (what === "check") { check(); return; }
      if (what === "done" && o.onDone) o.onDone();
    });

    paint("");
  }
