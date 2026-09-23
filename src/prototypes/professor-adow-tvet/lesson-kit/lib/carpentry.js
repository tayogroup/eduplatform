/* ====================================================================
   Professor Adow TVET — the carpentry drawing and step library.

   Modelled on ehel-academy/science/lesson-kit/lib/science.js: the same
   shape (one IIFE, step machinery first, then drawings, then the
   interactive parts) and the same design tokens from lesson.css, so the
   two builds look like one product. Nothing is copied from it — every
   drawing here is carpentry's own, and the step kinds are the trade's.

   Everything is drawn in SVG at run time. No photographs and no image
   files: a drawing scales to any screen, can be taken apart and
   labelled, costs nothing to load, and can be corrected by editing a
   number rather than re-shooting a bench.

   TIMBER IS DRAWN, NOT TEXTURED. Grain is a handful of bezier lines at
   low opacity, because a photographic wood fill at this size reads as
   noise and fights the marking-out lines, which are the whole point of
   the lesson.
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

  function timber(g, x, y, w, h, opts) {
    const o = opts || {};
    el("rect", { x, y, width: w, height: h, rx: 2, fill: o.fill || WOOD, stroke: WOOD_DARK, "stroke-width": 2 }, g);
    /* grain: long shallow curves along the length, never across it —
       drawing grain across a board is the single most common mistake in
       a carpentry illustration and a trainer spots it instantly. */
    const lines = Math.max(2, Math.round(h / 14));
    for (let i = 1; i <= lines; i++) {
      const gy = y + (h * i) / (lines + 1);
      const d = `M ${x + 3} ${gy} C ${x + w * 0.3} ${gy - 2.5}, ${x + w * 0.6} ${gy + 2.5}, ${x + w - 3} ${gy}`;
      el("path", { d, fill: "none", stroke: GRAIN, "stroke-width": 1, opacity: 0.35 }, g);
    }
    if (o.endGrain) {
      /* the end of the board: darker, with the growth rings showing */
      const ex = o.endGrain === "left" ? x : x + w - 10;
      el("rect", { x: ex, y, width: 10, height: h, fill: WOOD_END, stroke: WOOD_DARK, "stroke-width": 2 }, g);
      for (let i = 1; i <= 3; i++) {
        el("path", {
          d: `M ${ex + 1} ${y + (h * i) / 4} q 4 -3 8 0`, fill: "none",
          stroke: GRAIN, "stroke-width": 1, opacity: 0.5,
        }, g);
      }
    }
    return g;
  }

  /* Face-side and face-edge marks. These are the carpenter's own
     handwriting on the wood — a looping 'f' on the face side and a mark
     that meets it on the face edge — and every measurement in the lesson
     is taken from them. */
  function faceMarks(g, x, y, w, h) {
    const ink = tok("--ink", "#fff");
    el("path", {
      d: `M ${x + w * 0.45} ${y + h * 0.72} c 0 -18 4 -26 10 -26 4 0 6 3 5 7 M ${x + w * 0.45} ${y + h * 0.5} h 14`,
      fill: "none", stroke: ink, "stroke-width": 2.2, "stroke-linecap": "round", opacity: 0.85,
    }, g);
    return g;
  }

  /* ==================================================================
     THE TOOLS. Each is drawn at its own natural size and scaled by the
     renderer. Parts are returned with their hit boxes so `label` can
     make them tappable.
     ================================================================== */
  const STEEL = "#B9C6D0", STEEL_DARK = "#7E8E9B", BRASS = "#C9A227", HANDLE = "#7A4A22";

  const TOOLS = {
    trySquare: {
      title: "try square",
      w: 300, h: 210,
      draw(g) {
        /* stock (the thick handle) vertical, blade horizontal, 90° */
        el("rect", { x: 40, y: 30, width: 26, height: 150, rx: 3, fill: HANDLE, stroke: "#5C3517", "stroke-width": 2 }, g);
        el("rect", { x: 46, y: 36, width: 4, height: 138, fill: BRASS, opacity: 0.8 }, g);
        el("rect", { x: 66, y: 30, width: 200, height: 18, rx: 2, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        for (let i = 1; i < 10; i++) {
          el("line", { x1: 66 + i * 20, y1: 30, x2: 66 + i * 20, y2: 30 + (i % 5 === 0 ? 10 : 6), stroke: STEEL_DARK, "stroke-width": 1.2 }, g);
        }
        /* the right angle, called out */
        el("path", { d: "M 66 62 v -14 h 14", fill: "none", stroke: tok("--teal", "#35BFB2"), "stroke-width": 2.5 }, g);
      },
      parts: [
        { id: "stock", label: "stock", box: [36, 26, 34, 158], say: "The stock. The thick wooden handle. It is pressed hard against the face edge — if it lifts, the line is not square." },
        { id: "blade", label: "blade", box: [66, 24, 200, 30], say: "The blade. Steel, marked in millimetres, set at exactly ninety degrees to the stock." },
        { id: "angle", label: "right angle", box: [58, 34, 34, 34], say: "Ninety degrees between stock and blade. This is the whole tool. Drop a try square on the floor and it may never be square again." },
      ],
    },

    markingGauge: {
      title: "marking gauge",
      w: 320, h: 190,
      draw(g) {
        el("rect", { x: 30, y: 78, width: 250, height: 20, rx: 3, fill: HANDLE, stroke: "#5C3517", "stroke-width": 2 }, g);  // stem
        el("rect", { x: 96, y: 44, width: 44, height: 88, rx: 5, fill: "#8B5A2B", stroke: "#5C3517", "stroke-width": 2 }, g); // fence/stock
        el("circle", { cx: 118, cy: 40, r: 9, fill: BRASS, stroke: "#8A6E12", "stroke-width": 2 }, g);                        // thumbscrew
        el("path", { d: "M 272 88 l 12 -8 v 16 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 1.5 }, g);                // the pin/spur
      },
      parts: [
        { id: "fence", label: "fence", box: [92, 40, 52, 96], say: "The fence, or stock. It rides against the face side. The distance from fence to pin is the measurement you have set." },
        { id: "stem", label: "stem", box: [26, 74, 258, 28], say: "The stem. It slides through the fence, and the thumbscrew locks it." },
        { id: "pin", label: "pin", box: [266, 74, 28, 28], say: "The pin, or spur. It scores a line in the wood. A scored line is finer than a pencil line, and it gives the chisel somewhere to sit." },
        { id: "screw", label: "thumbscrew", box: [104, 26, 30, 30], say: "The thumbscrew. Set the measurement, lock it, then check it against a rule before you mark anything." },
      ],
    },

    tenonSaw: {
      title: "tenon saw",
      w: 360, h: 180,
      draw(g) {
        el("rect", { x: 30, y: 74, width: 250, height: 34, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);   // blade
        el("rect", { x: 30, y: 66, width: 250, height: 12, rx: 3, fill: "#6E7B86", stroke: STEEL_DARK, "stroke-width": 2 }, g); // the back
        /* teeth */
        let d = `M 30 108`;
        for (let x = 30; x < 280; x += 8) d += ` l 4 8 l 4 -8`;
        el("path", { d, fill: "none", stroke: STEEL_DARK, "stroke-width": 2 }, g);
        /* closed handle */
        el("path", {
          d: "M 280 60 h 46 a 16 16 0 0 1 16 16 v 36 a 16 16 0 0 1 -16 16 h -46 z M 296 80 h 26 v 28 h -26 z",
          fill: HANDLE, stroke: "#5C3517", "stroke-width": 2, "fill-rule": "evenodd",
        }, g);
      },
      parts: [
        { id: "back", label: "back", box: [26, 60, 258, 20], say: "The back: a heavy brass or steel spine. It stiffens the thin blade so the cut runs straight. It is also what stops the saw cutting deeper than the blade is wide." },
        { id: "blade", label: "blade", box: [26, 80, 258, 30], say: "The blade. Thin, so it takes a narrow kerf and wastes little wood." },
        { id: "teeth", label: "teeth", box: [26, 104, 258, 18], say: "The teeth. Small and many — a tenon saw has fine teeth for accurate cuts across the grain." },
        { id: "handle", label: "handle", box: [276, 56, 88, 76], say: "The closed handle. It sets the angle of your wrist, which is why the saw wants to cut straight if you let it." },
      ],
    },

    chisel: {
      title: "firmer chisel",
      w: 340, h: 150,
      draw(g) {
        el("path", { d: "M 40 62 h 170 v 26 h -170 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);   // blade
        el("path", { d: "M 40 62 l -18 13 l 18 13 z", fill: "#D8E2EA", stroke: STEEL_DARK, "stroke-width": 2 }, g); // bevel edge
        el("rect", { x: 210, y: 56, width: 20, height: 38, rx: 2, fill: BRASS, stroke: "#8A6E12", "stroke-width": 2 }, g); // ferrule
        el("path", { d: "M 230 52 h 62 a 14 14 0 0 1 14 14 v 18 a 14 14 0 0 1 -14 14 h -62 z", fill: HANDLE, stroke: "#5C3517", "stroke-width": 2 }, g);
      },
      parts: [
        { id: "edge", label: "cutting edge", box: [16, 56, 40, 40], say: "The cutting edge. Ground and honed. A sharp chisel is safer than a blunt one, because a blunt one needs force and force is what slips." },
        { id: "blade", label: "blade", box: [40, 56, 170, 38], say: "The blade. Its width is the size of the chisel — a 12 millimetre chisel has a 12 millimetre blade." },
        { id: "ferrule", label: "ferrule", box: [206, 50, 30, 50], say: "The ferrule. A brass ring that stops the handle splitting when the chisel is struck." },
        { id: "handle", label: "handle", box: [230, 46, 90, 58], say: "The handle. Struck with a mallet, never with a claw hammer — a steel face splits the handle." },
      ],
    },
  };

  /* ==================================================================
     THE MARKING-OUT SEQUENCE. One drawing, six states. This is the
     lesson's spine: a board becomes a marked-out halving joint one
     action at a time, and the learner presses through it.
     ================================================================== */
  const MARK_STATES = [
    { key: "blank",    caption: "A prepared piece. Planed straight, square, and gauged to size." },
    { key: "face",     caption: "The face side and face edge are marked. Every measurement from now on is taken from these two." },
    { key: "shoulder", caption: "The shoulder line, squared across the face and down both edges with the try square." },
    { key: "gauge",    caption: "The gauge line, scored along half the thickness, fence against the face side." },
    { key: "waste",    caption: "The waste is hatched. Now there is no way to cut the wrong piece." },
    { key: "cut",      caption: "Sawn on the waste side of the line, and pared to the line with a chisel." },
  ];

  function drawMarkOut(g, stateIndex) {
    const X = 50, Y = 60, W = 300, H = 90;
    const ink = tok("--ink", "#fff"), bad = tok("--bad", "#F0806F"), teal = tok("--teal", "#35BFB2");
    const s = stateIndex;

    if (s >= 5) {
      /* the halving cut away: the notch is gone from the top half */
      timber(g, X, Y, W, H, { endGrain: "right" });
      el("rect", { x: X + W - 120, y: Y, width: 120, height: H / 2, fill: tok("--ground", "#0B1D2C"), stroke: WOOD_DARK, "stroke-width": 2 }, g);
      el("rect", { x: X + W - 120, y: Y + H / 2, width: 120, height: 3, fill: WOOD_DARK }, g);
    } else {
      timber(g, X, Y, W, H, { endGrain: "right" });
    }

    if (s >= 1) faceMarks(g, X, Y, W, H);

    if (s >= 2) {
      /* shoulder line across the face and down the edge */
      el("line", { x1: X + W - 120, y1: Y - 10, x2: X + W - 120, y2: Y + H + 10, stroke: ink, "stroke-width": 2.5 }, g);
      el("text", { x: X + W - 120, y: Y - 18, fill: ink, "font-size": 15, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "shoulder";
    }
    if (s >= 3) {
      /* gauge line at half thickness, from the shoulder to the end */
      el("line", { x1: X + W - 120, y1: Y + H / 2, x2: X + W, y2: Y + H / 2, stroke: teal, "stroke-width": 2.5 }, g);
      el("text", { x: X + W + 8, y: Y + H / 2 + 5, fill: teal, "font-size": 15, "font-weight": 700 }, g).textContent = "½";
    }
    if (s === 4) {
      /* waste hatching on the piece that comes off */
      for (let i = 0; i < 14; i++) {
        const hx = X + W - 118 + i * 9;
        el("line", { x1: hx, y1: Y + 2, x2: hx - 14, y2: Y + H / 2 - 2, stroke: bad, "stroke-width": 1.6, opacity: 0.9 }, g);
      }
      el("text", { x: X + W - 60, y: Y - 18, fill: bad, "font-size": 15, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "waste";
    }
  }

  /* ==================================================================
     WHICH SIDE OF THE LINE? Three outcomes of one saw cut, drawn big.
     This is the single most consequential habit in the trade and it is
     worth its own drawing.
     ================================================================== */
  const KERF_CASES = {
    waste: {
      label: "on the waste side",
      verdict: "good",
      why: "The line is still on the work. The joint is full size and a shaving off the chisel brings it exactly to the line.",
    },
    on: {
      label: "down the middle of the line",
      verdict: "bad",
      why: "Half the line has gone with the kerf. The joint is now half a saw-blade undersize — slack, and nothing will put it back.",
    },
    work: {
      label: "on the work side",
      verdict: "bad",
      why: "A whole saw-blade of wood has gone from the joint. It is undersize, the shoulder will show a gap, and the piece is scrap.",
    },
  };

  function drawKerf(g, which) {
    const X = 40, Y = 40, W = 240, H = 110;
    const ink = tok("--ink", "#fff"), good = tok("--good", "#4FD1A0"), bad = tok("--bad", "#F0806F");
    timber(g, X, Y, W, H, {});
    const lineX = X + 130;
    el("line", { x1: lineX, y1: Y - 8, x2: lineX, y2: Y + H + 8, stroke: ink, "stroke-width": 2.5 }, g);

    /* `which` falsy = the piece before any cut. The first version drew the
       CORRECT kerf at 25% opacity as the resting state, which showed the
       learner the answer before they were asked. */
    if (!which) return;
    const offset = which === "waste" ? 7 : which === "on" ? 0 : -7;
    el("rect", { x: lineX + offset - 3.5, y: Y, width: 7, height: H, fill: tok("--ground", "#0B1D2C"), opacity: 0.95 }, g);
    const c = which === "waste" ? good : bad;
    el("rect", { x: lineX + offset - 3.5, y: Y, width: 7, height: H, fill: "none", stroke: c, "stroke-width": 2 }, g);
    el("text", { x: lineX + offset, y: Y + H + 26, fill: c, "font-size": 14, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "kerf";
    el("text", { x: lineX, y: Y - 16, fill: ink, "font-size": 14, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "your line";
  }

  /* ==================================================================
     THE HALVING JOINT, apart and together.
     ================================================================== */
  /* THE CLOSED JOINT IS NOT TWO NOTCHED MEMBERS DRAWN ON TOP OF EACH
     OTHER. The first version punched each member's notch in the ground
     colour and then overlapped them, which paints a hole straight
     through the lap — the one place the joint is supposed to be solid.

     Apart: two members, each with half its thickness removed, so the
     learner can see what was cut. Together: ONE continuous piece of
     full thickness, with the two shoulder lines and the interface line
     at half thickness showing where the members meet. That is what a
     halving joint looks like in elevation, and "the two faces finish
     flush" is only true in the second drawing. */
  function drawHalving(g, closed) {
    const ink = tok("--ink", "#fff");
    const MW = 220, MH = 62, LAP = 104;

    if (closed) {
      const X = 50, Y = 92, W = MW * 2 - LAP;
      timber(g, X, Y, W, MH, {});
      /* the lap: shoulders at each end of it, interface across it */
      const s1 = X + MW - LAP, s2 = X + MW;
      el("line", { x1: s1, y1: Y, x2: s1, y2: Y + MH, stroke: WOOD_DARK, "stroke-width": 2 }, g);
      el("line", { x1: s2, y1: Y, x2: s2, y2: Y + MH, stroke: WOOD_DARK, "stroke-width": 2 }, g);
      el("line", { x1: s1, y1: Y + MH / 2, x2: s2, y2: Y + MH / 2, stroke: WOOD_DARK, "stroke-width": 2, "stroke-dasharray": "5 4" }, g);
      el("text", { x: (s1 + s2) / 2, y: Y - 12, fill: tok("--good", "#4FD1A0"), "font-size": 15, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "the lap";
      /* flush faces, called out top and bottom */
      el("line", { x1: X - 6, y1: Y, x2: X + W + 6, y2: Y, stroke: tok("--good", "#4FD1A0"), "stroke-width": 2, opacity: 0.85 }, g);
      el("line", { x1: X - 6, y1: Y + MH, x2: X + W + 6, y2: Y + MH, stroke: tok("--good", "#4FD1A0"), "stroke-width": 2, opacity: 0.85 }, g);
      el("text", { x: X + W / 2, y: Y + MH + 26, fill: tok("--good", "#4FD1A0"), "font-size": 14, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "faces flush";
      return;
    }

    /* apart */
    const AX = 50, AY = 140;
    timber(g, AX, AY, MW, MH, {});
    el("rect", { x: AX + MW - LAP, y: AY, width: LAP, height: MH / 2, fill: tok("--ground", "#0B1D2C"), stroke: WOOD_DARK, "stroke-width": 2 }, g);

    const BX = AX + MW - LAP, BY = AY - MH - 46;
    timber(g, BX, BY, MW, MH, {});
    el("rect", { x: BX, y: BY + MH / 2, width: LAP, height: MH / 2, fill: tok("--ground", "#0B1D2C"), stroke: WOOD_DARK, "stroke-width": 2 }, g);

    el("path", { d: `M ${BX + LAP / 2} ${BY + MH + 10} v 24`, stroke: ink, "stroke-width": 2, "marker-end": "url(#carp-arrow)", opacity: 0.7 }, g);
    el("text", { x: BX + LAP / 2 + 14, y: BY + MH + 30, fill: ink, "font-size": 14, opacity: 0.75 }, g).textContent = "half the thickness off each";
  }

  function arrowDefs(s) {
    const defs = el("defs", {}, s);
    const m = el("marker", { id: "carp-arrow", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto" }, defs);
    el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: tok("--ink", "#fff"), opacity: 0.7 }, m);
  }

  /* ==================================================================
     STEP RENDERERS. Each takes the step's data and a mount element and
     returns nothing; each calls done() when the learner has finished it.
     ================================================================== */
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

  /* demo — press Next through a drawn sequence that changes state */
  R.demo = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const s = svg(400, 210);
    arrowDefs(s);
    let g = el("g", {}, s);
    wrap.appendChild(s);

    const cap = document.createElement("p");
    cap.className = "carp-caption";
    wrap.appendChild(cap);

    const btns = document.createElement("div");
    btns.className = "bigbtns";
    const nextBtn = document.createElement("button");
    nextBtn.className = "big";
    nextBtn.type = "button";
    nextBtn.textContent = "Next";
    btns.appendChild(nextBtn);
    wrap.appendChild(btns);

    let i = 0;
    function paint() {
      g.remove();
      g = el("g", {}, s);
      drawMarkOut(g, i);
      cap.textContent = MARK_STATES[i].caption;
      s.setAttribute("aria-label", MARK_STATES[i].caption);
      if (i >= MARK_STATES.length - 1) {
        nextBtn.disabled = true;
        nextBtn.textContent = "Marked out and cut";
        done();
      }
    }
    nextBtn.addEventListener("click", () => { if (i < MARK_STATES.length - 1) { i += 1; paint(); } });
    paint();
    mount.appendChild(wrap);
  };

  /* predict — choose an outcome, then see it drawn */
  R.predict = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    ask.textContent = data.ask;
    wrap.appendChild(ask);

    const s = svg(320, 200);
    let g = el("g", {}, s);
    drawKerf(g, null);
    wrap.appendChild(s);

    const btns = document.createElement("div");
    btns.className = "carp-opts";
    wrap.appendChild(btns);
    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);

    Object.keys(KERF_CASES).forEach((key) => {
      const c = KERF_CASES[key];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carp-opt";
      b.textContent = "Saw " + c.label;
      b.addEventListener("click", () => {
        g.remove();
        g = el("g", {}, s);
        drawKerf(g, key);
        fb.className = "fb " + (c.verdict === "good" ? "good" : "bad");
        fb.textContent = c.why;
        [...btns.children].forEach((x) => { x.disabled = true; });
        b.classList.add(c.verdict === "good" ? "chosen-ok" : "chosen-no");
        if (c.verdict !== "good") {
          const again = document.createElement("button");
          again.type = "button";
          again.className = "big small teal";
          again.textContent = "Show the right cut";
          again.addEventListener("click", () => {
            g.remove();
            g = el("g", {}, s);
            drawKerf(g, "waste");
            fb.className = "fb good";
            fb.textContent = KERF_CASES.waste.why;
            again.remove();
            done();
          });
          wrap.appendChild(again);
        } else {
          done();
        }
      });
      btns.appendChild(b);
    });
    mount.appendChild(wrap);
  };

  /* build — bring the two members together and see the joint close */
  R.build = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    ask.textContent = data.ask || "Bring the two members together.";
    wrap.appendChild(ask);

    const s = svg(420, 230);
    arrowDefs(s);
    let g = el("g", {}, s);
    drawHalving(g, false);
    wrap.appendChild(s);

    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);

    const btns = document.createElement("div");
    btns.className = "bigbtns";
    const close = document.createElement("button");
    close.className = "big";
    close.type = "button";
    close.textContent = "Close the joint";
    btns.appendChild(close);
    wrap.appendChild(btns);

    close.addEventListener("click", () => {
      g.remove();
      g = el("g", {}, s);
      drawHalving(g, true);
      fb.className = "fb good";
      fb.textContent = data.say || "Each member has lost half its thickness, so the two faces finish flush. That is what a halving joint is.";
      close.disabled = true;
      done();
    });
    mount.appendChild(wrap);
  };

  /* questions — the assessment, with a reason for every verdict */
  R.questions = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    wrap.appendChild(ask);
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
      opts.innerHTML = "";
      fb.className = "fb";
      fb.textContent = "";
      q.opts.forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "carp-opt";
        b.textContent = o.t;
        b.addEventListener("click", () => {
          [...opts.children].forEach((x) => { x.disabled = true; });
          if (o.ok) { right += 1; b.classList.add("chosen-ok"); fb.className = "fb good"; }
          else { b.classList.add("chosen-no"); fb.className = "fb bad"; }
          fb.textContent = o.ok ? q.why : (o.why || q.why);
          setTimeout(() => {
            i += 1;
            if (i < data.items.length) paint();
            else {
              ask.textContent = "Finished.";
              opts.innerHTML = "";
              score.textContent = `${right} of ${data.items.length} correct`;
              fb.className = "fb " + (right === data.items.length ? "good" : "");
              fb.textContent = right === data.items.length
                ? "Every one right."
                : "Read the reasons again for the ones you missed.";
              done();
            }
          }, 2800);
        });
        opts.appendChild(b);
      });
    }
    paint();
    mount.appendChild(wrap);
  };

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

  window.CARP = { R, TOOLS, MARK_STATES, KERF_CASES, svg, el, tok };
})();
