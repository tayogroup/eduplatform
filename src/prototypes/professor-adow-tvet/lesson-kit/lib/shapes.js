/* ====================================================================
   Professor Adow TVET — Shapes and Measurements.

   Loaded after kit.js, and after nothing else. A Shapes and Measurements
   page is a cross-trade page and now loads no carpentry file at all —
   which it did until the kit was split out, purely because carpentry.js
   happened to hold the shared machinery. The seam recorded here is
   closed; this note is its receipt.

   Adds the measuring tools, the plane shapes and solids, the setting-out
   figures, and two step kinds:

     findmark   tap the rule at a stated measurement
     calc       answer a real quantity question, then see the working

   `calc` is the one this module turns on. A trade estimate is a NUMBER
   somebody has to produce and defend, and three multiple-choice options
   let a learner recognise an answer they could not have reached. It
   takes a typed figure, judges it on tolerance, and only then shows the
   working line by line.
   ==================================================================== */
(function () {
  "use strict";

  const C = window.CARP;
  if (!C) throw new Error("shapes.js must load after kit.js");
  const { el, svg, tok, R } = C;

  const STEEL = "#B9C6D0", STEEL_DARK = "#7E8E9B", WOOD = "#C98A4B", WOOD_DARK = "#A96E35";
  const bg = () => tok("--ground", "#0B1D2C");
  const ink = () => tok("--ink", "#fff");
  const teal = () => tok("--teal", "#35BFB2");
  const gold = () => tok("--gold", "#F4C95D");
  const good = () => tok("--good", "#4FD1A0");
  const bad = () => tok("--bad", "#F0806F");

  /* ==================================================================
     A RULE. The one drawing this module is built on: 0-100 mm, every
     millimetre marked, because "read it to the nearest millimetre" is
     meaningless on a scale that only shows centimetres.
     ================================================================== */
  const RULE = { x: 30, y: 46, w: 400, h: 52, max: 100 };
  const mmToX = (mm) => RULE.x + (mm / RULE.max) * RULE.w;
  const xToMm = (x) => ((x - RULE.x) / RULE.w) * RULE.max;

  function drawRule(g, opts) {
    const o = opts || {};
    el("rect", { x: RULE.x, y: RULE.y, width: RULE.w, height: RULE.h, rx: 3, fill: "#E6EDF2", stroke: STEEL_DARK, "stroke-width": 2 }, g);
    for (let mm = 0; mm <= RULE.max; mm++) {
      const big = mm % 10 === 0, mid = mm % 5 === 0;
      el("line", {
        x1: mmToX(mm), y1: RULE.y, x2: mmToX(mm), y2: RULE.y + (big ? 20 : mid ? 14 : 8),
        stroke: "#33414C", "stroke-width": big ? 1.7 : mid ? 1.2 : 0.8,
      }, g);
      if (big) {
        el("text", { x: mmToX(mm), y: RULE.y + 36, fill: "#33414C", "font-size": 12, "text-anchor": "middle", "font-weight": 700 }, g)
          .textContent = String(mm / 10);
      }
    }
    el("text", { x: RULE.x + RULE.w, y: RULE.y + 48, fill: "#56646F", "font-size": 11, "text-anchor": "end" }, g).textContent = "centimetres";

    if (o.at != null) {
      const x = mmToX(o.at);
      el("line", { x1: x, y1: RULE.y - 16, x2: x, y2: RULE.y + RULE.h, stroke: o.color || teal(), "stroke-width": 2.5 }, g);
      el("path", { d: `M ${x} ${RULE.y - 16} l -6 -9 l 12 0 z`, fill: o.color || teal() }, g);
      if (o.label) {
        el("text", { x, y: RULE.y - 32, fill: o.color || teal(), "font-size": 14, "text-anchor": "middle", "font-weight": 700 }, g).textContent = o.label;
      }
    }
    if (o.target != null && o.showTarget) {
      const x = mmToX(o.target);
      el("line", { x1: x, y1: RULE.y + RULE.h, x2: x, y2: RULE.y + RULE.h + 16, stroke: good(), "stroke-width": 2.5 }, g);
      el("text", { x, y: RULE.y + RULE.h + 30, fill: good(), "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g)
        .textContent = o.target + " mm";
    }
  }

  /* ==================================================================
     THE MEASURING AND LEVELLING TOOLS.
     ================================================================== */
  const SHAPES = {
    steelRule: {
      title: "steel rule", w: 460, h: 140,
      draw(g) { drawRule(g, {}); },
    },
    tape: {
      title: "tape measure", w: 380, h: 200,
      draw(g) {
        el("rect", { x: 40, y: 92, width: 96, height: 76, rx: 12, fill: "#D9B23A", stroke: "#8A6E12", "stroke-width": 2 }, g);
        el("circle", { cx: 88, cy: 130, r: 20, fill: "#B8941F", stroke: "#8A6E12", "stroke-width": 2 }, g);
        el("rect", { x: 136, y: 116, width: 200, height: 22, fill: "#F0E4B0", stroke: STEEL_DARK, "stroke-width": 2 }, g);
        for (let i = 1; i < 20; i++) {
          el("line", { x1: 136 + i * 10, y1: 116, x2: 136 + i * 10, y2: 116 + (i % 5 === 0 ? 12 : 7), stroke: "#33414C", "stroke-width": 1 }, g);
        }
        /* the hook, drawn LOOSE on purpose — it slides by its own
           thickness so an inside and an outside measurement both read
           true, and a learner who thinks it is broken will bend it */
        el("path", { d: "M 336 108 v 38 h -10 v -8 h 4 v -22 h -4 v -8 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("text", { x: 332, y: 100, fill: tok("--muted", "#93AABE"), "font-size": 12, "text-anchor": "end" }, g).textContent = "the hook slides — it is meant to";
      },
      /* `label` needs parts AND needs the tool in C.TOOLS, not only in the
         drawing registry. Without both it threw on `tool.w` and the step
         rendered as empty space — the same silent-step shape the build gate
         catches for a missing RENDERER but cannot see for missing DATA. */
      parts: [
        { id: "case", label: "case", box: [36, 88, 104, 84], say: "The case. Its length is printed on it and is PART of an internal measurement — push the case into a corner and add the figure on the case to the reading." },
        { id: "blade", label: "blade", box: [136, 110, 196, 32], say: "The blade. Curved across its width so it stays rigid when it is extended — which is also why it must be laid flat on the work to read it truly." },
        { id: "hook", label: "hook", box: [318, 102, 28, 48], say: "The hook. It slides by exactly its own thickness: back for an inside measurement, forward for an outside one, so both read true. It is not loose, and it must not be squeezed tight." },
      ],
    },
    level: {
      title: "spirit level", w: 420, h: 150,
      draw(g) { drawLevel(g, 0); },
    },
    plumb: {
      title: "plumb bob", w: 260, h: 220,
      draw(g) {
        el("line", { x1: 130, y1: 24, x2: 130, y2: 140, stroke: ink(), "stroke-width": 2 }, g);
        el("path", { d: "M 130 140 m -18 0 l 36 0 l -18 52 z", fill: "#9AA7B2", stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("line", { x1: 60, y1: 24, x2: 200, y2: 24, stroke: WOOD_DARK, "stroke-width": 6 }, g);
        el("line", { x1: 130, y1: 24, x2: 130, y2: 200, stroke: teal(), "stroke-width": 1.5, "stroke-dasharray": "5 4" }, g);
        el("text", { x: 142, y: 206, fill: teal(), "font-size": 13, "font-weight": 700 }, g).textContent = "true vertical";
      },
    },
  };

  /* the bubble: tilt in [-1, 1], 0 is level */
  function drawLevel(g, tilt) {
    const X = 30, Y = 52, W = 360, H = 46;
    const t = Math.max(-1, Math.min(1, tilt));
    const rot = t * 7;
    const wrap = el("g", { transform: `rotate(${rot} ${X + W / 2} ${Y + H / 2})` }, g);
    el("rect", { x: X, y: Y, width: W, height: H, rx: 5, fill: "#C8A02A", stroke: "#8A6E12", "stroke-width": 2 }, wrap);
    const vx = X + W / 2 - 46, vy = Y + 10, vw = 92, vh = 26;
    el("rect", { x: vx, y: vy, width: vw, height: vh, rx: 13, fill: "#EAF6F2", stroke: STEEL_DARK, "stroke-width": 2 }, wrap);
    for (const dx of [-16, 16]) {
      el("line", { x1: vx + vw / 2 + dx, y1: vy, x2: vx + vw / 2 + dx, y2: vy + vh, stroke: "#33414C", "stroke-width": 1.6 }, wrap);
    }
    const bubbleX = vx + vw / 2 + t * 26;
    el("ellipse", { cx: bubbleX, cy: vy + vh / 2, rx: 13, ry: 10, fill: "#7FD9A6", stroke: "#3E9E6E", "stroke-width": 1.5 }, wrap);
  }

  /* ==================================================================
     PLANE SHAPES AND SOLIDS, each drawn WITH ITS DIMENSIONS ON IT —
     a shape without figures on it cannot be calculated from, and the
     whole module is about calculating from what you measured.
     ================================================================== */
  function dimLine(g, x1, y1, x2, y2, label, colour) {
    const c = colour || gold();
    el("line", { x1, y1, x2, y2, stroke: c, "stroke-width": 1.6 }, g);
    const a = Math.atan2(y2 - y1, x2 - x1);
    for (const [px, py, dir] of [[x1, y1, 1], [x2, y2, -1]]) {
      el("path", {
        d: `M ${px} ${py} l ${Math.cos(a - 0.4) * 9 * dir} ${Math.sin(a - 0.4) * 9 * dir} M ${px} ${py} l ${Math.cos(a + 0.4) * 9 * dir} ${Math.sin(a + 0.4) * 9 * dir}`,
        stroke: c, "stroke-width": 1.6,
      }, g);
    }
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
    el("text", {
      x: vertical ? mx - 8 : mx, y: vertical ? my : my - 7,
      fill: c, "font-size": 13, "font-weight": 700,
      "text-anchor": vertical ? "end" : "middle",
    }, g).textContent = label;
  }

  Object.assign(SHAPES, {
    rectRoom: {
      title: "a rectangular floor", w: 400, h: 230,
      draw(g) {
        el("rect", { x: 70, y: 50, width: 260, height: 130, fill: "rgba(53,191,178,0.14)", stroke: teal(), "stroke-width": 2.5 }, g);
        dimLine(g, 70, 32, 330, 32, "4.0 m");
        dimLine(g, 52, 50, 52, 180, "2.5 m");
        el("text", { x: 200, y: 122, fill: ink(), "font-size": 14, "text-anchor": "middle", opacity: 0.8 }, g).textContent = "floor to be tiled";
      },
    },
    lRoom: {
      title: "an L-shaped floor", w: 400, h: 250,
      draw(g) {
        el("path", { d: "M 70 40 h 250 v 90 h -130 v 90 h -120 z", fill: "rgba(53,191,178,0.14)", stroke: teal(), "stroke-width": 2.5 }, g);
        el("line", { x1: 190, y1: 130, x2: 320, y2: 130, stroke: gold(), "stroke-width": 1.5, "stroke-dasharray": "6 4" }, g);
        el("line", { x1: 190, y1: 40, x2: 190, y2: 130, stroke: gold(), "stroke-width": 1.5, "stroke-dasharray": "6 4" }, g);
        dimLine(g, 70, 24, 320, 24, "5.0 m");
        dimLine(g, 54, 40, 54, 220, "3.6 m");
        dimLine(g, 190, 236, 320, 236, "2.6 m");
        el("text", { x: 130, y: 90, fill: ink(), "font-size": 13, "text-anchor": "middle", opacity: 0.75 }, g).textContent = "A";
        el("text", { x: 255, y: 90, fill: ink(), "font-size": 13, "text-anchor": "middle", opacity: 0.75 }, g).textContent = "B";
      },
    },
    triangleGable: {
      title: "a gable end", w: 380, h: 230,
      draw(g) {
        el("path", { d: "M 60 190 L 320 190 L 190 60 z", fill: "rgba(233,116,79,0.16)", stroke: tok("--accent", "#E9744F"), "stroke-width": 2.5 }, g);
        el("line", { x1: 190, y1: 60, x2: 190, y2: 190, stroke: gold(), "stroke-width": 1.5, "stroke-dasharray": "6 4" }, g);
        el("path", { d: "M 190 178 h 12 v 12", fill: "none", stroke: gold(), "stroke-width": 1.6 }, g);
        dimLine(g, 60, 210, 320, 210, "3.0 m base");
        dimLine(g, 206, 60, 206, 190, "1.5 m height", gold());
      },
    },
    circleTank: {
      title: "a circular tank", w: 340, h: 250,
      draw(g) {
        el("ellipse", { cx: 170, cy: 130, rx: 105, ry: 105, fill: "rgba(110,157,232,0.16)", stroke: "#6E9DE8", "stroke-width": 2.5 }, g);
        el("line", { x1: 170, y1: 130, x2: 275, y2: 130, stroke: gold(), "stroke-width": 1.8 }, g);
        el("circle", { cx: 170, cy: 130, r: 3.5, fill: gold() }, g);
        el("text", { x: 222, y: 122, fill: gold(), "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "r = 1.2 m";
      },
    },
    boxTrench: {
      title: "a trench", w: 400, h: 250,
      draw(g) {
        /* an open box in simple oblique projection */
        el("path", { d: "M 60 90 l 60 -34 l 230 0 l -60 34 z", fill: "rgba(201,138,75,0.30)", stroke: WOOD_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 60 90 l 0 100 l 230 0 l 0 -100 z", fill: "rgba(201,138,75,0.16)", stroke: WOOD_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 290 90 l 60 -34 l 0 100 l -60 34 z", fill: "rgba(201,138,75,0.22)", stroke: WOOD_DARK, "stroke-width": 2 }, g);
        dimLine(g, 60, 206, 290, 206, "6.0 m long");
        dimLine(g, 44, 90, 44, 190, "0.8 m deep");
        dimLine(g, 300, 64, 356, 38, "0.5 m wide");
      },
    },
    cylinderDrum: {
      title: "a drum", w: 320, h: 260,
      draw(g) {
        el("ellipse", { cx: 160, cy: 66, rx: 78, ry: 24, fill: "rgba(110,157,232,0.26)", stroke: "#6E9DE8", "stroke-width": 2 }, g);
        el("path", { d: "M 82 66 v 130 a 78 24 0 0 0 156 0 v -130", fill: "rgba(110,157,232,0.14)", stroke: "#6E9DE8", "stroke-width": 2 }, g);
        el("line", { x1: 160, y1: 66, x2: 238, y2: 66, stroke: gold(), "stroke-width": 1.8 }, g);
        el("text", { x: 200, y: 58, fill: gold(), "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "r = 0.3 m";
        dimLine(g, 258, 66, 258, 196, "0.9 m");
      },
    },
    setOut345: {
      title: "setting out with 3-4-5", w: 400, h: 250,
      draw(g) {
        el("path", { d: "M 70 200 L 310 200 L 70 40 z", fill: "rgba(79,209,160,0.14)", stroke: good(), "stroke-width": 2.5 }, g);
        el("path", { d: "M 70 184 h 16 v 16", fill: "none", stroke: good(), "stroke-width": 2.2 }, g);
        dimLine(g, 70, 218, 310, 218, "4 m");
        dimLine(g, 52, 40, 52, 200, "3 m");
        el("text", { x: 208, y: 112, fill: gold(), "font-size": 14, "font-weight": 700, transform: "rotate(-34 208 112)" }, g).textContent = "5 m";
        el("text", { x: 92, y: 176, fill: good(), "font-size": 12, "font-weight": 700 }, g).textContent = "90°";
      },
    },
    diagonals: {
      title: "checking a frame square", w: 400, h: 230,
      draw(g) {
        el("rect", { x: 70, y: 46, width: 250, height: 140, fill: "none", stroke: WOOD, "stroke-width": 7 }, g);
        el("line", { x1: 70, y1: 46, x2: 320, y2: 186, stroke: teal(), "stroke-width": 2, "stroke-dasharray": "7 4" }, g);
        el("line", { x1: 320, y1: 46, x2: 70, y2: 186, stroke: teal(), "stroke-width": 2, "stroke-dasharray": "7 4" }, g);
        el("text", { x: 200, y: 214, fill: teal(), "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g)
          .textContent = "equal diagonals = square";
      },
    },
  });

  /* ==================================================================
     SOLIDS, DEVELOPMENTS AND ANGLES — units SM.07 and SM.08.

     Added after the Ehel Stage 4 shape-and-measures module was compared
     against this one: reading a scale, perimeter, area and the right
     angle were already here, and faces, nets and the angles that are not
     90 degrees were not. Both earn their place in a trade school rather
     than arriving as school geometry — a NET is how a duct, a guard or a
     hopper is marked out flat before anything is bent, and an angle that
     is not a right angle is a mitre, a chamfer or a roof pitch.
     ================================================================== */
  const ISO = { f: "#C98A4B", t: "#DBA463", s: "#A96E35" };

  function angleFig(g, deg, label, colour) {
    const cx = 60, cy = 168, r = 112;
    const rad = (deg * Math.PI) / 180;
    el("line", { x1: cx, y1: cy, x2: cx + r, y2: cy, stroke: ink(), "stroke-width": 4 }, g);
    el("line", { x1: cx, y1: cy, x2: cx + r * Math.cos(rad), y2: cy - r * Math.sin(rad),
                 stroke: ink(), "stroke-width": 4 }, g);
    el("path", { d: `M ${cx + 40} ${cy} A 40 40 0 0 0 ${cx + 40 * Math.cos(rad)} ${cy - 40 * Math.sin(rad)}`,
                 fill: "none", stroke: colour, "stroke-width": 3 }, g);
    el("text", { x: cx + 74, y: cy - 28, fill: colour, "font-size": 15, "font-weight": 700 }, g)
      .textContent = label;
  }

  Object.assign(SHAPES, {
    solidBox: {
      title: "a solid, and what its parts are called", w: 380, h: 250,
      draw(g) {
        el("path", { d: "M 80 96 h 150 v 110 h -150 z", fill: ISO.f, stroke: ISO.s, "stroke-width": 2 }, g);
        el("path", { d: "M 80 96 l 58 -42 h 150 l -58 42 z", fill: ISO.t, stroke: ISO.s, "stroke-width": 2 }, g);
        el("path", { d: "M 230 96 l 58 -42 v 110 l -58 42 z", fill: ISO.s, stroke: ISO.s, "stroke-width": 2 }, g);
        el("circle", { cx: 80, cy: 96, r: 6, fill: gold() }, g);
      },
      parts: [
        { id: "face", label: "a face", box: [82, 98, 146, 106],
          say: "A face — one flat surface. This box has six. On a development every face becomes one panel of the flat pattern, which is why counting them first tells you how much sheet you need." },
        { id: "edge", label: "an edge", box: [74, 88, 162, 16],
          say: "An edge — where two faces meet. This box has twelve. On the flat pattern an edge is either a fold line or a cut line, and telling those apart is the whole skill." },
        { id: "vertex", label: "a vertex", box: [66, 82, 28, 28],
          say: "A vertex — a corner where edges meet. This box has eight. On sheet work a vertex is where a notch is cut, so the metal does not bunch when the folds come up." },
      ],
    },

    netTray: {
      title: "the development of an open tray", w: 380, h: 250,
      draw(g) {
        el("rect", { x: 140, y: 96, width: 110, height: 78, fill: ISO.f, stroke: ISO.s, "stroke-width": 2 }, g);
        el("rect", { x: 140, y: 42, width: 110, height: 54, fill: ISO.t, stroke: ISO.s, "stroke-width": 2 }, g);
        el("rect", { x: 140, y: 174, width: 110, height: 54, fill: ISO.t, stroke: ISO.s, "stroke-width": 2 }, g);
        el("rect", { x: 78, y: 96, width: 62, height: 78, fill: ISO.t, stroke: ISO.s, "stroke-width": 2 }, g);
        el("rect", { x: 250, y: 96, width: 62, height: 78, fill: ISO.t, stroke: ISO.s, "stroke-width": 2 }, g);
        [[140, 96, 250, 96], [140, 174, 250, 174], [140, 96, 140, 174], [250, 96, 250, 174]].forEach(
          ([a, b, c, d2]) => el("line", { x1: a, y1: b, x2: c, y2: d2, stroke: teal(),
                                          "stroke-width": 2, "stroke-dasharray": "6 4" }, g));
        el("text", { x: 195, y: 240, fill: teal(), "font-size": 12, "text-anchor": "middle", "font-weight": 700 }, g)
          .textContent = "dashed = fold, solid = cut";
      },
    },

    netCylinder: {
      title: "the development of a duct", w: 380, h: 230,
      draw(g) {
        el("rect", { x: 118, y: 74, width: 170, height: 90, fill: ISO.f, stroke: ISO.s, "stroke-width": 2 }, g);
        el("circle", { cx: 84, cy: 119, r: 30, fill: ISO.t, stroke: ISO.s, "stroke-width": 2 }, g);
        el("circle", { cx: 322, cy: 119, r: 30, fill: ISO.t, stroke: ISO.s, "stroke-width": 2 }, g);
        el("text", { x: 203, y: 196, fill: gold(), "font-size": 12, "text-anchor": "middle", "font-weight": 700 }, g)
          .textContent = "the long side = the circumference, not the diameter";
      },
    },

    netNoFold: {
      title: "six squares that fold into nothing", w: 380, h: 160,
      draw(g) {
        for (let i = 0; i < 6; i++) {
          el("rect", { x: 28 + i * 54, y: 54, width: 54, height: 54, fill: ISO.f, stroke: ISO.s, "stroke-width": 2 }, g);
        }
        el("text", { x: 190, y: 134, fill: bad(), "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g)
          .textContent = "six faces, and it still will not close";
      },
    },

    /* ITS OWN try square. lesson-3 has always had a browse item for one,
       and the drawing lives in carpentry.js — which this cross-trade app
       deliberately does not load. The item therefore rendered an empty
       stage AND fell back to showing the raw key "trySquare" as its
       label, in shipped content, because `browse` has no way to know a
       name it was handed does not resolve. */
    trySquare: {
      title: "try square", w: 360, h: 210,
      draw(g) {
        el("rect", { x: 70, y: 40, width: 34, height: 140, rx: 3, fill: "#7A4A22", stroke: "#5C3517", "stroke-width": 2 }, g);
        el("rect", { x: 78, y: 48, width: 6, height: 124, fill: "#C9A227", opacity: 0.9 }, g);
        el("rect", { x: 104, y: 40, width: 172, height: 24, rx: 2, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        for (let i = 1; i < 8; i++) {
          el("line", { x1: 104 + i * 20, y1: 40, x2: 104 + i * 20, y2: 40 + (i % 5 === 0 ? 14 : 8),
                       stroke: STEEL_DARK, "stroke-width": 1.4 }, g);
        }
        el("path", { d: "M 104 78 v -14 h 14", fill: "none", stroke: teal(), "stroke-width": 3 }, g);
        el("text", { x: 190, y: 120, fill: teal(), "font-size": 13, "font-weight": 700, "text-anchor": "middle" }, g)
          .textContent = "90° — proved, not judged";
      },
    },

    angleAcute:  { title: "acute", w: 300, h: 210, draw(g) { angleFig(g, 38, "38° acute", good()); } },
    angleRight:  { title: "right", w: 300, h: 210, draw(g) {
      angleFig(g, 90, "90° right", teal());
      el("path", { d: "M 60 148 h 20 v 20", fill: "none", stroke: teal(), "stroke-width": 3 }, g);
    } },
    angleObtuse: { title: "obtuse", w: 300, h: 210, draw(g) { angleFig(g, 133, "133° obtuse", gold()); } },

    bevel: {
      title: "sliding bevel", w: 360, h: 200,
      draw(g) {
        el("rect", { x: 60, y: 60, width: 30, height: 116, rx: 4, fill: "#7A4A22", stroke: "#5C3517", "stroke-width": 2 }, g);
        el("path", { d: "M 90 150 l 190 -76 l 10 18 l -190 76 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("circle", { cx: 92, cy: 142, r: 7, fill: "#C9A227", stroke: "#8A6E12", "stroke-width": 2 }, g);
        el("text", { x: 200, y: 186, fill: tok("--muted", "#93AABE"), "font-size": 12, "text-anchor": "middle" }, g)
          .textContent = "it copies an angle without naming it";
      },
    },

  });

  /* One call. It puts each drawing in the registry and, when it carries
     `parts`, in the set `label` reads — the two places a drawing has to
     be, which used to be two separate loops and one forgotten tape. */
  C.registerAll(SHAPES, { w: 380, h: 200 });

  /* ==================================================================
     findmark — tap the rule at a stated measurement.
     ================================================================== */
  R.findmark = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    wrap.appendChild(ask);
    const s = svg(460, 150);
    let g = el("g", {}, s);
    wrap.appendChild(s);
    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);
    const score = document.createElement("p");
    score.className = "score";
    wrap.appendChild(score);

    /* a transparent strip over the rule takes the taps, so the whole
       scale is the target rather than a hairline */
    let hit = null;
    let i = 0, settled = false;

    function paint(showMine, mine) {
      g.remove();
      g = el("g", {}, s);
      const t = data.items[i];
      drawRule(g, showMine ? { at: mine, label: mine.toFixed(0) + " mm", color: Math.abs(mine - t.mm) <= 1.5 ? good() : bad(), target: t.mm, showTarget: true } : {});
      hit = el("rect", { x: RULE.x, y: RULE.y - 20, width: RULE.w, height: RULE.h + 40, fill: "transparent" }, g);
      hit.style.cursor = "crosshair";
      hit.addEventListener("click", (ev) => {
        if (settled) return;
        const box = s.getBoundingClientRect();
        const vb = s.viewBox.baseVal;
        const sx = ((ev.clientX - box.left) / box.width) * vb.width;
        const mine2 = Math.max(0, Math.min(RULE.max, xToMm(sx)));
        settled = true;
        const t2 = data.items[i];
        const off = Math.abs(mine2 - t2.mm);
        paint(true, mine2);
        if (off <= 1.5) {
          fb.className = "fb good";
          fb.textContent = t2.why;
          i += 1;
          setTimeout(() => { settled = false; (i < data.items.length ? round() : finish()); }, 2600);
        } else {
          fb.className = "fb bad";
          fb.textContent = "That is " + off.toFixed(0) + " mm out. " + (t2.miss ||
            "Count the whole centimetres first, then the millimetre marks past them.");
          setTimeout(() => { settled = false; }, 1400);
        }
      });
      s.setAttribute("aria-label", "A rule from 0 to 100 millimetres");
    }
    function round() {
      ask.textContent = data.items[i].ask;
      score.textContent = `${i + 1} of ${data.items.length}`;
      fb.className = "fb";
      fb.textContent = "";
      paint(false);
    }
    function finish() {
      ask.textContent = "Every one found.";
      score.textContent = "";
      fb.className = "fb good";
      fb.textContent = data.finish || "A rule is read to the nearest millimetre, and the millimetre is named.";
      done();
    }
    round();
    mount.appendChild(wrap);
  };

  /* ==================================================================
     calc — a real quantity question, answered as a NUMBER, then the
     working. Tolerance is stated per item because a tile count is exact
     and a volume in cubic metres is not.
     ================================================================== */
  R.calc = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    wrap.appendChild(ask);
    const s = svg(420, 250);
    let g = el("g", {}, s);
    wrap.appendChild(s);

    const row = document.createElement("div");
    row.className = "sm-answer";
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.className = "sm-input";
    input.setAttribute("aria-label", "Your answer");
    const unit = document.createElement("span");
    unit.className = "sm-unit";
    const check = document.createElement("button");
    check.type = "button";
    check.className = "big small";
    check.textContent = "Check";
    row.appendChild(input);
    row.appendChild(unit);
    row.appendChild(check);
    wrap.appendChild(row);

    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);
    const work = document.createElement("ol");
    work.className = "sm-working";
    wrap.appendChild(work);
    const score = document.createElement("p");
    score.className = "score";
    wrap.appendChild(score);

    let i = 0;

    function reveal(ok) {
      const q = data.items[i];
      work.innerHTML = "";
      for (const line of q.working) {
        const li = document.createElement("li");
        li.textContent = line;
        work.appendChild(li);
      }
      fb.className = "fb " + (ok ? "good" : "bad");
      fb.textContent = ok ? q.why
        : "Not that. The answer is " + q.answer + " " + q.unit + ". " + q.why;
      check.disabled = true;
      input.disabled = true;
      setTimeout(() => {
        i += 1;
        if (i < data.items.length) round();
        else {
          ask.textContent = "Finished.";
          row.remove();
          work.innerHTML = "";
          score.textContent = "";
          fb.className = "fb good";
          fb.textContent = data.finish || "An estimate is measurements, working and an answer — in that order, so somebody else can check it.";
          done();
        }
      }, 5200);
    }

    function round() {
      const q = data.items[i];
      ask.textContent = q.ask;
      unit.textContent = q.unit;
      input.value = "";
      input.disabled = false;
      check.disabled = false;
      fb.className = "fb";
      fb.textContent = "";
      work.innerHTML = "";
      score.textContent = `Question ${i + 1} of ${data.items.length}`;
      g.remove();
      g = el("g", {}, s);
      if (q.draw && C.DRAW[q.draw]) {
        const spec = C.DRAW[q.draw];
        const scale = Math.min(420 / spec.w, 250 / spec.h);
        g.setAttribute("transform", `scale(${scale.toFixed(3)})`);
        spec.draw(g);
        s.style.display = "";
        s.setAttribute("aria-label", spec.title);
      } else {
        s.style.display = "none";
      }
    }

    check.addEventListener("click", () => {
      const q = data.items[i];
      const v = Number(input.value);
      if (input.value === "" || Number.isNaN(v)) {
        fb.className = "fb bad";
        fb.textContent = "Put a number in first.";
        return;
      }
      reveal(Math.abs(v - q.answer) <= (q.tol == null ? 0 : q.tol));
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") check.click(); });

    round();
    mount.appendChild(wrap);
  };

  /* ==================================================================
     levelread — read a spirit level and say which way the work moves.
     ================================================================== */
  R.levelread = function (data, mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    wrap.appendChild(ask);
    const s = svg(420, 150);
    let g = el("g", {}, s);
    wrap.appendChild(s);
    const opts = document.createElement("div");
    opts.className = "carp-opts";
    wrap.appendChild(opts);
    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);

    let i = 0;
    function round() {
      const q = data.items[i];
      ask.textContent = q.ask;
      fb.className = "fb";
      fb.textContent = "";
      g.remove();
      g = el("g", {}, s);
      drawLevel(g, q.tilt);
      s.setAttribute("aria-label", q.tilt === 0 ? "A level reading level" :
        "A level with the bubble towards the " + (q.tilt > 0 ? "right" : "left"));
      opts.innerHTML = "";
      q.opts.forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "carp-opt";
        b.textContent = o.t;
        b.addEventListener("click", () => {
          [...opts.children].forEach((x) => { x.disabled = true; });
          b.classList.add(o.ok ? "chosen-ok" : "chosen-no");
          fb.className = "fb " + (o.ok ? "good" : "bad");
          fb.textContent = o.ok ? q.why : (o.why || q.why);
          setTimeout(() => {
            i += 1;
            if (i < data.items.length) round();
            else {
              ask.textContent = "Read correctly.";
              opts.innerHTML = "";
              fb.className = "fb good";
              fb.textContent = data.finish || "The bubble runs to the HIGH side. Lower that side, or raise the other.";
              done();
            }
          }, 3000);
        });
        opts.appendChild(b);
      });
    }
    round();
    mount.appendChild(wrap);
  };

  C.SHAPES = SHAPES;
  C.drawLevel = drawLevel;
  C.drawRule = drawRule;
})();
