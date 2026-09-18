  /* ==================================================================
     THE INTENSIVE ENGLISH PROGRAM - lesson renderers.

     Loaded after ../../lesson-kit/lib/voice.js and deck.js, which are
     reused unchanged: the deck puts every step in the DOM at once and shows
     one, and the shared platform tools patch the deck's show() by its exact
     text, so it is wrapped here rather than edited.

     A lesson is: What this lesson is about, the Unit lecture, then five
     sections and Review & check (owner, 2026-09-18). STEPS and GROUPS are
     written by the builder; this file draws each step, the lesson menu
     (the path, grouped by section) and the toolbox.

     ADULT COURSE: no stickers and no cheering. A finished step shows a tick
     in the menu and nothing else.
     ================================================================== */

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const lines = (text) => String(text || "").split("\n").filter((l) => l.trim());
  const para = (text) => lines(text).map((l) => "<p>" + esc(l) + "</p>").join("");
  const KEY = "iep:" + LESSON.level + ":" + LESSON.lesson;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + ":" + k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + ":" + k, JSON.stringify(v)); } catch (_) { /* private mode: the lesson still works */ } },
  };

  /* ---- the voice ---------------------------------------------------------
     No clips are recorded for this program yet, so every line goes to the
     voice engine (lib/voice.js). When narration is bought, clipFor() is the
     one place that learns the media path. */
  const player = new Audio();
  player.preload = "none";
  function clipFor(text) { return LESSON.media ? LESSON.media + "/" + text : ""; }
  function playClip(text) {
    if (window.__ehelPainting) return;
    const url = LESSON.media ? clipFor(text) : "";
    if (!url) { say(text); return; }
    try { VOICE.stop && VOICE.stop(); } catch (_) { /* mid-sentence */ }
    player.src = url;
    const p = player.play();
    if (p && p.catch) p.catch(() => say(text));
  }
  /* A conversation as one utterance: a pause between speakers, and the second
     speaker a little lower, so a single device voice still sounds like two. */
  function dialogueSSML(rows) {
    const first = rows.length ? rows[0][0] : "";
    return rows.map(([who, text]) => '<prosody pitch="' + (who === first ? "+6%" : "-10%") + '">' + VOICE.esc(text) + "</prosody>")
      .join('<break time="650ms"/>');
  }
  const listenBtn = (text, label) =>
    '<button type="button" class="big small ghost listen" data-say="' + esc(text) + '">&#9654; ' + esc(label || "Listen") + "</button>";
  function wireListen(root) {
    root.querySelectorAll(".listen").forEach((b) => b.addEventListener("click", () => playClip(b.dataset.say)));
    root.querySelectorAll(".mini[data-say]").forEach((b) => b.addEventListener("click", () => playClip(b.dataset.say)));
  }
  const dialogueHTML = (rows) => '<ol class="dialogue">' + rows.map(([who, text]) =>
    '<li class="' + (who === "You" ? "you" : "") + '"><b>' + esc(who) + "</b><span>" + esc(text) + "</span></li>").join("") + "</ol>";

  /* ---- steps: where the learner is -------------------------------------- */
  const ONSHOW = [];
  const stepHead = (i) => {
    const s = STEPS[i], g = GROUPS[s.g];
    const inGroup = STEPS.filter((x) => x.g === s.g);
    const n = inGroup.indexOf(s) + 1;
    return '<p class="stepmeta">' + esc(g.name) + (inGroup.length > 1 ? " &middot; step " + n + " of " + inGroup.length : "") + "</p>";
  };
  const finishOnArrival = (i) => { ONSHOW[i] = () => finish(i, ""); };
  const attempt = (i, a, t, noun) => { if (window.__ehelAttempt) { try { window.__ehelAttempt(i, a, t, noun); } catch (_) {} } };

  /* ---- one question after another (conversation, texts, practice, quiz) ---
     An item is either {q, a, wrong[], why} or {q, options[], a, why, mode}.
     mode "type" keeps the options on screen as a word bank and asks the
     learner to write the answer. */
  function questions(i, el, items, o) {
    let at = 0, right = 0;
    const id = el.id;
    el.insertAdjacentHTML("beforeend",
      '<p class="prompt" id="' + id + '-q"></p><div class="options" id="' + id + '-opts"></div>' +
      '<p class="feedback" id="' + id + '-fb" role="status" aria-live="polite"></p><p class="count" id="' + id + '-count"></p>' +
      '<div class="actions" id="' + id + '-again" hidden><button type="button" class="big small ghost">Try again</button></div>');
    const same = (x, y) => { const t = (s) => String(s).trim().toLowerCase().replace(/[.!?,;:]+$/, "").replace(/\s+/g, " "); return t(x) === t(y); };
    function settle(ok) {
      if (ok) right += 1;
      $(id + "-fb").textContent = (ok ? "Yes. " : "") + (items[at].why || "");
      setTimeout(() => {
        at += 1;
        if (at < items.length) { $(id + "-fb").textContent = ""; draw(); return; }
        $(id + "-fb").textContent = "You got " + right + " of " + items.length + ".";
        $(id + "-opts").innerHTML = ""; $(id + "-q").textContent = ""; $(id + "-count").textContent = "";
        if (o && o.again) $(id + "-again").hidden = false;
        if (o && o.score && window.__ehelScore) { try { window.__ehelScore(i, right, items.length); } catch (_) {} }
        attempt(i, items.length, items.length, "questions");
        finish(i, "");
      }, 2300);
    }
    function draw() {
      const it = items[at];
      const opts = it.options ? it.options.slice() : shuffle([it.a].concat(it.wrong || []));
      $(id + "-q").textContent = it.q;
      $(id + "-count").textContent = "Question " + (at + 1) + " of " + items.length + (it.from && it.from !== "this lesson" ? " · from " + it.from : "");
      if (it.mode === "type") {
        $(id + "-opts").innerHTML = '<p class="bank-label">Write the missing word. The choices:</p><p class="bank">' +
          opts.map((x) => "<span>" + esc(x) + "</span>").join("") + '</p><div class="actions"><input type="text" class="typein" id="' + id + '-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer"><button type="button" class="big small" id="' + id + '-ok">Check</button></div>';
        const box = $(id + "-in");
        const go = () => {
          if (box.disabled) return;
          const ok = same(box.value, it.a);
          box.disabled = true; $(id + "-ok").disabled = true;
          box.classList.add(ok ? "right" : "wrong");
          if (!ok) box.value = (box.value.trim() ? box.value + "  →  " : "") + it.a;
          settle(ok);
        };
        $(id + "-ok").addEventListener("click", go);
        box.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
        return;
      }
      $(id + "-opts").innerHTML = opts.map((x) => '<button type="button" class="opt wide" data-a="' + esc(x) + '">' + esc(x) + "</button>").join("");
      $(id + "-opts").querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
        if (b.disabled) return;
        const ok = b.dataset.a === it.a;
        $(id + "-opts").querySelectorAll(".opt").forEach((x) => { x.disabled = true; if (x.dataset.a === it.a) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        settle(ok);
      }));
    }
    $(id + "-again").querySelector("button").addEventListener("click", () => { at = 0; right = 0; $(id + "-again").hidden = true; $(id + "-fb").textContent = ""; draw(); });
    draw();
  }

  /* a box whose text stays on this device */
  function keepText(box, k) {
    box.value = store.get("w:" + k, "");
    box.addEventListener("input", () => store.set("w:" + k, box.value));
  }

  /* a set of word cards, one at a time */
  function wordCards(i, el, set) {
    const words = set.items;
    let at = 0;
    const seen = new Set();
    el.insertAdjacentHTML("beforeend",
      '<div class="ien-word" id="' + el.id + '-card"></div><div class="actions">' +
      '<button type="button" class="big small ghost" id="' + el.id + '-prev">&#9664; Back</button>' +
      '<button type="button" class="big small" id="' + el.id + '-hear">&#9654; Hear it</button>' +
      '<button type="button" class="big small ghost" id="' + el.id + '-ex">Hear the sentence</button>' +
      '<button type="button" class="big" id="' + el.id + '-next">Next word &#9654;</button></div><p class="count" id="' + el.id + '-count"></p>');
    function draw(speak) {
      const w = words[at];
      seen.add(w.w);
      $(el.id + "-card").innerHTML = (w.pic ? '<span class="pic" aria-hidden="true">' + w.pic + "</span>" : "") +
        '<p class="pos">' + esc(w.pos) + "</p><h3>" + esc(w.w) + '</h3><p class="meaning">' + esc(w.meaning) + '</p><p class="example">' + esc(w.example) + "</p>";
      $(el.id + "-count").textContent = "Word " + (at + 1) + " of " + words.length;
      $(el.id + "-prev").disabled = at === 0;
      if (speak && cur === i) playClip(w.w);
      if (seen.size === words.length) { finish(i, ""); if (window.__ehelKnown) { try { window.__ehelKnown([...seen]); } catch (_) {} } }
    }
    $(el.id + "-hear").addEventListener("click", () => playClip(words[at].w));
    $(el.id + "-ex").addEventListener("click", () => playClip(words[at].example));
    $(el.id + "-next").addEventListener("click", () => { at = (at + 1) % words.length; draw(true); });
    $(el.id + "-prev").addEventListener("click", () => { at = Math.max(0, at - 1); draw(true); });
    draw(false);
  }

  function doneButton(i, el, label) {
    el.insertAdjacentHTML("beforeend", '<div class="actions"><button type="button" class="big" id="' + el.id + '-done">' + esc(label) + "</button></div>");
    $(el.id + "-done").addEventListener("click", () => { finish(i, ""); show(Math.min(cur + 1, slides.length - 1), true); });
  }

  const P = {};

  /* ================= Start ============================================= */
  P.about = function (i, id) {
    const el = $(id), a = LESSON.about;
    el.innerHTML = stepHead(i) + "<h2>What this lesson is about</h2>" +
      '<div class="actions">' + listenBtn(a.text, "Listen") + "</div>" +
      '<p class="lead">' + esc(a.text) + "</p>" +
      '<div class="panel"><h3>By the end of this lesson you can</h3><ul class="cando">' + a.goals.map((g) => "<li>" + esc(g) + "</li>").join("") + "</ul></div>" +
      '<p class="hint">This lesson takes ' + esc(LESSON.days) + " days at 2 hours a day, with the live class.</p>";
    wireListen(el);
    finishOnArrival(i);
  };

  P.lecture = function (i, id) {
    const el = $(id), ch = LESSON.unitLecture.chapters;
    const all = ch.map((c) => c.title + ". " + lines(c.text).join(" ")).join(" ");
    el.innerHTML = stepHead(i) + "<h2>Unit lecture</h2>" +
      '<p class="lead">Your teacher walks you through the whole lesson. Listen first, then read along.</p>' +
      '<div class="actions">' + listenBtn(all, "Listen to the whole lecture") + "</div>" +
      '<div class="chapters">' + ch.map((c, n) => '<div class="chapter"><span class="for">' + esc(LESSON.sectionNames[c.for] || "") + "</span><h3>" + (n + 1) + ". " + esc(c.title) + "</h3>" +
        '<div class="actions">' + listenBtn(lines(c.text).join(" "), "Listen") + "</div>" + para(c.text) + "</div>").join("") + "</div>";
    wireListen(el);
    doneButton(i, el, "I have listened");
  };

  /* ================= Section 1 · Listen & speak ======================== */
  P.warmup = function (i, id) {
    const el = $(id), w = LESSON.listen.warmup;
    el.innerHTML = stepHead(i) + "<h2>Warm-up</h2>" +
      (w.picture ? '<p class="pic" style="font-size:64px;margin:0" aria-hidden="true">' + w.picture + "</p>" : "") +
      '<p class="prompt">' + esc(w.prompt) + "</p>" +
      '<div class="options">' + w.choices.map((c) => '<button type="button" class="opt">' + esc(c) + "</button>").join("") + "</div>" +
      '<p class="feedback" id="' + id + '-fb" role="status" aria-live="polite"></p>';
    el.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      el.querySelectorAll(".opt").forEach((x) => x.classList.remove("right"));
      b.classList.add("right");
      $(id + "-fb").textContent = w.note;
      finish(i, "");
    }));
    ONSHOW[i] = () => { if (cur === i) say(w.prompt); };
  };

  P.conversation = function (i, id) {
    const el = $(id), c = LESSON.listen.conversation;
    el.innerHTML = stepHead(i) + "<h2>Listen: " + esc(c.title) + "</h2>" +
      '<p class="setting">' + esc(c.setting) + "</p>" +
      '<p class="lead">Listen first, without reading. Then answer the questions. Show the words when you want to check.</p>' +
      '<div class="actions"><button type="button" class="big small" id="' + id + '-play">&#9654; Listen to the conversation</button>' +
      '<button type="button" class="big small ghost" id="' + id + '-show" aria-expanded="false">Show the words</button></div>' +
      '<div id="' + id + '-words" hidden>' + dialogueHTML(c.lines) + "</div>";
    $(id + "-play").addEventListener("click", () => say(dialogueSSML(c.lines)));
    $(id + "-show").addEventListener("click", (e) => {
      const box = $(id + "-words");
      box.hidden = !box.hidden;
      e.currentTarget.setAttribute("aria-expanded", String(!box.hidden));
      e.currentTarget.textContent = box.hidden ? "Show the words" : "Hide the words";
    });
    questions(i, el, c.questions, { again: true });
  };

  P.phrases = function (i, id) {
    const el = $(id), ph = LESSON.listen.phrases;
    el.innerHTML = stepHead(i) + "<h2>Key phrases</h2>" +
      '<p class="lead">Listen to each phrase and say it. These are the phrases you will use most in this lesson.</p>' +
      '<ul class="phrases">' + ph.map((p) => '<li><span class="ph">' + esc(p.text) + '</span><button type="button" class="mini" data-say="' + esc(p.text) + '">&#9654; Listen</button><span class="use">' + esc(p.use) + "</span></li>").join("") + "</ul>";
    wireListen(el);
    doneButton(i, el, "I have said them all");
  };

  P.words = function (i, id, setKey) {
    const el = $(id), set = LESSON[setKey].words;
    el.innerHTML = stepHead(i) + "<h2>Words: " + esc(set.title) + "</h2>" +
      '<p class="lead">Tap Hear it. Say the word. Then hear the sentence and say it too.</p>';
    wordCards(i, el, set);
  };

  P.sound = function (i, id) {
    const el = $(id), s = LESSON.listen.sound;
    el.innerHTML = stepHead(i) + "<h2>Sound focus: " + esc(s.title) + "</h2>" +
      '<p class="lead">' + esc(s.explain) + "</p>" +
      '<ul class="phrases">' + s.groups.concat(s.lines).map((t) => '<li><span class="ph">' + esc(t) + '</span><button type="button" class="mini" data-say="' + esc(t.replace(/ · /g, ", ")) + '">&#9654; Listen</button></li>').join("") + "</ul>";
    wireListen(el);
    doneButton(i, el, "I have said them");
  };

  P.sayIt = function (i, id) {
    const el = $(id), s = LESSON.listen.sayIt;
    el.innerHTML = stepHead(i) + "<h2>Say it</h2>" +
      '<p class="lead">' + esc(s.instructions) + "</p>" +
      '<ul class="phrases">' + s.lines.map((t) => '<li><span class="ph">' + esc(t) + '</span><button type="button" class="mini" data-say="' + esc(t) + '">&#9654; Listen</button></li>').join("") + "</ul>" +
      '<div class="actions"><button type="button" class="big small" id="' + id + '-rec">&#9679; Record</button>' +
      '<button type="button" class="big small ghost" id="' + id + '-play" disabled>&#9654; Play back</button></div>' +
      '<label class="tick"><input type="checkbox" id="' + id + '-said"> I have said all the lines and listened back</label>';
    wireListen(el);
    let media = null, chunks = [], url = "";
    $(id + "-rec").addEventListener("click", async () => {
      const b = $(id + "-rec");
      if (media && media.state === "recording") { media.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        media = new MediaRecorder(stream); chunks = [];
        media.ondataavailable = (e) => chunks.push(e.data);
        media.onstop = () => { url = URL.createObjectURL(new Blob(chunks, { type: "audio/webm" })); stream.getTracks().forEach((t) => t.stop()); b.textContent = "● Record again"; $(id + "-play").disabled = false; };
        media.start(); b.textContent = "■ Stop";
      } catch (_) { b.disabled = true; b.textContent = "No microphone"; }
    });
    $(id + "-play").addEventListener("click", () => { if (!url) return; try { VOICE.stop && VOICE.stop(); } catch (_) {} player.src = url; player.play(); });
    $(id + "-said").addEventListener("change", (e) => { if (e.target.checked) finish(i, ""); });
  };

  /* ================= Section 2 · Grammar in use ======================== */
  P.spot = function (i, id) {
    const el = $(id), s = LESSON.grammar.spot;
    el.innerHTML = stepHead(i) + "<h2>Spot the pattern</h2>" +
      '<p class="lead">' + esc(s.instructions) + "</p>" +
      '<div class="examples">' + s.examples.map((x) => "<span>" + esc(x) + "</span>").join("") + "</div>" +
      '<p class="prompt">' + esc(s.question) + "</p>" +
      '<details class="drawer"><summary>Check your idea</summary><p>' + esc(s.answer) + "</p></details>";
    el.querySelector("details").addEventListener("toggle", () => finish(i, ""));
  };

  P.rules = function (i, id) {
    const el = $(id), rs = LESSON.grammar.rules;
    el.innerHTML = stepHead(i) + "<h2>The rule</h2>" +
      rs.map((r) => '<div class="rulecard"><h3>' + esc(r.title) + '</h3><div class="actions">' + listenBtn(r.title + ". " + r.rule.join(" "), "Listen") + "</div><ul>" +
        r.rule.map((l) => "<li>" + esc(l) + "</li>").join("") + "</ul>" + (r.mistake ? '<p class="mistake">' + esc(r.mistake) + "</p>" : "") + "</div>").join("");
    wireListen(el);
    finishOnArrival(i);
  };

  P.practice = function (i, id) {
    const el = $(id);
    el.innerHTML = stepHead(i) + "<h2>Practice</h2>" + '<p class="lead">Choose or write the answer. Read why after each one.</p>';
    questions(i, el, LESSON.grammar.practice, { again: true, score: true });
  };

  P.yourTurn = function (i, id) {
    const el = $(id), y = LESSON.grammar.yourTurn;
    el.innerHTML = stepHead(i) + "<h2>Your turn</h2>" +
      '<p class="lead">' + esc(y.prompt) + "</p>" +
      '<div class="examples">' + y.starters.map((s) => "<span>" + esc(s) + "</span>").join("") + "</div>" +
      '<textarea class="write" rows="5" id="' + id + '-box" placeholder="Write here, or say it out loud first. Your writing stays on this device."></textarea>' +
      '<details class="drawer"><summary>See an example answer</summary><p>' + esc(y.model) + "</p></details>";
    keepText($(id + "-box"), "yourTurn");
    doneButton(i, el, "I have done it");
  };

  /* ================= Section 3 · Read & write ========================== */
  const docHTML = (t) => '<p class="eyebrow">' + esc(t.type) + "</p><h3>" + esc(t.title) + "</h3>" +
    '<div class="reading' + (t.document ? " document" : "") + '">' + para(t.body) + "</div>";
  P.readGist = function (i, id) {
    const el = $(id), rw = LESSON.readWrite;
    el.innerHTML = stepHead(i) + "<h2>Read for the main idea</h2>" +
      '<p class="lead">Read it quickly first. Do not stop at words you do not know.</p>' + docHTML(rw.text);
    questions(i, el, rw.gist, {});
  };
  P.readDetail = function (i, id) {
    const el = $(id), rw = LESSON.readWrite;
    el.innerHTML = stepHead(i) + "<h2>Read for detail</h2>" +
      '<p class="lead">Now read slowly. The numbers are important.</p>' +
      '<details class="drawer" open><summary>' + esc(rw.text.title) + "</summary>" + docHTML(rw.text) + "</details>";
    questions(i, el, rw.detail, { again: true, score: true });
  };
  P.model = function (i, id) {
    const el = $(id), m = LESSON.readWrite.model;
    el.innerHTML = stepHead(i) + "<h2>Model: " + esc(m.title) + "</h2>" +
      '<p class="lead">Read the model. You will write one like it next.</p>' +
      '<div class="reading">' + para(m.body) + "</div>";
    finishOnArrival(i);
  };
  P.write = function (i, id) {
    const el = $(id), w = LESSON.readWrite.write;
    el.innerHTML = stepHead(i) + "<h2>Write</h2>" +
      '<p class="lead">' + esc(w.task) + "</p>" +
      '<textarea class="write" rows="6" id="' + id + '-box" placeholder="' + esc(w.starter) + '"></textarea>' +
      '<div class="criteria"><h4>Check your writing</h4><ul class="checklist">' +
      w.checklist.map((c, n) => '<li><label><input type="checkbox" data-n="' + n + '"><span>' + esc(c) + "</span></label></li>").join("") + "</ul></div>";
    keepText($(id + "-box"), "write");
    const ticks = [...el.querySelectorAll('input[type="checkbox"]')];
    ticks.forEach((t) => t.addEventListener("change", () => { if (ticks.every((x) => x.checked)) finish(i, ""); }));
  };

  /* ================= Section 4 · Real-life task ======================== */
  P.taskCard = function (i, id) {
    const el = $(id), c = LESSON.task.card;
    el.innerHTML = stepHead(i) + "<h2>Task card</h2>" +
      '<div class="taskcard"><h3>' + esc(c.title) + "</h3><p>" + esc(c.situation) + '</p><p><b>Your goal:</b> ' + esc(c.goal) + "</p></div>";
    finishOnArrival(i);
  };
  P.prepare = function (i, id) {
    const el = $(id), p = LESSON.task.prepare;
    el.innerHTML = stepHead(i) + "<h2>Prepare</h2>" +
      '<p class="lead">Listen to the phrases you will need and say them.</p>' +
      '<ul class="phrases">' + p.phrases.map((t) => '<li><span class="ph">' + esc(t) + '</span><button type="button" class="mini" data-say="' + esc(t) + '">&#9654; Listen</button></li>').join("") + "</ul>" +
      '<p class="lead">' + esc(p.notes) + "</p>" +
      '<textarea class="write" rows="4" id="' + id + '-box" placeholder="My notes"></textarea>';
    wireListen(el);
    keepText($(id + "-box"), "prepare");
    doneButton(i, el, "I am ready");
  };
  P.doIt = function (i, id) {
    const el = $(id), d = LESSON.task.doIt;
    el.innerHTML = stepHead(i) + "<h2>Do it</h2>" +
      '<div class="panel task"><h3>In the live class</h3><p>' + esc(d.liveClass) + "</p></div>" +
      '<div class="panel task"><h3>Or with Wehel</h3><p>Open Wehel and paste this, then do the task:</p><div class="reading">' + para(d.wehel) + "</div>" +
      '<div class="actions"><button type="button" class="big small ghost" id="' + id + '-copy">Copy the role-play</button></div></div>' +
      '<label class="tick"><input type="checkbox" id="' + id + '-did"> I have done the task</label>';
    $(id + "-copy").addEventListener("click", () => { try { navigator.clipboard.writeText(d.wehel); $(id + "-copy").textContent = "Copied"; } catch (_) { /* no clipboard */ } });
    $(id + "-did").addEventListener("change", (e) => { if (e.target.checked) finish(i, ""); });
  };
  P.compare = function (i, id) {
    const el = $(id), m = LESSON.task.model;
    el.innerHTML = stepHead(i) + "<h2>Compare with the model</h2>" +
      '<p class="lead">Listen to the model. Did you say the same things?</p>' +
      '<div class="actions"><button type="button" class="big small" id="' + id + '-play">&#9654; Listen: ' + esc(m.title) + "</button></div>" +
      dialogueHTML(m.lines) +
      '<div class="criteria"><h4>Check</h4><ul class="checklist">' + m.compare.map((c) => '<li><label><input type="checkbox"><span>' + esc(c) + "</span></label></li>").join("") + "</ul></div>";
    $(id + "-play").addEventListener("click", () => say(dialogueSSML(m.lines)));
    finishOnArrival(i);
  };
  function rateList(el, items, k) {
    el.insertAdjacentHTML("beforeend", '<div class="panel"><ul class="self">' + items.map((s, n) => "<li><span>" + esc(s) + '</span><span class="scale">' +
      ["Not yet", "A little", "I can do this", "I could show someone else"].map((label, r) => '<button type="button" class="rate" data-n="' + n + '" data-r="' + r + '">' + esc(label) + "</button>").join("") +
      "</span></li>").join("") + "</ul></div>");
    const saved = store.get(k, {});
    el.querySelectorAll(".rate").forEach((b) => {
      if (String(saved[b.dataset.n]) === b.dataset.r) b.classList.add("chosen");
      b.addEventListener("click", () => {
        el.querySelectorAll('.rate[data-n="' + b.dataset.n + '"]').forEach((x) => x.classList.remove("chosen"));
        b.classList.add("chosen");
        const now = store.get(k, {}); now[b.dataset.n] = Number(b.dataset.r); store.set(k, now);
      });
    });
  }
  P.canDo = function (i, id) {
    const el = $(id);
    el.innerHTML = stepHead(i) + "<h2>Can-do check</h2>" + '<p class="lead">Mark each one honestly. It is for you.</p>';
    rateList(el, LESSON.task.canDo, "self");
    doneButton(i, el, "Save and go on");
  };

  /* ================= Section 5 · Reading & comprehension =============== */
  P.before = function (i, id) {
    const el = $(id), r = LESSON.reading;
    el.innerHTML = stepHead(i) + "<h2>Before you read</h2>" + '<p class="prompt">' + esc(r.before) + "</p>" +
      '<textarea class="write" rows="3" id="' + id + '-box" placeholder="Your guess"></textarea>';
    keepText($(id + "-box"), "before");
    doneButton(i, el, "Now read");
  };
  P.book = function (i, id) {
    const el = $(id), r = LESSON.reading;
    el.innerHTML = stepHead(i) + "<h2>Read the book</h2>" +
      (r.placeholder
        ? '<div class="placeholder"><h3>Book to be provided</h3><p>' + esc(LESSON.readerSpec) + ".</p>" +
          '<p class="hint">Until the book arrives, read any short story or article at your level from the Library, or ask Wehel for one about this lesson\'s topic.</p></div>'
        : '<div class="reading">' + para(r.text) + "</div>");
    finishOnArrival(i);
  };
  P.bookQuestions = function (i, id) {
    const el = $(id), r = LESSON.reading;
    el.innerHTML = stepHead(i) + "<h2>Comprehension questions</h2>";
    if (r.placeholder || !r.questions) {
      el.insertAdjacentHTML("beforeend", '<div class="placeholder"><h3>Questions come with the book</h3><p>When the book arrives, its questions appear here: some about the main idea, some about details, and one about what you think.</p></div>');
      finishOnArrival(i);
    } else questions(i, el, r.questions, { again: true, score: true });
  };
  P.talk = function (i, id) {
    const el = $(id), r = LESSON.reading;
    el.innerHTML = stepHead(i) + "<h2>Talk or write about it</h2>" + '<p class="lead">' + esc(r.talk) + "</p>" +
      '<textarea class="write" rows="4" id="' + id + '-box" placeholder="Write here."></textarea>';
    keepText($(id + "-box"), "talk");
    doneButton(i, el, "I have done it");
  };

  /* ================= Review & check ==================================== */
  P.wordReview = function (i, id) {
    const el = $(id);
    const all = LESSON.listen.words.items.concat(LESSON.readWrite.words.items);
    let at = 0, turned = false;
    const order = shuffle(all);
    el.innerHTML = stepHead(i) + "<h2>Word review</h2>" +
      '<p class="lead">Look at the meaning. Say the word. Then turn the card.' +
      (LESSON.review.earlierLessons && LESSON.review.earlierLessons.length ? " Words from earlier lessons join this review as those lessons are built." : "") + "</p>" +
      '<div class="flash" id="' + id + '-card"></div><div class="actions">' +
      '<button type="button" class="big small ghost" id="' + id + '-turn">Turn the card</button>' +
      '<button type="button" class="big" id="' + id + '-next">Next &#9654;</button></div><p class="count" id="' + id + '-count"></p>';
    function draw() {
      const w = order[at];
      $(id + "-card").innerHTML = turned
        ? "<div>" + (w.pic ? '<div class="pic" aria-hidden="true">' + w.pic + "</div>" : "") + "<h3>" + esc(w.w) + '</h3><p class="meaning">' + esc(w.example) + "</p></div>"
        : '<div><p class="meaning">' + esc(w.meaning) + "</p></div>";
      $(id + "-count").textContent = "Card " + (at + 1) + " of " + order.length;
      if (at === order.length - 1 && turned) finish(i, "");
    }
    $(id + "-turn").addEventListener("click", () => { turned = !turned; draw(); if (turned) playClip(order[at].w); });
    $(id + "-next").addEventListener("click", () => { at = (at + 1) % order.length; turned = false; draw(); });
    draw();
  };
  P.quiz = function (i, id) {
    const el = $(id);
    el.innerHTML = stepHead(i) + "<h2>Quiz</h2>" + '<p class="lead">' + LESSON.review.quiz.length + " questions, most from this lesson and some from earlier ones. You can try again.</p>";
    questions(i, el, LESSON.review.quiz, { again: true, score: true });
  };
  /* The lifted deck calls paintStickers() on the last step. Here that step is
     "What I can do now": the lesson's can-do list, rated again. */
  function paintStickers() {
    const el = $("summary");
    if (!el || el.dataset.painted) return;
    el.dataset.painted = "1";
    el.innerHTML = stepHead(STEPS.length - 1) + "<h2>What I can do now</h2>" + '<p class="lead">Look at the list again. What has moved since the can-do check?</p>';
    rateList(el, LESSON.task.canDo, "self");
    el.insertAdjacentHTML("beforeend", '<p class="tip">Next: ' + esc(LESSON.next || "back to the level page") + '</p><div class="actions"><a class="big small ghost" style="display:inline-grid;place-items:center;text-decoration:none" href="' + esc(LESSON.hub) + '">Back to ' + esc(LESSON.levelShort) + "</a></div>");
    finish(STEPS.length - 1, "");
  }

  /* ================= the lesson menu ==================================== */
  function paintMenu() {
    const m = $("menu-path");
    if (!m) return;
    const groupNow = STEPS[cur] ? STEPS[cur].g : 0;
    m.innerHTML = GROUPS.map((g, gi) => {
      const idx = STEPS.map((s, k) => (s.g === gi ? k : -1)).filter((k) => k >= 0);
      const n = idx.filter((k) => done[k]).length;
      const open = gi === groupNow || m.dataset["open" + gi] === "1";
      return '<div class="pg-group' + (gi === groupNow ? " now" : "") + (n === idx.length ? " complete" : "") + '">' +
        '<button type="button" data-g="' + gi + '" aria-expanded="' + open + '"><span>' + esc(g.name) + '</span><span class="tally">' + (n === idx.length ? "&#10003; done" : n + " of " + idx.length) + "</span></button>" +
        (open ? '<ol class="pg-steps">' + idx.map((k) => '<li><button type="button" data-step="' + k + '"' + (k === cur ? ' aria-current="step"' : "") + '><span class="mark">' + (done[k] ? "&#10003;" : "") + "</span><span>" + esc(STEPS[k].t) + "</span></button></li>").join("") + "</ol>" : "") +
        "</div>";
    }).join("");
  }
  function openToolbox(tab) {
    const o = $("toolbox");
    o.hidden = false;
    selectTool(tab || TOOLS[0][0]);
    const b = o.querySelector('[data-tool="' + (tab || TOOLS[0][0]) + '"]');
    if (b) b.focus();
  }
  function closeToolbox() { $("toolbox").hidden = true; const b = $("toolbox-toggle"); if (b) b.focus(); }

  /* ================= the toolbox ======================================== */
  const wordRows = (items) => '<div class="wl">' + items.map((w) => "<div>" + (w.pic ? '<span aria-hidden="true">' + w.pic + "</span> " : "") + "<b>" + esc(w.w) + "</b> <small>" + esc(w.pos) + "</small><small>" + esc(w.meaning) + "</small><small>" + esc(w.example) + '</small><button type="button" class="mini" data-say="' + esc(w.w) + '">&#9654;</button></div>').join("") + "</div>";
  const answerRows = (items) => "<ol>" + items.map((q) => "<li>" + esc(q.q) + " <b>" + esc(q.a) + "</b>" + (q.why ? " <small>" + esc(q.why) + "</small>" : "") + "</li>").join("") + "</ol>";
  const TOOLS = [
    ["words", "Word list", () => "<h3>" + esc(LESSON.listen.words.title) + "</h3>" + wordRows(LESSON.listen.words.items) + "<h3>" + esc(LESSON.readWrite.words.title) + "</h3>" + wordRows(LESSON.readWrite.words.items)],
    ["phrases", "Phrasebook", () => '<ul class="phrases">' + LESSON.listen.phrases.map((p) => '<li><span class="ph">' + esc(p.text) + '</span><button type="button" class="mini" data-say="' + esc(p.text) + '">&#9654;</button><span class="use">' + esc(p.use) + "</span></li>").join("") +
      LESSON.task.prepare.phrases.map((p) => '<li><span class="ph">' + esc(p) + '</span><button type="button" class="mini" data-say="' + esc(p) + '">&#9654;</button><span class="use">For the task</span></li>').join("") + "</ul>"],
    ["grammar", "Grammar notes", () => LESSON.grammar.rules.map((r) => '<div class="rulecard"><h3>' + esc(r.title) + "</h3><ul>" + r.rule.map((l) => "<li>" + esc(l) + "</li>").join("") + "</ul>" + (r.mistake ? '<p class="mistake">' + esc(r.mistake) + "</p>" : "") + "</div>").join("")],
    ["lecture", "Unit lecture", () => LESSON.unitLecture.chapters.map((c, n) => "<h3>" + (n + 1) + ". " + esc(c.title) + '</h3><button type="button" class="mini" data-say="' + esc(lines(c.text).join(" ")) + '">&#9654; Listen</button>' + para(c.text)).join("")],
    ["transcripts", "Transcripts", () => "<h3>" + esc(LESSON.listen.conversation.title) + "</h3>" + dialogueHTML(LESSON.listen.conversation.lines) + "<h3>" + esc(LESSON.task.model.title) + "</h3>" + dialogueHTML(LESSON.task.model.lines)],
    ["answers", "Answers", () => "<p class=\"hint\">Try each exercise first, then check here.</p><h3>Conversation</h3>" + answerRows(LESSON.listen.conversation.questions) + "<h3>Grammar practice</h3>" + answerRows(LESSON.grammar.practice) +
      "<h3>Reading</h3>" + answerRows(LESSON.readWrite.gist.concat(LESSON.readWrite.detail)) + "<h3>Quiz</h3>" + answerRows(LESSON.review.quiz)],
    ["mywork", "My work", () => {
      const got = [["Your turn", "yourTurn"], ["Your note", "write"], ["Task notes", "prepare"], ["Before you read", "before"], ["About the book", "talk"]]
        .map(([t, k]) => [t, store.get("w:" + k, "")]).filter(([, v]) => String(v).trim());
      return got.length ? got.map(([t, v]) => "<h3>" + esc(t) + '</h3><div class="reading">' + para(v) + "</div>").join("") + '<p class="hint">Your writing is saved on this device only.</p>'
        : '<p class="hint">Nothing yet. What you write in this lesson appears here.</p>';
    }],
    ["library", "Library", () => '<div class="placeholder"><h3>Books for ' + esc(LESSON.levelShort) + '</h3><p>The books for this level are being prepared. Each lesson will have one; the Library will also hold extra books to read for pleasure.</p></div>'],
    ["wehel", "Wehel tutor", () => "<p>Wehel is your AI tutor. You can talk or write to it at any time.</p><h3>Role-play for this lesson</h3><div class=\"reading\">" + para(LESSON.task.doIt.wehel) + "</div>"],
    ["plan", "Lesson plan", () => "<h3>Your days for this lesson</h3><ol>" + LESSON.dayPlan.map((d) => "<li>" + esc(d) + "</li>").join("") + "</ol>" +
      (LESSON.teacher ? "<h3>In the live class</h3><ul>" + LESSON.teacher.map((d) => "<li>" + esc(d) + "</li>").join("") + "</ul>" : "")],
  ];
  function selectTool(key) {
    const t = TOOLS.find((x) => x[0] === key) || TOOLS[0];
    document.querySelectorAll("#toolbox [data-tool]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tool === t[0])));
    const body = $("toolbox-body");
    body.innerHTML = t[2]();
    body.querySelectorAll(".mini[data-say]").forEach((b) => b.addEventListener("click", () => playClip(b.dataset.say)));
  }

  /* ================= wiring ============================================== */
  (function wire() {
    /* the menu and the toolbox lists */
    const tb = $("menu-tools");
    if (tb) tb.innerHTML = "<ul>" + TOOLS.map((t) => '<li><button type="button" data-open-tool="' + t[0] + '">' + esc(t[1]) + "</button></li>").join("") + "</ul>";
    $("toolbox-tabs").innerHTML = TOOLS.map((t) => '<button type="button" role="tab" data-tool="' + t[0] + '">' + esc(t[1]) + "</button>").join("");
    $("toolbox-tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tool]"); if (b) selectTool(b.dataset.tool); });
    document.addEventListener("click", (e) => {
      const ot = e.target.closest("[data-open-tool]");
      if (ot) openToolbox(ot.dataset.openTool);
    });
    $("toolbox-toggle").addEventListener("click", () => openToolbox());
    $("toolbox-close").addEventListener("click", closeToolbox);
    $("toolbox").addEventListener("click", (e) => { if (e.target.id === "toolbox") closeToolbox(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("toolbox").hidden) closeToolbox(); });
    const mt = $("menu-toggle");
    mt.addEventListener("click", () => {
      const m = $("menu"); const open = !m.classList.contains("open");
      m.classList.toggle("open", open); mt.setAttribute("aria-expanded", String(open));
    });
    $("menu-path").addEventListener("click", (e) => {
      const s = e.target.closest("[data-step]");
      if (s) { show(Number(s.dataset.step), true); if (window.innerWidth < 1100) { $("menu").classList.remove("open"); mt.setAttribute("aria-expanded", "false"); } return; }
      const g = e.target.closest("[data-g]");
      if (g) { const m = $("menu-path"); m.dataset["open" + g.dataset.g] = m.dataset["open" + g.dataset.g] === "1" ? "" : "1"; paintMenu(); }
    });
  })();

  /* show() and finish() come from the lifted deck. They are wrapped, never
     edited: progress is remembered here, and the menu repainted. */
  const showDeck = show;
  show = function (i, speak) {
    showDeck(i, speak);
    const s = STEPS[cur];
    if (s) $("where").textContent = GROUPS[s.g].name + " · " + s.t;
    const f = ONSHOW[cur];
    if (f) { try { f(); } catch (_) { /* a step must never break the deck */ } }
    try { localStorage.setItem("iep:" + LESSON.level + ":last", JSON.stringify({ lesson: LESSON.lesson, title: LESSON.title, file: LESSON.file, step: cur, stepTitle: s ? s.t : "" })); } catch (_) {}
    paintMenu();
  };
  const finishDeck = finish;
  finish = function (i, msg) {
    finishDeck(i, msg);
    store.set("done", done.map((d, k) => (d ? k : -1)).filter((k) => k >= 0));
    paintMenu();
  };
  store.get("done", []).forEach((k) => { if (k < done.length) done[k] = true; });
