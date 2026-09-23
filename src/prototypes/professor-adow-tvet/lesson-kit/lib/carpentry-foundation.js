/* ====================================================================
   Professor Adow TVET — the Carpentry Foundation additions.

   Loaded AFTER carpentry.js and extends the same window.CARP. Kept in
   its own file rather than growing carpentry.js past a thousand lines:
   Tools & Joints and Foundation are separate modules and a page only
   pays for the one it uses.

   Adds three drawings — the smoothing plane, the four tool faults, and
   the rough-to-finished preparation sequence — and three step kinds:

     sort       puts a tool into the group it belongs to
     inspect    looks at a tool and says what is wrong with it
     setgauge   sets a marking gauge to a dimension against a rule

   `setgauge` is the one that does something the Science kit has no
   equivalent of: the learner sets a continuous value and is judged on
   tolerance rather than on picking one of three options. Carpentry is a
   trade of millimetres and a multiple-choice question cannot ask for
   one.
   ==================================================================== */
(function () {
  "use strict";

  const C = window.CARP;
  if (!C) throw new Error("carpentry-foundation.js must load after kit.js and carpentry.js");
  const { el, svg, tok, R, engines } = C;

  const WOOD = "#C98A4B", WOOD_DARK = "#A96E35", GRAIN = "#8A5A28";
  const STEEL = "#B9C6D0", STEEL_DARK = "#7E8E9B", BRASS = "#C9A227", HANDLE = "#7A4A22";

  function timber(g, x, y, w, h, rough) {
    el("rect", { x, y, width: w, height: h, rx: 2, fill: WOOD, stroke: WOOD_DARK, "stroke-width": 2 }, g);
    const lines = Math.max(2, Math.round(h / 14));
    for (let i = 1; i <= lines; i++) {
      const gy = y + (h * i) / (lines + 1);
      el("path", {
        d: `M ${x + 3} ${gy} C ${x + w * 0.3} ${gy - 2.5}, ${x + w * 0.6} ${gy + 2.5}, ${x + w - 3} ${gy}`,
        fill: "none", stroke: GRAIN, "stroke-width": 1, opacity: 0.35,
      }, g);
    }
    /* A ROUGH-SAWN board is drawn with a ragged top edge. This is the
       only visual difference between the first state of the preparation
       sequence and the last, and without it the demo shows five pictures
       of the same board. */
    if (rough) {
      let d = `M ${x} ${y}`;
      for (let i = 0; i <= w; i += 11) d += ` l 5.5 ${i % 22 === 0 ? -3 : 3} l 5.5 ${i % 22 === 0 ? 3 : -3}`;
      el("path", { d, fill: "none", stroke: "#8A5A28", "stroke-width": 2.5, opacity: 0.85 }, g);
    }
  }

  /* ==================================================================
     THE SMOOTHING PLANE. The one major hand tool the Tools & Joints
     lesson never draws.
     ================================================================== */
  const PLANE = {
    plane: {
    title: "smoothing plane",
    w: 380, h: 200,
    draw(g) {
      el("rect", { x: 40, y: 104, width: 280, height: 40, rx: 4, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);   // body
      el("rect", { x: 40, y: 138, width: 280, height: 10, rx: 2, fill: "#98A6B2", stroke: STEEL_DARK, "stroke-width": 2 }, g); // sole
      el("rect", { x: 168, y: 140, width: 26, height: 8, fill: tok("--ground", "#0B1D2C"), stroke: STEEL_DARK, "stroke-width": 1.5 }, g); // mouth
      el("path", { d: "M 176 104 l 34 -46 l 12 8 l -30 44 z", fill: "#8C99A5", stroke: STEEL_DARK, "stroke-width": 2 }, g);   // iron
      el("path", { d: "M 186 78 l 26 -34 l 10 7 l -24 33 z", fill: BRASS, stroke: "#8A6E12", "stroke-width": 1.5 }, g);        // lever cap
      el("path", { d: "M 232 104 q 38 -6 46 -46 l 16 4 q -8 50 -50 58 z", fill: HANDLE, stroke: "#5C3517", "stroke-width": 2 }, g); // tote
      el("path", { d: "M 62 104 q 0 -34 22 -34 q 22 0 22 34 z", fill: HANDLE, stroke: "#5C3517", "stroke-width": 2 }, g);      // knob
    },
    parts: [
      { id: "sole", label: "sole", box: [36, 134, 288, 20], say: "The sole. The flat underside that rides on the wood. If the sole is not flat the plane cannot make the wood flat either." },
      { id: "mouth", label: "mouth", box: [162, 134, 40, 20], say: "The mouth. The slot the shaving comes up through. A narrow mouth gives a finer finish on difficult grain." },
      { id: "iron", label: "iron", box: [170, 54, 56, 52], say: "The iron, or blade. It projects a hair below the sole. Too much and it digs; too little and it rides over the wood without cutting." },
      { id: "knob", label: "knob", box: [56, 66, 58, 40], say: "The front knob. The hand that presses down. At the start of a stroke the pressure is here." },
      { id: "tote", label: "tote", box: [228, 56, 72, 50], say: "The tote, the rear handle. It pushes. At the end of a stroke the pressure moves back to it, so the plane does not tip off the end and round the edge." },
    ],
  },
  };

  /* ==================================================================
     THE FOUR FAULTS. Each is a small drawing of a tool that should be
     taken out of service, and one sound tool as the control.
     ================================================================== */
  const FAULTS = {
    mushroom: {
      title: "a cold chisel head",
      draw(g) {
        el("rect", { x: 70, y: 70, width: 26, height: 84, rx: 3, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 60 70 q 10 -18 23 -18 q 13 0 23 18 z", fill: "#D8E2EA", stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 58 70 l 40 0", stroke: tok("--bad", "#F0806F"), "stroke-width": 3 }, g);
      },
    },
    split: {
      title: "a chisel handle",
      draw(g) {
        el("rect", { x: 40, y: 96, width: 70, height: 26, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("rect", { x: 110, y: 90, width: 16, height: 38, rx: 2, fill: BRASS, stroke: "#8A6E12", "stroke-width": 2 }, g);
        el("path", { d: "M 126 88 h 54 a 12 12 0 0 1 12 12 v 16 a 12 12 0 0 1 -12 12 h -54 z", fill: HANDLE, stroke: "#5C3517", "stroke-width": 2 }, g);
        el("path", { d: "M 140 90 l 12 34 M 160 89 l 9 35", stroke: tok("--bad", "#F0806F"), "stroke-width": 2.5 }, g);
      },
    },
    loose: {
      title: "a mallet head",
      draw(g) {
        el("rect", { x: 66, y: 62, width: 76, height: 50, rx: 4, fill: "#8B5A2B", stroke: "#5C3517", "stroke-width": 2 }, g);
        el("rect", { x: 96, y: 108, width: 16, height: 60, rx: 2, fill: HANDLE, stroke: "#5C3517", "stroke-width": 2 }, g);
        el("path", { d: "M 92 108 h 24", stroke: tok("--bad", "#F0806F"), "stroke-width": 3 }, g);
        el("path", { d: "M 120 96 l 14 -8 M 120 104 l 14 8", stroke: tok("--bad", "#F0806F"), "stroke-width": 2 }, g);
      },
    },
    blunt: {
      title: "a plane iron",
      draw(g) {
        el("path", { d: "M 60 96 h 130 v 26 h -130 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 60 96 q -14 13 0 26", fill: "#D8E2EA", stroke: tok("--bad", "#F0806F"), "stroke-width": 3 }, g);
      },
    },
    sound: {
      title: "a firmer chisel",
      draw(g) {
        el("path", { d: "M 60 96 h 120 v 26 h -120 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 60 96 l -16 13 l 16 13 z", fill: "#D8E2EA", stroke: tok("--good", "#4FD1A0"), "stroke-width": 2.5 }, g);
        el("rect", { x: 180, y: 90, width: 18, height: 38, rx: 2, fill: BRASS, stroke: "#8A6E12", "stroke-width": 2 }, g);
        el("path", { d: "M 198 88 h 56 a 12 12 0 0 1 12 12 v 16 a 12 12 0 0 1 -12 12 h -56 z", fill: HANDLE, stroke: "#5C3517", "stroke-width": 2 }, g);
      },
    },
  };

  /* ==================================================================
     ROUGH TO FINISHED. The preparation sequence, six states.
     ================================================================== */
  const PREP_STATES = [
    { caption: "A rough-sawn board. Not straight, not square, not to size — and nothing can be measured from it yet." },
    { caption: "Marked to length with an allowance left on for sawing and planing. Never cut to the finished line." },
    { caption: "Sawn, still oversize. The allowance is what the plane will take off." },
    { caption: "One wide face planed straight along its length and across its width. This is the FACE SIDE, and it is marked." },
    { caption: "One edge planed straight and square to the face side. This is the FACE EDGE. The two marks meet." },
    { caption: "Gauged from the face side and face edge, then planed to the gauge lines. Now it is to size." },
  ];

  function drawPrep(g, i) {
    const X = 50, W = 300;
    const ink = tok("--ink", "#fff"), teal = tok("--teal", "#35BFB2");
    const H = i >= 5 ? 66 : 82;
    const Y = 60 + (82 - H) / 2;
    const w = i >= 2 ? W : W + 38;
    timber(g, X, Y, w, H, i <= 2);

    if (i === 1) {
      el("line", { x1: X + W, y1: Y - 12, x2: X + W, y2: Y + H + 12, stroke: ink, "stroke-width": 2.5 }, g);
      el("line", { x1: X + W, y1: Y - 6, x2: X + w, y2: Y - 6, stroke: tok("--accent", "#E9744F"), "stroke-width": 2.5 }, g);
      el("text", { x: X + W + 20, y: Y - 14, fill: tok("--accent", "#E9744F"), "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "allowance";
    }
    if (i >= 3) {
      /* the face-side mark: the carpenter's looping f */
      el("path", {
        d: `M ${X + 60} ${Y + H * 0.74} c 0 -20 5 -28 11 -28 4 0 6 4 5 8 M ${X + 60} ${Y + H * 0.5} h 15`,
        fill: "none", stroke: ink, "stroke-width": 2.2, "stroke-linecap": "round", opacity: 0.9,
      }, g);
      el("text", { x: X + 60, y: Y - 10, fill: ink, "font-size": 13, "font-weight": 700 }, g).textContent = "face side";
    }
    if (i >= 4) {
      el("line", { x1: X, y1: Y + H, x2: X + w, y2: Y + H, stroke: teal, "stroke-width": 3.5 }, g);
      el("text", { x: X + w - 8, y: Y + H + 20, fill: teal, "font-size": 13, "text-anchor": "end", "font-weight": 700 }, g).textContent = "face edge";
    }
    if (i === 5) {
      el("line", { x1: X, y1: Y + H * 0.28, x2: X + w, y2: Y + H * 0.28, stroke: tok("--gold", "#F4C95D"), "stroke-width": 2, "stroke-dasharray": "6 4" }, g);
      el("text", { x: X + w + 6, y: Y + H * 0.28 + 5, fill: tok("--gold", "#F4C95D"), "font-size": 13, "font-weight": 700 }, g).textContent = "gauged";
    }
  }

  /* ==================================================================
     THE RULE AND THE GAUGE, for setgauge.
     ================================================================== */
  function drawRule(g, mm) {
    const X = 40, Y = 18, PX = 5.2; // pixels per mm
    el("rect", { x: X, y: Y, width: 60 * PX, height: 34, rx: 3, fill: "#E6EDF2", stroke: STEEL_DARK, "stroke-width": 2 }, g);
    for (let m = 0; m <= 60; m += 1) {
      const big = m % 10 === 0, mid = m % 5 === 0;
      el("line", {
        x1: X + m * PX, y1: Y, x2: X + m * PX, y2: Y + (big ? 16 : mid ? 11 : 7),
        stroke: "#33414C", "stroke-width": big ? 1.6 : 1,
      }, g);
      if (big) {
        el("text", { x: X + m * PX, y: Y + 29, fill: "#33414C", "font-size": 11, "text-anchor": "middle", "font-weight": 700 }, g).textContent = String(m);
      }
    }
    /* the gauge, its fence at 0 and its pin at the set dimension */
    const px = X + mm * PX;
    el("rect", { x: X - 16, y: Y + 46, width: 16, height: 58, rx: 3, fill: "#8B5A2B", stroke: "#5C3517", "stroke-width": 2 }, g);
    el("rect", { x: X, y: Y + 64, width: Math.max(mm * PX, 3), height: 16, rx: 2, fill: HANDLE, stroke: "#5C3517", "stroke-width": 2 }, g);
    el("path", { d: `M ${px} ${Y + 64} l 9 8 l -9 8 z`, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 1.5 }, g);
    el("line", { x1: px, y1: Y, x2: px, y2: Y + 64, stroke: tok("--teal", "#35BFB2"), "stroke-width": 2, "stroke-dasharray": "4 3" }, g);
    el("text", { x: px, y: Y + 118, fill: tok("--teal", "#35BFB2"), "font-size": 15, "text-anchor": "middle", "font-weight": 700 }, g).textContent = mm.toFixed(1) + " mm";
  }

  /* ==================================================================
     STEP RENDERERS
     ================================================================== */

  /* sort — one tool at a time into the group it belongs to. kit.js owns
     the REGISTRY variant (data.registry); this is the older one, which
     takes its items by tool name, and it stays because the Foundation
     lesson is written against it. */
  const baseSort = R.sort;
  R.sort = function (data, mount, done) {
    if (data.registry && baseSort) return baseSort(data, mount, done);
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    wrap.appendChild(ask);

    const s = svg(360, 180);
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
          i += 1;
          setTimeout(() => (i < data.items.length ? paint() : finish()), 2400);
          buttons.forEach((x) => { x.disabled = true; });
        } else {
          fb.className = "fb bad";
          fb.textContent = item.no || "Not that group. Look at what the tool does, not what it is made of.";
        }
      });
      bins.appendChild(b);
      return b;
    });

    function paint() {
      const item = data.items[i];
      buttons.forEach((x) => { x.disabled = false; });
      ask.textContent = "Which group does the " + item.label + " belong to?";
      score.textContent = `Tool ${i + 1} of ${data.items.length}`;
      fb.className = "fb";
      fb.textContent = "";
      g.remove();
      g = el("g", {}, s);
      const tool = C.TOOLS[item.tool];
      if (tool) {
        const scale = Math.min(360 / tool.w, 180 / tool.h);
        g.setAttribute("transform", `scale(${scale.toFixed(3)})`);
        tool.draw(g);
      } else if (FAULTS[item.draw]) {
        FAULTS[item.draw].draw(g);
      }
      s.setAttribute("aria-label", item.label);
    }

    function finish() {
      ask.textContent = "Every tool grouped.";
      bins.remove();
      fb.className = "fb good";
      fb.textContent = data.finish || "Tools are grouped by what they DO.";
      score.textContent = "";
      done();
    }
    paint();
    mount.appendChild(wrap);
  };

  /* inspect — look at a tool and say what is wrong with it */
  R.inspect = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    wrap.appendChild(ask);

    const s = svg(300, 190);
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

    let i = 0;
    function paint() {
      const item = data.items[i];
      ask.textContent = item.ask;
      score.textContent = `Tool ${i + 1} of ${data.items.length}`;
      fb.className = "fb";
      fb.textContent = "";
      g.remove();
      g = el("g", {}, s);
      FAULTS[item.draw].draw(g);
      s.setAttribute("aria-label", FAULTS[item.draw].title);
      opts.innerHTML = "";
      item.opts.forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "carp-opt";
        b.textContent = o.t;
        b.addEventListener("click", () => {
          [...opts.children].forEach((x) => { x.disabled = true; });
          b.classList.add(o.ok ? "chosen-ok" : "chosen-no");
          fb.className = "fb " + (o.ok ? "good" : "bad");
          fb.textContent = o.ok ? item.why : (o.why || item.why);
          setTimeout(() => {
            i += 1;
            if (i < data.items.length) paint();
            else {
              ask.textContent = "Every tool inspected.";
              opts.innerHTML = "";
              score.textContent = "";
              fb.className = "fb good";
              fb.textContent = data.finish || "A tool is inspected BEFORE it is picked up, not after it has hurt somebody.";
              done();
            }
          }, 3000);
        });
        opts.appendChild(b);
      });
    }
    paint();
    mount.appendChild(wrap);
  };

  /* setgauge — set a marking gauge to a dimension, judged on tolerance.
     The only step in either module that asks for a continuous value. A
     multiple choice cannot ask "set it to 12 millimetres", and a trade
     of millimetres should be asked at least once. */
  R.setgauge = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    wrap.appendChild(ask);

    const s = svg(400, 150);
    let g = el("g", {}, s);
    wrap.appendChild(s);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "60";
    slider.step = "0.5";
    slider.value = "0";
    slider.className = "carp-slider";
    slider.setAttribute("aria-label", "Set the gauge in millimetres");
    wrap.appendChild(slider);

    const btns = document.createElement("div");
    btns.className = "bigbtns";
    const lock = document.createElement("button");
    lock.className = "big";
    lock.type = "button";
    lock.textContent = "Lock it";
    btns.appendChild(lock);
    wrap.appendChild(btns);

    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);

    let i = 0;
    function paint() {
      g.remove();
      g = el("g", {}, s);
      drawRule(g, Number(slider.value));
      s.setAttribute("aria-label", "Gauge set to " + slider.value + " millimetres");
    }
    function round() {
      const t = data.targets[i];
      ask.textContent = t.ask;
      slider.value = "0";
      lock.disabled = false;
      fb.className = "fb";
      fb.textContent = "";
      paint();
    }
    slider.addEventListener("input", paint);
    lock.addEventListener("click", () => {
      const t = data.targets[i];
      const set = Number(slider.value);
      const off = Math.abs(set - t.mm);
      lock.disabled = true;
      if (off <= 0.5) {
        fb.className = "fb good";
        fb.textContent = t.why;
        i += 1;
        setTimeout(() => {
          if (i < data.targets.length) round();
          else {
            ask.textContent = "Both set.";
            slider.remove();
            lock.remove();
            fb.className = "fb good";
            fb.textContent = data.finish || "Set it, lock it, then check it against the rule before you touch the wood.";
            done();
          }
        }, 2600);
      } else {
        fb.className = "fb bad";
        fb.textContent = "That is " + off.toFixed(1) + " mm out. " + (t.miss ||
          "Every cheek cut from this setting would be out by the same amount, on both members, in the same direction.");
        setTimeout(() => { lock.disabled = false; }, 900);
      }
    });
    round();
    mount.appendChild(wrap);
  };

  C.registerAll(PLANE, { w: 380, h: 200 });
  C.registerAll(FAULTS, { w: 300, h: 190 });
  C.FAULTS = FAULTS;
  C.PREP_STATES = PREP_STATES;
  C.drawPrep = drawPrep;

  /* The Foundation lesson's demo walks the preparation sequence, not
     the marking-out one, so the shared `demo` renderer is told which
     sequence to draw. carpentry.js's own demo keeps its default. */
  const baseDemo = R.demo;
  R.demo = function (data, mount, done) {
    if (data && data.sequence === "prep") return prepDemo(data, mount, done);
    return baseDemo(data, mount, done);
  };

  function prepDemo(data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const s = svg(420, 200);
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
      drawPrep(g, i);
      cap.textContent = PREP_STATES[i].caption;
      s.setAttribute("aria-label", PREP_STATES[i].caption);
      if (i >= PREP_STATES.length - 1) {
        next.disabled = true;
        next.textContent = "Prepared to size";
        done();
      }
    }
    next.addEventListener("click", () => { if (i < PREP_STATES.length - 1) { i += 1; paint(); } });
    paint();
    mount.appendChild(wrap);
  }
})();