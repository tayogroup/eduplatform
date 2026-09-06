
(function () {

  (function () {
    if (new URLSearchParams(location.search).get("from") !== "g1") return;
    const wrap = document.querySelector(".wrap");
    if (!wrap) return;
    const back = document.createElement("a");
    back.className = "g1-back";
    back.href = "index.html";
    back.innerHTML = '<span aria-hidden="true">←</span> Grade 1 Maths';
    wrap.insertBefore(back, wrap.firstChild);
  })();

  /* ==================================================================
     THE VOICE — authored for Azure en-GB-SoniaNeural, spoken here by
     whatever voice the device actually has.

     Every line in this lesson is written as Azure SSML: <mstts:express-as>
     for the feeling, <prosody> for pace and pitch, <break> for the beat
     before an answer, <emphasis> for the word that carries the maths. That
     markup is the script we would post to en-GB-SoniaNeural, and it is kept
     here rather than flattened to plain text so the lesson can be moved onto
     a real TTS endpoint without rewriting a word.

     A published page cannot call Azure itself: it may not hold a
     subscription key, and its content policy blocks the request outright.
     So the page renders the same SSML through the browser's own speech
     engine - it asks for Sonia by name first (Edge and Windows publish her
     as "Microsoft Sonia Online (Natural) - English (United Kingdom)", which
     IS en-GB-SoniaNeural), then any other British voice, then any English
     one. Web Speech does not accept SSML, so the markup is walked into a
     queue of utterances carrying the rate, the pitch and the real silences
     the tags asked for.
     ================================================================== */

  /* ==================================================================
     THE PLATFORM VOICE

     Ehel already serves narration from its own endpoint, and this is the
     app's own contract, not a new one:

       POST <origin>/local/hubredirect/quiz_tts.php
       Authorization: Bearer <launch token>          (english.js :: platformHeaders)
       { text, purpose: "ehel_course_page", voiceId } -> audio/mpeg

     Both halves of "where" and "who" come from the launch URL exactly as
     shell/wehel.js takes them - the origin from ?pwsEndpoint, the HS256
     token from ?pwsToken - so there is nothing to hardcode and no
     credential in this file. A cookie is not enough on its own and never
     was: MoodleSessionep1 carries no SameSite attribute, browsers treat
     that as Lax, and Lax cookies are not sent on a cross-site POST.

     With neither parameter present the endpoint resolves to "" and this
     whole module reports itself unavailable, which is the honest state of
     a lesson opened as a standalone page: it falls through to the
     browser's own voice and nothing is requested.

     Two things this does NOT do, both worth knowing before reading the
     endpoint name as a promise:

       - It is not Azure. quiz_tts.php proxies ElevenLabs (wehel_speak.php
         is Deepgram), so this path speaks the Ehel course voice, not
         en-GB-SoniaNeural. The SSML stays because it is still the script.
       - It takes TEXT. There is no SSML field, so the markup is flattened
         to the words plus the punctuation a long pause implies. Pace,
         pitch and style are the voice's own on this path; they only come
         from the tags on the browser path.
     ================================================================== */
  const PLATFORM_VOICE = (function () {
    const params = new URLSearchParams(location.search);
    const TOKEN = (params.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");
    const ORIGIN = (function () {
      const raw = params.get("pwsEndpoint") || "";
      if (!raw) return "";
      try {
        const u = new URL(raw, location.href);
        if (!/^https?:$/.test(u.protocol)) return "";
        /* A relative or malformed value resolves against the page's own URL, so
           without this the endpoint quietly becomes whatever host is serving the
           lesson - the CDN, not the platform. wehel.js :: platformOrigin refuses
           the page's own origin for the same reason; the dev twin is same-origin
           on purpose and is chosen on its own branch below, never through here. */
        return u.origin === location.origin ? "" : u.origin;
      } catch (e) {
        return ""; /* an unparseable launch param is not an origin */
      }
    })();
    /* the dev twin is served by the page's own origin, so it is never rebased */
    const DEV = ["localhost", "127.0.0.1"].includes(location.hostname) && location.port === "4287";
    const ENDPOINT = DEV ? "/api/elevenlabs-tts" : (ORIGIN ? ORIGIN + "/local/hubredirect/quiz_tts.php" : "");
    const VOICE_ID = (params.get("voiceId") || "XfNU2rGpBa01ckF309OY").replace(/[^A-Za-z0-9_-]/g, "");
    const el = typeof Audio === "function" ? new Audio() : null;

    /* One clip per line asked for, kept by its exact text: a lesson repeats
       its instruction every time a child taps the speaker, and the endpoint
       bills per character. Same cap and same eviction as the app's. */
    const cache = new Map();
    const pending = new Map();
    let chain = Promise.resolve();
    let playing = false;

    function ready() { return !!(ENDPOINT && el); }

    function clipUrl(text) {
      const clean = String(text || "").slice(0, 5000);
      if (!clean) return Promise.reject(new Error("There is nothing to read."));
      if (cache.has(clean)) return Promise.resolve(cache.get(clean));
      if (pending.has(clean)) return pending.get(clean);
      const headers = { Accept: "audio/mpeg", "Content-Type": "application/json" };
      if (TOKEN) headers.Authorization = "Bearer " + TOKEN;
      const request = fetch(ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: headers,
        body: JSON.stringify({ text: clean, purpose: "ehel_course_page", voiceId: VOICE_ID })
      }).then(function (response) {
        if (!response.ok) throw new Error("The voice endpoint answered " + response.status + ".");
        return response.blob();
      }).then(function (blob) {
        /* an unauthenticated cross-origin POST answers 303 to the login page
           with an HTML body, where the caller is waiting for audio */
        if (!blob.size || !/^audio\//i.test(blob.type || "audio/mpeg")) throw new Error("That was not audio.");
        const src = URL.createObjectURL(blob);
        cache.set(clean, src);
        if (cache.size > 24) {
          const oldest = cache.keys().next().value;
          URL.revokeObjectURL(cache.get(oldest));
          cache.delete(oldest);
        }
        return src;
      });
      pending.set(clean, request);
      request.catch(function () {}).then(function () { pending.delete(clean); });
      return request;
    }

    function stop() {
      try { el.pause(); el.removeAttribute("src"); } catch (e) {}
      chain = Promise.resolve();
      playing = false;
    }

    function play(text, replace) {
      if (!ready()) return Promise.reject(new Error("No platform endpoint on this page."));
      if (replace) stop();
      const step = function () {
        return clipUrl(text).then(function (src) {
          return new Promise(function (done, fail) {
            playing = true;
            el.onended = function () { playing = false; done(); };
            el.onerror = function () { playing = false; fail(new Error("The clip would not play.")); };
            el.src = src;
            const started = el.play();
            if (started && started.catch) started.catch(function (e) { playing = false; fail(e); });
          });
        });
      };
      /* a failed clip must not wedge everything queued behind it */
      const run = chain.then(step, step);
      chain = run.catch(function () {});
      return run;
    }

    return {
      ready: ready,
      play: play,
      stop: stop,
      busy: function () { return playing; },
      endpoint: function () { return ENDPOINT; }
    };
  })();

  const VOICE = (function () {
    const BASE_RATE = 0.94;   /* a shade under natural: five-year-olds are listening */
    const BASE_PITCH = 1.06;  /* bright, not squeaky */
    const SUPPORTED = typeof window !== "undefined" && "speechSynthesis" in window;
    /* emoji, dingbats, arrows and the joiners that glue them together */
    const PICTOGRAPH = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

    /* ---- who speaks ---- */
    const WANTED = [
      /\bsonia\b/i,                 /* en-GB-SoniaNeural itself: Edge and Windows publish her */
      /google uk english female/i,  /* the en-GB voice Chrome ships nearly everywhere */
      /\blibby\b/i, /\bmaisie\b/i, /\bhazel\b/i, /\bsusan\b/i
    ];
    let voice = null;
    function pickVoice() {
      if (!SUPPORTED) return;
      const all = window.speechSynthesis.getVoices() || [];
      if (!all.length) return;
      const gb = all.filter((v) => /en[-_]GB/i.test(v.lang));
      for (const re of WANTED) {
        const hit = gb.find((v) => re.test(v.name)) || all.find((v) => re.test(v.name));
        if (hit) { voice = hit; return; }
      }
      voice = gb[0] || all.find((v) => /^en/i.test(v.lang)) || all[0] || null;
    }
    if (SUPPORTED) {
      pickVoice();
      window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    }

    /* ---- SSML -> a queue the browser can actually say ---- */
    const RATE_WORD = { "x-slow": 0.6, slow: 0.82, medium: 1, fast: 1.18, "x-fast": 1.35 };
    const PITCH_WORD = { "x-low": 0.72, low: 0.86, medium: 1, high: 1.16, "x-high": 1.3 };
    /* Azure reads volume as a move away from a default it is free to raise; Web
       Speech takes 0..1 and ALREADY sits at 1, so the authored "+20%" resolves to
       1.2 and then clamps straight back to 1. On this path the boost is a no-op:
       the browser can only be asked to speak quieter, never louder. The SSML still
       carries it verbatim, because Azure is the path where it lands. (An absolute
       Azure volume, 0..100, is likewise not converted and simply clamps.) Do not
       read a working browser preview as evidence that the boost is being applied. */
    const VOLUME_WORD = { silent: 0, "x-soft": 0.4, soft: 0.7, medium: 1, loud: 1.2, "x-loud": 1.4 };
    /* Azure's speaking styles, approximated in the two dials that carry a feeling -
       rate and pitch. Volume is a level rather than a mood, so no style moves it. */
    const STYLE = {
      cheerful: [1.04, 1.12], excited: [1.09, 1.16], friendly: [1.0, 1.05],
      hopeful: [0.98, 1.07], empathetic: [0.93, 0.98], calm: [0.9, 0.97],
      gentle: [0.94, 1.01], sad: [0.88, 0.94], shouting: [1.06, 1.14],
      whispering: [0.88, 0.95], newscast: [1.0, 1.0], chat: [1.0, 1.03]
    };
    function relative(value, words, base) {
      if (!value) return base;
      const v = String(value).trim();
      if (words[v] != null) return base * words[v];
      let m = /^([+-])(\d+(?:\.\d+)?)%$/.exec(v);
      if (m) return base * (1 + (m[1] === "-" ? -1 : 1) * (parseFloat(m[2]) / 100));
      m = /^([+-]?\d+(?:\.\d+)?)st$/.exec(v);
      if (m) return base * Math.pow(2, parseFloat(m[1]) / 12);
      m = /^([+-]?\d+(?:\.\d+)?)$/.exec(v);
      if (m) return parseFloat(m[1]);
      return base;
    }
    function pauseOf(time, strength) {
      if (time) {
        const ms = /^(\d+(?:\.\d+)?)\s*ms$/.exec(time.trim());
        if (ms) return Math.min(3000, parseFloat(ms[1]));
        const s = /^(\d+(?:\.\d+)?)\s*s$/.exec(time.trim());
        if (s) return Math.min(3000, parseFloat(s[1]) * 1000);
      }
      return { none: 0, "x-weak": 100, weak: 200, medium: 400, strong: 700, "x-strong": 1000 }[strength] != null
        ? { none: 0, "x-weak": 100, weak: 200, medium: 400, strong: 700, "x-strong": 1000 }[strength]
        : 350;
    }

    function walk(node, ctx, out) {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) {
          const t = n.nodeValue.replace(/\s+/g, " ");
          if (t.trim()) out.push({ text: t, rate: ctx.rate, pitch: ctx.pitch, volume: ctx.volume });
          continue;
        }
        if (n.nodeType !== 1) continue;
        const tag = (n.localName || n.nodeName).toLowerCase();
        if (tag === "break") { out.push({ pause: pauseOf(n.getAttribute("time"), n.getAttribute("strength")) }); continue; }
        if (tag === "say-as" && /characters|spell-out/i.test(n.getAttribute("interpret-as") || "")) {
          out.push({ text: n.textContent.trim().split("").join(", "), rate: ctx.rate * 0.78, pitch: ctx.pitch, volume: ctx.volume });
          continue;
        }
        let c = ctx;
        if (tag === "prosody") {
          c = { rate: relative(n.getAttribute("rate"), RATE_WORD, ctx.rate), pitch: relative(n.getAttribute("pitch"), PITCH_WORD, ctx.pitch), volume: relative(n.getAttribute("volume"), VOLUME_WORD, ctx.volume) };
        } else if (tag === "emphasis") {
          const k = { strong: 1, moderate: 0.55, reduced: -0.5, none: 0 }[n.getAttribute("level") || "moderate"] || 0.55;
          c = { rate: ctx.rate * (1 - 0.08 * k), pitch: ctx.pitch * (1 + 0.11 * k), volume: ctx.volume };
        } else if (tag === "express-as") {
          const s = STYLE[(n.getAttribute("style") || "").toLowerCase()] || [1, 1];
          const deg = Math.max(0.01, Math.min(2, parseFloat(n.getAttribute("styledegree") || "1") || 1));
          c = { rate: ctx.rate * (1 + (s[0] - 1) * deg), pitch: ctx.pitch * (1 + (s[1] - 1) * deg), volume: ctx.volume };
        }
        walk(n, c, out);
        if (tag === "p") out.push({ pause: 450 });
        else if (tag === "s") out.push({ pause: 240 });
      }
    }

    function escapeText(s) {
      return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    const OPEN = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-GB"><voice name="en-GB-SoniaNeural">';
    const SHUT = "</voice></speak>";
    /* Plain text is still SSML here - it just gets the house style put round it. */
    function wrap(x) {
      const s = String(x == null ? "" : x).trim();
      if (!s) return "";
      if (/^<speak[\s>]/i.test(s)) return s;
      const body = /<(mstts:)?express-as|<prosody|<emphasis|<break|<say-as|<[sp]>/i.test(s) ? s : escapeText(s);
      /* A line that already names its own feeling keeps it: Azure forbids one
         express-as inside another, so the house style stands aside. */
      if (/<(mstts:)?express-as[\s>]/i.test(body)) return OPEN + body + SHUT;
      return OPEN + '<mstts:express-as style="cheerful" styledegree="1.25">' + '<prosody volume="+20%" rate="+3%" pitch="+2%">' + body + "</prosody></mstts:express-as>" + SHUT;
    }

    function flatten(ssml) {
      const doc = new DOMParser().parseFromString(ssml, "application/xml");
      const out = [];
      if (doc.getElementsByTagName("parsererror").length) {
        out.push({ text: ssml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(), rate: 1, pitch: 1, volume: 1 });
      } else {
        walk(doc.documentElement, { rate: 1, pitch: 1, volume: 1 }, out);
      }
      /* Chrome truncates a long utterance, so break on sentence ends. */
      const cut = [];
      for (const seg of out) {
        if (seg.pause != null) { cut.push(seg); continue; }
        let t = seg.text.trim();
        while (t.length > 170) {
          let at = t.lastIndexOf(". ", 170);
          if (at < 60) at = t.lastIndexOf(", ", 170);
          if (at < 60) at = t.lastIndexOf(" ", 170);
          if (at < 40) at = 170;
          cut.push({ text: t.slice(0, at + 1).trim(), rate: seg.rate, pitch: seg.pitch, volume: seg.volume });
          t = t.slice(at + 1).trim();
        }
        if (t) cut.push({ text: t, rate: seg.rate, pitch: seg.pitch, volume: seg.volume });
      }
      return cut;
    }

    /* ---- playing it ---- */
    let queue = [], at = 0, timer = null, keepAlive = null, speaking = false;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    function mark(on) {
      speaking = on;
      document.body.classList.toggle("voice-on", on);
      if (on) {
        /* Chrome stops a long run dead at about fifteen seconds unless poked. */
        clearInterval(keepAlive);
        keepAlive = setInterval(() => { try { window.speechSynthesis.resume(); } catch (e) {} }, 6000);
      } else { clearInterval(keepAlive); keepAlive = null; }
    }
    /* The words a parsed queue would say, as one line. An endpoint that takes
       text and not SSML cannot be handed <break time="320ms"/>, so a real pause
       becomes the full stop it was standing in for, and the pictographs go the
       same way they go on the browser path. */
    function spoken(segs) {
      let out = "";
      for (const seg of segs) {
        if (seg.pause != null) {
          if (seg.pause >= 300 && out && !/[.!?\u2026][\"'\u201d\u2019)]*\s*$/.test(out)) out += ".";
          out += " ";
          continue;
        }
        out += (out && !/\s$/.test(out) ? " " : "") + seg.text;
      }
      return out.replace(PICTOGRAPH, " ").replace(/[ ]+/g, " ").trim();
    }

    /* The endpoint first, the browser's own voice if it refuses. A lesson that
       goes quiet because a server was down is worse than one read by whatever
       voice the device has. */
    function viaPlatform(segs, replace) {
      const line = spoken(segs);
      if (!line) { mark(false); return; }
      PLATFORM_VOICE.play(line, replace).then(function () {
        if (!PLATFORM_VOICE.busy()) mark(false);
      }, function () {
        if (!SUPPORTED) { mark(false); return; }
        queue = segs; at = 0; next();
      });
    }

    function stop() {
      clearTimeout(timer); timer = null; queue = []; at = 0;
      try { window.speechSynthesis.cancel(); } catch (e) {}
      PLATFORM_VOICE.stop();
      mark(false);
    }
    function next() {
      if (at >= queue.length) { mark(false); return; }
      const seg = queue[at++];
      if (seg.pause != null) { timer = setTimeout(next, seg.pause); return; }
      const words = seg.text.replace(PICTOGRAPH, " ").replace(/[ ]+/g, " ").trim();
      if (!words) { next(); return; }
      let u;
      try { u = new SpeechSynthesisUtterance(words); } catch (e) { mark(false); return; }
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || "en-GB";
      u.rate = clamp(BASE_RATE * seg.rate, 0.5, 2);
      u.pitch = clamp(BASE_PITCH * seg.pitch, 0.1, 2);
      /* 0..1 and already at 1, so an authored boost clamps away here - see VOLUME_WORD */
      u.volume = clamp(seg.volume == null ? 1 : seg.volume, 0, 1);
      u.onend = next;
      u.onerror = next;
      try { window.speechSynthesis.speak(u); } catch (e) { next(); }
    }
    function speak(x) {
      if (!SUPPORTED && !PLATFORM_VOICE.ready()) return;
      const ssml = wrap(x);
      if (!ssml) return;
      stop();
      queue = flatten(ssml);
      remember(queue);
      at = 0;
      if (!queue.length) return;
      mark(true);
      if (PLATFORM_VOICE.ready()) { viaPlatform(queue, true); return; }
      next();
    }
    /* queue rather than interrupt: a reaction should not cut off a sentence
       the child is still listening to, unless that sentence is the old one */
    function follow(x) {
      if (!SUPPORTED && !PLATFORM_VOICE.ready()) return;
      const ssml = wrap(x);
      if (!ssml) return;
      if (PLATFORM_VOICE.ready()) {
        /* the endpoint plays whole clips, so a follow-up is the next clip in
           the chain rather than more segments spliced into this one */
        const segs = flatten(ssml);
        remember(segs);
        if (!speaking) mark(true);
        viaPlatform(segs, false);
        return;
      }
      if (!speaking) return speak(ssml);
      queue = queue.slice(at).concat([{ pause: 250 }], flatten(ssml));
      remember(queue);
      at = 0;
    }


    /* What she has just said, so praise does not repeat the sentence the lesson
       spoke a beat earlier. "Ten! The frame is full." once, then "That is right." */
    const recent = [];
    function remember(segs) {
      for (const s of segs) if (s.text) recent.push(s.text.replace(/[ ]+/g, ' ').trim().toLowerCase());
      while (recent.length > 16) recent.shift();
    }
    function saidRecently(t) {
      const n = String(t == null ? '' : t).replace(/[ ]+/g, ' ').trim().toLowerCase();
      if (n.length < 8) return false;
      return recent.join(' | ').indexOf(n) >= 0;
    }
    return {
      speak: speak, follow: follow, stop: stop,
      supported: SUPPORTED,
      voiceName: () => (voice ? voice.name : null),
      isSonia: () => !!(voice && /\bsonia\b/i.test(voice.name)),
      OPEN: OPEN, SHUT: SHUT, esc: escapeText,
      speaking: () => speaking,
      saidRecently: saidRecently,
      /* which voice this page is actually using, for anyone checking */
      platformEndpoint: () => PLATFORM_VOICE.endpoint()
    };
  })();

  /* Every call site in this lesson already says say(...). It now goes to Sonia. */
  function say(text) { VOICE.speak(text); }

  /* ==================================================================
     WHAT SHE SAYS BACK

     A lesson that only reads its own instructions is a page with a
     loudspeaker. These are the lines she says about what the child has just
     DONE - and after a wrong answer she reads the page's own hint aloud,
     so the help arrives in the ear as well as on the screen.

     Each bank is rotated rather than shuffled, so the same praise never
     lands twice running.
     ================================================================== */
  const REACTION = (function () {
    const S = VOICE.OPEN, E = VOICE.SHUT;
    const cheer = (deg, body) => S + '<mstts:express-as style="cheerful" styledegree="' + deg + '">' + body + "</mstts:express-as>" + E;
    const kind = (body) => S + '<mstts:express-as style="empathetic" styledegree="1.3">' + body + "</mstts:express-as>" + E;
    const excite = (body) => S + '<mstts:express-as style="excited" styledegree="1.7">' + body + "</mstts:express-as>" + E;

    const BANKS = {
      right: [
        cheer("1.6", 'Yes! <break time="120ms"/> That is <emphasis level="strong">exactly</emphasis> it.'),
        cheer("1.5", 'That is right. <break time="140ms"/> <prosody pitch="+8%">Well done.</prosody>'),
        cheer("1.7", '<prosody rate="fast" pitch="+12%">Spot on!</prosody>'),
        cheer("1.4", 'Lovely. <break time="120ms"/> You worked that out beautifully.'),
        cheer("1.6", '<prosody pitch="+10%">Brilliant.</prosody> <break time="120ms"/> Straight there.')
      ],
      wrong: [
        kind('Not quite. <break time="220ms"/> Have another look.'),
        kind('<prosody rate="slow">Hmm.</prosody> <break time="250ms"/> Not that one. Let us think it through again.'),
        kind('Close. <break time="200ms"/> Try one more time - you are nearly there.'),
        kind('Not this time. <break time="220ms"/> Read it once more, slowly.')
      ],
      stepDone: [
        excite('Step finished! <break time="150ms"/> That is a sticker for you.'),
        excite('<prosody pitch="+10%">You have done it!</prosody> <break time="150ms"/> Another sticker.'),
        excite('All done here. <break time="150ms"/> <emphasis level="strong">Great</emphasis> work.')
      ],
      streak: [
        excite('<prosody rate="fast" pitch="+14%">Three in a row!</prosody> <break time="150ms"/> You are flying.'),
        excite('<prosody pitch="+12%">That is three!</prosody> <break time="140ms"/> Keep going.')
      ],
      lessonDone: [
        S + '<mstts:express-as style="excited" styledegree="1.7"><prosody pitch="+8%">You have finished the whole lesson.</prosody></mstts:express-as>' +
            '<break time="300ms"/>' +
            '<mstts:express-as style="hopeful" styledegree="1.4">I am so proud of you.</mstts:express-as>' + E
      ]
    };
    const turn = {};
    function line(kindName) {
      const bank = BANKS[kindName];
      if (!bank || !bank.length) return "";
      const i = (turn[kindName] = ((turn[kindName] || 0) + 1) % bank.length);
      return bank[i];
    }

    let streak = 0, saidDone = false;
    function fire(kindName, alsoRead) {
      let ssml = line(kindName);
      if (!ssml) return;
      const extra = String(alsoRead || "").replace(/\s+/g, " ").trim();
      if (extra && !VOICE.saidRecently(extra)) {
        ssml = ssml.replace(VOICE.SHUT, '<break time="320ms"/><mstts:express-as style="friendly" styledegree="1.2">' +
          VOICE.esc(extra) + "</mstts:express-as>" + VOICE.SHUT);
      }
      /* queue rather than interrupt: when a step completes the lesson says its
         own line first, and praise that cuts the teaching off is worse than
         praise that waits its turn */
      VOICE.follow(ssml);
    }
    return {
      right: function (alsoRead) {
        streak += 1;
        if (streak > 0 && streak % 3 === 0) fire("streak", alsoRead);
        else fire("right", alsoRead);
      },
      wrong: function (alsoRead) { streak = 0; fire("wrong", alsoRead); },
      stepDone: function (alsoRead) { fire("stepDone", alsoRead); },
      lessonDone: function () { if (saidDone) return; saidDone = true; fire("lessonDone"); },
      fire: fire
    };
  })();

  /* ==================================================================
     WATCHING, RATHER THAN BEING TOLD

     The lesson code already decides right from wrong: it puts .good or .bad
     on a feedback line, or .right / .wrong on an answer button. Reading
     those changes instead of editing every check keeps one description of
     "the child got it" rather than two that can drift apart - and it means
     a new question is reacted to the day it is written.
     ================================================================== */
  (function () {
    if (!VOICE.supported) return;
    const RIGHT = /(^|\s)(good|right|correct)(\s|$)/;
    const WRONG = /(^|\s)(bad|wrong)(\s|$)/;
    const watched = ".fb, .opt, .card, .ocard, [data-answer]";
    const last = new WeakMap();

    /* One verdict per action, not one per element. Marking a wrong answer also
       lights the CORRECT option green, so reading each class change on its own
       would praise a child who had just got it wrong. The changes from one tap
       are collected and judged together, and a wrong anywhere in the batch wins. */
    let batch = [], scheduled = false;
    function judge() {
      scheduled = false;
      const items = batch; batch = [];
      let verdict = "", hint = "", praiseText = "";
      for (const el of items) {
        const cls = " " + el.className + " ";
        const now = WRONG.test(cls) ? "wrong" : RIGHT.test(cls) ? "right" : "";
        if (!now) { last.delete(el); continue; }
        if (last.get(el) === now) continue;
        last.set(el, now);
        if (now === "wrong") { verdict = "wrong"; hint = hint || hintFor(el); }
        else if (verdict !== "wrong") { verdict = "right"; praiseText = praiseText || (el.matches(".fb") ? el.textContent : ""); }
      }
      if (verdict === "wrong") REACTION.wrong(hint);
      else if (verdict === "right") REACTION.right(praiseText);
    }
    function queueJudge(el) {
      batch.push(el);
      if (scheduled) return;
      scheduled = true;
      setTimeout(judge, 0);
    }

    function hintFor(el) {
      /* the page's own explanation, if it has just put one up */
      const q = el.closest(".q, .slide, .step, .stage, section");
      if (!q) return el.textContent;
      const why = q.querySelector(".why, .fb.bad");
      const text = (why && why.textContent) || el.textContent || "";
      return text.length > 260 ? text.slice(0, 260) : text;
    }

    const obs = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "attributes" && r.target.matches && r.target.matches(watched)) queueJudge(r.target);
        if (r.type === "childList") {
          for (const n of r.addedNodes) {
            if (n.nodeType === 1 && n.matches && n.matches(watched)) queueJudge(n);
          }
        }
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  })();

  /* ==================================================================
     THE EXPLAINER

     The speaker reads the instruction. Explain is the thing a teacher says
     when a child says "I do not get it" - a short spoken mini-lesson in four
     moves, about thirty to sixty seconds:

         NAME     the idea, in the plainest words there are
         SHOW     one worked example, using THIS step's own content
         WARN     the mistake children actually make here, named out loud
         HAND     back, with one small thing to try right now

     Each move is its own <mstts:express-as> - calm, friendly, empathetic,
     cheerful - as SIBLINGS, never nested, because Azure forbids one inside
     another and the walker below would flatten a nested pair anyway.

     AUTHORED BEATS DERIVED. A step carries its own mini-lesson in a
     data-explain attribute on the .slide (or .step): the BODY of the SSML
     only, since the <speak> wrapper names the voice and lives in VOICE.OPEN,
     so re-voicing the course stays one edit. Where a step has none, the
     derived explainer below still speaks - thinner, never silent.

     The old version built one line out of the heading, the instruction and
     the note, so a child who did not understand the instruction heard the
     instruction again. It re-read the page instead of teaching it.
     ================================================================== */
  (function () {
    if (!VOICE.supported) return;
    const S = VOICE.OPEN, E = VOICE.SHUT, esc = VOICE.esc;
    const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
    /* say a number as a number, and lean on it - it is the thing being taught */
    function markNumbers(t) {
      return esc(t).replace(/(\d[\d,.]*\s?%?)/g, '<emphasis level="moderate">$1</emphasis>');
    }
    function sentences(parts) {
      return parts.filter(Boolean).map((p) => "<s>" + markNumbers(clean(p)) + "</s>").join('<break time="180ms"/>');
    }
    /* ".note" is a teaching aside in most of these lessons and a BANKNOTE in
       Coins and Change, where it is a button reading "100 sh" - which the
       explainer duly read out. Take it only where it is prose: not a control,
       and long enough to be a sentence rather than a label. */
    function proseNote(host) {
      for (const n of host.querySelectorAll(".note")) {
        if (n.closest("button, a, input, label")) continue;
        const t = clean(n.textContent);
        if (t.length > 24 && t.indexOf(" ") > 0) return t;
      }
      return "";
    }
    /* Azure refuses one express-as inside another, and this walker would give
       a nested pair the inner style with the outer one silently discarded -
       so a nested authored body is not a style bug, it is a different lesson
       than the one that was written. Rejected rather than spoken. */
    function nestsExpressAs(doc) {
      const all = doc.getElementsByTagNameNS("*", "express-as");
      for (let i = 0; i < all.length; i++) {
        for (let p = all[i].parentNode; p && p.nodeType === 1; p = p.parentNode) {
          if (String(p.localName || "").toLowerCase() === "express-as") return true;
        }
      }
      return false;
    }
    /* The step's own mini-lesson, if it was written one. A typo in the
       attribute must not become a flat tagless mumble - flatten() recovers
       from a parse error by stripping every tag, which still speaks but
       throws away every pause and every stress - so it is parsed HERE and
       the derived explainer takes over if it does not hold up. */
    function authoredFor(host) {
      const body = clean(host && host.getAttribute && host.getAttribute("data-explain"));
      if (!body) return "";
      const ssml = S + body + E;
      let doc;
      try { doc = new DOMParser().parseFromString(ssml, "application/xml"); } catch (e) { return ""; }
      if (!doc || doc.getElementsByTagName("parsererror").length) return "";
      if (nestsExpressAs(doc)) return "";
      return ssml;
    }
    /* No authored copy: say more than the page says, and say it in the same
       four moves, so the two never sound like different features. The slide's
       data-say is the teacher's framing of the idea and the explainer never
       used to read it; the .say line is the instruction. Naming what a child
       can do when still stuck is the closest a derived explainer gets to the
       WARN move, which needs a human who knows the maths. */
    function derivedFor(host) {
      const head = host.querySelector(".slide-head h2, .step-head h2, h2, h3");
      const lead = host.querySelector(".intro, .say > span, [data-say-text]");
      const title = clean(head && head.textContent);
      const idea = clean(host.getAttribute && host.getAttribute("data-say"));
      const task = clean(lead && lead.textContent);
      const note = proseNote(host);
      if (!title && !idea && !task) return "";
      /* data-say and the on-screen instruction usually say the same thing in
         almost the same words, and reading both made the derived explainer
         repeat itself sentence for sentence. Keep the first, drop a later
         source that adds nothing. */
      const said = [];
      /* Containment is not enough: "Press the plus to put a counter in the
         frame" and "Press + to put a counter in the frame" are the same
         sentence and neither contains the other. Compare word overlap against
         the shorter of the two instead. */
      const words = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9 ]/gi, " ").split(/\s+/).filter(Boolean);
      const fresh = (t) => {
        const w = words(t);
        if (!w.length) return "";
        for (const p of said) {
          const small = Math.min(p.length, w.length);
          if (!small) continue;
          const shared = w.filter((x) => p.indexOf(x) >= 0).length;
          if (shared / small >= 0.8) return "";
        }
        said.push(w);
        return t;
      };
      const ideaOnce = fresh(idea);
      const taskOnce = fresh(task);
      const noteOnce = fresh(note);
      const name = sentences([title && "This step is called " + title + ".", ideaOnce]);
      const show = sentences([taskOnce, noteOnce]);
      return S +
        '<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">' +
        "<s>Let me talk you through this one.</s>" + '<break time="280ms"/>' + name +
        "</prosody></mstts:express-as>" +
        (show ? '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">' +
          "<s>Here is what to do.</s>" + '<break time="220ms"/>' + show + "</mstts:express-as>" : "") +
        '<break time="330ms"/>' +
        '<mstts:express-as style="cheerful" styledegree="1.45">' +
        "<s>Have a go at the first one.</s>" + '<break time="200ms"/>' +
        "<s>If you are not sure, press the speaker and I will read it to you again.</s>" +
        "</mstts:express-as>" + E;
    }
    function explainerFor(host) {
      return authoredFor(host) || derivedFor(host);
    }

    function button(host, label) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "explain";
      b.innerHTML = '<span aria-hidden="true">💬</span><span class="explain-t">' + label + "</span>";
      b.setAttribute("aria-label", "Explain this step to me");
      b.addEventListener("click", () => {
        const ssml = explainerFor(host);
        if (ssml) VOICE.speak(ssml);
      });
      return b;
    }

    /* the decks already carry a voice bar on every slide */
    document.querySelectorAll(".slide .say, .stage .say").forEach((bar) => {
      const host = bar.closest(".slide") || bar.parentElement;
      bar.appendChild(button(host, "Explain"));
    });
    /* the scrolling lessons carry none, so give each step one */
    document.querySelectorAll(".step").forEach((step) => {
      if (step.querySelector(".say")) return;
      const intro = step.querySelector(".intro");
      if (!intro) return;
      const bar = document.createElement("div");
      bar.className = "say";
      const read = document.createElement("button");
      read.type = "button";
      read.className = "speak";
      read.setAttribute("aria-label", "Read this step to me");
      read.textContent = "🔊";
      read.addEventListener("click", () => {
        VOICE.speak(S + '<mstts:express-as style="friendly" styledegree="1.25">' +
          markNumbers(clean(intro.textContent)) + "</mstts:express-as>" + E);
      });
      const span = document.createElement("span");
      span.textContent = "Listen to this step, or ask me to explain it.";
      bar.appendChild(read);
      bar.appendChild(span);
      bar.appendChild(button(step, "Explain"));
      intro.parentNode.insertBefore(bar, intro.nextSibling);
    });
  })();
  const $ = (id) => document.getElementById(id);
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cheer = () => ["Yes!", "Well done!", "Super!", "That's it!", "Brilliant!"][rnd(0, 4)];
  const plain = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();


  /* ---- deck ---- */
  const slides = [...document.querySelectorAll(".slide")];
  const done = new Array(slides.length).fill(false);
  let cur = 0;
  function paintDots() {
    $("dots").innerHTML = slides.map((s, i) => '<button type="button" class="' + (i === cur ? "now" : done[i] ? "done" : "") + '" data-i="' + i + '" aria-label="Step ' + (i + 1) + '"></button>').join("");
  }
  function show(i, speak) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => s.classList.toggle("active", k === cur));
    $("back").disabled = cur === 0;
    $("next").disabled = cur === slides.length - 1;
    $("where").textContent = cur === slides.length - 1 ? "The end" : "Step " + (cur + 1) + " of " + (slides.length - 1);
    paintDots();
    if (cur === slides.length - 1) paintStickers();
    if (speak) say(slides[cur].dataset.say);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("next").addEventListener("click", () => show(cur + 1, true));
  $("back").addEventListener("click", () => show(cur - 1, true));
  $("dots").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) show(Number(b.dataset.i), true); });
  document.querySelectorAll(".speak").forEach((b) => b.addEventListener("click", () => say(b.parentElement.querySelector("span").textContent)));
  function finish(i, msg) { if (!done[i]) { done[i] = true; paintDots(); } if (msg) say(msg); }

  /* ---- one question after another ---- */
  function sequence(o) {
    let i = 0, right = 0, lock = false;
    const el = o.el;
    function draw() {
      lock = false;
      const it = o.items[i];
      $(el.say).innerHTML = it.ask;
      $(el.stage).innerHTML = it.pic || "";
      $(el.ch).innerHTML = shuffle(it.opts).map((c) => '<button type="button" class="choice' + (o.smallOpts ? " small" : "") + '" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.score).textContent = (o.label || "Question") + " " + (i + 1) + " of " + o.items.length;
      say(plain(it.ask));
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const ok = b.dataset.ok === "1", it = o.items[i];
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong"); else right++;
      $(el.fb).className = "fb " + (ok ? "good" : "bad");
      $(el.fb).textContent = (ok ? cheer() + " " : "") + it.why;
      say((ok ? cheer() + " " : "") + it.why);
      i++;
      setTimeout(() => {
        if (i >= o.items.length) {
          $(el.ch).innerHTML = ""; $(el.score).textContent = "";
          $(el.fb).className = "fb good";
          $(el.fb).textContent = "You got " + right + " of " + o.items.length + ". " + o.done;
          finish(o.finish, o.done);
        } else draw();
      }, 2700);
    });
    draw();
  }

  /* ================= the survey everything is built from ================= */
  const FRUIT = [
    { key: "mango", emoji: "🥭", name: "mango", cls: "" },
    { key: "banana", emoji: "🍌", name: "banana", cls: "b" },
    { key: "orange", emoji: "🍊", name: "orange", cls: "c" },
    { key: "apple", emoji: "🍎", name: "apple", cls: "d" },
  ];
  const CLASS = [
    { n: "Amina", f: 0, face: "👧🏽" }, { n: "Musa", f: 1, face: "👦🏾" }, { n: "Hodan", f: 0, face: "👧🏿" },
    { n: "Kiki", f: 2, face: "👧🏻" }, { n: "Omar", f: 0, face: "👦🏽" }, { n: "Nadia", f: 1, face: "👧🏾" },
    { n: "Sami", f: 3, face: "👦🏻" }, { n: "Leila", f: 0, face: "👧🏼" }, { n: "Yusuf", f: 1, face: "👦🏿" },
    { n: "Zara", f: 2, face: "👧🏽" }, { n: "Ali", f: 0, face: "👦🏼" }, { n: "Dayo", f: 1, face: "👦🏽" },
  ];
  const COUNTS = FRUIT.map((f, i) => CLASS.filter((k) => k.f === i).length);   // 5, 4, 2, 1
  const TOTAL = CLASS.length;

  function graphHtml(counts, cats, max, plus) {
    let ax = "";
    for (let v = 0; v <= max; v++) ax += "<span>" + v + "</span>";
    const cols = cats.map((c, i) => '<div class="gcol' + (plus && counts[i] === COUNTS[i] ? " done" : "") + '" data-i="' + i + '">' +
      '<div class="stack">' + Array(counts[i]).fill('<div class="blk ' + c.cls + '"></div>').join("") + "</div>" +
      '<div class="glab">' + c.emoji + "</div>" +
      (plus ? '<button type="button" class="addblk" data-i="' + i + '" aria-label="add a block for ' + c.name + '">+</button>' : "") +
      "</div>").join("");
    return '<div class="gaxis">' + ax + '</div><div class="gcols">' + cols + "</div>";
  }
  const graphBlock = (counts, cats, max) => '<div class="graph" style="justify-content:center">' + graphHtml(counts, cats, max, false) + "</div>";

  /* ---- 1: ask everyone, and draw the answers ---- */
  const asked = new Array(TOTAL).fill(false);
  function paint1() {
    $("kids1").innerHTML = CLASS.map((k, i) => '<button type="button" class="kid' + (asked[i] ? " asked" : "") + '" data-i="' + i + '">' +
      '<span class="face">' + k.face + "</span>" + k.n + '<span class="pick">' + (asked[i] ? FRUIT[k.f].emoji : "?") + "</span></button>").join("");
    $("rows1").innerHTML = FRUIT.map((f, fi) => {
      const got = CLASS.filter((k, i) => asked[i] && k.f === fi).length;
      return '<div class="rowline"><span class="tag">' + f.emoji + '</span><span class="cells">' +
        Array(got).fill("<span>" + f.emoji + "</span>").join("") +
        '</span>' + (got ? "" : '<em style="font-size:16px;color:var(--muted);font-style:normal">nobody yet</em>') + "</div>";
    }).join("");
    const n = asked.filter(Boolean).length;
    if (n === 0) { $("fb1").className = "fb"; $("fb1").textContent = ""; return; }
    $("fb1").className = "fb " + (n === TOTAL ? "good" : "");
    $("fb1").textContent = n === TOTAL
      ? "All " + TOTAL + " children asked. Every answer is a drawing in its own row."
      : n + " of " + TOTAL + " children asked.";
  }
  $("kids1").addEventListener("click", (e) => {
    const b = e.target.closest(".kid"); if (!b) return;
    const i = Number(b.dataset.i);
    if (asked[i]) return;
    asked[i] = true; paint1();
    say(CLASS[i].n + " likes " + FRUIT[CLASS[i].f].name);
    if (asked.every(Boolean)) {
      $("say1").innerHTML = "Every answer is now a <b>drawing</b> in its own row. That is the first way to show data.";
      finish(0, "You asked the whole class. Brilliant!");
    }
  });
  paint1();

  /* ---- 2: the list ---- */
  const listHtml = '<div class="list">' + CLASS.map((k) => "<div><span>" + k.n + "</span><b>" + FRUIT[k.f].emoji + " " + FRUIT[k.f].name + "</b></div>").join("") + "</div>";
  sequence({
    el: { say: "say2", stage: "stage2", ch: "ch2", fb: "fb2", score: "sc2" },
    label: "Question",
    items: [
      { ask: "Count down the list. How many children said <b>mango</b> 🥭?", pic: listHtml,
        opts: [{ t: "5", ok: true }, { t: "4", ok: false }, { t: "3", ok: false }],
        why: "Amina, Hodan, Omar, Leila and Ali: that is 5 children." },
      { ask: "How many children said <b>banana</b> 🍌?", pic: listHtml,
        opts: [{ t: "4", ok: true }, { t: "5", ok: false }, { t: "2", ok: false }],
        why: "Musa, Nadia, Yusuf and Dayo: that is 4 children." },
      { ask: "How many children said <b>apple</b> 🍎?", pic: listHtml,
        opts: [{ t: "1", ok: true }, { t: "2", ok: false }, { t: "0", ok: false }],
        why: "Only Sami said apple. Just 1 child." },
      { ask: "A list is easy to write, but is it easy to <b>count</b>?", pic: listHtml,
        opts: [{ t: "No, you have to read every line", ok: true }, { t: "Yes, it shows the totals", ok: false }],
        why: "A list keeps every answer, but you must read all 12 lines to count. A table is quicker." },
    ],
    finish: 1,
    smallOpts: true,
    done: "You can read a list.",
  });

  /* ---- 3: the table ---- */
  function tableHtml(gap) {
    return '<table class="tbl"><thead><tr><th>Fruit</th><th>How many</th></tr></thead><tbody>' +
      FRUIT.map((f, i) => "<tr><td>" + f.emoji + " " + f.name + '</td><td' + (i === gap ? ' class="gap"' : "") + ">" + (i === gap ? "?" : COUNTS[i]) + "</td></tr>").join("") +
      '<tr><td><b>altogether</b></td><td' + (gap === 4 ? ' class="gap"' : "") + "><b>" + (gap === 4 ? "?" : TOTAL) + "</b></td></tr></tbody></table>";
  }
  sequence({
    el: { say: "say3", stage: "stage3", ch: "ch3", fb: "fb3", score: "sc3" },
    label: "Gap",
    items: [
      { ask: "One number is missing. How many chose <b>mango</b> 🥭?", pic: tableHtml(0),
        opts: [{ t: "5", ok: true }, { t: "4", ok: false }, { t: "6", ok: false }],
        why: "5 children chose mango, so 5 goes in the gap." },
      { ask: "How many chose <b>orange</b> 🍊?", pic: tableHtml(2),
        opts: [{ t: "2", ok: true }, { t: "1", ok: false }, { t: "4", ok: false }],
        why: "Kiki and Zara chose orange: 2 children." },
      { ask: "How many children were asked <b>altogether</b>?", pic: tableHtml(4),
        opts: [{ t: "12", ok: true }, { t: "10", ok: false }, { t: "4", ok: false }],
        why: "5 + 4 + 2 + 1 = 12. Every child is counted once." },
    ],
    finish: 2,
    done: "You can fill in a table.",
  });

  /* ---- 4: build the block graph ---- */
  const built = [0, 0, 0, 0];
  function paint4() {
    $("graph4").innerHTML = graphHtml(built, FRUIT, 6, true);
    const okAll = built.every((b, i) => b === COUNTS[i]);
    $("fb4").className = "fb " + (okAll ? "good" : "");
    $("fb4").textContent = okAll
      ? "The graph matches the table. The tallest column is mango."
      : "Blocks so far: " + built.join(", ") + ". The table says " + COUNTS.join(", ") + ". A full column starts again if you press + once more.";
    if (okAll) finish(3, "You built the block graph. Brilliant!");
  }
  $("graph4").addEventListener("click", (e) => {
    const b = e.target.closest(".addblk"); if (!b) return;
    const i = Number(b.dataset.i);
    built[i] = built[i] >= COUNTS[i] ? 0 : built[i] + 1;
    paint4();
    say(built[i] === 0 ? "start again" : String(built[i]));
  });
  paint4();

  /* ---- 5: read the block graph ---- */
  const g5 = graphBlock(COUNTS, FRUIT, 6);
  sequence({
    el: { say: "say5", stage: "stage5", ch: "ch5", fb: "fb5", score: "sc5" },
    label: "Question",
    items: [
      { ask: "Which fruit did the <b>most</b> children choose?", pic: g5,
        opts: [{ t: "🥭 mango", ok: true }, { t: "🍌 banana", ok: false }, { t: "🍊 orange", ok: false }],
        why: "Mango has the tallest column, 5 blocks. Most means the biggest number." },
      { ask: "Which fruit did the <b>least</b> children choose?", pic: g5,
        opts: [{ t: "🍎 apple", ok: true }, { t: "🍊 orange", ok: false }, { t: "🍌 banana", ok: false }],
        why: "Apple has the shortest column, just 1 block. Least means the smallest number." },
      { ask: "How many <b>more</b> children chose mango 🥭 than banana 🍌?", pic: g5,
        opts: [{ t: "1", ok: true }, { t: "5", ok: false }, { t: "9", ok: false }],
        why: "Mango has 5 blocks and banana has 4. 5 − 4 = 1 more." },
      { ask: "Did <b>more</b> children choose orange 🍊 or apple 🍎?", pic: g5,
        opts: [{ t: "🍊 orange", ok: true }, { t: "🍎 apple", ok: false }, { t: "the same", ok: false }],
        why: "Orange has 2 blocks and apple has 1, so more chose orange." },
      { ask: "How many blocks are there <b>altogether</b>?", pic: g5,
        opts: [{ t: "12", ok: true }, { t: "11", ok: false }, { t: "4", ok: false }],
        why: "5 + 4 + 2 + 1 = 12, one block for each of the 12 children." },
    ],
    finish: 4,
    done: "You can read a block graph.",
  });

  /* ---- 6: pictogram ---- */
  function pictoHtml(counts) {
    return '<div class="picto">' + FRUIT.map((f, i) =>
      '<div class="pline"><span class="tag">' + f.emoji + '</span><span class="pics">' +
      Array(counts[i]).fill('<span>' + f.emoji + "</span>").join("") + "</span></div>").join("") +
      '</div><div class="keybox">Key: one ' + FRUIT[0].emoji + " stands for <b>one child</b></div>";
  }
  const p6 = pictoHtml(COUNTS);
  sequence({
    el: { say: "say6", stage: "stage6", ch: "ch6", fb: "fb6", score: "sc6" },
    label: "Question",
    items: [
      { ask: "In this pictogram, what does <b>one picture</b> stand for?", pic: p6,
        opts: [{ t: "one child", ok: true }, { t: "two children", ok: false }, { t: "one fruit", ok: false }],
        why: "The key at the bottom says one picture stands for one child." },
      { ask: "How many pictures are in the <b>banana</b> 🍌 row?", pic: p6,
        opts: [{ t: "4", ok: true }, { t: "5", ok: false }, { t: "2", ok: false }],
        why: "There are 4 bananas, because 4 children chose banana." },
      { ask: "Which row is the <b>longest</b>?", pic: p6,
        opts: [{ t: "🥭 mango", ok: true }, { t: "🍌 banana", ok: false }, { t: "🍎 apple", ok: false }],
        why: "The mango row has the most pictures, so it is the longest." },
      { ask: "A pictogram and a block graph show the same data. What is <b>different</b>?", pic: p6,
        opts: [{ t: "The pictogram uses pictures instead of blocks", ok: true }, { t: "The numbers are different", ok: false }, { t: "The pictogram has more children", ok: false }],
        why: "Same data, same numbers. Only the way it is drawn is different." },
    ],
    finish: 5,
    smallOpts: true,
    done: "You can read a pictogram.",
  });

  /* ================= attribute cards, for the sorting steps ================= */
  const CARDS = [
    { col: "red", kind: "circle" }, { col: "red", kind: "square" }, { col: "red", kind: "triangle" },
    { col: "blue", kind: "circle" }, { col: "blue", kind: "square" }, { col: "blue", kind: "triangle" },
    { col: "red", kind: "circle" }, { col: "blue", kind: "circle" },
  ];
  function cardSvg(c) {
    const fill = "var(--" + c.col + ")";
    if (c.kind === "circle") return '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" fill="' + fill + '" stroke="var(--ink)" stroke-width="3"></circle></svg>';
    if (c.kind === "square") return '<svg viewBox="0 0 60 60"><rect x="8" y="8" width="44" height="44" rx="4" fill="' + fill + '" stroke="var(--ink)" stroke-width="3"></rect></svg>';
    return '<svg viewBox="0 0 60 60"><polygon points="30,6 54,52 6,52" fill="' + fill + '" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"></polygon></svg>';
  }
  const cardName = (c) => (c.col === "red" ? "red" : "blue") + " " + c.kind;

  /* ---- 7: one hoop ---- */
  const HOOP_ROUNDS = [
    { rule: "Put every <b>red</b> card in the hoop.", lab: "red", test: (c) => c.col === "red", tell: "Every red card is in the hoop, and the blue ones are outside." },
    { rule: "Put every <b>circle</b> in the hoop.", lab: "circles", test: (c) => c.kind === "circle", tell: "Every circle is in the hoop, whatever colour it is." },
  ];
  let r7 = 0, inHoop = [], lock7 = false;
  function paint7() {
    const R = HOOP_ROUNDS[r7];
    $("hoop7").innerHTML = '<div class="hoop" style="left:12%;top:6px;width:76%;height:190px"><span class="hlab">' + R.lab + '</span></div>' +
      '<div class="region" style="left:18%;top:56px;width:64%;height:100px" id="reg7"></div>';
    $("reg7").innerHTML = inHoop.map((i) => '<span class="acard mini">' + cardSvg(CARDS[i]) + "</span>").join("");
    $("pool7").innerHTML = CARDS.map((c, i) => '<button type="button" class="acard' + (inHoop.includes(i) ? " gone" : "") + '" data-i="' + i + '" ' + (inHoop.includes(i) ? "disabled" : "") + ' aria-label="' + cardName(c) + '">' + cardSvg(c) + "</button>").join("");
    $("say7").innerHTML = R.rule;
    $("sc7").textContent = "Rule " + (r7 + 1) + " of " + HOOP_ROUNDS.length;
  }
  $("pool7").addEventListener("click", (e) => {
    const b = e.target.closest(".acard"); if (!b || lock7 || b.disabled) return;
    const R = HOOP_ROUNDS[r7], i = Number(b.dataset.i), c = CARDS[i];
    if (!R.test(c)) {
      b.classList.add("oops");
      $("fb7").className = "fb bad"; $("fb7").textContent = "A " + cardName(c) + " does not belong in the " + R.lab + " hoop.";
      say("A " + cardName(c) + " does not belong in that hoop.");
      setTimeout(() => b.classList.remove("oops"), 900);
      return;
    }
    inHoop.push(i); paint7();
    const want = CARDS.filter(R.test).length;
    $("fb7").className = "fb good";
    $("fb7").textContent = inHoop.length < want ? cheer() + " " + (want - inHoop.length) + " more to find." : R.tell;
    say(inHoop.length < want ? cheer() : R.tell);
    if (inHoop.length === want) {
      lock7 = true; r7++;
      setTimeout(() => {
        if (r7 >= HOOP_ROUNDS.length) {
          $("pool7").innerHTML = ""; $("sc7").textContent = "";
          $("fb7").className = "fb good"; $("fb7").textContent = "You sorted both rules.";
          finish(6, "You can sort into a hoop. Brilliant!");
        } else { inHoop = []; lock7 = false; paint7(); $("fb7").textContent = ""; $("fb7").className = "fb"; say(plain(HOOP_ROUNDS[r7].rule)); }
      }, 2700);
    }
  });
  paint7();

  /* ---- 8: two hoops that overlap ---- */
  const V8 = [
    { c: { col: "red", kind: "circle" }, place: "both" },
    { c: { col: "red", kind: "square" }, place: "red" },
    { c: { col: "blue", kind: "circle" }, place: "circ" },
    { c: { col: "blue", kind: "triangle" }, place: "out" },
    { c: { col: "red", kind: "triangle" }, place: "red" },
    { c: { col: "blue", kind: "circle" }, place: "circ" },
  ];
  const PLACED8 = { red: [], both: [], circ: [], out: [] };
  const WHERE8 = {
    red: "in the red hoop only", both: "in the middle, where they cross",
    circ: "in the circles hoop only", out: "outside both hoops",
  };
  let i8 = 0, lock8 = false;
  function paint8() {
    $("hoop8").innerHTML =
      '<div class="hoop" style="left:2%;top:6px;width:60%;height:186px"><span class="hlab">red</span></div>' +
      '<div class="hoop" style="left:38%;top:6px;width:60%;height:186px;border-color:var(--plum)"><span class="hlab" style="color:var(--plum)">circles</span></div>' +
      '<div class="region" style="left:6%;top:60px;width:28%;height:80px" id="r8red"></div>' +
      '<div class="region" style="left:39%;top:60px;width:22%;height:80px" id="r8both"></div>' +
      '<div class="region" style="left:66%;top:60px;width:28%;height:80px" id="r8circ"></div>';
    ["red", "both", "circ"].forEach((k) => {
      $("r8" + k).innerHTML = PLACED8[k].map((c) => '<span class="acard mini">' + cardSvg(c) + "</span>").join("");
    });
    $("out8").innerHTML = '<span class="olab">not red and not a circle</span>' +
      PLACED8.out.map((c) => '<span class="acard mini">' + cardSvg(c) + "</span>").join("");
    const it = V8[i8];
    $("now8").innerHTML = it ? '<div style="display:grid;justify-items:center;gap:6px"><span class="score">this card</span><span class="acard now">' + cardSvg(it.c) + "</span></div>" : "";
    $("sc8").textContent = "Card " + Math.min(i8 + 1, V8.length) + " of " + V8.length;
  }
  function ask8() {
    lock8 = false; paint8();
    const it = V8[i8];
    $("say8").innerHTML = "Where does the <b>" + cardName(it.c) + "</b> go?";
    $("ch8").innerHTML = shuffle(Object.keys(WHERE8)).map((k) => '<button type="button" class="choice small" data-k="' + k + '">' + WHERE8[k] + "</button>").join("");
    $("fb8").textContent = ""; $("fb8").className = "fb";
    say("Where does the " + cardName(it.c) + " go?");
  }
  $("ch8").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lock8) return;
    lock8 = true;
    const it = V8[i8], ok = b.dataset.k === it.place;
    $("ch8").querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.k === it.place) c.classList.add("right"); });
    if (!ok) b.classList.add("wrong");
    PLACED8[it.place].push(it.c);
    const why = it.place === "both" ? "It is red AND a circle, so it goes in the middle."
      : it.place === "red" ? "It is red, but it is not a circle, so it goes in the red hoop only."
      : it.place === "circ" ? "It is a circle, but it is not red, so it goes in the circles hoop only."
      : "It is not red and it is not a circle, so it goes outside both hoops.";
    $("fb8").className = "fb " + (ok ? "good" : "bad");
    $("fb8").textContent = (ok ? cheer() + " " : "") + why;
    say((ok ? cheer() + " " : "") + why);
    i8++;
    setTimeout(() => {
      if (i8 >= V8.length) {
        paint8(); $("ch8").innerHTML = ""; $("sc8").textContent = "";
        $("say8").innerHTML = "Every card has a place. The <b>middle</b> is for cards that follow <b>both</b> rules. Two hoops that cross like this are a <b>Venn diagram</b>.";
        $("fb8").className = "fb good"; $("fb8").textContent = "All six cards sorted.";
        finish(7, "You can use two hoops that cross. Brilliant!");
      } else ask8();
    }, 3000);
  });
  ask8();

  /* ---- 9: carroll diagram ---- */
  const C9 = [
    { c: { col: "red", kind: "circle" }, cell: "rc" },
    { c: { col: "red", kind: "square" }, cell: "rn" },
    { c: { col: "blue", kind: "circle" }, cell: "bc" },
    { c: { col: "blue", kind: "triangle" }, cell: "bn" },
    { c: { col: "red", kind: "triangle" }, cell: "rn" },
    { c: { col: "blue", kind: "circle" }, cell: "bc" },
  ];
  const CELLS9 = { rc: "red · circle", rn: "red · not a circle", bc: "not red · circle", bn: "not red · not a circle" };
  const WHY9 = { rc: "It is red and it is a circle.", rn: "It is red, but it is not a circle.", bc: "It is not red, but it is a circle.", bn: "It is not red and it is not a circle." };
  const PLACED9 = { rc: [], rn: [], bc: [], bn: [] };
  let i9 = 0, lock9 = false;
  function paint9() {
    $("carroll9").innerHTML = '<table class="carroll"><thead><tr><th></th><th>circle</th><th>not a circle</th></tr></thead><tbody>' +
      '<tr><th>red</th><td><div class="cellin" id="c9rc"></div></td><td><div class="cellin" id="c9rn"></div></td></tr>' +
      '<tr><th>not red</th><td><div class="cellin" id="c9bc"></div></td><td><div class="cellin" id="c9bn"></div></td></tr>' +
      "</tbody></table>";
    Object.keys(PLACED9).forEach((k) => {
      $("c9" + k).innerHTML = PLACED9[k].map((c) => '<span class="acard mini">' + cardSvg(c) + "</span>").join("");
    });
    const it = C9[i9];
    $("now9").innerHTML = it ? '<div style="display:grid;justify-items:center;gap:6px"><span class="score">this card</span><span class="acard now">' + cardSvg(it.c) + "</span></div>" : "";
    $("sc9").textContent = "Card " + Math.min(i9 + 1, C9.length) + " of " + C9.length;
  }
  function ask9() {
    lock9 = false; paint9();
    const it = C9[i9];
    $("say9").innerHTML = "Which box does the <b>" + cardName(it.c) + "</b> belong in?";
    $("ch9").innerHTML = shuffle(Object.keys(CELLS9)).map((k) => '<button type="button" class="choice small" data-k="' + k + '">' + CELLS9[k] + "</button>").join("");
    $("fb9").textContent = ""; $("fb9").className = "fb";
    say("Which box does the " + cardName(it.c) + " belong in?");
  }
  $("ch9").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lock9) return;
    lock9 = true;
    const it = C9[i9], ok = b.dataset.k === it.cell;
    $("ch9").querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.k === it.cell) c.classList.add("right"); });
    if (!ok) b.classList.add("wrong");
    PLACED9[it.cell].push(it.c);
    $("fb9").className = "fb " + (ok ? "good" : "bad");
    $("fb9").textContent = (ok ? cheer() + " " : "") + WHY9[it.cell];
    say((ok ? cheer() + " " : "") + WHY9[it.cell]);
    i9++;
    setTimeout(() => {
      if (i9 >= C9.length) {
        paint9(); $("ch9").innerHTML = ""; $("sc9").textContent = "";
        $("say9").innerHTML = "A Carroll diagram has a box for <b>every</b> card. Nothing can be left out.";
        $("fb9").className = "fb good"; $("fb9").textContent = "All six cards are in a box.";
        finish(8, "You can use a Carroll diagram. Brilliant!");
      } else ask9();
    }, 3000);
  });
  ask9();

  /* ---- 10: answer the question ---- */
  const PETS = [
    { key: "dog", emoji: "🐕", name: "dog", cls: "" },
    { key: "cat", emoji: "🐈", name: "cat", cls: "b" },
    { key: "fish", emoji: "🐟", name: "fish", cls: "c" },
    { key: "bird", emoji: "🐦", name: "bird", cls: "d" },
  ];
  const PETC = [6, 4, 4, 2];
  const g10 = graphBlock(PETC, PETS, 6);
  sequence({
    el: { say: "say10", stage: "stage10", ch: "ch10", fb: "fb10", score: "sc10" },
    label: "Question",
    items: [
      { ask: "How many children have a <b>cat</b> 🐈?", pic: g10,
        opts: [{ t: "4", ok: true }, { t: "6", ok: false }, { t: "2", ok: false }],
        why: "The cat column is 4 blocks tall, so 4 children." },
      { ask: "Which pet do the <b>most</b> children have?", pic: g10,
        opts: [{ t: "🐕 dog", ok: true }, { t: "🐈 cat", ok: false }, { t: "🐦 bird", ok: false }],
        why: "The dog column is the tallest, at 6." },
      { ask: "Which two pets have the <b>same</b> number?", pic: g10,
        opts: [{ t: "🐈 cat and 🐟 fish", ok: true }, { t: "🐕 dog and 🐈 cat", ok: false }, { t: "🐟 fish and 🐦 bird", ok: false }],
        why: "Cat and fish are both 4 blocks tall, so their columns are the same height." },
      { ask: "How many <b>fewer</b> children have a bird 🐦 than a dog 🐕?", pic: g10,
        opts: [{ t: "4", ok: true }, { t: "2", ok: false }, { t: "8", ok: false }],
        why: "Dog is 6 and bird is 2. 6 − 2 = 4 fewer." },
      { ask: "How many children were asked <b>altogether</b>?", pic: g10,
        opts: [{ t: "16", ok: true }, { t: "12", ok: false }, { t: "6", ok: false }],
        why: "6 + 4 + 4 + 2 = 16 children." },
    ],
    finish: 9,
    done: "Every question had one answer, and the graph gave it.",
  });

  /* ---- 11: what can we say ---- */
  sequence({
    el: { say: "say11", stage: "stage11", ch: "ch11", fb: "fb11", score: "sc11" },
    label: "Question",
    smallOpts: true,
    items: [
      { ask: "Which of these is <b>true</b> about the pet graph?", pic: g10,
        opts: [
          { t: "More children have a dog than a bird", ok: true },
          { t: "Every child has a dog", ok: false },
          { t: "Nobody has a fish", ok: false }],
        why: "6 is more than 2, so that one is true. The other two say things the graph shows are wrong." },
      { ask: "Which of these is <b>true</b>?", pic: g10,
        opts: [
          { t: "The same number have a cat as a fish", ok: true },
          { t: "Cats are the best pet", ok: false },
          { t: "More have a cat than a fish", ok: false }],
        why: "Both columns are 4 tall, so the numbers are the same. A graph cannot tell you which pet is best: that is what somebody thinks, not what they counted." },
      { ask: "Look back at the fruit graph. Which of these is <b>true</b>?", pic: g5,
        opts: [
          { t: "Mango was chosen most often", ok: true },
          { t: "Everybody likes mango", ok: false },
          { t: "Nobody likes apple", ok: false }],
        why: "Mango has the tallest column. But 7 children chose something else, and 1 child did choose apple." },
      { ask: "The fruit graph is about <b>our class</b>. Can it tell us what the whole school likes best?", pic: g5,
        opts: [{ t: "No, we only asked our class", ok: true }, { t: "Yes, it is the same everywhere", ok: false }],
        why: "Data only tells you about the people you actually asked." },
    ],
    finish: 10,
    done: "You can say what a graph really tells you.",
  });

  /* ---- check ---- */
  const CHECK = [
    { q: "What is the <b>first</b> thing to do when you want to collect data?", pic: "", opts: ["ask a question", "draw a graph", "count the blocks"], a: "ask a question", why: "You need a question first. Then you can go and ask people." },
    { q: "In a <b>block graph</b>, one block stands for…", pic: graphBlock(COUNTS, FRUIT, 6), opts: ["one child", "one fruit", "ten children"], a: "one child", why: "Each block stands for one of the people you asked." },
    { q: "Which fruit column is the <b>tallest</b>?", pic: graphBlock(COUNTS, FRUIT, 6), opts: ["🥭 mango", "🍌 banana", "🍎 apple"], a: "🥭 mango", why: "The mango column has 5 blocks, more than any other." },
    { q: "Which fruit did the <b>fewest</b> children choose?", pic: graphBlock(COUNTS, FRUIT, 6), opts: ["🍎 apple", "🍊 orange", "🍌 banana"], a: "🍎 apple", why: "Apple has just 1 block, the shortest column." },
    { q: "How many <b>more</b> chose mango 🥭 than orange 🍊?", pic: graphBlock(COUNTS, FRUIT, 6), opts: ["3", "2", "7"], a: "3", why: "Mango is 5 and orange is 2. 5 − 2 = 3." },
    { q: "In a <b>pictogram</b> the key says one 🍌 stands for one child. There are 4 bananas. How many children?", pic: "", opts: ["4", "1", "8"], a: "4", why: "One picture, one child. So 4 pictures means 4 children." },
    { q: "A <b>table</b> is better than a list because…", pic: "", opts: ["it shows how many chose each answer", "it is longer", "it has pictures"], a: "it shows how many chose each answer", why: "A table already has the counts, so you do not have to read every line." },
    { q: "A <b>hoop</b> holds the things that…", pic: "", opts: ["follow the rule", "are the same colour", "are left over"], a: "follow the rule", why: "Whatever the rule says, the things that follow it go inside the hoop." },
    { q: "Two hoops cross over. A card in the <b>middle</b>…", pic: "", opts: ["follows both rules", "follows neither rule", "follows one rule"], a: "follows both rules", why: "The middle belongs to both hoops at once." },
    { q: "A red circle is sorted into hoops labelled <b>red</b> and <b>circles</b>. Where does it go?", pic: "", opts: ["in the middle", "in the red hoop only", "outside"], a: "in the middle", why: "It is red AND a circle, so it belongs to both." },
    { q: "In a <b>Carroll diagram</b>, how many cards are left out?", pic: "", opts: ["none, every card has a box", "the ones that follow no rule", "the blue ones"], a: "none, every card has a box", why: "A Carroll diagram has a box for yes and a box for no, so nothing is left out." },
    { q: "A blue square goes in the Carroll diagram with rows <b>red / not red</b> and columns <b>circle / not a circle</b>. Which box?", pic: "", opts: ["not red, not a circle", "red, circle", "not red, circle"], a: "not red, not a circle", why: "Blue is not red, and a square is not a circle." },
    { q: "6 children have a dog and 2 have a bird. Which is <b>true</b>?", pic: "", opts: ["more have a dog", "more have a bird", "the same number"], a: "more have a dog", why: "6 is more than 2." },
    { q: "Our class graph says most chose mango. Can we say <b>everybody</b> likes mango?", pic: "", opts: ["no", "yes"], a: "no", why: "Most is not everybody. 7 of the 12 children chose something else." },
    { q: "We asked our class. Does the graph tell us about the <b>whole school</b>?", pic: "", opts: ["no, only the class we asked", "yes, all classes are the same"], a: "no, only the class we asked", why: "Data only tells you about the people you asked." },
    { q: "Which word means the <b>smallest</b> number in a graph?", pic: "", opts: ["least", "most", "more"], a: "least", why: "Least means the smallest. Most means the biggest." },
  ];
  let qc = 0, rightc = 0, lockc = false;
  function askCheck() {
    lockc = false;
    const Q = CHECK[qc];
    $("sayck").innerHTML = Q.q;
    $("stageck").innerHTML = Q.pic || "";
    $("chck").innerHTML = shuffle(Q.opts).map((o) => '<button type="button" class="choice small" data-v="' + o + '">' + o + "</button>").join("");
    $("fbck").textContent = ""; $("fbck").className = "fb";
    $("scck").textContent = "Question " + (qc + 1) + " of " + CHECK.length;
    say(plain(Q.q));
  }
  $("chck").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lockc) return;
    lockc = true;
    const Q = CHECK[qc], ok = b.dataset.v === Q.a;
    $("chck").querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.v === Q.a) c.classList.add("right"); });
    if (!ok) b.classList.add("wrong"); else rightc++;
    $("fbck").className = "fb " + (ok ? "good" : "bad");
    $("fbck").textContent = (ok ? cheer() + " " : "") + Q.why;
    say((ok ? cheer() + " " : "") + Q.why);
    qc++;
    setTimeout(() => {
      if (qc >= CHECK.length) {
        $("chck").innerHTML = ""; $("stageck").innerHTML = ""; $("scck").textContent = "";
        $("fbck").className = "fb good";
        $("fbck").textContent = "You got " + rightc + " out of " + CHECK.length + "!";
        say("You got " + rightc + " out of " + CHECK.length + "!");
        finish(11, "Well done!");
      } else askCheck();
    }, 2800);
  });
  askCheck();

  /* ---- stickers ---- */
  const STICKERS = [
    ["🙋", "I asked everyone"], ["📝", "I can read a list"], ["🧾", "I can fill a table"], ["🧱", "I built a block graph"],
    ["📊", "I can read a graph"], ["🖼️", "I can read a pictogram"], ["⭕", "Sorting into a hoop"], ["🔗", "I can read a Venn diagram"],
    ["🗂️", "A Carroll diagram"], ["❓", "Answering the question"], ["💭", "What we can say"], ["✅", "Show what I know"],
  ];
  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] +
      (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    const got = done.slice(0, 12).filter(Boolean).length;
    $("fbstick").className = "fb " + (got === 12 ? "good" : "");
    $("fbstick").textContent = got === 12 ? "All 12 stickers! You are a data star." : got + " of 12 stickers so far.";
  }
  $("restart").addEventListener("click", () => location.reload());

  show(0, false);

  /* ================= the two header bars =================
     Everything here is answered by this page. Join class, Class chat, Hand up
     and XP are deliberately absent: they need the launch token and the platform
     endpoints, and a control that reaches nobody is worse than no control. */
  (function () {
    const earnable = slides.length - 1;            // teaching slides + the check
    const pctEl = $("ehPct"), fillEl = $("ehFill");
    function ehPaint() {
      const n = done.slice(0, earnable).filter(Boolean).length;
      const p = earnable ? Math.round((n / earnable) * 100) : 0;
      pctEl.textContent = p + "%";
      fillEl.style.width = p + "%";
      const box = $("ehSteps");
      if (box && !box.hidden) ehSteps();
    }
    function ehSteps() {
      $("ehSteps").innerHTML = slides.map(function (s, i) {
        const h = s.querySelector("h2");
        return '<button type="button" data-i="' + i + '" class="' +
          (i === cur ? "now " : "") + (done[i] ? "done" : "") + '">' +
          (i + 1) + ". " + (h ? h.textContent : "Step " + (i + 1)) + "</button>";
      }).join("");
    }
    $("ehSteps").addEventListener("click", function (e) {
      const b = e.target.closest("button[data-i]");
      if (!b) return;
      show(+b.dataset.i, true);
      $("ehSteps").hidden = true;
      $("ehMenu").setAttribute("aria-expanded", "false");
    });
    $("ehMenu").addEventListener("click", function () {
      const box = $("ehSteps"), open = box.hidden;
      if (open) ehSteps();
      box.hidden = !open;
      $("ehMenu").setAttribute("aria-expanded", open ? "true" : "false");
    });
    $("ehPicker").addEventListener("change", function (e) {
      if (e.target.value) location.href = e.target.value + location.search;
    });
    $("ehFull").addEventListener("click", function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    });
    document.addEventListener("fullscreenchange", function () {
      $("ehFull").innerHTML = document.fullscreenElement ? "\u26f6 Leave full screen" : "\u26f6 Full screen";
    });
    /* the voice toggle mutes what SHE says; it does not touch the Listen
       buttons, which a child presses on purpose */
    let muted = false;
    const realSay = say;
    say = function (t) { if (!muted) realSay(t); };
    $("ehAudio").addEventListener("click", function () {
      muted = !muted;
      if (muted && window.VOICE && VOICE.stop) VOICE.stop();
      $("ehAudio").setAttribute("aria-pressed", muted ? "true" : "false");
      $("ehAudio").title = muted ? "Turn the voice on" : "Turn the voice off";
    });
    /* every completion repaints the rail, so that is where the pill hangs */
    const realPaintDots = paintDots;
    paintDots = function () { realPaintDots(); ehPaint(); };
    const realShow = show;
    show = function (i, speak) { realShow(i, speak); ehPaint(); };
    ehPaint();
  })();

  })();
