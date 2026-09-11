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

    /* LETTER NAMES. A letter standing on its own - "a is 1", "8 is h", "c, a,
       t", "under a is d" - is handed to the voice in CAPITALS, the form every
       engine here reads as the letter's name ("A is for apple"). Lowercase, a
       lone "a" is read as the article: "uh is one". The screen keeps the
       lowercase; only the words sent to the voice change. The Grade 3
       validation (2026-09-11) found the cipher lesson could only ask for
       someone to listen; this makes the reading a rule instead of a hope.

       A lone b to z is always a letter in these lessons. A lone "a" is the
       letter only where an article cannot stand: before "is", "becomes",
       "moves", "to", "into", "and", "or", before punctuation or the end, or
       after "=". Not before "..." or "…": "is called a..." is the article
       in front of a blank. Not after "letter": "give each letter a shape" is
       an article. The first draft had that clause and no ellipsis rule, and
       the audit found both. A letter after "%" is a format code, never
       spoken. Contractions (it&#39;s), "e.g." and "a.m." are left alone,
       and text inside tags is never touched. No lookbehind, which older
       Safari cannot parse. Every change it makes across Grades 1 to 4 is
       listed by the kit's letter-name audit, and was read before shipping. */
    function letterNames(text) {
      return String(text).replace(/(^|[^A-Za-z0-9'\u2018\u2019%-])([a-z])(?=$|[^A-Za-z0-9'\u2019-])/g, function (m, pre, ch, off, all) {
        const i = off + pre.length, before = all.slice(0, i), after = all.slice(i + 1);
        if (/&(#39|#x27|apos);$/i.test(before)) return m;
        if (/^\.[a-z]\./i.test(after) || /(^|[^A-Za-z])[a-z]\.$/i.test(before)) return m;
        if (ch === "a" && !(/^\s*(is|becomes|moves|to|into|and|or)\b(?!-)/.test(after) || /^\s*([,;:!?)\u2019"]|\.(?!\.)|$)/.test(after) || /=\s*$/.test(before))) return m;
        return pre + ch.toUpperCase();
      });
    }
    function letterNamesInSsml(s) {
      return s.split(/(<[^>]*>)/).map(function (part, k) { return k % 2 ? part : letterNames(part); }).join("");
    }
    /* end LETTER NAMES */
    const OPEN = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-GB"><voice name="en-GB-SoniaNeural">';
    const SHUT = "</voice></speak>";
    /* Plain text is still SSML here - it just gets the house style put round it. */
    function wrap(x) {
      const s = String(x == null ? "" : x).trim();
      if (!s) return "";
      if (/^<speak[\s>]/i.test(s)) return letterNamesInSsml(s);
      const body = /<(mstts:)?express-as|<prosody|<emphasis|<break|<say-as|<[sp]>/i.test(s) ? letterNamesInSsml(s) : letterNames(escapeText(s));
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
  /* Silent while the deck paints -- see window.__ehelPainting in
     build-lessons.py. Every call site in this lesson goes through say(), so
     this is the one place the draw pass can be silenced without touching a
     single renderer. */
  function say(text) { if (window.__ehelPainting) return; VOICE.speak(text); }

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