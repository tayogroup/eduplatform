/* ====================================================================
   Professor Adow TVET — the lesson kit.

   THE SHARED MACHINERY, and nothing that belongs to one trade. Every
   page of every module loads this file and then exactly one content
   file beside it.

   It exists because carpentry.js used to hold both. That was fine while
   carpentry was the only module, and wrong the moment Shapes and
   Measurements — a module for all six departments — had to load a file
   called carpentry.js to draw a rule. The seam was recorded at the top
   of shapes.js rather than hidden; this is the fix it named.

   What lives here: the SVG helpers, ONE drawing registry every module
   registers into, and the step kinds whose behaviour is the same
   whatever is being taught —

     label      tap the named part of a drawn thing
     safety     a checklist that contains non-precautions
     order      put stages into the order they happen
     sort       put a drawn thing into the group it belongs to
     browse     tap each of a set to be told what it is for
     questions  answer, and be given the reason either way
     words      the vocabulary of the job

   and two ENGINES that content files drive with their own drawings:
   `seqDemo` (press through a sequence that changes state) and
   `caseChoice` (choose one of several outcomes, then see it drawn).

   What does NOT live here: a single line that knows what a tenon is.
   ==================================================================== */
(function () {
  "use strict";



  const SVGNS = "http://www.w3.org/2000/svg";
  const $ = (sel, root) => (root || document).querySelector(sel);

  /* Read a design token so the drawings follow the theme rather than
     carrying a second palette that can drift from lesson.css. */
  const tok = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  };

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(SVGNS, name);
    for (const key in attrs || {}) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  };

  const svg = (w, h, cls) => {
    const s = el("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", role: "img" });
    s.setAttribute("class", "carp-svg " + (cls || ""));
    /* Scale UP, not just down. The natural viewBox widths are 300-420,
       which in an 820px column left the drawings looking like thumbnails
       in a large card. They are vector, so there is no quality cost to
       letting them fill the column, and on this build the drawing IS the
       teaching. */
    s.style.maxWidth = "min(100%, 620px)";
    return s;
  };

  /* ==================================================================
     TIMBER — the one primitive every drawing is built from.
     A board seen face-on, with optional end grain, face marks and a
     marked-out joint. x,y is the top-left of the face.
     ================================================================== */
  const WOOD = "#C98A4B", WOOD_DARK = "#A96E35", WOOD_END = "#B87C3F", GRAIN = "#8A5A28";

  /* The shared arrowhead marker. It lived in carpentry.js and `label` —
     which is in this file — called it, so a Shapes page that loaded no
     carpentry file threw on the first labelled drawing. A marker every
     module can point at belongs with the machinery, not with one trade. */
  function arrowDefs(s) {
    const defs = el("defs", {}, s);
    const m = el("marker", { id: "carp-arrow", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto" }, defs);
    el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: tok("--ink", "#fff"), opacity: 0.7 }, m);
  }
  const R = {};

  /* label — tap the named part of a drawn tool */
  R.label = function (data, mount, done) {
    const tool = TOOLS[data.tool];
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    wrap.appendChild(ask);

    const s = svg(tool.w, tool.h);
    arrowDefs(s);
    const g = el("g", {}, s);
    tool.draw(g);
    wrap.appendChild(s);

    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);

    let remaining = tool.parts.slice();
    let target = null;

    const hits = tool.parts.map((p) => {
      const r = el("rect", {
        x: p.box[0], y: p.box[1], width: p.box[2], height: p.box[3],
        fill: "transparent", stroke: "transparent", "stroke-width": 2,
        role: "button", tabindex: 0, "aria-label": p.label,
      }, s);
      r.style.cursor = "pointer";
      const hit = () => {
        if (!target) return;
        if (p.id === target.id) {
          r.setAttribute("stroke", tok("--good", "#4FD1A0"));
          r.setAttribute("fill", tok("--good-soft", "rgba(79,209,160,0.18)"));
          fb.className = "fb good";
          fb.textContent = target.say;
          remaining = remaining.filter((x) => x.id !== target.id);
          setTimeout(next, 2600);
        } else {
          fb.className = "fb bad";
          fb.textContent = "Not that one. " + ask.textContent;
        }
      };
      r.addEventListener("click", hit);
      r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hit(); } });
      return r;
    });

    function next() {
      if (!remaining.length) {
        ask.textContent = "Every part named.";
        fb.className = "fb good";
        fb.textContent = tool.title[0].toUpperCase() + tool.title.slice(1) + ": all parts found.";
        done();
        return;
      }
      target = remaining[0];
      ask.textContent = "Tap the " + target.label + ".";
      fb.className = "fb";
      fb.textContent = "";
    }
    next();
    mount.appendChild(wrap);
  };

  /* safety — the step kind Science has no equivalent of. Every box must
     be ticked before the step completes, and the one that is NOT a real
     precaution must be left alone. A checklist you can complete by
     ticking everything teaches nothing. */
  R.safety = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage carp-safety";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    ask.textContent = data.ask || "Tick every precaution you must take. Leave anything that is not one.";
    wrap.appendChild(ask);

    const list = document.createElement("div");
    list.className = "carp-checks";
    wrap.appendChild(list);
    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);

    const need = data.items.filter((i) => i.required).length;
    let ticked = 0;

    data.items.forEach((item) => {
      const b = document.createElement("button");
      b.className = "carp-check";
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = '<span class="box" aria-hidden="true"></span><span class="txt"></span>';
      b.querySelector(".txt").textContent = item.text;
      b.addEventListener("click", () => {
        if (b.dataset.settled) return;
        if (item.required) {
          b.dataset.settled = "1";
          b.classList.add("ok");
          b.setAttribute("aria-pressed", "true");
          fb.className = "fb good";
          fb.textContent = item.why;
          ticked += 1;
          if (ticked === need) {
            fb.textContent = "Every precaution taken. " + (data.done || "Now you may cut.");
            done();
          }
        } else {
          b.classList.add("no");
          fb.className = "fb bad";
          fb.textContent = item.why;
          setTimeout(() => b.classList.remove("no"), 900);
        }
      });
      list.appendChild(b);
    });
    mount.appendChild(wrap);
  };

  /* order — put the stages of the job in the order they happen */
  R.order = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    ask.textContent = data.ask || "Tap them in the order you would do them.";
    wrap.appendChild(ask);

    const done_ = document.createElement("ol");
    done_.className = "carp-order-done";
    wrap.appendChild(done_);

    const pool = document.createElement("div");
    pool.className = "carp-order-pool";
    wrap.appendChild(pool);
    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);

    let next = 0;
    const shuffled = data.items.map((t, i) => ({ t, i })).sort(() => Math.random() - 0.5);
    shuffled.forEach((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carp-chip";
      b.textContent = item.t;
      b.addEventListener("click", () => {
        if (item.i === next) {
          const li = document.createElement("li");
          li.textContent = item.t;
          done_.appendChild(li);
          b.remove();
          next += 1;
          fb.className = "fb good";
          fb.textContent = data.why && data.why[item.i] ? data.why[item.i] : "Yes.";
          if (next === data.items.length) { fb.textContent = data.finish || "That is the order of work."; done(); }
        } else {
          fb.className = "fb bad";
          fb.textContent = data.before && data.before[item.i] ? data.before[item.i] : "Something has to happen before that.";
        }
      });
      pool.appendChild(b);
    });
    mount.appendChild(wrap);
  };


  /* ---- the drawing registry ---- */

  /* ONE registry, and it starts EMPTY. Content files register into it as
     they load, through `C.register`. The version this replaced built
     itself from whatever happened to exist at the moment it ran, which
     is why the tape ended up drawn but unfindable by `label`: registering
     is now one call that puts a drawing in both places it belongs. */
  const DRAW = {};
  const TOOLS = {};

  /* A thing the learner can be shown. `parts` makes it labellable, which
     is the only difference between a drawing and a tool here. */
  function register(name, spec) {
    DRAW[name] = spec;
    if (spec.parts) TOOLS[name] = spec;
  }
  function registerAll(map, defaults) {
    for (const k in map) {
      const spec = map[k];
      register(k, {
        title: spec.title, draw: spec.draw, parts: spec.parts,
        w: spec.w || (defaults && defaults.w) || 340,
        h: spec.h || (defaults && defaults.h) || 200,
      });
    }
  }

  function drawNamed(s, name) {
    const spec = DRAW[name];
    const g = el("g", {}, s);
    if (!spec) return g;
    const vb = s.getAttribute("viewBox").split(" ").map(Number);
    const scale = Math.min(vb[2] / spec.w, vb[3] / spec.h);
    g.setAttribute("transform", `scale(${scale.toFixed(3)})`);
    spec.draw(g);
    s.setAttribute("aria-label", spec.title);
    return g;
  }



  R.sort = function(data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    wrap.appendChild(ask);
    const s = svg(360, 200);
    let g = el("g", {}, s);
    wrap.appendChild(s);
    const bins = document.createElement("div");
    bins.className = "carp-order-pool";
    wrap.appendChild(bins);
    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);
    const score = document.createElement("p");
    score.className = "score";
    wrap.appendChild(score);

    let i = 0;
    const buttons = data.groups.map((grp) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carp-chip";
      b.textContent = grp.label;
      b.addEventListener("click", () => {
        const item = data.items[i];
        if (grp.key === item.group) {
          fb.className = "fb good";
          fb.textContent = item.say;
          buttons.forEach((x) => { x.disabled = true; });
          i += 1;
          setTimeout(() => (i < data.items.length ? paint() : finish()), 2800);
        } else {
          fb.className = "fb bad";
          fb.textContent = item.no || "Not that family. Ask what the joint is FOR, not what it looks like.";
        }
      });
      bins.appendChild(b);
      return b;
    });

    function paint() {
      const item = data.items[i];
      buttons.forEach((x) => { x.disabled = false; });
      ask.textContent = data.ask.replace("%s", DRAW[item.draw] ? DRAW[item.draw].title : item.draw);
      score.textContent = `${i + 1} of ${data.items.length}`;
      fb.className = "fb";
      fb.textContent = "";
      g.remove();
      g = drawNamed(s, item.draw);
    }
    function finish() {
      ask.textContent = "All sorted.";
      bins.remove();
      score.textContent = "";
      fb.className = "fb good";
      fb.textContent = data.finish || "";
      done();
    }
    paint();
    mount.appendChild(wrap);
  }



  /* browse — tap each drawn item in turn to be told what it is FOR.
     Identification without a right answer to get wrong: the learner is
     meeting a set for the first time, and a quiz on unseen material
     teaches nothing but discouragement. */
  R.browse = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    ask.textContent = data.ask || "Tap each one.";
    wrap.appendChild(ask);
    const s = svg(360, 200);
    let g = drawNamed(s, data.items[0].draw);
    wrap.appendChild(s);
    const row = document.createElement("div");
    row.className = "carp-order-pool";
    wrap.appendChild(row);
    const fb = document.createElement("p");
    fb.className = "fb";
    fb.textContent = data.items[0].say;
    wrap.appendChild(fb);

    const seen = new Set([0]);
    data.items.forEach((item, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carp-chip";
      b.textContent = DRAW[item.draw] ? DRAW[item.draw].title : item.draw;
      if (idx === 0) b.classList.add("seen");
      b.addEventListener("click", () => {
        g.remove();
        g = drawNamed(s, item.draw);
        fb.className = "fb good";
        fb.textContent = item.say;
        b.classList.add("seen");
        seen.add(idx);
        if (seen.size === data.items.length) {
          ask.textContent = data.finish || "That is the set.";
          done();
        }
      });
      row.appendChild(b);
    });
    mount.appendChild(wrap);
  };


  /* questions, with an optional drawing per question ---- */

  R.questions = function(data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    wrap.appendChild(ask);
    const s = svg(340, 180);
    let g = el("g", {}, s);
    wrap.appendChild(s);
    const opts = document.createElement("div");
    opts.className = "carp-opts";
    wrap.appendChild(opts);
    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);
    const score = document.createElement("p");
    score.className = "score";
    wrap.appendChild(score);

    let i = 0, right = 0;
    function paint() {
      const q = data.items[i];
      ask.textContent = q.ask;
      score.textContent = `Question ${i + 1} of ${data.items.length}`;
      fb.className = "fb";
      fb.textContent = "";
      g.remove();
      g = q.draw ? drawNamed(s, q.draw) : el("g", {}, s);
      s.style.display = q.draw ? "" : "none";
      opts.innerHTML = "";
      q.opts.forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "carp-opt";
        b.textContent = o.t;
        b.addEventListener("click", () => {
          [...opts.children].forEach((x) => { x.disabled = true; });
          b.classList.add(o.ok ? "chosen-ok" : "chosen-no");
          if (o.ok) right += 1;
          fb.className = "fb " + (o.ok ? "good" : "bad");
          fb.textContent = o.ok ? q.why : (o.why || q.why);
          setTimeout(() => {
            i += 1;
            if (i < data.items.length) paint();
            else {
              ask.textContent = "Finished.";
              opts.innerHTML = "";
              s.style.display = "none";
              score.textContent = `${right} of ${data.items.length} correct`;
              fb.className = "fb " + (right === data.items.length ? "good" : "");
              fb.textContent = right === data.items.length
                ? "Every one right." : "Read the reasons again for the ones you missed.";
              done();
            }
          }, 2900);
        });
        opts.appendChild(b);
      });
    }
    paint();
    mount.appendChild(wrap);
  }



  /* words — the trade vocabulary of the lesson */
  R.words = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const list = document.createElement("dl");
    list.className = "carp-words";
    data.items.forEach((w) => {
      const dt = document.createElement("dt");
      dt.textContent = w.word;
      const dd = document.createElement("dd");
      dd.textContent = w.meaning;
      list.appendChild(dt);
      list.appendChild(dd);
    });
    wrap.appendChild(list);
    mount.appendChild(wrap);
    done();
  };



  function seqDemo(states, draw, w, h, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const s = svg(w, h);
    let g = el("g", {}, s);
    wrap.appendChild(s);
    const cap = document.createElement("p");
    cap.className = "carp-caption";
    wrap.appendChild(cap);
    const btns = document.createElement("div");
    btns.className = "bigbtns";
    const next = document.createElement("button");
    next.className = "big";
    next.type = "button";
    next.textContent = "Next";
    btns.appendChild(next);
    wrap.appendChild(btns);
    let i = 0;
    function paint() {
      g.remove();
      g = el("g", {}, s);
      draw(g, i);
      cap.textContent = states[i].caption;
      s.setAttribute("aria-label", states[i].caption);
      if (i >= states.length - 1) { next.disabled = true; next.textContent = "Cut made"; done(); }
    }
    next.addEventListener("click", () => { if (i < states.length - 1) { i += 1; paint(); } });
    paint();
    mount.appendChild(wrap);
  }



  function caseChoice(CASES, draw, data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    ask.textContent = data.ask;
    wrap.appendChild(ask);
    const s = svg(360, 200);
    let g = el("g", {}, s);
    draw(g, null);
    wrap.appendChild(s);
    const opts = document.createElement("div");
    opts.className = "carp-opts";
    wrap.appendChild(opts);
    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);

    Object.keys(CASES).forEach((key) => {
      const c = CASES[key];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carp-opt";
      b.textContent = c.label[0].toUpperCase() + c.label.slice(1);
      b.addEventListener("click", () => {
        g.remove();
        g = el("g", {}, s);
        draw(g, key);
        fb.className = "fb " + (c.verdict === "good" ? "good" : "bad");
        fb.textContent = c.why;
        [...opts.children].forEach((x) => { x.disabled = true; });
        b.classList.add(c.verdict === "good" ? "chosen-ok" : "chosen-no");
        if (c.verdict === "good") { done(); return; }
        const again = document.createElement("button");
        again.type = "button";
        again.className = "big small teal";
        again.textContent = "Show the right way";
        again.addEventListener("click", () => {
          const goodKey = Object.keys(CASES).find((k) => CASES[k].verdict === "good");
          g.remove();
          g = el("g", {}, s);
          draw(g, goodKey);
          fb.className = "fb good";
          fb.textContent = CASES[goodKey].why;
          again.remove();
          done();
        });
        wrap.appendChild(again);
      });
      opts.appendChild(b);
    });
    mount.appendChild(wrap);
  }


  /* The engines content files drive with their own drawings. A module
     that wants a press-through sequence or a choose-the-outcome step
     brings the states and the draw function; the behaviour is here. */

  /* ==================================================================
     ANIMATION. The Web Animations API, nothing loaded.

     Every sequence drawing in this kit is ADDITIVE: state N draws
     everything state N-1 drew and then some. So the new marks are simply
     the children added after the previous count, and animating them is
     one call rather than a diff. A line or a path draws itself on, in the
     direction a hand would draw it; anything else fades up.

     `prefers-reduced-motion` is honoured by skipping to the end state
     rather than by animating slower — a learner who asks for less motion
     wants none, not gentler.
     ================================================================== */
  const reduced = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function revealNew(g, fromIndex, ms) {
    const kids = [].slice.call(g.children, fromIndex);
    if (!kids.length || reduced()) return;
    const each = ms || 420;
    kids.forEach((node, i) => {
      const tag = node.tagName.toLowerCase();
      const drawable = tag === "line" || tag === "path";
      let len = 0;
      if (drawable && node.getTotalLength) {
        try { len = node.getTotalLength(); } catch (e) { len = 0; }
      }
      if (len > 0 && len < 4000) {
        node.style.strokeDasharray = len;
        node.style.strokeDashoffset = len;
        node.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
          { duration: each, delay: i * 60, easing: "ease-out", fill: "forwards" })
          .addEventListener("finish", () => {
            /* hand the attribute back — a dash array left on a line makes
               it disappear the moment the element is re-measured */
            node.style.strokeDasharray = "";
            node.style.strokeDashoffset = "";
          });
      } else {
        node.animate([{ opacity: 0 }, { opacity: 1 }],
          { duration: each, delay: i * 45, easing: "ease-out" });
      }
    });
  }

  const anim = { revealNew, reduced };

  /* ==================================================================
     NARRATION, spoken by the browser.

     The Ehel builds play pre-rendered clips from a CDN, which is the
     right answer for a shipped course: one voice, one reading, and a
     caption file measured against the audio. This prototype has no CDN
     and no budget for a voice, so it speaks with speechSynthesis — free,
     offline, and available wherever the page opens.

     The seam is `voice.say`. Swapping in recorded clips later means
     changing this one function, not every step that talks.
     ================================================================== */
  const voice = {
    muted: false,
    supported: typeof window.speechSynthesis !== "undefined",
    say(text) {
      if (!voice.supported || voice.muted || !text) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        u.rate = 0.95;
        u.pitch = 1;
        window.speechSynthesis.speak(u);
      } catch (e) { /* a browser that refuses is not an error worth showing */ }
    },
    hush() {
      if (!voice.supported) return;
      try { window.speechSynthesis.cancel(); } catch (e) {}
    },
  };

  /* The voice bar: a speaker, what is being said, and Explain. Same shape
     as the Ehel `.say` bar, and the Explain button reveals the step's own
     "what goes wrong here" note rather than opening a second panel. */
  function sayBar(text, onExplain) {
    const bar = document.createElement("div");
    bar.className = "say";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "speak";
    b.setAttribute("aria-label", "Read it to me");
    b.textContent = "🔊";
    b.addEventListener("click", () => voice.say(text));
    const span = document.createElement("span");
    span.textContent = text;
    bar.appendChild(b);
    bar.appendChild(span);
    if (onExplain) {
      const x = document.createElement("button");
      x.type = "button";
      x.className = "explain";
      x.setAttribute("aria-label", "Explain this step to me");
      x.innerHTML = '<span aria-hidden="true">💬</span><span class="explain-t">Explain</span>';
      x.addEventListener("click", () => onExplain(x));
      bar.appendChild(x);
    }
    return bar;
  }

  /* ==================================================================
     lecture — the unit lecture, told a part at a time.

     Modelled on the Ehel lecture step: the whole lesson before the
     learner does any of it, one narrated part at a time, with the
     drawing changing under the words. Ehel plays an mp4 where one has
     been rendered and falls back to exactly this when none has — so this
     is that fallback, drawn live rather than filmed.
     ================================================================== */
  R.lecture = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage carp-lecture";

    const counter = document.createElement("p");
    counter.className = "score";
    wrap.appendChild(counter);

    const s = svg(data.w || 420, data.h || 230);
    let g = el("g", {}, s);
    wrap.appendChild(s);

    const cap = document.createElement("p");
    cap.className = "carp-caption carp-narration";
    wrap.appendChild(cap);

    const btns = document.createElement("div");
    btns.className = "bigbtns";
    const again = document.createElement("button");
    again.type = "button";
    again.className = "big small ghost";
    again.textContent = "🔊 Listen again";
    const next = document.createElement("button");
    next.type = "button";
    next.className = "big";
    next.textContent = "Next part";
    btns.appendChild(again);
    btns.appendChild(next);
    wrap.appendChild(btns);

    let i = 0;
    const parts = data.parts;

    function paint(speak) {
      const p = parts[i];
      counter.textContent = "Part " + (i + 1) + " of " + parts.length;
      cap.textContent = p.say;

      /* Redraw from the state the part names. A part either names a
         drawing in the registry, or a sequence state the module drew. */
      const before = g.children.length;
      if (p.sequence && data.sequences && data.sequences[p.sequence]) {
        const fn = data.sequences[p.sequence];
        if (p.keep && before) {
          /* additive within the same sequence: keep what is there and
             draw the new state over it, so only the new marks animate */
          fn(g, p.state);
          anim.revealNew(g, before);
        } else {
          g.remove();
          g = el("g", {}, s);
          fn(g, p.state);
          anim.revealNew(g, 0, 300);
        }
      } else if (p.draw) {
        g.remove();
        g = drawNamed(s, p.draw);
        anim.revealNew(g, 0, 300);
      }
      if (speak !== false) voice.say(p.say);

      next.textContent = i >= parts.length - 1 ? "Lecture finished" : "Next part";
      next.disabled = i >= parts.length - 1;
      if (i >= parts.length - 1) done();
    }

    again.addEventListener("click", () => voice.say(parts[i].say));
    next.addEventListener("click", () => {
      if (i < parts.length - 1) { i += 1; paint(true); }
    });

    /* Do NOT speak on arrival. A page that starts talking the moment a
       learner reaches a step is startling, and on a shared screen it is
       worse than startling — the first line is spoken on request. */
    paint(false);
    mount.appendChild(wrap);
  };

  const engines = { seqDemo, caseChoice, drawNamed };

  window.CARP = { R, TOOLS, DRAW, engines, register, registerAll, drawNamed, arrowDefs,
                  anim, voice, sayBar, svg, el, tok };
})();
