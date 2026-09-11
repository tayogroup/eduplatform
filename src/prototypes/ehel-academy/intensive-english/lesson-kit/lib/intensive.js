  /* ==================================================================
     THE INTENSIVE ENGLISH RENDERERS.

     One step per screen, in the design of the Grade 1 Mathematics and
     English standalone builds. The deck above puts every slide in the DOM
     at once and hides all but one, so everything here draws at load and
     nothing here may speak while it draws (window.__ehelPainting), and a
     clip may only play for the slide the learner is actually on
     (playHere / ONSHOW).

     ADULT COURSE. No stickers, no prizes, no cheering. A step that is
     finished says so once, plainly, and the dot rail carries the rest.
     paintStickers() is defined because the lifted deck calls it on the
     last slide; here it draws the "What you can do now" summary.
     ================================================================== */

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const lines = (text) => String(text || "").split("\n").filter((l) => l.trim());
  const para = (text) => lines(text).map((l) => "<p>" + esc(l) + "</p>").join("");
  const pre = (text) => '<pre class="rule">' + esc(String(text || "")) + "</pre>";

  /* ---- the clip a text was recorded under -------------------------------
     cyrb53 of the DISPLAYED text, exactly as the course shell's
     staticVoiceKey computes it and as the generator names the file. The
     hash is computed here rather than baked in by the builder so the page
     and the recording can never disagree about which text was spoken. */
  function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  const AUDIO_IS_DEV = ["localhost", "127.0.0.1", ""].includes(location.hostname);
  /* Two trees, one file. In dev the clips sit beside this build
     (intensive-english/media/audio/tts); deployed they are fanned out per
     level into media/intensive-english/gNN/audio/tts by the uploader. */
  function clipFor(text) {
    const key = cyrb53(String(text || "").replace(/\s+/g, " ").trim());
    if (!key) return "";
    return AUDIO_IS_DEV
      ? "../media/audio/tts/" + key + ".mp3"
      : "../../../media/intensive-english/g" + String(LESSON.level).padStart(2, "0") + "/audio/tts/" + key + ".mp3";
  }

  /* One player, because two would talk over each other. A clip that will not
     play hands its words to the voice engine, which is also what happens for
     a text too short to have been recorded (the generator's floor). */
  const player = new Audio();
  player.preload = "none";
  function playClip(text, spoken) {
    if (window.__ehelPainting) return Promise.resolve(false);
    const url = clipFor(text);
    const fallback = spoken || text;
    if (!url) { if (fallback) say(fallback); return Promise.resolve(false); }
    try { VOICE.stop && VOICE.stop(); } catch (_) { /* the voice may be mid-sentence */ }
    return new Promise((resolve) => {
      let settled = false;
      const finished = (ok) => { if (settled) return; settled = true; resolve(ok); };
      player.onended = () => finished(true);
      player.onerror = () => { if (fallback) say(fallback); finished(false); };
      player.src = url;
      const p = player.play();
      if (p && p.catch) p.catch(() => { if (fallback) say(fallback); finished(false); });
    });
  }

  /* show() is wrapped rather than edited: it is lifted verbatim and the
     shared progress step patches it by matching its exact text. */
  const ONSHOW = [];
  const showWithoutClips = show;
  show = function (i, speak) {
    showWithoutClips(i, speak);
    const f = ONSHOW[cur];
    if (f) { try { f(); } catch (_) { /* a step must never break the deck */ } }
  };
  function playHere(idx, text, spoken) { if (cur === idx) playClip(text, spoken); }
  /* A read-only step is done when it is SEEN, not when it is drawn. */
  function finishOnArrival(i, msg) {
    ONSHOW[i] = () => { finish(i, msg || ""); };
  }
  const attempt = (i, answered, total, noun) => {
    if (window.__ehelAttempt) { try { window.__ehelAttempt(i, answered, total, noun); } catch (_) {} }
  };
  const knownWords = (words) => {
    if (window.__ehelKnown) { try { window.__ehelKnown(words); } catch (_) {} }
  };
  const listenBtn = (text, label) =>
    '<button type="button" class="big small ghost listen" data-say="' + esc(text) + '">&#9654; ' + esc(label || "Listen") + "</button>";

  function wireListen(root) {
    root.querySelectorAll(".listen").forEach((b) => {
      b.addEventListener("click", () => playClip(b.dataset.say));
    });
  }

  /* ================= 1. what this unit is for ======================== */
  function unitOverview(i, id) {
    const el = $(id);
    el.innerHTML =
      '<p class="eyebrow">' + esc(LESSON.levelLabel) + " &middot; Unit " + LESSON.unit + " &middot; CEFR " + esc(LESSON.band) + "</p>" +
      "<h2>" + esc(LESSON.title) + "</h2>" +
      '<p class="lead">' + esc(LESSON.overview) + "</p>" +
      '<div class="panel"><h3>By the end of this unit</h3><ul class="cando">' +
      LESSON.outcomes.map((o) => "<li>" + esc(o.can) + "<small>" + esc(o.detail) + "</small></li>").join("") +
      "</ul></div>" +
      (LESSON.path.length
        ? '<div class="panel"><h3>How to work through it</h3><ol class="path">' +
          LESSON.path.map((p) => "<li>" + esc(p) + "</li>").join("") + "</ol></div>"
        : "");
    finishOnArrival(i);
  }

  /* ================= 2. the lesson ================================== */
  function lecture(i, id) {
    const el = $(id);
    const text = LESSON.lecture;
    el.innerHTML =
      "<h2>The lesson</h2>" +
      '<p class="lead">Listen first. Then read it and listen again. Then read it out loud yourself.</p>' +
      '<div class="actions">' + listenBtn(text, "Listen to the lesson") + "</div>" +
      '<div class="reading">' + para(text) + "</div>" +
      '<div class="actions"><button type="button" class="big" id="' + id + '-done">I have read and listened</button></div>';
    wireListen(el);
    $(id + "-done").addEventListener("click", () => finish(i, "Now the words."));
  }

  /* ================= 3. the words =================================== */
  function wordWalk(i, id, group) {
    const el = $(id);
    const words = group.words;
    let at = 0, sentence = 0;
    const seen = new Set();
    el.innerHTML =
      "<h2>" + esc(group.title) + "</h2>" +
      '<p class="lead">Tap Hear it. Say the word. Then read the sentences.</p>' +
      '<div class="ien-word" id="' + id + '-card"></div>' +
      '<div class="actions">' +
      '<button type="button" class="big small ghost" id="' + id + '-prev">&#9664; Back</button>' +
      '<button type="button" class="big small" id="' + id + '-hear">&#9654; Hear it</button>' +
      '<button type="button" class="big small ghost" id="' + id + '-more">Another sentence</button>' +
      '<button type="button" class="big" id="' + id + '-next">Next word &#9654;</button>' +
      "</div>" +
      '<p class="count" id="' + id + '-count"></p>';

    function draw(speakIt) {
      const w = words[at];
      seen.add(w.w);
      $(id + "-card").innerHTML =
        (w.pic ? '<span class="pic" aria-hidden="true">' + w.pic + "</span>" : "") +
        '<p class="pos">' + esc(w.pos) + "</p>" +
        "<h3>" + esc(w.w) + "</h3>" +
        '<p class="meaning">' + esc(w.meaning) + "</p>" +
        '<p class="example">' + esc(w.sentences[sentence] || w.example) + "</p>" +
        (w.starter ? '<p class="starter">Your turn: ' + esc(w.starter) + " &hellip;</p>" : "");
      $(id + "-count").textContent = "Word " + (at + 1) + " of " + words.length;
      $(id + "-prev").disabled = at === 0;
      if (speakIt) playHere(i, w.w, w.w);
      if (seen.size === words.length) { finish(i, ""); knownWords([...seen]); attempt(i, seen.size, words.length, "words"); }
    }
    $(id + "-hear").addEventListener("click", () => playClip(words[at].w, words[at].w));
    $(id + "-more").addEventListener("click", () => {
      const w = words[at];
      sentence = (sentence + 1) % Math.max(1, w.sentences.length);
      draw(false);
      playClip(w.sentences[sentence] || w.example);
    });
    $(id + "-next").addEventListener("click", () => { at = (at + 1) % words.length; sentence = 0; draw(true); });
    $(id + "-prev").addEventListener("click", () => { at = Math.max(0, at - 1); sentence = 0; draw(true); });
    draw(false);
    ONSHOW[i] = () => playHere(i, words[at].w, words[at].w);
  }

  /* ---- which word means this? --------------------------------------- */
  function wordCheck(i, id, words) {
    const el = $(id);
    const items = shuffle(words).slice(0, Math.min(8, words.length));
    let at = 0, right = 0;
    el.innerHTML =
      "<h2>Which word?</h2>" +
      '<p class="lead">Read the meaning. Tap the word it belongs to.</p>' +
      '<p class="prompt" id="' + id + '-q"></p>' +
      '<div class="options" id="' + id + '-opts"></div>' +
      '<p class="feedback" id="' + id + '-fb" role="status" aria-live="polite"></p>' +
      '<p class="count" id="' + id + '-count"></p>';

    function draw() {
      const item = items[at];
      const wrong = shuffle(words.filter((w) => w.w !== item.w)).slice(0, 3);
      const opts = shuffle([item, ...wrong]);
      $(id + "-q").textContent = item.meaning;
      $(id + "-count").textContent = "Question " + (at + 1) + " of " + items.length;
      $(id + "-opts").innerHTML = opts.map((o) => '<button type="button" class="opt" data-w="' + esc(o.w) + '">' + esc(o.w) + "</button>").join("");
      $(id + "-opts").querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
        if (b.disabled) return;
        const ok = b.dataset.w === item.w;
        $(id + "-opts").querySelectorAll(".opt").forEach((x) => { x.disabled = true; if (x.dataset.w === item.w) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        if (ok) { right += 1; knownWords([item.w]); }
        $(id + "-fb").textContent = ok ? "Yes. " + item.w + "." : "It is " + item.w + ".";
        setTimeout(() => {
          at += 1;
          if (at < items.length) { $(id + "-fb").textContent = ""; draw(); }
          else {
            $(id + "-fb").textContent = right + " of " + items.length + " right.";
            $(id + "-opts").innerHTML = "";
            $(id + "-count").textContent = "";
            attempt(i, items.length, items.length, "words");
            finish(i, "");
          }
        }, 1400);
      }));
    }
    draw();
  }

  /* ================= 4. a pattern =================================== */
  function pattern(i, id, card) {
    const el = $(id);
    el.innerHTML =
      '<p class="eyebrow">Pattern</p>' +
      "<h2>" + esc(card.title) + "</h2>" +
      '<div class="actions">' + listenBtn(card.title + ". " + card.explanation, "Hear it") + "</div>" +
      '<div class="lead">' + para(card.explanation) + "</div>" +
      pre(card.rule) +
      '<details class="drawer" open><summary>One done for you</summary>' + para(card.worked) + "</details>" +
      (card.mistake ? '<details class="drawer warn"><summary>The easy mistake</summary>' + para(card.mistake) + "</details>" : "") +
      (card.tip ? '<p class="tip">' + esc(card.tip) + "</p>" : "") +
      (card.practice
        ? '<div class="panel"><h3>Your turn</h3>' + para(card.practice) +
          '<textarea class="write" rows="4" id="' + id + '-write" placeholder="Write your answers here."></textarea>' +
          '<div class="actions"><button type="button" class="big small" id="' + id + '-check">Check yourself</button></div>' +
          '<div class="answers" id="' + id + '-ans" hidden>' + para(card.answers) + "</div></div>"
        : "");
    wireListen(el);
    if (card.practice) {
      const box = $(id + "-write");
      const saveKey = "ien-" + LESSON.level + "-" + LESSON.unit + "-" + id;
      try { box.value = localStorage.getItem(saveKey) || ""; } catch (_) {}
      box.addEventListener("input", () => { try { localStorage.setItem(saveKey, box.value); } catch (_) {} });
      $(id + "-check").addEventListener("click", () => {
        $(id + "-ans").hidden = false;
        finish(i, "");
      });
    } else {
      finishOnArrival(i);
    }
    ONSHOW[i] = () => playHere(i, card.title + ". " + card.explanation);
  }

  /* ================= 5. a text ====================================== */
  function reading(i, id, r) {
    const el = $(id);
    const label = r.doc ? r.doc : r.type;
    el.innerHTML =
      '<p class="eyebrow">' + esc(label) + "</p>" +
      "<h2>" + esc(r.title) + "</h2>" +
      '<div class="actions">' + listenBtn(r.speech || r.passage, "Listen") + "</div>" +
      '<div class="reading' + (r.doc ? " document" : "") + '">' + para(r.passage) + "</div>" +
      '<div class="actions"><button type="button" class="big" id="' + id + '-done">I have read it</button></div>';
    wireListen(el);
    $(id + "-done").addEventListener("click", () => finish(i, ""));
  }

  /* ---- questions about the texts ------------------------------------ */
  function questions(i, id, items) {
    const el = $(id);
    let at = 0, right = 0;
    el.innerHTML =
      "<h2>Questions</h2>" +
      '<p class="lead">Look back at the text if you need to.</p>' +
      '<p class="prompt" id="' + id + '-q"></p>' +
      '<div class="options" id="' + id + '-opts"></div>' +
      '<p class="feedback" id="' + id + '-fb" role="status" aria-live="polite"></p>' +
      '<p class="count" id="' + id + '-count"></p>';

    function draw() {
      const item = items[at];
      const opts = shuffle([item.a, ...item.wrong]);
      $(id + "-q").textContent = item.q;
      $(id + "-count").textContent = "Question " + (at + 1) + " of " + items.length;
      $(id + "-opts").innerHTML = opts.map((o) => '<button type="button" class="opt wide" data-a="' + esc(o) + '">' + esc(o) + "</button>").join("");
      $(id + "-opts").querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
        if (b.disabled) return;
        const ok = b.dataset.a === item.a;
        $(id + "-opts").querySelectorAll(".opt").forEach((x) => { x.disabled = true; if (x.dataset.a === item.a) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        if (ok) right += 1;
        $(id + "-fb").textContent = item.why;
        setTimeout(() => {
          at += 1;
          if (at < items.length) { $(id + "-fb").textContent = ""; draw(); }
          else {
            $(id + "-fb").textContent = right + " of " + items.length + " right.";
            $(id + "-opts").innerHTML = "";
            $(id + "-count").textContent = "";
            attempt(i, items.length, items.length, "questions");
            finish(i, "");
          }
        }, 2600);
      }));
    }
    draw();
  }

  /* ================= 6. say it out loud ============================== */
  function speaking(i, id, tasks) {
    const el = $(id);
    el.innerHTML =
      "<h2>Say it out loud</h2>" +
      '<p class="lead">Listen to the model. Say it yourself. Record, then listen back and check.</p>' +
      tasks.map((t, n) => '<div class="panel task">' +
        "<h3>" + esc(t.title) + "</h3>" +
        '<div class="actions">' + listenBtn(t.speech || t.instructions, "Listen") +
        '<button type="button" class="big small rec" data-n="' + n + '">&#9679; Record</button>' +
        '<button type="button" class="big small ghost play" data-n="' + n + '" disabled>&#9654; Play back</button></div>' +
        '<div class="reading">' + para(t.instructions) + "</div>" +
        '<label class="tick"><input type="checkbox" class="said" data-n="' + n + '"> I have said it and listened back</label>' +
        "</div>").join("");
    wireListen(el);

    /* One recorder for the page. A learner with no microphone still has the
       model and the checklist, so the tick is what finishes the step. */
    let media = null, chunks = [], activeBtn = null;
    const clips = {};
    el.querySelectorAll(".rec").forEach((b) => b.addEventListener("click", async () => {
      const n = b.dataset.n;
      if (media && media.state === "recording") { media.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        media = new MediaRecorder(stream);
        chunks = [];
        activeBtn = b;
        media.ondataavailable = (e) => chunks.push(e.data);
        media.onstop = () => {
          clips[n] = URL.createObjectURL(new Blob(chunks, { type: "audio/webm" }));
          stream.getTracks().forEach((t) => t.stop());
          b.textContent = "● Record again";
          el.querySelector('.play[data-n="' + n + '"]').disabled = false;
        };
        media.start();
        b.textContent = "■ Stop";
      } catch (_) {
        b.disabled = true;
        b.textContent = "No microphone";
      }
    }));
    el.querySelectorAll(".play").forEach((b) => b.addEventListener("click", () => {
      const url = clips[b.dataset.n];
      if (!url) return;
      try { VOICE.stop && VOICE.stop(); } catch (_) {}
      player.src = url;
      player.play();
    }));
    const ticks = [...el.querySelectorAll(".said")];
    ticks.forEach((t) => t.addEventListener("change", () => {
      const done = ticks.filter((x) => x.checked).length;
      attempt(i, done, ticks.length, "tasks");
      if (done === ticks.length) finish(i, "");
    }));
  }

  /* ================= 7. write it ==================================== */
  function writing(i, id, tasks) {
    const el = $(id);
    el.innerHTML =
      "<h2>Write it</h2>" +
      tasks.map((t, n) => '<div class="panel task">' +
        "<h3>" + esc(t.title) + "</h3>" +
        '<div class="reading">' + para(t.prompt) + "</div>" +
        (t.starter ? '<p class="starter">Start like this: ' + esc(t.starter) + "</p>" : "") +
        '<textarea class="write" rows="6" data-n="' + n + '" placeholder="Write here. Your writing stays on this device."></textarea>' +
        (t.criteria ? '<div class="criteria"><h4>Check your writing</h4>' + para(t.criteria) + "</div>" : "") +
        (t.support ? '<details class="drawer"><summary>If you are stuck</summary>' + para(t.support) + "</details>" : "") +
        (t.model ? '<details class="drawer"><summary>See one done</summary>' + para(t.model) + "</details>" : "") +
        (t.extension ? '<details class="drawer"><summary>Do more</summary>' + para(t.extension) + "</details>" : "") +
        '<label class="tick"><input type="checkbox" class="wrote" data-n="' + n + '"> I have written it and checked it</label>' +
        "</div>").join("");
    el.querySelectorAll("textarea.write").forEach((box) => {
      const saveKey = "ien-" + LESSON.level + "-" + LESSON.unit + "-w" + box.dataset.n;
      try { box.value = localStorage.getItem(saveKey) || ""; } catch (_) {}
      box.addEventListener("input", () => { try { localStorage.setItem(saveKey, box.value); } catch (_) {} });
    });
    const ticks = [...el.querySelectorAll(".wrote")];
    ticks.forEach((t) => t.addEventListener("change", () => {
      const done = ticks.filter((x) => x.checked).length;
      attempt(i, done, ticks.length, "tasks");
      if (done === ticks.length) finish(i, "");
    }));
  }

  /* ================= 8. practice ==================================== */
  function practice(i, id, items) {
    const el = $(id);
    el.innerHTML =
      "<h2>Practice</h2>" +
      '<p class="lead">Write your answers, then check yourself. The key says what a score means.</p>' +
      items.map((it, n) => '<div class="panel task">' +
        "<h3>" + esc(it.title) + "</h3>" +
        '<p class="pos">' + esc(it.type) + "</p>" +
        '<div class="reading">' + para(it.instructions) + "</div>" +
        '<textarea class="write" rows="5" data-n="' + n + '" placeholder="Write your answers here."></textarea>' +
        '<div class="actions"><button type="button" class="big small check" data-n="' + n + '">Check yourself</button></div>' +
        '<div class="answers" data-n="' + n + '" hidden>' + para(it.answers) + "</div>" +
        (it.solo ? '<p class="tip">' + esc(it.solo) + "</p>" : "") +
        "</div>").join("");
    el.querySelectorAll("textarea.write").forEach((box) => {
      const saveKey = "ien-" + LESSON.level + "-" + LESSON.unit + "-p" + box.dataset.n;
      try { box.value = localStorage.getItem(saveKey) || ""; } catch (_) {}
      box.addEventListener("input", () => { try { localStorage.setItem(saveKey, box.value); } catch (_) {} });
    });
    const revealed = new Set();
    el.querySelectorAll(".check").forEach((b) => b.addEventListener("click", () => {
      el.querySelector('.answers[data-n="' + b.dataset.n + '"]').hidden = false;
      revealed.add(b.dataset.n);
      attempt(i, revealed.size, items.length, "exercises");
      if (revealed.size === items.length) finish(i, "");
    }));
  }

  /* ================= 9. the quiz ==================================== */
  function quiz(i, id, items) {
    const el = $(id);
    let at = 0, right = 0;
    el.innerHTML =
      "<h2>Check what you know</h2>" +
      '<p class="lead">' + items.length + " questions. You can try again.</p>" +
      '<p class="prompt" id="' + id + '-q"></p>' +
      '<div class="options" id="' + id + '-opts"></div>' +
      '<p class="feedback" id="' + id + '-fb" role="status" aria-live="polite"></p>' +
      '<p class="count" id="' + id + '-count"></p>' +
      '<div class="actions" id="' + id + '-again" hidden><button type="button" class="big small ghost">Try again</button></div>';

    function draw() {
      const item = items[at];
      $(id + "-q").textContent = item.q;
      $(id + "-count").textContent = "Question " + (at + 1) + " of " + items.length + " · " + right + " right";
      $(id + "-opts").innerHTML = item.options.map((o) => '<button type="button" class="opt wide" data-a="' + esc(o) + '">' + esc(o) + "</button>").join("");
      $(id + "-opts").querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
        if (b.disabled) return;
        const ok = b.dataset.a === item.a;
        $(id + "-opts").querySelectorAll(".opt").forEach((x) => { x.disabled = true; if (x.dataset.a === item.a) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        if (ok) right += 1;
        $(id + "-fb").textContent = item.why;
        setTimeout(() => {
          at += 1;
          if (at < items.length) { $(id + "-fb").textContent = ""; draw(); }
          else {
            $(id + "-fb").textContent = "You scored " + right + " of " + items.length + ".";
            $(id + "-opts").innerHTML = "";
            $(id + "-count").textContent = "";
            $(id + "-again").hidden = false;
            if (window.__ehelScore) { try { window.__ehelScore(i, right, items.length); } catch (_) {} }
            attempt(i, items.length, items.length, "questions");
            finish(i, "");
          }
        }, 2600);
      }));
    }
    $(id + "-again").querySelector("button").addEventListener("click", () => {
      at = 0; right = 0; $(id + "-fb").textContent = ""; $(id + "-again").hidden = true; draw();
    });
    draw();
  }

  /* ================= 10. what you can do now ========================= */
  /* The lifted deck calls paintStickers() on the last slide. This course is
     for adults: the last slide is the unit's own can-do list, rated by the
     learner, and the assignment that carries the unit's evidence. */
  function paintStickers() {
    const el = $("summary");
    if (!el || el.dataset.painted) return;
    el.dataset.painted = "1";
    const a = LESSON.assignment;
    el.innerHTML =
      "<h2>What you can do now</h2>" +
      '<p class="lead">Mark each one honestly. It is for you: nobody else sees it.</p>' +
      '<div class="panel"><ul class="self">' +
      LESSON.self.map((s, n) => "<li><span>" + esc(s) + "</span>" +
        '<span class="scale">' + ["Not yet", "A little", "I can do this", "I could show someone else"]
          .map((label, k) => '<button type="button" class="rate" data-n="' + n + '" data-k="' + k + '">' + esc(label) + "</button>").join("") +
        "</span></li>").join("") +
      "</ul></div>" +
      (a ? '<div class="panel"><h3>' + esc(a.title) + "</h3>" +
        '<p class="pos">' + esc(a.submissionType) + " &middot; " + a.marks + " marks</p>" +
        '<div class="reading">' + para(a.instructions) + "</div>" +
        '<p class="tip">Marked on: ' + esc(a.criteria.join(", ")) + "</p></div>" : "") +
      '<p class="tip">Next: Unit ' + (LESSON.unit + 1) + ", or back to the level page.</p>";
    el.querySelectorAll(".rate").forEach((b) => b.addEventListener("click", () => {
      el.querySelectorAll('.rate[data-n="' + b.dataset.n + '"]').forEach((x) => x.classList.remove("chosen"));
      b.classList.add("chosen");
      try { localStorage.setItem("ien-" + LESSON.level + "-" + LESSON.unit + "-self" + b.dataset.n, b.dataset.k); } catch (_) {}
    }));
    try {
      LESSON.self.forEach((_, n) => {
        const k = localStorage.getItem("ien-" + LESSON.level + "-" + LESSON.unit + "-self" + n);
        if (k !== null) { const b = el.querySelector('.rate[data-n="' + n + '"][data-k="' + k + '"]'); if (b) b.classList.add("chosen"); }
      });
    } catch (_) {}
  }
