  /* ==================================================================
     THE ART & DESIGN ACTIVITIES

     The Mathematics build's own rounds are one function per idea, each
     drawing into one slide's ids and calling finish(i) when the child has
     done the thing. These are the same shape, and there are fourteen of
     them rather than one generic renderer for the reason there are
     twenty-one in Global Perspectives: a step is a KIND of doing, and a
     renderer that covers every kind covers none of them well.

     What is Art-and-Design-shaped about them is that the child DOES the
     art on the screen rather than being told about it. Two paint pots
     are tapped and the mixed colour appears, computed from a table the
     builder holds too (E.02, M.01); marks are made on a canvas with a
     real pointer and the page judges the stroke by its own geometry
     (E.03, M.01); swatches are put in order by their own lightness
     (E.01); a pattern is continued and then invented, and an invented
     pattern counts only if it repeats (E.01, TWA.01); a material is
     chosen for a purpose because its PROPERTY is what the purpose needs
     (M.02); two works are compared and "both" and "only one" are set
     arithmetic on what each contains (R.02); a kind comment has to name
     something that is actually in the friend's work (R.01); a piece
     with a problem is refined by the change whose effect is what it
     needs (TWA.03); paint is changed by adding rice or flour or sugar or
     water, predicted first and seen after (TWA.02); and the journal at
     the end reads the page's OWN record of what the child made (R.01).
     Where the child's own feeling or idea is the answer, the page marks
     nothing and reads it back.

     Sound is synthesised, not recorded, exactly as in Science, Computing
     and Global Perspectives. The voice engine speaks everything else.
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
  const lower1 = (s) => { s = String(s || ""); return s ? s[0].toLowerCase() + s.slice(1) : s; };
  const cap1 = (s) => { s = String(s || ""); return s ? s[0].toUpperCase() + s.slice(1) : s; };
  const noDot = (s) => String(s || "").replace(/[.!]\s*$/, "");

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
     `okOf` decides which option is right, so a renderer can key by a
     computed relationship rather than by a flag. */
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
     for this subject: a pop for a card, a ding for a good answer, a dab
     for a sponge, a swish for a brush, a squelch for clay.
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
      dab: (c, t, m) => { noise(c, t, 0.06, 0.45, m, 600); },
      swish: (c, t, m) => { noise(c, t, 0.35, 0.28, m, 1200); osc(c, "sine", 700, 300, t, 0.3, 0.12, m); },
      squelch: (c, t, m) => { osc(c, "sine", 160, 60, t, 0.28, 0.5, m); noise(c, t + 0.05, 0.12, 0.3, m); },
      stir: (c, t, m) => { for (let k = 0; k < 3; k++) noise(c, t + k * 0.14, 0.1, 0.25, m, 800); },
      rustle: (c, t, m) => { noise(c, t, 0.2, 0.3, m, 3000); },
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
     THE TABLES the builder holds too (lesson-kit/_rules.py). The
     builder reads these out of this file by regex and refuses to build
     if they disagree with its own, so a colour the page makes is the
     colour the gate expects.
     ================================================================== */
  const HEX = {
    "red": "#E0312B", "yellow": "#F6C700", "blue": "#2D6CDF",
    "white": "#FFFFFF", "black": "#1B1B1B",
    "orange": "#F28C28", "purple": "#7B3FA0", "green": "#3FA34D",
    "pink": "#F5A3B7", "light blue": "#9CC8F0", "light yellow": "#FBE99A",
    "light orange": "#F9C89A", "light purple": "#C7A3DD", "light green": "#A6DBA0",
    "dark red": "#8B1A14", "dark blue": "#1B3A75", "dark yellow": "#A08A00",
    "dark orange": "#A5560F", "dark purple": "#46215E", "dark green": "#1F5E2A",
    "brown": "#7A4A2A", "grey": "#8A8F94",
  };
  const MIX = {
    "blue+red": "purple",
    "red+yellow": "orange",
    "blue+yellow": "green",
    "black+white": "grey",
  };
  const TINT = { "red": "pink", "yellow": "light yellow", "blue": "light blue", "orange": "light orange", "purple": "light purple", "green": "light green", "white": "white", "black": "grey" };
  const SHADE = { "red": "dark red", "yellow": "dark yellow", "blue": "dark blue", "orange": "dark orange", "purple": "dark purple", "green": "dark green", "black": "black", "white": "grey" };
  function mixOf(a, b) {
    if (a === b) return a;
    const key = [a, b].sort().join("+");
    if (MIX[key]) return MIX[key];
    if (a === "white" || b === "white") return TINT[a === "white" ? b : a] || null;
    if (a === "black" || b === "black") return SHADE[a === "black" ? b : a] || null;
    return null;
  }
  const TEXTURE = {
    "rice": "bumpy",
    "flour": "thick",
    "sugar": "gritty",
    "water": "runny",
    "sand": "rough",
    "glue": "shiny",
  };
  const hexOf = (name) => HEX[name] || "#999";
  const inkOn = (hex) => { const h = hex.replace("#", ""); const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 150 ? "#142B3E" : "#fff"; };
  const swatchSvg = (hex, size) => '<svg viewBox="0 0 40 40" width="' + (size || 40) + '" height="' + (size || 40) + '" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="' + hex + '" stroke="rgba(0,0,0,0.25)" stroke-width="2"/></svg>';

  /* ==================================================================
     THE JOURNAL - the page's own record of what the child made.
     Every making step writes a line here as the child makes the thing;
     the journal step at the end reads it back. One log per page: a
     lesson is one page, so there is nothing to key it by.
     ================================================================== */
  const JOURNAL = window.__artJournal = window.__artJournal || [];
  function jot(entry) { JOURNAL.push(Object.assign({ at: JOURNAL.length }, entry)); }

  /* ==================================================================
     SCENES - the artworks the child looks at, and the pictures a step
     draws. Each is a function of a `state` string, so a piece with a
     problem can be drawn before and after it is refined. Art from
     different times and cultures is drawn IN THE MANNER of traditional
     and ancient art - a cave wall, a woven basket, a patterned cloth, a
     carved mask, a tiled wall, a dot painting - never as a copy of a
     named living artist's work. The rest are children's paintings.
     ================================================================== */
  const T = (x, y, size, glyph) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + size + '">' + glyph + "</text>";
  const LABEL = (x, y, t) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="#fff" font-size="15" font-family="Inter, sans-serif" font-weight="800">' + esc(t) + "</text>";
  const SKY = (h, col) => '<rect width="320" height="' + h + '" fill="' + (col || "#BFE3F5") + '"/>';
  const GROUND = (y, col) => '<rect x="0" y="' + y + '" width="320" height="' + (240 - y) + '" fill="' + (col || "#3E8E4A") + '"/>';
  const SCENES = {
    /* a cave wall: ochre, handprints, an animal outline, dots */
    cave: { label: "A painting on a cave wall, from long ago", draw: () =>
      '<rect width="320" height="240" fill="#C9A06B"/><path d="M0 0 q80 40 160 10 t160 20 v210 h-320z" fill="#B8894F" opacity="0.6"/>' +
      '<g fill="#8B2E1B" opacity="0.85"><path d="M40 110 c-6-14 2-26 8-30 l4 14 c4-16 12-18 16-14 l-2 16 c6-12 14-10 16-4 l-6 14 c8-6 14-2 12 6 l-10 12 c6 0 10 6 6 12 l-18 10 c-10 4-20 0-24-10z"/><path d="M250 60 c-6-14 2-26 8-30 l4 14 c4-16 12-18 16-14 l-2 16 c6-12 14-10 16-4 l-6 14 c8-6 14-2 12 6 l-10 12 c6 0 10 6 6 12 l-18 10 c-10 4-20 0-24-10z"/></g>' +
      '<g fill="none" stroke="#3B2314" stroke-width="5" stroke-linecap="round"><path d="M110 170 q30-40 80-30 q30 6 40 30 q-6 10-20 8 l-6 24 M150 178 l-4 26 M185 172 l6 26 M120 172 l-6 26 M100 150 q-20 6-16 22"/></g>' +
      '<g fill="#3B2314"><circle cx="80" cy="200" r="3"/><circle cx="92" cy="206" r="3"/><circle cx="104" cy="200" r="3"/><circle cx="116" cy="206" r="3"/><circle cx="128" cy="200" r="3"/><circle cx="240" cy="120" r="3"/><circle cx="252" cy="126" r="3"/><circle cx="264" cy="120" r="3"/></g>' },
    /* a woven basket: over-under strips */
    basket: { label: "A woven basket", draw: () => {
      let g = '<rect width="320" height="240" fill="#F1E3C6"/>';
      for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) {
        const over = (r + c) % 2 === 0;
        g += '<rect x="' + (c * 40) + '" y="' + (r * 40) + '" width="40" height="40" fill="' + (over ? "#A9552B" : "#D9A15A") + '"/>';
        g += '<rect x="' + (c * 40 + (over ? 0 : 14)) + '" y="' + (r * 40 + (over ? 14 : 0)) + '" width="' + (over ? 40 : 12) + '" height="' + (over ? 12 : 40) + '" fill="' + (over ? "#7A3A1C" : "#B8863E") + '" opacity="0.6"/>';
      }
      return g + '<path d="M0 0 h320 v240 h-320z" fill="none" stroke="#5C3A1E" stroke-width="10"/>';
    } },
    /* a patterned cloth: bright stripes and small shapes */
    cloth: { label: "A patterned cloth", draw: () => {
      const cols = ["#E0312B", "#F6C700", "#3FA34D", "#1B1B1B", "#F6C700", "#E0312B"];
      let g = "";
      cols.forEach((c, k) => { g += '<rect x="0" y="' + (k * 40) + '" width="320" height="40" fill="' + c + '"/>'; });
      for (let k = 0; k < 8; k++) g += '<rect x="' + (k * 40 + 12) + '" y="52" width="16" height="16" fill="#1B1B1B"/><rect x="' + (k * 40 + 12) + '" y="172" width="16" height="16" fill="#1B1B1B"/>';
      for (let k = 0; k < 8; k++) g += '<path d="M' + (k * 40 + 20) + ' 128 l10 12 l-10 12 l-10-12z" fill="#F6C700"/>';
      return g;
    } },
    /* a carved mask: a face, lines cut in, dots */
    mask: { label: "A carved wooden mask", draw: () =>
      '<rect width="320" height="240" fill="#2B2B2B"/><ellipse cx="160" cy="120" rx="80" ry="105" fill="#8B5A2B"/><ellipse cx="160" cy="120" rx="66" ry="92" fill="#A9552B"/>' +
      '<g fill="#2B2B2B"><ellipse cx="130" cy="95" rx="18" ry="10"/><ellipse cx="190" cy="95" rx="18" ry="10"/><path d="M148 150 h24 l-12 18z"/><rect x="130" y="170" width="60" height="8" rx="4"/></g>' +
      '<g stroke="#5C3A1E" stroke-width="4" fill="none"><path d="M110 60 q50-20 100 0"/><path d="M110 70 q50-20 100 0"/><path d="M110 200 q50 20 100 0"/><path d="M100 120 v40 M220 120 v40"/></g>' +
      '<g fill="#F6C700"><circle cx="160" cy="45" r="4"/><circle cx="145" cy="52" r="4"/><circle cx="175" cy="52" r="4"/><circle cx="105" cy="140" r="3"/><circle cx="215" cy="140" r="3"/></g>' },
    /* a tiled wall: blue and white stars and squares */
    tiles: { label: "A wall of patterned tiles", draw: () => {
      let g = '<rect width="320" height="240" fill="#F7F1E3"/>';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const x = c * 80, y = r * 80;
        g += '<rect x="' + x + '" y="' + y + '" width="80" height="80" fill="' + ((r + c) % 2 ? "#2D6CDF" : "#F7F1E3") + '" stroke="#1B3A75" stroke-width="2"/>';
        g += '<path d="M' + (x + 40) + ' ' + (y + 12) + ' l8 20 l22 2 l-17 14 l6 22 l-19-12 l-19 12 l6-22 l-17-14 l22-2z" fill="' + ((r + c) % 2 ? "#F7F1E3" : "#2D6CDF") + '"/>';
      }
      return g;
    } },
    /* a dot painting: rings of dots and a winding snake of dots */
    dots: { label: "A painting made of dots", draw: () => {
      let g = '<rect width="320" height="240" fill="#4A2A18"/>';
      const ring = (cx, cy, r, col, n) => { for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; g += '<circle cx="' + (cx + Math.cos(a) * r).toFixed(1) + '" cy="' + (cy + Math.sin(a) * r).toFixed(1) + '" r="4" fill="' + col + '"/>'; } };
      [[80, 80], [240, 70], [170, 170]].forEach(([cx, cy]) => { ring(cx, cy, 12, "#F6C700", 8); ring(cx, cy, 24, "#F28C28", 14); ring(cx, cy, 36, "#FFFFFF", 20); });
      for (let k = 0; k < 26; k++) { const x = 20 + k * 11.5, y = 200 + Math.sin(k / 2.2) * 18; g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4.5" fill="' + (k % 2 ? "#F28C28" : "#E0312B") + '"/>'; }
      return g;
    } },
    /* a child's painting: sun, tree, grass */
    sunpainting: { label: "A painting of a sunny day", draw: () =>
      SKY(240, "#9CC8F0") + GROUND(160, "#3FA34D") + '<circle cx="260" cy="50" r="28" fill="#F6C700"/>' +
      '<g stroke="#F6C700" stroke-width="5" stroke-linecap="round"><path d="M260 8 v12 M260 80 v12 M218 50 h12 M290 50 h12 M230 20 l8 8 M282 72 l8 8 M290 20 l-8 8 M238 72 l-8 8"/></g>' +
      '<rect x="80" y="110" width="22" height="60" fill="#7A4A2A"/><circle cx="91" cy="95" r="40" fill="#1F5E2A"/><circle cx="70" cy="110" r="26" fill="#3FA34D"/><circle cx="114" cy="112" r="24" fill="#3FA34D"/>' +
      '<g fill="#E0312B"><circle cx="150" cy="185" r="6"/><circle cx="190" cy="195" r="6"/><circle cx="230" cy="185" r="6"/></g><g stroke="#1F5E2A" stroke-width="3"><path d="M150 191 v18 M190 201 v14 M230 191 v18"/></g>' },
    /* a child's painting: the sea, wavy lines, a boat, fish */
    seapainting: { label: "A painting of the sea", draw: () =>
      SKY(240, "#BFE3F5") + '<rect x="0" y="120" width="320" height="120" fill="#2D6CDF"/>' +
      '<g fill="none" stroke="#9CC8F0" stroke-width="6" stroke-linecap="round"><path d="M0 150 q20-14 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/><path d="M0 190 q20-14 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/></g>' +
      '<path d="M120 130 h90 l-14 22 h-62z" fill="#A9552B"/><rect x="163" y="70" width="6" height="60" fill="#5C3A1E"/><path d="M169 74 l40 46 h-40z" fill="#F5F5F5"/>' +
      '<g fill="#F28C28"><path d="M40 210 q14-10 28 0 q-14 10-28 0z"/><path d="M68 210 l10-8 v16z"/><path d="M250 205 q14-10 28 0 q-14 10-28 0z"/><path d="M278 205 l10-8 v16z"/></g>' },
    /* a painting of a person: `flat` hair is paint, `wool` hair is collage */
    portrait: { label: "A painting of a person", draw: (state) =>
      '<rect width="320" height="240" fill="#FBE99A"/><rect x="100" y="150" width="120" height="90" rx="20" fill="#E0312B"/>' +
      '<circle cx="160" cy="105" r="52" fill="#D9A15A"/>' +
      (state === "wool"
        ? '<g fill="none" stroke="#3B2314" stroke-width="7" stroke-linecap="round"><path d="M110 80 q10-30 30-24 M125 62 q12-24 34-16 M150 50 q20-16 36 4 M180 56 q22-6 30 20 M200 74 q16 6 14 30"/><path d="M104 96 q-4 20 8 30 M216 96 q4 20-8 30"/></g><g fill="#7A4A2A"><circle cx="118" cy="72" r="6"/><circle cx="140" cy="54" r="6"/><circle cx="165" cy="46" r="6"/><circle cx="192" cy="54" r="6"/><circle cx="210" cy="74" r="6"/></g>'
        : '<path d="M108 100 q0-60 52-60 q52 0 52 60 q-20-30-52-30 q-32 0-52 30z" fill="#3B2314"/>') +
      '<g fill="#142B3E"><circle cx="142" cy="102" r="6"/><circle cx="178" cy="102" r="6"/></g><path d="M140 128 q20 16 40 0" fill="none" stroke="#8B1A14" stroke-width="5" stroke-linecap="round"/>' },
    /* a painting of a house: `runny` sky drips, `fixed` sky does not */
    housepainting: { label: "A painting of a house", draw: (state) =>
      SKY(240, "#9CC8F0") + GROUND(170, "#3FA34D") +
      (state === "runny" ? '<g fill="#2D6CDF" opacity="0.8"><path d="M30 0 v90 q0 10 6 10 q6 0 6-10 v-90z"/><path d="M250 0 v120 q0 10 6 10 q6 0 6-10 v-120z"/><path d="M290 0 v70 q0 10 6 10 q6 0 6-10 v-70z"/></g>' : "") +
      '<rect x="100" y="90" width="120" height="90" fill="#F28C28"/><path d="M90 92 h140 l-70-52z" fill="#8B1A14"/><rect x="146" y="130" width="28" height="50" fill="#7A4A2A"/><rect x="112" y="106" width="24" height="24" fill="#9CC8F0" stroke="#fff" stroke-width="3"/><rect x="184" y="106" width="24" height="24" fill="#9CC8F0" stroke="#fff" stroke-width="3"/>' +
      (state === "fixed" ? '<circle cx="270" cy="40" r="22" fill="#F6C700"/>' : "") },
    /* a vase of flowers */
    flowers: { label: "A painting of flowers in a vase", draw: () =>
      '<rect width="320" height="240" fill="#F7F1E3"/><path d="M120 140 h80 l-10 90 h-60z" fill="#2D6CDF"/>' +
      '<g stroke="#3FA34D" stroke-width="5" fill="none"><path d="M140 140 q-10-40 0-70 M160 140 q0-40 0-80 M180 140 q10-40 0-70"/></g>' +
      '<g fill="#F5A3B7"><circle cx="140" cy="62" r="16"/><circle cx="160" cy="52" r="16"/><circle cx="180" cy="62" r="16"/></g><g fill="#F6C700"><circle cx="140" cy="62" r="6"/><circle cx="160" cy="52" r="6"/><circle cx="180" cy="62" r="6"/></g>' },
    /* a night sky: dark blue, a moon, stars as dots */
    night: { label: "A painting of the night", draw: () =>
      '<rect width="320" height="240" fill="#1B3A75"/><circle cx="240" cy="60" r="30" fill="#FBE99A"/><circle cx="252" cy="52" r="26" fill="#1B3A75"/>' +
      '<g fill="#FFFFFF"><circle cx="40" cy="40" r="3"/><circle cx="90" cy="70" r="2"/><circle cx="140" cy="30" r="3"/><circle cx="60" cy="120" r="2"/><circle cx="180" cy="90" r="3"/><circle cx="110" cy="140" r="2"/><circle cx="280" cy="140" r="3"/><circle cx="220" cy="150" r="2"/></g>' +
      '<path d="M0 240 v-40 q40-30 80-10 q40 20 80 0 q40-20 80 10 q40 30 80 20 v20z" fill="#0B1D2C"/>' },
    /* a clay pot: `cracked` has a crack, `smooth` does not */
    claypot: { label: "A clay pot", draw: (state) =>
      '<rect width="320" height="240" fill="#F7F1E3"/><path d="M100 60 q60-30 120 0 q20 90-20 160 h-80 q-40-70-20-160z" fill="#B8703C"/><ellipse cx="160" cy="60" rx="60" ry="14" fill="#8B5A2B"/>' +
      (state === "cracked" ? '<path d="M150 90 l10 30 l-8 26 l14 30" fill="none" stroke="#3B2314" stroke-width="4"/>' : "") +
      '<g stroke="#5C3A1E" stroke-width="3" fill="none"><path d="M112 120 q48 16 96 0 M110 150 q50 16 100 0"/></g>' },
  };
  const sceneSvgOf = (name, state, extra) => {
    const sc = SCENES[name]; if (!sc) return "";
    return '<svg viewBox="0 0 320 240" class="artwork" role="img" aria-label="' + esc(sc.label) + '">' + sc.draw(state || "") + (extra || "") + "</svg>";
  };
  /* a work is a scene, or an emoji */
  const workHtml = (w, state) => w.scene ? sceneSvgOf(w.scene, state || w.state) : picHtml(w.pic);
  /* a scene with its spots drawn on it, the found ones haloed */
  function sceneSvg(name, spots, found, active) {
    const sc = SCENES[name];
    let g = sc.draw("");
    spots.forEach((sp) => {
      const on = found.has(sp.id), now = active === sp.id;
      g += '<g class="spot' + (on ? " found" : "") + (now ? " now" : "") + '" data-spot="' + esc(sp.id) + '" tabindex="0" role="button" aria-label="' + esc(sp.label) + (on ? ", found" : "") + '" transform="translate(' + sp.x + " " + sp.y + ')">' +
        '<circle r="' + ((sp.size || 34) * 0.8) + '" fill="' + (now ? "#F4C95D" : on ? "#35BFB2" : "rgba(255,255,255,0.55)") + '" stroke="' + (on || now ? "#fff" : "#2B5673") + '" stroke-width="3"/>' +
        T(0, (sp.size || 34) * 0.36, sp.size || 34, sp.glyph) + (on ? '<circle cx="18" cy="-18" r="9" fill="#4FD1A0"/><text x="18" y="-14" text-anchor="middle" font-size="12" fill="#06231F" font-weight="800">✓</text>' : "") + "</g>";
    });
    return '<svg viewBox="0 0 320 240" class="picsource" role="img" aria-label="' + esc(sc.label) + '">' + g + "</svg>";
  }

  /* ==================================================================
     RENDERERS shared with the Science, Computing and Global Perspectives
     kits, in spirit: tap cards, sorting, putting in order, a
     demonstration, a picture to look at.
     ================================================================== */

  /* ---- tap cards: hear each one, then (maybe) one question ---------- */
  function tapCards(o) {
    const el = o.el, heard = new Set();
    const need = Math.min(o.need || o.items.length, o.items.length);
    let asked = false, lock = false;
    /* a card shows an emoji, or one of the kit's drawn artworks (`scene`) */
    $(el.stage).innerHTML = '<div class="stagewide"><div class="cardsgrid' + (o.items.some((it) => it.scene) ? " artcards" : "") + '">' + o.items.map((it, k) =>
      '<button type="button" class="tapcard" data-k="' + k + '"><span class="cpic" aria-hidden="true">' + (it.scene ? sceneSvgOf(it.scene) : small(it.pic)) + "</span>" + esc(it.label) + (it.sub ? "<small>" + esc(it.sub) + "</small>" : "") + "</button>").join("") + "</div></div>";
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

  /* ---- sort each thing into a bin ------------------------------------ */
  function sortBins(o) {
    const el = o.el, items = shuffle(o.items), trays = {};
    let i = 0, right = 0, lock = false;
    o.bins.forEach((b) => { trays[b.id] = []; });
    const tray = (b) => '<span class="tray" aria-hidden="true">' + trays[b.id].map((it) => small(it.pic)).join("") + "</span>";
    function draw() {
      lock = false;
      const it = items[i];
      $(el.stage).innerHTML = '<div class="stagewide">' +
        '<div class="sortnow" id="' + el.stage + 'now">' + picHtml(it.pic) + '<span class="lab">' + esc(it.label) + "</span></div>" +
        '<div class="bins">' + o.bins.map((b) => '<button type="button" class="bin" data-b="' + b.id + '"><span class="bpic" aria-hidden="true">' + small(b.pic) + "</span>" + esc(b.label) + tray(b) + "</button>").join("") + "</div></div>";
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
          $(el.stage).querySelector(".sortnow").innerHTML = '<span class="lab">All sorted!</span>';
          $(el.stage).querySelectorAll(".bin").forEach((x) => { x.classList.remove("right", "wrong"); const bin = o.bins.find((bb) => bb.id === x.dataset.b); x.querySelector(".tray").outerHTML = tray(bin); });
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

  /* ---- put things in order (the tone ladder comes here, its items
     already in the computed order) ------------------------------------ */
  function order(o) {
    const el = o.el, items = o.items, placed = [];
    let lock = false, wrong = 0;
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide">' + (o.lead ? '<p class="phase">' + esc(o.lead) + "</p>" : "") + '<div class="orderrow">' +
        (placed.length ? placed.map((k, p) => '<span class="ordered"><b>' + (p + 1) + "</b>" + small(items[k].pic) + " " + esc(items[k].label) + "</span>").join('<span class="arrow" aria-hidden="true">&rarr;</span>') : '<span class="sub">' + esc(o.first || "Tap what comes first") + "</span>") +
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
          if (o.jot) jot(o.jot);
          setTimeout(() => {
            const line = "All " + items.length + " in the right order. " + o.done;
            $(el.fb).className = "fb good"; $(el.fb).textContent = line;
            reportScore(o.finish, Math.max(0, items.length - wrong), items.length);
            finish(o.finish, line);
          }, 2200);
        }
      } else {
        wrong++; b.classList.add("wrong");
        const hint = k < expect ? "That one is already placed." : (o.hint ? o.hint.replace("%s", items[k].label) : "Not yet. Something comes before " + items[k].label + ".");
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
      if (f.scene) return '<div class="sim">' + sceneSvgOf(f.scene.id, f.scene.state) + "</div>";
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

  /* ---- look at an artwork: find the things in it (E.01) ---------------
     A drawn artwork with things to find. Tapping one says what it is and
     what the artist did; after enough are found, one question asks about
     the work, keyed by a spot in the picture rather than by a flag. */
  function pictureSource(o) {
    const el = o.el, found = new Set(), need = Math.min(o.need || o.spots.length, o.spots.length);
    let active = null, lock = false, phase = "find";
    function draw() {
      $(el.stage).innerHTML = '<div class="stagewide"><div class="sim picbox">' + sceneSvg(o.scene, o.spots, found, active) + "</div>" +
        '<p class="sub">' + esc(o.caption || "Tap the things in the picture to find out about them.") + "</p></div>";
      $(el.score).textContent = found.size + " of " + need + " found";
    }
    function closing() {
      phase = "done"; active = null; draw(); $(el.fb).textContent = "";
      if (o.then) askOnce(o, o.then, (ok) => { reportScore(o.finish, ok ? 1 : 0, 1); endStep(o); }, (c) => !!c.spot);
      else endStep(o);
    }
    $(el.stage).addEventListener("click", (e) => {
      const g = e.target.closest("[data-spot]"); if (!g || lock || phase === "done") return;
      const sp = o.spots.find((s) => s.id === g.dataset.spot);
      found.add(sp.id); active = sp.id; SOUND.play("pop", 0.35); draw();
      $(el.fb).className = "fb"; $(el.fb).innerHTML = "<b>" + esc(sp.label) + "</b> — " + esc(sp.fact);
      say(sp.label + ". " + sp.fact);
      reportAttempt(o.finish, found.size, o.spots.length, "things");
      if (found.size >= need && phase === "find") {
        phase = "wait"; lock = true;
        setTimeout(() => { lock = false; closing(); }, 2600);
      }
    });
    $(el.stage).addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const g = e.target.closest("[data-spot]"); if (!g) return;
      e.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    draw();
  }

  /* ==================================================================
     EXPERIENCING and MAKING - colour, marks, tone, pattern, materials.
     ================================================================== */

  /* ---- mix two paints (E.02, M.01, R.02) --------------------------------
     A round names two pots. The child says what they think the mix will
     make, then taps the two pots; the bowl fills with the first colour,
     then swirls to the mix - computed, never authored - and the page says
     what happened. The last round is FREE: any two pots, read back and
     written to the journal, because that is the experimenting. */
  function colourMixer(o) {
    const el = o.el, pots = o.pots, rounds = o.rounds;
    let r = 0, phase = "predict", picked = null, poured = [], lock = false, score = 0, freeMixes = 0;
    const free = () => r >= rounds.length;
    const pot = (id) => pots.find((p) => p.id === id);
    function bowl(colour, swirl) {
      const hex = colour ? hexOf(colour) : "#F7F1E3";
      return '<svg viewBox="0 0 200 140" class="bowl' + (swirl ? " swirl" : "") + '" aria-hidden="true"><ellipse cx="100" cy="120" rx="80" ry="14" fill="rgba(0,0,0,0.2)"/><path d="M20 50 q80 110 160 0 z" fill="#D6E3DE"/><ellipse cx="100" cy="50" rx="80" ry="22" fill="#F7F1E3" stroke="#93AABE" stroke-width="3"/><ellipse cx="100" cy="52" rx="62" ry="15" fill="' + hex + '" class="paint"/></svg>';
    }
    function draw() {
      const rd = rounds[r];
      const want = free() ? null : [rd.a, rd.b];
      const bowlColour = poured.length === 2 ? mixOf(poured[0], poured[1]) : poured[0] || null;
      $(el.stage).innerHTML = '<div class="stagewide">' +
        (free() ? '<div class="wantcard"><span class="cpic" aria-hidden="true">\u{1F3A8}</span><div><p class="phase">Your turn</p><b>Mix any two pots you like.</b></div></div>'
          : '<div class="wantcard"><span class="cpic" aria-hidden="true">\u{1F3A8}</span><div><p class="phase">Mix</p><b>' + esc(cap1(rd.a)) + " and " + esc(rd.b) + "</b></div></div>") +
        '<div class="mixer"><div class="pots">' + pots.map((p) => '<button type="button" class="pot' + (poured.includes(p.id) ? " poured" : "") + (want && want.includes(p.id) ? " wanted" : "") + '" data-p="' + esc(p.id) + '"' + (phase === "predict" || lock ? " disabled" : "") + '><span class="paintpot" style="--c:' + hexOf(p.id) + '"></span>' + esc(p.label) + "</button>").join("") + "</div>" +
        '<div class="bowlwrap">' + bowl(bowlColour, poured.length === 2) + (bowlColour ? '<p class="bowlname">' + esc(bowlColour) + "</p>" : '<p class="bowlname dim">the bowl is empty</p>') + "</div></div>" +
        (free() ? '<div class="bigbtns"><button type="button" class="big small ghost" id="' + el.stage + 'again"' + (poured.length === 2 && !lock ? "" : " disabled") + '>Mix again</button><button type="button" class="big small" id="' + el.stage + 'done"' + (freeMixes >= 1 && !lock ? "" : " disabled") + ">I have finished mixing &#10003;</button></div>" : "") + "</div>";
      $(el.score).textContent = free() ? "Your own mixes: " + freeMixes : "Mix " + (r + 1) + " of " + rounds.length;
      const ag = $(el.stage + "again"); if (ag) ag.addEventListener("click", () => { poured = []; lock = false; draw(); $(el.fb).textContent = ""; });
      const dn = $(el.stage + "done"); if (dn) dn.addEventListener("click", () => { reportScore(o.finish, score, rounds.length); endStep(o, "You mixed " + rounds.length + " colours and made " + freeMixes + " of your own. " + o.done); });
    }
    function start() {
      poured = []; picked = null; lock = false;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.ch).innerHTML = ""; $(el.ch).className = "choices";
      if (free()) {
        phase = "pour"; draw();
        $(el.ask).innerHTML = "Now <b>you</b> choose. Tap any two pots and see what they make.";
        sayHere(o.finish, "Now you choose. Tap any two pots and see what they make.");
        return;
      }
      const rd = rounds[r];
      phase = "predict"; draw();
      $(el.ask).innerHTML = "We are going to mix <b>" + esc(rd.a) + "</b> and <b>" + esc(rd.b) + "</b>. What do you think it will make?";
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(rd.opts).map((c) => '<button type="button" class="choice text" data-c="' + esc(c) + '"><span class="cpic" aria-hidden="true">' + swatchSvg(hexOf(c), 28) + "</span> " + esc(c) + "</button>").join("");
      sayHere(o.finish, "We are going to mix " + rd.a + " and " + rd.b + ". What do you think it will make? Tap a colour.");
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || phase !== "predict") return;
      picked = b.dataset.c; SOUND.play("click", 0.3);
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("on");
      phase = "pour"; draw();
      const rd = rounds[r];
      $(el.ask).innerHTML = "You think <b>" + esc(picked) + "</b>. Now tap the <b>" + esc(rd.a) + "</b> pot, then the <b>" + esc(rd.b) + "</b> pot.";
      $(el.fb).className = "fb"; $(el.fb).textContent = "Let us see. Tap the " + rd.a + " pot first.";
      say("You think " + picked + ". Let us see. Tap the " + rd.a + " pot, then the " + rd.b + " pot.");
    });
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".pot"); if (!b || lock || phase !== "pour") return;
      const id = b.dataset.p;
      if (!free()) {
        const rd = rounds[r], want = poured.length === 0 ? rd.a : rd.b;
        if (id !== want) {
          SOUND.play("error", 0.3);
          const line = "That is the " + id + " pot. This time we mix " + rd.a + " and " + rd.b + ". Tap the " + want + " pot.";
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line); return;
        }
      }
      if (poured.includes(id)) { SOUND.play("click", 0.2); return; }
      poured.push(id); SOUND.play(poured.length === 1 ? "splash" : "stir", 0.5); draw();
      if (poured.length === 1) {
        $(el.fb).className = "fb"; $(el.fb).textContent = cap1(id) + " is in the bowl. Now the second pot.";
        say(cap1(id) + " is in the bowl. Now the second pot."); return;
      }
      lock = true;
      const made = mixOf(poured[0], poured[1]);
      if (free()) {
        freeMixes++; draw();
        const line = made ? cap1(poured[0]) + " and " + poured[1] + " made " + made + "." : cap1(poured[0]) + " and " + poured[1] + " made a muddy colour. Two mixed colours together often do.";
        jot({ kind: "mix", text: "mixed " + poured[0] + " and " + poured[1] + " and made " + (made || "mud"), pic: "\u{1F3A8}", hex: made ? hexOf(made) : "#6B5A4A" });
        sayLine(el, "<b>" + esc(line) + "</b> Mix again, or press I have finished.", line + " Mix again, or press I have finished mixing.");
        reportAttempt(o.finish, freeMixes, 1, "mixes");
        lock = false; draw();
        return;
      }
      const rd = rounds[r], ok = picked === made;
      if (ok) score++;
      jot({ kind: "mix", text: "mixed " + rd.a + " and " + rd.b + " and made " + made, pic: "\u{1F3A8}", hex: hexOf(made) });
      const line = (ok ? cheer() + " You said " + picked + ", and " : "You said " + picked + ". Look: ") + rd.a + " and " + rd.b + " made " + made + "! " + (rd.why || "");
      $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = line; say(line);
      r++;
      setTimeout(start, 4200);
    });
    start();
  }

  /* ---- make marks on a canvas (E.03, M.01) ------------------------------
     A real pointer draws on an SVG. Each tool leaves a different mark. A
     round asks for a KIND of mark and the page judges the stroke by its
     own geometry - length, how straight, how many times it turns back and
     how sharply - so a wavy line is a wavy line whoever drew it. A last
     round is free: draw anything, and stick it in the journal. */
  const CHECKS = {
    straight: (f) => f.len > 60 && f.straightness > 0.93,
    wavy: (f) => f.len > 110 && f.straightness < 0.95 && f.reversals >= 2 && f.sharp <= 1,
    zigzag: (f) => f.len > 90 && f.sharp >= 3,
    long: (f) => f.len > 220,
    short: (f) => f.len > 4 && f.len < 60,
    round: (f) => f.len > 90 && f.straightness < 0.35 && f.turning > 250,
    dots: (f) => f.dots >= 6,
    thick: (f) => f.len > 40 && f.width >= 10,
    thin: (f) => f.len > 40 && f.width <= 4,
  };
  const CHECK_HINT = {
    straight: "A straight line does not bend. Try again, in one steady go.",
    wavy: "A wavy line goes up and down, gently, like the sea. Try again.",
    zigzag: "A zigzag turns sharply, like this: up, down, up, down. Try again.",
    long: "Make it longer. Go right across the paper.",
    short: "Shorter! Just a little mark.",
    round: "Go all the way round, back to where you started.",
    dots: "Dots are little taps. Tap, tap, tap, at least six.",
    thick: "That mark is thin. Use the thick tool.",
    thin: "That mark is thick. Use the thin tool.",
  };
  const TOOLS = {
    pencil: { label: "Pencil", pic: "\u{270F}\u{FE0F}", colour: "#3B3B3B", width: 3, cap: "round", sound: "click" },
    brush: { label: "Brush", pic: "\u{1F58C}\u{FE0F}", colour: "#E0312B", width: 14, cap: "round", sound: "swish" },
    sponge: { label: "Sponge", pic: "\u{1F9FD}", colour: "#F6C700", width: 22, cap: "round", dashed: "1 30", sound: "dab" },
    chalk: { label: "Chalk", pic: "\u{1F9F1}", colour: "#F7F1E3", width: 7, cap: "butt", dashed: "3 3", sound: "rustle" },
    finger: { label: "Finger", pic: "\u{1F446}", colour: "#7B3FA0", width: 18, cap: "round", sound: "squelch" },
    crayon: { label: "Crayon", pic: "\u{1F58D}\u{FE0F}", colour: "#2D6CDF", width: 8, cap: "round", sound: "rustle" },
  };
  function strokeFeatures(pts, tool, session) {
    /* resample so a wobbling hand does not read as a hundred turns */
    const rs = [pts[0]];
    for (const p of pts) { const q = rs[rs.length - 1]; if (Math.hypot(p.x - q.x, p.y - q.y) >= 9) rs.push(p); }
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    const chord = Math.hypot(pts[pts.length - 1].x - pts[0].x, pts[pts.length - 1].y - pts[0].y);
    /* a REVERSAL is the curve changing the way it bends - the crest of a
       wave - and a smooth wave bends by only a degree or two per sample, so
       it is counted when the bend flips sign after turning at least 20
       degrees the other way; a wobble in a straight line never gets there */
    let turning = 0, sharp = 0, reversals = 0, runSign = 0, runTurn = 0;
    for (let i = 2; i < rs.length; i++) {
      const ax = rs[i - 1].x - rs[i - 2].x, ay = rs[i - 1].y - rs[i - 2].y, bx = rs[i].x - rs[i - 1].x, by = rs[i].y - rs[i - 1].y;
      const cross = ax * by - ay * bx, dot = ax * bx + ay * by;
      const ang = Math.abs(Math.atan2(cross, dot)) * 180 / Math.PI;
      turning += ang;
      if (ang > 70) sharp++;
      const sign = Math.abs(cross) < 1e-6 ? 0 : (cross > 0 ? 1 : -1);
      if (sign) {
        if (runSign && sign !== runSign) { if (runTurn > 20) reversals++; runTurn = 0; }
        runSign = sign; runTurn += ang;
      }
    }
    return { len, chord, straightness: len ? chord / len : 1, turning, sharp, reversals, width: TOOLS[tool].width, dots: session.dots };
  }
  function markMaker(o) {
    const el = o.el, rounds = o.rounds, tools = o.tools;
    let r = 0, tool = tools[0], strokes = [], live = null, lock = false, score = 0, missed = false;
    const session = { dots: 0 };
    const free = () => r >= rounds.length;
    const svgId = el.stage + "cv";
    function strokeSvg(s) {
      const t = TOOLS[s.tool];
      const d = s.pts.length === 1 ? "M" + s.pts[0].x + " " + s.pts[0].y + " l0.1 0" : "M" + s.pts.map((p) => p.x + " " + p.y).join(" L");
      return '<path d="' + d + '" fill="none" stroke="' + t.colour + '" stroke-width="' + t.width + '" stroke-linecap="' + t.cap + '" stroke-linejoin="round"' + (t.dashed ? ' stroke-dasharray="' + t.dashed + '"' : "") + ' opacity="0.92"/>';
    }
    function canvasSvg() {
      return '<svg viewBox="0 0 320 220" class="canvas" id="' + svgId + '" role="img" aria-label="Your paper"><rect width="320" height="220" fill="#FFFDF6"/>' + strokes.map(strokeSvg).join("") + "</svg>";
    }
    function draw() {
      const rd = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide">' +
        (free() ? '<div class="wantcard"><span class="cpic" aria-hidden="true">\u{1F3A8}</span><div><p class="phase">Your turn</p><b>Draw anything you like, with any tool.</b></div></div>'
          : '<div class="wantcard"><span class="cpic" aria-hidden="true">' + small(rd.pic || "\u270F\uFE0F") + '</span><div><p class="phase">With the ' + esc(TOOLS[rd.tool].label.toLowerCase()) + "</p><b>" + esc(rd.ask) + "</b></div></div>") +
        '<div class="toolrow">' + tools.map((t) => '<button type="button" class="toolbtn' + (tool === t ? " on" : "") + '" data-t="' + t + '"><span class="cpic" aria-hidden="true">' + TOOLS[t].pic + "</span>" + esc(TOOLS[t].label) + "</button>").join("") + "</div>" +
        '<div class="sim canvasbox">' + canvasSvg() + "</div>" +
        '<div class="bigbtns"><button type="button" class="big small ghost" id="' + el.stage + 'clear">Clean paper</button>' +
        (free() ? '<button type="button" class="big small" id="' + el.stage + 'stick"' + (strokes.length ? "" : " disabled") + ">Stick it in my journal &#10003;</button>" : "") + "</div></div>";
      $(el.score).textContent = free() ? strokes.length + " marks" : "Mark " + (r + 1) + " of " + rounds.length;
      $(el.stage + "clear").addEventListener("click", () => { strokes = []; session.dots = 0; draw(); });
      const st = $(el.stage + "stick");
      if (st) st.addEventListener("click", () => {
        jot({ kind: "marks", text: "made my own marks with the " + TOOLS[tool].label.toLowerCase(), pic: "\u270F\uFE0F", svg: '<svg viewBox="0 0 320 220"><rect width="320" height="220" fill="#FFFDF6"/>' + strokes.map(strokeSvg).join("") + "</svg>" });
        reportScore(o.finish, score, rounds.length);
        endStep(o, "You made " + rounds.length + " kinds of mark and a drawing of your own. " + o.done);
      });
      wire();
    }
    function point(ev) {
      const svg = $(svgId), rect = svg.getBoundingClientRect();
      return { x: Math.round((ev.clientX - rect.left) / rect.width * 320), y: Math.round((ev.clientY - rect.top) / rect.height * 220) };
    }
    /* THE SVG IS NEVER REPLACED MID-STROKE. The first version rebuilt the
       whole canvas from outerHTML on every pointer move, which threw away
       the element holding the pointer capture, so the pointerup landed on
       whatever was under the mouse and a stroke that ended near the paper's
       edge was never judged (found by the driver: a zigzag left no feedback
       at all). The live stroke is one <path> whose `d` is updated in place;
       a finished stroke stays as that element. */
    function pathEl(s) {
      const t = TOOLS[s.tool], p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("fill", "none"); p.setAttribute("stroke", t.colour); p.setAttribute("stroke-width", t.width);
      p.setAttribute("stroke-linecap", t.cap); p.setAttribute("stroke-linejoin", "round"); p.setAttribute("opacity", "0.92");
      if (t.dashed) p.setAttribute("stroke-dasharray", t.dashed);
      return p;
    }
    function pathD(pts) { return pts.length === 1 ? "M" + pts[0].x + " " + pts[0].y + " l0.1 0" : "M" + pts.map((p) => p.x + " " + p.y).join(" L"); }
    function wire() {
      const svg = $(svgId);
      let el2 = null;
      svg.addEventListener("pointerdown", (ev) => {
        if (lock) return;
        ev.preventDefault(); try { svg.setPointerCapture(ev.pointerId); } catch (_) { /* nothing */ }
        live = { tool, pts: [point(ev)] };
        el2 = pathEl(live); el2.setAttribute("d", pathD(live.pts)); svg.appendChild(el2);
        SOUND.play(TOOLS[tool].sound, 0.3);
      });
      svg.addEventListener("pointermove", (ev) => {
        if (!live || !el2) return;
        const p = point(ev), q = live.pts[live.pts.length - 1];
        if (Math.abs(p.x - q.x) + Math.abs(p.y - q.y) >= 2) { live.pts.push(p); el2.setAttribute("d", pathD(live.pts)); }
      });
      const up = () => {
        if (!live) return;
        const s = live; live = null; el2 = null;
        strokes.push(s);
        judge(s);
      };
      svg.addEventListener("pointerup", up);
      svg.addEventListener("pointercancel", up);
    }
    function judge(s) {
      const f = strokeFeatures(s.pts, s.tool, session);
      if (f.len < 14) session.dots++;
      $(el.score).textContent = (free() ? strokes.length + " marks" : "Mark " + (r + 1) + " of " + rounds.length);
      if (free()) { $(el.stage + "stick").disabled = false; return; }
      const rd = rounds[r];
      if (s.tool !== rd.tool) {
        missed = true; SOUND.play("error", 0.3);
        const line = "That was the " + TOOLS[s.tool].label.toLowerCase() + ". This one wants the " + TOOLS[rd.tool].label.toLowerCase() + ". Tap it, then try again.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line); return;
      }
      const f2 = strokeFeatures(s.pts, s.tool, session);
      if (CHECKS[rd.want](f2)) {
        lock = true; if (!missed) score++; SOUND.play("tada", 0.4);
        jot({ kind: "marks", text: "made " + rd.made + " with the " + TOOLS[rd.tool].label.toLowerCase(), pic: "✏️" });
        const line = cheer() + " That is " + rd.made + ". " + (rd.why || "");
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        r++; missed = false; session.dots = 0;
        setTimeout(() => { lock = false; strokes = []; startRound(); }, 3000);
      } else {
        missed = true; SOUND.play("pop", 0.2);
        const line = CHECK_HINT[rd.want] || "Not quite. Try again.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    }
    function startRound() {
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      if (!free()) { tool = rounds[r].tool; }
      draw();
      if (free()) { $(el.ask).innerHTML = "Now draw <b>anything you like</b>. Then stick it in your journal."; sayHere(o.finish, "Now draw anything you like, with any tool. Then press Stick it in my journal."); }
      else { $(el.ask).innerHTML = "<b>" + esc(rounds[r].ask) + "</b> Use the " + esc(TOOLS[rounds[r].tool].label.toLowerCase()) + "."; sayHere(o.finish, rounds[r].ask + " Use the " + TOOLS[rounds[r].tool].label.toLowerCase() + ". Draw on the paper with your finger or the mouse."); }
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".toolbtn"); if (!b || lock) return;
      tool = b.dataset.t; SOUND.play("click", 0.3); draw(); say(TOOLS[tool].label);
    });
    startRound();
  }

  /* ---- continue a pattern, then make your own (E.01, TWA.01) ----------
     A row shows the start of a repeating pattern and the child taps the
     tile that comes next; the key is the pattern's own repeat. Then a
     palette and an empty row: the child builds a row and presses Check,
     and it counts as a pattern only if it repeats. */
  function patternPeriod(seq, maxP) {
    for (let p = 1; p <= (maxP || 4); p++) {
      if (seq.length >= 2 * p && seq.every((v, i) => v === seq[i % p])) return p;
    }
    return null;
  }
  function patternMaker(o) {
    const el = o.el, tiles = o.tiles, rounds = o.rounds;
    const tile = (id) => tiles.find((t) => t.id === id);
    const tileHtml = (id, cls) => { const t = tile(id); return '<span class="ptile' + (cls ? " " + cls : "") + '" style="--c:' + (t.hex || "transparent") + '" aria-label="' + esc(t.label) + '">' + (t.pic ? small(t.pic) : "") + "</span>"; };
    let r = 0, filled = [], own = [], lock = false, score = 0, missed = false;
    const free = () => r >= rounds.length;
    function draw() {
      const rd = rounds[r];
      let row;
      if (free()) row = own.map((id) => tileHtml(id)).join("") + (own.length < (o.ownMin || 6) ? '<span class="ptile slot">?</span>' : "");
      else row = rd.seq.slice(0, rd.show).map((id) => tileHtml(id)).join("") + filled.map((id) => tileHtml(id, "new")).join("") + Array.from({ length: rd.ask_n - filled.length }, () => '<span class="ptile slot">?</span>').join("");
      $(el.stage).innerHTML = '<div class="stagewide">' +
        '<div class="wantcard"><span class="cpic" aria-hidden="true">\u{1F9F1}</span><div><p class="phase">' + (free() ? "Your turn" : "What comes next?") + '</p><b>' + esc(free() ? "Make your own pattern. It has to repeat." : rd.ask) + "</b></div></div>" +
        '<div class="patternrow" aria-live="polite">' + row + "</div>" +
        '<p class="phase">Tap a tile</p><div class="palette">' + tiles.map((t) => '<button type="button" class="palbtn" data-t="' + esc(t.id) + '"' + (lock ? " disabled" : "") + ">" + tileHtml(t.id) + "<small>" + esc(t.label) + "</small></button>").join("") + "</div>" +
        (free() ? '<div class="bigbtns"><button type="button" class="big small ghost" id="' + el.stage + 'undo"' + (own.length ? "" : " disabled") + '>Take one off</button><button type="button" class="big small" id="' + el.stage + 'check"' + (own.length >= (o.ownMin || 6) && !lock ? "" : " disabled") + ">Check my pattern</button></div>" : "") + "</div>";
      $(el.score).textContent = free() ? own.length + " tiles" : "Pattern " + (r + 1) + " of " + rounds.length;
      const u = $(el.stage + "undo"); if (u) u.addEventListener("click", () => { own.pop(); draw(); });
      const c = $(el.stage + "check"); if (c) c.addEventListener("click", checkOwn);
    }
    function start() {
      filled = []; lock = false; missed = false;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw();
      if (free()) { $(el.ask).innerHTML = "Now make <b>your own</b> pattern. Tap tiles into the row, then press Check my pattern."; sayHere(o.finish, "Now make your own pattern. Tap tiles into the row. A pattern repeats. Then press Check my pattern."); }
      else { const rd = rounds[r]; $(el.ask).innerHTML = "<b>" + esc(rd.ask) + "</b> Tap the tile that comes next."; sayHere(o.finish, rd.ask + " Say the pattern out loud: " + rd.seq.slice(0, rd.show).map((id) => tile(id).label).join(", ") + ". Tap the tile that comes next."); }
    }
    function checkOwn() {
      if (lock) return;
      const p = patternPeriod(own, 3);
      if (p && p >= 2) {
        lock = true; SOUND.play("tada", 0.5); draw();
        const unit = own.slice(0, p).map((id) => tile(id).label).join(", ");
        jot({ kind: "pattern", text: "made a pattern: " + unit + ", again and again", pic: "\u{1F9F1}", tiles: own.slice() });
        sayLine(el, cheer() + " Your pattern goes <b>" + esc(unit) + "</b>, again and again. That repeats, so it is a pattern.", cheer() + " Your pattern goes " + unit + ", again and again. That repeats, so it is a pattern.");
        reportScore(o.finish, score, rounds.length);
        setTimeout(() => endStep(o, "You continued " + rounds.length + " patterns and made one of your own. " + o.done), 3800);
      } else {
        SOUND.play("error", 0.3);
        const line = p === 1 ? "That is the same tile every time. A pattern needs two or more different tiles that repeat." : "That row does not repeat yet. A pattern says the same thing again and again: red, blue, red, blue. Take some off and try.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest(".palbtn"); if (!b || lock) return;
      const id = b.dataset.t;
      if (free()) { if (own.length >= 12) return; own.push(id); SOUND.play("pop", 0.3); draw(); say(tile(id).label); return; }
      const rd = rounds[r], k = rd.show + filled.length;
      const p = patternPeriod(rd.seq), want = rd.seq[k % p];
      if (id === want) {
        filled.push(id); SOUND.play("pop", 0.35); draw();
        $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " " + tile(id).label + " comes next."; say(cheer() + " " + tile(id).label + " comes next.");
        if (filled.length >= rd.ask_n) {
          lock = true; if (!missed) score++;
          r++;
          setTimeout(() => { $(el.fb).textContent = ""; start(); }, 2400);
        }
      } else {
        missed = true; SOUND.play("error", 0.3);
        const unit = rd.seq.slice(0, p).map((x) => tile(x).label).join(", ");
        const line = "Not " + tile(id).label + ". The pattern goes " + unit + ", again and again. After " + tile(rd.seq[(k - 1 + p) % p]).label + " comes " + tile(want).label + ".";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    });
    start();
  }

  /* ---- choose a material for a purpose (M.02, TWA.02) ------------------
     A purpose, drawn; a shelf of materials. A material fits when one of
     its properties is what the purpose needs - computed, never flagged.
     A wrong pick says what the material IS like. */
  function chooseFor(o) {
    const el = o.el, rounds = o.rounds, materials = o.materials;
    let r = 0, lock = false, score = 0, missed = false, chosen = null;
    function draw() {
      const rd = rounds[r], m = chosen ? materials.find((x) => x.id === chosen) : null;
      $(el.stage).innerHTML = '<div class="stagewide"><div class="issue' + (m ? " fixed" : "") + '"><span class="cpic big" aria-hidden="true">' + small(rd.pic) + (m ? '<span class="applied" aria-hidden="true">' + small(m.pic) + "</span>" : "") + "</span>" +
        "<p><b>" + esc(rd.purpose) + "</b>" + (m ? "<br>" + esc(m.label) + " it is." : "<br>It needs something <b>" + esc(rd.needs) + "</b>.") + "</p></div>" +
        '<p class="phase">Which material?</p><div class="cardsgrid acts">' + materials.map((x) => '<button type="button" class="tapcard" data-m="' + esc(x.id) + '"' + (lock ? " disabled" : "") + '><span class="cpic" aria-hidden="true">' + small(x.pic) + "</span>" + esc(x.label) + "</button>").join("") + "</div></div>";
      $(el.score).textContent = "Purpose " + (r + 1) + " of " + rounds.length;
    }
    function start() {
      lock = false; missed = false; chosen = null;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw();
      const rd = rounds[r];
      $(el.ask).innerHTML = "You want to make <b>" + esc(rd.purpose) + "</b>. It needs something <b>" + esc(rd.needs) + "</b>. Tap the material that would work.";
      sayHere(o.finish, "You want to make " + rd.purpose + ". It needs something " + rd.needs + ". Tap the material that would work.");
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]"); if (!b || lock) return;
      const rd = rounds[r], m = materials.find((x) => x.id === b.dataset.m);
      if ((m.props || []).includes(rd.needs)) {
        lock = true; if (!missed) score++; chosen = m.id;
        SOUND.play("tada", 0.5); draw();
        jot({ kind: "choose", text: "chose " + m.label.toLowerCase() + " for " + rd.purpose, pic: "\u{1F9F0}" });
        const line = cheer() + " " + m.say + " " + (rd.why || "");
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        r++;
        setTimeout(() => {
          if (r >= rounds.length) { reportScore(o.finish, score, rounds.length); endStep(o, "You chose the right material for " + rounds.length + " purposes. " + o.done); }
          else start();
        }, 3800);
      } else {
        missed = true; b.classList.add("wrong"); SOUND.play("thud", 0.4);
        const line = m.say + " It is " + (m.props || []).slice(0, 2).join(" and ") + ", not " + rd.needs + ". Try another.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => b.classList.remove("wrong"), 700);
      }
    });
    start();
  }

  /* ---- add rice, flour, sugar or water to paint (TWA.02, E.02) ----------
     The Science kit's experiment shape: predict, do it, see what
     happened, say whether it matched. The outcome is a table the
     builder holds too. */
  function paintExperiment(o) {
    const el = o.el, rounds = o.rounds;
    let r = 0, phase = "predict", picked = null, right = 0, lock = false;
    const texturePaint = (tx) => {
      const base = '<rect x="20" y="30" width="160" height="90" rx="14" fill="' + hexOf(o.colour || "blue") + '"/>';
      let extra = "";
      if (tx === "bumpy") for (let k = 0; k < 24; k++) extra += '<circle cx="' + (34 + (k % 8) * 19) + '" cy="' + (48 + Math.floor(k / 8) * 26) + '" r="6" fill="rgba(255,255,255,0.45)"/>';
      if (tx === "thick") extra = '<rect x="20" y="30" width="160" height="90" rx="14" fill="rgba(0,0,0,0.18)"/><path d="M30 60 q40-18 80 0 t70 0" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="10" stroke-linecap="round"/><path d="M30 95 q40-18 80 0 t70 0" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="10" stroke-linecap="round"/>';
      if (tx === "gritty") for (let k = 0; k < 60; k++) extra += '<rect x="' + (24 + (k * 37) % 150) + '" y="' + (34 + (k * 53) % 80) + '" width="3" height="3" fill="rgba(255,255,255,0.8)"/>';
      if (tx === "runny") extra = '<g fill="' + hexOf(o.colour || "blue") + '"><path d="M50 118 v40 q0 8 6 8 q6 0 6-8 v-40z"/><path d="M110 118 v60 q0 8 6 8 q6 0 6-8 v-60z"/><path d="M150 118 v30 q0 8 6 8 q6 0 6-8 v-30z"/></g><rect x="20" y="30" width="160" height="90" rx="14" fill="rgba(255,255,255,0.25)"/>';
      if (tx === "rough") for (let k = 0; k < 40; k++) extra += '<circle cx="' + (26 + (k * 41) % 150) + '" cy="' + (36 + (k * 29) % 80) + '" r="2.5" fill="rgba(0,0,0,0.35)"/>';
      if (tx === "shiny") extra = '<path d="M30 40 q60 10 130 60" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="8" stroke-linecap="round"/><ellipse cx="60" cy="50" rx="18" ry="8" fill="rgba(255,255,255,0.6)"/>';
      return '<svg viewBox="0 0 200 190" class="paintblob" aria-hidden="true">' + base + extra + "</svg>";
    };
    function draw(tx) {
      const rd = rounds[r];
      $(el.stage).innerHTML = '<div class="stagewide"><div class="labrow"><div class="sim paintbox">' + texturePaint(tx) + "</div>" +
        '<div class="jar"><span class="cpic big" aria-hidden="true">' + small(rd.pic) + "</span><b>" + esc(rd.additive) + "</b></div></div>" +
        (phase === "add" ? '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage + 'add">Add the ' + esc(rd.additive) + " &#9654;</button></div>" : "") + "</div>";
      $(el.score).textContent = "Try " + (r + 1) + " of " + rounds.length;
      const ab = $(el.stage + "add"); if (ab) ab.addEventListener("click", addIt);
    }
    function options(rd, cls) {
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(rd.opts).map((t) => '<button type="button" class="choice text" data-t="' + esc(t) + '">' + esc(t) + "</button>").join("");
    }
    function start() {
      const rd = rounds[r];
      phase = "predict"; picked = null; lock = false;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw(null);
      $(el.ask).innerHTML = "We add <b>" + esc(rd.additive) + "</b> to the paint. What do you think it will be like?";
      options(rd);
      sayHere(o.finish, "We are going to add " + rd.additive + " to the paint. What do you think the paint will be like? Tap a word.");
    }
    function addIt() {
      if (lock) return;
      lock = true; phase = "look";
      const rd = rounds[r], tx = TEXTURE[rd.additive];
      SOUND.play("stir", 0.5); draw(tx);
      $(el.ask).innerHTML = "Look at the paint now. <b>What is it like?</b> Tap the word that says.";
      options(rd);
      $(el.fb).className = "fb"; $(el.fb).textContent = "The " + rd.additive + " is in. Look at the paint.";
      say("The " + rd.additive + " is in. Look at the paint. What is it like now? Tap the word that says.");
      lock = false;
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      const rd = rounds[r], tx = TEXTURE[rd.additive];
      if (phase === "predict") {
        picked = b.dataset.t; SOUND.play("click", 0.3);
        $(el.ch).innerHTML = ""; phase = "add"; draw(null);
        $(el.ask).innerHTML = "You think <b>" + esc(picked) + "</b>. Now press <b>Add the " + esc(rd.additive) + "</b>.";
        $(el.fb).className = "fb"; $(el.fb).textContent = "You think: " + picked + ". Let us see.";
        say("You think " + picked + ". Now press Add the " + rd.additive + ".");
        return;
      }
      if (phase !== "look") return;
      if (b.dataset.t === tx) {
        lock = true; right++;
        $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
        SOUND.play("ding", 0.4);
        jot({ kind: "experiment", text: "added " + rd.additive + " to paint and made it " + tx, pic: "\u{1F9EA}" });
        const match = picked === tx;
        const line = cheer() + " The " + rd.additive + " made the paint " + tx + ". " + (match ? "You said " + picked + ". It matched!" : "You said " + picked + ". It did not match, and that is fine: now you know.") + " " + (rd.why || "");
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        r++;
        setTimeout(() => {
          if (r >= rounds.length) { reportScore(o.finish, right, rounds.length); endStep(o, "You tried " + rounds.length + " things in the paint and saw what each one did. " + o.done); }
          else start();
        }, 4600);
      } else {
        b.classList.add("wrong"); b.disabled = true; SOUND.play("error", 0.3);
        const line = "Look at the paint again. It is not " + b.dataset.t + ". What IS it like?";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    });
    start();
  }

  /* ==================================================================
     REFLECTING and THINKING AND WORKING ARTISTICALLY - compare, praise,
     refine, and the journal.
     ================================================================== */

  /* ---- the same and different (R.02) -----------------------------------
     Two works side by side. Cards say a thing that might be in them; the
     child sorts each into "Both have it" or "Only one has it", and the
     bin is set arithmetic on what each work contains. Then, which one
     the child likes more - never marked, read back. */
  function sameDifferent(o) {
    const el = o.el, a = o.a, b = o.b, cards = shuffle(o.cards);
    let i = 0, right = 0, lock = false, phase = "sort";
    const binOf = (tag) => { const ia = a.features.includes(tag), ib = b.features.includes(tag); return ia && ib ? "both" : (ia || ib) ? "one" : null; };
    const whoHas = (tag) => a.features.includes(tag) ? a.title : b.title;
    function draw() {
      const c = cards[i];
      $(el.stage).innerHTML = '<div class="stagewide"><div class="twoworks"><figure><div class="sim">' + workHtml(a) + '</div><figcaption>' + esc(a.title) + "</figcaption></figure><figure><div class=\"sim\">" + workHtml(b) + '</div><figcaption>' + esc(b.title) + "</figcaption></figure></div>" +
        (phase === "sort" ? '<div class="sortnow"><span class="lab">' + esc(c.t) + '</span></div><div class="bins two"><button type="button" class="bin" data-b="both"><span class="bpic" aria-hidden="true">\u{1F91D}</span>Both have it</button><button type="button" class="bin" data-b="one"><span class="bpic" aria-hidden="true">\u{261D}\u{FE0F}</span>Only one has it</button></div>' : "") + "</div>";
      $(el.score).textContent = phase === "sort" ? "Card " + (i + 1) + " of " + cards.length : "";
    }
    function like() {
      phase = "like"; draw();
      $(el.ask).innerHTML = "Which one do <b>you</b> like more? There is no wrong answer.";
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = [a, b].map((w) => '<button type="button" class="choice text" data-w="' + esc(w.id) + '">' + esc(w.title) + "</button>").join("");
      sayHere(o.finish, "Which one do you like more? Tap it. There is no wrong answer.");
    }
    $(el.stage).addEventListener("click", (e) => {
      const bt = e.target.closest(".bin"); if (!bt || lock || phase !== "sort") return;
      lock = true;
      const c = cards[i], want = binOf(c.about), ok = bt.dataset.b === want;
      $(el.stage).querySelectorAll(".bin").forEach((x) => { x.disabled = true; });
      if (ok) { right++; bt.classList.add("right"); SOUND.play("pop", 0.35); }
      else { bt.classList.add("wrong"); SOUND.play("error", 0.3); const rb = $(el.stage).querySelector('.bin[data-b="' + want + '"]'); if (rb) rb.classList.add("right"); }
      const line = (ok ? cheer() + " " : "Look again. ") + (want === "both" ? "Both pictures have " + c.t + "." : "Only " + whoHas(c.about) + " has " + c.t + ".") + " " + (c.why || "");
      $(el.fb).className = "fb " + (ok ? "good" : "bad"); $(el.fb).textContent = line; say(line);
      i++;
      setTimeout(() => {
        lock = false; $(el.fb).textContent = "";
        if (i >= cards.length) { reportScore(o.finish, right, cards.length); like(); } else draw();
      }, ok ? 2400 : 3200);
    });
    $(el.ch).addEventListener("click", (e) => {
      const bt = e.target.closest(".choice"); if (!bt || phase !== "like") return;
      const w = bt.dataset.w === a.id ? a : b;
      $(el.ch).querySelectorAll(".choice").forEach((x) => { x.disabled = true; }); bt.classList.add("right");
      SOUND.play("tada", 0.4);
      sayLine(el, "You like <b>" + esc(w.title) + "</b> more. That is your opinion, and it is yours to have.", "You like " + w.title + " more. That is your opinion, and it is yours to have.");
      setTimeout(() => endStep(o, "You found what is the same and what is different in two pictures, and said which you like. " + o.done), 3200);
    });
    draw();
    $(el.ask).innerHTML = "<b>" + esc(cards[0].t) + "</b> Is it in both pictures, or only one?";
    ONSHOW[o.finish] = (function () { let said = false; return () => { if (said) return; said = true; afterVoice(() => sayHere(o.finish, "Look at both pictures. " + cards[0].t + ". Is it in both pictures, or only one?")); }; })();
  }

  /* ---- say something kind about a friend's work (R.01) -----------------
     A work with its owner's name; three comments, all kind. Only one
     names something that is actually in the picture, and the picture's
     own features decide which. A wrong pick says what the comment talks
     about and that it is not there. */
  function kindComment(o) {
    const el = o.el, rounds = o.rounds;
    let r = 0, right = 0, lock = false, missed = false;
    const workOf = (id) => o.works.find((w) => w.id === id);
    function draw() {
      const rd = rounds[r], w = workOf(rd.work);
      $(el.stage).innerHTML = '<div class="stagewide"><div class="person talker"><span class="ppic" aria-hidden="true">' + small(w.ownerPic || "\u{1F9D2}") + '</span><div><b>' + esc(w.owner || "A friend") + " made this</b><p class=\"pbubble\">“" + esc(w.title) + "”</p></div></div>" +
        '<div class="sim picbox">' + workHtml(w) + "</div></div>";
      $(el.score).textContent = "Picture " + (r + 1) + " of " + rounds.length;
    }
    function start() {
      const rd = rounds[r], w = workOf(rd.work);
      lock = false; missed = false;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw();
      $(el.ask).innerHTML = "Say something kind to <b>" + esc(w.owner || "your friend") + "</b> about the picture. It has to be about something that is <b>in</b> it.";
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(rd.opts).map((c) => '<button type="button" class="choice text" data-about="' + esc(c.about) + '">' + esc(c.t) + "</button>").join("");
      sayHere(o.finish, "Look at " + (w.owner || "your friend") + "'s picture. Say something kind about it. It has to be about something that is in the picture. Tap one.");
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      const rd = rounds[r], w = workOf(rd.work);
      if (w.features.includes(b.dataset.about)) {
        lock = true; if (!missed) right++;
        $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
        SOUND.play("tada", 0.4);
        sayLine(el, "You said to " + esc(w.owner || "your friend") + ": <b>" + esc(b.textContent) + "</b> " + esc(rd.why || ""), "You said to " + (w.owner || "your friend") + ": " + b.textContent + " " + (rd.why || ""));
        r++;
        setTimeout(() => {
          if (r >= rounds.length) { reportScore(o.finish, right, rounds.length); endStep(o, "You said something kind and true about " + rounds.length + " pictures. " + o.done); }
          else start();
        }, 3600);
      } else {
        missed = true; b.classList.add("wrong"); b.disabled = true; SOUND.play("error", 0.3);
        const line = "That is kind, but it talks about " + b.dataset.about + ", and there is no " + b.dataset.about + " in this picture. Say something about what IS there.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
      }
    });
    start();
  }

  /* ---- refine a piece with a problem (TWA.03, R.02) ---------------------
     A piece, drawn with its problem; three or four changes offered. The
     child picks one and the page shows what that change DID. A change
     whose effect is not what the problem needs is not marked wrong and
     left there: it is tried, it did not fix it, and the child chooses
     again. The fix redraws the piece. */
  function refineIt(o) {
    const el = o.el, rounds = o.rounds;
    let r = 0, tried = new Set(), lock = false, score = 0, fixed = false;
    function draw(after) {
      const rd = rounds[r], p = rd.piece;
      $(el.stage).innerHTML = '<div class="stagewide"><div class="issue' + (fixed ? " fixed" : "") + '">' +
        (p.scene ? '<div class="sim picbox">' + sceneSvgOf(p.scene, fixed ? (p.fixedState || "fixed") : (p.state || "problem")) + "</div>" : '<span class="cpic big" aria-hidden="true">' + small(fixed ? (p.fixedPic || p.pic) : p.pic) + "</span>") +
        "<p><b>" + esc(fixed ? (p.fixed || "Fixed!") : p.title) + "</b><br>" + esc(fixed ? "" : p.problem) + (after ? "<br>" + esc(after.say) : "") + "</p></div>" +
        '<p class="phase">What could you change?</p><div class="cardsgrid acts">' + rd.changes.map((c) => '<button type="button" class="tapcard' + (tried.has(c.id) ? " tried" : "") + '" data-c="' + esc(c.id) + '"' + (lock || fixed || tried.has(c.id) ? " disabled" : "") + '><span class="cpic" aria-hidden="true">' + small(c.pic) + "</span>" + esc(c.t) + "</button>").join("") + "</div></div>";
      $(el.score).textContent = "Piece " + (r + 1) + " of " + rounds.length;
    }
    function start() {
      tried = new Set(); lock = false; fixed = false;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      draw(null);
      const rd = rounds[r];
      $(el.ask).innerHTML = "<b>" + esc(rd.piece.title) + ".</b> " + esc(rd.piece.problem) + " What could you change to make it better? Tap one and see.";
      sayHere(o.finish, rd.piece.title + ". " + rd.piece.problem + " What could you change to make it better? Tap one and see.");
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]"); if (!b || lock || fixed) return;
      const rd = rounds[r], c = rd.changes.find((x) => x.id === b.dataset.c);
      tried.add(c.id); lock = true;
      if (c.effect === rd.needs) {
        fixed = true; if (tried.size === 1) score++;
        SOUND.play("tada", 0.5); draw(c);
        jot({ kind: "refine", text: "made " + lower1(rd.piece.title) + " better: " + c.t.toLowerCase(), pic: "\u{1F527}" });
        const line = cheer() + " " + c.say + " " + (rd.why || "");
        $(el.fb).className = "fb good"; $(el.fb).textContent = line; say(line);
        r++;
        setTimeout(() => {
          if (r >= rounds.length) { reportScore(o.finish, score, rounds.length); endStep(o, "You made " + rounds.length + " pieces better by changing the right thing. " + o.done); }
          else start();
        }, 4000);
      } else {
        SOUND.play(c.effect === "worse" ? "buzz" : "thud", 0.4); draw(c);
        const line = c.say + " That did not make it better. Try another change.";
        $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
        setTimeout(() => { lock = false; draw(null); }, 3200);
      }
    });
    start();
  }

  /* ---- my journal: what I made, in order, and what I would change
     (R.01, TWA.03) ---------------------------------------------------------
     Reads the page's own journal - what this child actually made a few
     minutes ago - and asks first which they made first, then what they
     would change next time. If the making steps were skipped (a dot
     tapped straight here), the builder's fallback record stands in, and
     the page says so. A course-scope journal (Lesson 8) reads every
     lesson's record instead. */
  function myJournal(o) {
    const el = o.el;
    const live = (window.__artJournal || []).slice();
    const entries = (o.scope === "course" ? o.fallback : (live.length ? live : o.fallback)).slice();
    const fromLive = o.scope !== "course" && live.length > 0;
    const orderable = entries.length >= 2 ? entries.slice(0, Math.min(entries.length, 5)) : [];
    const placed = [];
    let phase = orderable.length ? "order" : "change", chosen = null, lock = false, wrong = 0;
    const entryHtml = (en, cls) => '<span class="jpic" aria-hidden="true">' + (en.hex ? swatchSvg(en.hex, 30) : en.svg ? en.svg : small(en.pic || "\u{1F4D2}")) + "</span>" + esc(cap1(en.text)) + (en.lesson ? "<small>Lesson " + en.lesson + "</small>" : "");
    function draw() {
      if (phase === "order") {
        $(el.stage).innerHTML = '<div class="stagewide"><p class="phase">' + (o.scope === "course" ? "What did you make first?" : "What did you make first today?") + '</p><div class="orderrow">' +
          (placed.length ? placed.map((k, p) => '<span class="ordered"><b>' + (p + 1) + "</b>" + entryHtml(orderable[k]) + "</span>").join('<span class="arrow" aria-hidden="true">&rarr;</span>') : '<span class="sub">Tap what you made first</span>') + "</div>" +
          '<div class="cardsgrid wide">' + shuffle(orderable.map((en, k) => ({ en, k }))).filter((x) => !placed.includes(x.k)).map((x) => '<button type="button" class="tapcard journalcard" data-k="' + x.k + '">' + entryHtml(x.en) + "</button>").join("") + "</div>" +
          (fromLive ? "" : '<p class="sub">' + esc(o.scope === "course" ? "These are the things every lesson makes." : "You skipped the making steps, so this is what the lesson makes. Go back and make them for real!") + "</p>") + "</div>";
        $(el.score).textContent = placed.length + " of " + orderable.length + " in order";
      } else {
        $(el.stage).innerHTML = '<div class="stagewide"><p class="phase">Pick one thing you made</p><div class="cardsgrid wide">' + entries.map((en, k) => '<button type="button" class="tapcard journalcard' + (chosen === k ? " now" : "") + '" data-j="' + k + '">' + entryHtml(en) + "</button>").join("") + "</div></div>";
        $(el.score).textContent = entries.length + " things in your journal";
      }
    }
    function changes() {
      const en = entries[chosen];
      $(el.ask).innerHTML = "You made <b>" + esc(en.text) + "</b>. If you made it again, what would you <b>change</b>? Tap one. There is no wrong answer.";
      $(el.ch).className = "choices stack";
      $(el.ch).innerHTML = shuffle(o.changes).map((t) => '<button type="button" class="choice text" data-ch="' + esc(t) + '">' + esc(t) + "</button>").join("");
      sayHere(o.finish, "You made " + en.text + ". If you made it again, what would you change? Tap one. There is no wrong answer.");
    }
    $(el.stage).addEventListener("click", (e) => {
      const oc = e.target.closest(".journalcard"); if (!oc || lock) return;
      if (phase === "order") {
        const k = Number(oc.dataset.k);
        if (k === placed.length) {
          placed.push(k); SOUND.play("pop", 0.35); draw();
          $(el.fb).className = "fb good"; $(el.fb).textContent = cheer() + " Then you " + orderable[k].text + "."; say(cheer() + " " + (placed.length === 1 ? "First you " : "Then you ") + orderable[k].text + ".");
          if (placed.length === orderable.length) {
            lock = true;
            setTimeout(() => { lock = false; phase = "change"; draw(); $(el.fb).textContent = ""; $(el.ask).innerHTML = "That is the order you made them in. Now <b>pick one</b>."; sayHere(o.finish, "That is the order you made them in. Now pick one thing you made."); }, 2400);
          }
        } else {
          wrong++; oc.classList.add("wrong"); SOUND.play("error", 0.3);
          const line = k < placed.length ? "That one is already placed." : "Not yet. You made something before that.";
          $(el.fb).className = "fb bad"; $(el.fb).textContent = line; say(line);
          setTimeout(() => oc.classList.remove("wrong"), 700);
        }
        return;
      }
      if (phase === "change" && chosen === null) {
        chosen = Number(oc.dataset.j); SOUND.play("click", 0.3); draw();
        changes();
      }
    });
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || phase !== "change" || chosen === null || lock) return;
      lock = true;
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; }); b.classList.add("right");
      SOUND.play("tada", 0.4);
      const en = entries[chosen];
      const sentence = "Next time I would " + b.dataset.ch + ".";
      sayLine(el, "You " + esc(en.text) + ". You said: <b>" + esc(sentence) + "</b> That is an artist looking back.", "You " + en.text + ". You said: " + sentence + " That is an artist looking back.");
      reportScore(o.finish, Math.max(0, orderable.length - wrong), Math.max(1, orderable.length));
      setTimeout(() => endStep(o), 3400);
    });
    draw();
    if (phase === "change") { $(el.ask).innerHTML = "Look at what you made. <b>Pick one</b>."; }
  }

  /* ==================================================================
     THE UNIT SHELL - the steps drawn AROUND every lesson (owner,
     2026-09-10, for every standalone build), the furniture the English
     Grade 1 build carries around a unit: what it is about, a lecture,
     the words, games, things to make at home, a placeholder for Our
     world, and the student-resources drawer. _shell.py decides where
     they sit and what they carry; these only draw. Lifted from the
     Global Perspectives kit with the subject's words changed and nothing
     else.

     Three of them tick themselves off - the overview and Our world on
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
    if (c.words) bits.push(c.words + " art words");
    if (c.games) bits.push(c.games + " games");
    if (c.home) bits.push(c.home + " things to make at home");
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
        (p.scene ? '<div class="sim picbox">' + sceneSvgOf(p.scene) + "</div>" : picHtml(p.pic, "pic lecpic")) +
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

  /* ---- the art words: hear each one, then show you know them ---- */
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
            $(el.ask).innerHTML = "You know " + right + " of " + items.length + " art words.";
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

  /* ---- things to make at home: real projects, ticked when done ---- */
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
        '<button type="button" class="tick" data-act="tick">' + (did[k] ? "✓ we made this" : "We made this") + "</button>" +
        "</div>").join("") + "</div>" +
        '<div class="bigbtns"><button type="button" class="big small" id="' + id + 'fin">We made these &#10003;</button></div>';
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
      { id: "words", icon: "\u{1F524}", title: "Art words", blurb: "This lesson's words, what they mean, and a voice to hear them." },
      { id: "finder", icon: "\u{1F50E}", title: "Word finder", blurb: "Look up any art word from any lesson in " + (o.gradeLabel || "this grade") + "." },
      { id: "home", icon: "\u{1F3E0}", title: "Make it at home", blurb: "This lesson's projects, to make with a grown-up." },
      { id: "teaches", icon: "\u{1F46A}", title: "For your grown-up", blurb: "What this lesson teaches, in the words of the Cambridge framework." },
      { id: "strands", icon: "\u{1F9E9}", title: "The four strands", blurb: "The four strands of Art & Design, and what each one is." },
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
        panel("Art words", '<div class="wordlist">' + wordRows(o.words || [], false) + "</div>",
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
          '<div class="teaches"><p class="lec-p">Lesson ' + o.lessonNo + " teaches these objectives of Cambridge Primary Art & Design 0067. Cambridge uses the same ten objectives from Stage 1 to Stage 6; the leading digit is the stage, added by Ehel, and what a Stage 1 learner is expected to show is described in the framework's own progression text.</p><ul class=\"ovw-list codes\">" +
          (o.teaches || []).map((t) => "<li><code>" + esc(t.code) + "</code> " + esc(t.text) + "</li>").join("") + "</ul></div>",
          '<span class="book-page-count">' + (o.teaches || []).length + " objectives</span>");
        return;
      }
      if (which === "strands") {
        panel("The four strands",
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
