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
  /* an emoji, or an inline SVG string, as stage-sized picture markup */
  const picHtml = (p, cls) => {
    if (!p) return "";
    const s = String(p).trim();
    return '<div class="' + (cls || "pic") + '" aria-hidden="true">' + (s.startsWith("<svg") ? s : esc(s)) + "</div>";
  };
  const small = (p) => { const s = String(p || "").trim(); return s.startsWith("<svg") ? s : esc(s); };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---- a step may speak only while it is the step on screen ------------
     Every renderer draws once, at load, because the deck paints all its
     slides and hides them with CSS. ONSHOW gives a step a line to say when
     the learner actually arrives; sayHere() refuses to speak for a slide
     that is not the one showing (the deck's own finish() keeps the same
     rule). show() is wrapped, not edited: it is lifted verbatim and the
     shared pipeline patches it by matching its exact text. */
  const ONSHOW = [];
  const showWithoutHooks = show;
  show = function (i, speak) {
    showWithoutHooks(i, speak);
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
      '<g data-part="roots"><path d="M160 252 q-8 30 -40 48 M160 252 q10 34 46 50 M160 252 q-2 40 -12 70 M160 256 q20 26 12 60" fill="none" stroke="#E9D9B8" stroke-width="7" stroke-linecap="round"/>' +
      '<path class="outline" d="M110 250 h100 v72 h-100z" rx="12"/></g>' +
      '<g data-part="stem"><rect x="153" y="118" width="14" height="136" rx="7" fill="#2F8F45"/><rect class="outline" x="146" y="112" width="28" height="146" rx="12"/></g>' +
      '<g data-part="leaves"><path d="M158 200 q-70 -40 -78 -90 q60 6 78 90z" fill="#4CB65C"/><path d="M162 170 q70 -34 80 -80 q-62 4 -80 80z" fill="#4CB65C"/>' +
      '<path d="M158 200 q-40 -40 -60 -70" fill="none" stroke="#2F8F45" stroke-width="3"/><path d="M162 170 q40 -34 60 -58" fill="none" stroke="#2F8F45" stroke-width="3"/>' +
      '<path class="outline" d="M74 100 h174 v106 h-174z"/></g>' +
      '<g data-part="flower"><g fill="#F2A7C4">' +
      '<ellipse cx="160" cy="60" rx="20" ry="30"/><ellipse cx="160" cy="130" rx="20" ry="30"/><ellipse cx="125" cy="95" rx="30" ry="20"/><ellipse cx="195" cy="95" rx="30" ry="20"/>' +
      '<ellipse cx="135" cy="70" rx="24" ry="24"/><ellipse cx="185" cy="70" rx="24" ry="24"/><ellipse cx="135" cy="120" rx="24" ry="24"/><ellipse cx="185" cy="120" rx="24" ry="24"/></g>' +
      '<circle cx="160" cy="95" r="22" fill="#F4C95D"/><circle class="outline" cx="160" cy="95" r="70"/></g>' +
      "</svg>"),
    body: () => (
      '<svg viewBox="0 0 260 400" role="img" aria-label="A child standing">' +
      '<g data-part="head"><circle cx="130" cy="62" r="46" fill="#C68642"/><circle class="outline" cx="130" cy="62" r="52"/></g>' +
      '<path d="M84 50 q46 -40 92 0 q-4 -30 -46 -34 q-42 4 -46 34z" fill="#2B1B10"/>' +
      '<g data-part="eyes"><circle cx="113" cy="62" r="6" fill="#fff"/><circle cx="147" cy="62" r="6" fill="#fff"/><circle cx="114" cy="63" r="3" fill="#1B1B1B"/><circle cx="148" cy="63" r="3" fill="#1B1B1B"/><rect class="outline" x="100" y="50" width="60" height="24" rx="12"/></g>' +
      '<g data-part="ears"><ellipse cx="84" cy="66" rx="7" ry="11" fill="#B5763A"/><ellipse cx="176" cy="66" rx="7" ry="11" fill="#B5763A"/><path class="outline" d="M72 50 h24 v32 h-24z M164 50 h24 v32 h-24z"/></g>' +
      '<g data-part="nose"><path d="M130 66 l-6 14 h12z" fill="#A9642E"/><circle class="outline" cx="130" cy="74" r="12"/></g>' +
      '<g data-part="mouth"><path d="M114 90 q16 14 32 0" fill="none" stroke="#7A2E2E" stroke-width="4" stroke-linecap="round"/><rect class="outline" x="106" y="80" width="48" height="22" rx="11"/></g>' +
      '<rect x="120" y="106" width="20" height="14" fill="#C68642"/>' +
      '<g data-part="tummy"><rect x="82" y="118" width="96" height="112" rx="26" fill="#35BFB2"/><rect class="outline" x="76" y="112" width="108" height="124" rx="30"/></g>' +
      '<g data-part="arms"><path d="M84 132 q-40 30 -36 96" fill="none" stroke="#C68642" stroke-width="22" stroke-linecap="round"/><path d="M176 132 q40 30 36 96" fill="none" stroke="#C68642" stroke-width="22" stroke-linecap="round"/>' +
      '<path class="outline" d="M30 120 h56 v100 h-56z M174 120 h56 v100 h-56z"/></g>' +
      '<g data-part="hands"><circle cx="48" cy="238" r="15" fill="#C68642"/><circle cx="212" cy="238" r="15" fill="#C68642"/><path class="outline" d="M28 218 h40 v40 h-40z M192 218 h40 v40 h-40z"/></g>' +
      '<g data-part="legs"><rect x="94" y="228" width="30" height="110" rx="14" fill="#2B5673"/><rect x="136" y="228" width="30" height="110" rx="14" fill="#2B5673"/><rect class="outline" x="88" y="230" width="84" height="106" rx="16"/></g>' +
      '<g data-part="feet"><rect x="86" y="332" width="44" height="22" rx="10" fill="#F4C95D"/><rect x="130" y="332" width="44" height="22" rx="10" fill="#F4C95D"/><rect class="outline" x="80" y="326" width="100" height="34" rx="14"/></g>' +
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
      if (s === 0) return '<svg viewBox="0 0 320 260"><rect width="320" height="200" fill="#0B1D2C"/>' + stars + ground + "</svg>";
      if (s === 1) return '<svg viewBox="0 0 320 260"><rect width="320" height="200" fill="#F0A56B"/><circle cx="160" cy="200" r="46" fill="#F4C95D"/>' + ground + "</svg>";
      if (s === 2) return '<svg viewBox="0 0 320 260"><rect width="320" height="200" fill="#BFE3F5"/><circle cx="250" cy="60" r="36" fill="#F4C95D"/>' + ground + "</svg>";
      return '<svg viewBox="0 0 320 260"><rect width="320" height="260" fill="#0B1D2C"/>' + stars +
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
  function potSvg(x, state, label, dark) {
    /* state 0..4: 0 fresh, higher = worse (droop / pale). dark draws the cupboard */
    const droop = state * 9, pale = state > 2 ? "#C9C46A" : state > 0 ? "#8FBF6C" : "#4CB65C";
    const leafA = 'M' + (x) + ' 150 q-40 -18 -46 -52 q36 4 46 52z', leafB = 'M' + (x) + ' 128 q40 -16 46 -46 q-36 2 -46 46z';
    return '<g>' + (dark ? '<rect x="' + (x - 78) + '" y="20" width="156" height="200" fill="#1B1B1B" opacity="0.72" rx="8"/>' : "") +
      '<path d="M' + (x - 44) + ' 190 h88 l-10 60 h-68z" fill="#C76B3B"/>' +
      '<rect x="' + (x - 48) + '" y="182" width="96" height="14" rx="4" fill="#A9552B"/>' +
      '<g transform="rotate(' + droop + ' ' + x + ' 190)"><rect x="' + (x - 5) + '" y="90" width="10" height="100" rx="5" fill="' + (state > 2 ? "#A9A05A" : "#2F8F45") + '"/>' +
      '<g transform="rotate(' + (droop * 2) + ' ' + x + ' 150)"><path d="' + leafA + '" fill="' + pale + '"/></g>' +
      '<g transform="rotate(' + (-droop * 2) + ' ' + x + ' 128)"><path d="' + leafB + '" fill="' + pale + '"/></g></g>' +
      '<text x="' + x + '" y="272" text-anchor="middle" font-size="15" font-family="Inter, sans-serif" font-weight="800" fill="#fff">' + esc(label) + "</text></g>";
  }
  function twoPots(box, a, b, day, opts) {
    box.innerHTML = '<svg viewBox="0 0 320 290"><rect width="320" height="290" fill="' + (opts.dark ? "#3A5C74" : "#BFE3F5") + '"/>' +
      (opts.sun ? '<circle cx="280" cy="40" r="24" fill="#F4C95D"/>' : "") +
      '<rect x="0" y="250" width="320" height="40" fill="#8B5A2B"/>' +
      potSvg(90, a, opts.labelA, opts.darkA) + potSvg(230, b, opts.labelB, opts.darkB) +
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
      draw(box, x, label) {
        let marks = "";
        for (let i = 0; i <= 10; i++) marks += '<line x1="' + (30 + i * 26) + '" y1="196" x2="' + (30 + i * 26) + '" y2="210" stroke="#fff" stroke-width="2"/><text x="' + (30 + i * 26) + '" y="228" text-anchor="middle" fill="#fff" font-size="11" font-family="Inter, sans-serif" font-weight="800">' + i + "</text>";
        box.innerHTML = '<svg viewBox="0 0 320 240"><rect width="320" height="240" fill="#3E8E4A"/><rect x="0" y="180" width="320" height="60" fill="#8B5A2B"/>' +
          '<rect x="20" y="196" width="280" height="4" fill="#fff"/>' + marks +
          '<text x="12" y="30" font-size="16" font-family="Inter, sans-serif" font-weight="800" fill="#fff">' + esc(label || "") + "</text>" +
          '<text x="' + (30 + x * 26) + '" y="176" text-anchor="middle" font-size="44" style="transition: x 900ms ease-out">⚽</text>' +
          '<text x="14" y="176" font-size="40">\u{1F9D2}</text></svg>';
      },
      init(box) { SIMS.pushBall.draw(box, 0, "steps along the track"); },
      run(box, api) {
        return new Promise((done) => {
          let gentle = false, hard = false;
          api.controls.innerHTML = '<button type="button" class="big small ghost" id="' + api.id + 'g">Push gently</button><button type="button" class="big small" id="' + api.id + 'h">Push HARD</button>';
          const roll = (to, msg) => {
            SIMS.pushBall.draw(box, 0, "");
            SOUND.play("thud", 0.4);
            setTimeout(() => {
              const b = box.querySelectorAll("text")[box.querySelectorAll("text").length - 2];
              if (b) b.setAttribute("x", 30 + to * 26);
              const lab = box.querySelector("text"); if (lab) lab.textContent = "It rolled " + to + " steps";
            }, 40);
            api.say(msg);
            if (gentle && hard) setTimeout(() => { api.controls.innerHTML = ""; done(); }, 1200);
          };
          $(api.id + "g").addEventListener("click", () => { gentle = true; roll(3, "A gentle push. The ball rolled three steps and stopped."); });
          $(api.id + "h").addEventListener("click", () => { hard = true; roll(9, "A hard push! The ball rolled nine steps. A bigger push, a bigger move."); });
        });
      },
    },
    /* a tank of water; act(item) drops it in and it floats or sinks */
    floatSink: {
      init(box) { box.innerHTML = '<svg viewBox="0 0 320 260"><rect width="320" height="260" fill="#DDEFF7"/><rect x="30" y="60" width="260" height="180" rx="10" fill="#7FC4EA" opacity="0.85"/><rect x="30" y="60" width="260" height="180" rx="10" fill="none" stroke="#2B5673" stroke-width="5"/><text id="' + "fsitem" + '" x="160" y="40" text-anchor="middle" font-size="44" style="transition: y 1100ms ease-in"></text></svg>'; },
      act(box, item, api) {
        const t = box.querySelector("text");
        t.textContent = item.pic; t.setAttribute("y", 40);
        /* A short timer, NOT a paint callback: requestAnimationFrame never
           fires in a hidden tab, so a drop started just before a tab switch
           would never resolve and the step would freeze. A timer is throttled
           there but still fires. 40ms is enough for the start position to be
           painted so the transition runs from it. */
        return new Promise((r) => {
          setTimeout(() => {
            SOUND.play("splash", 0.6);
            t.setAttribute("y", item.answer === "float" ? 96 : 228);
            setTimeout(() => { api.say(item.answer === "float" ? "The " + item.label + " floats. It stays on top of the water." : "The " + item.label + " sinks. It goes down to the bottom."); r(); }, 1150);
          }, 40);
        });
      },
    },
    /* a magnet approaches an item; a magnetic one jumps to it */
    magnet: {
      init(box) { box.innerHTML = '<svg viewBox="0 0 320 200"><rect width="320" height="200" fill="#DDEFF7"/><rect x="0" y="150" width="320" height="50" fill="#C9B79C"/><g id="mg" style="transition: transform 900ms ease-in-out"><text x="30" y="118" font-size="60">\u{1F9F2}</text></g><text id="mi" x="230" y="140" text-anchor="middle" font-size="48" style="transition: transform 400ms ease-in"></text></svg>'; },
      act(box, item, api) {
        const mg = box.querySelector("#mg"), it = box.querySelector("#mi");
        it.textContent = item.pic; it.style.transform = ""; mg.style.transform = "";
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
        box.innerHTML = '<svg viewBox="0 0 320 200"><rect width="320" height="200" fill="#BFE3F5"/><rect x="0" y="150" width="320" height="50" fill="#3E8E4A"/>' +
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
        { id: "stone", pic: "\u{1FAA8}", label: "a stone", changes: false, says: { squash: "Nothing happened. The stone did not change.", bend: "It will not bend.", twist: "It will not twist.", stretch: "It will not stretch. The stone keeps its shape." } },
      ],
      draw(box, item, anim) {
        const tf = { squash: "scale(1.6, 0.45)", bend: "rotate(-30deg) skewX(20deg)", twist: "rotate(180deg) scaleX(0.6)", stretch: "scale(2.1, 0.8)" }[anim] || "";
        box.innerHTML = '<div style="display:grid;place-items:center;height:200px;font-size:90px"><span style="display:inline-block;transition:transform 500ms ease;transform:' + (item.changes ? tf : "") + '">' + item.pic + "</span></div>" +
          '<div class="tag">' + esc(item.label) + "</div>";
      },
      init(box) { SIMS.shapeChange.draw(box, SIMS.shapeChange.items[0], ""); },
      run(box, api) {
        return new Promise((done) => {
          let k = 0; let did = new Set(); let handing = false;
          const items = SIMS.shapeChange.items;
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
        box.innerHTML = '<svg viewBox="0 0 320 240"><rect width="320" height="240" fill="#BFE3F5"/><circle cx="60" cy="40" r="26" fill="#F4C95D"/>' +
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
    const api = { id: el.stage, controls: ctl, say: (t) => sayHere(o.finish, t) };
    sim.init(box);
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
          ? (ok ? "Yes! Your prediction was right. " : "Look back: your prediction WAS what happened. ") + "Well done."
          : (ok ? "That is right, it did not match. " : "Look back: you predicted " + predicted.t + ", and something different happened. ") + "That is fine. Scientists learn most when they are surprised.";
        $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = line; say(line);
        phase = "done";
        reportScore(o.finish, score, 2);
        setTimeout(() => { $(el.ch).innerHTML = ""; $(el.score).textContent = ""; $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }, 3200);
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
          const line = ob.label[0].toUpperCase() + ob.label.slice(1) + " is " + ob.units + " " + o.unit.name + " long.";
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
    let picked = false, lock = false;
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
        $(el.ask).innerHTML = o.findOut.ask; $(el.score).textContent = "How could we find the answer?";
        $(el.ch).classList.add("stack");
        $(el.ch).innerHTML = shuffle(o.findOut.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      }, 3200);
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const ok = b.dataset.ok === "1";
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = (ok ? cheer() + " " : "") + o.findOut.why; say($(el.fb).textContent);
      reportScore(o.finish, ok ? 1 : 0, 1);
      setTimeout(() => { $(el.ch).innerHTML = ""; $(el.score).textContent = ""; $(el.fb).className = "fb good"; $(el.fb).textContent = o.done; finish(o.finish, o.done); }, 2600);
    });
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
