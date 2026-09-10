  /* ==================================================================
     THE COMPUTING ACTIVITIES

     The Mathematics build's own rounds are one function per idea, each
     drawing into one slide's ids and calling finish(i) when the child has
     done the thing. These are the same shape, and there are eighteen of
     them rather than one generic renderer for the reason there are eleven
     in Science: a step is a KIND of doing, and a renderer that covers
     every kind covers none of them well.

     What is computing-shaped about them is that the child DRIVES a
     machine that only does what it is told. Robo on the grid goes where
     the program says and nowhere else (1CT.03); the block program runs
     exactly the blocks that were placed, so a wrong result is the
     child's own program to read (1P.05, 1P.06); the algorithm steps
     paint the scene in the order they were tapped, so shoes before socks
     draws socks OVER shoes (1CT.06). Nothing here marks a child's
     intention; it runs what they built and shows what happened, which is
     what a computer does.

     Sound is synthesised, not recorded, exactly as in Science. The voice
     engine speaks everything else, exactly as in Mathematics.
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
  /* one multiple-choice question drawn into the slide's own choices row;
     used by half the renderers for the question that ends a step */
  function askOnce(o, spec, onDone) {
    const el = o.el;
    let lock = false;
    $(el.ask).innerHTML = spec.ask;
    $(el.ch).className = "choices stack";
    $(el.ch).innerHTML = shuffle(spec.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
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

  /* ==================================================================
     SOUND - a very small synthesiser, the Science kit's own with a
     computing bank: a beep for a robot step, a buzz for a bump, a
     fanfare for a program that ran right. The context is created on
     the first tap, because browsers refuse audio that nobody asked for.
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
      type: (c, t, m) => { noise(c, t, 0.02, 0.45, m, 3200); },
      pop: (c, t, m) => { osc(c, "sine", 600, 900, t, 0.09, 0.4, m); },
      ding: (c, t, m) => { osc(c, "sine", 1046, 0, t, 0.6, 0.35, m); },
      beep: (c, t, m) => { osc(c, "sine", 880, 0, t, 0.12, 0.35, m); },
      robot: (c, t, m) => { osc(c, "square", 330, 440, t, 0.12, 0.18, m); osc(c, "square", 440, 550, t + 0.14, 0.12, 0.18, m); },
      boing: (c, t, m) => { osc(c, "sine", 200, 500, t, 0.3, 0.4, m); },
      thud: (c, t, m) => { osc(c, "sine", 90, 40, t, 0.25, 0.7, m); },
      buzz: (c, t, m) => { osc(c, "sawtooth", 110, 95, t, 0.7, 0.35, m); },
      error: (c, t, m) => { osc(c, "sawtooth", 220, 120, t, 0.35, 0.3, m); },
      tada: (c, t, m) => { osc(c, "sine", 523, 0, t, 0.25, 0.35, m); osc(c, "sine", 659, 0, t + 0.16, 0.25, 0.35, m); osc(c, "sine", 784, 0, t + 0.32, 0.5, 0.4, m); },
      send: (c, t, m) => { osc(c, "sine", 500, 1300, t, 0.3, 0.3, m); },
      ring: (c, t, m) => { osc(c, "sine", 880, 0, t, 1.0, 0.4, m); osc(c, "sine", 1320, 0, t, 0.7, 0.2, m); },
      print: (c, t, m) => { for (let k = 0; k < 4; k++) noise(c, t + k * 0.11, 0.06, 0.35, m, 1200); },
      whoosh: (c, t, m) => { noise(c, t, 0.3, 0.3, m); },
      bell: (c, t, m) => { osc(c, "sine", 880, 0, t, 1.4, 0.5, m); osc(c, "sine", 1320, 0, t, 1.0, 0.25, m); },
      splash: (c, t, m) => { noise(c, t, 0.25, 0.5, m); osc(c, "sine", 400, 150, t, 0.25, 0.2, m); },
      hum: (c, t, m) => { osc(c, "sine", 60, 0, t, 1.0, 0.4, m); osc(c, "sine", 120, 0, t, 1.0, 0.1, m); },
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
     SCENES - the everyday tasks the algorithms are about, drawn from the
     LIST OF STEP IDS DONE SO FAR, IN THE ORDER THEY WERE DONE. That order
     is the whole point of half of Stage 1: every scene paints later ids
     over earlier ones, so "shoes" then "socks" draws socks outside the
     shoes, and "top" before "jam" puts the jam on top of the sandwich.
     A demo passes a list too (frame.scene.state).
     ================================================================== */
  const T = (x, y, size, glyph) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + size + '">' + glyph + "</text>";
  const LABEL = (x, y, t) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="#fff" font-size="15" font-family="Inter, sans-serif" font-weight="800">' + esc(t) + "</text>";
  const SCENES = {
    /* a child getting dressed: socks, shoes, coat, hat - painted in the order given */
    dress: (ids) => {
      ids = ids || [];
      let g = '<rect width="320" height="300" fill="#BFE3F5"/><rect x="0" y="262" width="320" height="38" fill="#3E8E4A"/>' +
        '<circle cx="160" cy="62" r="34" fill="#C68642"/><path d="M126 52 q34 -34 68 0 q-4 -24 -34 -26 q-30 2 -34 26z" fill="#2B1B10"/>' +
        '<circle cx="148" cy="60" r="4" fill="#1B1B1B"/><circle cx="172" cy="60" r="4" fill="#1B1B1B"/><path d="M148 78 q12 10 24 0" fill="none" stroke="#7A2E2E" stroke-width="3" stroke-linecap="round"/>' +
        '<rect x="122" y="98" width="76" height="90" rx="20" fill="#35BFB2"/>' +
        '<path d="M124 110 q-30 26 -26 76" fill="none" stroke="#C68642" stroke-width="16" stroke-linecap="round"/><path d="M196 110 q30 26 26 76" fill="none" stroke="#C68642" stroke-width="16" stroke-linecap="round"/>' +
        '<rect x="130" y="186" width="24" height="72" rx="10" fill="#2B5673"/><rect x="166" y="186" width="24" height="72" rx="10" fill="#2B5673"/>';
      const layer = {
        socks: '<rect x="128" y="236" width="28" height="22" rx="6" fill="#F4C95D"/><rect x="164" y="236" width="28" height="22" rx="6" fill="#F4C95D"/>',
        shoes: '<rect x="120" y="248" width="40" height="18" rx="9" fill="#7A2E2E"/><rect x="160" y="248" width="40" height="18" rx="9" fill="#7A2E2E"/>',
        coat: '<rect x="112" y="94" width="96" height="104" rx="22" fill="#E9744F"/><rect x="156" y="94" width="8" height="104" fill="#C2482C"/>',
        hat: '<path d="M118 40 q42 -40 84 0 v10 h-84z" fill="#B78BD1"/><rect x="110" y="46" width="100" height="10" rx="5" fill="#8E5AA8"/>',
        scarf: '<rect x="128" y="92" width="64" height="16" rx="8" fill="#F0806F"/>',
      };
      ids.forEach((id) => { g += layer[id] || ""; });
      const silly = ids.indexOf("shoes") >= 0 && ids.indexOf("socks") >= 0 && ids.indexOf("shoes") < ids.indexOf("socks");
      return '<svg viewBox="0 0 320 300" role="img" aria-label="A child getting dressed' + (silly ? ", with socks over the shoes" : "") + '">' + g +
        (silly ? LABEL(160, 292, "socks on the OUTSIDE of the shoes!") : "") + "</svg>";
    },
    /* a sandwich built layer by layer; a filling after the top slice lands on top */
    sandwich: (ids) => {
      ids = ids || [];
      let g = '<rect width="320" height="240" fill="#F4EAD4"/><ellipse cx="160" cy="200" rx="130" ry="26" fill="#fff" stroke="#D6E3DE" stroke-width="4"/>';
      const fills = { butter: "#F4C95D", jam: "#C4453A", cheese: "#F2B233", banana: "#F7E9A0", honey: "#E9A23B", milk: "#EAF4FA", ketchup: "#D33A2C" };
      let y = 196, n = 0;
      const names = { bread: "bread", top: "top slice", butter: "butter", jam: "jam", cheese: "cheese", banana: "banana", honey: "honey", milk: "milk", ketchup: "ketchup" };
      ids.forEach((id) => {
        if (id === "bread" || id === "top") { y -= 22; g += '<rect x="70" y="' + y + '" width="180" height="24" rx="8" fill="#D9A15A" stroke="#A9552B" stroke-width="3"/>'; }
        else if (fills[id]) { y -= 12; g += '<rect x="76" y="' + y + '" width="168" height="14" rx="6" fill="' + fills[id] + '"/>'; }
        else if (id === "cut") { g += '<line x1="160" y1="' + (y - 6) + '" x2="160" y2="200" stroke="#1B1B1B" stroke-width="3" stroke-dasharray="6 5"/>'; }
        else if (id === "eat") { g += T(270, 60, 44, "\u{1F60B}"); }
        n++;
      });
      const topAt = ids.indexOf("top");
      const silly = topAt >= 0 && ids.slice(topAt + 1).some((id) => fills[id]);
      return '<svg viewBox="0 0 320 240" role="img" aria-label="A sandwich being made: ' + (ids.map((i) => names[i] || i).join(", ") || "an empty plate") + '">' + g +
        (silly ? LABEL(160, 30, "the filling is on TOP of the sandwich!") : "") + "</svg>";
    },
    /* brushing teeth: paste on the brush, brushing (foam), rinse, a sparkle */
    teeth: (ids) => {
      ids = ids || [];
      const has = (id) => ids.includes(id);
      let g = '<rect width="320" height="240" fill="#DDEFF7"/>' +
        '<circle cx="120" cy="110" r="70" fill="#C68642"/><circle cx="100" cy="96" r="6" fill="#1B1B1B"/><circle cx="140" cy="96" r="6" fill="#1B1B1B"/>' +
        '<path d="M86 134 q34 30 68 0 v14 q-34 26 -68 0z" fill="#7A2E2E"/><rect x="92" y="136" width="56" height="10" rx="3" fill="' + (has("brush") ? "#FFFDF6" : "#E8D9A8") + '"/>';
      if (has("paste") || has("brush")) g += '<rect x="200" y="60" width="16" height="120" rx="6" fill="#35BFB2" transform="rotate(20 208 120)"/><rect x="196" y="56" width="24" height="26" rx="6" fill="#fff" transform="rotate(20 208 120)"/>';
      if (has("paste") && !has("brush")) g += '<ellipse cx="203" cy="66" rx="10" ry="6" fill="#6E9DE8"/>';
      if (has("brush")) g += '<g fill="#fff" opacity="0.9"><circle cx="150" cy="120" r="12"/><circle cx="168" cy="132" r="9"/><circle cx="140" cy="140" r="8"/></g>';
      if (has("rinse")) g += T(260, 200, 44, "\u{1F964}") + '<g fill="#fff" opacity="0.9"><circle cx="150" cy="120" r="0"/></g>';
      if (has("spit") || has("rinse")) g = g.replace('<g fill="#fff" opacity="0.9"><circle cx="150" cy="120" r="12"/><circle cx="168" cy="132" r="9"/><circle cx="140" cy="140" r="8"/></g>', "");
      if (has("rinse") && has("brush")) g += T(120, 60, 30, "✨");
      return '<svg viewBox="0 0 320 240" role="img" aria-label="Brushing teeth: ' + (ids.join(", ") || "not started") + '">' + g + "</svg>";
    },
    /* washing hands: tap, soap, rub, rinse, dry */
    handwash: (ids) => {
      ids = ids || [];
      const has = (id) => ids.includes(id);
      let g = '<rect width="320" height="240" fill="#DDEFF7"/><rect x="40" y="150" width="240" height="70" rx="16" fill="#fff" stroke="#93AABE" stroke-width="4"/>' +
        '<path d="M160 60 v40 h36" fill="none" stroke="#93AABE" stroke-width="12" stroke-linecap="round"/><circle cx="160" cy="56" r="12" fill="#93AABE"/>';
      if (has("tap") && !has("dry")) g += '<rect x="190" y="104" width="10" height="46" rx="5" fill="#6E9DE8" opacity="0.8"/>';
      g += T(150, 170, 44, "\u{1F450}");
      if (has("soap") && !has("rinse")) g += T(210, 130, 30, "\u{1F9FC}") + '<g fill="#fff" opacity="0.95"><circle cx="130" cy="140" r="9"/><circle cx="170" cy="130" r="7"/><circle cx="150" cy="120" r="6"/></g>';
      if (has("rub") && !has("rinse")) g += '<g fill="#fff" opacity="0.95"><circle cx="120" cy="155" r="10"/><circle cx="185" cy="150" r="10"/><circle cx="155" cy="112" r="8"/><circle cx="110" cy="130" r="6"/></g>';
      if (has("rinse") && has("tap")) g += '<g fill="#6E9DE8" opacity="0.7"><circle cx="140" cy="185" r="5"/><circle cx="165" cy="190" r="4"/></g>';
      if (has("dry")) g += T(270, 110, 40, "\u{1F9FB}") + T(120, 60, 30, "✨");
      return '<svg viewBox="0 0 320 240" role="img" aria-label="Washing hands: ' + (ids.join(", ") || "not started") + '">' + g + "</svg>";
    },
    /* a brick tower: every id is a brick, stacked in the order given; a flag on top */
    tower: (ids) => {
      ids = ids || [];
      const size = { big: [150, 40], middle: [110, 36], small: [70, 32], flag: [0, 0] };
      const colour = { big: "#E9744F", middle: "#35BFB2", small: "#F4C95D", red: "#E9744F", blue: "#6E9DE8", yellow: "#F4C95D", green: "#4FD1A0", purple: "#B78BD1" };
      let g = '<rect width="320" height="260" fill="#BFE3F5"/><rect x="0" y="222" width="320" height="38" fill="#3E8E4A"/>';
      let y = 222;
      ids.forEach((id) => {
        if (id === "flag") { g += '<rect x="158" y="' + (y - 50) + '" width="4" height="50" fill="#fff"/><path d="M162 ' + (y - 50) + ' l40 10 l-40 10z" fill="#E9744F"/>'; return; }
        const [w, h] = size[id] || [100, 34];
        y -= h;
        g += '<rect x="' + (160 - w / 2) + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + (colour[id] || "#93AABE") + '" stroke="#0B1D2C" stroke-width="2"/>';
      });
      return '<svg viewBox="0 0 320 260" role="img" aria-label="A brick tower ' + ids.length + ' pieces high">' + g + "</svg>";
    },
    /* planting a seed: pot, soil, seed, water, sun - a sprout when it has all it needs */
    plant: (ids) => {
      ids = ids || [];
      const has = (id) => ids.includes(id);
      let g = '<rect width="320" height="240" fill="#BFE3F5"/><rect x="0" y="210" width="320" height="30" fill="#3E8E4A"/>';
      if (has("sun")) g += '<circle cx="270" cy="44" r="26" fill="#F4C95D"/>';
      if (has("pot")) g += '<path d="M110 130 h100 l-12 80 h-76z" fill="#C76B3B"/><rect x="104" y="122" width="112" height="14" rx="4" fill="#A9552B"/>';
      if (has("soil") && has("pot")) g += '<path d="M116 136 h88 l-4 30 h-80z" fill="#6B4A2B"/>';
      if (has("seed")) g += '<ellipse cx="160" cy="' + (has("soil") ? 150 : 200) + '" rx="8" ry="5" fill="#C7A76B"/>';
      if (has("water")) g += T(230, 110, 34, "\u{1F4A7}");
      if (has("pot") && has("soil") && has("seed") && has("water")) g += '<rect x="157" y="90" width="6" height="46" rx="3" fill="#2F8F45"/><path d="M160 108 q-30 -14 -34 -40 q28 4 34 40z" fill="#4CB65C"/><path d="M160 100 q30 -14 34 -38 q-28 2 -34 38z" fill="#4CB65C"/>';
      return '<svg viewBox="0 0 320 240" role="img" aria-label="Planting a seed: ' + (ids.join(", ") || "nothing yet") + '">' + g + "</svg>";
    },
    /* feeding the cat: open the tin, food in the bowl, bowl on the floor, call the cat */
    catfeed: (ids) => {
      ids = ids || [];
      const has = (id) => ids.includes(id);
      let g = '<rect width="320" height="240" fill="#F4EAD4"/><rect x="0" y="180" width="320" height="60" fill="#C9B79C"/>';
      if (has("tin")) g += T(60, 120, 40, "\u{1F96B}");
      if (has("food")) g += '<ellipse cx="180" cy="' + (has("floor") ? 190 : 120) + '" rx="40" ry="14" fill="#93AABE"/><ellipse cx="180" cy="' + (has("floor") ? 184 : 114) + '" rx="26" ry="8" fill="#A9552B"/>';
      else if (has("floor")) g += '<ellipse cx="180" cy="190" rx="40" ry="14" fill="#93AABE"/>';
      if (has("call")) g += T(260, 175, 44, "\u{1F431}") + (has("food") && has("floor") ? T(230, 130, 22, "❤️") : "");
      return '<svg viewBox="0 0 320 240" role="img" aria-label="Feeding the cat: ' + (ids.join(", ") || "nothing yet") + '">' + g + "</svg>";
    },
    /* the internet: 0 one computer, 1 two joined, 2 many around the world, 3 a message hopping */
    internet: (s) => {
      s = Number(s) || 0;
      const pts = [[60, 70], [250, 60], [80, 160], [240, 170], [160, 40], [160, 190], [30, 120], [290, 120]];
      let g = '<rect width="320" height="220" fill="#0B1D2C"/>';
      if (s >= 2) g += '<circle cx="160" cy="112" r="96" fill="#3B7FD1" opacity="0.5"/><path d="M110 70 q30 -20 50 0 q-10 30 -40 30z M190 130 q30 -10 40 20 q-30 20 -40 -20z M90 130 q20 0 20 30 q-20 10 -20 -30z" fill="#4CB65C" opacity="0.7"/>';
      const links = s === 1 ? [[0, 1]] : s >= 2 ? [[0, 1], [0, 2], [1, 3], [2, 3], [4, 1], [5, 3], [6, 0], [7, 1], [4, 0], [5, 2]] : [];
      links.forEach(([a, b]) => { g += '<line x1="' + pts[a][0] + '" y1="' + pts[a][1] + '" x2="' + pts[b][0] + '" y2="' + pts[b][1] + '" stroke="#F4C95D" stroke-width="' + (s === 3 && a === 0 ? 4 : 2) + '" opacity="0.8"/>'; });
      const n = s === 0 ? 1 : s === 1 ? 2 : pts.length;
      for (let k = 0; k < n; k++) g += T(pts[k][0], pts[k][1] + 12, 30, k % 3 === 0 ? "\u{1F4BB}" : k % 3 === 1 ? "\u{1F5A5}️" : "\u{1F4F1}");
      if (s === 3) g += T(165, 100, 30, "✉️");
      const label = ["One computer, on its own", "Two computers, joined: a network", "Many computers, joined around the world: the internet", "A message crosses the world in a second"][s];
      return '<svg viewBox="0 0 320 220" role="img" aria-label="' + label + '">' + g + LABEL(160, 212, label) + "</svg>";
    },
  };

  /* ==================================================================
     THE SPRITE STAGE and the BLOCKS - what "a program" means here.
     A block is one instruction the sprite can carry out. The stage is an
     HTML strip: the sprite sits at a position and a transform, and every
     block is a small change to those, run on a timer so a program of
     four blocks is four visible moves. Nothing waits on a paint callback.
     ================================================================== */
  const BLOCKS = {
    right: { label: "move right", icon: "➡️", cat: "move" },
    left: { label: "move left", icon: "⬅️", cat: "move" },
    jump: { label: "jump", icon: "⬆️", cat: "move" },
    spin: { label: "spin", icon: "\u{1F504}", cat: "move" },
    say: { label: "say hello", icon: "\u{1F4AC}", cat: "look" },
    grow: { label: "grow", icon: "\u{1F53C}", cat: "look" },
    shrink: { label: "shrink", icon: "\u{1F53D}", cat: "look" },
    hide: { label: "hide", icon: "\u{1F648}", cat: "look" },
    home: { label: "go home", icon: "\u{1F3E0}", cat: "control" },
    wait: { label: "wait", icon: "⏳", cat: "control" },
  };
  function blockHtml(id, extra) {
    const b = BLOCKS[id] || { label: id, icon: "?", cat: "control" };
    return '<span class="block ' + b.cat + (extra || "") + '"><span class="bicon" aria-hidden="true">' + b.icon + "</span>" + esc(b.label) + "</span>";
  }
  function blockBtn(id, attr) {
    const b = BLOCKS[id] || { label: id, icon: "?", cat: "control" };
    return '<button type="button" class="block ' + b.cat + '" ' + (attr || "") + '><span class="bicon" aria-hidden="true">' + b.icon + "</span>" + esc(b.label) + "</button>";
  }
  function spriteStage(box, sprite) {
    box.className = "spritestage";
    box.innerHTML = '<div class="spriteground"></div><div class="sprite" id="' + box.id + 'sp">' + esc(sprite) + '</div><div class="bubble" id="' + box.id + 'bb" hidden></div>';
    const st = { x: 0, scale: 1, spin: 0, hidden: false };
    const sp = $(box.id + "sp"), bb = $(box.id + "bb");
    function paint(jump) {
      sp.style.transform = "translateX(" + (st.x * 64) + "px) translateY(" + (jump ? -70 : 0) + "px) rotate(" + st.spin + "deg) scale(" + st.scale + ")";
      sp.style.opacity = st.hidden ? "0.15" : "1";
    }
    function reset() { st.x = 0; st.scale = 1; st.spin = 0; st.hidden = false; bb.hidden = true; paint(false); }
    /* run one block; resolves when its move is over */
    function run(id) {
      return new Promise((r) => {
        bb.hidden = true;
        if (id === "right") { st.x = Math.min(3, st.x + 1); paint(false); SOUND.play("pop", 0.3); }
        else if (id === "left") { st.x = Math.max(-3, st.x - 1); paint(false); SOUND.play("pop", 0.3); }
        else if (id === "jump") { paint(true); SOUND.play("boing", 0.4); setTimeout(() => paint(false), 320); }
        else if (id === "spin") { st.spin += 360; paint(false); SOUND.play("whoosh", 0.3); }
        else if (id === "say") { bb.textContent = "Hello!"; bb.hidden = false; SOUND.play("ding", 0.3); }
        else if (id === "grow") { st.scale = Math.min(2.2, st.scale * 1.4); paint(false); SOUND.play("boing", 0.3); }
        else if (id === "shrink") { st.scale = Math.max(0.4, st.scale / 1.4); paint(false); SOUND.play("pop", 0.3); }
        else if (id === "hide") { st.hidden = true; paint(false); SOUND.play("click", 0.3); }
        else if (id === "home") { st.x = 0; st.spin = 0; st.scale = 1; st.hidden = false; paint(false); SOUND.play("click", 0.3); }
        else if (id === "wait") { /* nothing, for a beat */ }
        setTimeout(r, 720);
      });
    }
    reset();
    return { run, reset, state: st };
  }
  /* a program as the words a child reads: "move right, then jump, then say hello" */
  const programWords = (ids) => ids.map((id) => (BLOCKS[id] || { label: id }).label).join(", then ");

  /* ==================================================================
     RENDERERS shared with the Science kit, byte for byte in spirit:
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

  /* ---- put things in order ------------------------------------------
     The child taps what comes FIRST, then next; a wrong tap shakes and
     says which end it belongs at rather than just "no". 1CT.04 and
     1CT.06 as behaviour: an ordered set of instructions, and the order
     mattering. */
  function order(o) {
    const el = o.el, items = o.items, placed = [];
    let lock = false, wrong = 0;
    function draw() {
      const left = items.filter((_, k) => !placed.includes(k));
      $(el.stage).innerHTML = '<div class="stagewide">' + (o.scene ? '<div class="sim scenebox">' + SCENES[o.scene](placed.map((k) => items[k].id)) + "</div>" : "") +
        '<div class="orderrow">' +
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

  /* ==================================================================
     THE ALGORITHM RENDERERS - Computational Thinking as things to do.
     ================================================================== */

  const algoList = (steps, now, cls) => '<ol class="algo' + (cls ? " " + cls : "") + '">' + steps.map((s, k) =>
    '<li class="' + (k < now ? "done" : k === now ? "now" : "") + '"><span class="apic" aria-hidden="true">' + small(s.pic) + "</span>" + esc(s.label) + "</li>").join("") + "</ol>";

  /* ---- follow the steps of an algorithm, in order (1CT.01) -----------
     The algorithm is on the left with the next step lit; the scene is
     on the right; the step BUTTONS are shuffled underneath. Tapping the
     step the algorithm names paints it into the scene and moves the
     light on; tapping any other step says which step comes next. The
     scene paints in the order tapped, so it cannot be fooled. */
  function followSteps(o) {
    const el = o.el, steps = o.steps, doneIds = [];
    const btnOrder = shuffle(steps.map((_, k) => k));
    let i = 0, right = 0, missed = false, lock = false;
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide"><div class="algo2">' + algoList(steps, i) +
        '<div class="sim scenebox" id="' + el.stage + 'sc">' + SCENES[o.scene](doneIds) + "</div></div>" +
        '<div class="actions" id="' + el.stage + 'act">' + btnOrder.map((k) =>
          '<button type="button" class="tapcard act" data-k="' + k + '"' + (k < i ? " disabled" : "") + '><span class="cpic" aria-hidden="true">' + small(steps[k].pic) + "</span>" + esc(steps[k].label) + "</button>").join("") + "</div></div>";
      $(el.score).textContent = i < steps.length ? "Do step " + (i + 1) + " of " + steps.length : "";
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".act"); if (!b || lock || b.disabled) return;
      const k = Number(b.dataset.k);
      if (k === i) {
        if (!missed) right++;
        missed = false; doneIds.push(steps[k].id); i++;
        SOUND.play(steps[k].sound || "pop", 0.4);
        draw();
        $(el.fb).className = "fb good"; $(el.fb).textContent = "Step " + i + ": " + steps[k].label + ".";
        say(steps[k].say || steps[k].label);
        if (i >= steps.length) {
          lock = true;
          reportScore(o.finish, right, steps.length);
          setTimeout(() => { const line = "You followed all " + steps.length + " steps in order. " + o.done; $(el.fb).textContent = line; finish(o.finish, line); }, 2400);
        }
      } else {
        missed = true; b.classList.add("wrong"); SOUND.play("error", 0.3);
        const hint = "Not yet. The algorithm says step " + (i + 1) + " next: " + steps[i].label + ".";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = hint; say(hint);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    draw();
  }

  /* ---- find the single error in an algorithm, then fix it (1CT.02) --
     One step of each round is wrong - the wrong thing, or a right thing
     in the wrong place. The child finds it, then picks what it should
     say instead, and only THEN does the scene run the fixed algorithm,
     step by step, so the fix is seen to work. */
  function bugHunt(o) {
    const el = o.el, rounds = o.rounds;
    let r = 0, phase = "find", score = 0, lock = false, missed = false;
    let steps = [];
    function draw(nowIds, lit) {
      const round = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide"><p class="goal">Goal: <b>' + esc(round.goal) + "</b></p><div class=\"algo2\">" +
        '<ol class="algo tappable">' + steps.map((s, k) => '<li><button type="button" class="algostep' + (lit === k ? " lit" : "") + (phase === "run" && nowIds.length > k ? " done" : "") + '" data-k="' + k + '"' + (phase !== "find" ? " disabled" : "") + '><span class="apic" aria-hidden="true">' + small(s.pic) + "</span>" + esc(s.label) + "</button></li>").join("") + "</ol>" +
        '<div class="sim scenebox">' + SCENES[o.scene](nowIds) + "</div></div></div>";
      $(el.score).textContent = "Algorithm " + (r + 1) + " of " + rounds.length + (phase === "find" ? " · find the bug" : phase === "fix" ? " · fix it" : " · running the fixed algorithm");
    }
    function start() {
      const round = rounds[r];
      steps = round.steps.map((s) => Object.assign({}, s));
      phase = "find"; missed = false; lock = false;
      $(el.ask).innerHTML = "<b>" + esc(round.goal) + ".</b> One step is wrong. Tap the step that is the bug.";
      $(el.ch).innerHTML = ""; $(el.ch).className = "choices";
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw(steps.slice(0, round.wrong).map((s) => s.id), -1);
      sayHere(o.finish, round.goal + ". One step is wrong. Tap the step that is the bug.");
    }
    /* a step that is one place too early: the fix is to move it, not to
       replace it, so there is nothing to choose - the page moves it and
       says so, then runs the algorithm */
    function autoSwap() {
      const round = rounds[r];
      const k = round.wrong;
      [steps[k], steps[k + 1]] = [steps[k + 1], steps[k]];
      draw(steps.slice(0, k).map((s) => s.id), k + 1);
      SOUND.play("pop", 0.4);
      const line = "Moved. " + steps[k + 1].label + " now comes after " + steps[k].label.toLowerCase() + ".";
      $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
      setTimeout(runFixed, 2600);
    }
    function fixPhase() {
      const round = rounds[r];
      phase = "fix"; missed = false; lock = false;
      draw(steps.slice(0, round.wrong).map((s) => s.id), round.wrong);
      $(el.ask).innerHTML = "What should step " + (round.wrong + 1) + " say instead?";
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(round.fix.opts).map((c) => '<button type="button" class="choice text" data-id="' + esc(c.id) + '" data-ok="' + (c.ok ? 1 : 0) + '">' + (c.pic ? '<span class="cpic" aria-hidden="true">' + small(c.pic) + "</span> " : "") + esc(c.t) + "</button>").join("");
      sayHere(o.finish, "What should step " + (round.wrong + 1) + " say instead?");
    }
    function runFixed() {
      phase = "run"; lock = true;
      $(el.ch).innerHTML = ""; $(el.ch).className = "choices";
      $(el.ask).innerHTML = "Debugged! Watch the fixed algorithm run.";
      let k = 0;
      const tick = () => {
        k++;
        draw(steps.slice(0, k).map((s) => s.id), -1);
        if (k <= steps.length) { SOUND.play("pop", 0.3); $(el.fb).className = "fb good"; $(el.fb).textContent = "Step " + k + ": " + steps[k - 1].label + "."; }
        if (k < steps.length) setTimeout(tick, 900);
        else {
          $(el.fb).textContent = rounds[r].done || "It works. " + rounds[r].goal + ".";
          say($(el.fb).textContent);
          r++;
          setTimeout(() => {
            if (r >= rounds.length) { reportScore(o.finish, score, rounds.reduce((n, x) => n + (x.fix ? 2 : 1), 0)); endStep(o, "You found and fixed " + rounds.length + " bugs. " + o.done); }
            else start();
          }, 2400);
        }
      };
      setTimeout(tick, 600);
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".algostep"); if (!b || lock || phase !== "find") return;
      const round = rounds[r], k = Number(b.dataset.k);
      if (k === round.wrong) {
        lock = true; if (!missed) score++;
        b.classList.add("bug"); SOUND.play("ding", 0.4);
        const line = cheer() + " " + (round.why || "That step is the bug.");
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        setTimeout(round.fix ? fixPhase : autoSwap, 2600);
      } else {
        missed = true; b.classList.add("wrong"); SOUND.play("error", 0.3);
        const line = "That step is fine: " + steps[k].label + ". Look for the one that does not belong, or is in the wrong place.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock || phase !== "fix") return;
      const round = rounds[r], ok = b.dataset.ok === "1";
      if (ok) {
        lock = true; if (!missed) score++;
        const opt = round.fix.opts.find((c) => c.id === b.dataset.id);
        steps[round.wrong] = { id: opt.id, label: opt.t, pic: opt.pic || steps[round.wrong].pic };
        $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
        SOUND.play("tada", 0.4);
        $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " " + round.fix.why; say(cheer() + " " + round.fix.why);
        setTimeout(runFixed, 2600);
      } else {
        missed = true; b.classList.add("wrong"); b.disabled = true; SOUND.play("error", 0.3);
        const line = "Not that one. Think about what has to happen at step " + (round.wrong + 1) + ".";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    });
    start();
  }

  /* ---- change an algorithm to change what it makes (1CT.07) ----------
     The scene shows what the algorithm makes now. Each round names a
     different outcome; the child either changes one step (tap it, then
     pick the new step) or adds one. The scene redraws from the new
     algorithm, so "different steps, different outcome" is seen, not
     said. The algorithm carries over between rounds. */
  function remix(o) {
    const el = o.el, rounds = o.rounds;
    let steps = o.steps.map((s) => Object.assign({}, s));
    let r = 0, phase = "pick", score = 0, lock = false, missed = false;
    function draw(lit) {
      const round = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide"><p class="goal">Now make: <b>' + esc(round.target) + "</b></p><div class=\"algo2\">" +
        '<ol class="algo tappable">' + steps.map((s, k) => '<li><button type="button" class="algostep' + (lit === k ? " lit" : "") + '" data-k="' + k + '"' + (phase !== "pick" ? " disabled" : "") + '><span class="apic" aria-hidden="true">' + small(s.pic) + "</span>" + esc(s.label) + "</button></li>").join("") + "</ol>" +
        '<div class="sim scenebox">' + SCENES[o.scene](steps.map((s) => s.id)) + "</div></div></div>";
      $(el.score).textContent = "Change " + (r + 1) + " of " + rounds.length;
    }
    function choices(round) {
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(round.opts).map((c) => '<button type="button" class="choice text" data-id="' + esc(c.id) + '" data-ok="' + (c.ok ? 1 : 0) + '">' + (c.pic ? '<span class="cpic" aria-hidden="true">' + small(c.pic) + "</span> " : "") + esc(c.t) + "</button>").join("");
    }
    function start() {
      const round = rounds[r];
      missed = false; lock = false;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      if (round.kind === "add") {
        phase = "choose"; draw(-1);
        $(el.ask).innerHTML = "To make <b>" + esc(round.target) + "</b>, which step should we ADD?";
        choices(round);
        sayHere(o.finish, "To make " + round.target + ", which step should we add?");
      } else {
        phase = "pick"; draw(-1);
        $(el.ch).innerHTML = ""; $(el.ch).className = "choices";
        $(el.ask).innerHTML = "To make <b>" + esc(round.target) + "</b>, which step has to change? Tap it.";
        sayHere(o.finish, "To make " + round.target + ", which step has to change? Tap it.");
      }
    }
    function applied(round, opt) {
      if (round.kind === "add") steps.push({ id: opt.id, label: opt.t, pic: opt.pic || "➕" });
      else { const k = steps.findIndex((s) => s.id === round.change); steps[k] = { id: opt.id, label: opt.t, pic: opt.pic || steps[k].pic }; }
      phase = "show"; draw(-1); SOUND.play("tada", 0.4);
      $(el.ch).innerHTML = ""; $(el.ch).className = "choices";
      $(el.ask).innerHTML = "<b>" + esc(round.result) + "</b> Different steps, different outcome.";
      $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " " + round.why; say(cheer() + " " + round.why + " " + round.result);
      r++;
      setTimeout(() => {
        if (r >= rounds.length) { reportScore(o.finish, score, rounds.reduce((n, x) => n + (x.kind === "add" ? 1 : 2), 0)); endStep(o, "You changed the algorithm " + rounds.length + " times, and the outcome changed every time. " + o.done); }
        else start();
      }, 3200);
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".algostep"); if (!b || lock || phase !== "pick") return;
      const round = rounds[r], k = Number(b.dataset.k);
      if (steps[k].id === round.change) {
        lock = true; if (!missed) score++;
        SOUND.play("ding", 0.4);
        $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " That is the step to change."; say(cheer() + " That is the step to change. What should it say instead?");
        setTimeout(() => { phase = "choose"; lock = false; missed = false; draw(k); $(el.ask).innerHTML = "What should step " + (k + 1) + " say instead?"; $(el.fb).textContent = ""; choices(round); }, 2200);
      } else {
        missed = true; b.classList.add("wrong"); SOUND.play("error", 0.3);
        const line = "Changing " + steps[k].label + " would not make " + round.target + ". Which step decides that?";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock || phase !== "choose") return;
      const round = rounds[r], ok = b.dataset.ok === "1";
      if (ok) {
        lock = true; if (!missed) score++;
        $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
        setTimeout(() => applied(round, round.opts.find((c) => c.id === b.dataset.id)), 900);
      } else {
        missed = true; b.classList.add("wrong"); b.disabled = true; SOUND.play("error", 0.3);
        const line = "That would make something else. Try again.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    });
    start();
  }

  /* ---- Robo on the grid: forward, backwards, left, right (1CT.03) ----
     Bee-Bot rules: Forward and Backwards move one square the way Robo is
     FACING; Turn left and Turn right spin Robo on the spot. The child
     builds a program of instruction chips and presses Go; Robo runs
     exactly those, one square every half second, and stops where they
     leave it. A wall or the edge is a bump, and the program stops there.
     A `predict` level shows a program the child cannot edit and asks
     where Robo will stop BEFORE it runs (1P.03). */
  const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const TURN_L = { up: "left", left: "down", down: "right", right: "up" };
  const TURN_R = { up: "right", right: "down", down: "left", left: "up" };
  const ANGLE = { up: 0, right: 90, down: 180, left: 270 };
  const CMD = { F: { label: "Forward", icon: "⬆️" }, B: { label: "Backwards", icon: "⬇️" }, L: { label: "Turn left", icon: "↺" }, R: { label: "Turn right", icon: "↻" } };
  function robotGrid(o) {
    const el = o.el, rows = o.rows, cols = o.cols, levels = o.levels, CELL = 56;
    let L = 0, program = [], st = null, running = false, firstGo = true, score = 0, predicted = null, solvedFirst = 0;
    const level = () => levels[L];
    const cellName = (c, r) => "column " + (c + 1) + ", row " + (r + 1);
    function gridSvg(pos, facing, lit) {
      const lv = level();
      let g = "";
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const here = lit && lit[0] === c && lit[1] === r;
        g += '<rect class="cell' + (here ? " lit" : "") + '" data-c="' + c + '" data-r="' + r + '" x="' + (8 + c * CELL) + '" y="' + (8 + r * CELL) + '" width="' + CELL + '" height="' + CELL + '" rx="8" fill="' + (here ? "#F4C95D" : ((r + c) % 2 ? "#17384F" : "#1B3A52")) + '" stroke="#2B5673" stroke-width="2"' + (lv.predict ? ' tabindex="0" role="button" aria-label="' + cellName(c, r) + '"' : "") + "/>";
      }
      (lv.walls || []).forEach(([c, r]) => { g += T(8 + c * CELL + CELL / 2, 8 + r * CELL + CELL / 2 + 12, 34, "\u{1F9F1}"); });
      g += T(8 + lv.target[0] * CELL + CELL / 2, 8 + lv.target[1] * CELL + CELL / 2 + 12, 34, lv.targetPic || "\u{1F338}");
      const cx = 8 + pos[0] * CELL + CELL / 2, cy = 8 + pos[1] * CELL + CELL / 2;
      g += '<g transform="translate(' + cx + ' ' + cy + ')"><circle r="24" fill="#35BFB2" opacity="0.35"/>' +
        '<g transform="rotate(' + ANGLE[facing] + ')"><polygon points="0,-30 9,-16 -9,-16" fill="#F4C95D"/></g>' + T(0, 11, 30, "\u{1F916}") + "</g>";
      return '<svg viewBox="0 0 ' + (cols * CELL + 16) + " " + (rows * CELL + 16) + '" class="robogrid" role="img" aria-label="Robo at ' + cellName(pos[0], pos[1]) + ", facing " + facing + '">' + g + "</svg>";
    }
    function chips(k) {
      return '<div class="prog" id="' + el.stage + 'prog">' + (program.length ? program.map((c, j) => '<span class="chip' + (j === k ? " now" : "") + '">' + CMD[c].icon + " " + CMD[c].label + "</span>").join("") : '<span class="hint">' + (level().predict ? "" : "Tap the arrows to build a program") + "</span>") + "</div>";
    }
    function controls() {
      const lv = level();
      if (lv.predict) return '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'go"' + (predicted ? "" : " disabled") + '>&#9654; Go</button></div>';
      return '<div class="robobtns">' + Object.keys(CMD).map((c) => '<button type="button" class="big small ghost" data-cmd="' + c + '"' + (running ? " disabled" : "") + '>' + CMD[c].icon + " " + esc(CMD[c].label) + "</button>").join("") + "</div>" +
        '<div class="bigbtns"><button type="button" class="big small ghost" id="' + el.stage + 'undo"' + (running || !program.length ? " disabled" : "") + '>Undo</button>' +
        '<button type="button" class="big small ghost" id="' + el.stage + 'clear"' + (running || !program.length ? " disabled" : "") + '>Clear</button>' +
        '<button type="button" class="big small teal" id="' + el.stage + 'go"' + (running || !program.length ? " disabled" : "") + '>&#9654; Go</button></div>';
    }
    function draw(k) {
      const lv = level();
      $(el.stage).innerHTML = '<div class="stagewide"><p class="goal">' + esc(lv.title) + "</p>" +
        '<div class="sim robobox" id="' + el.stage + 'g">' + gridSvg(st.pos, st.facing, predicted) + "</div>" + chips(k) + controls() + "</div>";
      $(el.score).textContent = "Level " + (L + 1) + " of " + levels.length;
      const go = $(el.stage + "go"), undo = $(el.stage + "undo"), clear = $(el.stage + "clear");
      if (go) go.addEventListener("click", run);
      if (undo) undo.addEventListener("click", () => { program.pop(); draw(); });
      if (clear) clear.addEventListener("click", () => { program = []; draw(); });
    }
    function reset() {
      const lv = level();
      st = { pos: lv.start.slice(), facing: lv.facing };
    }
    function startLevel() {
      const lv = level();
      reset(); program = lv.predict ? lv.program.slice() : []; firstGo = true; predicted = null; running = false;
      $(el.ch).innerHTML = ""; $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.ask).innerHTML = lv.predict ? "Robo will run this program. <b>Where will Robo stop?</b> Tap the square, then press Go." : (lv.ask || "Give Robo the instructions to reach the " + (lv.targetName || "flower") + ". Then press <b>Go</b>.");
      draw();
      sayHere(o.finish, plain($(el.ask).innerHTML) + (lv.hint ? " " + lv.hint : ""));
    }
    function run() {
      if (running || !program.length) return;
      running = true; reset();
      let k = 0, bumped = false;
      draw(-1);
      const step = () => {
        if (k >= program.length || bumped) return finished();
        const cmd = program[k];
        if (cmd === "L") st.facing = TURN_L[st.facing];
        else if (cmd === "R") st.facing = TURN_R[st.facing];
        else {
          const d = DIRS[st.facing], sign = cmd === "F" ? 1 : -1;
          const nc = st.pos[0] + d[0] * sign, nr = st.pos[1] + d[1] * sign;
          const wall = (level().walls || []).some(([c, r]) => c === nc && r === nr);
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || wall) { bumped = wall ? "wall" : "edge"; }
          else st.pos = [nc, nr];
        }
        SOUND.play(bumped ? "buzz" : (cmd === "L" || cmd === "R" ? "click" : "beep"), 0.35);
        draw(k);
        if (bumped) { $(el.fb).className = "fb bad"; $(el.fb).textContent = "Bump! Robo cannot go " + (bumped === "wall" ? "through the wall." : "off the edge."); }
        k++;
        setTimeout(step, 560);
      };
      setTimeout(step, 400);
    }
    function finished() {
      const lv = level();
      running = false;
      const atTarget = st.pos[0] === lv.target[0] && st.pos[1] === lv.target[1];
      if (lv.predict) {
        const hit = predicted && predicted[0] === st.pos[0] && predicted[1] === st.pos[1];
        if (hit) score++;
        const line = (hit ? cheer() + " You predicted it. " : "Robo stopped somewhere else. ") + "Robo stopped at " + cellName(st.pos[0], st.pos[1]) + (atTarget ? ", on the " + (lv.targetName || "flower") + "." : ".");
        $(el.fb).className = "fb " + (hit ? "good" : "bad"); $(el.fb).textContent = line; say(line);
        draw(-1);
        setTimeout(nextLevel, 3000);
        return;
      }
      if (atTarget) {
        if (firstGo) { score++; solvedFirst++; }
        SOUND.play("tada", 0.5);
        const line = cheer() + " Robo reached the " + (lv.targetName || "flower") + " in " + program.length + " instructions.";
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        draw(-1); $(el.stage).querySelectorAll("button").forEach((b) => { b.disabled = true; });
        setTimeout(nextLevel, 3000);
      } else {
        firstGo = false;
        const line = ($(el.fb).textContent && $(el.fb).className.includes("bad") ? $(el.fb).textContent + " " : "") + "Robo stopped at " + cellName(st.pos[0], st.pos[1]) + ", not on the " + (lv.targetName || "flower") + ". Change the program and press Go again.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        draw(-1);
      }
    }
    function nextLevel() {
      L++;
      if (L >= levels.length) {
        reportScore(o.finish, score, levels.length);
        endStep(o, "Robo did " + levels.length + " levels. " + o.done);
      } else startLevel();
    }
    $(el.stage).addEventListener("click", (e) => {
      const cmdBtn = e.target.closest("[data-cmd]");
      if (cmdBtn && !running && !level().predict) { program.push(cmdBtn.dataset.cmd); SOUND.play("click", 0.3); draw(); return; }
      const cell = e.target.closest(".cell");
      if (cell && level().predict && !running) {
        predicted = [Number(cell.dataset.c), Number(cell.dataset.r)];
        SOUND.play("pop", 0.3); draw();
        $(el.fb).className = "fb"; $(el.fb).textContent = "You predict Robo stops at " + cellName(predicted[0], predicted[1]) + ". Press Go to find out.";
      }
    });
    $(el.stage).addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const cell = e.target.closest(".cell"); if (!cell) return;
      e.preventDefault(); cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    startLevel();
  }

  /* ==================================================================
     THE PROGRAMMING RENDERERS - an algorithm becomes code, runs, and is
     tested; a bug is found and fixed. The sprite does exactly the blocks
     in the script and nothing else.
     ================================================================== */

  const scriptHtml = (ids, now, tappable) => '<div class="script">' + (ids.length ? ids.map((id, k) =>
    tappable ? blockBtn(id, 'data-k="' + k + '"' + (k === now ? ' class="block ' + (BLOCKS[id] || {}).cat + ' now"' : "")) : blockHtml(id, k === now ? " now" : "")).join("")
    : '<span class="hint">Tap the blocks below to build the program</span>') + "</div>";

  /* ---- recreate an algorithm as a program, then run it (1P.02, 1P.05) --
     Build rounds: the algorithm is words; the child places the blocks
     that say the same, then runs the program and sees whether the sprite
     did what the algorithm said. A wrong program is not marked wrong by
     the page; it RUNS, the child watches, and the page reads back what
     the program did against what the algorithm asked, which is testing
     (1P.05). Predict rounds: the program is given and the question is
     what the sprite will do before Run is pressed (1P.03). */
  function blockProgram(o) {
    const el = o.el, rounds = o.rounds;
    let r = 0, script = [], running = false, firstRun = true, score = 0, lock = false, predicted = null;
    let sprite = null;
    const round = () => rounds[r];
    function draw(now) {
      const rd = round(), given = !!rd.given;
      $(el.stage).innerHTML = '<div class="stagewide">' +
        (rd.algorithm ? '<p class="goal">The algorithm says:</p><ol class="algo words">' + rd.algorithm.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>" : "") +
        '<div class="spritestage" id="' + el.stage + 'sp"></div>' +
        scriptHtml(script, now, !given && !running) +
        (given ? "" : '<div class="palette">' + (o.blocks || Object.keys(BLOCKS)).map((id) => blockBtn(id, 'data-add="' + id + '"' + (running ? " disabled" : ""))).join("") + "</div>") +
        '<div class="bigbtns">' + (given ? "" : '<button type="button" class="big small ghost" id="' + el.stage + 'clear"' + (running || !script.length ? " disabled" : "") + ">Clear</button>") +
        '<button type="button" class="big small teal" id="' + el.stage + 'run"' + (running || !script.length || (given && !predicted) ? " disabled" : "") + '>&#9654; Run</button></div></div>';
      sprite = spriteStage($(el.stage + "sp"), o.sprite || "\u{1F431}");
      $(el.score).textContent = "Program " + (r + 1) + " of " + rounds.length;
      const clear = $(el.stage + "clear"), run = $(el.stage + "run");
      if (clear) clear.addEventListener("click", () => { script = []; draw(); });
      if (run) run.addEventListener("click", runIt);
    }
    function start() {
      const rd = round();
      script = rd.given ? rd.given.slice() : []; firstRun = true; running = false; predicted = null; lock = false;
      $(el.ch).innerHTML = ""; $(el.ch).className = "choices"; $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw(-1);
      if (rd.given) {
        $(el.ask).innerHTML = rd.predict.ask;
        $(el.ch).className = "choices stack";
        $(el.ch).innerHTML = shuffle(rd.predict.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
        sayHere(o.finish, plain(rd.predict.ask));
      } else {
        $(el.ask).innerHTML = "Build this algorithm as a program: <b>" + esc(rd.algorithm.join(", ")) + "</b>. Then press Run.";
        sayHere(o.finish, "Build this algorithm as a program. " + rd.algorithm.join(". ") + ". Then press Run.");
      }
    }
    function runIt() {
      if (running || !script.length) return;
      running = true; sprite.reset(); draw(-1);
      let k = 0;
      const step = () => {
        if (k >= script.length) return finished();
        draw(k);
        sprite.run(script[k]).then(() => { k++; step(); });
      };
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      setTimeout(step, 300);
    }
    function finished() {
      const rd = round();
      running = false; draw(-1);
      if (rd.given) {
        const line = (predicted.ok ? cheer() + " You predicted it. " : "Look what it did. ") + "The program made the " + (o.spriteName || "cat") + " " + programWords(script) + ". " + rd.predict.why;
        if (predicted.ok) score++;
        $(el.fb).className = "fb " + (predicted.ok ? "good" : "bad"); $(el.fb).textContent = line; say(line);
        setTimeout(next, 3400);
        return;
      }
      const same = script.length === rd.expect.length && script.every((id, k) => id === rd.expect[k]);
      if (same) {
        if (firstRun) score++;
        SOUND.play("tada", 0.5);
        const line = cheer() + " Your program did exactly what the algorithm said: " + programWords(script) + ".";
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        $(el.stage).querySelectorAll("button").forEach((b) => { b.disabled = true; });
        setTimeout(next, 3200);
      } else {
        firstRun = false; SOUND.play("error", 0.3);
        const line = "Your program made the " + (o.spriteName || "cat") + " " + programWords(script) + ". The algorithm says " + rd.algorithm.join(", ").toLowerCase() + ". Change the blocks and run it again.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    }
    function next() {
      r++;
      if (r >= rounds.length) { reportScore(o.finish, score, rounds.length); endStep(o, "You wrote " + rounds.length + " programs. " + o.done); }
      else start();
    }
    $(el.stage).addEventListener("click", (e) => {
      if (running) return;
      const add = e.target.closest("[data-add]");
      if (add) { script.push(add.dataset.add); SOUND.play("click", 0.3); draw(-1); return; }
      const placed = e.target.closest(".script [data-k]");
      if (placed && !round().given) { script.splice(Number(placed.dataset.k), 1); SOUND.play("pop", 0.3); draw(-1); }
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock || predicted) return;
      const rd = round(); if (!rd.given) return;
      predicted = { ok: b.dataset.ok === "1" };
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
      $(el.fb).className = "fb"; $(el.fb).textContent = "You predict: " + b.textContent + ". Press Run to find out.";
      say("You predict: " + b.textContent + ". Press Run to find out.");
      draw(-1);
    });
    start();
  }

  /* ---- a program that does not do what we want: find the bug, fix it,
     run it again (1P.04, 1P.05, 1P.06, 1P.07). Run FIRST, so the child
     sees the wrong thing happen before hunting for why. */
  function debugProgram(o) {
    const el = o.el, rounds = o.rounds;
    let r = 0, program = [], phase = "run", running = false, score = 0, lock = false, missed = false, sprite = null;
    const round = () => rounds[r];
    function draw(now) {
      const rd = round();
      $(el.stage).innerHTML = '<div class="stagewide"><p class="goal">We want: <b>' + esc(rd.goal) + "</b></p>" +
        '<div class="spritestage" id="' + el.stage + 'sp"></div>' +
        scriptHtml(program, now, phase === "find") +
        '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'run"' + (running || phase === "find" || phase === "fix" ? " disabled" : "") + '>&#9654; ' + (phase === "again" ? "Run it again" : "Run") + "</button></div></div>";
      sprite = spriteStage($(el.stage + "sp"), o.sprite || "\u{1F436}");
      $(el.score).textContent = "Program " + (r + 1) + " of " + rounds.length + (phase === "find" ? " · find the bug" : phase === "fix" ? " · fix it" : "");
      const run = $(el.stage + "run"); if (run) run.addEventListener("click", runIt);
    }
    function start() {
      program = round().program.slice(); phase = "run"; running = false; lock = false; missed = false;
      $(el.ch).innerHTML = ""; $(el.ch).className = "choices"; $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.ask).innerHTML = "We want: <b>" + esc(round().goal) + "</b>. Press Run and watch carefully.";
      draw(-1);
      sayHere(o.finish, "We want: " + round().goal + ". Press Run and watch carefully.");
    }
    function runIt() {
      if (running) return;
      running = true; sprite.reset(); draw(-1);
      let k = 0;
      const step = () => {
        if (k >= program.length) return finished();
        draw(k);
        sprite.run(program[k]).then(() => { k++; step(); });
      };
      setTimeout(step, 300);
    }
    function finished() {
      const rd = round();
      running = false;
      const fixed = program.length === rd.expect.length && program.every((id, k) => id === rd.expect[k]);
      if (fixed) {
        SOUND.play("tada", 0.5); phase = "done"; draw(-1);
        const line = cheer() + " Debugged! The program does what we wanted: " + programWords(program) + ".";
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        r++;
        setTimeout(() => {
          if (r >= rounds.length) { reportScore(o.finish, score, rounds.length * 2); endStep(o, "You debugged " + rounds.length + " programs. " + o.done); }
          else start();
        }, 3200);
        return;
      }
      phase = "find"; draw(-1); SOUND.play("error", 0.3);
      $(el.ask).innerHTML = "That is not what we wanted. It did: <b>" + esc(programWords(program)) + "</b>. Which block is the bug? Tap it.";
      const line = "That is not what we wanted. The program made it " + programWords(program) + ". Which block is the bug? Tap it.";
      $(el.fb).className = "fb bad"; $(el.fb).textContent = "Something is wrong."; say(line);
    }
    function fixPhase() {
      const rd = round();
      phase = "fix"; lock = false; missed = false; draw(rd.bug);
      $(el.ask).innerHTML = "What should that block be instead?";
      $(el.ch).className = "choices blocks";
      $(el.ch).innerHTML = shuffle(rd.fix.opts).map((c) => blockBtn(c.id, 'data-id="' + esc(c.id) + '" data-ok="' + (c.ok ? 1 : 0) + '"')).join("");
      sayHere(o.finish, "What should that block be instead?");
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".script [data-k]"); if (!b || phase !== "find" || lock) return;
      const rd = round(), k = Number(b.dataset.k);
      if (k === rd.bug) {
        lock = true; if (!missed) score++;
        b.classList.add("bug"); SOUND.play("ding", 0.4);
        const line = cheer() + " " + rd.why;
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        setTimeout(fixPhase, 2600);
      } else {
        missed = true; b.classList.add("wrong"); SOUND.play("error", 0.3);
        const line = "That block is fine: " + (BLOCKS[program[k]] || {}).label + ". Which block made it go wrong?";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest("[data-id]"); if (!b || phase !== "fix" || lock) return;
      const rd = round(), ok = b.dataset.ok === "1";
      if (ok) {
        lock = true; if (!missed) score++;
        program[rd.bug] = b.dataset.id;
        $(el.ch).querySelectorAll("button").forEach((c) => { c.disabled = true; }); b.classList.add("right");
        SOUND.play("pop", 0.4);
        const line = cheer() + " " + rd.fix.why + " Now run it again to test it.";
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        setTimeout(() => { phase = "again"; $(el.ch).innerHTML = ""; $(el.ch).className = "choices"; $(el.ask).innerHTML = "Fixed. Now <b>run it again</b> to test it."; draw(-1); }, 2600);
      } else {
        missed = true; b.classList.add("wrong"); b.disabled = true; SOUND.play("error", 0.3);
        const line = "That block would not make " + rd.goal + ". Try another.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    });
    start();
  }

  /* ==================================================================
     THE DATA RENDERERS - a form that records, a table that answers, and
     a machine that sorts.
     ================================================================== */

  const tablet = (inner, top) => '<div class="tablet"><div class="tabletbar">' + (top || "") + '</div><div class="screen">' + inner + "</div></div>";

  /* ---- record data with a form (1MD.03) --------------------------------
     Six people each say their answer; the child records each one on the
     form and presses Submit; the table underneath fills from what was
     submitted. A wrong entry is read back against what the person said. */
  function dataForm(o) {
    const el = o.el, people = o.people, options = o.options;
    const counts = {}; options.forEach((x) => { counts[x.id] = 0; });
    const rows = [];
    let p = 0, chosen = null, right = 0, missed = false, lock = false;
    function tableHtml() {
      return '<table class="rec small tally"><thead><tr><th>' + esc(o.columns ? o.columns[0] : "Answer") + "</th><th>" + esc(o.columns ? o.columns[1] : "How many") + "</th></tr></thead><tbody>" +
        options.map((x) => '<tr><td><span class="rowlab">' + small(x.pic) + " " + esc(x.t) + '</span></td><td><span class="cell filled"><span class="picto" aria-hidden="true">' + small(x.pic).repeat(counts[x.id]) + "</span>" + counts[x.id] + "</span></td></tr>").join("") + "</tbody></table>";
    }
    function draw() {
      const person = people[p];
      $(el.stage).innerHTML = '<div class="stagewide">' +
        (person ? '<div class="person"><span class="ppic" aria-hidden="true">' + small(person.pic) + '</span><div><b>' + esc(person.name) + '</b><p class="pbubble">“' + esc(person.say) + "”</p></div></div>" : "") +
        tablet('<p class="formq">' + esc(o.question) + "</p><div class=\"formopts\">" + options.map((x) => '<button type="button" class="opt' + (chosen === x.id ? " on" : "") + '" data-id="' + x.id + '"' + (person ? "" : " disabled") + '><span class="radio" aria-hidden="true"></span><span class="cpic" aria-hidden="true">' + small(x.pic) + "</span>" + esc(x.t) + "</button>").join("") + "</div>" +
          '<div class="bigbtns"><button type="button" class="big small" id="' + el.stage + 'sub"' + (chosen && person ? "" : " disabled") + ">Submit</button></div>", "Form") +
        tableHtml() + "</div>";
      $(el.score).textContent = person ? "Answer " + (p + 1) + " of " + people.length : "";
      const sub = $(el.stage + "sub"); if (sub) sub.addEventListener("click", submit);
    }
    function submit() {
      if (lock || !chosen) return;
      const person = people[p];
      if (chosen === person.answer) {
        lock = true; if (!missed) right++;
        counts[chosen]++; rows.push([person.name, chosen]); SOUND.play("send", 0.4);
        const opt = options.find((x) => x.id === chosen);
        const line = "Recorded: " + person.name + ", " + opt.t + ".";
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        p++; chosen = null; missed = false;
        setTimeout(() => {
          lock = false; draw();
          if (p >= people.length) {
            $(el.ask).innerHTML = "Every answer is in the table.";
            reportScore(o.finish, right, people.length);
            endStep(o, "You recorded " + people.length + " answers with a form, and the table filled itself. " + o.done);
          } else sayHere(o.finish, people[p].name + " says: " + people[p].say + " Record it on the form.");
        }, 1800);
      } else {
        missed = true; SOUND.play("error", 0.3);
        const want = options.find((x) => x.id === person.answer);
        const line = person.name + " said " + want.t.toLowerCase() + ". Tap " + want.t + ", then Submit.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".opt"); if (!b || lock) return;
      chosen = b.dataset.id; SOUND.play("click", 0.3); draw();
    });
    draw();
    ONSHOW[o.finish] = (function () { let said = false; return () => { if (said || p >= people.length) return; said = true; afterVoice(() => sayHere(o.finish, people[0].name + " says: " + people[0].say + " Record it on the form.")); }; })();
  }

  /* ---- answer questions from a data table (1MD.04) ---------------------
     The table stays on screen. Every answer is IN the table, so the skill
     is reading a table rather than remembering. The builder computes each
     key from the rows and refuses a wrong one. */
  function dataTable(o) {
    const el = o.el;
    let i = 0, right = 0, lock = false;
    $(el.stage).innerHTML = '<div class="stagewide"><table class="rec small tally"><caption>' + esc(o.title) + "</caption><thead><tr><th>" + esc(o.columns[0]) + "</th><th>" + esc(o.columns[1]) + "</th></tr></thead><tbody>" +
      o.rows.map((r) => '<tr><td><span class="rowlab">' + small(r.pic) + " " + esc(r.label) + '</span></td><td><span class="cell filled"><span class="picto" aria-hidden="true">' + small(r.pic).repeat(r.value) + "</span>" + r.value + "</span></td></tr>").join("") + "</tbody></table></div>";
    function draw() {
      lock = false;
      const it = o.items[i];
      $(el.ask).innerHTML = it.ask;
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(it.opts).map((c) => '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.score).textContent = "Look in the table: question " + (i + 1) + " of " + o.items.length;
      sayHere(o.finish, plain(it.ask) + " Look in the table.");
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const it = o.items[i], ok = b.dataset.ok === "1";
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong"); else right++;
      $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = (ok ? cheer() + " " : "Read the table again. ") + it.why; say($(el.fb).textContent);
      i++;
      setTimeout(() => {
        if (i >= o.items.length) {
          reportScore(o.finish, right, o.items.length);
          endStep(o, "You answered " + right + " of " + o.items.length + " from the table. " + o.done);
        } else draw();
      }, 2700);
    });
    draw();
  }

  /* ---- the sorting machine (1MD.02) -------------------------------------
     A tray of mixed things; press a way of sorting and the machine puts
     every thing into its group in a blink. Every way must be tried, so
     the child sees the SAME data organised two ways, then one question. */
  function sortMachine(o) {
    const el = o.el, tried = new Set();
    let lock = false;
    const jumbled = shuffle(o.items);
    function draw(way) {
      const w = way && o.ways.find((x) => x.id === way);
      $(el.stage).innerHTML = '<div class="stagewide"><div class="machine">' +
        (w ? '<div class="groups">' + w.groups.map((g) => '<div class="group"><b>' + esc(g) + "</b><div class=\"tray\">" + o.items.filter((it) => it[w.id] === g).map((it) => '<span class="tile" title="' + esc(it.label) + '">' + small(it.pic) + "</span>").join("") + "</div></div>").join("") + "</div>"
          : '<div class="tray big">' + jumbled.map((it) => '<span class="tile" title="' + esc(it.label) + '">' + small(it.pic) + "</span>").join("") + "</div>") +
        '<p class="sub">' + (w ? "Sorted " + o.items.length + " things " + esc(w.label) + " in a blink." : o.items.length + " things, all mixed up.") + "</p></div>" +
        '<div class="bigbtns">' + o.ways.map((x) => '<button type="button" class="big small' + (tried.has(x.id) ? " ghost" : " teal") + '" data-way="' + x.id + '"' + (lock ? " disabled" : "") + ">Sort " + esc(x.label) + "</button>").join("") + "</div></div>";
      $(el.score).textContent = tried.size + " of " + o.ways.length + " ways tried";
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest("[data-way]"); if (!b || lock) return;
      lock = true; SOUND.play("whoosh", 0.4);
      const w = o.ways.find((x) => x.id === b.dataset.way);
      setTimeout(() => {
        tried.add(w.id); SOUND.play("ding", 0.4); lock = false; draw(w.id);
        const line = "Sorted " + w.label + ". " + (w.say || "");
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        reportAttempt(o.finish, tried.size, o.ways.length, "ways");
        if (tried.size >= o.ways.length) {
          setTimeout(() => {
            $(el.fb).textContent = "";
            if (o.then) askOnce(o, o.then, (ok) => { reportScore(o.finish, ok ? 1 : 0, 1); endStep(o); });
            else endStep(o);
          }, 2600);
        }
      }, 700);
    });
    draw(null);
  }

  /* ==================================================================
     THE NETWORK AND SYSTEMS RENDERERS.
     ================================================================== */

  /* ---- build a network, then send something across it (1DC.01, 1DC.03)
     Devices sit around a router. The child taps a device and then the
     router to connect them: a wire is a solid line, a wireless link is a
     dashed one with waves at the device. Once everything is connected,
     each task sends a picture or a message from one device to another,
     and the envelope hops device - router - device. */
  function networkBuild(o) {
    const el = o.el, devs = o.devices, hub = devs.find((d) => d.id === o.hub);
    const linked = new Set();
    let picked = null, phase = "connect", task = 0, lock = false, sending = null;
    const at = (id) => devs.find((d) => d.id === id);
    function svg() {
      let g = '<rect width="320" height="220" fill="#0E2434" rx="18"/>';
      devs.forEach((d) => {
        if (d.id === hub.id || !linked.has(d.id)) return;
        g += '<line x1="' + d.x + '" y1="' + d.y + '" x2="' + hub.x + '" y2="' + hub.y + '" stroke="' + (d.wired ? "#F4C95D" : "#35BFB2") + '" stroke-width="4"' + (d.wired ? "" : ' stroke-dasharray="6 7"') + '/>';
        if (!d.wired) g += '<path d="M' + (d.x + 14) + ' ' + (d.y - 22) + ' q10 8 0 16 M' + (d.x + 20) + ' ' + (d.y - 26) + ' q16 12 0 24" fill="none" stroke="#35BFB2" stroke-width="2"/>';
      });
      devs.forEach((d) => {
        const on = picked === d.id;
        g += '<g class="dev" data-dev="' + d.id + '" tabindex="0" role="button" aria-label="' + esc(d.label) + (linked.has(d.id) ? ", connected" : "") + '" transform="translate(' + d.x + ' ' + d.y + ')">' +
          '<circle r="26" fill="' + (on ? "#F4C95D" : linked.has(d.id) || d.id === hub.id ? "#143A4A" : "#1B3A52") + '" stroke="' + (on ? "#F4C95D" : linked.has(d.id) ? "#35BFB2" : "#2B5673") + '" stroke-width="3"/>' +
          T(0, 11, 28, d.pic) + '<text y="44" text-anchor="middle" fill="#fff" font-size="11" font-family="Inter, sans-serif" font-weight="800">' + esc(d.label) + "</text></g>";
      });
      if (sending) g += '<g transform="translate(' + sending[0] + ' ' + sending[1] + ')">' + T(0, 10, 26, sending[2]) + "</g>";
      return '<svg viewBox="0 0 320 220" class="netmap" role="img" aria-label="A network of ' + devs.length + ' devices">' + g + "</svg>";
    }
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide"><div class="sim netbox" id="' + el.stage + 'net">' + svg() + "</div></div>";
      $(el.score).textContent = phase === "connect" ? (linked.size) + " of " + (devs.length - 1) + " connected" : "Sending " + (task + 1) + " of " + o.send.length;
    }
    function connect(a, b) {
      const other = a.id === hub.id ? b : b.id === hub.id ? a : null;
      if (!other) {
        const line = "Connect each device to the router. Tap a device, then the router.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line); SOUND.play("error", 0.3);
        return;
      }
      if (linked.has(other.id)) return;
      linked.add(other.id); SOUND.play(other.wired ? "click" : "send", 0.4);
      const line = other.wired ? "The " + other.label + " connects to the router with a wire." : "The " + other.label + " connects to the router with no wire at all. That is wireless.";
      $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
      reportAttempt(o.finish, linked.size, devs.length - 1, "devices");
      draw();
      if (linked.size >= devs.length - 1) {
        setTimeout(() => {
          phase = "send"; draw();
          const l2 = "Every device is connected. That is a network. Now send something across it.";
          $(el.fb).className = "fb good"; $(el.fb).textContent = l2; say(l2);
          setTimeout(askSend, 2600);
        }, 2200);
      }
    }
    function askSend() {
      const t = o.send[task];
      picked = null; draw();
      $(el.ask).innerHTML = "Send " + esc(t.what) + " " + small(t.pic) + " from the <b>" + esc(at(t.from).label) + "</b> to the <b>" + esc(at(t.to).label) + "</b>. Tap the " + esc(at(t.from).label) + ", then the " + esc(at(t.to).label) + ".";
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      sayHere(o.finish, "Send " + t.what + " from the " + at(t.from).label + " to the " + at(t.to).label + ". Tap the " + at(t.from).label + ", then the " + at(t.to).label + ".");
    }
    function send(a, b) {
      const t = o.send[task];
      if (a.id !== t.from || b.id !== t.to) {
        const line = "Not that way. Tap the " + at(t.from).label + " first, then the " + at(t.to).label + ".";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line); SOUND.play("error", 0.3);
        picked = null; draw(); return;
      }
      lock = true; picked = null;
      const hops = [[a.x, a.y], [hub.x, hub.y], [b.x, b.y]];
      let h = 0;
      const hop = () => {
        sending = [hops[h][0], hops[h][1], t.pic]; draw(); SOUND.play("send", 0.3);
        h++;
        if (h < hops.length) setTimeout(hop, 650);
        else setTimeout(() => {
          sending = null; draw(); SOUND.play("ding", 0.4);
          const line = t.say || (t.what + " went from the " + a.label + ", through the router, to the " + b.label + ".");
          $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
          task++; lock = false;
          setTimeout(() => {
            if (task >= o.send.length) { reportScore(o.finish, o.send.length, o.send.length); endStep(o, "You built a network and sent " + o.send.length + " things across it. " + o.done); }
            else askSend();
          }, 2800);
        }, 700);
      };
      hop();
    }
    $(el.stage).addEventListener("click", (e) => {
      const g = e.target.closest("[data-dev]"); if (!g || lock) return;
      const d = at(g.dataset.dev);
      if (!picked) { picked = d.id; SOUND.play("click", 0.3); draw(); $(el.fb).className = "fb"; $(el.fb).textContent = d.label + " picked. Now tap " + (phase === "connect" ? "the router." : "where it should go."); return; }
      const a = at(picked); picked = null;
      if (a.id === d.id) { draw(); return; }
      if (phase === "connect") connect(a, d); else send(a, d);
    });
    $(el.stage).addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const g = e.target.closest("[data-dev]"); if (!g) return;
      e.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    draw();
  }

  /* ---- when the internet is not available (1DC.04) ---------------------
     A tablet with a wi-fi switch. The child switches it OFF, then for each
     app predicts whether it will still work and tries it. Apps that need
     the internet show the spinner and the message; the others simply
     work. At the end the child switches it back on. */
  function offlineTest(o) {
    const el = o.el, apps = o.apps;
    let wifi = true, i = -1, guess = null, right = 0, lock = false, phase = "switch";
    function screen() {
      const app = i >= 0 && i < apps.length ? apps[i] : null;
      if (phase === "switch" || phase === "end") return '<div class="appgrid">' + apps.map((a) => '<span class="appicon"><span class="cpic" aria-hidden="true">' + small(a.pic) + "</span>" + esc(a.label) + "</span>").join("") + "</div>";
      if (phase === "result" && app) {
        const works = !app.needs || wifi;
        return works ? '<div class="appopen works"><span class="cpic" aria-hidden="true">' + small(app.pic) + "</span><b>" + esc(app.label) + "</b><p>It works!</p></div>"
          : '<div class="appopen broken"><span class="cpic spin" aria-hidden="true">⏳</span><b>No internet</b><p>' + esc(app.label) + " cannot load.</p></div>";
      }
      return '<div class="appopen"><span class="cpic" aria-hidden="true">' + small(app.pic) + "</span><b>" + esc(app.label) + "</b><p>" + (phase === "try" ? "Tap Try it." : "Will it work?") + "</p></div>";
    }
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide">' + tablet(screen(), '<button type="button" class="wifi' + (wifi ? " on" : "") + '" id="' + el.stage + 'w" aria-pressed="' + wifi + '">' + (wifi ? "\u{1F4F6} Internet ON" : "\u{1F4F4} Internet OFF") + "</button>") +
        (phase === "try" ? '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'try">Try it</button></div>' : "") + "</div>";
      $(el.score).textContent = i >= 0 && i < apps.length ? "App " + (i + 1) + " of " + apps.length : "";
      $(el.stage + "w").addEventListener("click", toggle);
      const tr = $(el.stage + "try"); if (tr) tr.addEventListener("click", tryIt);
    }
    function toggle() {
      if (lock) return;
      wifi = !wifi; SOUND.play(wifi ? "ding" : "click", 0.4);
      if (phase === "switch" && !wifi) {
        const line = "The internet is off. Now let us see which apps still work.";
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        setTimeout(nextApp, 2200);
        return;
      }
      if (phase === "end" && wifi) {
        draw();
        reportScore(o.finish, right, apps.length);
        endStep(o, "Internet on: everything works again. " + o.done);
        return;
      }
      draw();
      if (phase !== "switch" && phase !== "end") { const line = wifi ? "Keep the internet OFF for this test. Switch it off again." : "Off. Good."; $(el.fb).className = "fb"; $(el.fb).textContent = line; say(line); }
    }
    function nextApp() {
      i++; guess = null;
      if (i >= apps.length) {
        phase = "end"; draw();
        $(el.ask).innerHTML = "Now switch the internet back <b>ON</b>.";
        $(el.fb).textContent = ""; $(el.fb).className = "fb";
        sayHere(o.finish, "Now switch the internet back on.");
        return;
      }
      phase = "predict"; draw();
      const app = apps[i];
      $(el.ask).innerHTML = "The internet is off. Will <b>" + esc(app.label) + "</b> still work?";
      $(el.ch).className = "choices";
      $(el.ch).innerHTML = '<button type="button" class="choice text" data-g="1">Yes, it will work</button><button type="button" class="choice text" data-g="0">No, it needs the internet</button>';
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      sayHere(o.finish, "The internet is off. Will " + app.label + " still work?");
    }
    function tryIt() {
      if (lock || phase !== "try") return;
      lock = true; phase = "result"; draw();
      const app = apps[i], works = !app.needs;
      SOUND.play(works ? "ding" : "error", 0.4);
      const hit = guess === works;
      if (hit) right++;
      const line = (hit ? cheer() + " You predicted it. " : "Different from your prediction. ") + app.why;
      $(el.fb).className = "fb " + (hit ? "good" : "bad"); $(el.fb).textContent = line; say(line);
      setTimeout(() => { lock = false; nextApp(); }, 3400);
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest("[data-g]"); if (!b || phase !== "predict") return;
      guess = b.dataset.g === "1";
      $(el.ch).innerHTML = ""; phase = "try"; draw();
      $(el.ask).innerHTML = "You predict: <b>" + esc(b.textContent) + "</b>. Now tap <b>Try it</b>.";
      $(el.fb).textContent = "";
      say("You predict: " + b.textContent + ". Now tap Try it.");
    });
    draw();
  }

  /* ---- inputs and outputs (1CS.03, 1CS.04) ------------------------------
     The computer sits in the middle. Tap a device: an input sends
     something IN and the screen shows it arriving; an output takes
     something OUT and the device shows it leaving. After enough taps,
     three quick questions: input or output? */
  function inputOutput(o) {
    const el = o.el, devs = o.devices, tapped = new Set(), need = Math.min(o.need || devs.length, devs.length);
    let lock = false, asked = false, qi = 0, right = 0;
    const qs = shuffle(devs).slice(0, 3);
    function draw(active, badge) {
      const d = active && devs.find((x) => x.id === active);
      $(el.stage).innerHTML = '<div class="stagewide"><div class="io"><div class="iodevs">' + devs.map((x) =>
        '<button type="button" class="tapcard iodev' + (tapped.has(x.id) ? " heard" : "") + (active === x.id ? " now" : "") + '" data-id="' + x.id + '"' + (asked ? " disabled" : "") + '><span class="cpic" aria-hidden="true">' + small(x.pic) + "</span>" + esc(x.label) + "</button>").join("") + "</div>" +
        '<div class="computer"><div class="cscreen" id="' + el.stage + 'scr">' + (d ? (d.kind === "input" ? '<span class="flow in" aria-hidden="true">⬇️ IN</span><span class="shows">' + small(d.shows) + "</span>" : '<span class="flow out" aria-hidden="true">⬆️ OUT</span><span class="shows">' + small(d.shows) + "</span>") : '<span class="shows dim">the computer</span>') + "</div>" +
        '<div class="cbase"></div>' + (badge ? '<span class="iobadge ' + d.kind + '">' + (d.kind === "input" ? "INPUT: information goes IN" : "OUTPUT: information comes OUT") + "</span>" : "") + "</div></div></div>";
      $(el.score).textContent = asked ? "Question " + (qi + 1) + " of " + qs.length : tapped.size + " of " + need + " tried";
    }
    function ask() {
      asked = true; lock = false; draw(null, false);
      const d = qs[qi];
      $(el.ask).innerHTML = "Is the <b>" + esc(d.label) + "</b> an input or an output?";
      $(el.ch).className = "choices";
      $(el.ch).innerHTML = '<button type="button" class="choice text" data-kind="input">Input: information goes in</button><button type="button" class="choice text" data-kind="output">Output: information comes out</button>';
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      sayHere(o.finish, "Is the " + d.label + " an input or an output?");
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".iodev"); if (!b || lock || asked) return;
      const d = devs.find((x) => x.id === b.dataset.id);
      lock = true; tapped.add(d.id); SOUND.play(d.sound || (d.kind === "input" ? "type" : "print"), 0.4);
      draw(d.id, true);
      $(el.fb).className = "fb"; $(el.fb).innerHTML = "<b>" + esc(d.label) + "</b> — " + esc(d.does);
      say(d.label + ". " + d.does + (d.kind === "input" ? " Information goes in. It is an input." : " Information comes out. It is an output."));
      reportAttempt(o.finish, tapped.size, need, "devices");
      setTimeout(() => { lock = false; if (tapped.size >= need) { $(el.fb).textContent = ""; ask(); } }, 2600);
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest("[data-kind]"); if (!b || lock || !asked) return;
      lock = true;
      const d = qs[qi], ok = b.dataset.kind === d.kind;
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.kind === d.kind) c.classList.add("right"); });
      if (!ok) b.classList.add("wrong"); else right++;
      const line = (ok ? cheer() + " " : "Not quite. ") + "The " + d.label + " is an " + d.kind + ": " + d.does;
      $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = line; say(line);
      qi++;
      setTimeout(() => {
        if (qi >= qs.length) { reportScore(o.finish, right, qs.length); endStep(o); }
        else ask();
      }, 2800);
    });
    draw(null, false);
  }

  /* ---- one computer, many programs (1CS.02) ---------------------------
     A tablet home screen. Every icon opens a different program, and each
     program does its own small real thing - paint dots, catch a ball,
     type a word, play a film, call Grandma, search for lions. Home goes
     back. Opening enough of them earns the step; a question can follow. */
  const APPS = {
    paint: (box, api) => {
      let n = 0; const cols = ["#F4C95D", "#35BFB2", "#E9744F", "#B78BD1", "#4FD1A0"];
      box.innerHTML = '<div class="canvas" id="' + api.id + 'cv" aria-label="A painting canvas: tap to paint a dot"></div><div class="bigbtns"><button type="button" class="big small ghost" id="' + api.id + 'clr">Clear</button></div>';
      const cv = $(api.id + "cv");
      cv.addEventListener("click", (e) => {
        const r = cv.getBoundingClientRect(); const d = document.createElement("span"); d.className = "dot";
        d.style.left = (e.clientX - r.left - 14) + "px"; d.style.top = (e.clientY - r.top - 14) + "px"; d.style.background = cols[n++ % cols.length];
        cv.appendChild(d); SOUND.play("pop", 0.25);
      });
      $(api.id + "clr").addEventListener("click", () => { cv.innerHTML = ""; SOUND.play("whoosh", 0.3); });
    },
    game: (box, api) => {
      let score = 0;
      box.innerHTML = '<div class="canvas game" id="' + api.id + 'gm"><button type="button" class="ball" id="' + api.id + 'ball" aria-label="Catch the ball">⚽</button></div><p class="sub" id="' + api.id + 'sc">Catch the ball: 0</p>';
      const ball = $(api.id + "ball");
      const move = () => { ball.style.left = (10 + Math.random() * 75) + "%"; ball.style.top = (10 + Math.random() * 65) + "%"; };
      move();
      ball.addEventListener("click", () => { score++; $(api.id + "sc").textContent = "Catch the ball: " + score; SOUND.play("boing", 0.3); move(); });
    },
    write: (box, api) => {
      let text = "";
      box.innerHTML = '<div class="page" id="' + api.id + 'pg" aria-live="polite">|</div><div class="bigbtns"><button type="button" class="big small teal" id="' + api.id + 'hello">Type Hello</button><button type="button" class="big small ghost" id="' + api.id + 'del">Delete</button></div>';
      const pg = $(api.id + "pg");
      $(api.id + "hello").addEventListener("click", () => {
        const word = (text ? " " : "") + "Hello"; let k = 0;
        const t = setInterval(() => { text += word[k]; pg.textContent = text + "|"; SOUND.play("type", 0.4); k++; if (k >= word.length) clearInterval(t); }, 140);
      });
      $(api.id + "del").addEventListener("click", () => { text = text.slice(0, -1); pg.textContent = text + "|"; SOUND.play("click", 0.3); });
    },
    video: (box, api) => {
      const frames = ["\u{1F418}", "\u{1F981}", "\u{1F412}", "\u{1F993}"]; let k = 0, t = null;
      box.innerHTML = '<div class="canvas video"><span class="vframe" id="' + api.id + 'vf" aria-hidden="true">' + frames[0] + '</span><div class="vbar"><i id="' + api.id + 'vb"></i></div></div><div class="bigbtns"><button type="button" class="big small teal" id="' + api.id + 'play">&#9654; Play</button></div>';
      const btn = $(api.id + "play");
      btn.addEventListener("click", () => {
        if (t) { clearInterval(t); t = null; btn.innerHTML = "&#9654; Play"; return; }
        btn.textContent = "Pause";
        t = setInterval(() => { k = (k + 1) % frames.length; $(api.id + "vf").textContent = frames[k]; $(api.id + "vb").style.width = ((k + 1) * 25) + "%"; }, 800);
      });
      api.onClose(() => { if (t) clearInterval(t); });
    },
    call: (box, api) => {
      box.innerHTML = '<div class="canvas call"><span class="cpic" aria-hidden="true">\u{1F475}\u{1F3FE}</span><b>Grandma</b><p class="pbubble" id="' + api.id + 'cb" hidden></p></div><div class="bigbtns"><button type="button" class="big small teal" id="' + api.id + 'ring">\u{1F4DE} Call</button></div>';
      $(api.id + "ring").addEventListener("click", () => { SOUND.play("ring", 0.4); setTimeout(() => { const b = $(api.id + "cb"); if (b) { b.hidden = false; b.textContent = "Hello! How was school today?"; say("Hello! How was school today?"); } }, 1200); });
    },
    search: (box, api) => {
      box.innerHTML = '<div class="searchbox"><span class="q" id="' + api.id + 'q">|</span><button type="button" class="big small teal" id="' + api.id + 'go">Search lions</button></div><div class="result" id="' + api.id + 'res" hidden><b>\u{1F981} Lions</b><p>Lions live in Africa and India. A lion\'s roar can be heard five miles away.</p></div>';
      $(api.id + "go").addEventListener("click", () => {
        const q = $(api.id + "q"); let text = "", k = 0;
        const t = setInterval(() => { text += "lions"[k]; q.textContent = text + "|"; SOUND.play("type", 0.4); k++; if (k >= 5) { clearInterval(t); setTimeout(() => { $(api.id + "res").hidden = false; SOUND.play("ding", 0.4); say("Lions live in Africa and India."); }, 500); } }, 150);
      });
    },
  };
  function appScreen(o) {
    const el = o.el, apps = o.apps, opened = new Set(), need = Math.min(o.need || apps.length, apps.length);
    let open = null, closer = null, finished = false;
    function home() {
      if (closer) { try { closer(); } catch (_) { /* nothing */ } closer = null; }
      open = null;
      $(el.stage).innerHTML = '<div class="stagewide">' + tablet('<div class="appgrid">' + apps.map((a) =>
        '<button type="button" class="appicon' + (opened.has(a.id) ? " opened" : "") + '" data-app="' + a.id + '"><span class="cpic" aria-hidden="true">' + small(a.pic) + "</span>" + esc(a.label) + "</button>").join("") + "</div>", "Home") + "</div>";
      $(el.score).textContent = opened.size + " of " + need + " programs opened";
    }
    function openApp(a) {
      open = a.id; opened.add(a.id);
      $(el.stage).innerHTML = '<div class="stagewide">' + tablet('<div class="appbody" id="' + el.stage + 'app"></div>',
        '<button type="button" class="homebtn" id="' + el.stage + 'home">\u{1F3E0} Home</button><span class="apptitle">' + esc(a.label) + "</span>") + "</div>";
      const api = { id: el.stage + a.id, onClose: (fn) => { closer = fn; } };
      APPS[a.screen]($(el.stage + "app"), api);
      $(el.stage + "home").addEventListener("click", home);
      SOUND.play("pop", 0.3);
      $(el.fb).className = "fb"; $(el.fb).innerHTML = "<b>" + esc(a.label) + "</b> — " + esc(a.say);
      say(a.label + ". " + a.say);
      reportAttempt(o.finish, opened.size, need, "programs");
      $(el.score).textContent = opened.size + " of " + need + " programs opened";
      if (opened.size >= need && !finished) {
        finished = true;
        setTimeout(() => {
          $(el.fb).textContent = "";
          if (o.then) askOnce(o, o.then, (ok) => { reportScore(o.finish, ok ? 1 : 0, 1); endStep(o); });
          else endStep(o);
        }, 3600);
      }
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest("[data-app]"); if (!b || open) return;
      openApp(apps.find((a) => a.id === b.dataset.app));
    });
    home();
  }

  /* ---- ask a computing device the right way (1MD.01) ------------------
     A question card; the child picks which app or tool answers that kind
     of question, and the phone shows the answer. A weather question is
     not a map question, and a "how many in our class" question is
     answered by our own table, not by the whole internet. */
  function askDevice(o) {
    const el = o.el, ways = o.ways;
    let i = 0, right = 0, missed = false, lock = false;
    /* draw takes the question explicitly: the result is painted on a timer
       after `i` has already moved on, and reading o.questions[i] there showed
       the NEXT card with this answer and threw past the last one */
    function draw(result, q) {
      q = q || o.questions[i];
      $(el.stage).innerHTML = '<div class="stagewide"><div class="phone"><div class="qcard"><span class="cpic" aria-hidden="true">' + small(q.pic) + "</span><b>" + esc(q.ask) + "</b></div>" +
        '<div class="pscreen">' + (result ? '<span class="cpic" aria-hidden="true">' + small(result.pic) + '</span><p>' + esc(q.result) + "</p>" : '<p class="dim">Which app would answer this?</p>') + "</div></div></div>";
      $(el.score).textContent = "Question " + (i + 1) + " of " + o.questions.length;
    }
    function ask() {
      lock = false; missed = false;
      const q = o.questions[i];
      draw(null);
      $(el.ask).innerHTML = "<b>" + esc(q.ask) + "</b> Which would you use to find out?";
      $(el.ch).className = "choices";
      $(el.ch).innerHTML = shuffle(ways).map((w) => '<button type="button" class="choice pic" data-way="' + w.id + '"><span class="cpic" aria-hidden="true">' + small(w.pic) + "</span>" + esc(w.label) + "</button>").join("");
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      sayHere(o.finish, q.ask + " Which would you use to find out?");
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest("[data-way]"); if (!b || lock) return;
      const q = o.questions[i], w = ways.find((x) => x.id === b.dataset.way);
      if (w.id === q.answer) {
        lock = true; if (!missed) right++;
        $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
        SOUND.play("send", 0.4);
        setTimeout(() => { draw(w, q); SOUND.play("ding", 0.4); }, 600);
        const line = cheer() + " " + q.why;
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line + " " + q.result);
        i++;
        setTimeout(() => {
          if (i >= o.questions.length) { reportScore(o.finish, right, o.questions.length); endStep(o, "You asked " + o.questions.length + " questions, each the right way. " + o.done); }
          else ask();
        }, 4200);
      } else {
        missed = true; b.classList.add("wrong"); b.disabled = true; SOUND.play("error", 0.3);
        const line = (w.wrong || "The " + w.label + " answers a different kind of question.") + " Try another.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    });
    ask();
  }

  /* ==================================================================
     THE UNIT SHELL - seven steps drawn AROUND every lesson (owner,
     2026-09-10, for every standalone build), the furniture the English
     Grade 1 build carries around a unit: what it is about, a lecture,
     the words, games, things to do at home, a placeholder for Computing
     world, and the student-resources drawer. _shell.py decides where they
     sit and what they carry; these only draw. Lifted from the Science
     kit with the subject's words changed and nothing else.

     Three of them tick themselves off - the overview and Computing world
     on arrival, the drawer on first opening - for the reason the English
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
    if (c.words) bits.push(c.words + " computing words");
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

  /* ---- the computing words: hear each one, then show you know them ---- */
  function computingWords(o) {
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
            $(el.ask).innerHTML = "You know " + right + " of " + items.length + " computing words.";
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

  /* ---- Computing world: a placeholder that says it is one ---- */
  function computingWorld(o) {
    const el = o.el;
    $(el.stage).className = "stagewide";
    $(el.stage).innerHTML =
      '<div class="world"><div class="pic" aria-hidden="true">\u{1F30D}</div>' +
      '<h3 class="lec-h">Computing world is being built</h3>' +
      '<p class="lec-p">This part of <b>' + esc(o.title || "the lesson") + "</b> is not here yet. When it is, it will show:</p>" +
      '<ul class="ovw-list">' + (o.soon || []).map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>" +
      '<p class="lec-note">Nothing to do here. It ticks itself off.</p></div>';
    $(el.score).textContent = "coming soon";
    finish(o.finish, o.done);
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

  /* ---- things to do at home, unplugged: real projects, ticked when done ---- */
  function homeProjects(o) {
    const el = o.el;
    const items = o.items || [];
    const did = new Array(items.length).fill(false);
    const id = el.stage + "h";
    function paint() {
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="acts" id="' + id + '">' + items.map((it, k) =>
        '<div class="act' + (did[k] ? " did" : "") + '" data-k="' + k + '">' +
        '<div class="act-head"><span class="act-n">' + it.n + "</span><span class=\"act-kind\">unplugged</span>" +
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
      { id: "words", icon: "\u{1F524}", title: "Computing words", blurb: "This lesson's words, what they mean, and a voice to hear them." },
      { id: "finder", icon: "\u{1F50E}", title: "Word finder", blurb: "Look up any computing word from any lesson in " + (o.gradeLabel || "this grade") + "." },
      { id: "home", icon: "\u{1F3E0}", title: "Unplugged at home", blurb: "This lesson's projects, to do with a grown-up and no screen." },
      { id: "teaches", icon: "\u{1F46A}", title: "For your grown-up", blurb: "What this lesson teaches, in the words of the Cambridge framework." },
      { id: "strands", icon: "\u{1F9E9}", title: "What computing covers", blurb: "The five parts of primary computing, and what each one is." },
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
        panel("Computing words", '<div class="wordlist">' + wordRows(o.words || [], false) + "</div>",
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
          '<div class="teaches"><p class="lec-p">Lesson ' + o.lessonNo + " teaches these objectives of Cambridge Primary Computing 0059. The code is the framework’s own.</p><ul class=\"ovw-list codes\">" +
          (o.teaches || []).map((t) => "<li><code>" + esc(t.code) + "</code> " + esc(t.text) + "</li>").join("") + "</ul></div>",
          '<span class="book-page-count">' + (o.teaches || []).length + " objectives</span>");
        return;
      }
      if (which === "strands") {
        panel("What computing covers",
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
