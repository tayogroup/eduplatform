/* ====================================================================
   Professor Adow TVET — Tools & Joints, the rest of the module.

   Loaded after carpentry.js. Adds the five joint families, the
   fasteners, the sawing and paring sequences, and two step kinds.

   ONE DRAWING REGISTRY. carpentry.js grew TOOLS and carpentry-foundation
   grew FAULTS, and each renderer knew which of the two to look in. That
   does not survive a third set, so everything registers into C.DRAW and
   a renderer asks for a name without caring which file drew it. The two
   older registries are folded in below, so nothing that already worked
   has to change.

   JOINTS ARE DRAWN IN ELEVATION, slightly apart. A perspective view of a
   dovetail looks better and teaches less: the learner needs to see the
   PROFILE that is cut, because that is what they will mark out.
   ==================================================================== */
(function () {
  "use strict";

  const C = window.CARP;
  if (!C) throw new Error("carpentry-joints.js must load after carpentry.js");
  const { el, svg, tok, R } = C;

  const WOOD = "#C98A4B", WOOD_DARK = "#A96E35", GRAIN = "#8A5A28";
  const STEEL = "#B9C6D0", STEEL_DARK = "#7E8E9B", HANDLE = "#7A4A22";
  const GLUE = "#7FB2D9";

  const bg = () => tok("--ground", "#0B1D2C");

  function board(g, x, y, w, h) {
    el("rect", { x, y, width: w, height: h, rx: 2, fill: WOOD, stroke: WOOD_DARK, "stroke-width": 2 }, g);
    const n = Math.max(2, Math.round(h / 15));
    for (let i = 1; i <= n; i++) {
      const gy = y + (h * i) / (n + 1);
      el("path", {
        d: `M ${x + 3} ${gy} C ${x + w * 0.3} ${gy - 2}, ${x + w * 0.6} ${gy + 2}, ${x + w - 3} ${gy}`,
        fill: "none", stroke: GRAIN, "stroke-width": 1, opacity: 0.32,
      }, g);
    }
  }
  const notch = (g, x, y, w, h) =>
    el("rect", { x, y, width: w, height: h, fill: bg(), stroke: WOOD_DARK, "stroke-width": 2 }, g);

  /* ==================================================================
     THE FIVE FAMILIES. Two joints each, drawn the same size so they can
     be compared.
     ================================================================== */
  const W = 340, H = 200;

  const JOINTS = {
    /* ---- corner ---- */
    butt: {
      title: "butt joint", family: "corner",
      use: "The simplest corner there is: one piece meets another end to face, held by nails or screws. Quick, weak, and everywhere in rough carpentry.",
      draw(g) {
        board(g, 40, 60, 150, 44);
        board(g, 190, 60, 44, 110);
        el("line", { x1: 190, y1: 60, x2: 190, y2: 104, stroke: WOOD_DARK, "stroke-width": 3 }, g);
        for (const y of [74, 92]) {
          el("line", { x1: 150, y1: y, x2: 210, y2: y, stroke: STEEL_DARK, "stroke-width": 2.5 }, g);
          el("circle", { cx: 150, cy: y, r: 3, fill: STEEL_DARK }, g);
        }
      },
    },
    dovetail: {
      title: "through dovetail", family: "corner",
      use: "A corner that cannot be pulled apart in the direction the tails run. Used on drawer fronts and boxes, where the handle pulls against the joint every day.",
      /* EXPLODED, with a real gap. Drawn flush, the tails and the sockets
         touched and the whole joint read as one dark band — the shape
         that is the entire point of a dovetail was invisible. Apart, you
         can see the wedge on one board and the hole it drops into on the
         other, which is what the learner has to mark out. */
      draw(g) {
        board(g, 26, 52, 118, 108);
        for (let i = 0; i < 3; i++) {
          const y = 56 + i * 36;
          /* narrow at the root, wide at the tip: that taper is the joint */
          el("path", { d: `M 144 ${y + 5} l 44 -5 l 0 32 l -44 -5 z`, fill: WOOD, stroke: WOOD_DARK, "stroke-width": 2 }, g);
        }
        board(g, 232, 52, 90, 108);
        for (let i = 0; i < 3; i++) {
          const y = 56 + i * 36;
          el("path", { d: `M 232 ${y} l 44 5 l 0 22 l -44 5 z`, fill: bg(), stroke: WOOD_DARK, "stroke-width": 2 }, g);
        }
        /* an inline arrowhead, NOT marker-end: the shared carp-arrow marker
           is minted by carpentry.js's own renderers and drawNamed does not
           mint one, so a marker reference here would silently draw nothing */
        el("path", { d: "M 196 106 h 22", stroke: tok("--ink", "#fff"), "stroke-width": 2, opacity: 0.55 }, g);
        el("path", { d: "M 218 100 l 10 6 l -10 6 z", fill: tok("--ink", "#fff"), opacity: 0.55 }, g);
      },
    },

    /* ---- frame ---- */
    mortiseTenon: {
      title: "through mortise and tenon", family: "frame",
      use: "The frame joint. A tongue on one member goes right through a hole in the other. Doors, windows, tables and chairs are held together by it.",
      draw(g) {
        board(g, 40, 80, 150, 58);
        el("rect", { x: 190, y: 96, width: 90, height: 26, fill: WOOD, stroke: WOOD_DARK, "stroke-width": 2 }, g);
        el("line", { x1: 190, y1: 80, x2: 190, y2: 138, stroke: WOOD_DARK, "stroke-width": 2.5 }, g);
        board(g, 250, 40, 56, 140);
        notch(g, 250, 96, 56, 26);
        el("text", { x: 214, y: 90, fill: tok("--teal", "#35BFB2"), "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "tenon";
        el("text", { x: 278, y: 34, fill: tok("--accent", "#E9744F"), "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "mortise";
      },
    },
    cornerHalving: {
      title: "corner halving", family: "frame",
      use: "Each member loses half its thickness where they cross, so the two finish flush. The joint the first lesson marks out and cuts.",
      draw(g) {
        board(g, 40, 100, 180, 52);
        notch(g, 150, 100, 70, 26);
        board(g, 150, 40, 180, 52);
        notch(g, 150, 66, 70, 26);
      },
    },

    /* ---- widening ---- */
    edgeGlued: {
      title: "edge to edge, glued", family: "widening",
      use: "Two boards planed dead straight on the edge and glued. Narrow boards become a table top, a bench top or a cupboard side.",
      draw(g) {
        board(g, 50, 52, 240, 48);
        el("rect", { x: 50, y: 100, width: 240, height: 5, fill: GLUE, opacity: 0.85 }, g);
        board(g, 50, 105, 240, 48);
        el("text", { x: 300, y: 106, fill: GLUE, "font-size": 13, "font-weight": 700 }, g).textContent = "glue";
      },
    },
    looseTongue: {
      title: "loose tongue", family: "widening",
      use: "A widening joint with a separate strip of ply in a groove in both edges. The tongue keeps the two boards level while the glue sets and adds gluing area.",
      draw(g) {
        board(g, 50, 46, 240, 50);
        notch(g, 50, 74, 240, 14);
        board(g, 50, 110, 240, 50);
        notch(g, 50, 118, 240, 14);
        el("rect", { x: 60, y: 90, width: 220, height: 14, fill: "#D9B382", stroke: WOOD_DARK, "stroke-width": 2 }, g);
        el("text", { x: 170, y: 176, fill: tok("--teal", "#35BFB2"), "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "loose tongue";
      },
    },

    /* ---- lengthening ---- */
    scarf: {
      title: "scarf joint", family: "lengthening",
      use: "Two long tapers overlapping, so a short piece becomes a long one. Roof members, wall plates, formwork and scaffolding.",
      draw(g) {
        el("path", { d: "M 40 70 h 150 l 80 34 h -230 z", fill: WOOD, stroke: WOOD_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 110 108 l 80 -34 h 150 v 34 z", fill: WOOD, stroke: WOOD_DARK, "stroke-width": 2 }, g);
        for (const y of [86, 96]) {
          el("path", { d: `M 60 ${y} h 260`, stroke: GRAIN, "stroke-width": 1, opacity: 0.28 }, g);
        }
      },
    },
    fished: {
      title: "fished joint", family: "lengthening",
      use: "Two ends butted and plated on both sides with timber or steel, bolted through. Quick, strong in tension, and used where looks do not matter.",
      draw(g) {
        board(g, 40, 84, 140, 44);
        board(g, 182, 84, 140, 44);
        el("rect", { x: 120, y: 62, width: 120, height: 18, fill: "#9AA7B2", stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("rect", { x: 120, y: 132, width: 120, height: 18, fill: "#9AA7B2", stroke: STEEL_DARK, "stroke-width": 2 }, g);
        for (const x of [142, 180, 218]) {
          el("line", { x1: x, y1: 62, x2: x, y2: 150, stroke: STEEL_DARK, "stroke-width": 3 }, g);
        }
      },
    },

    /* ---- crossing ---- */
    crossHalving: {
      title: "cross halving", family: "crossing",
      use: "Two members crossing near their middles, each halved so they finish flush. Lamp stands, trestles and one-legged tables.",
      draw(g) {
        board(g, 40, 92, 260, 48);
        notch(g, 140, 92, 56, 24);
        board(g, 140, 40, 56, 150);
        notch(g, 140, 116, 56, 24);
      },
    },
    bridle: {
      title: "bridle (open mortise and tenon)", family: "frame",
      use: "A mortise open at the end, so the tenon slides in from the side. Easier to cut than a through mortise and used at the corner of a frame.",
      draw(g) {
        board(g, 40, 82, 160, 54);
        el("rect", { x: 200, y: 82, width: 70, height: 16, fill: WOOD, stroke: WOOD_DARK, "stroke-width": 2 }, g);
        el("rect", { x: 200, y: 120, width: 70, height: 16, fill: WOOD, stroke: WOOD_DARK, "stroke-width": 2 }, g);
        board(g, 258, 40, 52, 140);
        notch(g, 258, 98, 52, 22);
      },
    },
  };

  const FAMILIES = [
    { key: "corner", label: "corner", say: "Corner joints bring two pieces together at a corner — the sides of a box, a drawer, a cupboard." },
    { key: "frame", label: "frame", say: "Frame joints make a flat frame: doors, windows, the frame of a table. They resist racking." },
    { key: "widening", label: "widening", say: "Widening joints make a WIDE surface out of narrow boards — a table top, a bench top, a cupboard side." },
    { key: "lengthening", label: "lengthening", say: "Lengthening joints make a LONG member out of short ones — roof members, wall plates, formwork." },
    { key: "crossing", label: "crossing", say: "Crossing joints join members at or near their middles rather than their ends." },
  ];

  /* ==================================================================
     FASTENERS. Nails are told apart by head and section, screws by head.
     ================================================================== */
  const FASTENERS = {
    wireNail: {
      title: "wire nail", job: "rough",
      use: "A big flat head that will not pull through, and a round section. Rough carpentry, formwork, anything that does not show. It splits timber readily.",
      draw(g) {
        el("rect", { x: 150, y: 50, width: 40, height: 9, rx: 2, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 165 59 h 10 l -5 92 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
      },
    },
    ovalBrad: {
      title: "oval brad", job: "nosplit",
      use: "An oval section. Driven with the long axis along the grain it parts the fibres rather than wedging them apart, so it is far less likely to split the wood.",
      draw(g) {
        el("ellipse", { cx: 170, cy: 54, rx: 11, ry: 6, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 164 59 h 12 l -6 92 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("ellipse", { cx: 250, cy: 100, rx: 7, ry: 15, fill: "none", stroke: tok("--teal", "#35BFB2"), "stroke-width": 2.5 }, g);
        el("text", { x: 250, y: 132, fill: tok("--teal", "#35BFB2"), "font-size": 12, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "oval section";
      },
    },
    lostHead: {
      title: "lost head nail", job: "hidden",
      use: "A head barely wider than the shank, so it can be punched below the surface and the hole filled. Used where the fixing must not show.",
      draw(g) {
        el("rect", { x: 163, y: 50, width: 14, height: 8, rx: 2, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 165 58 h 10 l -5 94 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 210 70 l 26 0 l -8 -8 M 210 70 l 18 8", stroke: tok("--muted", "#93AABE"), "stroke-width": 2, fill: "none" }, g);
        el("text", { x: 250, y: 74, fill: tok("--muted", "#93AABE"), "font-size": 12, "font-weight": 700 }, g).textContent = "punched";
      },
    },
    panelPin: {
      title: "panel pin", job: "light",
      use: "A small thin pin for light work, almost always with glue doing the real holding while the pin stops the work moving as it sets.",
      draw(g) {
        el("rect", { x: 166, y: 62, width: 8, height: 5, rx: 1, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 1.5 }, g);
        el("path", { d: "M 167 67 h 6 l -3 60 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 1.5 }, g);
      },
    },
    countersunk: {
      title: "countersunk screw", job: "flush",
      use: "A tapered head that pulls down flush with the surface, or just below it. The general woodworking screw.",
      draw(g) {
        el("path", { d: "M 142 50 h 56 l -18 20 h -20 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("line", { x1: 156, y1: 56, x2: 184, y2: 56, stroke: STEEL_DARK, "stroke-width": 3 }, g);
        el("path", { d: "M 160 70 h 20 l -10 82 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        for (let y = 76; y < 140; y += 11) {
          el("path", { d: `M ${162 + (y - 76) * 0.06} ${y} l ${16 - (y - 76) * 0.12} 5`, stroke: STEEL_DARK, "stroke-width": 1.6 }, g);
        }
      },
    },
    roundHead: {
      title: "round head screw", job: "fitting",
      use: "A domed head that stays proud of the surface. For fixing hardware that has no countersunk hole — hinges, catches, brackets.",
      draw(g) {
        el("path", { d: "M 148 62 a 22 14 0 0 1 44 0 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("line", { x1: 158, y1: 55, x2: 182, y2: 55, stroke: STEEL_DARK, "stroke-width": 3 }, g);
        el("path", { d: "M 160 62 h 20 l -10 84 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        for (let y = 70; y < 134; y += 11) {
          el("path", { d: `M ${162 + (y - 70) * 0.06} ${y} l ${16 - (y - 70) * 0.12} 5`, stroke: STEEL_DARK, "stroke-width": 1.6 }, g);
        }
      },
    },
    coach: {
      title: "coach screw", job: "heavy",
      use: "A heavy screw with a square or hexagon head, turned with a spanner rather than a screwdriver. Heavy framing and fixing equipment to timber.",
      draw(g) {
        el("rect", { x: 152, y: 44, width: 36, height: 26, rx: 2, fill: "#9AA7B2", stroke: STEEL_DARK, "stroke-width": 2 }, g);
        el("path", { d: "M 158 70 h 24 l -12 84 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
        for (let y = 78; y < 142; y += 12) {
          el("path", { d: `M ${159 + (y - 78) * 0.07} ${y} l ${21 - (y - 78) * 0.15} 6`, stroke: STEEL_DARK, "stroke-width": 1.8 }, g);
        }
        el("path", { d: "M 196 44 h 26 v 26 h -26 z", fill: "none", stroke: tok("--muted", "#93AABE"), "stroke-width": 2 }, g);
        el("text", { x: 236, y: 62, fill: tok("--muted", "#93AABE"), "font-size": 12, "font-weight": 700 }, g).textContent = "spanner";
      },
    },
  };

  /* ==================================================================
     SEQUENCES — the sawing and paring demos, and the two-thirds rule.
     ================================================================== */
  const SAW_STATES = [
    { caption: "The saw laid almost flat, at the far corner of the line. A low angle starts the cut where you can see it." },
    { caption: "The thumb of the free hand raised against the BLADE, above the teeth, steadying the first strokes." },
    { caption: "Two or three light backward strokes to cut a groove. No downward pressure at all — the saw's own weight." },
    { caption: "Now the angle lifts and the saw cuts forward, following the groove it has already made." },
    { caption: "Down to the shoulder line, checking the FAR face as well as the near one, and stopping at the line." },
  ];

  function drawSaw(g, i) {
    const ink = tok("--ink", "#fff"), bad = tok("--bad", "#F0806F"), good = tok("--good", "#4FD1A0");
    board(g, 50, 110, 260, 70);
    el("line", { x1: 190, y1: 100, x2: 190, y2: 190, stroke: ink, "stroke-width": 2.5 }, g);

    const angles = [10, 10, 12, 34, 40];
    const a = (angles[i] * Math.PI) / 180;
    const len = 200, cx = 190, cy = 110;
    const x2 = cx - Math.cos(a) * len, y2 = cy - Math.sin(a) * len;
    el("line", { x1: cx + 24, y1: cy + 14, x2, y2, stroke: STEEL, "stroke-width": 11, "stroke-linecap": "round" }, g);
    el("line", { x1: cx + 24, y1: cy + 14, x2, y2, stroke: STEEL_DARK, "stroke-width": 2 }, g);
    el("circle", { cx: x2, cy: y2, r: 13, fill: HANDLE, stroke: "#5C3517", "stroke-width": 2 }, g);

    if (i === 1) {
      el("path", { d: `M ${cx - 46} ${cy - 30} q -18 10 -6 26 q 10 12 24 2`, fill: "none", stroke: "#E8B48C", "stroke-width": 9, "stroke-linecap": "round" }, g);
      el("text", { x: cx - 74, y: cy - 38, fill: good, "font-size": 13, "font-weight": 700 }, g).textContent = "thumb, above the teeth";
    }
    if (i >= 2) {
      el("rect", { x: 186, y: 110, width: 5, height: i >= 4 ? 70 : 12, fill: bg(), stroke: good, "stroke-width": 1.6 }, g);
    }
    if (i === 4) {
      el("text", { x: 190, y: 196, fill: good, "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "stop at the shoulder";
      el("path", { d: "M 296 120 l 14 0 M 303 113 l 0 14", stroke: bad, "stroke-width": 2 }, g);
      el("text", { x: 300, y: 146, fill: ink, "font-size": 12, "text-anchor": "middle", opacity: 0.8 }, g).textContent = "check the far face";
    }
  }

  const PARE_CASES = {
    both: {
      label: "from both faces, towards the middle",
      verdict: "good",
      why: "The chisel always cuts towards supported wood, so the fibres at each face are held while they are cut. The edges come out clean.",
    },
    one: {
      label: "straight through from one face",
      verdict: "bad",
      why: "The last fibres at the far face have nothing behind them. They tear out, and the break-out is on the face you were trying to make good.",
    },
  };

  function drawPare(g, which) {
    const good = tok("--good", "#4FD1A0"), bad = tok("--bad", "#F0806F");
    board(g, 60, 70, 220, 90);
    el("line", { x1: 170, y1: 62, x2: 170, y2: 168, stroke: tok("--ink", "#fff"), "stroke-width": 2 }, g);
    if (!which) return;
    if (which === "both") {
      el("path", { d: "M 120 92 h 44 v 14 h -44 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
      el("path", { d: "M 220 124 h -44 v 14 h 44 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
      el("path", { d: "M 170 70 v 90", stroke: good, "stroke-width": 3 }, g);
      el("text", { x: 170, y: 182, fill: good, "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "clean on both faces";
    } else {
      el("path", { d: "M 120 106 h 44 v 14 h -44 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
      let d = "M 170 70";
      for (let y = 70; y < 160; y += 10) d += ` l ${y % 20 === 0 ? 9 : -9} 10`;
      el("path", { d, fill: "none", stroke: bad, "stroke-width": 2.5 }, g);
      el("text", { x: 206, y: 182, fill: bad, "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g).textContent = "torn out";
    }
  }

  /* the two-thirds rule: a fastener through an upper member into a lower */
  function drawTwoThirds(g, ratio) {
    const good = tok("--good", "#4FD1A0"), bad = tok("--bad", "#F0806F");
    const ink = tok("--ink", "#fff");
    board(g, 60, 58, 230, 40);
    board(g, 60, 98, 230, 84);
    el("line", { x1: 60, y1: 98, x2: 290, y2: 98, stroke: WOOD_DARK, "stroke-width": 2.5 }, g);

    const total = 118;
    const into = total * ratio;
    el("rect", { x: 168, y: 52, width: 14, height: 8, rx: 2, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
    el("path", { d: `M 170 60 h 10 l -5 ${into} z`, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);

    const ok = ratio >= 0.62;
    const c = ok ? good : bad;
    el("line", { x1: 220, y1: 98, x2: 220, y2: 60 + into, stroke: c, "stroke-width": 2.5 }, g);
    el("text", { x: 232, y: (98 + 60 + into) / 2, fill: c, "font-size": 13, "font-weight": 700 }, g).textContent =
      Math.round(((60 + into - 98) / total) * 100) + "% in the lower member";
    el("text", { x: 60, y: 44, fill: ink, "font-size": 12, opacity: 0.8 }, g).textContent = "two thirds should be below the line";
  }

  const GLUE_CASES = {
    right: { label: "a thin even film on both faces", verdict: "good",
      why: "Enough to wet both surfaces and no more. A thin, continuous film is a stronger joint than a thick one — glue is not a filler." },
    heavy: { label: "plenty, so none of it is starved", verdict: "bad",
      why: "It squeezes out under the cramps, runs down the work, and where it dries it seals the grain so the finish will not take. A glue line should be barely visible." },
    spots: { label: "a few spots along the joint", verdict: "bad",
      why: "The joint is strong where the spots are and open everywhere else. A widening joint glued in spots opens along its length as the boards move." },
  };

  function drawGlue(g, which) {
    board(g, 55, 50, 240, 46);
    board(g, 55, 112, 240, 46);
    if (!which) return;
    const c = which === "right" ? tok("--good", "#4FD1A0") : tok("--bad", "#F0806F");
    if (which === "right") {
      el("rect", { x: 55, y: 96, width: 240, height: 6, fill: GLUE }, g);
    } else if (which === "heavy") {
      el("rect", { x: 55, y: 92, width: 240, height: 16, fill: GLUE }, g);
      for (const x of [90, 150, 230]) {
        el("path", { d: `M ${x} 108 q 4 18 -2 30`, fill: "none", stroke: GLUE, "stroke-width": 6, "stroke-linecap": "round" }, g);
      }
    } else {
      for (const x of [80, 150, 220, 270]) {
        el("ellipse", { cx: x, cy: 99, rx: 14, ry: 5, fill: GLUE }, g);
      }
    }
    el("text", { x: 175, y: 180, fill: c, "font-size": 13, "text-anchor": "middle", "font-weight": 700 }, g).textContent =
      which === "right" ? "a continuous film" : which === "heavy" ? "squeeze-out everywhere" : "open between the spots";
  }

  /* ==================================================================
     ONE REGISTRY, and a helper that draws any of it to scale.
     ================================================================== */
  const DRAW = {};
  for (const k in C.TOOLS) DRAW[k] = { title: C.TOOLS[k].title, w: C.TOOLS[k].w, h: C.TOOLS[k].h, draw: C.TOOLS[k].draw };
  for (const k in (C.FAULTS || {})) DRAW[k] = { title: C.FAULTS[k].title, w: 300, h: 190, draw: C.FAULTS[k].draw };
  for (const k in JOINTS) DRAW[k] = { title: JOINTS[k].title, w: W, h: H, draw: JOINTS[k].draw };
  for (const k in FASTENERS) DRAW[k] = { title: FASTENERS[k].title, w: 340, h: 180, draw: FASTENERS[k].draw };
  C.DRAW = DRAW;

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
  C.drawNamed = drawNamed;

  /* The older `sort` looked in TOOLS then FAULTS by hand. Point it at the
     registry so a joint or a fastener can be sorted too.

     THIS WAS GUARDED WITH `if (R.sort)` AND THAT WAS A BUG. R.sort is
     defined in carpentry-foundation.js, which a Tools & Joints page does
     not load — so the guard failed, R.sort was never defined here, and
     the sort step rendered NOTHING. No console error: the page skips a
     step kind it has no renderer for. Define it unconditionally and keep
     the older one only if it happens to be there. */
  const baseSort = R.sort;
  R.sort = function (data, mount, done) {
    if (!data.registry && baseSort) return baseSort(data, mount, done);
    return registrySort(data, mount, done);
  };

  function registrySort(data, mount, done) {
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

  /* `questions` gains an optional drawing per question. */
  const baseQuestions = R.questions;
  R.questions = function (data, mount, done) {
    if (!data.items.some((q) => q.draw)) return baseQuestions(data, mount, done);
    drawnQuestions(data, mount, done);
  };

  function drawnQuestions(data, mount, done) {
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

  /* `demo` gains the sawing sequence; `predict` gains paring and gluing. */
  const baseDemo2 = R.demo;
  R.demo = function (data, mount, done) {
    if (data && data.sequence === "saw") return seqDemo(SAW_STATES, drawSaw, 400, 210, mount, done);
    if (data && data.sequence === "twothirds") return ratioDemo(mount, done);
    return baseDemo2(data, mount, done);
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

  function ratioDemo(mount, done) {
    const wrap = document.createElement("div");
    wrap.className = "carp-stage";
    const ask = document.createElement("p");
    ask.className = "carp-ask";
    ask.textContent = "Slide the nail in. How much of it has to reach the lower member?";
    wrap.appendChild(ask);
    const s = svg(340, 200);
    let g = el("g", {}, s);
    wrap.appendChild(s);
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "20"; slider.max = "95"; slider.step = "1"; slider.value = "30";
    slider.className = "carp-slider";
    slider.setAttribute("aria-label", "How far the nail is driven");
    wrap.appendChild(slider);
    const fb = document.createElement("p");
    fb.className = "fb";
    wrap.appendChild(fb);
    function paint() {
      const r = Number(slider.value) / 100;
      g.remove();
      g = el("g", {}, s);
      drawTwoThirds(g, r);
      if (r >= 0.62) {
        fb.className = "fb good";
        fb.textContent = "Two thirds or more of the fastener is in the lower member. That is the rule of thumb, and it is what holds.";
        done();
      } else {
        fb.className = "fb";
        fb.textContent = "Not yet. A fastener that barely reaches the lower member is holding almost nothing.";
      }
    }
    slider.addEventListener("input", paint);
    paint();
    mount.appendChild(wrap);
  }

  const basePredict = R.predict;
  R.predict = function (data, mount, done) {
    if (data && data.cases === "pare") return caseChoice(PARE_CASES, drawPare, data, mount, done);
    if (data && data.cases === "glue") return caseChoice(GLUE_CASES, drawGlue, data, mount, done);
    return basePredict(data, mount, done);
  };

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

  C.JOINTS = JOINTS;
  C.FAMILIES = FAMILIES;
  C.FASTENERS = FASTENERS;
})();
