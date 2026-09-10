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
      if (s === 1) return '<svg viewBox="0 0 320 260" role="img" aria-label="The Sun rising"><rect width="320" height="200" fill="#F0A56B"/><circle cx="160" cy="200" r="46" fill="#F4C95D"/>' + ground + "</svg>";
      if (s === 2) return '<svg viewBox="0 0 320 260" role="img" aria-label="The Sun high in a blue sky"><rect width="320" height="200" fill="#BFE3F5"/><circle cx="250" cy="60" r="36" fill="#F4C95D"/>' + ground + "</svg>";
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
    box.innerHTML = '<svg viewBox="0 0 320 290" role="img" aria-label="Two plants in pots, ' + esc(opts.labelA) + ' and ' + esc(opts.labelB) + '"><rect width="320" height="290" fill="' + (opts.dark ? "#3A5C74" : "#BFE3F5") + '"/>' +
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
        box.innerHTML = '<svg viewBox="0 0 320 240" role="img" aria-label="A ball on a track marked in steps"><rect width="320" height="240" fill="#3E8E4A"/><rect x="0" y="180" width="320" height="60" fill="#8B5A2B"/>' +
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
      init(box) { box.innerHTML = '<svg viewBox="0 0 320 260" role="img" aria-label="A tank of water"><rect width="320" height="260" fill="#DDEFF7"/><rect x="30" y="60" width="260" height="180" rx="10" fill="#7FC4EA" opacity="0.85"/><rect x="30" y="60" width="260" height="180" rx="10" fill="none" stroke="#2B5673" stroke-width="5"/><text id="' + "fsitem" + '" x="160" y="40" text-anchor="middle" font-size="44" style="transition: y 1100ms ease-in"></text></svg>'; },
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
      init(box) { box.innerHTML = '<svg viewBox="0 0 320 200" role="img" aria-label="A magnet and a thing to test"><rect width="320" height="200" fill="#DDEFF7"/><rect x="0" y="150" width="320" height="50" fill="#C9B79C"/><g id="mg" style="transition: transform 900ms ease-in-out"><text x="30" y="118" font-size="60">\u{1F9F2}</text></g><text id="mi" x="230" y="140" text-anchor="middle" font-size="48" style="transition: transform 400ms ease-in"></text></svg>'; },
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
        '<div class="graph" role="img" aria-label="A block graph">' + cols.map((c, k) =>
          '<div class="gcol"><div class="gstack" style="height:' + (maxV * 26 + 6) + 'px">' + Array.from({ length: count[k] }, () => '<i class="gblock"></i>').join("") + "</div>" +
          '<button type="button" class="big small' + (count[k] >= c.value ? " ghost" : " teal") + '" data-k="' + k + '"' + (count[k] >= c.value ? " disabled" : "") + '>+ block</button>' +
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
      '<text x="70" y="150" font-size="40">\u{1F438}</text><text x="200" y="120" font-size="40">\u{1F986}</text><text x="130" y="185" font-size="34">\u{1F41F}</text><text x="250" y="180" font-size="34">\u{1FAB7}</text>',
      '<text x="60" y="170" font-size="44">\u{1F42A}</text><text x="200" y="160" font-size="40">\u{1F335}</text><text x="260" y="180" font-size="30">\u{1F98E}</text><text x="130" y="185" font-size="30">\u{1F982}</text>',
      '<text x="40" y="120" font-size="48">\u{1F333}</text><text x="220" y="120" font-size="48">\u{1F333}</text><text x="120" y="180" font-size="36">\u{1F98C}</text><text x="230" y="185" font-size="30">\u{1F344}</text><text x="170" y="100" font-size="26">\u{1F426}</text>',
      '<text x="60" y="170" font-size="44">\u{1F43B}‍❄️</text><text x="200" y="175" font-size="40">\u{1F427}</text><text x="130" y="110" font-size="30">❄️</text><text x="260" y="100" font-size="30">❄️</text>',
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
    if (c.steps) bits.push(c.steps + " steps");
    if (c.words) bits.push(c.words + " science words");
    if (c.games) bits.push(c.games + " games");
    if (c.home) bits.push(c.home + " things to do at home");
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
    finish(o.finish, o.done);
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
    finish(o.finish, o.done);
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
