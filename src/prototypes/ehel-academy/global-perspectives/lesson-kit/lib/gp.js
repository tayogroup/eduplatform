  /* ==================================================================
     THE GLOBAL PERSPECTIVES ACTIVITIES

     The Mathematics build's own rounds are one function per idea, each
     drawing into one slide's ids and calling finish(i) when the child has
     done the thing. These are the same shape, and there are sixteen of
     them rather than one generic renderer for the reason there are
     eighteen in Computing: a step is a KIND of doing, and a renderer that
     covers every kind covers none of them well.

     What is Global-Perspectives-shaped about them is that the child DOES
     the skill on real people and real sources rather than being told
     about it. A question is BUILT from a question word and an ending and
     read back (1Rq.01); a picture is READ by finding the things in it
     (1Ri.01); six classmates are ASKED and their answers recorded into a
     pictogram that fills as they answer (1Rc.01, 1Rf.01); an answer is
     relevant because it is ABOUT the question, decided by a topic tag the
     builder and the gate both compute, never by an authored "ok" (1Mi.01,
     1Ml.01, 1Ap.01); an action is a solution because its EFFECT is what
     the issue needs (1As.01); sharing lets both children finish or it
     does not, by arithmetic (1Cc.01); and the reflection steps read the
     child's OWN record - what they chose in the team step, what this
     lesson's own about lines say - rather than an authored claim about
     what they learned (1Fc.01, 1Ft.01, 1Fv.01, 1Fl.01). Where the child's
     own opinion is the answer (1Ea.01), the page marks nothing and reads
     the opinion back; only the REASON has to be about the topic.

     Sound is synthesised, not recorded, exactly as in Science and
     Computing. The voice engine speaks everything else, exactly as in
     Mathematics.
     ================================================================== */

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  /* an emoji, or an inline SVG string, as stage-sized picture markup */
  const picHtml = (p, cls) => {
    if (!p) return "";
    const s = String(p).trim();
    return '<div class="' + (cls || "pic") + '" aria-hidden="true">' + (s.startsWith("<svg") ? s : esc(s)) + "</div>";
  };
  const small = (p) => { const s = String(p || "").trim(); return s.startsWith("<svg") ? s : esc(s); };
  /* lower-case a sentence's first letter to run it on after "I know that",
     "Now I think", "Look for the part that tells us"; but never "I", an
     acronym, a title, a weekday or one of the course's names */
  const KEEP_CAP = /^(?:I|I'm|I've|I'd|I'll|[A-Z]{2,}|Mr|Mrs|Miss|Ms|Dr|Teacher|Grandma|Grandpa|Amal|Sami|Nora|Omar|Hana|Tariq|Leo|Yusuf|Dana|Riverside|Greenway|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Saturdays|Sundays)(?![a-z])/;
  const lower1 = (s) => { s = String(s || ""); return !s || KEEP_CAP.test(s) ? s : s[0].toLowerCase() + s.slice(1); };
  /* an about line speaks to the child ("make your own questions"); read back
     as the child's own words ("I learned to...") it must say my, I, me */
  const mine = (s) => String(s || "")
    .replace(/\bboth of you\b/gi, "both of us")
    .replace(/\b(to|help|helps|helped) you\b/gi, "$1 me")
    .replace(/\byourself\b/gi, "myself")
    .replace(/\byours\b/gi, (m) => (m[0] === "Y" ? "Mine" : "mine"))
    .replace(/\byour\b/gi, (m) => (m[0] === "Y" ? "My" : "my"))
    .replace(/\byou\b/gi, "I");
  const noDot = (s) => String(s || "").replace(/[.!]\s*$/, "");

  /* ---- a step may speak only while it is the step on screen ------------
     Every renderer draws once, at load, because the deck paints all its
     slides and hides them with CSS. ONSHOW gives a step a line to say when
     the learner actually arrives; sayHere() refuses to speak for a slide
     that is not the one showing (the deck's own finish() keeps the same
     rule). show() is wrapped, not edited: it is lifted verbatim and the
     shared pipeline patches it by matching its exact text. */
  const ONSHOW = [];
  /* ONLEAVE: a step that ticks itself off does so when the learner moves ON
     from it (or, for Our world, on arrival), never while the page is being
     drawn. Drawing happens before the platform's progress module loads - a
     module script runs after the page is parsed - so a tick made then
     reached the dots and never the school's record. Two things followed,
     both measured on the live Grade 1 pages by the 2026-09-11 validation: a
     lesson finished to the last sticker was never reported complete, because
     two of its steps were never reported at all; and a reopened lesson never
     jumped back to where the learner was, because the restore hook reads
     "step 1 is already done" as "the learner has already started". */
  const ONLEAVE = [];
  const showWithoutHooks = show;
  show = function (i, speak) {
    const was = cur;
    showWithoutHooks(i, speak);
    if (was !== cur && ONLEAVE[was]) { const g = ONLEAVE[was]; ONLEAVE[was] = null; try { g(); } catch (_) { /* a step must never break the deck */ } }
    const f = ONSHOW[cur];
    if (f) { try { f(); } catch (_) { /* a step must never break the deck */ } }
  };
  function sayHere(idx, text) { if (cur === idx && text) say(text); }
  function afterVoice(fn) {
    let waited = 0;
    const t = setInterval(() => {
      waited += 200;
      if (!VOICE.speaking() || waited > 12000) { clearInterval(t); fn(); }
    }, 200);
  }
  /* one multiple-choice question drawn into the slide's own choices row;
     used by several renderers for the question that ends a step. `okOf`
     decides which option is right, so a renderer can key by a computed
     relationship (a spot in the picture, a tag) rather than by a flag. */
  function askOnce(o, spec, onDone, okOf) {
    const el = o.el;
    const isOk = okOf || ((c) => !!c.ok);
    let lock = false;
    $(el.ask).innerHTML = spec.ask;
    $(el.ch).className = "choices stack";
    $(el.ch).innerHTML = shuffle(spec.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (isOk(c) ? 1 : 0) + '">' + (c.pic ? '<span class="cpic" aria-hidden="true">' + small(c.pic) + "</span> " : "") + esc(c.t) + "</button>").join("");
    sayHere(o.finish, plain(spec.ask));
    const handler = (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const ok = b.dataset.ok === "1";
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      $(el.fb).className = "fb " + (ok ? "good" : "bad");
      $(el.fb).textContent = (ok ? cheer() + " " : "") + spec.why;
      say((ok ? cheer() + " " : "") + spec.why);
      $(el.ch).removeEventListener("click", handler);
      setTimeout(() => onDone(ok), 2600);
    };
    $(el.ch).addEventListener("click", handler);
  }
  function endStep(o, line) {
    const el = o.el;
    $(el.ch).innerHTML = ""; $(el.ch).className = "choices";
    $(el.score).textContent = "";
    $(el.fb).className = "fb good"; $(el.fb).textContent = line || o.done;
    finish(o.finish, line || o.done);
  }
  /* a line the page has just composed for the child, drawn big and read aloud */
  function sayLine(el, html, text) {
    $(el.fb).className = "fb good"; $(el.fb).innerHTML = html;
    say(text);
  }

  /* ==================================================================
     SOUND - a very small synthesiser, the Science kit's own with a bank
     for this subject: a pop for a card, a ding for a good answer, a
     fanfare for a shared outcome, a burst of chatter for a classroom.
     The context is created on the first tap, because browsers refuse
     audio that nobody asked for.
     ================================================================== */
  const SOUND = (function () {
    let ctx = null;
    function ac() {
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { ctx = null; } }
      if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (_) { /* ignore */ } }
      return ctx;
    }
    function env(node, t0, a, peak, d) {
      node.gain.setValueAtTime(0.0001, t0);
      node.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t0 + a);
      node.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    }
    function osc(c, type, f0, f1, t0, dur, peak, master) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t0);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      env(g, t0, 0.01, peak, dur);
      o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function noise(c, t0, dur, peak, master, hp) {
      const n = c.sampleRate * dur, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type = hp ? "highpass" : "lowpass"; f.frequency.value = hp || 900;
      const g = c.createGain(); env(g, t0, 0.005, peak, dur);
      src.connect(f).connect(g).connect(master); src.start(t0);
    }
    const BANK = {
      click: (c, t, m) => { noise(c, t, 0.03, 0.5, m, 2000); },
      pop: (c, t, m) => { osc(c, "sine", 600, 900, t, 0.09, 0.4, m); },
      ding: (c, t, m) => { osc(c, "sine", 1046, 0, t, 0.6, 0.35, m); },
      beep: (c, t, m) => { osc(c, "sine", 880, 0, t, 0.12, 0.35, m); },
      boing: (c, t, m) => { osc(c, "sine", 200, 500, t, 0.3, 0.4, m); },
      thud: (c, t, m) => { osc(c, "sine", 90, 40, t, 0.25, 0.7, m); },
      buzz: (c, t, m) => { osc(c, "sawtooth", 110, 95, t, 0.7, 0.35, m); },
      error: (c, t, m) => { osc(c, "sawtooth", 220, 120, t, 0.35, 0.3, m); },
      tada: (c, t, m) => { osc(c, "sine", 523, 0, t, 0.25, 0.35, m); osc(c, "sine", 659, 0, t + 0.16, 0.25, 0.35, m); osc(c, "sine", 784, 0, t + 0.32, 0.5, 0.4, m); },
      send: (c, t, m) => { osc(c, "sine", 500, 1300, t, 0.3, 0.3, m); },
      ring: (c, t, m) => { osc(c, "sine", 880, 0, t, 1.0, 0.4, m); osc(c, "sine", 1320, 0, t, 0.7, 0.2, m); },
      whoosh: (c, t, m) => { noise(c, t, 0.3, 0.3, m); },
      bell: (c, t, m) => { osc(c, "sine", 880, 0, t, 1.4, 0.5, m); osc(c, "sine", 1320, 0, t, 1.0, 0.25, m); },
      splash: (c, t, m) => { noise(c, t, 0.25, 0.5, m); osc(c, "sine", 400, 150, t, 0.25, 0.2, m); },
      chatter: (c, t, m) => { for (let k = 0; k < 5; k++) osc(c, "triangle", 300 + k * 70, 260 + k * 60, t + k * 0.09, 0.08, 0.18, m); },
      grow: (c, t, m) => { osc(c, "sine", 300, 900, t, 0.5, 0.3, m); },
      knock: (c, t, m) => { noise(c, t, 0.05, 0.6, m); noise(c, t + 0.16, 0.05, 0.6, m); },
      drip: (c, t, m) => { osc(c, "sine", 900, 400, t, 0.15, 0.3, m); },
    };
    function play(name, gain) {
      const c = ac(); if (!c || !BANK[name]) return false;
      const m = c.createGain(); m.gain.value = Math.max(0.0001, Math.min(1, gain == null ? 1 : gain));
      m.connect(c.destination);
      BANK[name](c, c.currentTime + 0.01, m);
      return true;
    }
    return { play, has: (n) => !!BANK[n] };
  })();

  /* ==================================================================
     SCENES - the pictures the sources are read from, and the shared
     outcomes a team builds. A picture scene is a BACKGROUND: the things
     to find in it come from the content (spots with a place, a glyph and
     a fact), so one background can carry several lessons' sources. A
     team scene is a function of how many rounds have been played well,
     so the garden grows AS the team works, never before.
     ================================================================== */
  const T = (x, y, size, glyph) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + size + '">' + glyph + "</text>";
  const LABEL = (x, y, t) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="#fff" font-size="15" font-family="Inter, sans-serif" font-weight="800">' + esc(t) + "</text>";
  const SKY = (h, col) => '<rect width="320" height="' + h + '" fill="' + (col || "#BFE3F5") + '"/>';
  const GROUND = (y, col) => '<rect x="0" y="' + y + '" width="320" height="' + (240 - y) + '" fill="' + (col || "#3E8E4A") + '"/>';
  const SCENES = {
    /* a market street: stalls with awnings, a road */
    market: { w: 320, h: 240, label: "A busy market", bg: SKY(240) + GROUND(170, "#C9B79C") +
      '<rect x="14" y="80" width="90" height="90" rx="6" fill="#E9744F"/><path d="M8 80 h102 l-8 -22 h-86z" fill="#F4C95D"/>' +
      '<rect x="120" y="86" width="84" height="84" rx="6" fill="#35BFB2"/><path d="M114 86 h96 l-8 -22 h-80z" fill="#F0806F"/>' +
      '<rect x="220" y="80" width="90" height="90" rx="6" fill="#B78BD1"/><path d="M214 80 h102 l-8 -22 h-86z" fill="#4FD1A0"/>' +
      '<rect x="0" y="206" width="320" height="34" fill="#93AABE"/>' },
    /* a vet's room: a table, a window, a shelf */
    vet: { w: 320, h: 240, label: "The vet's room", bg: SKY(240, "#EAF4FA") +
      '<rect x="0" y="180" width="320" height="60" fill="#D6E3DE"/><rect x="30" y="30" width="90" height="70" rx="8" fill="#BFE3F5" stroke="#93AABE" stroke-width="4"/>' +
      '<rect x="150" y="40" width="150" height="14" rx="4" fill="#A9552B"/><rect x="150" y="90" width="150" height="14" rx="4" fill="#A9552B"/>' +
      '<rect x="60" y="130" width="200" height="16" rx="6" fill="#93AABE"/><rect x="70" y="146" width="12" height="40" fill="#93AABE"/><rect x="238" y="146" width="12" height="40" fill="#93AABE"/>' },
    /* a park: grass, a path, trees */
    park: { w: 320, h: 240, label: "The park", bg: SKY(240) + GROUND(120) +
      '<path d="M0 220 q160 -60 320 -10 v30 h-320z" fill="#C9B79C"/><ellipse cx="200" cy="204" rx="58" ry="20" fill="#7CC4E8"/><circle cx="270" cy="44" r="24" fill="#F4C95D"/>' +
      '<rect x="40" y="90" width="14" height="60" fill="#8B5A2B"/><circle cx="47" cy="80" r="34" fill="#2F8F45"/>' +
      '<rect x="260" y="100" width="14" height="50" fill="#8B5A2B"/><circle cx="267" cy="92" r="30" fill="#4CB65C"/>' },
    /* a kitchen: a worktop, a window, a cooker */
    kitchen: { w: 320, h: 240, label: "A kitchen", bg: SKY(240, "#F4EAD4") +
      '<rect x="0" y="150" width="320" height="90" fill="#D9A15A"/><rect x="0" y="140" width="320" height="14" fill="#A9552B"/>' +
      '<rect x="120" y="30" width="80" height="70" rx="8" fill="#BFE3F5" stroke="#93AABE" stroke-width="4"/>' +
      '<rect x="20" y="40" width="80" height="12" rx="4" fill="#8B5A2B"/><rect x="220" y="40" width="80" height="12" rx="4" fill="#8B5A2B"/>' },
    /* a classroom: a board, a window, desks */
    classroom: { w: 320, h: 240, label: "Our classroom", bg: SKY(240, "#F7F1E3") +
      '<rect x="0" y="180" width="320" height="60" fill="#C9B79C"/><rect x="30" y="30" width="130" height="80" rx="6" fill="#2B5673"/><rect x="24" y="24" width="142" height="92" rx="8" fill="none" stroke="#8B5A2B" stroke-width="6"/>' +
      '<rect x="200" y="30" width="90" height="70" rx="8" fill="#BFE3F5" stroke="#93AABE" stroke-width="4"/>' +
      '<rect x="30" y="150" width="90" height="12" rx="4" fill="#A9552B"/><rect x="190" y="150" width="90" height="12" rx="4" fill="#A9552B"/>' },
    /* a street: pavements, a road, a zebra crossing, houses */
    street: { w: 320, h: 240, label: "Our street", bg: SKY(240) +
      '<rect x="0" y="160" width="320" height="80" fill="#5C6B73"/><rect x="0" y="150" width="320" height="12" fill="#93AABE"/>' +
      '<g fill="#fff"><rect x="120" y="164" width="14" height="70"/><rect x="150" y="164" width="14" height="70"/><rect x="180" y="164" width="14" height="70"/></g>' +
      '<rect x="20" y="80" width="80" height="70" fill="#E9744F"/><path d="M14 80 h92 l-46 -34z" fill="#7A2E2E"/><rect x="230" y="70" width="80" height="80" fill="#F4C95D"/><path d="M224 70 h92 l-46 -34z" fill="#A9552B"/>' },
    /* a living room: a sofa, a window, a rug */
    home: { w: 320, h: 240, label: "At home", bg: SKY(240, "#F4EAD4") +
      '<rect x="0" y="170" width="320" height="70" fill="#C9B79C"/><ellipse cx="160" cy="215" rx="110" ry="18" fill="#B78BD1"/>' +
      '<rect x="30" y="30" width="90" height="70" rx="8" fill="#BFE3F5" stroke="#93AABE" stroke-width="4"/>' +
      '<rect x="170" y="110" width="130" height="60" rx="14" fill="#35BFB2"/><rect x="160" y="130" width="150" height="40" rx="12" fill="#2B8F86"/>' },
    /* a playground: a slide, a climbing frame, a bench */
    playground: { w: 320, h: 240, label: "The playground", bg: SKY(240) + GROUND(140, "#C9B79C") +
      '<circle cx="50" cy="44" r="22" fill="#F4C95D"/><path d="M40 140 l60 -70 h14 l-60 70z" fill="#E9744F"/><rect x="100" y="70" width="8" height="70" fill="#93AABE"/>' +
      '<g stroke="#35BFB2" stroke-width="8" fill="none"><path d="M200 140 v-70 h80 v70"/><path d="M200 105 h80"/></g>' },
    /* a garden that grows as the team works: 0 bare, 1 dug, 2 seeds, 3 watered, 4 sprouts, 5 flowers */
    garden: (n) => {
      n = Math.max(0, Math.min(6, Number(n) || 0));
      let g = SKY(240) + GROUND(150) + '<circle cx="270" cy="44" r="24" fill="#F4C95D"/>';
      if (n >= 1) g += '<rect x="40" y="160" width="240" height="60" rx="10" fill="#6B4A2B"/>';
      if (n >= 1) for (let k = 0; k < 4; k++) g += '<ellipse cx="' + (80 + k * 54) + '" cy="190" rx="18" ry="8" fill="#4A3320"/>';
      if (n >= 2) for (let k = 0; k < 4; k++) g += '<ellipse cx="' + (80 + k * 54) + '" cy="190" rx="5" ry="3" fill="#C7A76B"/>';
      if (n >= 3) g += T(250, 130, 30, "\u{1F4A7}") + '<g fill="#6E9DE8" opacity="0.7"><circle cx="90" cy="176" r="3"/><circle cx="150" cy="180" r="3"/><circle cx="200" cy="174" r="3"/></g>';
      if (n >= 4) for (let k = 0; k < 4; k++) g += '<rect x="' + (78 + k * 54) + '" y="164" width="4" height="26" rx="2" fill="#2F8F45"/><path d="M' + (80 + k * 54) + ' 172 q-14 -8 -16 -22 q14 2 16 22z" fill="#4CB65C"/>';
      if (n >= 5) for (let k = 0; k < 4; k++) g += T(80 + k * 54, 158, 26, ["\u{1F33B}", "\u{1F337}", "\u{1F33A}", "\u{1F33C}"][k]);
      if (n >= 6) g += T(160, 60, 30, "\u{1F41D}") + T(60, 80, 26, "\u{1F98B}");
      const labels = ["A bare patch of ground", "The ground is dug", "The seeds are in", "The seeds are watered", "Green shoots", "Flowers!", "Flowers, and the bees have found them"];
      return '<svg viewBox="0 0 320 240" role="img" aria-label="' + labels[n] + '">' + g + LABEL(160, 232, labels[n]) + "</svg>";
    },
    /* a class mural that fills as the team works: 0 blank wall, 1 sky, 2 hills, 3 sun, 4 houses, 5 people, 6 finished */
    mural: (n) => {
      n = Math.max(0, Math.min(6, Number(n) || 0));
      let g = '<rect width="320" height="240" fill="#D6E3DE"/><rect x="20" y="20" width="280" height="190" rx="6" fill="#fff" stroke="#8B5A2B" stroke-width="8"/>';
      if (n >= 1) g += '<rect x="24" y="24" width="272" height="110" fill="#BFE3F5"/>';
      if (n >= 2) g += '<path d="M24 150 q70 -60 140 -10 q70 -50 132 10 v56 h-272z" fill="#4CB65C"/>';
      if (n >= 3) g += '<circle cx="250" cy="60" r="22" fill="#F4C95D"/>';
      if (n >= 4) g += '<rect x="70" y="130" width="40" height="40" fill="#E9744F"/><path d="M64 130 h52 l-26 -22z" fill="#7A2E2E"/><rect x="180" y="140" width="34" height="30" fill="#F4C95D"/><path d="M174 140 h46 l-23 -18z" fill="#A9552B"/>';
      if (n >= 5) g += T(140, 185, 26, "\u{1F9D2}") + T(160, 185, 26, "\u{1F467}") + T(120, 185, 26, "\u{1F466}");
      if (n >= 6) g += T(60, 70, 24, "\u{1F426}") + T(100, 50, 24, "\u{1F426}") + T(220, 100, 20, "\u{1F308}");
      const labels = ["A blank wall", "The sky is painted", "The hills are painted", "The sun is up", "Two houses", "People in the picture", "The mural is finished"];
      return '<svg viewBox="0 0 320 240" role="img" aria-label="' + labels[n] + '">' + g + LABEL(160, 232, labels[n]) + "</svg>";
    },
  };
  /* a picture scene with its spots drawn on it, the found ones haloed */
  function sceneSvg(name, spots, found, active) {
    const sc = SCENES[name];
    let g = sc.bg;
    spots.forEach((sp) => {
      const on = found.has(sp.id), now = active === sp.id;
      g += '<g class="spot' + (on ? " found" : "") + (now ? " now" : "") + '" data-spot="' + esc(sp.id) + '" tabindex="0" role="button" aria-label="' + esc(sp.label) + (on ? ", found" : "") + '" transform="translate(' + sp.x + " " + sp.y + ')">' +
        '<circle r="' + ((sp.size || 34) * 0.8) + '" fill="' + (now ? "#F4C95D" : on ? "#35BFB2" : "rgba(255,255,255,0.55)") + '" stroke="' + (on || now ? "#fff" : "#2B5673") + '" stroke-width="3"/>' +
        T(0, (sp.size || 34) * 0.36, sp.size || 34, sp.glyph) + (on ? '<circle cx="18" cy="-18" r="9" fill="#4FD1A0"/><text x="18" y="-14" text-anchor="middle" font-size="12" fill="#06231F" font-weight="800">✓</text>' : "") + "</g>";
    });
    return '<svg viewBox="0 0 ' + sc.w + " " + sc.h + '" class="picsource" role="img" aria-label="' + esc(sc.label) + '">' + g + "</svg>";
  }

  /* ==================================================================
     RENDERERS shared with the Science and Computing kits, in spirit:
     tap cards, sorting, putting in order, a demonstration.
     ================================================================== */

  /* ---- tap cards: hear each one, then (maybe) one question ---------- */
  function tapCards(o) {
    const el = o.el, heard = new Set();
    const need = Math.min(o.need || o.items.length, o.items.length);
    let asked = false, lock = false;
    $(el.stage).innerHTML = '<div class="stagewide"><div class="cardsgrid">' + o.items.map((it, k) =>
      '<button type="button" class="tapcard" data-k="' + k + '"><span class="cpic" aria-hidden="true">' + small(it.pic) + "</span>" + esc(it.label) + (it.sub ? "<small>" + esc(it.sub) + "</small>" : "") + "</button>").join("") + "</div></div>";
    $(el.score).textContent = "Tap " + need + " to hear about them";
    function question() {
      asked = true;
      $(el.ask).innerHTML = o.then.ask;
      say(plain(o.then.ask));
      $(el.ch).innerHTML = shuffle(o.then.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      $(el.ch).classList.add("stack");
      $(el.score).textContent = "One question";
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".tapcard"); if (!b || asked) return;
      const it = o.items[Number(b.dataset.k)];
      $(el.stage).querySelectorAll(".tapcard.now").forEach((c) => c.classList.remove("now"));
      b.classList.add("heard", "now"); heard.add(b.dataset.k);
      if (it.sound) SOUND.play(it.sound, 0.8);
      say(it.say || it.label);
      $(el.fb).className = "fb"; $(el.fb).innerHTML = "<b>" + esc(it.label) + "</b>" + (it.say ? " — " + esc(it.say) : "");
      $(el.score).textContent = heard.size + " of " + need + " heard";
      if (heard.size >= need) {
        reportAttempt(o.finish, heard.size, o.items.length, "things");
        if (o.then) setTimeout(question, 2400); else { $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }
      }
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const ok = b.dataset.ok === "1";
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      $(el.fb).className = "fb " + (ok ? "good" : "bad");
      $(el.fb).textContent = (ok ? cheer() + " " : "") + o.then.why;
      say((ok ? cheer() + " " : "") + o.then.why);
      reportScore(o.finish, ok ? 1 : 0, 1);
      setTimeout(() => { $(el.ch).innerHTML = ""; $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }, 2600);
    });
  }

  /* ---- sort each thing into a bin; with `chart`, into the columns of a
     graphic organiser that keeps every placed card visible (1Rf.01) ---- */
  function sortBins(o) {
    const el = o.el, items = shuffle(o.items), trays = {};
    let i = 0, right = 0, lock = false;
    o.bins.forEach((b) => { trays[b.id] = []; });
    const tray = (b) => o.chart
      ? '<span class="tray chart" aria-hidden="true">' + trays[b.id].map((it) => '<span class="chip small">' + small(it.pic) + " " + esc(it.label) + "</span>").join("") + "</span>"
      : '<span class="tray" aria-hidden="true">' + trays[b.id].map((it) => small(it.pic)).join("") + "</span>";
    function draw() {
      lock = false;
      const it = items[i];
      $(el.stage).innerHTML = '<div class="stagewide">' + (o.chart ? '<p class="phase">' + esc(o.title) + "</p>" : "") +
        '<div class="sortnow" id="' + el.stage + 'now">' + picHtml(it.pic) + '<span class="lab">' + esc(it.label) + "</span></div>" +
        '<div class="bins' + (o.chart ? " chartcols" : "") + (o.venn ? " venn" : "") + '">' + o.bins.map((b) => '<button type="button" class="bin" data-b="' + b.id + '"><span class="bpic" aria-hidden="true">' + small(b.pic) + "</span>" + esc(b.label) + tray(b) + "</button>").join("") + "</div></div>";
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.score).textContent = "Thing " + (i + 1) + " of " + items.length;
      sayHere(o.finish, it.label + ". " + (o.ask || "Which bin?"));
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".bin"); if (!b || lock) return;
      lock = true;
      const it = items[i], ok = b.dataset.b === it.bin;
      $(el.stage).querySelectorAll(".bin").forEach((x) => { x.disabled = true; });
      if (ok) {
        right++; b.classList.add("right"); SOUND.play("pop", 0.35);
        $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " " + it.why; say(cheer() + " " + it.why);
      } else {
        b.classList.add("wrong"); $(el.stage).querySelector(".sortnow").classList.add("shake");
        const rb = $(el.stage).querySelector('.bin[data-b="' + it.bin + '"]'); if (rb) rb.classList.add("right");
        $(el.fb).className = "fb bad"; $(el.fb).textContent = "Not that one. " + it.why; say("Not that one. " + it.why);
      }
      trays[it.bin].push(it);
      i++;
      setTimeout(() => {
        if (i >= items.length) {
          $(el.stage).querySelector(".sortnow").innerHTML = '<span class="lab">' + (o.chart ? "All recorded!" : "All sorted!") + "</span>";
          $(el.stage).querySelectorAll(".bin").forEach((x) => { x.classList.remove("right", "wrong"); const bin = o.bins.find((bb) => bb.id === x.dataset.b); x.querySelector(".tray").outerHTML = tray(bin); });
          $(el.score).textContent = "";
          const line = "You " + (o.chart ? "recorded" : "sorted") + " " + right + " of " + items.length + " first time. " + o.done;
          $(el.fb).className = "fb good"; $(el.fb).textContent = line;
          reportScore(o.finish, right, items.length);
          finish(o.finish, line);
        } else draw();
      }, ok ? 2100 : 3000);
    });
    draw();
  }
  function organiser(o) { sortBins(Object.assign({ chart: true }, o)); }

  /* ---- put things in order ------------------------------------------ */
  function order(o) {
    const el = o.el, items = o.items, placed = [];
    let lock = false, wrong = 0;
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide"><div class="orderrow">' +
        (placed.length ? placed.map((k, p) => '<span class="ordered"><b>' + (p + 1) + "</b>" + small(items[k].pic) + " " + esc(items[k].label) + "</span>").join('<span class="arrow" aria-hidden="true">&rarr;</span>') : '<span class="sub">Tap what comes first</span>') +
        '</div><div class="cardsgrid" id="' + el.stage + 'pool">' + shuffle(items.map((it, k) => ({ it, k }))).filter((x) => !placed.includes(x.k)).map((x) =>
          '<button type="button" class="tapcard" data-k="' + x.k + '"><span class="cpic" aria-hidden="true">' + small(x.it.pic) + "</span>" + esc(x.it.label) + "</button>").join("") + "</div></div>";
      $(el.score).textContent = placed.length + " of " + items.length + " in order";
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".tapcard"); if (!b || lock) return;
      const k = Number(b.dataset.k), expect = placed.length;
      if (k === expect) {
        placed.push(k); SOUND.play("pop", 0.35);
        $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " " + (items[k].say || "");
        say(cheer() + " " + (items[k].say || items[k].label));
        draw();
        if (placed.length === items.length) {
          lock = true;
          setTimeout(() => {
            const line = "All " + items.length + " in the right order. " + o.done;
            $(el.fb).className = "fb good"; $(el.fb).textContent = line;
            reportScore(o.finish, Math.max(0, items.length - wrong), items.length);
            finish(o.finish, line);
          }, 2200);
        }
      } else {
        wrong++; b.classList.add("wrong");
        const hint = k < expect ? "That one has already happened." : "Not yet. Something comes before " + items[k].label + ".";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = hint; say(hint);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    draw();
  }

  /* ---- a demonstration the child steps through ----------------------- */
  function demo(o) {
    const el = o.el, frames = o.frames;
    let k = 0;
    function pic(f) {
      if (f.scene) { const s = typeof SCENES[f.scene.id] === "function" ? SCENES[f.scene.id](f.scene.state) : sceneSvg(f.scene.id, [], new Set(), null); return '<div class="sim">' + s + "</div>"; }
      return picHtml(f.pic);
    }
    function draw() {
      const f = frames[k];
      $(el.stage).innerHTML = '<div class="frame"><div class="framepic">' + pic(f) + '</div><p class="framecap">' + f.cap + '</p><div class="pips">' + frames.map((_, j) => "<i class=\"" + (j < k ? "done" : j === k ? "on" : "") + '"></i>').join("") + "</div>" +
        (k < frames.length - 1 ? '<div class="bigbtns"><button type="button" class="big" id="' + el.stage + 'next">' + esc(f.button || o.button || "Next ▶") + "</button></div>" : "") + "</div>";
      $(el.score).textContent = (k + 1) + " of " + frames.length;
      const nb = $(el.stage + "next");
      if (nb) nb.addEventListener("click", () => {
        k++; if (frames[k].sound) SOUND.play(frames[k].sound, 0.7); draw(); say(plain(frames[k].say || frames[k].cap));
        if (k >= frames.length - 1) { reportAttempt(o.finish, frames.length, frames.length, "pictures"); setTimeout(() => { $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }, 2600); }
      });
    }
    ONSHOW[o.finish] = (function () { let said = false; return () => { if (said) return; said = true; afterVoice(() => sayHere(o.finish, plain(frames[0].say || frames[0].cap))); }; })();
    draw();
  }

  /* ==================================================================
     RESEARCH - asking, reading a source, finding out, recording.
     ================================================================== */

  /* ---- build a question from a question word and an ending (1Rq.01) --
     A card says what you want to find out. The child taps a question
     word, then an ending, and presses Ask it; the page reads the
     question aloud. A question that the ending allows but that asks
     about something else is answered as a GOOD question aimed at the
     wrong thing, not as wrong - it is a question, which is the skill. */
  /* what each question word asks for, used when a child builds a real
     question with the wrong word: "Where asks for a place" teaches; the
     ending's topic ("rabbits eating") is the same for every word that fits it
     and would tell the child nothing. */
  const WORD_ASKS = { "What": "a thing", "Where": "a place", "Who": "a person", "When": "a time", "Why": "a reason",
    "How": "the way something is done", "How much": "an amount", "How many": "a number", "How far": "a distance" };
  function questionBuilder(o) {
    const el = o.el, rounds = o.rounds, ends = shuffle(o.ends);
    let r = 0, word = null, end = null, lock = false, missed = false, score = 0;
    const endOf = (id) => o.ends.find((e) => e.id === id);
    function draw() {
      const rd = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide"><div class="wantcard"><span class="cpic" aria-hidden="true">' + small(rd.pic) + '</span><div><p class="phase">You want to know</p><b>' + esc(rd.want) + "</b></div></div>" +
        '<div class="qline" aria-live="polite">' + (word ? '<span class="chip qword">' + esc(word) + "</span>" : '<span class="hint">question word</span>') + " " + (end ? '<span class="chip qend">' + esc(endOf(end).t) + "</span>" : '<span class="hint">ending</span>') + "</div>" +
        '<p class="phase">1. Pick a question word</p><div class="qwords">' + o.words.map((w) => '<button type="button" class="chipbtn' + (word === w ? " on" : "") + '" data-w="' + esc(w) + '"' + (lock ? " disabled" : "") + ">" + esc(w) + "</button>").join("") + "</div>" +
        '<p class="phase">2. Pick an ending</p><div class="qends">' + ends.map((e) => '<button type="button" class="chipbtn end' + (end === e.id ? " on" : "") + '" data-e="' + esc(e.id) + '"' + (lock ? " disabled" : "") + ">" + esc(e.t) + "</button>").join("") + "</div>" +
        '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'ask"' + (word && end && !lock ? "" : " disabled") + '>\u{1F5E3}️ Ask it</button></div></div>';
      $(el.score).textContent = "Question " + (r + 1) + " of " + rounds.length;
      const ab = $(el.stage + "ask"); if (ab) ab.addEventListener("click", askIt);
    }
    function start() {
      word = null; end = null; lock = false; missed = false;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw();
      sayHere(o.finish, "You want to know: " + rounds[r].want + " Pick a question word, then an ending, then press Ask it.");
    }
    function askIt() {
      if (lock || !word || !end) return;
      const rd = rounds[r], e = endOf(end), question = word + " " + e.t;
      const fits = (e.words || []).includes(word);
      if (word === rd.word && end === rd.end) {
        lock = true; if (!missed) score++;
        SOUND.play("tada", 0.4); draw();
        sayLine(el, cheer() + " You asked: <b>" + esc(question) + "</b> " + esc(rd.why), cheer() + " You asked: " + question + " " + rd.why);
        r++;
        setTimeout(() => {
          if (r >= rounds.length) { reportScore(o.finish, score, rounds.length); endStep(o, "You built " + rounds.length + " questions. " + o.done); }
          else start();
        }, 3600);
      } else if (fits) {
        missed = true; SOUND.play("pop", 0.3);
        const but = word !== rd.word && WORD_ASKS[word] ? word + " asks for " + WORD_ASKS[word] : "it asks about " + (e.asks || "something else");
        const line = "That is a good question: " + question + " But " + but + ". You want to know " + lower1(noDot(rd.want)) + ". Try again.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      } else {
        missed = true; SOUND.play("error", 0.3);
        const line = question + " That does not make a question that works. Try a different question word.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    }
    $(el.stage).addEventListener("click", (e) => {
      if (lock) return;
      const wb = e.target.closest("[data-w]"), eb = e.target.closest("[data-e]");
      if (wb) { word = wb.dataset.w; SOUND.play("click", 0.3); draw(); say(word); return; }
      if (eb) { end = eb.dataset.e; SOUND.play("click", 0.3); draw(); say((word ? word + " " : "") + endOf(end).t); }
    });
    start();
  }

  /* ---- read a picture source: find the things in it (1Ri.01) --------
     A picture with things to find. Tapping one says the fact it shows;
     after enough are found, one question asks what the picture tells
     us, keyed by a spot in the picture rather than by a flag. */
  function pictureSource(o) {
    const el = o.el, found = new Set(), need = Math.min(o.need || o.spots.length, o.spots.length);
    const rounds = o.rounds || [];
    let phase = "find", active = null, r = 0, right = 0, missed = false, lock = false;
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide"><div class="sim picbox">' + sceneSvg(o.scene, o.spots, found, active) + "</div>" +
        '<p class="sub">' + esc(phase === "locate" ? "Tap the part of the picture that tells us." : (o.caption || "Tap the things in the picture to find out what it tells us.")) + "</p></div>";
      $(el.score).textContent = phase === "locate" ? "Find it: " + (r + 1) + " of " + rounds.length : found.size + " of " + need + " found";
    }
    /* Stage 2: after the picture has been explored, LOCATE the part that
       answers a question (2Ri.01) - the spot is the key, computed by the
       builder and the gate against the picture's own spots */
    function locate() {
      phase = "locate"; lock = false; missed = false; active = null; draw();
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.ask).innerHTML = "<b>" + esc(rounds[r].ask) + "</b> Tap the part of the picture that tells us.";
      sayHere(o.finish, rounds[r].ask + " Tap the part of the picture that tells us.");
    }
    function closing() {
      phase = "done"; active = null; draw(); $(el.fb).textContent = "";
      if (o.then) askOnce(o, o.then, (ok) => { reportScore(o.finish, right + (ok ? 1 : 0), rounds.length + 1); endStep(o); }, (c) => !!c.spot);
      else { reportScore(o.finish, right, rounds.length); endStep(o, "You found the part of the picture that answers " + rounds.length + " questions. " + o.done); }
    }
    $(el.stage).addEventListener("click", (e) => {
      const g = e.target.closest("[data-spot]"); if (!g || lock || phase === "done") return;
      const sp = o.spots.find((s) => s.id === g.dataset.spot);
      if (phase === "locate") {
        const rd = rounds[r];
        if (sp.id === rd.spot) {
          lock = true; if (!missed) right++; active = sp.id; SOUND.play("ding", 0.4); draw();
          const line = cheer() + " " + sp.label + ": " + sp.fact + " " + rd.why;
          $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
          r++;
          setTimeout(() => { if (r >= rounds.length) closing(); else locate(); }, 3400);
        } else {
          missed = true; SOUND.play("error", 0.3);
          const line = "That is " + sp.label + ". It tells us: " + sp.fact + " Look for the part that tells us " + lower1(noDot(rd.about || rd.ask)) + ".";
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        }
        return;
      }
      found.add(sp.id); active = sp.id; SOUND.play("pop", 0.35); draw();
      $(el.fb).className = "fb"; $(el.fb).innerHTML = "<b>" + esc(sp.label) + "</b> — " + esc(sp.fact);
      say(sp.label + ". " + sp.fact);
      reportAttempt(o.finish, found.size, o.spots.length, "things");
      if (found.size >= need && phase === "find") {
        phase = "wait"; lock = true;
        setTimeout(() => { lock = false; if (rounds.length) locate(); else closing(); }, 2600);
      }
    });
    $(el.stage).addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const g = e.target.closest("[data-spot]"); if (!g) return;
      e.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    draw();
  }

  /* ---- a class survey: ask each classmate, record the answer into a
     pictogram that fills as you go (1Rc.01, 1Rf.01) -------------------
     Nobody answers until they are ASKED: the child presses Ask, hears
     the classmate, then records what they said. A wrong recording is
     read back against what the person actually said. */
  function survey(o) {
    const el = o.el, people = o.people, options = o.options;
    const counts = {}; options.forEach((x) => { counts[x.id] = 0; });
    let p = 0, chosen = null, right = 0, missed = false, lock = false, askedNow = false;
    function pictoHtml() {
      return '<div class="picto"><p class="pictotitle">' + esc(o.question) + "</p>" + options.map((x) =>
        '<div class="pictorow"><span class="rowlab">' + small(x.pic) + " " + esc(x.t) + '</span><span class="pictocells">' + '<span class="pcell" aria-hidden="true">' + small(x.pic) + "</span>".repeat(counts[x.id]) + '</span><b class="pcount">' + counts[x.id] + "</b></div>").join("") + "</div>";
    }
    function draw() {
      const person = people[p];
      $(el.stage).innerHTML = '<div class="stagewide">' +
        (person ? '<div class="person"><span class="ppic" aria-hidden="true">' + small(person.pic) + '</span><div><b>' + esc(person.name) + "</b>" +
          (askedNow ? '<p class="pbubble">“' + esc(person.say) + "”</p>" : '<p class="pbubble dim">…</p>') + "</div>" +
          (askedNow ? "" : '<button type="button" class="big small teal" id="' + el.stage + 'askp">\u{1F5E3}️ Ask ' + esc(person.name) + "</button>") + "</div>" : "") +
        '<div class="formopts">' + options.map((x) => '<button type="button" class="opt' + (chosen === x.id ? " on" : "") + '" data-id="' + x.id + '"' + (person && askedNow ? "" : " disabled") + '><span class="radio" aria-hidden="true"></span><span class="cpic" aria-hidden="true">' + small(x.pic) + "</span>" + esc(x.t) + "</button>").join("") + "</div>" +
        '<div class="bigbtns"><button type="button" class="big small" id="' + el.stage + 'rec"' + (chosen && person && askedNow ? "" : " disabled") + ">✏️ Record it</button></div>" +
        pictoHtml() + "</div>";
      $(el.score).textContent = person ? "Classmate " + (p + 1) + " of " + people.length : "";
      const ab = $(el.stage + "askp"); if (ab) ab.addEventListener("click", askPerson);
      const rb = $(el.stage + "rec"); if (rb) rb.addEventListener("click", record);
    }
    function askPerson() {
      if (lock || askedNow) return;
      askedNow = true; SOUND.play("chatter", 0.5); draw();
      const person = people[p];
      say(o.question + " " + person.name + " says: " + person.say);
      $(el.fb).className = "fb"; $(el.fb).textContent = "You asked " + person.name + ". Now record what they said.";
    }
    function record() {
      if (lock || !chosen || !askedNow) return;
      const person = people[p];
      if (chosen === person.answer) {
        lock = true; if (!missed) right++;
        counts[chosen]++; SOUND.play("send", 0.4);
        const opt = options.find((x) => x.id === chosen);
        const line = "Recorded: " + person.name + ", " + opt.t + ". One more picture in the " + opt.t + " row.";
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        p++; chosen = null; missed = false; askedNow = false;
        setTimeout(() => {
          lock = false; draw();
          if (p >= people.length) {
            $(el.ask).innerHTML = "Every answer is in the pictogram.";
            reportScore(o.finish, right, people.length);
            endStep(o, "You asked " + people.length + " classmates and recorded every answer in a pictogram. " + o.done);
          } else sayHere(o.finish, "Now ask " + people[p].name + ".");
        }, 2200);
      } else {
        missed = true; SOUND.play("error", 0.3);
        const want = options.find((x) => x.id === person.answer);
        const line = person.name + " said: " + person.say + " That is " + want.t + ". Tap " + want.t + ", then Record it.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".opt"); if (!b || lock || !askedNow) return;
      chosen = b.dataset.id; SOUND.play("click", 0.3); draw();
    });
    draw();
    ONSHOW[o.finish] = (function () { let said = false; return () => { if (said || p >= people.length) return; said = true; afterVoice(() => sayHere(o.finish, "Press Ask " + people[0].name + " to ask the question.")); }; })();
  }

  /* ---- talk about a pictogram (1Ad.01) ----------------------------------
     The pictogram stays on screen. Every answer is IN it, so the skill is
     reading the rows rather than remembering. The builder computes each
     key from the rows and refuses a wrong one. */
  function pictogramRead(o) {
    const el = o.el;
    let i = 0, right = 0, lock = false;
    /* the same rows drawn three ways (2Ad.01: graphical and numerical data
       can show information): a pictogram, a bar chart, or a table of numbers */
    const most = Math.max(1, ...o.rows.map((r) => r.value));
    const unit = o.unit || "";
    const body = o.display === "ruler"
      ? '<div class="picto bars ruler"><p class="pictotitle">' + esc(o.title) + "</p>" + o.rows.map((r) =>
        '<div class="pictorow"><span class="rowlab">' + small(r.pic) + " " + esc(r.label) + '</span><span class="barwrap"><span class="bar" style="width:' + Math.round(r.value / most * 100) + '%" aria-hidden="true"></span><span class="ticks" aria-hidden="true">' + Array.from({ length: 5 }, (_, t) => "<i></i>").join("") + "</span></span><b class=\"pcount\">" + r.value + " " + esc(unit) + "</b></div>").join("") +
        '<p class="sub">Measured with a ' + esc(o.tool || "ruler") + ', in ' + esc(unit || "units") + ".</p></div>"
      : o.display === "table"
      ? '<table class="rec small"><thead><tr><th>' + esc((o.columns || ["Answer", "How many"])[0]) + "</th><th>" + esc((o.columns || ["Answer", "How many"])[1]) + "</th></tr></thead><tbody>" +
        o.rows.map((r) => '<tr><td><span class="rowlab">' + small(r.pic) + " " + esc(r.label) + '</span></td><td><span class="cell filled">' + r.value + "</span></td></tr>").join("") + "</tbody></table><p class=\"sub\">A table: the number says how many.</p>"
      : o.display === "bars"
        ? '<div class="picto bars"><p class="pictotitle">' + esc(o.title) + "</p>" + o.rows.map((r) =>
          '<div class="pictorow"><span class="rowlab">' + small(r.pic) + " " + esc(r.label) + '</span><span class="barwrap"><span class="bar" style="width:' + Math.round(r.value / most * 100) + '%" aria-hidden="true"></span></span><b class="pcount">' + r.value + "</b></div>").join("") +
          '<p class="sub">A bar chart: the longer the bar, the bigger the number.</p></div>'
        : '<div class="picto"><p class="pictotitle">' + esc(o.title) + "</p>" + o.rows.map((r) =>
          '<div class="pictorow"><span class="rowlab">' + small(r.pic) + " " + esc(r.label) + '</span><span class="pictocells">' + '<span class="pcell" aria-hidden="true">' + small(r.pic) + "</span>".repeat(r.value) + '</span><b class="pcount">' + r.value + "</b></div>").join("") +
          '<p class="sub">Each picture is one person.</p></div>';
    $(el.stage).innerHTML = '<div class="stagewide">' + body + "</div>";
    function draw() {
      lock = false;
      const it = o.items[i];
      $(el.ask).innerHTML = it.ask;
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(it.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      const what = o.display === "table" ? "table" : o.display === "bars" ? "bar chart" : o.display === "ruler" ? "measurements" : "pictogram";
      $(el.score).textContent = "Look at the " + what + ": question " + (i + 1) + " of " + o.items.length;
      sayHere(o.finish, plain(it.ask) + " Look at the " + what + ".");
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const it = o.items[i], ok = b.dataset.ok === "1";
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong"); else right++;
      $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = (ok ? cheer() + " " : "Look again. ") + it.why; say($(el.fb).textContent);
      i++;
      setTimeout(() => {
        if (i >= o.items.length) {
          reportScore(o.finish, right, o.items.length);
          endStep(o, "You answered " + right + " of " + o.items.length + " from the " + (o.display === "table" ? "table" : o.display === "bars" ? "bar chart" : o.display === "ruler" ? "measurements" : "pictogram") + ". " + o.done);
        } else draw();
      }, 2700);
    });
    draw();
  }

  /* ==================================================================
     ANALYSIS - what we know, what happens next, what would fix it.
     ================================================================== */

  /* ---- say something you know about a topic (1Ap.01) -------------------
     A board and a pile of cards. A card that is ABOUT the topic goes on
     the board and is read back as "I know that..."; a card about
     something else bounces with what it IS about. Relevance is the tag,
     not a flag. When enough are on the board, the child taps one to say
     it out loud. */
  function knowBoard(o) {
    const el = o.el, cards = shuffle(o.cards.map((c, k) => Object.assign({ k }, c)));
    const onBoard = [], need = Math.min(o.need || 2, o.cards.filter((c) => c.about === o.tag).length);
    let phase = "pick", missed = 0, right = 0;
    const talk = o.mode === "talk" || o.mode === "structured", structured = o.mode === "structured";
    const slots = o.slots || [];
    const slotOf = () => slots[onBoard.length];
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide"><div class="board"><p class="phase">' + (talk ? "My talk about" : "What we know about") + ' <b>' + esc(o.topic) + "</b> " + small(o.topicPic || "") + "</p>" +
        (structured ? '<ol class="slots">' + slots.map((sl, k) => '<li class="slotrow' + (k < onBoard.length ? " filled" : k === onBoard.length && phase === "pick" ? " now" : "") + '"><b>' + esc(sl.label) + "</b> " + (k < onBoard.length ? '<span class="chip small">' + esc(o.cards[onBoard[k]].t) + "</span>" : '<span class="hint">' + esc(sl.hint) + "</span>") + "</li>").join("") + "</ol>"
          : '<ul class="boardlist" id="' + el.stage + 'b">' + (onBoard.length ? onBoard.map((k) => '<li><button type="button" class="boardfact" data-b="' + k + '"><span class="cpic" aria-hidden="true">' + small(o.cards[k].pic) + "</span>" + esc(o.cards[k].t) + "</button></li>").join("") : '<li class="hint">Nothing on the board yet.</li>') + "</ul>") + "</div>" +
        (phase === "pick" ? '<div class="cardsgrid">' + cards.filter((c) => !onBoard.includes(c.k)).map((c) => '<button type="button" class="tapcard" data-k="' + c.k + '"><span class="cpic" aria-hidden="true">' + small(c.pic) + "</span>" + esc(c.t) + "</button>").join("") + "</div>" : "") +
        (phase === "say" && talk ? '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'talk">\u{1F5E3}\ufe0f Give my talk</button></div>' : "") + "</div>";
      $(el.score).textContent = phase === "pick" ? onBoard.length + " of " + need + (talk ? " things to say" : " on the board") : talk ? "Press Give my talk" : "Tap a fact on the board to say it";
      const tb = $(el.stage + "talk");
      if (tb) tb.addEventListener("click", () => {
        if (phase !== "say") return;
        phase = "done"; SOUND.play("tada", 0.4);
        const said = onBoard.map((k) => noDot(o.cards[k].say)).join(". ") + ".";
        sayLine(el, "Your talk about <b>" + esc(o.topic) + "</b>: " + esc(said), "Your talk about " + o.topic + ". " + said);
        reportScore(o.finish, right, need + missed);
        setTimeout(() => endStep(o, "You gave a talk about " + o.topic + ", and everything in it was about " + o.topic + ". " + o.done), 4200);
      });
    }
    $(el.stage).addEventListener("click", (e) => {
      const fact = e.target.closest(".boardfact");
      if (fact && phase === "say") {
        const c = o.cards[Number(fact.dataset.b)];
        phase = "done"; SOUND.play("tada", 0.4);
        sayLine(el, "You said: <b>I know that " + esc(lower1(noDot(c.say))) + ".</b>", "You said: I know that " + lower1(noDot(c.say)) + ".");
        reportScore(o.finish, right, need + missed);
        setTimeout(() => endStep(o, "You said something you know about " + o.topic + ". " + o.done), 3000);
        return;
      }
      const b = e.target.closest(".tapcard"); if (!b || phase !== "pick") return;
      /* the index comes from the button: the original card carries no `k`
         (only the shuffled copies do), and pushing c.k put undefined on the
         board - found by the driver, not by eye */
      const kk = Number(b.dataset.k), c = o.cards[kk];
      if (structured && c.about === o.tag && c.part !== slotOf().id) {
        /* about the topic, but the wrong PART of the talk: a talk has a
           structure, and the child is building it in order (3Mi.01) */
        missed++; b.classList.add("wrong"); SOUND.play("error", 0.3);
        const want = slots.find((sl) => sl.id === c.part);
        const line = "That belongs in the " + (want ? want.label.toLowerCase() : "another part") + " of the talk. We are on the " + slotOf().label.toLowerCase() + ": " + slotOf().hint.toLowerCase() + ".";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => b.classList.remove("wrong"), 700);
        return;
      }
      if (c.about === o.tag) {
        onBoard.push(kk); right++; SOUND.play("pop", 0.35); draw();
        /* a structured talk names the PART just filled; a board says "I know that" */
        const line = structured ? slots[onBoard.length - 1].label + ": " + noDot(c.say) + "." : "I know that " + lower1(noDot(c.say)) + ".";
        $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " " + line; say(cheer() + " " + line);
        reportAttempt(o.finish, onBoard.length, need, "facts");
        if (onBoard.length >= need) {
          phase = "say";
          setTimeout(() => {
            draw(); $(el.fb).textContent = "";
            if (talk) { $(el.ask).innerHTML = "Your talk is ready. <b>Press Give my talk</b> to hear it."; sayHere(o.finish, "Your talk is ready. Press Give my talk to hear it."); }
            else { $(el.ask).innerHTML = "Now say one out loud. <b>Tap a fact on the board.</b>"; sayHere(o.finish, "Now say one out loud. Tap a fact on the board."); }
          }, 2600);
        }
      } else {
        missed++; b.classList.add("wrong"); SOUND.play("error", 0.3);
        const line = "That is about " + (c.aboutLabel || "something else") + ", not " + o.topic + ". " + (talk ? "A talk about " + o.topic + " only says things about " + o.topic + "." : "Only things about " + o.topic + " go on the board.");
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    draw();
  }

  /* ---- what happens to YOU when you do this (1Ac.01) -------------------
     A situation; the child predicts what will happen to them, then
     presses See what happens and watches the consequence. A wrong
     prediction is not the end of it - the consequence is shown either
     way, because seeing it is the lesson. */
  function consequences(o) {
    const el = o.el, rounds = o.rounds;
    let r = 0, phase = "predict", picked = null, right = 0, lock = false;
    function draw() {
      const rd = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide"><div class="sit' + (phase === "result" ? " after" : "") + '">' +
        '<span class="cpic big" aria-hidden="true">' + small(phase === "result" ? rd.result.pic : rd.pic) + "</span>" +
        "<p>" + (phase === "result" ? "<b>" + esc(rd.result.say) + "</b>" : esc(rd.situation)) + "</p></div>" +
        (phase === "see" ? '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'see">\u{1F440} See what happens</button></div>' : "") + "</div>";
      $(el.score).textContent = "Situation " + (r + 1) + " of " + rounds.length;
      const sb = $(el.stage + "see"); if (sb) sb.addEventListener("click", reveal);
    }
    function predictPhase() {
      const rd = rounds[r];
      phase = "predict"; picked = null; lock = false;
      $(el.ask).innerHTML = "<b>" + esc(rd.situation) + "</b> " + rd.predict.ask;
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(rd.predict.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      sayHere(o.finish, rd.situation + " " + plain(rd.predict.ask));
    }
    function start() {
      const rd = rounds[r];
      picked = null; lock = false;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      phase = rd.cause ? "cause" : "predict"; draw();
      /* Stage 3 (3Ac.01): the CAUSE first - why did you do it? - then the
         consequence for somebody else */
      if (rd.cause) {
        $(el.ask).innerHTML = "<b>" + esc(rd.situation) + "</b> " + rd.cause.ask;
        askOnce(o, rd.cause, (ok) => { if (ok) right++; predictPhase(); });
        return;
      }
      predictPhase();
    }
    function reveal() {
      if (lock) return;
      lock = true; phase = "result";
      const rd = rounds[r];
      SOUND.play(rd.result.sound || (picked.ok ? "ding" : "thud"), 0.5); draw();
      const line = (picked.ok ? cheer() + " You predicted it. " : "Look what happened. ") + rd.result.say + " " + rd.why;
      $(el.fb).className = "fb " + (picked.ok ? "good" : "bad"); $(el.fb).textContent = line; say(line);
      r++;
      setTimeout(() => {
        if (r >= rounds.length) { reportScore(o.finish, right, rounds.reduce((n, x) => n + (x.cause ? 2 : 1), 0)); endStep(o, "You thought about " + rounds.length + " things you might do, and what would happen next. " + o.done); }
        else start();
      }, 4200);
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || picked || phase !== "predict") return;
      picked = { ok: b.dataset.ok === "1" };
      if (picked.ok) right++;
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("on");
      phase = "see"; draw();
      $(el.fb).className = "fb"; $(el.fb).textContent = "You think: " + b.textContent + ". Now see what happens.";
      say("You think: " + b.textContent + ". Now press See what happens.");
    });
    start();
  }

  /* ---- choose the action that would fix it (1As.01) --------------------
     An issue, drawn; three or four actions offered. The child picks one
     and the page shows what that action DID. An action whose effect is
     not what the issue needs is not marked wrong and left there: it is
     tried, it did not fix it, and the child chooses again. */
  function solveIt(o) {
    const el = o.el, rounds = o.rounds;
    let r = 0, tried = new Set(), lock = false, score = 0, fixed = false;
    function draw(after) {
      const rd = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide"><div class="issue' + (fixed ? " fixed" : "") + '"><span class="cpic big" aria-hidden="true">' + small(after ? after.pic || rd.issue.pic : rd.issue.pic) + "</span>" +
        "<p><b>" + esc(fixed ? (rd.issue.fixed || "Fixed!") : rd.issue.title) + "</b>" + (after ? "<br>" + esc(after.say) : "") + "</p></div>" +
        '<p class="phase">What could we do?</p><div class="cardsgrid acts">' + rd.actions.map((a) => '<button type="button" class="tapcard' + (tried.has(a.id) ? " tried" : "") + '" data-a="' + esc(a.id) + '"' + (lock || fixed || tried.has(a.id) ? " disabled" : "") + '><span class="cpic" aria-hidden="true">' + small(a.pic) + "</span>" + esc(a.t) + "</button>").join("") + "</div></div>";
      $(el.score).textContent = "Problem " + (r + 1) + " of " + rounds.length;
    }
    function start() {
      tried = new Set(); lock = false; fixed = false;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw(null);
      $(el.ask).innerHTML = "<b>" + esc(rounds[r].issue.title) + "</b> " + esc(rounds[r].issue.say || "Which action would fix it? Tap one and see.");
      sayHere(o.finish, rounds[r].issue.title + ". " + (rounds[r].issue.say || "Which action would fix it? Tap one and see."));
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest("[data-a]"); if (!b || lock || fixed) return;
      const rd = rounds[r], a = rd.actions.find((x) => x.id === b.dataset.a);
      tried.add(a.id); lock = true;
      if (a.effect === rd.needs) {
        fixed = true; if (tried.size === 1) score++;
        SOUND.play("tada", 0.5); draw(a);
        const line = cheer() + " " + a.say + " " + rd.why;
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        r++;
        setTimeout(() => {
          if (r >= rounds.length) { reportScore(o.finish, score, rounds.length); endStep(o, "You chose an action that fixed " + rounds.length + " problems. " + o.done); }
          else start();
        }, 3800);
      } else {
        SOUND.play(a.effect === "worse" ? "buzz" : "thud", 0.4); draw(a);
        const line = a.say + " That did not fix it. Try another action.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => { lock = false; draw(null); }, 3200);
      }
    });
    start();
  }

  /* ==================================================================
     EVALUATION - which source helps, and what do you think.
     ================================================================== */

  /* ---- pick the source that is about the topic, and say why (1Es.01) --
     A topic; a shelf of sources. The relevant one is the one whose
     `about` includes the topic, computed, never flagged. A wrong pick
     says what that source IS about. Then the child says WHY. */
  function pickSource(o) {
    const el = o.el, rounds = o.rounds;
    let r = 0, phase = "pick", lock = false, missed = false, score = 0, picked = new Set(), order = [];
    const wanted = (rd) => rd.sources.filter((s) => (s.about || []).includes(rd.tag)).length;
    function draw() {
      const rd = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide"><div class="wantcard"><span class="cpic" aria-hidden="true">' + small(rd.pic) + '</span><div><p class="phase">Find out about</p><b>' + esc(rd.topic) + "</b></div></div>" +
        '<div class="cardsgrid shelfgrid">' + order.map((s) => '<button type="button" class="tapcard' + (picked.has(s.id) ? " heard" : "") + '" data-s="' + esc(s.id) + '"' + (phase !== "pick" || picked.has(s.id) ? " disabled" : "") + '><span class="cpic" aria-hidden="true">' + small(s.pic) + "</span>" + esc(s.label) + "</button>").join("") + "</div></div>";
      $(el.score).textContent = "Topic " + (r + 1) + " of " + rounds.length + (rounds[r].multi ? " · " + picked.size + " of " + wanted(rounds[r]) + " found" : "");
    }
    function start() {
      const rd = rounds[r];
      phase = "pick"; lock = false; missed = false; picked = new Set(); order = shuffle(rd.sources);
      $(el.ch).innerHTML = ""; $(el.ch).className = "choices"; $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw();
      /* Stage 2 (2Es.01): SUGGEST the sources - more than one would help, and
         the child finds all of them before saying why */
      $(el.ask).innerHTML = "We want to find out about <b>" + esc(rd.topic) + "</b>. " + (rd.multi ? "Which ones would help? Tap <b>every</b> one that would." : "Which one would help? Tap it.");
      sayHere(o.finish, "We want to find out about " + rd.topic + ". " + (rd.multi ? "Which ones would help? Tap every one that would." : "Which one would help? Tap it."));
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest("[data-s]"); if (!b || lock || phase !== "pick") return;
      const rd = rounds[r], s = rd.sources.find((x) => x.id === b.dataset.s);
      if ((s.about || []).includes(rd.tag)) {
        picked.add(s.id);
        if (rd.multi && picked.size < wanted(rd)) {
          SOUND.play("pop", 0.35); draw();
          const line = cheer() + " " + s.say + " Is there another?";
          $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
          return;
        }
        lock = true; if (!missed) score++;
        draw(); SOUND.play("ding", 0.4);
        const line = cheer() + " " + s.say + (rd.multi ? " That is all of them." : "");
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        setTimeout(() => {
          phase = "why"; $(el.fb).textContent = "";
          askOnce(o, { ask: "Why " + (rd.multi ? "are those good ones" : "is <b>" + esc(s.label) + "</b> a good one") + " for " + esc(rd.topic) + "?", opts: rd.reasons, why: rd.why }, (ok) => {
            if (ok) score++;
            r++;
            if (r >= rounds.length) { reportScore(o.finish, score, rounds.length * 2); endStep(o, "You chose a source for " + rounds.length + " topics and said why. " + o.done); }
            else start();
          });
        }, 2800);
      } else {
        missed = true; b.classList.add("wrong"); SOUND.play("error", 0.3);
        const line = s.say + " That does not tell us about " + rd.topic + ". Try another.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    start();
  }

  /* ---- state an opinion about a topic (1Ea.01) --------------------------
     Any opinion is right, so the page marks none of them. What it does
     check is the REASON: a reason about a different topic is bounced
     with what it is about. Then the whole sentence is read back, which
     is the child hearing themselves state an opinion. */
  function opinion(o) {
    const el = o.el, rounds = o.rounds;
    let r = 0, stance = null, said = 0, lock = false, given = [], givenK = [];
    const needR = Math.max(1, Number(o.reasonsNeeded) || 1);
    function draw() {
      const rd = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide">' +
        (rd.view ? '<div class="person"><span class="ppic" aria-hidden="true">' + small(rd.view.pic) + '</span><div><b>' + esc(rd.view.name) + ' thinks:</b><p class="pbubble">“' + esc(rd.view.says) + "”</p></div></div>" : "") +
        '<div class="wantcard"><span class="cpic" aria-hidden="true">' + small(rd.pic) + '</span><div><p class="phase">' + (rd.view ? "What do you think about that?" : "What do you think about") + '</p><b>' + esc(rd.topic) + (rd.view ? "" : "?") + "</b></div></div>" +
        '<div class="qline" aria-live="polite">' + (stance ? '<span class="chip qword">' + esc(stance.t) + "</span>" : '<span class="hint">I think…</span>') + " " +
        (given.length ? given.map((g) => '<span class="chip qend">' + esc(g) + "</span>").join(" ") : "") + (given.length < needR ? '<span class="hint">because…</span>' : "") + "</div></div>";
      $(el.score).textContent = "Topic " + (r + 1) + " of " + rounds.length + (needR > 1 ? " · " + given.length + " of " + needR + " reasons" : "");
    }
    function start() {
      const rd = rounds[r];
      stance = null; lock = false; given = []; givenK = [];
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw();
      $(el.ask).innerHTML = esc(rd.ask || "What do you think about " + rd.topic + "?") + " <b>Tap what YOU think.</b> There is no wrong answer.";
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(rd.stances).map((s) => '<button type="button" class="choice text" data-st="' + esc(s.id) + '">' + esc(s.t) + "</button>").join("");
      sayHere(o.finish, (rd.ask || "What do you think about " + rd.topic + "?") + " Tap what you think. There is no wrong answer.");
    }
    function reasons() {
      const rd = rounds[r];
      $(el.ask).innerHTML = "You think: <b>" + esc(stance.t) + "</b>. Now say <b>why</b>. Pick " + (needR > 1 ? needR + " reasons that are" : "a reason that is") + " about " + esc(rd.topic) + ".";
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(rd.reasons.map((x, k) => [x, k])).map(([x, k]) => '<button type="button" class="choice text" data-k="' + k + '" data-about="' + esc(x.about) + '">' + esc(x.t) + "</button>").join("");
      sayHere(o.finish, "You think: " + stance.t + ". Now say why. Pick " + (needR > 1 ? needR + " reasons that are" : "a reason that is") + " about " + rd.topic + ".");
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      const rd = rounds[r];
      if (!stance) {
        stance = rd.stances.find((s) => s.id === b.dataset.st); SOUND.play("click", 0.3); draw();
        $(el.fb).className = "fb"; $(el.fb).textContent = "You think: " + stance.t + ".";
        reasons(); return;
      }
      const why = rd.reasons[Number(b.dataset.k)] || {};
      if (b.dataset.about === rd.tag && why.supports && !why.supports.includes(stance.id)) {
        /* on the topic, but it argues the other way: "I think we should
           recycle more, because it takes time" is not a reason FOR recycling */
        b.classList.add("wrong"); b.disabled = true; SOUND.play("boing", 0.3);
        const line = "That reason is about " + rd.topic + ", but it does not back up what you said: " + noDot(stance.t) + ". Pick a reason that does.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        return;
      }
      if (b.dataset.about === rd.tag && stance.mixed && needR > 1 && given.length === needR - 1) {
        /* a mixed opinion ("I partly agree") needs reasons that do not all
           back one side: refuse a last reason that points the same way */
        const mixedIds = rd.stances.filter((s) => s.mixed).map((s) => s.id);
        const sides = (k) => ((rd.reasons[k] || {}).supports || []).filter((id) => !mixedIds.includes(id));
        let common = sides(Number(b.dataset.k));
        givenK.forEach((k) => { common = common.filter((id) => sides(k).includes(id)); });
        if (common.length) {
          b.classList.add("wrong"); b.disabled = true; SOUND.play("boing", 0.3);
          const line = "That reason points the same way as your other one. You said: " + noDot(stance.t) + ", so give a reason on each side. Pick one that points the other way.";
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
          return;
        }
      }
      if (b.dataset.about === rd.tag) {
        given.push(b.textContent); givenK.push(Number(b.dataset.k)); b.classList.add("right"); b.disabled = true;
        if (given.length < needR) { SOUND.play("pop", 0.35); draw(); const l = cheer() + " That reason is about " + rd.topic + ". Now another one."; $(el.fb).className = "fb good"; $(el.fb).textContent = l; say(l); return; }
        lock = true; said++;
        $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; });
        SOUND.play("tada", 0.4); draw();
        const sentence = stance.t + ", " + given.join(", and ") + ".";
        sayLine(el, "You said: <b>" + esc(sentence) + "</b> That is an opinion with " + (needR > 1 ? "reasons" : "a reason") + ".", "You said: " + sentence + " That is an opinion with " + (needR > 1 ? "reasons" : "a reason") + ".");
        reportAttempt(o.finish, said, rounds.length, "opinions");
        r++;
        setTimeout(() => {
          if (r >= rounds.length) endStep(o, "You said what you think about " + rounds.length + " things, and why. " + o.done);
          else start();
        }, 3800);
      } else {
        b.classList.add("wrong"); b.disabled = true; SOUND.play("error", 0.3);
        const line = "That reason is about " + (b.dataset.about || "something else") + ", not " + rd.topic + ". A reason has to be about the thing you are talking about. Try another.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    });
    start();
  }

  /* ==================================================================
     COLLABORATION and REFLECTION - a shared outcome, and who did what.
     ================================================================== */

  /* ---- a team job: share, work well together, and watch the outcome
     grow (1Cc.01, 1Ct.01) -------------------------------------------
     The scene grows one stage for every round played well. A share
     round is ARITHMETIC: you have some, a friend has none, you both need
     the same; giving too few leaves the friend stuck, giving everything
     leaves you stuck, and only the share that lets BOTH of you finish
     grows the garden. A work round offers ways to respond to a friend;
     the positive one grows the garden. A friend round is something a
     friend did for the team, told, and remembered. Everything the child
     does and every friend's action is LOGGED for the reflection step. */
  function teamBuild(o) {
    const el = o.el, rounds = o.rounds, friends = o.friends;
    /* one log per team step, keyed by the step's own index: two team steps
       on one page each keep their own record, and the reflection step that
       follows each one reads its own (o.teamStep, set by the builder) */
    const log = [];
    const logs = window.__gpTeamLogs = window.__gpTeamLogs || {};
    logs[o.finish] = log;
    let r = 0, grown = 0, lock = false, missed = false, score = 0, taskDone = [], taskOrder = [], given = {}, ti = 0;
    const friend = (id) => friends.find((f) => f.id === id) || { name: id, pic: "\u{1F9D2}" };
    function draw() {
      const rd = rounds[r], f = rd ? friend(rd.who) : null;
      const task = rd && rd.kind === "task" ? rd : null;
      const alloc = rd && rd.kind === "allocate" ? rd : null;
      $(el.stage).innerHTML = '<div class="stagewide"><p class="goal">Together: <b>' + esc(o.goal) + "</b></p>" +
        '<div class="sim teamscene">' + SCENES[o.scene](grown) + "</div>" +
        (alloc ? '<div class="alloc"><ol class="algo">' + alloc.tasks.map((t, k) => '<li class="' + (given[t.id] ? "done" : k === ti ? "now" : "") + '"><span class="apic" aria-hidden="true">' + small(t.pic) + "</span>" + esc(t.t) + (given[t.id] ? ' <span class="chip small">' + esc(given[t.id]) + "</span>" : "") + "</li>").join("") + "</ol>" +
          '<div class="teamrow members">' + alloc.members.map((m) => '<button type="button" class="mate" data-m="' + esc(m.id) + '"' + (ti >= alloc.tasks.length ? " disabled" : "") + '><span class="cpic" aria-hidden="true">' + small(m.pic) + "</span>" + esc(m.name) + "<small>" + esc((m.skills || []).join(", ")) + "</small></button>").join("") + "</div></div>" : "") +
        (task ? '<p class="phase">Your job: ' + esc(task.job) + "</p>" + '<div class="orderrow">' + (taskDone.length ? taskDone.map((k, p) => '<span class="ordered"><b>' + (p + 1) + "</b>" + small(task.steps[k].pic) + " " + esc(task.steps[k].t) + "</span>").join('<span class="arrow" aria-hidden="true">&rarr;</span>') : '<span class="sub">Tap what you do first</span>') + "</div>" +
          '<div class="cardsgrid">' + taskOrder.filter((k) => !taskDone.includes(k)).map((k) => '<button type="button" class="tapcard" data-task="' + k + '"><span class="cpic" aria-hidden="true">' + small(task.steps[k].pic) + "</span>" + esc(task.steps[k].t) + "</button>").join("") + "</div>" : "") +
        '<div class="teamrow">' + friends.map((x) => '<span class="mate' + (f && f.id === x.id ? " now" : "") + '"><span class="cpic" aria-hidden="true">' + small(x.pic) + "</span>" + esc(x.name) + "</span>").join("") + '<span class="mate you"><span class="cpic" aria-hidden="true">\u{1F9D2}</span>You</span></div>' +
        (rd && rd.kind === "friend" ? '<div class="person"><span class="ppic" aria-hidden="true">' + small(f.pic) + '</span><div><b>' + esc(f.name) + '</b><p class="pbubble">' + esc(rd.did) + "</p></div></div>" +
          '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'ok">' + esc(rd.button || "Thanks, " + f.name + "! ▶") + "</button></div>" : "") + "</div>";
      $(el.score).textContent = "Round " + (Math.min(r + 1, rounds.length)) + " of " + rounds.length;
      const ok = $(el.stage + "ok"); if (ok) ok.addEventListener("click", friendDone);
    }
    function grow(msg) {
      grown = Math.min(6, grown + 1); SOUND.play("grow", 0.4); draw();
      if (msg) { $(el.fb).className = "fb good"; $(el.fb).textContent = msg; say(msg); }
    }
    function start() {
      const rd = rounds[r], f = friend(rd.who);
      lock = false; missed = false;
      $(el.ch).innerHTML = ""; $(el.ch).className = "choices"; $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw();
      if (rd.kind === "share") {
        $(el.ask).innerHTML = esc(rd.ask) + " <b>What do you do?</b>";
        $(el.ch).className = "choices stack";
        $(el.ch).innerHTML = shuffle(rd.opts).map((x) => '<button type="button" class="choice text" data-give="' + x.give + '">' + esc(x.t) + "</button>").join("");
        sayHere(o.finish, rd.ask + " What do you do?");
      } else if (rd.kind === "work" || rd.kind === "idea") {
        /* an IDEA round is Stage 2's contribution (2Fc.01): the team is stuck
           and the child suggests what to do, rather than what to say */
        const q = rd.kind === "idea" ? "What do you suggest?" : "What do you say?";
        $(el.ask).innerHTML = "<b>" + esc(rd.situation) + "</b> " + q;
        $(el.ch).className = "choices stack";
        $(el.ch).innerHTML = shuffle(rd.opts).map((x, k) => '<button type="button" class="choice text" data-good="' + (x.good ? 1 : 0) + '" data-k="' + rd.opts.indexOf(x) + '">' + esc(x.t) + "</button>").join("");
        sayHere(o.finish, rd.situation + " " + q);
      } else if (rd.kind === "allocate") {
        /* an ALLOCATE round is Stage 3's cooperation (3Cc.01): the team gives
           out its jobs, and each job goes to the member who can do it */
        given = {}; ti = 0; draw();
        $(el.ask).innerHTML = "The team has jobs to give out. <b>" + esc(rd.tasks[0].t) + "</b>: who should do it? Tap the person.";
        sayHere(o.finish, "The team has jobs to give out. " + rd.tasks[0].t + ": who should do it? Tap the person.");
      } else if (rd.kind === "task") {
        /* a TASK round is Stage 2's cooperation (2Cc.01): the child carries
           out their own job, in order, and the shared outcome moves on */
        taskDone = []; taskOrder = shuffle(rd.steps.map((_, k) => k)); draw();
        $(el.ask).innerHTML = "<b>" + esc(f.name) + "</b> is waiting. Your job: <b>" + esc(rd.job) + "</b>. Tap the steps in order.";
        sayHere(o.finish, f.name + " is waiting. Your job: " + rd.job + ". Tap the steps in order.");
      } else {
        $(el.ask).innerHTML = "<b>" + esc(f.name) + "</b> did something for the team. Read it, then press the button.";
        sayHere(o.finish, f.name + " " + rd.did);
      }
    }
    function next() {
      r++;
      setTimeout(() => {
        if (r >= rounds.length) { reportScore(o.finish, score, rounds.filter((x) => x.kind !== "friend").length); endStep(o, "The team finished: " + o.goal + ". " + o.done); }
        else if (rounds[r].kind === "task" || rounds[r].kind === "allocate") { start(); }
        else start();
      }, 3400);
    }
    function friendDone() {
      if (lock) return;
      const rd = rounds[r], f = friend(rd.who);
      lock = true; log.push({ who: rd.who, text: rd.log || (f.name + " " + rd.did), pic: rd.pic || f.pic });
      grow(f.name + " helped: " + rd.did + " That is teamwork.");
      next();
    }
    $(el.stage).addEventListener("click", (e) => {
      const mb = e.target.closest("[data-m]");
      if (mb && !lock && rounds[r] && rounds[r].kind === "allocate") {
        const rd = rounds[r], t = rd.tasks[ti], m = rd.members.find((x) => x.id === mb.dataset.m);
        if ((m.skills || []).includes(t.needs)) {
          given[t.id] = m.name; ti++; SOUND.play("pop", 0.35); draw();
          const line = cheer() + " " + t.t + (m.id === "you" ? " goes to you, because you are good at " : " goes to " + m.name + ", who is good at ") + t.needs + ".";
          $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
          if (ti >= rd.tasks.length) {
            lock = true; if (!missed) score++;
            log.push({ who: "you", text: rd.log || "You gave every job to the right person.", pic: rd.pic || "\u{1F4CB}", missed: missed });
            setTimeout(() => { grow("Every job has the right person. " + (rd.why || "That is how a team gets a big job done.")); next(); }, 1400);
          } else { $(el.ask).innerHTML = "<b>" + esc(rd.tasks[ti].t) + "</b>: who should do it?"; sayHere(o.finish, rd.tasks[ti].t + ": who should do it?"); }
        } else {
          missed = true; mb.classList.add("wrong"); SOUND.play("error", 0.3);
          const line = (m.id === "you" ? "You are good at " : m.name + " is good at ") + (m.skills || []).join(" and ") + ", not " + t.needs + ". Who is good at " + t.needs + "?";
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
          setTimeout(() => mb.classList.remove("wrong"), 700);
        }
        return;
      }
      const tb = e.target.closest("[data-task]"); if (!tb || lock) return;
      const rd = rounds[r], f = friend(rd.who), k = Number(tb.dataset.task);
      if (k === taskDone.length) {
        taskDone.push(k); SOUND.play("pop", 0.35); draw();
        $(el.fb).className = "fb good"; $(el.fb).textContent = "Step " + taskDone.length + ": " + rd.steps[k].t + "."; say(rd.steps[k].t);
        if (taskDone.length === rd.steps.length) {
          lock = true; if (!missed) score++;
          log.push({ who: "you", text: rd.log || ("You " + lower1(rd.job)), pic: rd.pic || "\u{1F6E0}\ufe0f", missed: missed });
          setTimeout(() => { grow(cheer() + " Your job is done: " + rd.job + ". " + f.name + " can carry on now. " + (rd.why || "")); next(); }, 1200);
        }
      } else {
        missed = true; tb.classList.add("wrong"); SOUND.play("error", 0.3);
        const line = k < taskDone.length ? "You have done that one." : "Not yet. Something comes before " + rd.steps[k].t + ".";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => tb.classList.remove("wrong"), 700);
      }
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      const rd = rounds[r], f = friend(rd.who);
      if (rd.kind === "share") {
        const give = Number(b.dataset.give), mine = rd.you - give, theirs = give, need = rd.need;
        const both = mine >= need && theirs >= need;
        if (both) {
          lock = true; if (!missed) score++;
          $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
          log.push({ who: "you", text: rd.log || b.textContent, pic: rd.resource.pic, missed: missed });
          grow(cheer() + " You keep " + mine + " " + rd.resource.label + " and " + f.name + " has " + theirs + ". You both have enough. " + rd.why);
          next();
        } else {
          missed = true; b.classList.add("wrong"); b.disabled = true; SOUND.play("thud", 0.4);
          const line = mine < need && theirs < need ? "Now you have " + mine + " and " + f.name + " has " + theirs + ". Neither of you has enough. Try again."
            : mine < need ? "Now " + f.name + " has " + theirs + " but you have only " + mine + ". You cannot finish yours. Try again."
              : f.name + " has " + theirs + " " + rd.resource.label + ". " + f.name + " needs " + need + ". " + f.name + " is stuck. Try again.";
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        }
      } else if (rd.kind === "work" || rd.kind === "idea") {
        const opt = rd.opts[Number(b.dataset.k)];
        if (opt.good) {
          lock = true; if (!missed) score++;
          $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
          log.push({ who: "you", text: rd.log || opt.log || opt.t, pic: rd.pic || (rd.kind === "idea" ? "\u{1F4A1}" : "\u{1F91D}"), missed: missed });
          grow(cheer() + " " + rd.why);
          next();
        } else {
          missed = true; b.classList.add("wrong"); b.disabled = true; SOUND.play("error", 0.3);
          const line = opt.why || (rd.kind === "idea" ? "That idea would not get the team unstuck. What would?" : "That would not help " + f.name + ", and the job would stop. What would help?");
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        }
      }
    });
    start();
  }

  /* ---- who did what: my action, and a friend's (1Fc.01, 1Ft.01) -------
     Reads the team step's own log - what this child actually chose a
     few minutes ago - and asks first which of these YOU did, then what
     a named friend did. If the team step was skipped (a dot tapped
     straight here), the builder's fallback log stands in. */
  function contributions(o) {
    const el = o.el;
    const played = (window.__gpTeamLogs || {})[o.teamStep];
    const log = (played && played.length) ? played.slice() : o.fallback.slice();
    const cards = shuffle(log.map((x, k) => Object.assign({ k }, x)));
    const mine = log.filter((x) => x.who === "you").length;
    const friendsIn = o.friends.filter((f) => log.some((x) => x.who === f.id));
    const foundMine = new Set();
    let phase = "mine", fi = 0, right = 0, missed = 0, lock = false;
    const name = (who) => who === "you" ? "you" : (o.friends.find((f) => f.id === who) || { name: who }).name;
    const ideas = o.what === "idea";
    function draw() {
      const target = phase === "friend" ? friendsIn[fi] : null;
      $(el.stage).innerHTML = '<div class="stagewide"><p class="phase">' + (phase === "mine" ? (ideas ? "Which ideas were YOURS?" : "What did YOU do to help?") : phase === "friend" ? (ideas ? "Which idea was " + esc(target.name) + "'s?" : "What did " + esc(target.name) + " do to help?") : "Who did what") + "</p>" +
        '<div class="cardsgrid">' + cards.map((c) => '<button type="button" class="tapcard logcard' + (foundMine.has(c.k) ? " heard" : "") + (c.done ? " tried" : "") + '" data-k="' + c.k + '"' + (lock || c.done || (phase === "mine" && foundMine.has(c.k)) ? " disabled" : "") + '><span class="cpic" aria-hidden="true">' + small(c.pic) + "</span>" + esc(c.text) + "</button>").join("") + "</div></div>";
      $(el.score).textContent = phase === "mine" ? foundMine.size + " of " + mine + " things you did" : phase === "friend" ? "Friend " + (fi + 1) + " of " + friendsIn.length : "";
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".logcard"); if (!b || lock) return;
      const c = cards.find((x) => x.k === Number(b.dataset.k));
      if (phase === "mine") {
        if (c.who === "you") {
          foundMine.add(c.k); right++; SOUND.play("pop", 0.35); draw();
          const line = cheer() + " You did that: " + c.text;
          $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
          if (foundMine.size >= mine) {
            lock = true;
            setTimeout(() => {
              lock = false;
              if (friendsIn.length) { phase = "friend"; draw(); $(el.ask).innerHTML = "Now: " + (ideas ? "which idea was <b>" + esc(friendsIn[0].name) + "'s</b>?" : "what did <b>" + esc(friendsIn[0].name) + "</b> do to help the team?") + " Tap it."; sayHere(o.finish, "Now: " + (ideas ? "which idea was " + friendsIn[0].name + "'s?" : "what did " + friendsIn[0].name + " do to help the team?") + " Tap it."); }
              else finishUp();
            }, 2400);
          }
        } else {
          missed++; b.classList.add("wrong"); SOUND.play("error", 0.3);
          const line = "That was " + name(c.who) + ", not you. Which of these did YOU do?";
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
          setTimeout(() => b.classList.remove("wrong"), 700);
        }
      } else if (phase === "friend") {
        const f = friendsIn[fi];
        if (c.who === f.id) {
          c.done = true; right++; lock = true; SOUND.play("ding", 0.4); draw();
          const line = cheer() + " " + f.name + " helped the team: " + c.text;
          $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
          fi++;
          setTimeout(() => {
            lock = false;
            if (fi >= friendsIn.length) finishUp();
            else { draw(); $(el.ask).innerHTML = (ideas ? "And which idea was <b>" + esc(friendsIn[fi].name) + "'s</b>?" : "And what did <b>" + esc(friendsIn[fi].name) + "</b> do?"); sayHere(o.finish, ideas ? "And which idea was " + friendsIn[fi].name + "'s?" : "And what did " + friendsIn[fi].name + " do?"); }
          }, 2600);
        } else {
          missed++; b.classList.add("wrong"); SOUND.play("error", 0.3);
          const line = c.who === "you" ? "That was you. What did " + f.name + " do?" : "That was " + name(c.who) + ". What did " + f.name + " do?";
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
          setTimeout(() => b.classList.remove("wrong"), 700);
        }
      }
    });
    function finishUp() {
      phase = "done"; draw();
      reportScore(o.finish, right, right + missed);
      endStep(o, "You said what you did, and what a friend did, to finish the job together. " + o.done);
    }
    draw();
  }

  /* ---- look back: what I learned, what I liked (1Fv.01, 1Fl.01) -------
     With support, the framework says, so the support is on the page: the
     "I learned that..." cards are this lesson's own about lines mixed
     with a few things that were NOT today's lesson, and the "I liked..."
     cards are the lesson's own steps. Learning is checked against the
     lesson; liking is not checked at all - the child says which, and
     why, and hears it read back. */
  function lookBack(o) {
    const el = o.el;
    const learned = o.learned.map((x) => typeof x === "string" ? { t: x } : x);
    const pool = shuffle(learned.map((x, k) => ({ t: x.t, lesson: x.lesson, ok: true, k })).concat(o.not.map((t, k) => ({ t, ok: false, k: 1000 + k }))));
    const pick = Math.min(o.pick || 2, learned.length);
    const got = new Set();
    const changed = o.changed || [];
    let phase = "learned", liked = null, missed = 0, lock = false, before = null;
    function draw() {
      if (phase === "changed") {
        $(el.stage).innerHTML = '<div class="stagewide"><p class="phase">' + (before === null ? (o.scope === "course" ? "Before these lessons, I thought…" : "Before this lesson, I thought…") : "Now I think…") + '</p><div class="cardsgrid wide">' +
          (before === null ? changed.map((c, k) => '<button type="button" class="tapcard learncard" data-before="' + k + '">' + esc(c.before) + "</button>").join("")
            : shuffle(changed.map((c, k) => k)).map((k) => '<button type="button" class="tapcard learncard" data-after="' + k + '">' + esc(changed[k].after) + "</button>").join("")) + "</div></div>";
        $(el.score).textContent = before === null ? "Pick how one of your ideas changed" : "Now pick what you think now";
        return;
      }
      if (phase === "learned") {
        $(el.stage).innerHTML = '<div class="stagewide"><p class="phase">I learned to…</p><div class="cardsgrid wide">' + pool.map((c) => '<button type="button" class="tapcard learncard' + (got.has(c.k) ? " heard" : "") + '" data-k="' + c.k + '"' + (got.has(c.k) || lock ? " disabled" : "") + '>' + (c.lesson ? '<small>Lesson ' + c.lesson + "</small>" : "") + esc(lower1(c.ok ? mine(c.t) : c.t)) + "</button>").join("") + "</div></div>";
        $(el.score).textContent = got.size + " of " + pick + " things learned";
      } else if (phase === "liked") {
        $(el.stage).innerHTML = '<div class="stagewide"><p class="phase">' + (o.mode === "changed" ? "The kind of activity that helped me learn most was…" : o.mode === "helped" ? "The part that helped me learn most was…" : "I liked…") + '</p><div class="cardsgrid">' + o.liked.map((c, k) => '<button type="button" class="tapcard likecard' + (liked === k ? " now" : "") + '" data-l="' + k + '"><span class="cpic" aria-hidden="true">' + small(c.icon) + "</span>" + esc(c.title) + (c.lesson ? "<small>Lesson " + c.lesson + "</small>" : "") + "</button>").join("") + "</div></div>";
        $(el.score).textContent = o.mode === "helped" ? "Tap the part that helped you learn most" : "Tap the part you liked best";
      }
    }
    function becauses() {
      const lead = o.mode === "changed" ? "The kind of activity that helped you learn most was <b>" + esc(o.liked[liked].title) + "</b>. Why did it help? Tap a reason." : o.mode === "helped" ? "The part that helped you learn most was <b>" + esc(o.liked[liked].title) + "</b>. Why did it help? Tap a reason." : "You liked <b>" + esc(o.liked[liked].title) + "</b>. Why? Tap a reason.";
      $(el.ask).innerHTML = lead;
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(o.becauses).map((t) => '<button type="button" class="choice text" data-why="' + esc(t) + '">' + esc(t) + "</button>").join("");
      sayHere(o.finish, plain(lead));
    }
    $(el.stage).addEventListener("click", (e) => {
      const lc = e.target.closest(".learncard");
      if (lc && phase === "learned" && !lock) {
        const c = pool.find((x) => x.k === Number(lc.dataset.k));
        if (c.ok) {
          got.add(c.k); SOUND.play("pop", 0.35); draw();
          const line = "I learned to " + lower1(noDot(mine(c.t))) + ".";
          $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " " + line; say(cheer() + " " + line);
          reportAttempt(o.finish, got.size, pick, "things learned");
          if (got.size >= pick) {
            lock = true;
            setTimeout(() => {
              lock = false; $(el.fb).textContent = "";
              if (o.mode === "changed") { phase = "changed"; before = null; draw(); const q = "Now: how did one of your ideas <b>change</b>? Tap what you thought before."; $(el.ask).innerHTML = q; sayHere(o.finish, plain(q)); return; }
              phase = "liked"; draw(); const q = o.mode === "helped" ? "Now: which part <b>helped you learn</b> most? Tap it." : "Now: which part did you <b>like</b> best? Tap it."; $(el.ask).innerHTML = q; sayHere(o.finish, plain(q));
            }, 2600);
          }
        } else {
          missed++; lc.classList.add("wrong"); SOUND.play("error", 0.3);
          const line = "We did not do that" + (o.scope === "course" ? "" : " today") + ". Tap something you really did learn in " + (o.scope === "course" ? "these lessons" : "this lesson") + ".";
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
          setTimeout(() => lc.classList.remove("wrong"), 700);
        }
        return;
      }
      const bc = e.target.closest("[data-before]");
      if (bc && phase === "changed" && before === null) {
        before = Number(bc.dataset.before); SOUND.play("click", 0.3); draw();
        const q = "You thought: " + changed[before].before + " What do you think <b>now</b>? Tap it.";
        $(el.ask).innerHTML = q; sayHere(o.finish, plain(q));
        return;
      }
      const ac = e.target.closest("[data-after]");
      if (ac && phase === "changed" && before !== null) {
        const k = Number(ac.dataset.after);
        if (k === before) {
          SOUND.play("tada", 0.4);
          const sentence = "Before, I thought " + lower1(noDot(changed[k].before)) + ". Now I think " + lower1(noDot(changed[k].after)) + ".";
          sayLine(el, "You said: <b>" + esc(sentence) + "</b> That is an idea that changed.", "You said: " + sentence + " That is an idea that changed.");
          lock = true;
          setTimeout(() => { lock = false; phase = "liked"; draw(); $(el.fb).textContent = ""; const q = "Last: which <b>kind of activity</b> helped you learn most? Tap it."; $(el.ask).innerHTML = q; sayHere(o.finish, plain(q)); }, 3600);
        } else {
          missed++; ac.classList.add("wrong"); SOUND.play("error", 0.3);
          const line = "That is a different idea. You thought: " + changed[before].before + " What did that change into?";
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
          setTimeout(() => ac.classList.remove("wrong"), 700);
        }
        return;
      }
      const kc = e.target.closest(".likecard");
      if (kc && phase === "liked" && liked === null) {
        liked = Number(kc.dataset.l); SOUND.play("click", 0.3); draw();
        becauses();
      }
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || phase !== "liked" || liked === null) return;
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
      SOUND.play("tada", 0.4);
      const sentence = (o.mode === "changed" ? "The kind of activity that helped me learn most was " : o.mode === "helped" ? "The part that helped me learn most was " : "I liked ") + o.liked[liked].title + ", " + b.dataset.why + ".";
      sayLine(el, "You said: <b>" + esc(sentence) + "</b>", "You said: " + sentence);
      reportScore(o.finish, pick, pick + missed);
      setTimeout(() => endStep(o), 3200);
    });
    draw();
  }

  /* ==================================================================
     COMMUNICATION - answering with relevant information, and listening.
     ================================================================== */

  /* ---- answer the question with relevant information (1Mi.01) --------
     A classmate asks; three answers, all true, all in a child's voice.
     Only one is ABOUT the question, and the tag decides which. A wrong
     pick says what that answer was about instead. */
  function relevantAnswer(o) {
    const el = o.el, rounds = o.rounds, asker = o.asker || { name: "Your friend", pic: "\u{1F9D2}" };
    let r = 0, right = 0, missed = false, lock = false;
    function draw() {
      const rd = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide"><div class="person"><span class="ppic" aria-hidden="true">' + small(rd.asker ? rd.asker.pic : asker.pic) + '</span><div><b>' + esc(rd.asker ? rd.asker.name : asker.name) + ' asks:</b><p class="pbubble">“' + esc(rd.ask) + "”</p></div>" + (rd.pic ? '<span class="cpic" aria-hidden="true">' + small(rd.pic) + "</span>" : "") + "</div></div>";
      $(el.score).textContent = "Question " + (r + 1) + " of " + rounds.length;
    }
    function start() {
      const rd = rounds[r];
      lock = false; missed = false;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw();
      $(el.ask).innerHTML = "<b>" + esc(rd.ask) + "</b> Which answer tells " + esc(rd.asker ? rd.asker.name : asker.name) + " what they asked?";
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(rd.opts).map((x) => '<button type="button" class="choice text" data-about="' + esc(x.about) + '">' + (x.pic ? '<span class="cpic" aria-hidden="true">' + small(x.pic) + "</span> " : "") + esc(x.t) + "</button>").join("");
      sayHere(o.finish, (rd.asker ? rd.asker.name : asker.name) + " asks: " + rd.ask + " Which answer tells them what they asked?");
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      const rd = rounds[r];
      if (b.dataset.about === rd.about) {
        lock = true; if (!missed) right++;
        $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
        SOUND.play("ding", 0.4);
        const line = cheer() + " " + rd.why;
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        r++;
        setTimeout(() => {
          if (r >= rounds.length) { reportScore(o.finish, right, rounds.length); endStep(o, "You answered " + rounds.length + " questions with the information that was asked for. " + o.done); }
          else start();
        }, 3000);
      } else {
        missed = true; b.classList.add("wrong"); b.disabled = true; SOUND.play("error", 0.3);
        const line = "That answer is about " + (b.dataset.about || "something else") + ". " + (rd.asker ? rd.asker.name : asker.name) + " asked about " + rd.about + ". Try another.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    });
    start();
  }

  /* ---- listen to a classmate, then ask them a simple question about
     what they said (1Ml.01) ----------------------------------------
     The talk is heard line by line before any question is offered - a
     child who has not listened cannot pick, because the buttons are not
     there yet. The right question is the one whose tag is one of the
     talk's topics. */
  function listenAsk(o) {
    const respond = (o.rounds || []).some((rd) => (rd.opts || []).some((x) => (rd.topics || []).includes(x.about) && !/\?\s*$/.test(x.t)));
    const el = o.el, rounds = o.rounds;
    let r = 0, shown = 0, phase = "listen", right = 0, missed = false, lock = false, timer = null;
    function draw() {
      const rd = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide"><div class="person talker"><span class="ppic" aria-hidden="true">' + small(rd.speaker.pic) + '</span><div><b>' + esc(rd.speaker.name) + (phase === "listen" ? " is going to talk." : " said:") + "</b>" +
        '<div class="talk">' + rd.talk.slice(0, shown).map((t, k) => '<p class="talkline' + (k === shown - 1 && phase === "listen" ? " now" : "") + '">' + esc(t) + "</p>").join("") + "</div></div></div>" +
        (phase === "listen" && shown === 0 ? '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'go">\u{1F442} Listen to ' + esc(rd.speaker.name) + "</button></div>" : "") +
        (phase === "ask" ? '<div class="bigbtns"><button type="button" class="big small ghost" id="' + el.stage + 'again">\u{1F50A} Hear it again</button></div>' : "") + "</div>";
      $(el.score).textContent = "Talk " + (r + 1) + " of " + rounds.length;
      const go = $(el.stage + "go"); if (go) go.addEventListener("click", listen);
      const ag = $(el.stage + "again"); if (ag) ag.addEventListener("click", () => say(rd.talk.join(" ")));
    }
    function start() {
      phase = "listen"; shown = 0; lock = false; missed = false;
      $(el.ch).innerHTML = ""; $(el.ch).className = "choices"; $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw();
      const then = respond ? "Then respond with an idea or a question about what they said." : "Then ask a question about what they said.";
      $(el.ask).innerHTML = "Listen to <b>" + esc(rounds[r].speaker.name) + "</b>. " + then;
      sayHere(o.finish, "Listen to " + rounds[r].speaker.name + ". " + then + " Press Listen.");
    }
    function listen() {
      if (lock) return;
      lock = true;
      const rd = rounds[r];
      shown = 1; draw(); say(rd.talk.join(" "));
      const tick = () => {
        if (shown < rd.talk.length) { shown++; draw(); timer = setTimeout(tick, 2600); }
        else { timer = null; afterVoice(askPhase); }
      };
      timer = setTimeout(tick, 2600);
    }
    function askPhase() {
      const rd = rounds[r];
      phase = "ask"; lock = false; draw();
      $(el.ask).innerHTML = respond ? "Now respond to <b>" + esc(rd.speaker.name) + "</b> with an idea or a question about what they said. Tap one."
        : "Now ask <b>" + esc(rd.speaker.name) + "</b> a question about what they said. Tap one.";
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(rd.opts).map((x) => '<button type="button" class="choice text" data-about="' + esc(x.about) + '">' + esc(x.t) + "</button>").join("");
      reportAttempt(o.finish, r + 1, rounds.length, "talks");
      sayHere(o.finish, respond ? "Now respond to " + rd.speaker.name + " with an idea or a question about what they said. Tap one."
        : "Now ask " + rd.speaker.name + " a question about what they said. Tap one.");
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock || phase !== "ask") return;
      const rd = rounds[r];
      if ((rd.topics || []).includes(b.dataset.about)) {
        lock = true; if (!missed) right++;
        $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
        SOUND.play("ding", 0.4);
        const line = cheer() + (/\?\s*$/.test(b.textContent) ? " You asked: " : " You said: ") + b.textContent + " " + rd.why + (rd.reply ? " " + rd.speaker.name + " says: " + rd.reply : "");
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        r++;
        setTimeout(() => {
          if (r >= rounds.length) { reportScore(o.finish, right, rounds.length); endStep(o, "You listened to " + rounds.length + " classmates and " + (respond ? "responded to each one about what they said. " : "asked each one a question about what they said. ") + o.done); }
          else start();
        }, 4000);
      } else {
        missed = true; b.classList.add("wrong"); b.disabled = true; SOUND.play("error", 0.3);
        const line = rd.speaker.name + " did not say anything about " + (b.dataset.about || "that") + ". Ask about what they DID say.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    });
    start();
  }


  /* ---- locate information in a short text (2Ri.01) ----------------------
     A few sentences a child can read, each a button. The question asks
     which sentence tells us something; the child taps it. The skill is
     finding the ONE sentence that answers, not remembering the text. */
  function textSource(o) {
    const el = o.el, lines = o.lines, rounds = o.rounds;
    let r = 0, right = 0, missed = false, lock = false;
    function draw(hit) {
      $(el.stage).innerHTML = '<div class="stagewide"><div class="textsrc"><p class="phase">' + esc(o.title || "Read it") + "</p>" +
        lines.map((t, k) => '<button type="button" class="sline' + (hit === k ? " right" : "") + '" data-k="' + k + '"' + (lock ? " disabled" : "") + ">" + esc(t) + "</button>").join("") +
        '</div><div class="bigbtns"><button type="button" class="big small ghost" id="' + el.stage + 'read">\u{1F50A} Read it to me</button></div></div>';
      $(el.score).textContent = "Question " + (Math.min(r + 1, rounds.length)) + " of " + rounds.length;
      $(el.stage + "read").addEventListener("click", () => say(lines.join(" ")));
    }
    function start() {
      lock = false; missed = false; draw(-1);
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.ask).innerHTML = "<b>" + esc(rounds[r].ask) + "</b> Tap the sentence that tells us.";
      sayHere(o.finish, rounds[r].ask + " Tap the sentence that tells us.");
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".sline"); if (!b || lock) return;
      const rd = rounds[r], k = Number(b.dataset.k);
      if (k === rd.line) {
        lock = true; if (!missed) right++;
        SOUND.play("ding", 0.4); draw(k);
        const line = cheer() + " " + lines[k] + " " + rd.why;
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        r++;
        setTimeout(() => {
          if (r >= rounds.length) {
            if (o.then) { lock = true; draw(-1); $(el.fb).textContent = ""; askOnce(o, o.then, (ok) => { reportScore(o.finish, right + (ok ? 1 : 0), rounds.length + 1); endStep(o); }); }
            else { reportScore(o.finish, right, rounds.length); endStep(o, "You found the sentence that answers " + rounds.length + " questions. " + o.done); }
          }
          else start();
        }, 3400);
      } else {
        missed = true; b.classList.add("wrong"); SOUND.play("error", 0.3);
        const line = "That sentence says: " + lines[k] + " It does not tell us " + lower1(noDot(rd.about || rd.ask)) + ". Look again.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    ONSHOW[o.finish] = (function () { let said = false; return () => { if (said) return; said = true; afterVoice(() => sayHere(o.finish, lines.join(" ") + " " + rounds[0].ask + " Tap the sentence that tells us.")); }; })();
    start();
  }


  /* ---- observe and count (3Rc.01) ---------------------------------------
     A scene full of things. Each round names one KIND to count; the child
     taps every one of that kind, and each tap is one more in the row. A
     tap on the wrong kind says what it is. The table fills from what was
     tapped, and the count is computed from the scene by the builder and
     the gate, never authored. */
  function observeCount(o) {
    const el = o.el, scene = o.scene, rounds = o.rounds;
    const counts = {}; rounds.forEach((r) => { counts[r.kind] = 0; });
    const tapped = new Set();
    let r = 0, missed = 0, right = 0, lock = false;
    function tableHtml() {
      return '<div class="picto"><p class="pictotitle">' + esc(o.title) + "</p>" + rounds.map((x, k) =>
        '<div class="pictorow' + (k === r ? " now" : "") + '"><span class="rowlab">' + small(x.pic) + " " + esc(x.label) + '</span><span class="pictocells">' + '<span class="pcell" aria-hidden="true">' + small(x.pic) + "</span>".repeat(counts[x.kind]) + '</span><b class="pcount">' + counts[x.kind] + "</b></div>").join("") + "</div>";
    }
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide"><div class="scene" id="' + el.stage + 'sc">' + scene.map((it, k) =>
        '<button type="button" class="glyph' + (tapped.has(k) ? " got" : "") + '" data-k="' + k + '" aria-label="' + esc(it.label) + '"' + (tapped.has(k) || lock || r >= rounds.length ? " disabled" : "") + ">" + small(it.pic) + "</button>").join("") + "</div>" + tableHtml() + "</div>";
      $(el.score).textContent = r < rounds.length ? "Counting " + rounds[r].label.toLowerCase() + ": " + counts[rounds[r].kind] + " so far" : "";
    }
    function start() {
      lock = false; draw();
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.ask).innerHTML = esc(rounds[r].ask || "Count the " + rounds[r].label.toLowerCase() + ". Tap each one.");
      sayHere(o.finish, rounds[r].ask || "Count the " + rounds[r].label.toLowerCase() + ". Tap each one.");
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".glyph"); if (!b || lock || r >= rounds.length) return;
      const k = Number(b.dataset.k), it = scene[k], rd = rounds[r];
      if (it.kind === rd.kind) {
        tapped.add(k); counts[rd.kind]++; SOUND.play("pop", 0.35); draw();
        const left = scene.filter((x, j) => x.kind === rd.kind && !tapped.has(j)).length;
        $(el.fb).className = "fb good"; $(el.fb).textContent = counts[rd.kind] + (left ? "" : ". That is all of them.");
        say(String(counts[rd.kind]) + (left ? "" : ". That is all of them. " + rd.label + ": " + counts[rd.kind] + "."));
        if (!left) {
          lock = true; right++;
          r++;
          setTimeout(() => {
            if (r >= rounds.length) { reportScore(o.finish, right, right + missed); endStep(o, "You observed and counted " + rounds.length + " kinds of thing, and recorded every count. " + o.done); }
            else start();
          }, 2600);
        }
      } else {
        missed++; b.classList.add("wrong"); SOUND.play("error", 0.3);
        const line = "That is " + it.label + ", not " + (rd.one || "one of the " + rd.label.toLowerCase()) + ". Count only the " + rd.label.toLowerCase() + ".";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    start();
  }

  /* ---- strengths and limitations of my own teamwork (3Fc.01) -----------
     Reads the team step's log of what THIS child did, with a flag for
     every round that took more than one go. What went right first time is
     a strength; what took two goes is a limitation - both from the child's
     own play, not from an authored claim. A child who got everything first
     time is told so and picks something they could still do better. Then
     one question about what working together made possible (3Ft.01). */
  function strengthsLimits(o) {
    const el = o.el;
    const played = (window.__gpTeamLogs || {})[o.teamStep];
    const log = (played && played.length ? played : o.fallback).filter((x) => x.who === "you");
    const strengths = log.filter((x) => !x.missed), limits = log.filter((x) => x.missed);
    const found = new Set();
    let phase = "strong", right = 0, missed = 0, lock = false;
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide"><p class="phase">' + (phase === "strong" ? "What did you do WELL, first time?" : phase === "limit" ? "What took you more than one go?" : phase === "pick" ? "What could you do better next time?" : "Your teamwork") + "</p>" +
        (phase === "pick" ? '<div class="cardsgrid wide">' + o.limits.map((t, k) => '<button type="button" class="tapcard learncard" data-lim="' + k + '">' + esc(t) + "</button>").join("") + "</div>"
          : '<div class="cardsgrid">' + log.map((x, k) => '<button type="button" class="tapcard logcard' + (found.has(k) ? " heard" : "") + '" data-k="' + k + '"' + (found.has(k) || lock ? " disabled" : "") + '><span class="cpic" aria-hidden="true">' + small(x.pic) + "</span>" + esc(x.text) + (found.has(k) ? "<small>" + (x.missed ? "took two goes" : "first time") + "</small>" : "") + "</button>").join("") + "</div>") + "</div>";
      $(el.score).textContent = phase === "strong" ? found.size + " of " + strengths.length + " strengths" : phase === "limit" ? "Find " + limits.length : "";
    }
    function toLimits() {
      if (limits.length) {
        phase = "limit"; draw();
        $(el.ask).innerHTML = "Now the honest part. Which of these took you <b>more than one go</b>? Tap it.";
        sayHere(o.finish, "Now the honest part. Which of these took you more than one go? Tap it.");
      } else {
        phase = "pick"; draw();
        $(el.ask).innerHTML = "You got <b>every one first time</b>. Even so, a good team member can always do better. What could you do better next time? Tap one.";
        sayHere(o.finish, "You got every one first time. Even so, a good team member can always do better. What could you do better next time? Tap one.");
      }
    }
    function finishUp(line) {
      if (o.then) { $(el.fb).textContent = ""; askOnce(o, o.then, (ok) => { reportScore(o.finish, right + (ok ? 1 : 0), right + missed + 1); endStep(o); }); }
      else { reportScore(o.finish, right, right + missed); endStep(o, line); }
    }
    $(el.stage).addEventListener("click", (e) => {
      const lb = e.target.closest("[data-lim]");
      if (lb && phase === "pick") {
        phase = "done"; SOUND.play("tada", 0.4);
        sayLine(el, "You said: <b>next time I could " + esc(lower1(noDot(o.limits[Number(lb.dataset.lim)]))) + ".</b> Knowing that is a strength too.", "You said: next time I could " + lower1(noDot(o.limits[Number(lb.dataset.lim)])) + ". Knowing that is a strength too.");
        setTimeout(() => finishUp("You looked at what you did well and what you could do better. " + o.done), 3200);
        return;
      }
      const b = e.target.closest(".logcard"); if (!b || lock || phase === "pick" || phase === "done") return;
      const k = Number(b.dataset.k), x = log[k];
      const want = phase === "strong" ? !x.missed : x.missed;
      if (want) {
        found.add(k); right++; SOUND.play("pop", 0.35); draw();
        const line = phase === "strong" ? cheer() + " " + x.text + " First time. That is a strength." : "Yes. " + x.text + " That took two goes. Knowing it is how you get better.";
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        const done = phase === "strong" ? strengths.every((s) => found.has(log.indexOf(s))) : limits.every((s) => found.has(log.indexOf(s)));
        if (done) {
          lock = true;
          setTimeout(() => { lock = false; if (phase === "strong") toLimits(); else { phase = "done"; draw(); finishUp("You said what you did well, and what took more than one go. " + o.done); } }, 2600);
        }
      } else {
        missed++; b.classList.add("wrong"); SOUND.play("error", 0.3);
        const line = phase === "strong" ? "That one took you more than one go. Look for what you got right first time." : "That one you got first time. Look for the one that took two goes.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    draw();
  }

  /* ==================================================================
     THE UNIT SHELL - the steps drawn AROUND every lesson (owner,
     2026-09-10, for every standalone build), the furniture the English
     Grade 1 build carries around a unit: what it is about, a lecture,
     the words, games, things to do at home, a placeholder for Our world,
     and the student-resources drawer. _shell.py decides where they sit
     and what they carry; these only draw. Lifted from the Computing kit
     with the subject's words changed and nothing else.

     Three of them tick themselves off - the overview when the learner
     moves on from it, Our world on arrival, the drawer on first opening,
     and never while the page is drawing (see ONLEAVE) - for the reason the English
     build's plan step records: a page you have to finish before the
     lesson will open is a lock on the front door. Everything else is
     earned.
     ================================================================== */

  /* ---- what this lesson is about ---- */
  function unitOverview(o) {
    const el = o.el;
    const c = o.counts || {};
    const bits = [];
    if (c.steps) bits.push(c.steps + " steps");
    if (c.words) bits.push(c.words + " big words");
    if (c.games) bits.push(c.games + " games");
    if (c.home) bits.push(c.home + " things to find out at home");
    $(el.stage).className = "stagewide";
    $(el.stage).innerHTML =
      '<div class="ovw">' +
      (bits.length ? '<p class="ovw-bits">' + bits.map((b) => "<span>" + esc(b) + "</span>").join("") + "</p>" : "") +
      '<h3 class="ovw-h">By the end of this lesson you will be able to&hellip;</h3>' +
      '<ol class="ovw-list">' + (o.about || []).map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>" +
      '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'r">&#128266; Read it to me</button></div></div>';
    $(el.score).textContent = (o.about || []).length + " things to learn";
    $(el.stage + "r").addEventListener("click", () =>
      say("By the end of this lesson you will be able to. " + (o.about || []).join(". ")));
    /* ticks when the learner moves on - see ONLEAVE */
    ONLEAVE[o.finish] = () => finish(o.finish);
  }

  /* ---- the unit lecture: the lesson told in parts, by the voice ---- */
  function lecture(o) {
    const el = o.el;
    const parts = o.parts || [];
    let k = 0, furthest = 0;
    const id = el.stage + "l";
    function paint() {
      const p = parts[k];
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML =
        '<div class="lec">' +
        '<p class="phase">Part ' + (k + 1) + " of " + parts.length + "</p>" +
        picHtml(p.pic, "pic lecpic") +
        '<h3 class="lec-h">' + esc(p.title) + "</h3>" +
        '<p class="lec-p">' + esc(p.say) + "</p>" +
        '<div class="bigbtns">' +
        '<button type="button" class="big small teal" id="' + id + 'hear">&#128266; Listen</button>' +
        (k > 0 ? '<button type="button" class="big small ghost" id="' + id + 'back">&#9664; Last part</button>' : "") +
        '<button type="button" class="big small" id="' + id + 'next">' + (k + 1 < parts.length ? "Next part &#9654;" : "I heard it all &#10003;") + "</button>" +
        "</div>" +
        '<p class="lec-note">Read aloud by the lesson\'s voice. There is no video for this lesson yet.</p>' +
        "</div>";
      furthest = Math.max(furthest, k + 1);
      reportAttempt(o.finish, furthest, parts.length, "parts");
      $(el.score).textContent = furthest + " of " + parts.length + " parts heard";
      $(id + "hear").addEventListener("click", () => say(p.title + ". " + p.say));
      if (k > 0) $(id + "back").addEventListener("click", () => { k--; paint(); sayHere(o.finish, parts[k].title + ". " + parts[k].say); });
      $(id + "next").addEventListener("click", () => {
        if (k + 1 < parts.length) { k++; paint(); sayHere(o.finish, parts[k].title + ". " + parts[k].say); }
        else {
          $(el.fb).className = "fb good"; $(el.fb).textContent = o.done;
          reportAttempt(o.finish, parts.length, parts.length, "parts");
          finish(o.finish, o.done);
        }
      });
    }
    if (!parts.length) return;
    paint();
    ONSHOW[o.finish] = () => afterVoice(() => sayHere(o.finish, parts[k].title + ". " + parts[k].say));
  }

  /* ---- the big words: hear each one, then show you know them ---- */
  function bigWords(o) {
    const el = o.el;
    const items = o.items || [];
    const heard = new Set();
    let open = -1;
    const id = el.stage + "w";

    function paintGrid() {
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML =
        '<div class="cardsgrid words" id="' + id + 'g">' + items.map((w, k) =>
          '<button type="button" class="tapcard wordcard' + (heard.has(k) ? " heard" : "") + (open === k ? " now" : "") + '" data-k="' + k + '">' +
          '<span class="cpic" aria-hidden="true">' + small(w.pic) + "</span>" + esc(w.w) + "</button>").join("") + "</div>" +
        '<div class="wordpanel" id="' + id + 'p"' + (open < 0 ? " hidden" : "") + "></div>";
      if (open >= 0) paintPanel();
      $(el.score).textContent = heard.size + " of " + items.length + " heard";
      reportAttempt(o.finish, heard.size, items.length, "words");
      $(id + "g").addEventListener("click", (e) => {
        const b = e.target.closest(".wordcard"); if (!b) return;
        open = Number(b.dataset.k); heard.add(open);
        paintGrid();
        const w = items[open];
        say(w.w + ". " + w.meaning + " " + (w.uses[0] || ""));
        if (heard.size === items.length) {
          $(el.fb).className = "fb good";
          $(el.fb).textContent = "You have heard every word. Now, which word is which?";
          $(el.ch).innerHTML = '<button type="button" class="big small" id="' + id + 'go">Show I know them &#9654;</button>';
          $(id + "go").addEventListener("click", () => { $(el.ch).innerHTML = ""; $(el.fb).textContent = ""; check(); });
        }
      });
    }
    function paintPanel() {
      const w = items[open];
      $(id + "p").hidden = false;
      $(id + "p").innerHTML =
        '<div class="wp-head">' + picHtml(w.pic, "pic mid") + '<div><p class="wp-word">' + esc(w.w) + "</p>" +
        '<p class="wp-meaning">' + esc(w.meaning) + "</p></div></div>" +
        '<p class="wp-uses-h">Use it</p><ul class="wp-uses">' + (w.uses || []).map((u) => "<li>" + esc(u) + "</li>").join("") + "</ul>" +
        '<div class="bigbtns"><button type="button" class="big small teal" id="' + id + 'h">&#128266; Hear it again</button></div>';
      $(id + "h").addEventListener("click", () => say(w.w + ". " + w.meaning + " " + (w.uses || []).join(" ")));
    }

    /* the check: which word means this? */
    function check() {
      const order = shuffle(items.map((_, k) => k));
      let i = 0, right = 0, lock = false;
      const known = [];
      function draw() {
        lock = false;
        const k = order[i], w = items[k];
        const others = shuffle(items.map((_, j) => j).filter((j) => j !== k)).slice(0, Math.min(2, items.length - 1));
        const opts = shuffle([k].concat(others));
        $(el.ask).innerHTML = "Which word means: <b>" + esc(w.meaning) + "</b>";
        $(el.stage).className = "stagewide";
        $(el.stage).innerHTML = "";
        $(el.ch).className = "wordbtns";
        $(el.ch).innerHTML = opts.map((j) =>
          '<button type="button" class="wordbtn" data-ok="' + (j === k ? 1 : 0) + '" data-j="' + j + '">' +
          '<span class="pic" aria-hidden="true">' + small(items[j].pic) + "</span>" + esc(items[j].w) + "</button>").join("");
        $(el.fb).textContent = ""; $(el.fb).className = "fb";
        $(el.score).textContent = "Word " + (i + 1) + " of " + items.length;
        sayHere(o.finish, "Which word means: " + w.meaning);
      }
      $(el.ch).addEventListener("click", (e) => {
        const b = e.target.closest(".wordbtn"); if (!b || lock) return;
        lock = true;
        const ok = b.dataset.ok === "1", w = items[order[i]];
        $(el.ch).querySelectorAll(".wordbtn").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
        if (!ok) b.classList.add("wrong"); else { right++; known.push(w.w); }
        const msg = ok ? cheer() + " " + w.w + "." : "That word is " + w.w + ". " + w.meaning;
        $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = msg; say(msg);
        i++;
        setTimeout(() => {
          if (i >= items.length) {
            $(el.ch).innerHTML = ""; $(el.ch).className = "choices";
            $(el.ask).innerHTML = "You know " + right + " of " + items.length + " big words.";
            $(el.fb).className = "fb good"; $(el.fb).textContent = "You got " + right + " of " + items.length + ". " + o.done;
            $(el.score).textContent = "";
            reportScore(o.finish, right, items.length);
            if (known.length) reportKnown(known);
            finish(o.finish, o.done);
          } else draw();
        }, 2400);
      });
      draw();
    }
    paintGrid();
  }

  /* ---- Our world: a placeholder that says it is one ---- */
  function ourWorld(o) {
    const el = o.el;
    $(el.stage).className = "stagewide";
    $(el.stage).innerHTML =
      '<div class="world"><div class="pic" aria-hidden="true">\u{1F30D}</div>' +
      '<h3 class="lec-h">Our world is being built</h3>' +
      '<p class="lec-p">This part of <b>' + esc(o.title || "the lesson") + "</b> is not here yet. When it is, it will show:</p>" +
      '<ul class="ovw-list">' + (o.soon || []).map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>" +
      '<p class="lec-note">Nothing to do here. It ticks itself off.</p></div>';
    $(el.score).textContent = "coming soon";
    /* ticks on arrival, never while drawing - see ONLEAVE. Silent, because a
       resume can land here and a resume is not a moment to talk. */
    ONSHOW[o.finish] = () => finish(o.finish);
  }

  /* ---- the game zone: the lesson's own games, derived by the builder ---- */
  function gameZone(o) {
    const el = o.el;
    const games = o.games || [];
    const played = new Set();
    const NEEDED = Math.min(o.mastery || 2, games.length);
    const id = el.stage + "gz";
    const tidy = (s) => String(s).replace(/\s+/g, " ").trim().toLowerCase();

    function drawShelf() {
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="shelf gamelist" id="' + id + '">' + games.map((g, k) =>
        '<div class="bookcard gamecard' + (played.has(g.id) ? " played" : "") + '">' +
        '<span class="bookicon" aria-hidden="true">' + (played.has(g.id) ? "✅" : "\u{1F3AE}") + "</span>" +
        '<span class="booktitle">' + esc(g.title) + "</span>" +
        (g.skill ? '<span class="bookmeta">' + esc(g.skill) + "</span>" : "") +
        '<span class="bookmeta">' + g.rounds.length + " rounds</span>" +
        '<button type="button" class="big small teal" data-game="' + k + '">' + (played.has(g.id) ? "Play again ▶" : "Play ▶") + "</button></div>").join("") + "</div>";
      $(id).addEventListener("click", (e) => {
        const b = e.target.closest("[data-game]");
        if (b) openGame(games[Number(b.dataset.game)]);
      });
      const left = Math.max(0, NEEDED - played.size);
      $(el.score).textContent = games.length + " games";
      $(el.fb).className = "fb" + (left ? "" : " good");
      $(el.fb).textContent = left
        ? "Play " + left + (left === 1 ? " more game" : " games") + " to earn this step's sticker."
        : "You played " + played.size + ". " + o.done;
    }

    function openGame(game) {
      let r = 0, right = 0;
      const overlay = document.createElement("div");
      overlay.className = "book-reader game-overlay";
      document.body.appendChild(overlay);
      function close() { overlay.remove(); document.removeEventListener("keydown", onKey); try { VOICE.stop(); } catch (_) { /* nothing */ } drawShelf(); }
      function onKey(e) { if (e.key === "Escape") close(); }
      document.addEventListener("keydown", onKey);

      function frame(bodyHtml, footHtml) {
        overlay.innerHTML =
          '<div class="book-reader-top"><span class="booktitle">' + esc(game.title) + "</span>" +
          '<button type="button" class="book-close" aria-label="Close the game">&#10005;</button></div>' +
          '<div class="book-stage-wrap"><div class="game-stage">' + bodyHtml + "</div></div>" +
          '<div class="book-reader-bottom">' +
          '<button type="button" class="big small ghost" id="gameQuit">&#9664; Back to games</button>' +
          '<span class="book-page-count">Round ' + Math.min(r + 1, game.rounds.length) + " of " + game.rounds.length + "</span>" +
          (footHtml || "") + "</div>";
        overlay.querySelector(".book-close").addEventListener("click", close);
        overlay.querySelector("#gameQuit").addEventListener("click", close);
      }
      function nextRound() { r++; if (r >= game.rounds.length) return endGame(); setTimeout(drawRound, 1000); }
      function endGame() {
        played.add(game.id);
        reportScore(o.finish, right, game.rounds.length, game.id, game.title);
        reportAttempt(o.finish, played.size, games.length, "games");
        const well = right * 2 >= game.rounds.length;
        frame('<div class="game-done"><p class="gamebig">' + (well ? cheer() : "That is the game played.") + "</p>" +
          "<p>You finished <strong>" + esc(game.title) + "</strong>: " + right + " of " + game.rounds.length + " right.</p>" +
          "<p>Getting one wrong costs nothing in a game. It is for practising.</p></div>",
          '<button type="button" class="big small" id="gameOut">Back to the games &#10003;</button>');
        overlay.querySelector("#gameOut").addEventListener("click", close);
        say("You finished " + game.title + ". " + right + " of " + game.rounds.length + " right.");
        if (played.size >= NEEDED) finish(o.finish, o.done);
      }
      function feedback(ok, message) {
        const fb = overlay.querySelector("#gameFb"); if (!fb) return;
        fb.className = "fb " + (ok ? "good" : "bad"); fb.textContent = message; say(message);
      }
      function drawRound() {
        const round = game.rounds[r];
        if (game.type === "spelling") return drawSpelling(round);
        if (game.type === "pairs") return drawPairs(round);
        return drawChoice(round);
      }
      function drawChoice(round) {
        frame('<p class="gameprompt">' + esc(round.prompt) + "</p>" +
          '<div class="bigbtns" id="gameCh">' + shuffle(round.choices).map((c) =>
            '<button type="button" class="choice" data-c="' + esc(c) + '">' + esc(c) + "</button>").join("") +
          "</div><div class='fb' id='gameFb' role='status' aria-live='polite' aria-atomic='true'></div>");
        say(plain(round.prompt));
        let lock = false;
        overlay.querySelector("#gameCh").addEventListener("click", (e) => {
          const b = e.target.closest(".choice"); if (!b || lock) return;
          lock = true;
          const ok = tidy(b.dataset.c) === tidy(round.answer);
          overlay.querySelectorAll("#gameCh .choice").forEach((c) => { c.disabled = true; if (tidy(c.dataset.c) === tidy(round.answer)) c.classList.add("right"); });
          if (!ok) b.classList.add("wrong"); else right++;
          feedback(ok, (ok ? cheer() + " " : "") + (round.explanation || round.answer));
          nextRound();
        });
      }
      function drawSpelling(round) {
        const answer = String(round.answer);
        const letters = answer.replace(/[^A-Za-z]/g, "").split("");
        const extra = "abcdefghijklmnopqrstuvwxyz".split("").filter((c) => !letters.includes(c));
        const pool = shuffle(letters.concat([extra[letters.length % extra.length], extra[(letters.length + 7) % extra.length]]));
        let line = [];
        function paint() {
          frame('<p class="gameprompt">' + esc(round.prompt) + "</p>" +
            (round.clue ? '<p class="gameclue">' + esc(round.clue) + "</p>" : "") +
            '<div class="buildline" id="gameLine">' +
            (line.length ? line.map((t, k) => '<button type="button" class="tile letter" data-line="' + k + '">' + esc(pool[t]) + "</button>").join("")
              : '<span class="hint">Tap the letters to build the word.</span>') + "</div>" +
            '<div class="bigbtns" id="gameTiles">' + pool.map((t, k) =>
              '<button type="button" class="tile letter" data-tile="' + k + '"' + (line.includes(k) ? " disabled" : "") + ">" + esc(t) + "</button>").join("") +
            "</div><div class='fb' id='gameFb' role='status' aria-live='polite' aria-atomic='true'></div>",
            '<button type="button" class="big small" id="gameCheck">Check it</button>');
          overlay.querySelector("#gameTiles").addEventListener("click", (e) => {
            const b = e.target.closest("[data-tile]"); if (!b || b.disabled) return;
            line.push(Number(b.dataset.tile)); paint();
          });
          overlay.querySelector("#gameLine").addEventListener("click", (e) => {
            const b = e.target.closest("[data-line]"); if (!b) return;
            line.splice(Number(b.dataset.line), 1); paint();
          });
          overlay.querySelector("#gameCheck").addEventListener("click", () => {
            const got = line.map((k) => pool[k]).join("");
            const ok = got.toLowerCase() === letters.join("").toLowerCase();
            overlay.querySelector("#gameLine").className = "buildline " + (ok ? "right" : "wrong");
            if (ok) right++;
            feedback(ok, ok ? cheer() + " " + answer : "Not yet. The word is " + answer + ".");
            nextRound();
          });
        }
        paint();
        say(plain(round.prompt) + " " + plain(round.clue || ""));
      }
      function drawPairs(round) {
        let tiles = round.pairs.flatMap((p, pi) => [{ text: p[0], pair: pi }, { text: p[1], pair: pi }]);
        tiles = shuffle(tiles).map((t, k) => Object.assign({}, t, { k }));
        let picked = [], matched = 0, lock = false;
        frame('<p class="gameprompt">' + esc(round.prompt || "Tap two tiles that go together.") + "</p>" +
          '<div class="pairsgrid" id="gameGrid">' + tiles.map((t) =>
            '<button type="button" class="pairtile" data-k="' + t.k + '"><span class="back" aria-hidden="true">?</span><span class="face">' + esc(t.text) + "</span></button>").join("") +
          "</div><div class='fb' id='gameFb' role='status' aria-live='polite' aria-atomic='true'></div>");
        say(plain(round.prompt || "Tap two tiles that go together."));
        overlay.querySelector("#gameGrid").addEventListener("click", (e) => {
          const b = e.target.closest(".pairtile");
          if (!b || lock || b.classList.contains("matched") || b.classList.contains("revealed")) return;
          b.classList.add("revealed");
          picked.push({ pair: tiles[Number(b.dataset.k)].pair, el: b });
          if (picked.length < 2) return;
          lock = true;
          const [a, c] = picked;
          if (a.pair === c.pair) {
            a.el.classList.add("matched"); c.el.classList.add("matched"); a.el.disabled = true; c.el.disabled = true;
            matched++; picked = []; lock = false;
            SOUND.play("ding", 0.4);
            if (matched === round.pairs.length) { right++; feedback(true, cheer() + " Every pair matched."); nextRound(); }
          } else {
            a.el.classList.add("wrong"); c.el.classList.add("wrong");
            setTimeout(() => { a.el.classList.remove("revealed", "wrong"); c.el.classList.remove("revealed", "wrong"); picked = []; lock = false; }, 900);
          }
        });
      }
      drawRound();
    }
    drawShelf();
  }

  /* ---- things to find out at home: real projects, ticked when done ---- */
  function homeProjects(o) {
    const el = o.el;
    const items = o.items || [];
    const did = new Array(items.length).fill(false);
    const id = el.stage + "h";
    function paint() {
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="acts" id="' + id + '">' + items.map((it, k) =>
        '<div class="act' + (did[k] ? " did" : "") + '" data-k="' + k + '">' +
        '<div class="act-head"><span class="act-n">' + it.n + "</span><span class=\"act-kind\">with a grown-up</span>" +
        '<button type="button" class="hear" data-act="hear" aria-label="Hear this project">&#128266;</button></div>' +
        '<p class="act-lead">' + esc(it.title) + "</p>" +
        '<p class="act-mat"><span>You need</span>' + esc(it.materials) + "</p>" +
        '<ol class="act-steps">' + (it.steps || []).map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>" +
        '<p class="act-check"><span>Look for</span>' + esc(it.look) + "</p>" +
        '<button type="button" class="tick" data-act="tick">' + (did[k] ? "✓ we did this" : "We did this") + "</button>" +
        "</div>").join("") + "</div>" +
        '<div class="bigbtns"><button type="button" class="big small" id="' + id + 'fin">We did these &#10003;</button></div>';
      reportAttempt(o.finish, did.filter(Boolean).length, did.length, "projects");
      $(el.score).textContent = did.filter(Boolean).length + " of " + items.length + " ticked";
      $(id + "fin").addEventListener("click", () => { $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); });
    }
    $(el.stage).addEventListener("click", (e) => {
      const card = e.target.closest(".act"), button = e.target.closest("[data-act]");
      if (!card || !button) return;
      const k = Number(card.dataset.k), it = items[k];
      if (button.dataset.act === "hear") { say(it.title + ". You need " + it.materials + ". " + (it.steps || []).join(" ") + " Look for: " + it.look); return; }
      if (button.dataset.act === "tick") { did[k] = !did[k]; paint(); }
    });
    paint();
  }

  /* ---- student resources: the drawer, not a step ---- */
  function resources(o) {
    const el = o.el;
    const id = el.stage + "rs";
    const CARDS = [
      { id: "words", icon: "\u{1F524}", title: "Big words", blurb: "This lesson's words, what they mean, and a voice to hear them." },
      { id: "finder", icon: "\u{1F50E}", title: "Word finder", blurb: "Look up any big word from any lesson in " + (o.gradeLabel || "this grade") + "." },
      { id: "home", icon: "\u{1F3E0}", title: "Find out at home", blurb: "This lesson's projects, to do with a grown-up." },
      { id: "teaches", icon: "\u{1F46A}", title: "For your grown-up", blurb: "What this lesson teaches, in the words of the Cambridge framework." },
      { id: "strands", icon: "\u{1F9E9}", title: "The six skills", blurb: "The six skills of Global Perspectives, and what each one is." },
      { id: "hub", icon: "\u{1F5FA}", title: "All the lessons", blurb: "Back to the list of every lesson in " + (o.gradeLabel || "this grade") + "." },
    ];
    const opened = new Set();
    function drawShelf() {
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="shelf" id="' + id + '">' + CARDS.map((c) =>
        '<div class="bookcard"><span class="bookicon" aria-hidden="true">' + c.icon + "</span>" +
        '<span class="booktitle">' + esc(c.title) + "</span><span class=\"bookmeta\">" + esc(c.blurb) + "</span>" +
        '<button type="button" class="big small teal" data-res="' + c.id + '">Open ▶</button></div>').join("") + "</div>";
      $(el.score).textContent = CARDS.length + " things for you";
      $(id).addEventListener("click", (e) => { const b = e.target.closest("[data-res]"); if (b) open(b.dataset.res); });
    }
    function panel(title, bodyHtml, footHtml) {
      const overlay = document.createElement("div");
      overlay.className = "book-reader res-reader";
      overlay.innerHTML =
        '<div class="book-reader-top"><span class="booktitle">' + esc(title) + "</span>" +
        '<button type="button" class="book-close" aria-label="Close">&#10005;</button></div>' +
        '<div class="book-stage-wrap"><div class="res-stage">' + bodyHtml + "</div></div>" +
        '<div class="book-reader-bottom">' + (footHtml || "") + "</div>";
      document.body.appendChild(overlay);
      const close = () => { try { VOICE.stop(); } catch (_) { /* nothing */ } overlay.remove(); document.removeEventListener("keydown", onKey); };
      function onKey(e) { if (e.key === "Escape") close(); }
      document.addEventListener("keydown", onKey);
      overlay.querySelector(".book-close").addEventListener("click", close);
      overlay.addEventListener("click", (e) => { const b = e.target.closest("[data-say]"); if (b) say(b.dataset.say); });
      return overlay;
    }
    const wordRows = (words, withLesson) => words.map((w) =>
      '<div class="wordrow"><span class="gloxpic" aria-hidden="true">' + small(w.pic) + "</span>" +
      '<div class="gloxbody"><div class="gloxhead"><strong>' + esc(w.w) + "</strong>" +
      '<button type="button" class="hear" data-say="' + esc(w.w + ". " + w.meaning + " " + (w.uses || []).join(" ")) + '" aria-label="Hear ' + esc(w.w) + '">&#128266;</button>' +
      (withLesson && w.file ? '<a class="gloxlesson" href="' + esc(w.file) + location.search + '">Lesson ' + w.lesson + "</a>" : "") + "</div>" +
      '<p class="gloxdef">' + esc(w.meaning) + "</p>" +
      ((w.uses || []).length ? '<p class="gloxeg">“' + esc(w.uses[0]) + "”</p>" : "") + "</div></div>").join("");

    function open(which) {
      opened.add(which);
      reportAttempt(o.finish, opened.size, CARDS.length, "cards");
      finish(o.finish, o.done);
      if (which === "home") { if (o.homeStep >= 0) show(o.homeStep, true); return; }
      if (which === "hub") { location.href = (o.hub || "index.html") + location.search; return; }
      if (which === "words") {
        panel("Big words", '<div class="wordlist">' + wordRows(o.words || [], false) + "</div>",
          '<span class="book-page-count">' + (o.words || []).length + " words in this lesson</span>");
        return;
      }
      if (which === "finder") {
        const all = o.finder || [];
        const ov = panel("Word finder",
          '<div class="glossary"><input type="search" id="' + id + 'q" class="gloxq" placeholder="Type a word…" autocomplete="off" aria-label="Search the words">' +
          '<div id="' + id + 'r" class="gloxr"></div></div>',
          '<span class="book-page-count" id="' + id + 'n"></span>');
        const box = ov.querySelector("#" + id + "r"), count = ov.querySelector("#" + id + "n"), q = ov.querySelector("#" + id + "q");
        const draw = (term) => {
          term = String(term || "").trim().toLowerCase();
          const hits = term
            ? all.filter((w) => w.w.toLowerCase().startsWith(term)).concat(all.filter((w) => !w.w.toLowerCase().startsWith(term) && (w.w.toLowerCase().includes(term) || w.meaning.toLowerCase().includes(term))))
            : all;
          count.textContent = hits.length + " of " + all.length + " words";
          box.innerHTML = hits.length ? wordRows(hits, true) : '<p class="gloxmore">No word starts like that. Try fewer letters.</p>';
        };
        draw(""); q.addEventListener("input", () => draw(q.value)); q.focus();
        return;
      }
      if (which === "teaches") {
        panel("For your grown-up",
          '<div class="teaches"><p class="lec-p">Lesson ' + o.lessonNo + " teaches these objectives of Cambridge Primary Global Perspectives 0838. Cambridge prints no codes for this subject; these codes are Ehel's own, derived from the sub-strand names.</p><ul class=\"ovw-list codes\">" +
          (o.teaches || []).map((t) => "<li><code>" + esc(t.code) + "</code> " + esc(t.text) + "</li>").join("") + "</ul></div>",
          '<span class="book-page-count">' + (o.teaches || []).length + " objectives</span>");
        return;
      }
      if (which === "strands") {
        panel("The six skills",
          '<div class="teaches">' + (o.strands || []).map((s) => '<section class="wordgroup"><h4>' + esc(s[0]) + "</h4><p class=\"lec-p\">" + esc(s[1]) + "</p></section>").join("") + "</div>",
          '<span class="book-page-count">' + (o.strands || []).length + " skills</span>");
      }
    }
    drawShelf();
  }

  /* ---- the sticker shelf --------------------------------------------- */
  function paintStickers() {
    const got = done.filter(Boolean).length;
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] + (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    $("fbstick").className = "fb good";
    $("fbstick").textContent = got === STICKERS.length ? "Every sticker! You finished the whole lesson." : got + " of " + STICKERS.length + " stickers. Go back for the rest whenever you like.";
  }
  const restart = $("restart");
  if (restart) restart.addEventListener("click", () => location.reload());
