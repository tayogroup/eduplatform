  /* ==================================================================
     THE SCIENCE ACTIVITIES

     The Mathematics build's own rounds are one function per idea, each
     drawing into one slide's ids and calling finish(i) when the child has
     done the thing. These are the same shape, and there are eleven of them
     rather than one generic renderer for the reason there are eight in
     English: a step is a KIND of doing, and a renderer that covers every
     kind covers none of them well.

     What is science-shaped about them is the middle five. A Stage 1
     scientist predicts, tries it, records what happened and says whether
     it matched - 1TWSp.02, 1TWSc.04/05 and 1TWSa.01 - so experiment(),
     predictEach() and recordTable() are not quizzes with a picture: the
     prediction is asked BEFORE the simulation runs, the simulation is a
     real state machine the child drives, the table is filled from what
     the simulation actually did, and "did it match?" is a question the
     child answers about their own prediction, which the page knows.

     Sound is synthesised, not recorded: this build ships no clips, and a
     lesson about sources of sound needs a drum that thuds when tapped.
     The voice engine speaks everything else, exactly as in Mathematics.
     ================================================================== */

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  /* an emoji, or markup (an inline SVG, or one of the kit's own drawings from
     lesson-kit/_icons.py, or a row of them), as stage-sized picture markup */
  const picHtml = (p, cls) => {
    if (!p) return "";
    const s = String(p).trim();
    return '<div class="' + (cls || "pic") + '" aria-hidden="true">' + (s.startsWith("<") ? s : esc(s)) + "</div>";
  };
  const small = (p) => { const s = String(p || "").trim(); return s.startsWith("<") ? s : esc(s); };
  /* A picture INSIDE a drawing, centred on cx with its baseline at y, as an
     emoji is placed by <text>. An emoji stays SVG text; one of the kit's own
     drawings (Emoji 13+ is missing on older school devices, lesson-kit/_icons.py)
     is nested SVG in the same box - text cannot hold it, which is why the sims
     that used to set textContent now go through here. */
  const glyphAt = (cx, y, size, p) => {
    const s = String(p || "").trim();
    const top = Math.round(y - size * 0.86);
    const body = s.startsWith("<svg")
      ? s.replace('width="1em" height="1em"', 'width="100%" height="100%"').replace(/ style="vertical-align:[^"]*"/, "")
      : '<text x="' + (size / 2) + '" y="' + Math.round(size * 0.86) + '" font-size="' + size + '" text-anchor="middle">' + esc(s) + "</text>";
    return '<svg x="' + (cx - size / 2) + '" y="' + top + '" width="' + size + '" height="' + size + '" overflow="visible">' + body + "</svg>";
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---- a step may speak only while it is the step on screen ------------
     Every renderer draws once, at load, because the deck paints all its
     slides and hides them with CSS. ONSHOW gives a step a line to say when
     the learner actually arrives; sayHere() refuses to speak for a slide
     that is not the one showing (the deck's own finish() keeps the same
     rule). show() is wrapped, not edited: it is lifted verbatim and the
     shared pipeline patches it by matching its exact text.

     ONLEAVE is the same idea for the step being LEFT, and it runs BEFORE
     the deck moves: a step that finishes as the learner leaves it then
     reports while it is still their position, and the new step's own
     position report - made by show() itself - lands last and wins. The
     lesson overview needs it; see unitOverview. */
  const ONSHOW = [], ONLEAVE = [];
  const showWithoutHooks = show;
  let breakOffered = false;
  show = function (i, speak) {
    const from = cur;
    const to = Math.max(0, Math.min(slides.length - 1, i));
    const g = to !== cur ? ONLEAVE[cur] : null;
    if (g) { try { g(); } catch (_) { /* a step must never break the deck */ } }
    showWithoutHooks(i, speak);
    const f = ONSHOW[cur];
    if (f) { try { f(); } catch (_) { /* a step must never break the deck */ } }
    /* TWO SITTINGS: arriving at the first step of sitting 2 by pressing on
       from the last step of sitting 1 offers a break, once. Not on a resume
       (the child is starting sitting 2) and not once the step is done. */
    const brk = LESSON.steps[cur] && LESSON.steps[cur].sittingBreak;
    if (brk && !breakOffered && from === cur - 1 && !done[cur]) {
      breakOffered = true;
      try { sittingBreak(brk); } catch (_) { /* never break the deck */ }
    }
  };
  function sayHere(idx, text) { if (cur === idx && text) say(text); }
  function afterVoice(fn) {
    let waited = 0;
    const t = setInterval(() => {
      waited += 200;
      if (!VOICE.speaking() || waited > 12000) { clearInterval(t); fn(); }
    }, 200);
  }

  /* ==================================================================
     SOUND - a very small synthesiser.
     Each source is a few oscillators or a noise burst with an envelope.
     The context is created on the first tap, because browsers refuse
     audio that nobody asked for. gain scales every source, which is how
     "further away is quieter" is real and not a picture of a meter.
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
      drum: (c, t, m) => { osc(c, "sine", 150, 45, t, 0.35, 0.9, m); noise(c, t, 0.12, 0.35, m); },
      bell: (c, t, m) => { osc(c, "sine", 880, 0, t, 1.4, 0.5, m); osc(c, "sine", 1320, 0, t, 1.0, 0.25, m); osc(c, "triangle", 2210, 0, t, 0.5, 0.12, m); },
      bird: (c, t, m) => { for (let k = 0; k < 3; k++) osc(c, "sine", 1900, 2600, t + k * 0.16, 0.12, 0.35, m); },
      horn: (c, t, m) => { osc(c, "sawtooth", 330, 0, t, 0.5, 0.35, m); osc(c, "square", 165, 0, t, 0.5, 0.15, m); },
      clap: (c, t, m) => { noise(c, t, 0.08, 0.7, m, 1500); },
      whistle: (c, t, m) => { osc(c, "sine", 2200, 2600, t, 0.35, 0.4, m); osc(c, "sine", 2600, 2100, t + 0.35, 0.3, 0.4, m); },
      cat: (c, t, m) => { osc(c, "sawtooth", 520, 780, t, 0.25, 0.25, m); osc(c, "sawtooth", 780, 560, t + 0.25, 0.3, 0.22, m); },
      cow: (c, t, m) => { osc(c, "sawtooth", 140, 110, t, 0.8, 0.35, m); osc(c, "triangle", 280, 220, t, 0.8, 0.15, m); },
      dog: (c, t, m) => { osc(c, "sawtooth", 300, 180, t, 0.14, 0.45, m); osc(c, "sawtooth", 320, 190, t + 0.22, 0.14, 0.45, m); },
      rain: (c, t, m) => { noise(c, t, 1.2, 0.25, m, 3000); },
      baby: (c, t, m) => { osc(c, "sine", 500, 700, t, 0.4, 0.35, m); osc(c, "sine", 700, 450, t + 0.4, 0.5, 0.3, m); },
      buzz: (c, t, m) => { osc(c, "sawtooth", 110, 95, t, 0.7, 0.35, m); },
      pluck: (c, t, m) => { osc(c, "triangle", 220, 200, t, 0.6, 0.5, m); },
      shake: (c, t, m) => { for (let k = 0; k < 4; k++) noise(c, t + k * 0.12, 0.06, 0.4, m, 2500); },
      click: (c, t, m) => { noise(c, t, 0.03, 0.5, m, 2000); },
      splash: (c, t, m) => { noise(c, t, 0.25, 0.5, m); osc(c, "sine", 400, 150, t, 0.25, 0.2, m); },
      pop: (c, t, m) => { osc(c, "sine", 600, 900, t, 0.09, 0.4, m); },
      ding: (c, t, m) => { osc(c, "sine", 1046, 0, t, 0.6, 0.35, m); },
      boing: (c, t, m) => { osc(c, "sine", 200, 500, t, 0.3, 0.4, m); },
      thud: (c, t, m) => { osc(c, "sine", 90, 40, t, 0.25, 0.7, m); },
      hum: (c, t, m) => { osc(c, "sine", 60, 0, t, 1.0, 0.4, m); osc(c, "sine", 120, 0, t, 1.0, 0.1, m); },
      kettle: (c, t, m) => { noise(c, t, 1.0, 0.2, m, 4000); osc(c, "sine", 1500, 2400, t + 0.3, 0.7, 0.15, m); },
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
     FIGURES - a plant and a child, drawn once, with parts to tap.
     Every part is a <g data-part> carrying an .outline the CSS rings.
     ================================================================== */
  const FIGURES = {
    plant: () => (
      '<svg viewBox="0 0 320 360" role="img" aria-label="A flowering plant in the ground">' +
      '<rect x="0" y="250" width="320" height="110" fill="#6B4A2B"/>' +
      '<rect x="0" y="238" width="320" height="16" fill="#3E8E4A"/>' +
      '<g data-part="roots" tabindex="0" role="button" aria-label="roots"><path d="M160 252 q-8 30 -40 48 M160 252 q10 34 46 50 M160 252 q-2 40 -12 70 M160 256 q20 26 12 60" fill="none" stroke="#E9D9B8" stroke-width="7" stroke-linecap="round"/>' +
      '<path class="outline" d="M110 250 h100 v72 h-100z" rx="12"/></g>' +
      '<g data-part="stem" tabindex="0" role="button" aria-label="stem"><rect x="153" y="118" width="14" height="136" rx="7" fill="#2F8F45"/><rect class="outline" x="146" y="112" width="28" height="146" rx="12"/></g>' +
      '<g data-part="leaves" tabindex="0" role="button" aria-label="leaves"><path d="M158 200 q-70 -40 -78 -90 q60 6 78 90z" fill="#4CB65C"/><path d="M162 170 q70 -34 80 -80 q-62 4 -80 80z" fill="#4CB65C"/>' +
      '<path d="M158 200 q-40 -40 -60 -70" fill="none" stroke="#2F8F45" stroke-width="3"/><path d="M162 170 q40 -34 60 -58" fill="none" stroke="#2F8F45" stroke-width="3"/>' +
      '<path class="outline" d="M74 100 h174 v106 h-174z"/></g>' +
      '<g data-part="flower" tabindex="0" role="button" aria-label="flower"><g fill="#F2A7C4">' +
      '<ellipse cx="160" cy="60" rx="20" ry="30"/><ellipse cx="160" cy="130" rx="20" ry="30"/><ellipse cx="125" cy="95" rx="30" ry="20"/><ellipse cx="195" cy="95" rx="30" ry="20"/>' +
      '<ellipse cx="135" cy="70" rx="24" ry="24"/><ellipse cx="185" cy="70" rx="24" ry="24"/><ellipse cx="135" cy="120" rx="24" ry="24"/><ellipse cx="185" cy="120" rx="24" ry="24"/></g>' +
      '<circle cx="160" cy="95" r="22" fill="#F4C95D"/><circle class="outline" cx="160" cy="95" r="70"/></g>' +
      "</svg>"),
    body: () => (
      '<svg viewBox="0 0 260 400" role="img" aria-label="A child standing">' +
      '<g data-part="head" tabindex="0" role="button" aria-label="head"><circle cx="130" cy="62" r="46" fill="#C68642"/><circle class="outline" cx="130" cy="62" r="52"/></g>' +
      '<path d="M84 50 q46 -40 92 0 q-4 -30 -46 -34 q-42 4 -46 34z" fill="#2B1B10"/>' +
      '<g data-part="eyes" tabindex="0" role="button" aria-label="eyes"><circle cx="113" cy="62" r="6" fill="#fff"/><circle cx="147" cy="62" r="6" fill="#fff"/><circle cx="114" cy="63" r="3" fill="#1B1B1B"/><circle cx="148" cy="63" r="3" fill="#1B1B1B"/><rect class="outline" x="100" y="50" width="60" height="24" rx="12"/></g>' +
      '<g data-part="ears" tabindex="0" role="button" aria-label="ears"><ellipse cx="84" cy="66" rx="7" ry="11" fill="#B5763A"/><ellipse cx="176" cy="66" rx="7" ry="11" fill="#B5763A"/><path class="outline" d="M72 50 h24 v32 h-24z M164 50 h24 v32 h-24z"/></g>' +
      '<g data-part="nose" tabindex="0" role="button" aria-label="nose"><path d="M130 66 l-6 14 h12z" fill="#A9642E"/><circle class="outline" cx="130" cy="74" r="12"/></g>' +
      '<g data-part="mouth" tabindex="0" role="button" aria-label="mouth"><path d="M114 90 q16 14 32 0" fill="none" stroke="#7A2E2E" stroke-width="4" stroke-linecap="round"/><rect class="outline" x="106" y="80" width="48" height="22" rx="11"/></g>' +
      '<rect x="120" y="106" width="20" height="14" fill="#C68642"/>' +
      '<g data-part="tummy" tabindex="0" role="button" aria-label="tummy"><rect x="82" y="118" width="96" height="112" rx="26" fill="#35BFB2"/><rect class="outline" x="76" y="112" width="108" height="124" rx="30"/></g>' +
      '<g data-part="arms" tabindex="0" role="button" aria-label="arms"><path d="M84 132 q-40 30 -36 96" fill="none" stroke="#C68642" stroke-width="22" stroke-linecap="round"/><path d="M176 132 q40 30 36 96" fill="none" stroke="#C68642" stroke-width="22" stroke-linecap="round"/>' +
      '<path class="outline" d="M30 120 h56 v100 h-56z M174 120 h56 v100 h-56z"/></g>' +
      '<g data-part="hands" tabindex="0" role="button" aria-label="hands"><circle cx="48" cy="238" r="15" fill="#C68642"/><circle cx="212" cy="238" r="15" fill="#C68642"/><path class="outline" d="M28 218 h40 v40 h-40z M192 218 h40 v40 h-40z"/></g>' +
      '<g data-part="legs" tabindex="0" role="button" aria-label="legs"><rect x="94" y="228" width="30" height="110" rx="14" fill="#2B5673"/><rect x="136" y="228" width="30" height="110" rx="14" fill="#2B5673"/><rect class="outline" x="88" y="230" width="84" height="106" rx="16"/></g>' +
      '<g data-part="feet" tabindex="0" role="button" aria-label="feet"><rect x="86" y="332" width="44" height="22" rx="10" fill="#F4C95D"/><rect x="130" y="332" width="44" height="22" rx="10" fill="#F4C95D"/><rect class="outline" x="80" y="326" width="100" height="34" rx="14"/></g>' +
      "</svg>"),
  };

  /* ==================================================================
     SCENES - small drawings a demonstration steps through by state.
     ================================================================== */
  const SCENES = {
    /* a seed becoming a plant: 0 seed, 1 root, 2 shoot, 3 leaves, 4 taller, 5 flower */
    plant: (s) => {
      const soil = '<rect x="0" y="220" width="320" height="100" fill="#6B4A2B"/><rect x="0" y="210" width="320" height="14" fill="#3E8E4A"/>';
      let g = "";
      if (s === 0) g = '<ellipse cx="160" cy="250" rx="10" ry="7" fill="#C7A76B"/>';
      if (s >= 1) g += '<ellipse cx="160" cy="250" rx="10" ry="7" fill="#C7A76B"/><path d="M160 256 q-6 20 -22 30 M160 256 q8 22 20 30 M160 256 v34" fill="none" stroke="#E9D9B8" stroke-width="5" stroke-linecap="round"/>';
      if (s === 2) g += '<path d="M160 244 q-4 -30 2 -50" fill="none" stroke="#4CB65C" stroke-width="7" stroke-linecap="round"/>';
      if (s >= 3) { const h = s === 3 ? 60 : s === 4 ? 110 : 140; const top = 244 - h;
        g += '<rect x="155" y="' + top + '" width="10" height="' + h + '" rx="5" fill="#2F8F45"/>' +
             '<path d="M158 ' + (top + 30) + ' q-40 -20 -46 -50 q36 4 46 50z" fill="#4CB65C"/><path d="M162 ' + (top + 18) + ' q40 -18 46 -46 q-36 2 -46 46z" fill="#4CB65C"/>';
        if (s >= 4) g += '<path d="M158 ' + (top + 70) + ' q-44 -14 -52 -44 q40 0 52 44z" fill="#4CB65C"/>';
        if (s === 5) g += '<g fill="#F2A7C4"><circle cx="160" cy="' + (top - 22) + '" r="14"/><circle cx="160" cy="' + (top + 22) + '" r="14"/><circle cx="138" cy="' + top + '" r="14"/><circle cx="182" cy="' + top + '" r="14"/></g><circle cx="160" cy="' + top + '" r="11" fill="#F4C95D"/>';
      }
      return '<svg viewBox="0 0 320 320" role="img" aria-label="A seed growing">' + '<rect width="320" height="220" fill="#BFE3F5"/>' + (s >= 2 ? '<circle cx="270" cy="50" r="26" fill="#F4C95D"/>' : "") + soil + g + "</svg>";
    },
    /* the ground, dug down: 0 grass, 1 soil, 2 stones in soil, 3 rock */
    ground: (s) => (
      '<svg viewBox="0 0 320 300" role="img" aria-label="Digging down into the ground">' +
      '<rect width="320" height="60" fill="#BFE3F5"/>' +
      '<rect x="0" y="60" width="320" height="14" fill="#3E8E4A"/>' +
      '<rect x="0" y="74" width="320" height="90" fill="#6B4A2B"/>' +
      '<rect x="0" y="164" width="320" height="136" fill="#7D7F86"/>' +
      '<g fill="#5B5D63"><ellipse cx="60" cy="130" rx="14" ry="9"/><ellipse cx="200" cy="110" rx="10" ry="7"/><ellipse cx="260" cy="145" rx="16" ry="10"/></g>' +
      '<path d="M0 164 q40 -10 80 0 t80 0 t80 0 t80 0" fill="none" stroke="#5B5D63" stroke-width="4"/>' +
      '<rect x="120" y="74" width="80" height="' + (s === 0 ? 0 : s === 1 ? 50 : s === 2 ? 90 : 170) + '" fill="#0B1D2C" opacity="0.55"/>' +
      '<text x="160" y="' + (s === 0 ? 50 : 74 + [0, 50, 90, 170][s] + 24) + '" text-anchor="middle" font-size="30">⛏️</text>' +
      "</svg>"),
    /* Earth from space: mostly blue with green land, spun by `turn` degrees */
    globe: (turn) => (
      '<svg viewBox="0 0 320 320" role="img" aria-label="Planet Earth from space">' +
      '<rect width="320" height="320" fill="#0B1D2C"/>' +
      '<g fill="#fff" opacity="0.8"><circle cx="30" cy="40" r="2"/><circle cx="290" cy="60" r="2"/><circle cx="260" cy="280" r="2"/><circle cx="50" cy="270" r="1.5"/><circle cx="300" cy="200" r="1.5"/><circle cx="20" cy="160" r="1.5"/></g>' +
      '<defs><clipPath id="gclip"><circle cx="160" cy="160" r="120"/></clipPath></defs>' +
      '<circle cx="160" cy="160" r="120" fill="#3B7FD1"/>' +
      '<g clip-path="url(#gclip)" transform="rotate(' + (turn || 0) + ' 160 160)" fill="#4CB65C">' +
      '<path d="M90 90 q40 -30 70 0 q-10 40 -50 60 q-40 -10 -20 -60z"/><path d="M110 170 q30 10 30 50 q-20 40 -40 10 q-10 -40 10 -60z"/>' +
      '<path d="M200 70 q50 0 60 40 q-30 40 -70 20 q0 -40 10 -60z"/><path d="M210 180 q40 -10 50 30 q-30 30 -60 10 q-10 -30 10 -40z"/>' +
      '<path d="M40 150 q20 -10 30 20 q-20 20 -30 0z"/><path d="M250 250 q30 -10 30 20 q-30 20 -30 -20z"/></g>' +
      '<g fill="#fff" opacity="0.55"><ellipse cx="120" cy="120" rx="30" ry="9"/><ellipse cx="220" cy="210" rx="34" ry="10"/><ellipse cx="180" cy="60" rx="24" ry="7"/></g>' +
      "</svg>"),
    /* sky: 0 night with many stars, 1 the Sun rising, 2 full day, 3 the Sun close up with rays */
    sky: (s) => {
      const stars = '<g fill="#fff"><circle cx="40" cy="40" r="2.5"/><circle cx="90" cy="90" r="1.8"/><circle cx="150" cy="30" r="2"/><circle cx="210" cy="70" r="2.6"/><circle cx="270" cy="40" r="1.8"/><circle cx="240" cy="130" r="2"/><circle cx="60" cy="140" r="1.6"/><circle cx="120" cy="150" r="2.2"/><circle cx="290" cy="110" r="1.6"/><circle cx="180" cy="120" r="1.4"/></g>';
      const ground = '<rect x="0" y="200" width="320" height="60" fill="' + (s === 0 ? "#173B2A" : "#3E8E4A") + '"/>';
      if (s === 0) return '<svg viewBox="0 0 320 260" role="img" aria-label="The night sky, full of stars"><rect width="320" height="200" fill="#0B1D2C"/>' + stars + ground + "</svg>";
      /* East on the left, west on the right, in every state and in sunPath: the
         Sun rises low on one side, is highest at midday, and sets low on the OTHER
         side. Sunrise and sunset used to be the same picture, a centred Sun, so a
         lesson teaching the path across the sky could not show it (validation of
         Grade 2, 2026-09-11). State 4 is the sunset. */
      const compass = '<text x="12" y="248" font-size="15" font-family="Inter, sans-serif" font-weight="800" fill="#fff">east</text><text x="308" y="248" text-anchor="end" font-size="15" font-family="Inter, sans-serif" font-weight="800" fill="#fff">west</text>';
      if (s === 1) return '<svg viewBox="0 0 320 260" role="img" aria-label="The Sun rising in the east"><rect width="320" height="200" fill="#F0A56B"/><circle cx="62" cy="200" r="40" fill="#F4C95D"/>' + ground + compass + "</svg>";
      if (s === 2) return '<svg viewBox="0 0 320 260" role="img" aria-label="The Sun high in a blue sky at midday"><rect width="320" height="200" fill="#BFE3F5"/><circle cx="160" cy="48" r="34" fill="#F4C95D"/>' + ground + compass + "</svg>";
      if (s === 4) return '<svg viewBox="0 0 320 260" role="img" aria-label="The Sun setting in the west"><rect width="320" height="200" fill="#E07A6B"/><circle cx="258" cy="200" r="40" fill="#F4C95D"/>' + ground + compass + "</svg>";
      return '<svg viewBox="0 0 320 260" role="img" aria-label="The Sun drawn as a star among stars"><rect width="320" height="260" fill="#0B1D2C"/>' + stars +
        '<g stroke="#F4C95D" stroke-width="6" stroke-linecap="round">' + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => '<line x1="160" y1="130" x2="160" y2="30" transform="rotate(' + a + ' 160 130)"/>').join("") + "</g>" +
        '<circle cx="160" cy="130" r="58" fill="#F4C95D"/><text x="160" y="240" text-anchor="middle" fill="#fff" font-size="18" font-family="Inter, sans-serif" font-weight="800">The Sun is a star</text></svg>';
    },
    /* a house, a town, a country, the planet: how far we zoom out */
    zoom: (s) => ["\u{1F3E0}", "\u{1F3D8}️", "\u{1F5FA}️", "\u{1F30D}"][s] || "",
  };

  /* ==================================================================
     SIMS - the experiments. Each has init(box) to draw the starting state
     and run(box, api) to let the child drive it; run resolves when the
     experiment is over. api.controls is where a sim puts its own buttons,
     api.say speaks, api.tag sets the caption in the corner of the box.
     ================================================================== */
  function potSvg(x, state, label, dark, cold) {
    /* state 0..4: 0 fresh, higher = worse (droop / pale). dark draws the cupboard;
       cold draws frost, in the SAME light, so a warm-or-cold test changes one thing */
    const droop = state * 9, pale = state > 2 ? "#C9C46A" : state > 0 ? "#8FBF6C" : "#4CB65C";
    const leafA = 'M' + (x) + ' 150 q-40 -18 -46 -52 q36 4 46 52z', leafB = 'M' + (x) + ' 128 q40 -16 46 -46 q-36 2 -46 46z';
    return '<g>' + (dark ? '<rect x="' + (x - 78) + '" y="20" width="156" height="200" fill="#1B1B1B" opacity="0.72" rx="8"/>' : "") +
      (cold ? '<rect x="' + (x - 78) + '" y="20" width="156" height="230" fill="#E6F4FF" opacity="0.55" rx="8"/><text x="' + (x - 58) + '" y="52" font-size="22">\u2744\ufe0f</text><text x="' + (x + 38) + '" y="80" font-size="18">\u2744\ufe0f</text>' : "") +
      '<path d="M' + (x - 44) + ' 190 h88 l-10 60 h-68z" fill="#C76B3B"/>' +
      '<rect x="' + (x - 48) + '" y="182" width="96" height="14" rx="4" fill="#A9552B"/>' +
      '<g transform="rotate(' + droop + ' ' + x + ' 190)"><rect x="' + (x - 5) + '" y="90" width="10" height="100" rx="5" fill="' + (state > 2 ? "#A9A05A" : "#2F8F45") + '"/>' +
      '<g transform="rotate(' + (droop * 2) + ' ' + x + ' 150)"><path d="' + leafA + '" fill="' + pale + '"/></g>' +
      '<g transform="rotate(' + (-droop * 2) + ' ' + x + ' 128)"><path d="' + leafB + '" fill="' + pale + '"/></g></g>' +
      '<text x="' + x + '" y="272" text-anchor="middle" font-size="15" font-family="Inter, sans-serif" font-weight="800" fill="#fff">' + esc(label) + "</text></g>";
  }
  function twoPots(box, a, b, day, opts) {
    box.innerHTML = '<svg viewBox="0 0 320 290" role="img" aria-label="Two plants in pots, ' + esc(opts.labelA) + ' and ' + esc(opts.labelB) + '"><rect width="320" height="290" fill="' + (opts.dark ? "#3A5C74" : "#BFE3F5") + '"/>' +
      (opts.sun ? '<circle cx="280" cy="40" r="24" fill="#F4C95D"/>' : "") +
      '<rect x="0" y="250" width="320" height="40" fill="#8B5A2B"/>' +
      potSvg(90, a, opts.labelA, opts.darkA, opts.coldA) + potSvg(230, b, opts.labelB, opts.darkB, opts.coldB) +
      '<text x="12" y="28" font-size="16" font-family="Inter, sans-serif" font-weight="800" fill="#fff">Day ' + day + "</text></svg>";
  }
  const SIMS = {
    plantWater: {
      init(box) { twoPots(box, 0, 0, 1, { sun: true, labelA: "water every day", labelB: "no water" }); },
      run(box, api) {
        return new Promise((done) => {
          let day = 1;
          api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'day">\u{1F4A7} Water one, wait a day</button>';
          $(api.id + "day").addEventListener("click", () => {
            day++; twoPots(box, 0, Math.min(4, day - 1), day, { sun: true, labelA: "water every day", labelB: "no water" });
            SOUND.play("splash", 0.5);
            api.say(day < 5 ? "Day " + day + ". " + (day === 2 ? "The plant with no water is starting to droop." : day === 3 ? "It is drooping more." : "Its leaves are going yellow.")
              : "Day 5. The watered plant is fresh and green. The plant with no water has drooped and gone yellow.");
            if (day >= 5) { api.controls.innerHTML = ""; done(); }
          });
        });
      },
    },
    plantLight: {
      init(box) { twoPots(box, 0, 0, 1, { sun: true, labelA: "by the window", labelB: "in the cupboard", darkB: true }); },
      run(box, api) {
        return new Promise((done) => {
          let day = 1;
          api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'day">☀️ Wait a day</button>';
          $(api.id + "day").addEventListener("click", () => {
            day++; twoPots(box, 0, Math.min(4, day - 1), day, { sun: true, labelA: "by the window", labelB: "in the cupboard", darkB: true });
            SOUND.play("click", 0.4);
            api.say(day < 5 ? "Day " + day + ". " + (day === 2 ? "The plant in the dark is going pale." : day === 3 ? "It is thin and yellow now." : "It is drooping.")
              : "Day 5. The plant by the window is green and strong. The plant in the dark is pale, thin and droopy.");
            if (day >= 5) { api.controls.innerHTML = ""; done(); }
          });
        });
      },
    },
    /* a ball on a track marked in steps; a gentle push and a hard push */
    pushBall: {
      draw(box, x, label, thing) {
        let marks = "";
        for (let i = 0; i <= 10; i++) marks += '<line x1="' + (30 + i * 26) + '" y1="196" x2="' + (30 + i * 26) + '" y2="210" stroke="#fff" stroke-width="2"/><text x="' + (30 + i * 26) + '" y="228" text-anchor="middle" fill="#fff" font-size="11" font-family="Inter, sans-serif" font-weight="800">' + i + "</text>";
        box.innerHTML = '<svg viewBox="0 0 320 240" role="img" aria-label="A ball on a track marked in steps"><rect width="320" height="240" fill="#3E8E4A"/><rect x="0" y="180" width="320" height="60" fill="#8B5A2B"/>' +
          '<rect x="20" y="196" width="280" height="4" fill="#fff"/>' + marks +
          '<text x="12" y="30" font-size="16" font-family="Inter, sans-serif" font-weight="800" fill="#fff">' + esc(label || "") + "</text>" +
          '<text x="' + (30 + x * 26) + '" y="176" text-anchor="middle" font-size="44" style="transition: x 900ms ease-out">' + esc(thing || "⚽") + "</text>" +
          '<text x="14" y="176" font-size="40">\u{1F9D2}</text></svg>';
      },
      /* the defaults are Grade 1's: a ball, pushed gently and hard. A step may
         give its own `thing` and `pushes` ({label, to, say}) instead. */
      pushes: [{ label: "Push gently", to: 3, say: "A gentle push. The ball rolled three steps and stopped." },
               { label: "Push HARD", to: 9, say: "A hard push! The ball rolled nine steps. A bigger push, a bigger move." }],
      init(box, d) { SIMS.pushBall.draw(box, 0, "steps along the track", d && d.thing); },
      run(box, api) {
        return new Promise((done) => {
          const d = api.data || {}, thing = d.thing, pushes = d.pushes || SIMS.pushBall.pushes;
          const did = new Set();
          api.controls.innerHTML = pushes.map((p, k) => '<button type="button" class="big small' + (k === 0 ? " ghost" : "") + '" id="' + api.id + "p" + k + '">' + esc(p.label) + "</button>").join("");
          const roll = (to, msg) => {
            SIMS.pushBall.draw(box, 0, "", thing);
            SOUND.play("thud", 0.4);
            setTimeout(() => {
              const b = box.querySelectorAll("text")[box.querySelectorAll("text").length - 2];
              if (b) b.setAttribute("x", 30 + to * 26);
              const lab = box.querySelector("text"); if (lab) lab.textContent = "It rolled " + to + " steps";
            }, 40);
            api.say(msg);
            if (did.size >= pushes.length) setTimeout(() => { api.controls.innerHTML = ""; done(); }, 1200);
          };
          pushes.forEach((p, k) => $(api.id + "p" + k).addEventListener("click", () => { did.add(k); roll(p.to, p.say); }));
        });
      },
    },
    /* a tank of water; act(item) drops it in and it floats or sinks */
    floatSink: {
      init(box) { box.innerHTML = '<svg viewBox="0 0 320 260" role="img" aria-label="A tank of water"><rect width="320" height="260" fill="#DDEFF7"/><rect x="30" y="60" width="260" height="180" rx="10" fill="#7FC4EA" opacity="0.85"/><rect x="30" y="60" width="260" height="180" rx="10" fill="none" stroke="#2B5673" stroke-width="5"/><g id="fsitem" style="transition: transform 1100ms ease-in"></g></svg>'; },
      act(box, item, api) {
        const t = box.querySelector("#fsitem");
        t.innerHTML = glyphAt(160, 40, 44, item.pic); t.style.transition = "none"; t.style.transform = "";
        void t.getBoundingClientRect(); t.style.transition = "";
        /* A short timer, NOT a paint callback: requestAnimationFrame never
           fires in a hidden tab, so a drop started just before a tab switch
           would never resolve and the step would freeze. A timer is throttled
           there but still fires. 40ms is enough for the start position to be
           painted so the transition runs from it. */
        return new Promise((r) => {
          setTimeout(() => {
            SOUND.play("splash", 0.6);
            t.style.transform = "translateY(" + (item.answer === "float" ? 56 : 188) + "px)";
            setTimeout(() => { api.say(item.answer === "float" ? "The " + item.label + " floats. It stays on top of the water." : "The " + item.label + " sinks. It goes down to the bottom."); r(); }, 1150);
          }, 40);
        });
      },
    },
    /* a magnet approaches an item; a magnetic one jumps to it */
    magnet: {
      init(box) { box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="A magnet and a thing to test"><rect width="320" height="200" fill="#DDEFF7"/><rect x="0" y="150" width="320" height="50" fill="#C9B79C"/><g id="mg" style="transition: transform 900ms ease-in-out"><text x="30" y="118" font-size="60">\u{1F9F2}</text></g><g id="mi" style="transition: transform 400ms ease-in"></g></svg>'; },
      act(box, item, api) {
        const mg = box.querySelector("#mg"), it = box.querySelector("#mi");
        it.innerHTML = glyphAt(230, 140, 48, item.pic); it.style.transform = ""; mg.style.transform = "";
        return new Promise((r) => {
          setTimeout(() => {   /* a timer, not a paint callback - see floatSink */
            mg.style.transform = "translateX(120px)";
            setTimeout(() => {
              if (item.answer === "yes") { it.style.transform = "translateX(-40px)"; SOUND.play("click", 0.6); }
              else SOUND.play("pop", 0.3);
              setTimeout(() => { api.say(item.answer === "yes" ? "The " + item.label + " sticks to the magnet! It jumped across." : "The " + item.label + " does not stick. The magnet does nothing to it."); r(); }, 500);
            }, 950);
          }, 40);
        });
      },
    },
    /* a bell, and a child who walks away from it one step at a time */
    soundFar: {
      draw(box, steps) {
        box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="A bell, and a child ' + (steps === 0 ? "next to it" : steps + " steps away") + '"><rect width="320" height="200" fill="#BFE3F5"/><rect x="0" y="150" width="320" height="50" fill="#3E8E4A"/>' +
          '<text x="22" y="140" font-size="52">\u{1F514}</text>' +
          Array.from({ length: 7 }, (_, i) => '<line x1="' + (80 + i * 34) + '" y1="150" x2="' + (80 + i * 34) + '" y2="160" stroke="#fff" stroke-width="2"/>').join("") +
          '<text x="' + (66 + steps * 34) + '" y="140" font-size="48" style="transition: x 400ms ease">\u{1F9D2}</text>' +
          '<text x="12" y="30" font-size="16" font-family="Inter, sans-serif" font-weight="800" fill="#0B1D2C">' + (steps === 0 ? "right next to the bell" : steps + (steps === 1 ? " step" : " steps") + " away") + "</text></svg>";
      },
      init(box) { SIMS.soundFar.draw(box, 0); },
      run(box, api) {
        return new Promise((done) => {
          let steps = 0;
          const gainFor = (s) => [1, 0.62, 0.4, 0.26, 0.17, 0.11, 0.07][s];
          api.controls.innerHTML = '<div class="meter" aria-hidden="true"><i id="' + api.id + 'm" style="width:100%"></i></div><div class="meterlab"><span>quiet</span><span>loud</span></div>' +
            '<div class="simrow"><button type="button" class="big teal small" id="' + api.id + 'r">\u{1F514} Ring the bell</button><button type="button" class="big small" id="' + api.id + 's">Take a step back</button></div>';
          const ring = () => { SOUND.play("bell", gainFor(steps)); $(api.id + "m").style.width = Math.round(gainFor(steps) * 100) + "%"; };
          $(api.id + "r").addEventListener("click", ring);
          $(api.id + "s").addEventListener("click", () => {
            if (steps >= 6) return;
            steps++; SIMS.soundFar.draw(box, steps); ring();
            api.say(steps < 6 ? (steps === 1 ? "One step back. Listen." : steps === 3 ? "Three steps. The bell is quieter now." : "") : "Six steps away. The bell is very quiet now. The further you go, the quieter it gets.");
            if (steps >= 6) setTimeout(() => { api.controls.innerHTML = ""; done(); }, 1400);
          });
        });
      },
    },
    /* squash, bend, twist, stretch a material - or fail to */
    shapeChange: {
      items: [
        { id: "clay", pic: "\u{1F7E4}", label: "a ball of clay", changes: true, says: { squash: "Squashed flat! The clay changed shape.", bend: "It bent. The clay changed shape.", twist: "Twisted! The clay changed shape.", stretch: "It stretched long. The clay changed shape." } },
        { id: "band", pic: "➰", label: "an elastic band", changes: true, says: { squash: "It squashed up small.", bend: "It bent easily.", twist: "It twisted round and round.", stretch: "It stretched wide, then sprang back!" } },
        { id: "stone", pic: ICONS.rock, label: "a stone", changes: false, says: { squash: "Nothing happened. The stone did not change.", bend: "It will not bend.", twist: "It will not twist.", stretch: "It will not stretch. The stone keeps its shape." } },
      ],
      draw(box, item, anim) {
        const tf = { squash: "scale(1.6, 0.45)", bend: "rotate(-30deg) skewX(20deg)", twist: "rotate(180deg) scaleX(0.6)", stretch: "scale(2.1, 0.8)" }[anim] || "";
        box.innerHTML = '<div style="display:grid;place-items:center;height:200px;font-size:90px"><span style="display:inline-block;transition:transform 500ms ease;transform:' + (item.changes ? tf : "") + '">' + item.pic + "</span></div>" +
          '<div class="tag">' + esc(item.label) + "</div>";
      },
      init(box, d) { SIMS.shapeChange.draw(box, ((d && d.things) || SIMS.shapeChange.items)[0], ""); },
      run(box, api) {
        return new Promise((done) => {
          let k = 0; let did = new Set(); let handing = false;
          const items = (api.data && api.data.things) || SIMS.shapeChange.items;
          const paint = () => {
            api.controls.innerHTML = ["squash", "bend", "twist", "stretch"].map((a) => '<button type="button" class="big small' + (did.has(a) ? " ghost" : "") + '" data-a="' + a + '">' + a[0].toUpperCase() + a.slice(1) + " it</button>").join("");
            api.controls.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
              /* Two actions move on to the next material after a beat. A
                 third press inside that beat would schedule a SECOND move and
                 skip a material (measured: items[k] undefined on the fourth
                 press), so the buttons are dead while the hand-over waits. */
              if (handing) return;
              const a = b.dataset.a; did.add(a);
              SIMS.shapeChange.draw(box, items[k], a); SOUND.play(items[k].changes ? "boing" : "thud", 0.4);
              api.say(items[k].says[a]);
              if (did.size >= 2) {
                handing = true;
                api.controls.querySelectorAll("button").forEach((x) => { x.disabled = true; });
                setTimeout(() => {
                  k++; did = new Set(); handing = false;
                  if (k >= items.length) { api.controls.innerHTML = ""; done(); return; }
                  SIMS.shapeChange.draw(box, items[k], ""); api.say("Now try " + items[k].label + ".");
                  paint();
                }, 1800);
              } else paint();
            }));
          };
          paint();
        });
      },
    },
    /* catch the globe ten times: where did your finger land? */
    globeCatch: {
      LANDINGS: ["water", "water", "land", "water", "water", "water", "land", "water", "land", "water"],
      init(box) { box.innerHTML = SCENES.globe(0) + '<div class="tag">Earth</div>'; },
      run(box, api) {
        return new Promise((done) => {
          let n = 0, water = 0, land = 0, turn = 0;
          api.controls.innerHTML = '<div class="pelist" id="' + api.id + 't"></div><div class="simrow"><button type="button" class="big teal small" id="' + api.id + 'c">\u{1F30D} Catch it!</button></div>';
          const tally = () => { $(api.id + "t").innerHTML = '<span class="hit">\u{1F4A7} water: ' + water + "</span><span>⛰️ land: " + land + "</span><span>catches: " + n + " of 10</span>"; };
          tally();
          $(api.id + "c").addEventListener("click", () => {
            if (n >= 10) return;
            const where = SIMS.globeCatch.LANDINGS[n]; n++; turn += 137;
            if (where === "water") water++; else land++;
            box.innerHTML = SCENES.globe(turn) + '<div class="tag">catch ' + n + "</div>" +
              '<div style="position:absolute;left:' + (where === "water" ? 44 : 52) + '%;top:' + (where === "water" ? 58 : 32) + '%;font-size:40px;transform:translate(-50%,-50%)">\u{1F446}</div>';
            SOUND.play(where === "water" ? "splash" : "thud", 0.35);
            tally();
            api.say(where === "water" ? "Water." : "Land.");
            if (n >= 10) setTimeout(() => { api.say("Ten catches. Seven landed on water and three on land. Earth is mostly water!"); api.controls.innerHTML = '<div class="pelist"><span class="hit">\u{1F4A7} water: 7</span><span>⛰️ land: 3</span></div>'; done(); }, 900);
          });
        });
      },
    },
    /* two cups of water, one in the sun and one in the shade; thermometers */
    sunShade: {
      draw(box, hour, a, b) {
        const therm = (x, v, col) => '<rect x="' + (x - 6) + '" y="60" width="12" height="90" rx="6" fill="#fff"/><rect x="' + (x - 4) + '" y="' + (148 - v) + '" width="8" height="' + v + '" rx="4" fill="' + col + '"/><circle cx="' + x + '" cy="152" r="10" fill="' + col + '"/>';
        box.innerHTML = '<svg viewBox="0 0 320 240" role="img" aria-label="Two cups of water with thermometers, one in the sun and one in the shade"><rect width="320" height="240" fill="#BFE3F5"/><circle cx="60" cy="40" r="26" fill="#F4C95D"/>' +
          '<rect x="0" y="190" width="320" height="50" fill="#3E8E4A"/>' +
          '<rect x="190" y="40" width="20" height="150" fill="#6B4A2B"/><circle cx="200" cy="60" r="60" fill="#2F8F45"/><ellipse cx="240" cy="192" rx="80" ry="10" fill="#0B1D2C" opacity="0.35"/>' +
          '<text x="60" y="190" text-anchor="middle" font-size="44">\u{1F964}</text><text x="250" y="190" text-anchor="middle" font-size="44">\u{1F964}</text>' +
          therm(110, a, "#E9744F") + therm(300, b, "#6E9DE8") +
          '<text x="60" y="222" text-anchor="middle" font-size="13" font-family="Inter, sans-serif" font-weight="800" fill="#fff">in the sun</text><text x="250" y="222" text-anchor="middle" font-size="13" font-family="Inter, sans-serif" font-weight="800" fill="#fff">in the shade</text>' +
          '<text x="12" y="234" font-size="13" font-family="Inter, sans-serif" font-weight="800" fill="#0B1D2C">' + (hour ? hour + (hour === 1 ? " hour" : " hours") + " later" : "the start") + "</text></svg>";
      },
      init(box) { SIMS.sunShade.draw(box, 0, 20, 20); },
      run(box, api) {
        return new Promise((done) => {
          let h = 0;
          api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'w">⏳ Wait an hour</button>';
          $(api.id + "w").addEventListener("click", () => {
            if (h >= 3) return;
            h++; SIMS.sunShade.draw(box, h, 20 + h * 22, 20 + h * 5); SOUND.play("click", 0.4);
            api.say(h < 3 ? "The red line in the sun is climbing. The one in the shade has hardly moved." : "Three hours. The water in the sun is warm. The water in the shade is still cool. The Sun gives us heat.");
            if (h >= 3) setTimeout(() => { api.controls.innerHTML = ""; done(); }, 1200);
          });
        });
      },
    },
  };

  /* ==================================================================
     RENDERERS
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

  /* ---- sort each thing into a bin ----------------------------------- */
  function sortBins(o) {
    const el = o.el, items = shuffle(o.items), trays = {};
    let i = 0, right = 0, lock = false;
    o.bins.forEach((b) => { trays[b.id] = []; });
    function draw() {
      lock = false;
      const it = items[i];
      $(el.stage).innerHTML = '<div class="stagewide"><div class="sortnow" id="' + el.stage + 'now">' + picHtml(it.pic) + '<span class="lab">' + esc(it.label) + "</span></div>" +
        '<div class="bins">' + o.bins.map((b) => '<button type="button" class="bin" data-b="' + b.id + '"><span class="bpic" aria-hidden="true">' + small(b.pic) + "</span>" + esc(b.label) + '<span class="tray" aria-hidden="true">' + trays[b.id].map(small).join("") + "</span></button>").join("") + "</div></div>";
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
      trays[it.bin].push(it.pic);
      i++;
      setTimeout(() => {
        if (i >= items.length) {
          $(el.stage).querySelector(".sortnow").innerHTML = '<span class="lab">All sorted!</span>';
          $(el.stage).querySelectorAll(".bin").forEach((x) => { x.classList.remove("right", "wrong"); const bid = x.dataset.b; x.querySelector(".tray").innerHTML = trays[bid].map(small).join(""); });
          $(el.score).textContent = "";
          const line = "You sorted " + right + " of " + items.length + " first time. " + o.done;
          $(el.fb).className = "fb good"; $(el.fb).textContent = line;
          reportScore(o.finish, right, items.length);
          finish(o.finish, line);
        } else draw();
      }, ok ? 2100 : 3000);
    });
    draw();
  }

  /* ---- predict, try it, say what happened, say if it matched -------- */
  function experiment(o) {
    const el = o.el, sim = SIMS[o.sim];
    let predicted = null, score = 0, lock = false;
    const stage = $(el.stage);
    stage.innerHTML = '<div class="stagewide"><span class="phase" id="' + el.stage + 'ph">1 · Predict</span>' +
      '<div class="sim" id="' + el.stage + 'sim"></div><div class="simrow" id="' + el.stage + 'ctl"></div></div>';
    const box = $(el.stage + "sim"), ctl = $(el.stage + "ctl"), ph = $(el.stage + "ph");
    /* data: the step's own data, so a sim can be given its own objects -
       Grade 2 must not replay Grade 1's simulation as it was (validation v2) */
    const api = { id: el.stage, controls: ctl, say: (t) => sayHere(o.finish, t), data: o };
    sim.init(box, o);
    function choices(opts, cls) {
      $(el.ch).classList.add("stack");
      $(el.ch).innerHTML = shuffle(opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '" data-t="' + esc(c.t) + '">' + c.t + "</button>").join("");
    }
    function askPredict() {
      ph.textContent = "1 · Predict"; $(el.ask).innerHTML = o.predict.ask; choices(o.predict.opts);
      $(el.score).textContent = "What do you think will happen?";
    }
    function runIt() {
      ph.textContent = "2 · Try it"; $(el.ask).innerHTML = o.runAsk || "Now let us try it and watch carefully.";
      $(el.ch).innerHTML = ""; $(el.score).textContent = "Press the button and watch";
      sayHere(o.finish, plain(o.runAsk || "Now let us try it. Press the button and watch carefully."));
      sim.run(box, api).then(() => setTimeout(askHappened, 1800));
    }
    function askHappened() {
      phase = "happened";
      ph.textContent = "3 · What happened?"; $(el.ask).innerHTML = o.happened.ask; choices(o.happened.opts);
      $(el.score).textContent = "Say what you saw"; lock = false;
      sayHere(o.finish, plain(o.happened.ask));
    }
    function askConclude() {
      phase = "conclude";
      ph.textContent = "5 · Conclude"; $(el.ask).innerHTML = o.conclude.ask; choices(o.conclude.opts);
      $(el.score).textContent = "What does this tell us?"; lock = false;
      sayHere(o.finish, plain(o.conclude.ask));
    }
    function askMatched() {
      ph.textContent = "4 · Did it match?";
      $(el.ask).innerHTML = "You predicted: <b>" + esc(predicted.t) + "</b>. Did it match what happened?";
      $(el.ch).innerHTML = '<button type="button" class="choice text" data-m="1">Yes, it matched my prediction</button><button type="button" class="choice text" data-m="0">No, something different happened</button>';
      $(el.score).textContent = "Scientists always check"; lock = false;
      sayHere(o.finish, "You predicted " + predicted.t + ". Did it match what happened?");
    }
    let phase = "predict";
    askPredict();
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; });
      if (phase === "predict") {
        predicted = { t: b.dataset.t, ok: b.dataset.ok === "1" };
        b.classList.add("right");
        $(el.fb).className = "fb"; $(el.fb).textContent = "Your prediction: " + predicted.t + ". Let us find out!";
        say("You predict: " + predicted.t + ". A prediction is a good guess before you try. Let us find out!");
        phase = "run"; setTimeout(() => { $(el.fb).textContent = ""; runIt(); }, 2600);
      } else if (phase === "happened") {
        const ok = b.dataset.ok === "1";
        $(el.ch).querySelectorAll(".choice").forEach((c) => { if (c.dataset.ok === "1") c.classList.add("right"); });
        if (!ok) b.classList.add("wrong"); else score++;
        $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = (ok ? cheer() + " " : "Look again. ") + o.happened.why;
        say((ok ? cheer() + " " : "Look again. ") + o.happened.why);
        phase = "matched"; setTimeout(() => { $(el.fb).textContent = ""; askMatched(); }, 3000);
      } else if (phase === "matched") {
        const saidYes = b.dataset.m === "1", truth = predicted.ok, ok = saidYes === truth;
        b.classList.add(ok ? "right" : "wrong");
        if (ok) score++;
        const line = truth
          ? (ok ? "Yes! Your prediction was right. " : "Look back: your prediction was right after all. ") + "Well done."
          : (ok ? "That is right, it did not match. " : "Look back: you predicted " + predicted.t + ", and something different happened. ") + "That is fine. Scientists learn most when they are surprised.";
        $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = line; say(line);
        /* Stage 3 adds a conclusion (3TWSa.03): what the result tells us
           about the question. Without one, the step ends here as before. */
        if (o.conclude) { setTimeout(() => { $(el.fb).textContent = ""; askConclude(); }, 3200); return; }
        phase = "done";
        reportScore(o.finish, score, 2);
        setTimeout(() => { $(el.ch).innerHTML = ""; $(el.score).textContent = ""; $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }, 3200);
      } else if (phase === "conclude") {
        const ok = b.dataset.ok === "1";
        $(el.ch).querySelectorAll(".choice").forEach((c) => { if (c.dataset.ok === "1") c.classList.add("right"); });
        if (!ok) b.classList.add("wrong"); else score++;
        $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = (ok ? cheer() + " " : "Think about what you saw. ") + o.conclude.why;
        say($(el.fb).textContent);
        phase = "done";
        reportScore(o.finish, score, 3);
        setTimeout(() => { $(el.ch).innerHTML = ""; $(el.score).textContent = ""; $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }, 3400);
      }
    });
  }

  /* ---- predict for each thing, then try it ----------------------------- */
  function predictEach(o) {
    const el = o.el, sim = SIMS[o.sim], items = o.items.slice();
    let i = 0, hits = 0, lock = false, guess = null;
    const results = [];
    $(el.stage).innerHTML = '<div class="stagewide"><div class="peitem" id="' + el.stage + 'it"></div><div class="sim" id="' + el.stage + 'sim"></div><div class="pelist" id="' + el.stage + 'list"></div></div>';
    const box = $(el.stage + "sim"), api = { id: el.stage, say: (t) => sayHere(o.finish, t) };
    sim.init(box);
    function paintList() {
      $(el.stage + "list").innerHTML = results.map((r) => '<span class="' + (r.hit ? "hit" : "miss") + '">' + small(r.pic) + " " + esc(r.result) + "</span>").join("");
    }
    function draw() {
      lock = false; guess = null;
      const it = items[i];
      $(el.stage + "it").innerHTML = picHtml(it.pic) + '<span class="lab">' + esc(it.label) + "</span>";
      $(el.ask).innerHTML = o.ask.replace("%s", "<b>" + esc(it.label) + "</b>");
      $(el.ch).innerHTML = o.choices.map((c) => '<button type="button" class="choice pic" data-c="' + c.id + '"><span class="cpic" aria-hidden="true">' + small(c.pic) + "</span>" + esc(c.t) + "</button>").join("");
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.score).textContent = "Thing " + (i + 1) + " of " + items.length + " · predict first";
      sayHere(o.finish, plain(o.ask.replace("%s", it.label)));
    }
    $(el.ch).addEventListener("click", (e) => {
      /* The Try-it button is a .big, not a .choice, so it is matched FIRST:
         the first version looked for .choice alone and returned before it
         ever saw the button, which left a child who had just predicted with
         a button that did nothing. Found by driving the step, not by eye. */
      const b = e.target.closest("[data-go], .choice"); if (!b || lock) return;
      const it = items[i];
      if (guess === null) {
        if (b.dataset.go) return;
        guess = b.dataset.c;
        $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; });
        b.classList.add("right");
        $(el.fb).className = "fb"; $(el.fb).textContent = "You predict: " + (o.choices.find((c) => c.id === guess) || {}).t + ". Now try it!";
        $(el.ch).innerHTML = '<button type="button" class="big teal" data-go="1">' + esc(o.tryLabel || "Try it") + "</button>";
        return;
      }
      if (b.dataset.go) {
        lock = true; $(el.ch).innerHTML = "";
        sim.act(box, it, api).then(() => {
          const hit = guess === it.answer, resultText = (o.choices.find((c) => c.id === it.answer) || {}).t;
          if (hit) hits++;
          results.push({ pic: it.pic, result: resultText, hit }); paintList();
          $(el.fb).className = "fb " + (hit ? "good" : "bad");
          $(el.fb).textContent = (hit ? "Your prediction was right! " : "Different from your prediction. ") + it.why;
          setTimeout(() => say((hit ? "Your prediction was right. " : "That was different from your prediction. ") + it.why), 200);
          i++;
          setTimeout(() => {
            if (i >= items.length) {
              const line = "You predicted " + hits + " of " + items.length + " right. " + o.done;
              $(el.ask).innerHTML = "All done!"; $(el.score).textContent = "";
              $(el.fb).className = "fb good"; $(el.fb).textContent = line;
              reportScore(o.finish, hits, items.length);
              finish(o.finish, line);
            } else draw();
          }, 3400);
        });
      }
    });
    draw();
  }

  /* ---- record what happened in a simple table ----------------------- */
  function recordTable(o) {
    const el = o.el;
    let row = 0, right = 0, lock = false;
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide"><table class="rec"><thead><tr><th>' + esc(o.columns[0]) + "</th><th>" + esc(o.columns[1]) + "</th></tr></thead><tbody>" +
        o.rows.map((r, k) => '<tr><td><span class="rowlab">' + picHtml(r.pic, "pic") + esc(r.label) + '</span></td><td><button type="button" class="cell' + (k === row ? " now" : "") + (r.filled ? " filled " + (r.ok ? "right" : "") : "") + '" data-k="' + k + '"' + (k !== row ? " disabled" : "") + ">" + (r.filled ? esc(r.filled) : (k === row ? "tap to fill in" : "…")) + "</button></td></tr>").join("") + "</tbody></table></div>";
    }
    function offer() {
      lock = false;
      const r = o.rows[row];
      $(el.ask).innerHTML = o.ask.replace("%s", "<b>" + esc(r.label) + "</b>");
      $(el.ch).innerHTML = o.choices.map((c) => '<button type="button" class="choice pic" data-c="' + c.id + '"><span class="cpic" aria-hidden="true">' + small(c.pic) + "</span>" + esc(c.t) + "</button>").join("");
      $(el.score).textContent = "Row " + (row + 1) + " of " + o.rows.length;
      sayHere(o.finish, plain(o.ask.replace("%s", r.label)));
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const r = o.rows[row], ok = b.dataset.c === r.answer, chosen = o.choices.find((c) => c.id === b.dataset.c) || {};
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.c === r.answer) c.classList.add("right"); });
      if (ok) right++; else b.classList.add("wrong");
      r.filled = (o.choices.find((c) => c.id === r.answer) || {}).t; r.ok = true;
      $(el.fb).className = "fb " + (ok ? "good" : "bad");
      $(el.fb).textContent = ok ? cheer() + " " + (r.why || "That is what happened.") : "Look again at what happened: " + (r.why || "the " + r.label + " " + r.filled + ".");
      say($(el.fb).textContent);
      row++; draw();
      setTimeout(() => {
        $(el.fb).textContent = ""; $(el.fb).className = "fb";
        if (row >= o.rows.length) {
          $(el.ch).innerHTML = ""; $(el.score).textContent = "";
          $(el.ask).innerHTML = "Your table is complete.";
          const line = "Your table is complete. You recorded " + right + " of " + o.rows.length + " first time. " + o.done;
          $(el.fb).className = "fb good"; $(el.fb).textContent = line;
          reportScore(o.finish, right, o.rows.length);
          finish(o.finish, line);
        } else offer();
      }, 2600);
    });
    draw(); offer();
  }

  /* ---- measure in hands, cubes or steps ----------------------------- */
  function measure(o) {
    const el = o.el, maxU = Math.max.apply(null, o.objects.map((x) => x.units));
    let k = 0, n = 0, lock = false, asked = false;
    function draw() {
      const ob = o.objects[k], slot = 90 / maxU;
      $(el.stage).innerHTML = '<div class="measure"><div class="mtrack"><div class="obj" style="width:' + (ob.units * slot) + '%">' + small(ob.pic) + " " + esc(ob.label) + "</div>" +
        Array.from({ length: n }, (_, i) => '<div class="unit" style="left:calc(12px + ' + (i * slot) + '%);width:' + slot + '%">' + small(o.unit.pic) + "<b>" + (i + 1) + "</b></div>").join("") + "</div>" +
        '<div class="mcount">' + n + " " + esc(n === 1 ? o.unit.singular : o.unit.name) + "</div>" +
        '<div class="bigbtns"><button type="button" class="big teal small" id="' + el.stage + 'add">' + small(o.unit.pic) + " " + esc(o.unit.button) + "</button></div></div>";
      $(el.score).textContent = "Measuring " + (k + 1) + " of " + o.objects.length;
      $(el.ask).innerHTML = o.ask.replace("%s", "<b>" + esc(ob.label) + "</b>");
      $(el.stage + "add").addEventListener("click", () => {
        if (lock) return;
        n++; SOUND.play("click", 0.4); draw();
        say(String(n));
        if (n >= ob.units) {
          lock = true;
          const line = ob.label[0].toUpperCase() + ob.label.slice(1) + " is " + ob.units + " " + o.unit.name + " " + (o.dim || "long") + ".";
          $(el.fb).className = "fb good"; $(el.fb).textContent = line; setTimeout(() => say(line), 500);
          setTimeout(() => {
            $(el.fb).textContent = ""; k++; n = 0; lock = false;
            if (k >= o.objects.length) compare(); else draw();
          }, 3000);
        }
      });
    }
    function compare() {
      asked = true;
      $(el.stage).innerHTML = '<div class="stagewide"><div class="pelist">' + o.objects.map((ob) => "<span>" + small(ob.pic) + " " + esc(ob.label) + ": " + ob.units + "</span>").join("") + "</div></div>";
      $(el.ask).innerHTML = o.compare.ask;
      $(el.score).textContent = "Compare";
      $(el.ch).innerHTML = shuffle(o.compare.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      $(el.ch).classList.add("stack");
      sayHere(o.finish, plain(o.compare.ask));
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || !asked || lock) return;
      lock = true;
      const ok = b.dataset.ok === "1";
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = (ok ? cheer() + " " : "") + o.compare.why; say($(el.fb).textContent);
      reportScore(o.finish, ok ? 1 : 0, 1);
      setTimeout(() => { $(el.ch).innerHTML = ""; $(el.score).textContent = ""; $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }, 2600);
    });
    draw();
  }

  /* ---- tap the named part of a figure -------------------------------- */
  function labelParts(o) {
    const el = o.el, order = shuffle(o.parts), found = new Set();
    let i = 0, right = 0, lock = false;
    $(el.stage).innerHTML = '<div class="stagewide"><div class="figure" id="' + el.stage + 'fig">' + FIGURES[o.figure]() + '</div><div class="partlist" id="' + el.stage + 'pl"></div></div>';
    const fig = $(el.stage + "fig");
    function paintList() {
      $(el.stage + "pl").innerHTML = o.parts.map((p) => '<span class="' + (found.has(p.id) ? "found" : (order[i] && order[i].id === p.id ? "now" : "")) + '">' + esc(p.label) + "</span>").join("");
    }
    function ask() {
      lock = false;
      const p = order[i];
      $(el.ask).innerHTML = o.ask.replace("%s", "<b>" + esc(p.label) + "</b>");
      $(el.score).textContent = "Part " + (i + 1) + " of " + order.length;
      paintList();
      sayHere(o.finish, plain(o.ask.replace("%s", p.label)));
    }
    /* a keyboard user tabs between the parts and presses Enter or Space */
    fig.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const g = e.target.closest("[data-part]"); if (!g) return;
      e.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    fig.addEventListener("click", (e) => {
      const g = e.target.closest("[data-part]"); if (!g || lock) return;
      const p = order[i], hit = g.dataset.part === p.id;
      if (hit) {
        lock = true; right++; found.add(p.id); g.classList.add("found"); SOUND.play("ding", 0.35);
        $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " " + p.say; say(cheer() + " " + p.say);
        i++;
        setTimeout(() => {
          $(el.fb).textContent = ""; $(el.fb).className = "fb";
          if (i >= order.length) {
            paintList(); $(el.ask).innerHTML = "You found every part."; $(el.score).textContent = "";
            const line = "You found all " + order.length + ". " + o.done;
            $(el.fb).className = "fb good"; $(el.fb).textContent = line;
            reportScore(o.finish, right, order.length + 0);
            finish(o.finish, line);
          } else ask();
        }, 2600);
      } else {
        const other = o.parts.find((x) => x.id === g.dataset.part);
        g.classList.add("ping"); setTimeout(() => g.classList.remove("ping"), 700);
        $(el.fb).className = "fb bad"; $(el.fb).textContent = "That is the " + (other ? other.label : "wrong part") + ". Find the " + p.label + ".";
        say("That is the " + (other ? other.label : "wrong part") + ". Find the " + p.label + ".");
      }
    });
    ask();
  }

  /* ---- a demonstration the child steps through ----------------------- */
  function demo(o) {
    const el = o.el, frames = o.frames;
    let k = 0;
    function pic(f) {
      if (f.scene) { const s = SCENES[f.scene.id](f.scene.state); return s.startsWith("<svg") ? '<div class="sim">' + s + "</div>" : picHtml(s); }
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

  /* ---- the material tester ------------------------------------------ */
  function tester(o) {
    const el = o.el, need = Math.min(o.need || 3, o.materials.length);
    let m = 0; const done = {}, results = {};
    o.materials.forEach((x) => { done[x.id] = new Set(); results[x.id] = []; });
    function draw(anim) {
      const mat = o.materials[m];
      $(el.stage).innerHTML = '<div class="tester"><div class="matrow">' + o.materials.map((x, k) => '<button type="button" class="mat' + (k === m ? " now" : "") + (done[x.id].size >= o.tests.length ? " done" : "") + '" data-k="' + k + '"><span class="cpic" aria-hidden="true">' + small(x.pic) + "</span>" + esc(x.label) + "</button>").join("") + "</div>" +
        '<div class="sim"><div style="display:grid;place-items:center;height:150px;font-size:84px"><span style="display:inline-block;transition:transform 450ms ease;transform:' + (anim || "") + '">' + small(mat.pic) + '</span></div><div class="tag">' + esc(mat.label) + "</div></div>" +
        '<div class="badges">' + results[mat.id].map((r) => '<span class="badge">' + esc(r) + "</span>").join("") + "</div>" +
        '<div class="tests">' + o.tests.map((t) => '<button type="button" class="big small' + (done[mat.id].has(t.id) ? " ghost" : " teal") + '" data-t="' + t.id + '">' + small(t.pic) + " " + esc(t.label) + "</button>").join("") + "</div></div>";
      const finished = o.materials.filter((x) => done[x.id].size >= o.tests.length).length;
      $(el.score).textContent = finished + " of " + need + " materials fully tested";
    }
    $(el.stage).addEventListener("click", (e) => {
      const mb = e.target.closest(".mat");
      if (mb) { m = Number(mb.dataset.k); draw(); say(o.materials[m].label + ". Test it."); return; }
      const tb = e.target.closest("[data-t]"); if (!tb) return;
      const mat = o.materials[m], t = o.tests.find((x) => x.id === tb.dataset.t), res = mat.props[t.id];
      done[mat.id].add(t.id);
      if (!results[mat.id].includes(res)) results[mat.id].push(res);
      SOUND.play(t.sound || "click", 0.4);
      draw(t.anim && (mat.animates ? mat.animates[t.id] !== false : true) ? t.anim : "");
      const line = t.say.replace("%m", mat.label).replace("%r", res);
      $(el.fb).className = "fb good"; $(el.fb).innerHTML = "<b>" + esc(res) + "</b> — " + esc(line); say(line);
      const finished = o.materials.filter((x) => done[x.id].size >= o.tests.length).length;
      reportAttempt(o.finish, finished, need, "materials");
      if (finished >= need && !$(el.stage).dataset.done) {
        $(el.stage).dataset.done = "1";
        setTimeout(() => { $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }, 2800);
      }
    });
    draw();
  }

  /* ---- ask a question, then say how to find out ----------------------- */
  function askQuestion(o) {
    const el = o.el;
    let picked = false, lock = false, fo = o.findOut;
    $(el.stage).innerHTML = '<div class="stagewide">' + picHtml(o.pic, "askpic") + '<div class="qlist">' + o.questions.map((q, k) => '<button type="button" class="qbtn" data-k="' + k + '">' + esc(q) + "</button>").join("") + "</div></div>";
    $(el.score).textContent = "Pick a question you would like to ask";
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".qbtn"); if (!b || picked) return;
      picked = true; b.classList.add("picked");
      $(el.stage).querySelectorAll(".qbtn").forEach((x) => { x.disabled = true; });
      $(el.fb).className = "fb good"; $(el.fb).textContent = "Good question! Scientists start with a question.";
      say("Good question! " + b.textContent + " Scientists start with a question. Now, how could we find out?");
      setTimeout(() => {
        $(el.fb).textContent = ""; $(el.fb).className = "fb";
        fo = (o.findOuts && o.findOuts[Number(b.dataset.k)]) || o.findOut;
        $(el.ask).innerHTML = fo.ask; $(el.score).textContent = "How could we find the answer?";
        $(el.ch).classList.add("stack");
        $(el.ch).innerHTML = shuffle(fo.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      }, 3200);
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const ok = b.dataset.ok === "1";
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = (ok ? cheer() + " " : "") + fo.why; say($(el.fb).textContent);
      reportScore(o.finish, ok ? 1 : 0, 1);
      setTimeout(() => { $(el.ch).innerHTML = ""; $(el.score).textContent = ""; $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }, 2600);
    });
  }

  /* ==================================================================
     STAGE 2 - what Grade 2 asked for that Grade 1 did not have.
     Same rules as everything above: a step is a KIND of doing, a sim is
     a real state machine, and nothing here waits on a paint callback.
     ================================================================== */

  /* ---- put things in order ------------------------------------------
     Life stages (egg, chick, hen), a day (morning, midday, evening). The
     child taps what comes FIRST, then next; a wrong tap shakes and says
     which end it belongs at rather than just "no". */
  function order(o) {
    const el = o.el, items = o.items, placed = [];
    let lock = false, wrong = 0;
    function draw() {
      const left = items.filter((_, k) => !placed.includes(k));
      $(el.stage).innerHTML = '<div class="stagewide"><div class="orderrow">' +
        (placed.length ? placed.map((k, p) => '<span class="ordered"><b>' + (p + 1) + "</b>" + small(items[k].pic) + " " + esc(items[k].label) + "</span>").join('<span class="arrow" aria-hidden="true">&rarr;</span>') : '<span class="sub">Tap what comes first</span>') +
        '</div><div class="cardsgrid" id="' + el.stage + 'pool">' + shuffle(items.map((it, k) => ({ it, k }))).filter((x) => !placed.includes(x.k)).map((x) =>
          '<button type="button" class="tapcard" data-k="' + x.k + '"><span class="cpic" aria-hidden="true">' + small(x.it.pic) + "</span>" + esc(x.it.label) + "</button>").join("") + "</div></div>";
      $(el.score).textContent = placed.length + " of " + items.length + " in order";
      if (left.length === 0) return;
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

  /* ---- a block graph the child builds, then reads a pattern from -----
     The values are given (they came from the experiment or the count the
     step before); the child stacks a block per unit in each column, and
     the graph is finished when every column is the right height. Then
     one question about the pattern - increasing, decreasing, the biggest,
     the smallest - which is 2TWSa.02, and the graph itself is 2TWSa.03. */
  function blockGraph(o) {
    const el = o.el, cols = o.columns, count = cols.map(() => 0);
    const maxV = Math.max.apply(null, cols.map((c) => c.value));
    let asked = false, lock = false;
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide"><table class="rec small"><thead><tr><th>' + esc(o.columns_label || "") + "</th><th>" + esc(o.value_label || "how many") + "</th></tr></thead><tbody>" +
        cols.map((c) => '<tr><td><span class="rowlab">' + small(c.pic) + " " + esc(c.label) + '</span></td><td><span class="cell filled">' + c.value + (o.unit ? " " + esc(o.unit) : "") + "</span></td></tr>").join("") + "</tbody></table>" +
        '<div class="graph' + (o.bar ? " bar" : "") + (o.dot ? " dot" : "") + '" role="img" aria-label="' + (o.dot ? "A dot plot" : o.bar ? "A bar chart" : "A block graph") + '">' +
        (o.bar ? '<div class="gaxis" aria-hidden="true" style="height:' + (maxV * 26 + 6) + 'px">' + Array.from({ length: maxV }, (_, i) => "<span>" + (maxV - i) + "</span>").join("") + "</div>" : "") + cols.map((c, k) =>
          '<div class="gcol"><div class="gstack" style="height:' + (maxV * 26 + 6) + 'px">' + Array.from({ length: count[k] }, () => '<i class="gblock"></i>').join("") + "</div>" +
          '<button type="button" class="big small' + (count[k] >= c.value ? " ghost" : " teal") + '" data-k="' + k + '"' + (count[k] >= c.value ? " disabled" : "") + '>' + (o.dot ? "+ dot" : o.bar ? "+ 1" + (o.unit ? " " + esc(o.unitOne || o.unit.replace(/s$/, "")) : "") : "+ block") + '</button>' +
          '<span class="glab">' + small(c.pic) + "<br>" + esc(c.label) + (count[k] >= c.value ? " &#10003;" : "") + "</span></div>").join("") + "</div></div>";
      const done = cols.filter((c, k) => count[k] >= c.value).length;
      $(el.score).textContent = done + " of " + cols.length + " columns built";
    }
    function askPattern() {
      asked = true;
      $(el.ask).innerHTML = o.pattern.ask;
      $(el.ch).classList.add("stack");
      $(el.ch).innerHTML = shuffle(o.pattern.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      $(el.score).textContent = "Read the graph";
      sayHere(o.finish, plain(o.pattern.ask));
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest("[data-k]"); if (!b || asked) return;
      const k = Number(b.dataset.k);
      if (count[k] >= cols[k].value) return;
      count[k]++; SOUND.play("click", 0.35); draw();
      if (count[k] === cols[k].value) { $(el.fb).className = "fb good"; $(el.fb).textContent = cols[k].label + ": " + cols[k].value + ". That column is right."; say(cols[k].label + ", " + cols[k].value + "."); }
      if (cols.every((c, j) => count[j] >= c.value)) {
        reportAttempt(o.finish, cols.length, cols.length, "columns");
        setTimeout(() => { $(el.fb).textContent = ""; $(el.fb).className = "fb"; askPattern(); }, 1800);
      }
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const ok = b.dataset.ok === "1";
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = (ok ? cheer() + " " : "Look at the columns again. ") + o.pattern.why; say($(el.fb).textContent);
      reportScore(o.finish, ok ? 1 : 0, 1);
      setTimeout(() => { $(el.ch).innerHTML = ""; $(el.score).textContent = ""; $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }, 2800);
    });
    draw();
  }

  /* ---- find the answer in a fact card ---------------------------------
     2TWSc.05: use a given secondary source. The card stays on screen while
     the questions are asked, and each answer is IN the card, so the skill
     being practised is reading for an answer rather than remembering one. */
  function lookup(o) {
    const el = o.el;
    let i = 0, right = 0, lock = false;
    $(el.stage).innerHTML = '<div class="stagewide"><div class="factcard"><h3>' + esc(o.source.title) + "</h3>" +
      o.source.lines.map((l) => "<p>" + l + "</p>").join("") + "</div></div>";
    function draw() {
      lock = false;
      const it = o.items[i];
      $(el.ask).innerHTML = it.ask;
      $(el.ch).classList.add("stack");
      $(el.ch).innerHTML = shuffle(it.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.score).textContent = "Find it in the card: question " + (i + 1) + " of " + o.items.length;
      sayHere(o.finish, plain(it.ask) + " Look in the card.");
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const it = o.items[i], ok = b.dataset.ok === "1";
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong"); else right++;
      $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = (ok ? cheer() + " " : "Read the card again. ") + it.why; say($(el.fb).textContent);
      i++;
      setTimeout(() => {
        if (i >= o.items.length) {
          $(el.ch).innerHTML = ""; $(el.score).textContent = "";
          const line = "You found " + right + " of " + o.items.length + " in the card. " + o.done;
          $(el.fb).className = "fb good"; $(el.fb).textContent = line;
          reportScore(o.finish, right, o.items.length);
          finish(o.finish, line);
        } else draw();
      }, 2700);
    });
    draw();
  }

  /* ---- build a model --------------------------------------------------
     2TWSm.02 (make and use a model) and 2Pe.03 (construct a circuit) in
     one shape: a palette of parts, a sim that accepts them one at a time
     and knows when the model is complete, then something to DO with the
     model (break the circuit, mend it) before the step is done. */
  function build(o) {
    const el = o.el, sim = SIMS[o.sim];
    const added = new Set();
    $(el.stage).innerHTML = '<div class="stagewide"><div class="sim" id="' + el.stage + 'sim"></div><div class="simrow" id="' + el.stage + 'ctl"></div>' +
      '<div class="cardsgrid" id="' + el.stage + 'parts">' + o.parts.map((p) => '<button type="button" class="tapcard" data-p="' + p.id + '"><span class="cpic" aria-hidden="true">' + small(p.pic) + "</span>" + esc(p.label) + "</button>").join("") + "</div></div>";
    const box = $(el.stage + "sim"), api = { id: el.stage, controls: $(el.stage + "ctl"), say: (t) => sayHere(o.finish, t),
      done: () => { $(el.stage + "parts").innerHTML = ""; $(el.score).textContent = ""; $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; reportAttempt(o.finish, o.parts.length, o.parts.length, "parts"); finish(o.finish, o.done); } };
    sim.init(box);
    $(el.score).textContent = "Tap each part to add it";
    $(el.stage + "parts").addEventListener("click", (e) => {
      const b = e.target.closest(".tapcard"); if (!b || added.has(b.dataset.p)) return;
      const part = o.parts.find((p) => p.id === b.dataset.p);
      added.add(part.id); b.classList.add("heard"); b.disabled = true;
      SOUND.play("click", 0.4);
      const line = sim.add(box, part.id, api);
      $(el.fb).className = "fb"; $(el.fb).textContent = line || part.label + " added."; say(line || part.label + " added.");
      $(el.score).textContent = added.size + " of " + o.parts.length + " parts added";
      if (added.size >= o.parts.length) setTimeout(() => sim.complete(box, api), 900);
    });
  }

  /* ---- Stage 2 figures ------------------------------------------------ */
  FIGURES.mouth = () => (
    '<svg viewBox="0 0 320 240" role="img" aria-label="An open mouth showing the teeth">' +
    '<ellipse cx="160" cy="120" rx="150" ry="100" fill="#C4453A"/>' +
    '<ellipse cx="160" cy="132" rx="118" ry="70" fill="#7A2E2E"/>' +
    '<g data-part="tongue" tabindex="0" role="button" aria-label="tongue"><ellipse cx="160" cy="170" rx="70" ry="28" fill="#E9744F"/><ellipse class="outline" cx="160" cy="170" rx="76" ry="34"/></g>' +
    '<g data-part="molars" tabindex="0" role="button" aria-label="molars"><g fill="#FFFDF6" stroke="#D9D2C0" stroke-width="2">' +
    '<rect x="44" y="82" width="26" height="24" rx="6"/><rect x="72" y="72" width="26" height="24" rx="6"/><rect x="222" y="72" width="26" height="24" rx="6"/><rect x="250" y="82" width="26" height="24" rx="6"/>' +
    '<rect x="44" y="140" width="26" height="24" rx="6"/><rect x="72" y="150" width="26" height="24" rx="6"/><rect x="222" y="150" width="26" height="24" rx="6"/><rect x="250" y="140" width="26" height="24" rx="6"/></g>' +
    '<path class="outline" d="M40 68 h62 v42 h-62z M218 68 h62 v42 h-62z M40 136 h62 v42 h-62z M218 136 h62 v42 h-62z"/></g>' +
    '<g data-part="canines" tabindex="0" role="button" aria-label="canines"><g fill="#FFFDF6" stroke="#D9D2C0" stroke-width="2">' +
    '<path d="M104 62 h18 v18 l-9 16 l-9 -16z"/><path d="M198 62 h18 v18 l-9 16 l-9 -16z"/><path d="M104 178 h18 v-18 l-9 -16 l-9 16z"/><path d="M198 178 h18 v-18 l-9 -16 l-9 16z"/></g>' +
    '<path class="outline" d="M100 56 h26 v46 h-26z M194 56 h26 v46 h-26z M100 138 h26 v46 h-26z M194 138 h26 v46 h-26z"/></g>' +
    '<g data-part="incisors" tabindex="0" role="button" aria-label="incisors"><g fill="#FFFDF6" stroke="#D9D2C0" stroke-width="2">' +
    '<rect x="126" y="58" width="16" height="30" rx="4"/><rect x="144" y="56" width="16" height="32" rx="4"/><rect x="162" y="56" width="16" height="32" rx="4"/><rect x="180" y="58" width="16" height="30" rx="4"/>' +
    '<rect x="126" y="152" width="16" height="30" rx="4"/><rect x="144" y="152" width="16" height="32" rx="4"/><rect x="162" y="152" width="16" height="32" rx="4"/><rect x="180" y="152" width="16" height="30" rx="4"/></g>' +
    '<rect class="outline" x="122" y="52" width="78" height="40" rx="8"/><rect class="outline" x="122" y="148" width="78" height="40" rx="8"/></g>' +
    "</svg>");

  function circuitSvg(state) {
    /* state: {cell, lamp, wireTop, wireBottom, gap, on} - missing parts are dashed ghosts */
    const g = (present) => present ? 'stroke="#F4C95D" stroke-width="6"' : 'stroke="#2B5673" stroke-width="4" stroke-dasharray="8 8"';
    const on = state.on && state.cell && state.lamp && state.wireTop && state.wireBottom && !state.gap;
    return '<svg viewBox="0 0 320 220" role="img" aria-label="A circuit: a cell, two wires and a lamp' + (on ? ", lit" : "") + '">' +
      '<rect width="320" height="220" fill="#0E2434"/>' +
      '<path d="M60 60 H260" fill="none" ' + g(state.wireTop) + ' stroke-linecap="round"/>' +
      (state.gap ? '<rect x="140" y="150" width="40" height="20" fill="#0E2434"/><text x="160" y="196" text-anchor="middle" fill="#F0806F" font-size="13" font-family="Inter, sans-serif" font-weight="800">a gap</text>' : "") +
      '<path d="M60 160 H' + (state.gap ? "140" : "260") + '" fill="none" ' + g(state.wireBottom) + ' stroke-linecap="round"/>' +
      (state.gap ? '<path d="M180 160 H260" fill="none" ' + g(state.wireBottom) + ' stroke-linecap="round"/>' : "") +
      '<g data-part="cell" tabindex="0" role="button" aria-label="cell"><path d="M60 60 V92 M60 128 V160" fill="none" ' + g(state.cell) + '/>' +
      (state.cell ? '<rect x="40" y="92" width="40" height="10" fill="#F4C95D"/><rect x="50" y="118" width="20" height="10" fill="#F4C95D"/><text x="26" y="118" fill="#93AABE" font-size="14" font-family="Inter, sans-serif" font-weight="800">cell</text>' : '<rect x="40" y="92" width="40" height="36" fill="none" stroke="#2B5673" stroke-dasharray="6 6"/>') +
      '<rect class="outline" x="30" y="84" width="60" height="52" rx="8"/></g>' +
      '<g data-part="wire" tabindex="0" role="button" aria-label="wires"><rect class="outline" x="92" y="48" width="136" height="24" rx="8"/></g>' +
      '<g data-part="lamp" tabindex="0" role="button" aria-label="lamp"><path d="M260 60 V88 M260 132 V160" fill="none" ' + g(state.lamp) + '/>' +
      (state.lamp ? '<circle cx="260" cy="110" r="22" fill="' + (on ? "#F4C95D" : "#1B3A52") + '" stroke="#F4C95D" stroke-width="4"/><path d="M246 96 L274 124 M274 96 L246 124" stroke="' + (on ? "#0E2434" : "#F4C95D") + '" stroke-width="3"/>' + (on ? '<g stroke="#F4C95D" stroke-width="3" stroke-linecap="round"><line x1="260" y1="74" x2="260" y2="66"/><line x1="292" y1="110" x2="300" y2="110"/><line x1="283" y1="87" x2="289" y2="81"/><line x1="283" y1="133" x2="289" y2="139"/></g>' : "") : '<circle cx="260" cy="110" r="22" fill="none" stroke="#2B5673" stroke-dasharray="6 6"/>') +
      '<text x="260" y="196" text-anchor="middle" fill="#93AABE" font-size="14" font-family="Inter, sans-serif" font-weight="800">' + (state.lamp ? (on ? "lamp ON" : "lamp off") : "") + "</text>" +
      '<circle class="outline" cx="260" cy="110" r="30"/></g>' +
      "</svg>";
  }
  FIGURES.circuit = () => circuitSvg({ cell: true, lamp: true, wireTop: true, wireBottom: true, on: true });

  /* ---- Stage 2 scenes ------------------------------------------------- */
  SCENES.habitat = (s) => {
    const sky = ["#BFE3F5", "#F6D28B", "#A9D3B6", "#DDEFF7"][s], ground = ["#3B7FD1", "#E0B86A", "#2F6B3A", "#EAF4FA"][s];
    const items = [
      '<text x="70" y="150" font-size="40">\u{1F438}</text><text x="200" y="120" font-size="40">\u{1F986}</text><text x="130" y="185" font-size="34">\u{1F41F}</text><text x="250" y="180" font-size="34">\u{1F33F}</text>',
      '<text x="60" y="170" font-size="44">\u{1F42A}</text><text x="200" y="160" font-size="40">\u{1F335}</text><text x="260" y="180" font-size="30">\u{1F98E}</text><text x="130" y="185" font-size="30">\u{1F982}</text>',
      '<text x="40" y="120" font-size="48">\u{1F333}</text><text x="220" y="120" font-size="48">\u{1F333}</text><text x="120" y="180" font-size="36">\u{1F98C}</text><text x="230" y="185" font-size="30">\u{1F344}</text><text x="170" y="100" font-size="26">\u{1F426}</text>',
      /* the Arctic: a polar bear and a seal. Penguins live in the far SOUTH, and the
         polar-bear emoji is an Emoji 13 sequence older devices split into a brown
         bear and a snowflake, so both are the kit's own drawings. */
      glyphAt(85, 172, 50, ICONS.polarbear) + glyphAt(222, 177, 44, ICONS.seal) + '<text x="130" y="110" font-size="30">❄️</text><text x="260" y="100" font-size="30">❄️</text>',
    ][s];
    const name = ["A pond", "A desert", "A forest", "The icy Arctic"][s];
    return '<svg viewBox="0 0 320 200" role="img" aria-label="' + name + '"><rect width="320" height="200" fill="' + sky + '"/><rect x="0" y="130" width="320" height="70" fill="' + ground + '"/>' + (s === 1 ? '<circle cx="270" cy="40" r="26" fill="#F4C95D"/>' : "") + items + "</svg>";
  };
  SCENES.extract = (s) => {
    const parts = [
      '<path d="M0 200 V90 L60 90 L60 120 L120 120 L120 150 L200 150 L200 180 L320 180 V200z" fill="#7D7F86"/><text x="230" y="140" font-size="40">\u{1F69C}</text><text x="70" y="80" font-size="34">\u{1F477}</text>',
      '<rect x="0" y="80" width="320" height="120" fill="#5B5D63"/><rect x="60" y="80" width="120" height="70" fill="#0B1D2C"/><text x="90" y="135" font-size="34">\u{1F477}</text><text x="220" y="140" font-size="34">\u{1F4A1}</text><rect x="0" y="60" width="320" height="20" fill="#3E8E4A"/>',
      '<path d="M0 120 Q160 80 320 120 V200 H0z" fill="#3B7FD1"/><ellipse cx="80" cy="170" rx="14" ry="8" fill="#B7B7B7"/><ellipse cx="150" cy="185" rx="10" ry="6" fill="#B7B7B7"/><ellipse cx="240" cy="165" rx="16" ry="9" fill="#B7B7B7"/><text x="180" y="120" font-size="34">\u{1F9CD}</text>',
    ][s];
    return '<svg viewBox="0 0 320 200" role="img" aria-label="' + ["A quarry", "A mine", "A riverbed"][s] + '"><rect width="320" height="200" fill="#BFE3F5"/>' + parts + "</svg>";
  };

  /* ---- Stage 2 sims ---------------------------------------------------- */
  SIMS.circuit = {
    state: null,
    init(box) { this.state = { cell: false, lamp: false, wireTop: false, wireBottom: false, gap: false, on: true }; box.innerHTML = circuitSvg(this.state); },
    add(box, part, api) {
      const s = this.state;
      if (part === "cell") s.cell = true; else if (part === "lamp") s.lamp = true; else if (part === "wire1") s.wireTop = true; else if (part === "wire2") s.wireBottom = true;
      box.innerHTML = circuitSvg(s);
      const all = s.cell && s.lamp && s.wireTop && s.wireBottom;
      if (all) { SOUND.play("ding", 0.5); return "The loop is closed. The lamp lights up!"; }
      return { cell: "The cell. It pushes the electricity round.", lamp: "The lamp. It lights when electricity flows through it.", wire1: "A wire, from the cell towards the lamp.", wire2: "Another wire, from the lamp back to the cell." }[part];
    },
    complete(box, api) {
      let broken = false, mended = false;
      api.controls.innerHTML = '<button type="button" class="big small" id="' + api.id + 'gap">Take a wire out</button>';
      $(api.id + "gap").addEventListener("click", () => {
        const s = this.state;
        if (!s.gap) { s.gap = true; broken = true; box.innerHTML = circuitSvg(s); SOUND.play("click", 0.4); api.say("A gap in the loop. The electricity cannot go round, and the lamp goes out."); $(api.id + "gap").textContent = "Put the wire back"; }
        else { s.gap = false; mended = true; box.innerHTML = circuitSvg(s); SOUND.play("ding", 0.5); api.say("The loop is closed again and the lamp is back on. A circuit only works as a complete loop."); }
        if (broken && mended) setTimeout(() => { api.controls.innerHTML = ""; api.done(); }, 2200);
      });
      api.say("Your model works like a real torch. Now take a wire out and see what happens.");
    },
  };
  SIMS.darkRoom = {
    draw(box, curtains, lamp) {
      const dark = curtains && !lamp;
      const light = lamp || !curtains;
      box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="A room, ' + (dark ? "completely dark" : lamp ? "lit by a lamp" : "lit by the window") + '">' +
        '<rect width="320" height="200" fill="' + (dark ? "#000" : light ? "#F4EAD4" : "#2A3A4A") + '"/>' +
        (dark ? "" : '<rect x="30" y="30" width="80" height="70" fill="' + (curtains ? "#5B3A2E" : "#BFE3F5") + '" stroke="#6B4A2B" stroke-width="6"/>' + (curtains ? "" : '<circle cx="90" cy="50" r="14" fill="#F4C95D"/>') +
          '<rect x="0" y="150" width="320" height="50" fill="' + (light ? "#C9B79C" : "#1B2A2F") + '"/>' +
          '<text x="200" y="145" font-size="44">\u{1F431}</text><text x="130" y="150" font-size="40">\u{1FA91}</text>' +
          '<g><line x1="270" y1="150" x2="270" y2="60" stroke="#93AABE" stroke-width="4"/><path d="M245 60 h50 l-10 -30 h-30z" fill="' + (lamp ? "#F4C95D" : "#4A5A6A") + '"/>' + (lamp ? '<ellipse cx="270" cy="110" rx="60" ry="50" fill="#F4C95D" opacity="0.18"/>' : "") + "</g>") +
        (dark ? '<text x="160" y="110" text-anchor="middle" fill="#334" font-size="16" font-family="Inter, sans-serif" font-weight="800">no light at all</text>' : "") +
        "</svg>";
    },
    init(box) { SIMS.darkRoom.draw(box, false, true); },
    run(box, api) {
      return new Promise((done) => {
        let curtains = false, lamp = true, wentDark = false;
        const paint = () => {
          SIMS.darkRoom.draw(box, curtains, lamp);
          api.controls.innerHTML = '<button type="button" class="big small ghost" id="' + api.id + 'c">' + (curtains ? "Open the curtains" : "Close the curtains") + '</button><button type="button" class="big small" id="' + api.id + 'l">' + (lamp ? "Switch the lamp off" : "Switch the lamp on") + "</button>";
          $(api.id + "c").addEventListener("click", () => { curtains = !curtains; SOUND.play("click", 0.3); paint(); api.say(curtains ? (lamp ? "Curtains closed. The lamp still lights the room." : "Curtains closed and no lamp. It is completely dark. You cannot see the cat, the chair, anything.") : "Curtains open. Daylight comes in from the Sun."); check(); });
          $(api.id + "l").addEventListener("click", () => { lamp = !lamp; SOUND.play("click", 0.3); paint(); api.say(lamp ? "Lamp on. Light again, and you can see." : (curtains ? "Lamp off and curtains closed. Darkness. Darkness is what is left when there is no light." : "Lamp off, but daylight still comes through the window.")); check(); });
        };
        const check = () => {
          if (curtains && !lamp) wentDark = true;
          if (wentDark && lamp) setTimeout(() => { api.controls.innerHTML = ""; done(); }, 1600);
        };
        paint();
      });
    },
  };
  SIMS.sunPath = {
    /* t = 0..4: 9am, midday, 3pm, 6pm (sunset), and the start at sunrise */
    draw(box, t) {
      const pos = [[40, 150], [100, 70], [160, 30], [220, 70], [280, 150]][t];
      const shadow = [[160, 150, 100, 150], [160, 150, 220, 150], [160, 150, 172, 150], [160, 150, 100, 150], [160, 150, 40, 150]];
      const label = ["Sunrise, in the east", "9 in the morning", "Midday, high in the sky", "3 in the afternoon", "Sunset, in the west"][t];
      const sh = [["long", 3], ["medium", 2], ["short", 1], ["medium", 2], ["long", 3]][t];
      const shx = { 0: [160, 60], 1: [160, 100], 2: [160, 148], 3: [160, 220], 4: [160, 260] }[t];
      return '<svg viewBox="0 0 320 200" role="img" aria-label="' + label + ', the shadow is ' + sh[0] + '">' +
        '<rect width="320" height="150" fill="' + (t === 0 || t === 4 ? "#F0A56B" : "#BFE3F5") + '"/><rect x="0" y="150" width="320" height="50" fill="#3E8E4A"/>' +
        '<path d="M20 150 Q160 -40 300 150" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="5 6" opacity="0.6"/>' +
        '<text x="20" y="180" fill="#fff" font-size="13" font-family="Inter, sans-serif" font-weight="800">EAST</text><text x="262" y="180" fill="#fff" font-size="13" font-family="Inter, sans-serif" font-weight="800">WEST</text>' +
        '<line x1="' + shx[0] + '" y1="150" x2="' + shx[1] + '" y2="' + (t === 2 ? 150 : 150) + '" stroke="#0B1D2C" stroke-width="' + (t === 2 ? 10 : 8) + '" opacity="0.6" stroke-linecap="round"/>' +
        '<rect x="156" y="90" width="8" height="60" fill="#6B4A2B"/>' +
        '<circle cx="' + pos[0] + '" cy="' + pos[1] + '" r="18" fill="#F4C95D"/>' +
        '<text x="160" y="24" text-anchor="middle" fill="#0B1D2C" font-size="14" font-family="Inter, sans-serif" font-weight="800">' + label + ' &middot; shadow: ' + sh[0] + '</text></svg>';
    },
    init(box) { box.innerHTML = SIMS.sunPath.draw(box, 0); },
    run(box, api) {
      return new Promise((done) => {
        let t = 0;
        api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'h">⏳ Three hours later</button>';
        $(api.id + "h").addEventListener("click", () => {
          if (t >= 4) return;
          t++; box.innerHTML = SIMS.sunPath.draw(box, t); SOUND.play("click", 0.3);
          api.say(["", "Nine in the morning. The Sun is higher in the east. The shadow points west and is shorter.", "Midday. The Sun is at its highest. The shadow is the shortest it will be all day.", "Three in the afternoon. The Sun is going down in the west. The shadow points east and is getting longer.", "Sunset. The Sun is low in the west, where it will disappear. The shadow is long again. The Sun seems to move across the sky - it rises in the east, climbs, and sets in the west."][t]);
          if (t >= 4) setTimeout(() => { api.controls.innerHTML = ""; done(); }, 2600);
        });
      });
    },
  };
  SIMS.newMaterial = {
    draw(box, heat, cooled) {
      const stage = heat >= 3 ? "cooked" : heat === 2 ? "turning white" : heat === 1 ? "warming" : "raw";
      const white = heat >= 3 ? "#FFFDF6" : heat === 2 ? "#F7EEDC" : "rgba(255,253,246,0.55)";
      box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="An egg in a pan, ' + stage + '">' +
        '<rect width="320" height="200" fill="#2A3A4A"/><ellipse cx="160" cy="130" rx="120" ry="44" fill="#4A5A6A"/><rect x="270" y="122" width="44" height="12" rx="6" fill="#1B2A2F"/>' +
        (heat > 0 && !cooled ? '<g fill="#E9744F" opacity="0.7"><path d="M90 178 q10 -20 0 -40 q10 20 20 40z"/><path d="M160 180 q10 -22 0 -44 q10 22 20 44z"/><path d="M230 178 q10 -20 0 -40 q10 20 20 40z"/></g>' : "") +
        '<ellipse cx="160" cy="126" rx="58" ry="26" fill="' + white + '" stroke="#D9D2C0" stroke-width="2"/><circle cx="160" cy="124" r="16" fill="#F4C95D"/>' +
        '<text x="160" y="40" text-anchor="middle" fill="#fff" font-size="16" font-family="Inter, sans-serif" font-weight="800">' + (cooled ? "cooled down - still cooked" : stage) + "</text></svg>";
    },
    init(box) { SIMS.newMaterial.draw(box, 0, false); },
    run(box, api) {
      return new Promise((done) => {
        let heat = 0, cooled = false;
        const paint = () => {
          api.controls.innerHTML = heat < 3
            ? '<button type="button" class="big small" id="' + api.id + 'h">🔥 Heat it</button>'
            : (cooled ? "" : '<button type="button" class="big teal small" id="' + api.id + 'c">❄️ Cool it down</button>');
          const h = $(api.id + "h"), c = $(api.id + "c");
          if (h) h.addEventListener("click", () => { heat++; SIMS.newMaterial.draw(box, heat, false); SOUND.play("kettle", 0.3); api.say(["", "The pan warms up. The clear part of the egg starts to change.", "It is turning white and going solid.", "Cooked. The runny clear egg is now white and solid. It is a different material now."][heat]); paint(); });
          if (c) c.addEventListener("click", () => { cooled = true; SIMS.newMaterial.draw(box, heat, true); SOUND.play("click", 0.3); api.say("Cooled down, and still cooked. Cooling does not turn it back into a raw egg. Cooking made a NEW material, and there is no going back."); paint(); setTimeout(() => { api.controls.innerHTML = ""; done(); }, 2600); });
        };
        paint();
      });
    },
  };

  /* ==================================================================
     STAGE 3 (Grade 3, 2026-09-10). Two figures, a scene, eleven sims and
     one step kind that Stages 1 and 2 had no shape for: the organs and an
     insect to label AND to diagram, a fossil forming, a plant kept cold, a
     forcemeter, friction on three surfaces, a shadow that grows and shrinks,
     light through three kinds of material, two magnets with poles, a
     mixture separated four ways, a solid, a liquid and a gas, the Moon's
     month, the Earth and Moon as a model to build, and a food chain to
     build and break. makeDiagram() is 3TWSm.03: the child places the
     labels rather than finding the parts.
     ================================================================== */

  /* ---- Stage 3 figures ---------------------------------------------- */
  FIGURES.organs = () => (
    '<svg viewBox="0 0 260 420" role="img" aria-label="The inside of a body: brain, lungs, heart, stomach and intestine">' +
    '<path d="M130 20 q54 0 54 50 q0 40 -24 52 q46 10 56 60 v160 q0 40 -30 40 h-112 q-30 0 -30 -40 v-160 q10 -50 56 -60 q-24 -12 -24 -52 q0 -50 54 -50z" fill="#C68642" opacity="0.55"/>' +
    '<g data-part="brain" tabindex="0" role="button" aria-label="brain"><path d="M100 60 q0 -30 30 -30 q30 0 30 30 q4 22 -14 30 h-32 q-18 -8 -14 -30z" fill="#F2A7C4"/><path d="M110 50 q10 10 20 0 q10 10 20 0 M106 66 q12 8 24 0 q12 8 24 0" fill="none" stroke="#C86B95" stroke-width="3"/><circle class="outline" cx="130" cy="60" r="40"/></g>' +
    '<g data-part="lungs" tabindex="0" role="button" aria-label="lungs"><path d="M118 150 q-40 0 -44 60 q0 40 30 40 q14 0 14 -30z" fill="#F08A8A"/><path d="M142 150 q40 0 44 60 q0 40 -30 40 q-14 0 -14 -30z" fill="#F08A8A"/><rect x="126" y="130" width="8" height="40" rx="4" fill="#E9D9B8"/><rect class="outline" x="68" y="136" width="124" height="120" rx="30"/></g>' +
    '<g data-part="heart" tabindex="0" role="button" aria-label="heart" transform="translate(0 -46)"><path d="M130 232 q-8 -20 -26 -18 q-18 4 -14 26 q6 22 40 42 q34 -20 40 -42 q4 -22 -14 -26 q-18 -2 -26 18z" fill="#D9473F"/><circle class="outline" cx="130" cy="246" r="36"/></g>' +
    '<g data-part="stomach" tabindex="0" role="button" aria-label="stomach"><path d="M150 290 q40 -6 46 30 q4 30 -30 36 q-30 4 -40 -20 q-8 -30 24 -46z" fill="#E9A05B"/><circle class="outline" cx="160" cy="320" r="40"/></g>' +
    '<g data-part="intestine" tabindex="0" role="button" aria-label="intestine"><path d="M80 320 q60 -10 60 20 q0 26 -50 20 q-30 0 -20 26 q10 20 60 12 q40 -6 50 16" fill="none" stroke="#E7B86B" stroke-width="16" stroke-linecap="round"/><rect class="outline" x="56" y="300" width="130" height="110" rx="30"/></g>' +
    "</svg>");
  FIGURES.insect = () => (
    '<svg viewBox="0 0 360 240" role="img" aria-label="A beetle seen from above: head, thorax, abdomen, six legs, wings and antennae">' +
    '<g data-part="legs" tabindex="0" role="button" aria-label="legs"><g stroke="#3A2A1A" stroke-width="6" stroke-linecap="round" fill="none"><path d="M150 104 l-30 -34 l-10 -26 M170 99 l0 -40 l-8 -26 M190 104 l30 -34 l12 -26 M150 146 l-30 34 l-10 26 M170 151 l0 40 l-8 26 M190 146 l30 34 l12 26"/></g><path class="outline" d="M100 20 h140 v200 h-140z"/></g>' +
    '<g data-part="wings" tabindex="0" role="button" aria-label="wings"><path d="M186 110 q40 -76 116 -52 q-36 44 -116 52z" fill="#7BC47F" opacity="0.85"/><path d="M186 140 q40 76 116 52 q-36 -44 -116 -52z" fill="#7BC47F" opacity="0.85"/><rect class="outline" x="180" y="46" width="130" height="158" rx="30"/></g>' +
    '<g data-part="abdomen" tabindex="0" role="button" aria-label="abdomen"><ellipse cx="240" cy="125" rx="52" ry="34" fill="#5B3A1E"/><path d="M200 125 h80 M214 108 v34 M232 104 v42 M250 106 v38" stroke="#3A2A1A" stroke-width="2"/><ellipse class="outline" cx="240" cy="125" rx="58" ry="40"/></g>' +
    '<g data-part="thorax" tabindex="0" role="button" aria-label="thorax"><ellipse cx="170" cy="125" rx="30" ry="28" fill="#7A4B22"/><ellipse class="outline" cx="170" cy="125" rx="36" ry="34"/></g>' +
    '<g data-part="head" tabindex="0" role="button" aria-label="head"><circle cx="122" cy="125" r="22" fill="#5B3A1E"/><circle cx="112" cy="118" r="4" fill="#fff"/><circle cx="112" cy="132" r="4" fill="#fff"/><circle class="outline" cx="122" cy="125" r="28"/></g>' +
    '<g data-part="antennae" tabindex="0" role="button" aria-label="antennae"><path d="M104 112 q-30 -20 -40 -50 M104 138 q-30 20 -40 50" fill="none" stroke="#3A2A1A" stroke-width="4" stroke-linecap="round"/><path class="outline" d="M56 56 h56 v140 h-56z"/></g>' +
    "</svg>");

  /* ---- Stage 3 scenes ------------------------------------------------ */
  /* gravity: a child on the Earth, and an arrow from them to the CENTRE. State 0
     the child stands on top; state 1 on the far side, upside down to us, and the
     arrow still points to the centre. The rotating globe could not show this. */
  SCENES.gravity = (s) => {
    const child = '<g>' + glyphAt(160, 62, 46, "\u{1F9CD}") + '<path d="M160 66 V132" stroke="#D9473F" stroke-width="5"/><path d="M151 121 L160 137 L169 121" fill="none" stroke="#D9473F" stroke-width="4" stroke-linejoin="round"/></g>';
    return '<svg viewBox="0 0 320 300" role="img" aria-label="' + (s ? "A child on the far side of the Earth; down still points to the centre" : "A child standing on the Earth; down points to the centre") + '">' +
      '<rect width="320" height="300" fill="#0E2434"/><circle cx="160" cy="150" r="86" fill="#3B7FD1"/><path d="M110 110 q30 -30 60 -10 q20 30 -10 40 q-40 10 -50 -30z M180 170 q30 -10 40 20 q-20 30 -50 10z" fill="#4CAF50"/>' +
      '<circle cx="160" cy="150" r="5" fill="#fff"/><text x="172" y="166" font-size="13" font-family="Inter, sans-serif" font-weight="800" fill="#fff">centre</text>' +
      (s ? '<g transform="rotate(180 160 150)">' + child + "</g>" : child) + "</svg>";
  };
  /* a fossil forming: 0 a fish alive in the sea, 1 it dies and sinks into the mud, 2 layers pile up and turn to rock, 3 the rock splits and shows its shape */
  SCENES.fossil = (s) => {
    const sea = '<rect width="320" height="' + (s < 2 ? 150 : 40) + '" fill="#3B7FD1"/>';
    const layers = s >= 2 ? '<g><rect x="0" y="40" width="320" height="50" fill="#A08060"/><rect x="0" y="90" width="320" height="50" fill="#8A6A4A"/><rect x="0" y="140" width="320" height="50" fill="#7D7F86"/><rect x="0" y="190" width="320" height="110" fill="#5B5D63"/></g>' : '<rect x="0" y="150" width="320" height="150" fill="#8A6A4A"/>';
    const fish = s === 0 ? '<text x="150" y="100" font-size="56" text-anchor="middle">\u{1F41F}</text>'
      : s === 1 ? '<text x="150" y="175" font-size="56" text-anchor="middle" opacity="0.8" transform="rotate(180 150 155)">\u{1F41F}</text>'
      : s === 2 ? '<path d="M110 215 q40 -22 80 0 q-40 22 -80 0z M190 215 l22 -12 v24z" fill="none" stroke="#3A3A3A" stroke-width="2" stroke-dasharray="4 3"/>'
      : '<g><path d="M60 200 l200 0" stroke="#111" stroke-width="3"/><path d="M110 215 q40 -22 80 0 q-40 22 -80 0z M190 215 l22 -12 v24z" fill="#D9D2C0" stroke="#3A3A3A" stroke-width="3"/><path d="M120 215 h60 M140 205 v20 M155 203 v24" stroke="#3A3A3A" stroke-width="2"/><text x="160" y="270" text-anchor="middle" fill="#fff" font-size="16" font-family="Inter, sans-serif" font-weight="800">a fossil: the shape of the fish, in rock</text></g>';
    return '<svg viewBox="0 0 320 300" role="img" aria-label="A fossil forming">' + sea + layers + fish + "</svg>";
  };

  /* ---- Stage 3 sims -------------------------------------------------- */
  /* a plant kept warm and a plant kept cold, day by day */
  SIMS.plantWarm = {
    /* Both plants in the same light: the cold one is only COLD. It used to be drawn
       in a dark cupboard, so the test changed two things at once. */
    init(box) { twoPots(box, 0, 0, 1, { labelA: "warm place", labelB: "cold place", sun: true, coldB: true }); },
    run(box, api) {
      return new Promise((done) => {
        let day = 1;
        api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'day">\u{1F321}️ Wait a day</button>';
        $(api.id + "day").addEventListener("click", () => {
          day++; twoPots(box, 0, Math.min(4, day - 1), day, { labelA: "warm place", labelB: "cold place", sun: true, coldB: true }); SOUND.play("pop", 0.3);
          api.say(day < 5 ? "Day " + day + ". " + (day === 2 ? "The warm plant looks fine. The cold plant has stopped growing." : day === 3 ? "The cold plant is drooping." : "The cold plant is limp, and its leaves are turning yellow.")
            : "Day five. The warm plant is healthy. The cold one is drooping and yellow. Same water, same light, only colder: too cold, and a plant cannot stay healthy.");
          if (day >= 5) { api.controls.innerHTML = ""; done(); }
        });
      });
    },
  };

  /* a forcemeter: hang things on the hook and read the newtons */
  /* The pointer moves ONE tick (24 units) per newton, so it points at the number
     it reads: it used to move 14 against ticks 24 apart, and "5 N" pointed near 3
     (validation of Grade 3, 2026-09-11). The frame is tall enough that 5 N keeps
     the hung object inside it. */
  function forcemeterSvg(n, pic, label) {
    const stretch = n * 24;
    return '<svg viewBox="0 0 320 420" role="img" aria-label="A forcemeter with a hook, reading ' + n + ' newtons"><rect width="320" height="420" fill="#DDEFF7"/>' +
      '<rect x="120" y="10" width="80" height="150" rx="10" fill="#fff" stroke="#3A3A3A" stroke-width="3"/>' +
      [0, 1, 2, 3, 4, 5].map((k) => '<line x1="130" y1="' + (30 + k * 24) + '" x2="150" y2="' + (30 + k * 24) + '" stroke="#3A3A3A" stroke-width="2"/><text x="156" y="' + (35 + k * 24) + '" font-size="12" font-family="Inter, sans-serif" font-weight="700" fill="#3A3A3A">' + k + ' N</text>').join("") +
      '<rect x="142" y="26" width="8" height="' + (4 + stretch) + '" fill="#D9473F" style="transition: height 700ms ease"/>' +
      '<line x1="160" y1="160" x2="160" y2="' + (200 + stretch) + '" stroke="#3A3A3A" stroke-width="4" style="transition: all 700ms ease"/>' +
      '<path d="M150 ' + (200 + stretch) + ' q10 16 20 0" fill="none" stroke="#3A3A3A" stroke-width="4" style="transition: all 700ms ease"/>' +
      (pic ? '<text x="160" y="' + (250 + stretch) + '" font-size="44" text-anchor="middle" style="transition: all 700ms ease">' + pic + "</text>" : "") +
      '<text x="20" y="40" font-size="26" font-family="Inter, sans-serif" font-weight="800" fill="#1B1B1B">' + n + " N</text>" +
      (label ? '<text x="20" y="66" font-size="14" font-family="Inter, sans-serif" font-weight="700" fill="#3A3A3A">' + esc(label) + "</text>" : "") +
      '<text x="236" y="404" font-size="12" font-family="Inter, sans-serif" fill="#3A3A3A">gravity pulls ↓</text></svg>';
  }
  SIMS.forcemeter = {
    items: [{ id: "apple", pic: "\u{1F34E}", label: "an apple", n: 2 }, { id: "shoe", pic: "\u{1F45F}", label: "a shoe", n: 3 }, { id: "book", pic: "\u{1F4D5}", label: "a big book", n: 5 }],
    init(box) { box.innerHTML = forcemeterSvg(0, "", ""); },
    run(box, api) {
      return new Promise((done) => {
        const hung = new Set();
        const paint = () => {
          api.controls.innerHTML = SIMS.forcemeter.items.map((it) => '<button type="button" class="big small' + (hung.has(it.id) ? " ghost" : " teal") + '" data-h="' + it.id + '">' + it.pic + " Hang " + esc(it.label) + "</button>").join("");
          api.controls.querySelectorAll("[data-h]").forEach((b) => b.addEventListener("click", () => {
            const it = SIMS.forcemeter.items.find((x) => x.id === b.dataset.h);
            hung.add(it.id); box.innerHTML = forcemeterSvg(it.n, it.pic, it.label); SOUND.play("boing", 0.4);
            api.say("The forcemeter reads " + it.n + " newtons. Gravity pulls " + it.label + " down with a force of " + it.n + " newtons.");
            paint();
            if (hung.size >= SIMS.forcemeter.items.length) setTimeout(() => { api.controls.innerHTML = ""; api.say("Two, three and five newtons. The heavier the thing, the harder gravity pulls it, and the further the spring stretches."); done(); }, 2600);
          }));
        };
        paint();
      });
    },
  };

  /* a block pushed the same way across three surfaces */
  SIMS.friction = {
    surfaces: [{ id: "ice", label: "ice", pic: "\u{1F9CA}", fill: "#DDEFF7", far: 9 }, { id: "wood", label: "smooth wood", pic: ICONS.wood, fill: "#C9A26B", far: 6 }, { id: "carpet", label: "rough carpet", pic: "\u{1F9F6}", fill: "#8E4A5B", far: 2 }],
    draw(box, s, x) {
      box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="A block pushed across ' + esc(s ? s.label : "a surface") + '"><rect width="320" height="200" fill="#F3EFE6"/>' +
        '<rect x="0" y="140" width="320" height="60" fill="' + (s ? s.fill : "#ccc") + '"/>' +
        (s && s.id === "carpet" ? '<g stroke="#6A3040" stroke-width="2">' + Array.from({ length: 32 }, (_, k) => '<line x1="' + (k * 10) + '" y1="140" x2="' + (k * 10 + 4) + '" y2="132"/>').join("") + "</g>" : "") +
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => '<line x1="' + (30 + k * 30) + '" y1="140" x2="' + (30 + k * 30) + '" y2="150" stroke="#3A3A3A" stroke-width="2"/><text x="' + (30 + k * 30) + '" y="168" font-size="11" text-anchor="middle" font-family="Inter, sans-serif" fill="#3A3A3A">' + k + "</text>").join("") +
        '<rect x="' + (14 + x * 30) + '" y="100" width="34" height="40" rx="6" fill="#D9473F" style="transition: x 1400ms ease-out"/>' +
        (s ? glyphAt(20, 31, 18, s.pic) : "") +
        '<text x="' + (s ? 34 : 10) + '" y="30" font-size="16" font-family="Inter, sans-serif" font-weight="800" fill="#1B1B1B">' + (s ? esc(s.label) : "choose a surface") + "</text></svg>";
    },
    init(box) { SIMS.friction.draw(box, null, 0); },
    run(box, api) {
      return new Promise((done) => {
        const did = new Set(); let busy = false;
        const paint = () => {
          api.controls.innerHTML = SIMS.friction.surfaces.map((s) => '<button type="button" class="big small' + (did.has(s.id) ? " ghost" : " teal") + '" data-s="' + s.id + '">' + s.pic + " Push on " + esc(s.label) + "</button>").join("");
          api.controls.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => {
            if (busy) return; busy = true;
            /* while the block slides the buttons are OFF, and look it: a press
               used to be ignored with nothing on screen to say why */
            api.controls.querySelectorAll("button").forEach((x) => { x.disabled = true; });
            const s = SIMS.friction.surfaces.find((x) => x.id === b.dataset.s);
            SIMS.friction.draw(box, s, 0);
            setTimeout(() => { box.querySelector("rect[rx='6']").setAttribute("x", 14 + s.far * 30); SOUND.play(s.id === "carpet" ? "shake" : "click", 0.4); }, 60);
            setTimeout(() => {
              did.add(s.id); busy = false; paint();
              api.say("On " + s.label + " the block slid " + s.far + " marks. " + (s.id === "ice" ? "Very little friction." : s.id === "wood" ? "Some friction." : "Lots of friction: the rough surface grips the block and slows it fast."));
              if (did.size >= SIMS.friction.surfaces.length) setTimeout(() => { api.controls.innerHTML = ""; api.say("Nine, six, two. The rougher the surface, the more friction, and the sooner the block stops."); done(); }, 2800);
            }, 1600);
          }));
        };
        paint();
      });
    },
  };

  /* a torch, an object and a wall: the shadow grows as the object nears the torch */
  SIMS.shadowSize = {
    draw(box, pos) {
      /* pos 0 near the wall .. 2 near the torch; the shadow scales with the ratio */
      const ox = [220, 160, 100][pos], size = [40, 64, 110][pos];
      return box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="A torch shining on a toy, casting a shadow on a wall"><rect width="320" height="200" fill="#1B2A3A"/>' +
        '<rect x="290" y="10" width="20" height="180" fill="#E9D9B8"/>' +
        '<polygon points="30,100 290,' + (100 - size) + ' 290,' + (100 + size) + '" fill="#F4C95D" opacity="0.22"/>' +
        '<rect x="290" y="' + (100 - size) + '" width="20" height="' + (size * 2) + '" fill="#111" style="transition: all 600ms ease"/>' +
        '<text x="' + ox + '" y="118" font-size="44" text-anchor="middle" style="transition: all 600ms ease">\u{1F9F8}</text>' +
        '<text x="30" y="118" font-size="40" text-anchor="middle">\u{1F526}</text>' +
        '<text x="12" y="28" font-size="14" font-family="Inter, sans-serif" font-weight="800" fill="#fff">' + ["toy near the wall: small shadow", "toy in the middle", "toy near the torch: big shadow"][pos] + "</text></svg>";
    },
    init(box) { SIMS.shadowSize.draw(box, 1); },
    run(box, api) {
      return new Promise((done) => {
        let pos = 1; const seen = new Set([1]);
        const paint = () => {
          api.controls.innerHTML = '<button type="button" class="big small' + (pos >= 2 ? " ghost" : " teal") + '" id="' + api.id + 'n"' + (pos >= 2 ? " disabled" : "") + '>\u{1F526} Move it nearer the torch</button><button type="button" class="big small' + (pos <= 0 ? " ghost" : "") + '" id="' + api.id + 'w"' + (pos <= 0 ? " disabled" : "") + '>Move it nearer the wall</button>' +
            /* what is left to try, so a child knows the step wants BOTH ends */
            '<p style="margin:6px 0 0;font-size:14px;font-weight:700">' + (seen.has(2) ? "\u2705" : "\u2B1C") + " near the torch &nbsp; " + (seen.has(0) ? "\u2705" : "\u2B1C") + " near the wall</p>";
          $(api.id + "n").addEventListener("click", () => step(1)); $(api.id + "w").addEventListener("click", () => step(-1));
        };
        const step = (d) => {
          pos = Math.max(0, Math.min(2, pos + d)); seen.add(pos); SIMS.shadowSize.draw(box, pos); SOUND.play("click", 0.3); paint();
          api.say(pos === 2 ? "Near the torch, the toy blocks more of the light. The shadow on the wall is big." : pos === 0 ? "Near the wall, the toy blocks less of the light that reaches the wall. The shadow is small." : "In the middle. A middle-sized shadow.");
          if (seen.has(0) && seen.has(2)) setTimeout(() => { api.controls.innerHTML = ""; api.say("Nearer the light source, bigger shadow. Nearer the wall, smaller shadow. The object did not change; its position did."); done(); }, 2600);
        };
        paint();
      });
    },
  };

  /* light shone at a material: through, some through, or blocked (predictEach) */
  SIMS.lightThrough = {
    init(box) { box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="A torch shining at a material, with a wall behind"><rect width="320" height="200" fill="#1B2A3A"/><rect x="290" y="10" width="20" height="180" fill="#3A3A3A" id="lw"/><polygon id="lb" points="30,100 150,60 150,140" fill="#F4C95D" opacity="0.35"/><polygon id="lb2" points="150,60 290,30 290,170 150,140" fill="#F4C95D" opacity="0"/><g id="lm"></g><text x="30" y="118" font-size="40" text-anchor="middle">\u{1F526}</text></svg>'; },
    act(box, item, api) {
      box.querySelector("#lm").innerHTML = glyphAt(150, 118, 48, item.pic);
      return new Promise((r) => {
        setTimeout(() => {
          const lvl = item.answer === "through" ? 0.35 : item.answer === "some" ? 0.12 : 0;
          box.querySelector("#lb2").setAttribute("opacity", lvl);
          box.querySelector("#lw").setAttribute("fill", item.answer === "through" ? "#F4C95D" : item.answer === "some" ? "#8A7A4A" : "#3A3A3A");
          SOUND.play(item.answer === "blocked" ? "thud" : "ding", 0.35);
          setTimeout(() => { api.say(item.answer === "through" ? "The light goes straight through the " + item.label + ". The wall is bright. Transparent." : item.answer === "some" ? "Some light gets through the " + item.label + ", but blurred and dim. Translucent." : "No light gets through the " + item.label + ". The wall behind is dark. Opaque."); r(); }, 700);
        }, 40);
      });
    },
  };

  /* two bar magnets: like poles push apart, unlike poles pull together */
  function magnetPair(gap, flipped) {
    const mag = (x, flip) => '<g transform="translate(' + x + ' 0)"><rect x="0" y="80" width="60" height="40" fill="' + (flip ? "#3B7FD1" : "#D9473F") + '"/><rect x="60" y="80" width="60" height="40" fill="' + (flip ? "#D9473F" : "#3B7FD1") + '"/><text x="30" y="108" text-anchor="middle" font-size="24" font-weight="800" font-family="Inter, sans-serif" fill="#fff">' + (flip ? "S" : "N") + '</text><text x="90" y="108" text-anchor="middle" font-size="24" font-weight="800" font-family="Inter, sans-serif" fill="#fff">' + (flip ? "N" : "S") + "</text></g>";
    return '<svg viewBox="0 0 320 200" role="img" aria-label="Two bar magnets"><rect width="320" height="200" fill="#DDEFF7"/>' +
      /* left magnet S|N, so its NORTH end faces the right one; the right one
         starts S|N (south facing: attract) and flips to N|S (north facing:
         repel). It used to draw S facing S after the flip while the voice
         said "north faces north" (Grade 3 re-review, 2026-09-11). */
      '<g style="transition: transform 700ms ease" transform="translate(' + (-gap / 2) + ' 0)">' + mag(40, true) + "</g>" +
      '<g style="transition: transform 700ms ease" transform="translate(' + (gap / 2) + ' 0)">' + mag(160, !flipped) + "</g>" +
      '<text x="160" y="40" text-anchor="middle" font-size="14" font-family="Inter, sans-serif" font-weight="800" fill="#1B1B1B">' + (gap > 40 ? "far apart" : gap > 0 ? "close together" : "touching") + "</text></svg>";
  }
  SIMS.magnetPoles = {
    init(box) { box.innerHTML = magnetPair(60, false); },
    run(box, api) {
      return new Promise((done) => {
        let flipped = false, attracted = false, repelled = false, busy = false;
        const paint = () => {
          api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'b">Bring them together</button><button type="button" class="big small ghost" id="' + api.id + 'f">Flip the right magnet</button>';
          $(api.id + "b").addEventListener("click", () => {
            if (busy) return; busy = true;
            box.innerHTML = magnetPair(10, flipped);
            setTimeout(() => {
              if (!flipped) { attracted = true; box.innerHTML = magnetPair(0, flipped); SOUND.play("click", 0.6); api.say("North to south: they snap together. Unlike poles attract."); }
              else { repelled = true; box.innerHTML = magnetPair(90, flipped); SOUND.play("pop", 0.5); api.say("North to north: they push apart. You feel them push back, hard. Like poles repel."); }
              busy = false;
              if (attracted && repelled) setTimeout(() => { api.controls.innerHTML = ""; api.say("Every magnet has a north pole and a south pole. Unlike poles attract, like poles repel."); done(); }, 2600);
            }, 800);
          });
          $(api.id + "f").addEventListener("click", () => { if (busy) return; flipped = !flipped; box.innerHTML = magnetPair(60, flipped); SOUND.play("click", 0.3); api.say(flipped ? "Flipped. Now north faces north." : "Flipped back. North faces south."); });
        };
        paint();
      });
    },
  };

  /* a mixture separated four ways */
  SIMS.separate = {
    stages: [
      { id: "sieve", btn: ICONS.sieve + " Shake the sieve", pic: ICONS.sieve + ICONS.rock + "\u{1F3D6}️", cap: "stones and sand", say: "The sand falls through the holes. The stones are too big and stay in the sieve. Separated by size." },
      { id: "magnet", btn: "\u{1F9F2} Sweep the magnet", pic: "\u{1F9F2}\u{1F3D6}️", cap: "iron filings and sand", say: "The iron filings jump onto the magnet. The sand does not. Separated because only one of them is magnetic." },
      { id: "filter", btn: "\u{1F4A7} Pour through the filter", pic: "\u{1F4A7}\u{1F3D6}️", cap: "sand and water", say: "The water drips through the filter paper. The sand cannot get through and stays behind. Separated by size again, just a much smaller size." },
      { id: "salt", btn: "\u{1F9C2} Stir the salt in", pic: "\u{1F9C2}\u{1F4A7}", cap: "salt and water", say: "The salt disappears. Only with a grown-up, taste one drop: salty! The salt is still there, in tiny pieces too small to see. It dissolved. That is a mixture too." },
    ],
    draw(box, k) {
      const s = SIMS.separate.stages[k] || SIMS.separate.stages[0];
      box.innerHTML = '<div style="display:grid;place-items:center;height:200px;font-size:70px" aria-hidden="true">' + s.pic + '</div><div class="tag">' + esc(s.cap) + "</div>";
    },
    init(box) { SIMS.separate.draw(box, 0); },
    run(box, api) {
      return new Promise((done) => {
        let k = 0;
        const paint = () => {
          const s = SIMS.separate.stages[k];
          SIMS.separate.draw(box, k);
          api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'go">' + s.btn + "</button>";
          $(api.id + "go").addEventListener("click", () => {
            SOUND.play(s.id === "magnet" ? "click" : s.id === "filter" ? "splash" : "shake", 0.4);
            api.say(s.say);
            api.controls.innerHTML = "";
            k++;
            setTimeout(() => { if (k >= SIMS.separate.stages.length) { api.say("The sieve, the magnet and the filter each separated a mixture. The salt dissolved: you could not see it, but you could taste that it was still there. Every material kept its own properties inside the mixture."); done(); } else paint(); }, 4200);
          });
        };
        paint();
      });
    },
  };

  /* a solid keeps its shape, a liquid takes the shape of its container, a gas spreads out */
  SIMS.states = {
    draw(box, s) {
      const glass = '<path d="M40 100 l10 90 h60 l10 -90z" fill="none" stroke="#3A3A3A" stroke-width="3"/>';
      const water = s.poured ? '<path d="M48 150 l6 40 h52 l6 -40z" fill="#3B7FD1" opacity="0.7"/>' : '<rect x="130" y="70" width="40" height="30" fill="#3B7FD1" opacity="0.7"/><path d="M128 66 h44 l-6 40 h-32z" fill="none" stroke="#3A3A3A" stroke-width="2"/>';
      const block = s.tipped ? '<rect x="200" y="150" width="40" height="40" fill="#C9A26B" transform="rotate(90 220 170)"/>' : '<rect x="200" y="150" width="40" height="40" fill="#C9A26B"/>';
      const gas = s.let ? '<g fill="#F2A7C4" opacity="0.5"><circle cx="270" cy="60" r="8"/><circle cx="240" cy="30" r="6"/><circle cx="300" cy="90" r="7"/><circle cx="220" cy="80" r="5"/><circle cx="290" cy="20" r="5"/></g>' : '<ellipse cx="270" cy="60" rx="26" ry="32" fill="#F2A7C4"/>';
      box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="Water, a wooden block and a balloon of air"><rect width="320" height="200" fill="#F3EFE6"/>' + glass + water + block + gas +
        '<text x="80" y="30" font-size="12" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" fill="#3A3A3A">liquid</text><text x="220" y="140" font-size="12" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" fill="#3A3A3A">solid</text><text x="270" y="120" font-size="12" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" fill="#3A3A3A">gas</text></svg>';
    },
    init(box) { SIMS.states.draw(box, {}); },
    run(box, api) {
      return new Promise((done) => {
        const s = {};
        const paint = () => {
          api.controls.innerHTML = '<button type="button" class="big small' + (s.poured ? " ghost" : " teal") + '" data-a="poured">\u{1F4A7} Pour the water</button><button type="button" class="big small' + (s.tipped ? " ghost" : " teal") + '" data-a="tipped">' + ICONS.wood + ' Tip the block over</button><button type="button" class="big small' + (s.let ? " ghost" : " teal") + '" data-a="let">\u{1F388} Untie the balloon</button>';
          api.controls.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => {
            const a = b.dataset.a; if (s[a]) return; s[a] = true; SIMS.states.draw(box, s); SOUND.play(a === "poured" ? "splash" : a === "tipped" ? "thud" : "pop", 0.4); paint();
            api.say(a === "poured" ? "The water flows and takes the shape of the glass. A liquid has no shape of its own." : a === "tipped" ? "The block keeps exactly the same shape, whichever way up it is. A solid keeps its shape." : "The air rushes out and spreads everywhere. A gas fills all the space it can find.");
            if (s.poured && s.tipped && s.let) setTimeout(() => { api.controls.innerHTML = ""; api.say("Solid: keeps its shape. Liquid: flows and takes the shape of its container. Gas: spreads out to fill the space."); done(); }, 2800);
          }));
        };
        paint();
      });
    },
  };

  /* the Moon over a month, three days at a time */
  SIMS.moonPhases = {
    names: ["new Moon", "crescent", "half Moon", "gibbous", "full Moon", "gibbous", "half Moon", "crescent", "new Moon"],
    draw(box, k) {
      const t = k / 8;   /* 0 new .. 0.5 full .. 1 new */
      const lit = t <= 0.5 ? t * 2 : (1 - t) * 2;   /* 0..1 how much is lit */
      const right = t <= 0.5;
      const rx = Math.abs(lit * 2 - 1) * 60;
      const fillHalf = right ? '<path d="M160 40 a60 60 0 0 1 0 120z" fill="#F3EFE6"/>' : '<path d="M160 40 a60 60 0 0 0 0 120z" fill="#F3EFE6"/>';
      const ell = '<ellipse cx="160" cy="100" rx="' + rx + '" ry="60" fill="' + (lit >= 0.5 ? "#F3EFE6" : "#1B2A3A") + '"/>';
      box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="The Moon, ' + SIMS.moonPhases.names[k] + '"><rect width="320" height="200" fill="#0B1D2C"/><g fill="#fff" opacity="0.7"><circle cx="30" cy="30" r="2"/><circle cx="280" cy="50" r="2"/><circle cx="60" cy="160" r="1.5"/><circle cx="290" cy="170" r="1.5"/></g>' +
        '<circle cx="160" cy="100" r="60" fill="#1B2A3A" stroke="#4A5A6A" stroke-width="2"/>' + (lit > 0 ? fillHalf + ell : "") +
        '<text x="160" y="190" text-anchor="middle" fill="#fff" font-size="15" font-family="Inter, sans-serif" font-weight="800">day ' + [1, 5, 8, 12, 16, 19, 23, 27, 30][k] + ": " + SIMS.moonPhases.names[k] + "</text></svg>";
    },
    init(box) { SIMS.moonPhases.draw(box, 0); },
    run(box, api) {
      return new Promise((done) => {
        let k = 0;
        api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'd">\u{1F319} Three days later</button>';
        $(api.id + "d").addEventListener("click", () => {
          if (k >= 8) return;
          k++; SIMS.moonPhases.draw(box, k); SOUND.play("pop", 0.25);
          api.say(k < 8 ? SIMS.moonPhases.names[k] + "." + (k === 4 ? " The whole face is lit." : k < 4 ? " More of it is lit each night." : " Less of it is lit each night.") : "Back to a new Moon. About four weeks: a month. The Moon does not change shape. We see more or less of its sunlit side as it goes round the Earth.");
          if (k >= 8) setTimeout(() => { api.controls.innerHTML = ""; done(); }, 1800);
        });
      });
    },
  };

  /* the Earth and the Moon as a model to build, then turn */
  function earthMoonSvg(s) {
    const a = (s.angle || 0) * Math.PI / 180, mx = 160 + Math.cos(a) * 100, my = 100 + Math.sin(a) * 60;
    return '<svg viewBox="0 0 320 200" role="img" aria-label="A model of the Earth and the Moon"><rect width="320" height="200" fill="#0B1D2C"/>' +
      (s.orbit ? '<ellipse cx="160" cy="100" rx="100" ry="60" fill="none" stroke="#4A5A6A" stroke-width="2" stroke-dasharray="6 5"/>' : "") +
      (s.earth ? '<g transform="rotate(' + (s.spin || 0) + ' 160 100)"><circle cx="160" cy="100" r="34" fill="#3B7FD1"/><path d="M140 84 q16 -10 30 0 q-4 16 -20 20 q-14 -6 -10 -20z M150 116 q14 4 18 16 q-16 6 -22 -4z" fill="#4CB65C"/></g>' : "") +
      (s.moon ? '<circle cx="' + mx + '" cy="' + my + '" r="11" fill="#D9D2C0"/>' : "") +
      '<text x="12" y="24" font-size="13" font-family="Inter, sans-serif" font-weight="800" fill="#fff">' + esc(s.cap || "") + "</text></svg>";
  }
  SIMS.earthMoon = {
    state: null,
    init(box) { this.state = { earth: false, moon: false, orbit: false, angle: 0, spin: 0, cap: "" }; box.innerHTML = earthMoonSvg(this.state); },
    add(box, part, api) {
      const s = this.state; s[part] = true; box.innerHTML = earthMoonSvg(s);
      return { earth: "The Earth: a big ball of rock, mostly covered in water.", moon: "The Moon: a much smaller ball of rock.", orbit: "The path: the Moon goes round the Earth along it." }[part];
    },
    complete(box, api) {
      const s = this.state; let monthDone = false, dayDone = false;
      api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'm">\u{1F319} Turn one month</button><button type="button" class="big small" id="' + api.id + 'd">\u{1F30D} Spin one day</button>';
      $(api.id + "m").addEventListener("click", () => {
        if (monthDone) return; monthDone = true; let n = 0;
        const t = setInterval(() => { n++; s.angle = n * 15; s.cap = "the Moon goes round the Earth: " + Math.round(n * 28 / 24) + " days"; box.innerHTML = earthMoonSvg(s); if (n >= 24) { clearInterval(t); api.say("Once round the Earth takes the Moon about four weeks. That is a month."); check(); } }, 120);
      });
      $(api.id + "d").addEventListener("click", () => {
        if (dayDone) return; dayDone = true; let n = 0;
        const t = setInterval(() => { n++; s.spin = n * 15; s.cap = "the Earth spins: " + n + " hours"; box.innerHTML = earthMoonSvg(s); if (n >= 24) { clearInterval(t); api.say("The Earth spins once every 24 hours. That is a day. It spins many times while the Moon goes round once."); check(); } }, 100);
      });
      const check = () => { if (monthDone && dayDone) setTimeout(() => { api.controls.innerHTML = ""; api.done(); }, 2400); };
      api.say("Your model is built. Now make it move: turn a month, and spin a day.");
    },
  };

  /* a food chain built from producer to consumers, then broken */
  function foodChainSvg(s) {
    const items = [["grass", "\u{1F33F}", "producer"], ["rabbit", "\u{1F407}", "consumer"], ["fox", "\u{1F98A}", "consumer"]];
    return '<svg viewBox="0 0 320 200" role="img" aria-label="A food chain: grass, rabbit, fox"><rect width="320" height="200" fill="#DDEFF7"/><rect x="0" y="150" width="320" height="50" fill="#3E8E4A"/>' +
      items.map(([id, pic, role], k) => s[id] ? '<g opacity="' + (s.gone && id !== "grass" ? 0.25 : 1) + '"><text x="' + (60 + k * 100) + '" y="120" font-size="52" text-anchor="middle">' + (s.gone && id === "grass" ? "\u{1F3DC}️" : pic) + '</text><text x="' + (60 + k * 100) + '" y="142" font-size="12" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" fill="#1B1B1B">' + id + "</text><text x=\"" + (60 + k * 100) + '" y="24" font-size="11" text-anchor="middle" font-family="Inter, sans-serif" fill="#3A3A3A">' + role + "</text></g>" : "").join("") +
      (s.grass && s.rabbit ? '<text x="110" y="110" font-size="30" text-anchor="middle" fill="#1B1B1B">→</text>' : "") + (s.rabbit && s.fox ? '<text x="210" y="110" font-size="30" text-anchor="middle" fill="#1B1B1B">→</text>' : "") +
      (s.grass && s.rabbit && s.fox ? '<text x="160" y="180" font-size="12" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" fill="#fff">the arrow means "is eaten by"</text>' : "") + "</svg>";
  }
  SIMS.foodChain = {
    state: null,
    init(box) { this.state = {}; box.innerHTML = foodChainSvg(this.state); },
    add(box, part, api) {
      const s = this.state; s[part] = true; box.innerHTML = foodChainSvg(s);
      if (s.grass && s.rabbit && s.fox) { SOUND.play("ding", 0.5); return "Grass is eaten by the rabbit, which is eaten by the fox. A food chain."; }
      return { grass: "Grass. It makes its own food from sunlight: the producer.", rabbit: "The rabbit eats the grass: a consumer.", fox: "The fox eats the rabbit: a consumer too." }[part];
    },
    complete(box, api) {
      let gone = false, back = false;
      api.controls.innerHTML = '<button type="button" class="big small" id="' + api.id + 'g">Take the grass away</button>';
      $(api.id + "g").addEventListener("click", () => {
        const s = this.state;
        if (!s.gone) { s.gone = true; gone = true; box.innerHTML = foodChainSvg(s); SOUND.play("thud", 0.4); api.say("No grass. The rabbits have nothing to eat and die out. Then the foxes have nothing to eat in this chain. Every link needs the one before it."); $(api.id + "g").textContent = "Put the grass back"; }
        else { s.gone = false; back = true; box.innerHTML = foodChainSvg(s); SOUND.play("ding", 0.5); api.say("The grass is back, and the chain works again. It all starts with the producer."); }
        if (gone && back) setTimeout(() => { api.controls.innerHTML = ""; api.done(); }, 2400);
      });
      api.say("Your food chain is a model of who eats whom. Now take the grass away and see what happens.");
    },
  };

  /* ---- make a diagram: place the labels on the figure (3TWSm.03) ---- */
  function makeDiagram(o) {
    const el = o.el, parts = o.parts, placed = new Set();
    let pick = null, right = 0, wrong = 0, lock = false;
    $(el.stage).innerHTML = '<div class="stagewide"><div class="figure" id="' + el.stage + 'fig">' + FIGURES[o.figure]() + '</div><div class="chips" id="' + el.stage + 'chips"></div></div>';
    const fig = $(el.stage + "fig");
    function paintChips() {
      $(el.stage + "chips").innerHTML = parts.map((p) => '<button type="button" class="chip' + (placed.has(p.id) ? " placed" : pick === p.id ? " now" : "") + '" data-c="' + p.id + '"' + (placed.has(p.id) ? " disabled" : "") + ">" + esc(p.label) + (placed.has(p.id) ? " ✓" : "") + "</button>").join("");
      $(el.score).textContent = placed.size + " of " + parts.length + " labels placed";
    }
    $(el.stage + "chips").addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b || lock || placed.has(b.dataset.c)) return;
      pick = b.dataset.c; paintChips();
      const p = parts.find((x) => x.id === pick);
      $(el.ask).innerHTML = "Now tap where the <b>" + esc(p.label) + "</b> is."; say("Now tap where the " + p.label + " is.");
    });
    fig.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const g = e.target.closest("[data-part]"); if (!g) return; e.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    fig.addEventListener("click", (e) => {
      const g = e.target.closest("[data-part]"); if (!g || lock) return;
      if (!pick) { $(el.fb).className = "fb"; $(el.fb).textContent = "Tap a label first, then the part."; say("Tap a label first, then the part."); return; }
      const p = parts.find((x) => x.id === pick);
      if (g.dataset.part === pick) {
        lock = true; right++; placed.add(pick); pick = null; g.classList.add("found"); SOUND.play("ding", 0.35); paintChips();
        $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " " + (p.say || p.label + " labelled."); say(cheer() + " " + (p.say || p.label + " labelled."));
        setTimeout(() => {
          $(el.fb).textContent = ""; $(el.fb).className = "fb"; lock = false;
          if (placed.size >= parts.length) {
            $(el.ask).innerHTML = "Your diagram is complete: every part named."; $(el.score).textContent = "";
            const line = "All " + parts.length + " labels in the right place. " + o.done;
            $(el.fb).className = "fb good"; $(el.fb).textContent = line;
            reportScore(o.finish, Math.max(0, parts.length - wrong), parts.length);
            finish(o.finish, line);
          } else { $(el.ask).innerHTML = o.ask; }
        }, 2400);
      } else {
        wrong++; const other = parts.find((x) => x.id === g.dataset.part);
        g.classList.add("ping"); setTimeout(() => g.classList.remove("ping"), 700);
        $(el.fb).className = "fb bad"; $(el.fb).textContent = "That is the " + (other ? other.label : "wrong part") + ". Where is the " + p.label + "?"; say("That is the " + (other ? other.label : "wrong part") + ". Where is the " + p.label + "?");
      }
    });
    paintChips();
  }

  /* ==================================================================
     STAGE 4 (Grade 4, 2026-09-10). Three figures (a skeleton, the Earth's
     layers, a ray diagram), two scenes (a volcano, an earthquake), nine
     sims (muscles in pairs, the particle model, a chemical reaction, a
     dropped ball's energy, a mirror and an eye, a series circuit, a
     conductor test, the spinning Earth, a paper spinner dropped three
     times), a key to identify creatures (4TWSc.02), and a dot-plot mode
     for the graph (4TWSa.04).
     ================================================================== */

  /* ---- Stage 4 figures ---------------------------------------------- */
  FIGURES.skeleton = () => (
    '<svg viewBox="0 0 260 420" role="img" aria-label="A human skeleton: skull, jaw, rib cage, spine, hip, arm bones and leg bones">' +
    '<g data-part="skull" tabindex="0" role="button" aria-label="skull"><ellipse cx="130" cy="48" rx="34" ry="36" fill="#E9E4D6"/><circle cx="118" cy="46" r="7" fill="#2B3A4A"/><circle cx="142" cy="46" r="7" fill="#2B3A4A"/><circle class="outline" cx="130" cy="44" r="40"/></g>' +
    '<g data-part="jaw" tabindex="0" role="button" aria-label="jaw"><path d="M104 74 q26 26 52 0 v14 q-26 20 -52 0z" fill="#D9D2C0"/><path d="M110 82 h40" stroke="#2B3A4A" stroke-width="2"/><rect class="outline" x="98" y="70" width="64" height="26" rx="10"/></g>' +
    '<g data-part="spine" tabindex="0" role="button" aria-label="spine"><g fill="#E9E4D6">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => '<rect x="122" y="' + (98 + k * 14) + '" width="16" height="10" rx="3"/>').join("") + "</g>" + '<rect class="outline" x="114" y="94" width="32" height="176" rx="10"/></g>' +
    '<g data-part="ribcage" tabindex="0" role="button" aria-label="rib cage"><g fill="none" stroke="#E9E4D6" stroke-width="6" stroke-linecap="round">' + [0, 1, 2, 3, 4].map((k) => '<path d="M130 ' + (112 + k * 16) + ' q-44 4 -46 ' + (22 + k * 2) + '"/><path d="M130 ' + (112 + k * 16) + ' q44 4 46 ' + (22 + k * 2) + '"/>').join("") + "</g>" + '<ellipse class="outline" cx="130" cy="150" rx="56" ry="52"/></g>' +
    '<g data-part="hip" tabindex="0" role="button" aria-label="hip"><path d="M92 268 q38 -22 76 0 q6 26 -18 34 h-40 q-24 -8 -18 -34z" fill="#E9E4D6"/><ellipse class="outline" cx="130" cy="286" rx="46" ry="26"/></g>' +
    '<g data-part="armbones" tabindex="0" role="button" aria-label="arm bones"><g fill="none" stroke="#E9E4D6" stroke-width="10" stroke-linecap="round"><path d="M86 108 L60 180"/><path d="M174 108 L200 180"/></g><g fill="none" stroke="#E9E4D6" stroke-width="6" stroke-linecap="round"><path d="M57 186 L47 250"/><path d="M64 186 L58 250"/><path d="M203 186 L213 250"/><path d="M196 186 L202 250"/></g><path class="outline" d="M40 100 h56 v160 h-56z M164 100 h56 v160 h-56z"/></g>' +
    '<g data-part="legbones" tabindex="0" role="button" aria-label="leg bones"><g fill="none" stroke="#E9E4D6" stroke-width="12" stroke-linecap="round"><path d="M110 300 L104 350"/><path d="M150 300 L156 350"/></g><g fill="none" stroke="#E9E4D6" stroke-width="7" stroke-linecap="round"><path d="M101 356 L95 400"/><path d="M108 356 L104 400"/><path d="M159 356 L165 400"/><path d="M152 356 L156 400"/></g><rect class="outline" x="86" y="296" width="88" height="118" rx="14"/></g>' +
    "</svg>");
  FIGURES.earthLayers = () => (
    /* to scale in the ways that matter: a thin crust, a core reaching over half
       way out (about 3,500 of 6,400 km). No names printed on it: the step asks
       the child to find each layer (Grade 4 review, 2026-09-11). */
    '<svg viewBox="0 0 320 320" role="img" aria-label="The Earth cut open to show its three layers">' +
    '<rect width="320" height="320" fill="#0B1D2C"/>' +
    '<g data-part="crust" tabindex="0" role="button" aria-label="crust"><circle cx="160" cy="160" r="140" fill="#4CB65C"/><circle cx="160" cy="160" r="134" fill="#3B7FD1"/><path d="M160 160 L160 20 A140 140 0 0 1 300 160 z" fill="#7D6B4A"/><path class="outline" d="M160 160 L160 20 A140 140 0 0 1 300 160 z"/></g>' +
    '<g data-part="mantle" tabindex="0" role="button" aria-label="mantle"><path d="M160 160 L160 30 A130 130 0 0 1 290 160 z" fill="#E9744F"/><path class="outline" d="M160 160 L160 30 A130 130 0 0 1 290 160 z"/></g>' +
    '<g data-part="core" tabindex="0" role="button" aria-label="core"><path d="M160 160 L160 83 A77 77 0 0 1 237 160 z" fill="#F4C95D"/><path d="M160 160 L160 127 A33 33 0 0 1 193 160 z" fill="#FFF3B0"/><path class="outline" d="M160 160 L160 80 A80 80 0 0 1 240 160 z"/></g>' +
    "</svg>");
  FIGURES.ray = () => (
    /* mirror upright at x 250, the ray meets it at (250, 100): in (188, -60),
       out (-188, -60), so the eye sits on the reflected line (equal angles) */
    '<svg viewBox="0 0 320 220" role="img" aria-label="A ray diagram: a light source, a ray, a mirror and an eye">' +
    '<defs><marker id="rayArrowF" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#F4C95D"/></marker></defs>' +
    '<rect width="320" height="220" fill="#1B2A3A"/>' +
    '<g data-part="source" tabindex="0" role="button" aria-label="light source"><text x="40" y="180" font-size="40" text-anchor="middle">\u{1F526}</text><circle class="outline" cx="40" cy="166" r="30"/></g>' +
    '<g data-part="ray" tabindex="0" role="button" aria-label="ray"><path d="M62 160 L156 130" stroke="#F4C95D" stroke-width="4" marker-end="url(#rayArrowF)"/><path d="M150 132 L250 100" stroke="#F4C95D" stroke-width="4"/><path d="M250 100 L180 78" stroke="#F4C95D" stroke-width="4" marker-end="url(#rayArrowF)"/><path d="M186 80 L126 61" stroke="#F4C95D" stroke-width="4"/><path class="outline" d="M58 149 L246 89 L254 112 L66 171z"/></g>' +
    '<g data-part="mirror" tabindex="0" role="button" aria-label="mirror"><rect x="246" y="65" width="10" height="70" rx="3" fill="#BFE3F5" stroke="#fff" stroke-width="2"/><rect class="outline" x="236" y="57" width="30" height="86" rx="8"/></g>' +
    '<g data-part="eye" tabindex="0" role="button" aria-label="eye"><text x="104" y="66" font-size="34" text-anchor="middle">\u{1F441}️</text><circle class="outline" cx="104" cy="54" r="28"/></g>' +
    "</svg>");

  /* ---- Stage 4 scenes ------------------------------------------------ */
  /* a volcano: 0 magma under the crust, 1 it rises through a crack, 2 eruption, 3 the lava cools to rock */
  SCENES.volcano = (s) => {
    /* 0 magma in a chamber under unbroken ground; 1 it rises through a crack
       and a small cone forms; 2 it erupts; 3 the lava has cooled and the cone
       is taller. The magma used to be a molten layer under all the crust and
       the cone was full-grown before the first eruption (Grade 4 review). */
    const peak = [150, 150, 112, 84][s], w = [0, 0, 64, 96][s];
    const lab = (t, fill) => '<text x="160" y="248" text-anchor="middle" fill="' + (fill || "#fff") + '" font-size="13" font-family="Inter, sans-serif" font-weight="800">' + t + "</text>";
    return '<svg viewBox="0 0 320 260" role="img" aria-label="A volcano forming and erupting"><rect width="320" height="260" fill="' + (s === 2 ? "#3A2A2A" : "#BFE3F5") + '"/>' +
      '<rect x="0" y="150" width="320" height="110" fill="#7D6B4A"/>' +
      '<ellipse cx="160" cy="214" rx="56" ry="16" fill="#E9744F"/>' +
      (s >= 1 ? '<path d="M152 204 L156 150 L164 150 L168 204z" fill="#E9744F"/>' : "") +
      (s === 1 ? '<ellipse cx="160" cy="150" rx="12" ry="5" fill="#E9744F"/>' : "") +
      (s >= 2 ? '<path d="M' + (160 - w) + " 150 L" + (160 - 8) + " " + peak + " L" + (160 + 8) + " " + peak + " L" + (160 + w) + ' 150z" fill="#5B4A3A" stroke="#B59A78" stroke-width="2" stroke-linejoin="round"/><path d="M156 150 L158 ' + peak + ' L162 ' + peak + ' L164 150z" fill="' + (s === 3 ? "#5B5D63" : "#E9744F") + '"/>' : "") +
      (s === 2 ? '<g fill="#F4C95D"><path d="M160 ' + peak + ' l-30 -50 l10 20 l-6 -30 l16 30 l4 -34 l6 34 l16 -30 l-6 30 l10 -20z"/></g><path d="M156 ' + (peak + 2) + ' q-40 30 -70 54 M164 ' + (peak + 2) + ' q40 30 70 54" stroke="#E9744F" stroke-width="9" fill="none"/><g fill="#5B5D63" opacity="0.7"><circle cx="150" cy="24" r="14"/><circle cx="175" cy="18" r="18"/><circle cx="200" cy="30" r="12"/></g>' : "") +
      (s === 3 ? '<path d="M156 ' + (peak + 2) + ' q-40 34 -80 70 M164 ' + (peak + 2) + ' q40 34 80 70" stroke="#5B5D63" stroke-width="9" fill="none"/>' : "") +
      lab(["magma: melted rock in a chamber under the crust", "the magma rises through a crack in the crust", "an eruption: lava, ash and gas", "cooled lava: new rock, and a taller volcano"][s]) +
      "</svg>";
  };
  /* an earthquake: 0 two plates side by side, 1 pushing, 2 the sudden slip, 3 the cracked ground after */
  SCENES.quake = (s) => {
    /* the plates meet at x 160 and stay touching: after the slip one is higher
       than the other, never apart, and the house stands on the surface. A gap
       used to open and the house sat underground (Grade 4 review). */
    const dl = s >= 2 ? 8 : 0, dr = s >= 2 ? -8 : 0;
    const say = (t, fill, size) => '<text x="160" y="50" text-anchor="middle" fill="' + (fill || "#1B1B1B") + '" font-size="' + (size || 14) + '" font-family="Inter, sans-serif" font-weight="800">' + t + "</text>";
    return '<svg viewBox="0 0 320 240" role="img" aria-label="Two pieces of the Earth\'s crust pushing, then slipping"><rect width="320" height="240" fill="#BFE3F5"/>' +
      '<g transform="translate(0 ' + dl + ')"><rect x="0" y="120" width="160" height="130" fill="#7D6B4A"/><rect x="0" y="110" width="160" height="12" fill="#3E8E4A"/><text x="70" y="108" font-size="30" text-anchor="middle">\u{1F3E0}</text></g>' +
      '<g transform="translate(0 ' + dr + ')"><rect x="160" y="120" width="160" height="130" fill="#8A6A4A"/><rect x="160" y="110" width="160" height="12" fill="#3E8E4A"/></g>' +
      (s === 1 ? '<g fill="#D9473F"><path d="M100 170 h40 l-8 -10 v20z"/><path d="M220 170 h-40 l8 -10 v20z"/></g>' + say("the plates push against each other") : "") +
      (s === 2 ? '<g stroke="#D9473F" stroke-width="3"><path d="M30 92 l10 -14 M60 88 l8 -16 M250 90 l-10 -14 M280 92 l-8 -16"/></g>' + say("they slip! the ground shakes", "#D9473F", 16) : "") +
      (s === 3 ? '<path d="M160 112 l6 30 l-8 30 l10 40 l-6 30" stroke="#1B1B1B" stroke-width="4" fill="none"/>' + say("a crack in the crust where they moved") : "") +
      (s === 0 ? say("two pieces of the crust, side by side") : "") +
      "</svg>";
  };

  /* ---- Stage 4 sims -------------------------------------------------- */
  /* an arm: the biceps and triceps take turns to pull */
  function armSvg(bent, tricepsOn) {
    /* bent: the biceps has contracted; tricepsOn: the triceps has pulled the arm
       straight; neither: at rest, both relaxed. Each muscle is joined by a
       tendon across the elbow to the forearm and moves with it, so the picture
       shows a pull on a bone (4Bs.02); the muscles used to stop short of the
       elbow (Grade 4 re-review, 2026-09-11). */
    const bi = bent ? "contracted: shorter, fatter" : "relaxed", tri = !bent && tricepsOn ? "contracted: shorter, fatter" : "relaxed";
    const th = (bent ? -70 : 0) * Math.PI / 180, rot = (x, y) => [160 + (x - 160) * Math.cos(th) - (y - 105) * Math.sin(th), 105 + (x - 160) * Math.sin(th) + (y - 105) * Math.cos(th)];
    const bRx = bent ? 40 : 50, bY = bent ? 66 : 76, tOn = tri !== "relaxed", tRx = tOn ? 40 : 50, tY = tOn ? 136 : 132;
    const bA = rot(184, 94), tA = rot(150, 119);
    const tendon = (x1, y1, p) => '<path d="M' + x1 + " " + y1 + " L" + p[0].toFixed(1) + " " + p[1].toFixed(1) + '" stroke="#A8433A" stroke-width="4" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 320 220" role="img" aria-label="An arm, ' + (bent ? "bent" : "straight") + ', with the biceps and triceps joined to the forearm"><rect width="320" height="220" fill="#F3EFE6"/>' +
      '<rect x="40" y="90" width="120" height="30" rx="14" fill="#E9E4D6" stroke="#B5A990" stroke-width="2"/>' +
      '<g transform="rotate(' + (bent ? -70 : 0) + ' 160 105)"><rect x="160" y="92" width="120" height="26" rx="13" fill="#E9E4D6" stroke="#B5A990" stroke-width="2"/><text x="290" y="112" font-size="24">✋️</text></g>' +
      tendon(100 + bRx - 4, bY, bA) + tendon(100 + tRx - 4, tY, tA) +
      '<ellipse cx="100" cy="' + bY + '" rx="' + bRx + '" ry="' + (bent ? 22 : 12) + '" fill="#D9473F"/><text x="100" y="' + (bent ? 40 : 58) + '" text-anchor="middle" fill="#1B1B1B" font-size="12" font-family="Inter, sans-serif" font-weight="800">biceps ' + bi + "</text>" +
      '<ellipse cx="100" cy="' + tY + '" rx="' + tRx + '" ry="' + (tOn ? 20 : 11) + '" fill="#E9744F"/><text x="100" y="' + (tOn ? 172 : 164) + '" text-anchor="middle" fill="#1B1B1B" font-size="12" font-family="Inter, sans-serif" font-weight="800">triceps ' + tri + "</text>" +
      '<text x="210" y="206" fill="#6B5E48" font-size="11" font-family="Inter, sans-serif" font-weight="800">tendons join muscle to bone</text></svg>';
  }
  SIMS.muscles = {
    init(box) { box.innerHTML = armSvg(false); },
    run(box, api) {
      return new Promise((done) => {
        let bent = false; const seen = new Set();
        const paint = () => {
          api.controls.innerHTML = '<button type="button" class="big small' + (bent ? " ghost" : " teal") + '" id="' + api.id + 'b"' + (bent ? " disabled" : "") + '>\u{1F4AA}\u{1F3FE} Contract the biceps</button><button type="button" class="big small' + (bent ? " teal" : " ghost") + '" id="' + api.id + 't"' + (bent ? "" : " disabled") + '>Contract the triceps</button>';
          $(api.id + "b").addEventListener("click", () => { bent = true; seen.add("b"); box.innerHTML = armSvg(true); SOUND.play("click", 0.3); api.say("The biceps contracts: it gets shorter and fatter and pulls the lower arm up. The triceps relaxes and stretches."); paint(); check(); });
          $(api.id + "t").addEventListener("click", () => { bent = false; seen.add("t"); box.innerHTML = armSvg(false, true); SOUND.play("click", 0.3); api.say("Now the triceps contracts and pulls the arm straight. The biceps relaxes. Muscles can only pull, so they work in pairs."); paint(); check(); });
        };
        const check = () => { if (seen.has("b") && seen.has("t")) setTimeout(() => { api.controls.innerHTML = ""; api.say("A pair of muscles: one contracts while the other relaxes. That is how muscles move your bones."); done(); }, 2800); };
        paint();
      });
    },
  };

  /* the particle model: a box of particles heated and cooled */
  function particleSvg(state, jiggle, tick) {
    /* state 0 cold solid, 1 warm solid, 2 liquid. All forty particles touch. A
       solid keeps them in rows, vibrating in place; in a liquid the rows slide
       past each other, alternate rows in opposite directions, tick by tick, and
       three darker particles let the child follow them. It used to wobble a
       grid in place and call it sliding (Grade 4 re-review, 2026-09-11). */
    const dots = [], t = tick || 0, R = 11, D = 23;
    const dot = (x, y, fill) => '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + R + '" fill="' + fill + '" stroke="#1B2A3A" stroke-width="2"/>';
    if (state === 2) {
      for (let k = 0; k < 4; k++) for (let j = 0; j < 10; j++) {
        const shift = Math.floor(t / 2) * (k % 2 ? 1 : -1), slot = ((j + shift) % 10 + 10) % 10;
        const x = 52 + (k % 2 ? 11.5 : 0) + slot * D + Math.sin(t * 0.9 + j * 2.3 + k) * 1.5, y = 189 - k * 20 + Math.cos(t * 0.8 + j * 1.3) * 1.5;
        dots.push(dot(x, y, (k * 10 + j) % 13 === 4 ? "#1F4F8A" : "#3B7FD1"));
      }
    } else {
      for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
        const j = jiggle * (state === 1 ? 3 : 1.2), dx = (r + c) % 2 ? j : -j, dy = (r + c) % 2 ? -j : j;
        dots.push(dot(80 + c * D + dx, 97 + r * D + dy, "#7BC47F"));
      }
    }
    return '<svg viewBox="0 0 320 220" role="img" aria-label="Particles in a box, ' + ["a cold solid", "a warm solid", "a liquid"][state] + '"><rect width="320" height="220" fill="#F3EFE6"/><rect x="36" y="30" width="248" height="170" fill="none" stroke="#3A3A3A" stroke-width="3"/>' + dots.join("") +
      '<text x="160" y="214" text-anchor="middle" fill="#1B1B1B" font-size="13" font-family="Inter, sans-serif" font-weight="800">' + ["solid: packed in rows, vibrating a little", "solid, warmer: vibrating harder", "liquid: touching, but sliding past each other"][state] + "</text></svg>";
  }
  SIMS.particles = {
    init(box) { box.innerHTML = particleSvg(0, 1); },
    run(box, api) {
      return new Promise((done) => {
        let heat = 0, melted = false, frozen = false, tick = 0;
        const timer = setInterval(() => { tick++; const state = heat >= 2 ? 2 : heat; box.innerHTML = particleSvg(state, tick % 2 ? 1 : -1, tick); }, 260);
        const paint = () => {
          api.controls.innerHTML = '<button type="button" class="big small' + (heat >= 2 ? " ghost" : " teal") + '" id="' + api.id + 'h"' + (heat >= 2 ? " disabled" : "") + '>\u{1F525} Heat it</button><button type="button" class="big small' + (heat <= 0 ? " ghost" : "") + '" id="' + api.id + 'c"' + (heat <= 0 ? " disabled" : "") + '>❄️ Cool it</button>';
          $(api.id + "h").addEventListener("click", () => { heat++; SOUND.play("pop", 0.3); if (heat === 1) api.say("Heat gives the particles more energy. They vibrate harder, but they stay in their rows. Still a solid."); else { melted = true; api.say("More heat, and the particles vibrate so hard they break out of their rows. They stay touching but slide past each other. It has melted: a liquid."); } paint(); check(); });
          $(api.id + "c").addEventListener("click", () => { heat--; SOUND.play("click", 0.3); if (heat === 1) api.say("Cool it and the particles lose energy. They slow down and lock back into rows. It has frozen: a solid again."); else api.say("Colder still. The particles vibrate less, but they never stop moving completely."); if (melted && heat <= 1) frozen = true; paint(); check(); });
        };
        const check = () => { if (melted && frozen) { clearInterval(timer); box.innerHTML = particleSvg(heat >= 2 ? 2 : heat, 1); setTimeout(() => { api.controls.innerHTML = ""; api.say("Melting and freezing change how the particles are arranged, not what they are. The same particles, the same substance, all the way through."); done(); }, 2800); } };
        paint();
      });
    },
  };

  /* a chemical reaction beside a plain mix */
  function beakerSvg(x, fill, level, fizz, label, extra) {
    return '<g><path d="M' + (x - 44) + ' 50 v120 q0 12 12 12 h64 q12 0 12 -12 v-120" fill="none" stroke="#3A3A3A" stroke-width="3"/>' +
      '<rect x="' + (x - 42) + '" y="' + (182 - level) + '" width="84" height="' + level + '" fill="' + fill + '" opacity="0.75"/>' + (extra || "") +
      (fizz ? '<g fill="#fff" opacity="0.8">' + [0, 1, 2, 3, 4, 5, 6].map((k) => '<circle cx="' + (x - 30 + k * 10) + '" cy="' + (90 + (k * 37) % 70) + '" r="' + (3 + k % 3) + '"/>').join("") + "</g>" : "") +
      '<text x="' + x + '" y="206" text-anchor="middle" fill="#1B1B1B" font-size="12" font-family="Inter, sans-serif" font-weight="800">' + esc(label) + "</text></g>";
  }
  SIMS.reaction = {
    draw(box, a, b) {
      box.innerHTML = '<svg viewBox="0 0 320 220" role="img" aria-label="Two beakers: sand in water, and vinegar with bicarbonate of soda"><rect width="320" height="220" fill="#F3EFE6"/>' +
        beakerSvg(90, "#3B7FD1", 90, false, a ? "sand and water: a mixture" : "water", a ? '<rect x="48" y="166" width="84" height="16" fill="#C9A26B"/>' : "") +
        beakerSvg(230, b ? "#BFE3F5" : "#E9E4D6", b ? 130 : 40, b, b ? "fizzing: a new substance, a gas" : "bicarbonate of soda", "") + "</svg>";
    },
    init(box) { SIMS.reaction.draw(box, false, false); },
    run(box, api) {
      return new Promise((done) => {
        let a = false, b = false;
        const paint = () => {
          api.controls.innerHTML = '<button type="button" class="big small' + (a ? " ghost" : " teal") + '" id="' + api.id + 'a"' + (a ? " disabled" : "") + '>\u{1F3D6}️ Add sand to the water</button><button type="button" class="big small' + (b ? " ghost" : " teal") + '" id="' + api.id + 'b"' + (b ? " disabled" : "") + '>\u{1F9EA} Add vinegar to the bicarbonate</button>';
          $(api.id + "a").addEventListener("click", () => { a = true; SIMS.reaction.draw(box, a, b); SOUND.play("splash", 0.4); api.say("The sand sinks. It is still sand, and the water is still water. A mixture. Nothing new has been made, and you could filter the sand back out."); paint(); check(); });
          $(api.id + "b").addEventListener("click", () => { b = true; SIMS.reaction.draw(box, a, b); SOUND.play("kettle", 0.5); api.say("Fizz! Bubbles pour out. A gas is being made that was not there before. The vinegar and the bicarbonate have reacted to make new substances. You cannot get them back."); paint(); check(); });
        };
        const check = () => { if (a && b) setTimeout(() => { api.controls.innerHTML = ""; api.say("Mixing keeps the substances. A chemical reaction makes new ones. The fizz was the clue."); done(); }, 3000); };
        paint();
      });
    },
  };

  /* a bouncing ball: the energy goes somewhere every bounce */
  SIMS.energyDrop = {
    /* The ball is let go from 4 marks and bounces to 3, 2, then 1. Its own
       energy (stored by height, and movement) falls with the height, and what
       it loses goes to sound and warmth, so the bars ALWAYS total 100. They
       used to total 104, 108 and 112: energy made from nothing, in the lesson
       that says it cannot be (Grade 4 review, 2026-09-11). */
    heights: [4, 3, 2, 1],
    draw(box, n, y) {
      const ball = SIMS.energyDrop.heights[n] * 25, lost = 100 - ball;
      const bars = [["ball", ball, "#3B7FD1"], ["sound", Math.round(lost * 0.4), "#F4C95D"], ["warmth", lost - Math.round(lost * 0.4), "#E9744F"]];
      const ticks = [0, 1, 2, 3, 4].map((k) => '<line x1="150" x2="162" y1="' + (180 - k * 30) + '" y2="' + (180 - k * 30) + '" stroke="#3A3A3A" stroke-width="2"/><text x="166" y="' + (184 - k * 30) + '" fill="#3A3A3A" font-size="11" font-family="Inter, sans-serif" font-weight="800">' + k + "</text>").join("");
      return box.innerHTML = '<svg viewBox="0 0 320 220" role="img" aria-label="A ball dropped from 4 marks and bouncing lower each time"><rect width="320" height="220" fill="#F3EFE6"/><rect x="0" y="180" width="320" height="40" fill="#8A6A4A"/>' +
        '<text x="200" y="12" fill="#1B1B1B" font-size="11" font-family="Inter, sans-serif" font-weight="800">energy, out of 100</text>' +
        '<line x1="156" x2="156" y1="60" y2="180" stroke="#3A3A3A" stroke-width="2"/>' + ticks + '<text x="150" y="50" fill="#3A3A3A" font-size="11" font-family="Inter, sans-serif" font-weight="800">marks</text>' +
        '<circle cx="90" cy="' + y + '" r="16" fill="#D9473F" style="transition: cy 500ms ease-in"/>' +
        bars.map((b, k) => '<rect x="200" y="' + (30 + k * 50) + '" width="' + b[1] + '" height="22" fill="' + b[2] + '" style="transition: width 600ms ease"/><text x="200" y="' + (24 + k * 50) + '" fill="#1B1B1B" font-size="12" font-family="Inter, sans-serif" font-weight="800">' + b[0] + ": " + b[1] + "</text>").join("") +
        '<text x="160" y="206" text-anchor="middle" fill="#fff" font-size="12" font-family="Inter, sans-serif" font-weight="800">' + (n ? "bounce " + n + " of 3: up to " + SIMS.energyDrop.heights[n] + " marks" : "held at 4 marks: stored energy") + "</text></svg>";
    },
    init(box) { SIMS.energyDrop.draw(box, 0, 44); },
    run(box, api) {
      return new Promise((done) => {
        let n = 0;
        api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'd">⚽ Drop the ball</button>';
        $(api.id + "d").addEventListener("click", () => {
          if (n >= 3) return; n++;
          SIMS.energyDrop.draw(box, n, 164); SOUND.play("thud", 0.5);
          setTimeout(() => { SIMS.energyDrop.draw(box, n, 164 - SIMS.energyDrop.heights[n] * 30); api.say(n === 1 ? "Thud. The ball bounces, but not as high. Some of its movement energy became sound, and some warmed the ball and the floor a tiny bit." : n === 2 ? "Lower again. More of the energy has gone into sound and warmth. None of it has vanished; it has moved somewhere else." : "Lower still. The energy was never lost. It was transferred, bounce by bounce, into sound and heat in the room."); }, 600);
          if (n >= 3) setTimeout(() => { api.controls.innerHTML = ""; done(); }, 3600);
        });
      });
    },
  };

  /* a torch, a mirror that turns, and an eye */
  SIMS.rayMirror = {
    /* The reflected ray is COMPUTED (angle in = angle out) from the mirror's
       tilt; it used to be drawn to hand-picked points that broke the law of
       reflection (Grade 4 review, 2026-09-11). Tilt 2 is the one that sends the
       ray to the eye. */
    tilt: (angle) => (angle - 2) * 20 - 6,
    draw(box, angle, blocked) {
      const T = [62, 160], M = [251, 65], E = [110, 28], th = SIMS.rayMirror.tilt(angle) * Math.PI / 180;
      const vl = Math.hypot(M[0] - T[0], M[1] - T[1]), ux = (M[0] - T[0]) / vl, uy = (M[1] - T[1]) / vl;
      const nx = Math.cos(th), ny = Math.sin(th), d = ux * nx + uy * ny, rx = ux - 2 * d * nx, ry = uy - 2 * d * ny;
      const ex = E[0] - M[0], ey = E[1] - M[1], hit = Math.abs(rx * ey - ry * ex) < 16 && rx * ex + ry * ey > 0;
      const len = hit ? rx * ex + ry * ey - 18 : 420, end = [M[0] + rx * len, M[1] + ry * len];
      const stopX = 146, stopT = (stopX - T[0]) / (M[0] - T[0]), stopY = T[1] + (M[1] - T[1]) * stopT;
      return box.innerHTML = '<svg viewBox="0 0 320 220" role="img" aria-label="A torch shining at a mirror, with an eye watching"><defs><marker id="rmArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#F4C95D"/></marker></defs><rect width="320" height="220" fill="#1B2A3A"/>' +
        '<text x="40" y="180" font-size="40" text-anchor="middle">\u{1F526}</text>' +
        '<path d="M62 160 L' + (blocked ? stopX : M[0]) + " " + (blocked ? stopY.toFixed(1) : M[1]) + '" stroke="#F4C95D" stroke-width="4" marker-end="url(#rmArrow)"/>' +
        (blocked ? '<rect x="146" y="80" width="14" height="60" fill="#8A6A4A"/><text x="153" y="70" font-size="12" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif">book</text>' : "") +
        '<g transform="rotate(' + SIMS.rayMirror.tilt(angle) + ' 251 65)"><rect x="246" y="30" width="10" height="70" rx="3" fill="#BFE3F5" stroke="#fff" stroke-width="2"/></g>' +
        (!blocked ? '<path d="M' + M[0] + " " + M[1] + " L" + end[0].toFixed(1) + " " + end[1].toFixed(1) + '" stroke="#F4C95D" stroke-width="4" marker-end="url(#rmArrow)"/>' : "") +
        '<text x="110" y="40" font-size="34" text-anchor="middle">\u{1F441}️</text>' +
        '<text x="160" y="212" text-anchor="middle" fill="#fff" font-size="12" font-family="Inter, sans-serif" font-weight="800">' + (blocked ? "the book blocks the ray: no torch in the mirror" : hit ? "the ray reaches the eye: you see the torch" : "the ray bounces off, but misses the eye") + "</text></svg>";
    },
    init(box) { SIMS.rayMirror.draw(box, 0, false); },
    run(box, api) {
      return new Promise((done) => {
        let angle = 0, blocked = false, hit = false, seenBlock = false;
        const paint = () => {
          api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 't">' + ICONS.mirror + ' Turn the mirror</button><button type="button" class="big small ghost" id="' + api.id + 'b">' + (blocked ? "Take the book away" : "\u{1F4D5} Put a book in the way") + "</button>";
          $(api.id + "t").addEventListener("click", () => { angle = (angle + 1) % 5; SIMS.rayMirror.draw(box, angle, blocked); SOUND.play("click", 0.3); if (angle === 2 && !blocked) { hit = true; SOUND.play("ding", 0.4); api.say("The light travels in a straight line to the mirror, bounces off, and travels in a straight line to your eye. Now you can see the torch in the mirror."); } else api.say(blocked ? "Turning the mirror does nothing while the book blocks the ray." : "The ray reflects off the mirror in a straight line, but it misses the eye."); check(); });
          $(api.id + "b").addEventListener("click", () => { blocked = !blocked; if (blocked) seenBlock = true; SIMS.rayMirror.draw(box, angle, blocked); SOUND.play("thud", 0.3); api.say(blocked ? "The book is opaque. The ray stops at it. No light from the torch reaches the mirror, so you cannot see the torch in the mirror." : "Book gone. The ray reaches the mirror again."); paint(); check(); });
        };
        const check = () => { if (hit && seenBlock) setTimeout(() => { api.controls.innerHTML = ""; api.say("Light travels in straight lines. It bounces off a mirror, and you see a thing when light from it reaches your eye."); done(); }, 3000); };
        paint();
      });
    },
  };

  /* a series circuit: more cells, more lamps, a switch */
  function seriesSvg(s) {
    /* 0 very dim .. 4 very bright; off only when the switch is open. "Very dim"
       used to be drawn exactly like off, and a third cell was capped at the
       same "bright" as two (Grade 4 review, 2026-09-11). */
    const bright = Math.max(0, Math.min(4, s.cells - s.lamps + 2));
    const lampFill = s.open ? "#1B3A52" : ["#5E5634", "#8A7A3A", "#F4C95D", "#FFF3B0", "#FFFFFF"][bright];
    return '<svg viewBox="0 0 320 220" role="img" aria-label="A series circuit with ' + s.cells + ' cell(s), ' + s.lamps + ' lamp(s) and a switch, ' + (s.open ? "open" : "closed") + '"><rect width="320" height="220" fill="#0E2434"/>' +
      '<path d="M40 40 H280 V180 H40 Z" fill="none" stroke="#F4C95D" stroke-width="6"/>' +
      Array.from({ length: s.cells }, (_, k) => '<g transform="translate(' + (70 + k * 40) + ' 40)"><rect x="-12" y="-14" width="24" height="28" fill="#0E2434"/><rect x="-8" y="-12" width="6" height="24" fill="#F4C95D"/><rect x="2" y="-6" width="6" height="12" fill="#F4C95D"/></g>').join("") +
      Array.from({ length: s.lamps }, (_, k) => '<g transform="translate(' + (110 + k * 60) + ' 180)">' + (!s.open && bright >= 3 ? '<circle r="' + (bright === 4 ? 32 : 26) + '" fill="#FFF3B0" opacity="0.35"/>' : "") + '<circle r="18" fill="' + lampFill + '" stroke="#F4C95D" stroke-width="3"/><path d="M-10 -10 L10 10 M10 -10 L-10 10" stroke="' + (s.open ? "#F4C95D" : "#0E2434") + '" stroke-width="3"/></g>').join("") +
      '<g transform="translate(280 110)"><rect x="-14" y="-24" width="28" height="48" fill="#0E2434"/><circle cy="-18" r="4" fill="#F4C95D"/><circle cy="18" r="4" fill="#F4C95D"/><path d="M0 -18 L' + (s.open ? "22 8" : "0 18") + '" stroke="#F4C95D" stroke-width="5" stroke-linecap="round"/></g>' +
      '<text x="20" y="20" fill="#93AABE" font-size="13" font-family="Inter, sans-serif" font-weight="800">' + s.cells + " cell" + (s.cells > 1 ? "s" : "") + " · " + s.lamps + " lamp" + (s.lamps > 1 ? "s" : "") + " · switch " + (s.open ? "open" : "closed") + "</text>" +
      '<text x="160" y="120" text-anchor="middle" fill="#F4C95D" font-size="16" font-family="Inter, sans-serif" font-weight="800">' + (s.open ? "off: a break in the circuit" : ["very dim", "dim", "normal", "bright", "very bright"][bright]) + "</text></svg>";
  }
  SIMS.seriesCircuit = {
    init(box) { box.innerHTML = seriesSvg({ cells: 1, lamps: 1, open: false }); },
    run(box, api) {
      return new Promise((done) => {
        const s = { cells: 1, lamps: 1, open: false }; const did = new Set();
        const paint = () => {
          api.controls.innerHTML = '<button type="button" class="big small' + (s.cells >= 3 ? " ghost" : " teal") + '" id="' + api.id + 'c"' + (s.cells >= 3 ? " disabled" : "") + '>\u{1F50B} Add a cell</button><button type="button" class="big small' + (s.lamps >= 3 ? " ghost" : " teal") + '" id="' + api.id + 'l"' + (s.lamps >= 3 ? " disabled" : "") + '>\u{1F4A1} Add a lamp</button><button type="button" class="big small" id="' + api.id + 's">' + (s.open ? "Close the switch" : "Open the switch") + "</button>";
          $(api.id + "c").addEventListener("click", () => { s.cells++; did.add("cell"); box.innerHTML = seriesSvg(s); SOUND.play("ding", 0.4); api.say("Another cell. More push, and the lamps are brighter."); paint(); check(); });
          $(api.id + "l").addEventListener("click", () => { s.lamps++; did.add("lamp"); box.innerHTML = seriesSvg(s); SOUND.play("click", 0.4); api.say("Another lamp. The same push is shared between more lamps, so each one is dimmer."); paint(); check(); });
          $(api.id + "s").addEventListener("click", () => { s.open = !s.open; did.add(s.open ? "open" : "close"); box.innerHTML = seriesSvg(s); SOUND.play("click", 0.5); api.say(s.open ? "The switch is open. That is a break in the circuit. No electricity can flow, and every lamp goes out." : "The switch is closed. The circuit is complete again and the lamps come back on."); paint(); check(); });
        };
        const check = () => { if (did.has("cell") && did.has("lamp") && did.has("open") && did.has("close")) setTimeout(() => { api.controls.innerHTML = ""; api.say("More cells, brighter. More lamps, dimmer. Open the switch, off. That is a series circuit."); done(); }, 2800); };
        paint();
      });
    },
  };

  /* a conductor test: the material sits in a gap in the circuit (predictEach) */
  SIMS.conductor = {
    init(box) { box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="A circuit with a gap, and a material to put in the gap"><rect width="320" height="200" fill="#0E2434"/><path d="M40 40 H280 V160 H200 M40 40 V160 H120" fill="none" stroke="#F4C95D" stroke-width="6"/><g transform="translate(60 40)"><rect x="-10" y="-14" width="20" height="28" fill="#0E2434"/><rect x="-6" y="-12" width="5" height="24" fill="#F4C95D"/><rect x="1" y="-6" width="5" height="12" fill="#F4C95D"/></g><g transform="translate(280 100)"><circle id="cl" r="18" fill="#1B3A52" stroke="#F4C95D" stroke-width="3"/><path d="M-10 -10 L10 10 M10 -10 L-10 10" stroke="#F4C95D" stroke-width="3"/></g><g id="cm"></g><text id="ct" x="160" y="120" text-anchor="middle" fill="#93AABE" font-size="13" font-family="Inter, sans-serif" font-weight="800">the gap</text></svg>'; },
    act(box, item, api) {
      box.querySelector("#cm").innerHTML = glyphAt(160, 172, 40, item.pic);
      return new Promise((r) => {
        setTimeout(() => {
          const yes = item.answer === "yes";
          box.querySelector("#cl").setAttribute("fill", yes ? "#F4C95D" : "#1B3A52");
          box.querySelector("#ct").textContent = yes ? "lamp ON: a conductor" : "lamp off: an insulator";
          SOUND.play(yes ? "ding" : "thud", 0.4);
          setTimeout(() => { api.say(yes ? "The lamp lights. Electricity flows through the " + item.label + ". It is a conductor." : "The lamp stays off. Electricity cannot flow through the " + item.label + ". It is an insulator."); r(); }, 700);
        }, 40);
      });
    },
  };

  /* the Earth spins: the Sun seems to move, and the shadow swings */
  SIMS.dayNight = {
    draw(box, h) {
      /* h 0..3: 6am, midday, 6pm, midnight; the marker sits on the globe and turns */
      /* the Sun is on the LEFT and the night half on the right, so the Earth turns
         anticlockwise here: top (sunrise), left (midday, facing the Sun), bottom
         (sunset), right (midnight). It turned the other way and put "you" on the
         dark side at midday (Grade 4 review, 2026-09-11). */
      const a = -h * 90, side = ["sunrise: the Sun is low in the east", "midday: the Sun is high, the shadow short", "sunset: the Sun is low in the west", "midnight: our side faces away from the Sun. Night"][h];
      const mx = 160 + Math.cos((a - 90) * Math.PI / 180) * 70, my = 110 + Math.sin((a - 90) * Math.PI / 180) * 70;
      return box.innerHTML = '<svg viewBox="0 0 320 220" role="img" aria-label="The Earth spinning next to the Sun"><rect width="320" height="220" fill="#0B1D2C"/><circle cx="20" cy="110" r="40" fill="#F4C95D"/>' +
        '<circle cx="160" cy="110" r="70" fill="#3B7FD1"/><path d="M160 40 A70 70 0 0 1 160 180 z" fill="#0B1D2C" opacity="0.6"/>' +
        '<g transform="rotate(' + a + ' 160 110)"><path d="M120 60 q30 -10 40 20 q-20 30 -40 10z M150 130 q30 0 30 30 q-30 10 -30 -30z" fill="#4CB65C"/></g>' +
        '<circle cx="' + mx + '" cy="' + my + '" r="8" fill="#D9473F"/><text x="' + mx + '" y="' + (my - 12) + '" text-anchor="middle" fill="#fff" font-size="11" font-family="Inter, sans-serif" font-weight="800">you</text>' +
        /* your stick and its shadow, as you would see them where you stand:
           long towards the west at sunrise, short at midday, long towards the
           east at sunset, none at night (Grade 4 re-review, 2026-09-11) */
        '<g transform="translate(250 150)"><rect x="-44" y="-40" width="88" height="44" rx="6" fill="' + (h === 3 ? "#16283A" : "#BFE3F5") + '"/><rect x="-44" y="-4" width="88" height="8" fill="#7D6B4A"/>' +
        (h === 3 ? "" : '<circle cx="' + [-34, 0, 34][h] + '" cy="' + [-8, -32, -8][h] + '" r="5" fill="#F4C95D"/><path d="M0 -4 L' + [38, 5, -38][h] + ' -4" stroke="#3A3A3A" stroke-width="4" stroke-linecap="round" opacity="0.6"/>') +
        '<path d="M0 -4 V-22" stroke="#6B4A2A" stroke-width="3"/><text x="0" y="16" text-anchor="middle" fill="#fff" font-size="9" font-family="Inter, sans-serif" font-weight="800">your stick</text></g>' +
        '<text x="160" y="208" text-anchor="middle" fill="#fff" font-size="12" font-family="Inter, sans-serif" font-weight="800">' + side + "</text></svg>";
    },
    init(box) { SIMS.dayNight.draw(box, 0); },
    run(box, api) {
      return new Promise((done) => {
        let h = 0;
        api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 's">\u{1F30D} Spin on six hours</button>';
        $(api.id + "s").addEventListener("click", () => {
          h++; SIMS.dayNight.draw(box, h % 4); SOUND.play("pop", 0.25);
          api.say(["", "Six hours on. The Earth has turned a quarter and you now face the Sun. Midday. The Sun looks high, and shadows are short.", "Another quarter turn. The Sun looks low on the other side of the sky. Sunset. Long shadows pointing the other way.", "Another quarter. Your side of the Earth faces away from the Sun. Night. The Sun did not go anywhere. You did.", "A whole turn. Sunrise again. One spin, one day. The Sun only seems to move because the Earth turns."][h]);
          if (h >= 4) setTimeout(() => { api.controls.innerHTML = ""; done(); }, 3200);
        });
      });
    },
  };

  /* a paper spinner dropped three times: the numbers are close, not the same */
  SIMS.spinner = {
    /* With data "big": true the child then drops a spinner with bigger wings
       three times, so the lesson's question (does a bigger spinner fall more
       slowly?) is answered by the sim, not only asserted (Grade 4 review). */
    times: [2.1, 2.3, 2.0], bigTimes: [2.8, 3.0, 2.7],
    draw(box, n, y, big, m) {
      const wing = big ? 32 : 16, T = SIMS.spinner.times, B = SIMS.spinner.bigTimes;
      const row = (k, label, t, shown, yy) => '<text x="176" y="' + yy + '" fill="#1B1B1B" font-size="14" font-family="Inter, sans-serif" font-weight="800">' + label + " " + (k + 1) + ": " + (shown ? t.toFixed(1) + " s" : "") + "</text>";
      return box.innerHTML = '<svg viewBox="0 0 320 220" role="img" aria-label="A paper spinner dropped from a height, timed"><rect width="320" height="220" fill="#DDEFF7"/><rect x="0" y="190" width="320" height="30" fill="#8A6A4A"/>' +
        '<g transform="translate(100 ' + y + ')" style="transition: transform ' + (big ? 2600 : 2000) + 'ms linear"><path d="M-6 0 v30 h12 v-30z" fill="#F4C95D"/><path d="M-6 0 l-' + wing + ' -22 h' + (wing - 4) + ' z M6 0 l' + wing + ' -22 h-' + (wing - 4) + 'z" fill="#F0A56B"/></g>' +
        [0, 1, 2].map((k) => row(k, "small", T[k], k < n, 30 + k * 22)).join("") +
        (n >= 3 ? '<text x="176" y="96" fill="#1E8C86" font-size="13" font-family="Inter, sans-serif" font-weight="800">small: about 2.1 s</text>' : "") +
        (m !== undefined ? [0, 1, 2].map((k) => row(k, "big", B[k], k < m, 120 + k * 22)).join("") : "") +
        (m >= 3 ? '<text x="176" y="186" fill="#1E8C86" font-size="13" font-family="Inter, sans-serif" font-weight="800">big: about 2.8 s</text>' : "") + "</svg>";
    },
    init(box) { SIMS.spinner.draw(box, 0, 20); },
    run(box, api) {
      return new Promise((done) => {
        const bigToo = !!(api.data && api.data.big);
        let n = 0, m = 0, busy = false;
        const button = (t) => { api.controls.innerHTML = '<button type="button" class="big teal small" id="' + api.id + 'd">⏱️ ' + t + "</button>"; $(api.id + "d").addEventListener("click", drop); };
        const finish = () => setTimeout(() => { api.controls.innerHTML = ""; done(); }, 3400);
        const drop = () => {
          if (busy) return;
          const big = n >= 3;
          if (big && (!bigToo || m >= 3)) return;
          busy = true;
          SIMS.spinner.draw(box, n, 20, big, big ? m : undefined); setTimeout(() => { box.querySelector("g").setAttribute("transform", "translate(100 160)"); }, 40);
          setTimeout(() => {
            if (big) m++; else n++;
            SIMS.spinner.draw(box, n, 160, big, big ? m : undefined); busy = false; SOUND.play("click", 0.3);
            if (!big) {
              api.say(n === 1 ? "2.1 seconds." : n === 2 ? "2.3 seconds. Not quite the same. Your thumb on the stopwatch, a breath of air, a wobble: small things change the number." : "2.0 seconds. Three drops, three slightly different numbers, all close to 2.1. One measurement could have been the odd one. Three together are reliable." + (bigToo ? " Now the spinner with bigger wings." : ""));
              if (n >= 3) { if (bigToo) button("Drop the big-wing spinner"); else finish(); }
            } else {
              api.say(m === 1 ? "2.8 seconds." : m === 2 ? "3.0 seconds." : "2.7 seconds. The big-wing spinner took about 2.8 seconds every time, against about 2.1 for the small one. Bigger wings, slower fall, and the repeats show it was not luck.");
              if (m >= 3) finish();
            }
          }, big ? 2800 : 2200);
        };
        button("Drop it and time it");
      });
    },
  };

  /* ---- use a key to identify things (4TWSc.02) -------------------------
     A branching key: each node is a yes/no question and points at another
     node or at a name. The child works one creature at a time down the key;
     a wrong turn is caught at once with the creature's own fact, because a
     key you can follow wrongly to a confident answer teaches nothing. */
  function useKey(o) {
    const el = o.el, nodes = {}, items = o.items, id = el.stage + "k";
    (o.nodes || []).forEach((n) => { nodes[n.id] = n; });
    let i = 0, node = o.nodes[0].id, right = 0, wrong = 0, lock = false;
    function paint() {
      const it = items[i], nd = nodes[node];
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="peitem">' + picHtml(it.pic) + '<span class="lab">' + esc(it.label) + '</span></div>' +
        '<div class="keycard"><p class="keyq">' + esc(nd.q) + '</p><div class="bigbtns"><button type="button" class="big small teal" data-a="yes">Yes</button><button type="button" class="big small" data-a="no">No</button></div>' +
        '<p class="keypath">' + (it.trail || []).map((t) => esc(t)).join(" &rarr; ") + "</p></div>";
      $(el.score).textContent = "Creature " + (i + 1) + " of " + items.length;
      $(el.ask).innerHTML = o.ask || "Follow the key. Answer each question about this creature.";
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest("[data-a]"); if (!b || lock) return;
      const it = items[i], nd = nodes[node], ans = b.dataset.a === "yes";
      const truth = !!(it.facts || {})[node];
      if (ans !== truth) {
        wrong++; $(el.fb).className = "fb bad"; $(el.fb).textContent = "Look at the " + it.label + " again. " + (it.hints && it.hints[node] ? it.hints[node] : (truth ? "It does." : "It does not.")); say($(el.fb).textContent); return;
      }
      const next = ans ? nd.yes : nd.no;
      it.trail = (it.trail || []).concat([ans ? "yes" : "no"]);
      if (next.startsWith("=")) {
        lock = true; const name = next.slice(1); const ok = name === it.answer;
        if (ok) right++;
        $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = (ok ? cheer() + " The key says: " + name + "." : "The key says " + name + ", but this is " + it.answer + ".") + " " + (it.why || "");
        say($(el.fb).textContent);
        setTimeout(() => {
          i++; node = o.nodes[0].id; lock = false; $(el.fb).textContent = ""; $(el.fb).className = "fb";
          if (i >= items.length) {
            $(el.stage).innerHTML = ""; $(el.ask).innerHTML = "You identified " + right + " of " + items.length + " with the key."; $(el.score).textContent = "";
            $(el.fb).className = "fb good"; $(el.fb).textContent = o.done;
            reportScore(o.finish, Math.max(0, items.length - wrong), items.length);
            finish(o.finish, o.done);
          } else paint();
        }, 3200);
      } else { node = next; $(el.fb).textContent = ""; paint(); sayHere(o.finish, nodes[node].q); }
    });
    paint();
    ONSHOW[o.finish] = () => afterVoice(() => sayHere(o.finish, nodes[node].q));
  }

  /* ==================================================================
     THE UNIT SHELL - seven steps drawn AROUND every lesson (owner,
     2026-09-10), the furniture the English Grade 1 build carries around a
     unit: what it is about, a lecture, the words, games, things to do at
     home, a placeholder for Science world, and the student-resources
     drawer. _shell.py decides where they sit and what they carry; these
     only draw.

     Three of them tick themselves off - the overview and Science world on
     arrival, the drawer on first opening - for the reason the English
     build's plan step records: a page you have to finish before the
     lesson will open is a lock on the front door. Everything else is
     earned.
     ================================================================== */

  /* ---- what this lesson is about ---- */
  function unitOverview(o) {
    const el = o.el;
    const c = o.counts || {};
    const bits = [];
    if (o.sittings) bits.push("two sittings: about " + o.sittings.one + " + " + o.sittings.two + " minutes");
    if (c.steps) bits.push(c.steps + " steps");
    if (c.words) bits.push(c.words + " science words");
    if (c.games) bits.push(c.games + " games");
    if (c.home) bits.push(c.home + " things to do at home");
    $(el.stage).className = "stagewide";
    $(el.stage).innerHTML =
      '<div class="ovw">' +
      (bits.length ? '<p class="ovw-bits">' + bits.map((b) => "<span>" + esc(b) + "</span>").join("") + "</p>" : "") +
      (o.recap ? '<div class="ovw-recap"><h3 class="ovw-h">Last time: ' + esc(o.recap.title) + "</h3>" +
        ((o.recap.about || []).length ? "<p>You learned to " + (o.recap.about || []).map((t) => esc(lowerFirst(t.replace(/\.$/, "")))).join("; ") + ".</p>" : "") + "</div>" : "") +
      '<h3 class="ovw-h">By the end of this lesson you will be able to&hellip;</h3>' +
      '<ol class="ovw-list">' + (o.about || []).map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>" +
      (o.sittings ? '<p class="ovw-sit">This lesson comes in <b>two parts</b>, about ' + o.sittings.one + " minutes and then about " +
        o.sittings.two + " minutes. Halfway, you can stop for a break, and next time you start where you stopped.</p>" : "") +
      ((o.warmup || []).length ? '<div class="ovw-warm"><h3 class="ovw-h">Before you start: what do you already know?</h3>' +
        '<p class="ovw-note">Just have a go. This is not marked.</p>' +
        o.warmup.map((w, k) => '<div class="warmq" data-w="' + k + '"><button type="button" class="warmask" data-w="' + k + '">&#128266; ' + esc(w.ask) + "</button>" +
          '<div class="warmopts">' + shuffle(w.opts.map((x, j) => ({ t: x.t, ok: x.ok, j }))).map((x) =>
            '<button type="button" class="choice text" data-w="' + k + '" data-ok="' + (x.ok ? 1 : 0) + '">' + esc(x.t) + "</button>").join("") +
          '</div><p class="warmfb" aria-live="polite"></p></div>').join("") + "</div>" : "") +
      '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'r">&#128266; Read it to me</button></div></div>';
    $(el.score).textContent = (o.about || []).length + " things to learn";
    $(el.stage + "r").addEventListener("click", () =>
      say((o.recap ? "Last time: " + o.recap.title + ". " : "") + "By the end of this lesson you will be able to. " + (o.about || []).join(". ")));
    /* THE WARM-UP: a question or two before the lesson, so the child finds out
       what they already know. Never marked and never reported - a guess here
       costs nothing - and the builder refuses a warm-up that repeats the quiz. */
    $(el.stage).querySelectorAll(".warmask").forEach((b) => b.addEventListener("click", () => {
      const w = o.warmup[+b.dataset.w];
      say(w.ask + " " + w.opts.map((x) => x.t).join(", or ") + "?");
    }));
    $(el.stage).querySelectorAll(".warmopts .choice").forEach((b) => b.addEventListener("click", () => {
      const box = b.closest(".warmq");
      if (box.dataset.answered) return;
      box.dataset.answered = "1";
      const ok = b.dataset.ok === "1";
      box.querySelectorAll(".choice").forEach((x) => { x.disabled = true; if (x.dataset.ok === "1" && ok) x.classList.add("right"); });
      b.classList.add(ok ? "right" : "picked");
      const line = ok ? "You knew that already!" : "Good guess. You will find out in this lesson.";
      box.querySelector(".warmfb").textContent = line;
      say(line);
    }));
    /* ON LEAVING, not on drawing and not on arrival. The deck draws every
       step at page load, so a finish() here ticked this step - and Science
       world, which had the same line - before the child had seen either: a
       fresh learner opened a lesson at 13% (found by the 2026-09-11
       re-validation). Moving it to arrival was not enough for THIS step:
       the page arrives on step 1 at load too (show(0) is the draw pass's
       last statement), and at load the progress module - a module script,
       run only after the page is parsed - does not exist yet. So the tick
       reached the dots and never the record: a lesson finished to the last
       sticker was stored 16 of 17 and never complete (measured on the live
       Grade 1 page, 2026-09-11). Science world keeps "on arrival", because
       nothing arrives on it during the load. No spoken line either: the
       next slide's own instruction is speaking. */
    ONLEAVE[o.finish] = () => finish(o.finish);
  }

  /* ---- the unit lecture: the lesson told in parts, by the voice ----
     No video exists for these lessons, and this says so on its face
     rather than drawing an empty player. The voice reads each part when
     the child arrives at it; Next part moves on; the last part finishes
     the step. How far they got is reported in parts. */
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
    /* The slide's own instruction is spoken on arrival; the first part
       follows it rather than talking over it. */
    ONSHOW[o.finish] = () => afterVoice(() => sayHere(o.finish, parts[k].title + ". " + parts[k].say));
  }

  /* ---- the science words: hear each one, then show you know them ----
     Two halves. First every word is tapped - picture, meaning, and the
     word used in a sentence, all spoken. Then the page asks "which word
     means ...?" for each of them, with the other words of THIS lesson as
     the wrong answers, so a wrong tap is a word they are also learning. */
  function scienceWords(o) {
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
            $(el.ask).innerHTML = "You know " + right + " of " + items.length + " science words.";
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

  /* ---- Science world: a placeholder that says it is one ---- */
  function scienceWorld(o) {
    const el = o.el;
    $(el.stage).className = "stagewide";
    $(el.stage).innerHTML =
      '<div class="world"><div class="pic" aria-hidden="true">\u{1F30D}</div>' +
      '<h3 class="lec-h">Science world is being built</h3>' +
      '<p class="lec-p">This part of <b>' + esc(o.title || "the lesson") + "</b> is not here yet. When it is, it will show:</p>" +
      '<ul class="ovw-list">' + (o.soon || []).map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>" +
      '<p class="lec-note">Nothing to do here. It ticks itself off.</p></div>';
    $(el.score).textContent = "coming soon";
    /* on arrival, not at page load - see unitOverview for why the overview
       ticks on leaving instead */
    ONSHOW[o.finish] = () => finish(o.finish);
  }

  /* ---- a full-screen overlay is a modal dialog -------------------------
     2026-09-11 re-validation: the game and drawer overlays had no dialog
     role, left keyboard focus on the button behind them with 32 more
     controls reachable by Tab, and dropped focus to the page body on close.
     modal() gives the overlay a role and a name, keeps Tab inside it, and
     hands focus back to whatever opened it. The game redraws its contents
     every round, so remember() is called before a redraw and refocus()
     after it, putting focus back on the same control where it still
     exists and on the question otherwise. */
  const lowerFirst = (t) => String(t).charAt(0).toLowerCase() + String(t).slice(1);

  /* ---- the break between two sittings --------------------------------
     Offered once, on arriving at sitting 2 from the end of sitting 1. The
     place is already saved (progress is by step), so stopping costs
     nothing: next time the lesson opens here. */
  function sittingBreak(b) {
    const overlay = document.createElement("div");
    overlay.className = "book-reader sit-break";
    overlay.innerHTML = '<div class="sit-card"><div class="sit-pic" aria-hidden="true">&#127775;</div>' +
      '<h2 class="sit-h">Halfway there!</h2>' +
      "<p>This is a good place to stop for today. Your place is saved, so next time you start right here" +
      (b.minutes ? ", with about " + b.minutes + " minutes to go" : "") + ".</p>" +
      '<div class="bigbtns"><button type="button" class="big teal" data-b="stop">Stop for today</button>' +
      '<button type="button" class="big ghost" data-b="go">Keep going</button></div></div>';
    document.body.appendChild(overlay);
    const opener = document.activeElement;
    const m = modal(overlay, "Time for a break", () => { if (opener && opener.isConnected) opener.focus(); });
    const close = () => { overlay.remove(); m.release(); };
    overlay.querySelector('[data-b="go"]').addEventListener("click", close);
    overlay.querySelector('[data-b="stop"]').addEventListener("click", () => {
      close();
      location.href = (b.hub || "index.html") + location.search;
    });
    overlay.querySelector('[data-b="stop"]').focus();
    say("Halfway there! This is a good place to stop for today. Your place is saved.");
  }

  function modal(overlay, label, restore) {
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", label);
    overlay.setAttribute("tabindex", "-1");
    const focusables = () => [...overlay.querySelectorAll('button:not([disabled]), input, a[href], [tabindex="0"]')];
    function onTab(e) {
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) { e.preventDefault(); overlay.focus(); return; }
      const first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (!overlay.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onTab, true);
    let keep = null;
    return {
      remember() {
        const a = document.activeElement;
        keep = null;
        if (!a || !overlay.contains(a)) return;
        for (const k of ["data-tile", "data-line", "data-c", "data-k", "id"]) {
          const v = a.getAttribute(k);
          if (v != null) { keep = "[" + k + '="' + v.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"]'; break; }
        }
      },
      refocus() {
        let t = keep ? overlay.querySelector(keep) : null;
        if (t && t.disabled) t = keep.startsWith("[data-tile") ? overlay.querySelector("[data-tile]:not([disabled])") : null;
        /* in priority order: querySelector with a selector LIST returns the
           first match in the page, which is the title bar, not the question */
        for (const sel of [".gameprompt", ".gamebig", ".gloxq", ".book-reader-top .booktitle"]) { if (!t) t = overlay.querySelector(sel); }
        if (t) { if (!t.matches("button, input")) t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }
        else overlay.focus();
        keep = null;
      },
      release() {
        document.removeEventListener("keydown", onTab, true);
        try { if (restore) restore(); } catch (_) { /* the page may have moved on */ }
      },
    };
  }

  /* ---- the game zone: the lesson's own games, derived by the builder ----
     A shelf of cards; tap one to play it in a full-screen overlay, the
     shape the English build's Game Zone uses. Three mechanics, read off
     the round's own shape: choice (prompt, choices, answer, explanation),
     spelling (letter tiles from the answer plus two strays), pairs
     (reveal-and-match). Two games earn the sticker; the count says so. */
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
      const gk = games.indexOf(game);
      /* the shelf is redrawn on close, so focus goes back to this game's
         own Play button on the new shelf, not to the one that opened it */
      const m = modal(overlay, game.title, () => { const b = document.querySelector("#" + id + ' [data-game="' + gk + '"]'); if (b) b.focus(); });
      function close() { overlay.remove(); document.removeEventListener("keydown", onKey); try { VOICE.stop(); } catch (_) { /* nothing */ } drawShelf(); m.release(); }
      function onKey(e) { if (e.key === "Escape") close(); }
      document.addEventListener("keydown", onKey);

      function frame(bodyHtml, footHtml) {
        if (!overlay.isConnected) return;   /* a round timer that outlived the game */
        m.remember();
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
        m.refocus();
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

  /* ---- things to do at home: real projects, ticked when done ---- */
  function homeProjects(o) {
    const el = o.el;
    const items = o.items || [];
    const did = new Array(items.length).fill(false);
    const id = el.stage + "h";
    function paint() {
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="acts" id="' + id + '">' + items.map((it, k) =>
        '<div class="act' + (did[k] ? " did" : "") + '" data-k="' + k + '">' +
        '<div class="act-head"><span class="act-n">' + it.n + "</span><span class=\"act-kind\">project</span>" +
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

  /* ---- student resources: the drawer, not a step ----
     Words, the grade's word finder, the home projects (a jump), what the
     lesson teaches (for a grown-up, with the 0097 codes), the strands, and
     the hub. Ticked on first opening, for the reason the English drawer
     records: a drawer you have to finish is not a drawer. */
  function resources(o) {
    const el = o.el;
    const id = el.stage + "rs";
    const CARDS = [
      { id: "words", icon: "\u{1F524}", title: "Science words", blurb: "This lesson's words, what they mean, and a voice to hear them." },
      { id: "finder", icon: "\u{1F50E}", title: "Word finder", blurb: "Look up any science word from any lesson in " + (o.gradeLabel || "this grade") + "." },
      { id: "home", icon: "\u{1F3E0}", title: "Things to do at home", blurb: "This lesson's projects, to do with a grown-up." },
      { id: "teaches", icon: "\u{1F46A}", title: "For your grown-up", blurb: "What this lesson teaches, in the words of the Cambridge framework." },
      { id: "strands", icon: "\u{1F9EA}", title: "What science covers", blurb: "The six parts of primary science, and what each one is." },
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
      const opener = document.activeElement;
      const m = modal(overlay, title, () => { if (opener && opener.isConnected) opener.focus(); });
      const close = () => { try { VOICE.stop(); } catch (_) { /* nothing */ } overlay.remove(); document.removeEventListener("keydown", onKey); m.release(); };
      function onKey(e) { if (e.key === "Escape") close(); }
      document.addEventListener("keydown", onKey);
      overlay.querySelector(".book-close").addEventListener("click", close);
      overlay.addEventListener("click", (e) => { const b = e.target.closest("[data-say]"); if (b) say(b.dataset.say); });
      m.refocus();
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
        panel("Science words", '<div class="wordlist">' + wordRows(o.words || [], false) + "</div>",
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
          '<div class="teaches"><p class="lec-p">Lesson ' + o.lessonNo + " teaches these objectives of Cambridge Primary Science 0097. The code is the framework’s own.</p><ul class=\"ovw-list codes\">" +
          (o.teaches || []).map((t) => "<li><code>" + esc(t.code) + "</code> " + esc(t.text) + "</li>").join("") + "</ul></div>",
          '<span class="book-page-count">' + (o.teaches || []).length + " objectives</span>");
        return;
      }
      if (which === "strands") {
        panel("What science covers",
          '<div class="teaches">' + (o.strands || []).map((s) => '<section class="wordgroup"><h4>' + esc(s[0]) + "</h4><p class=\"lec-p\">" + esc(s[1]) + "</p></section>").join("") + "</div>",
          '<span class="book-page-count">' + (o.strands || []).length + " strands</span>");
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
