  /* ==== Professor Adow TVET — Square, Level and Setting Out ================
     The pictures of the setting-out film, between the shared engine's head
     and tail (tools/lib/ehel-film-engine-head.js explains the assembly).

     WHY THIS FILM EXISTS. Nothing in the Ehel library teaches this. All 116
     storyboards were scanned: the only film that says "right angle" more than
     twice is the Stage 4 maths one another lesson already uses, and the next
     best, Where Things Are, teaches the right angle as a COMPASS QUARTER
     TURN — which is not proving a corner square with a 3-4-5 or reading a
     spirit level. Shapes and Symmetry, which sounds like the answer, never
     says the phrase at all.

     THE THREE WORDS ARE NOT SYNONYMS AND THE FILM MUST NOT BLUR THEM. Square
     is two things at ninety degrees to each other. Level is horizontal, which
     only gravity can settle. Plumb is vertical, likewise. A learner who
     thinks a level proves a corner square will build a parallelogram that is
     beautifully horizontal, so each gets its own tool on screen and the tool
     is the one the trade actually picks up.

     A learner here is an adult at grade 8 to 11 level, so the working is
     written the way it goes on a job sheet, and the bubble is drawn where a
     bubble really sits: off towards the HIGH end. */

  /* ---- the site palette --------------------------------------------------- */
  var TIMBER = "#C98A4B", TIMBER_D = "#A96E35";
  var STEEL = "#B9C6D0", STEEL_D = "#7E8E9B";
  var VIAL = "#EAF6E9", BUBBLE = "#4FD1A0";
  var GROUND = "#3E5A47", LINEC = "#F7F4EC";

  var HUE = {
    title: P.teal, words: P.blue, bubble: P.good, diagonals: P.gold,
    threefourfive: P.accent, units: P.plum, waste: P.teal, recap: P.teal
  };

  /* ==== small parts ======================================================== */

  function dim(x1, y1, x2, y2, label, p, col, below) {
    if (!(p > 0)) return "";
    col = col || P.teal;
    var horiz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    var ux = x1 + (x2 - x1) * Math.min(1, p), uy = y1 + (y2 - y1) * Math.min(1, p);
    var out = L(x1, y1, ux, uy, col, 2, {});
    if (label && p > 0.4) {
      var mx = (x1 + ux) / 2, my = (y1 + uy) / 2;
      out += Tx(horiz ? mx : mx + (below ? 36 : -36), horiz ? my + (below ? 22 : -12) : my + 5,
        label, "lab", "middle", { fill: col, opacity: Math.min(1, (p - 0.4) / 0.4) });
    }
    return out;
  }

  function sum(x, y, text, p, col) {
    if (!(p > 0)) return "";
    return Tx(x, y, text, "lab big", "middle", {
      fill: col || P.ink, opacity: Math.min(1, p),
      transform: "translate(0," + n2((1 - Math.min(1, p)) * 8) + ")"
    });
  }

  function note(x, y, text, p, col) {
    if (!(p > 0)) return "";
    return Tx(x, y, text, "lab", "middle", { fill: col || P.muted, opacity: Math.min(1, p) });
  }

  /* The right-angle square a drawing puts in a corner. */
  function rightMark(x, y, s, p, col) {
    if (!(p > 0)) return "";
    return Pth("M" + n2(x) + "," + n2(y - s) + "v" + n2(s) + "h" + n2(s),
      "none", col || P.good, 3, { opacity: Math.min(1, p) });
  }

  /* A spirit level. `off` is how far from level the work is, -1..1; the bubble
     sits towards the HIGH end, which is the whole reading. */
  function levelTool(cx, cy, w, off, p, glow) {
    var h = 34;
    var out = R(cx - w / 2, cy - h / 2, w, h, 6, STEEL, STEEL_D, 2.5, { opacity: p });
    var vw = 92, vh = 20;
    out += R(cx - vw / 2, cy - vh / 2, vw, vh, 10, VIAL, STEEL_D, 2, { opacity: p });
    out += L(cx - 11, cy - vh / 2, cx - 11, cy + vh / 2, STEEL_D, 1.5, { opacity: p });
    out += L(cx + 11, cy - vh / 2, cx + 11, cy + vh / 2, STEEL_D, 1.5, { opacity: p });
    var bx = cx + clamp(off, -1, 1) * 26;
    out += E(bx, cy, 13, 7.5, BUBBLE, "none", 0, { opacity: p });
    if (glow) out += E(bx, cy, 19, 12, "none", P.good, 2, { opacity: 0.5 * glow });
    return out;
  }

  /* ==== scene: title ======================================================= */
  function sceneTitle(scene, beat, t) {
    var one = scene.first;
    var a = inAt(t, BEATS[one].start, 1.0);
    var lean = on(t, cue(one, "lean"), 1.0);
    var fix = on(t, cue(one, "square"), 0.9);
    var ang = lerp(7, 0, fix);
    var out = R(430, 200, 300, 150, 3, "none", P.muted, 2, { "stroke-dasharray": "6 6", opacity: 0.4 });
    out += G(R(0, 0, 300, 150, 3, TIMBER, TIMBER_D, 2.5, {}),
      { transform: "translate(430,200) rotate(" + n3(ang * (0.3 + 0.7 * lean)) + ",150,75)" });
    out += rightMark(430, 350, 26, fix, P.good);
    out += sum(584, 400, "square, level and plumb — three different words", fix, P.teal);
    return svg(G(out, { opacity: 0.35 + a * 0.65 }));
  }

  function titleMotif(o) {
    var t = (o && o.t) || 0;
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A frame with a right-angle mark in its corner">' +
      G(R(0, 0, 250, 160, 3, TIMBER, TIMBER_D, 3, {}) +
        rightMark(0, 160, 34, 1, P.good) +
        L(0, 186, 250, 186, P.teal, 3, { opacity: 0.5 + 0.3 * breathe(t) }),
        { transform: "translate(55,100)" }) +
      "</svg>";
  }

  /* ==== scene: the three words ============================================= */
  function sceneWords(scene, beat, t, i) {
    var b0 = scene.first, bT = b0 + 1;
    var out = "";
    var cols = [
      /* Three columns 284px apart, so the meaning under each has to be
         SHORT. Written as phrases they overlapped their neighbours; the
         narration carries the rest of the sentence anyway. */
      { x: 300, word: "SQUARE", mean: "ninety degrees", key: "square", col: P.gold },
      { x: 584, word: "LEVEL", mean: "horizontal", key: "level", col: P.good },
      { x: 868, word: "PLUMB", mean: "vertical", key: "plumb", col: P.blue }
    ];
    for (var k = 0; k < cols.length; k++) {
      var c = cols[k];
      var p = on(t, cue(b0, c.key), 0.6);
      if (!(p > 0)) continue;
      out += Tx(c.x, 196, c.word, "lab big", "middle", { fill: c.col, opacity: p });
      out += Tx(c.x, 226, c.mean, "lab", "middle", { fill: P.muted, opacity: p });
      if (i === bT) {
        var q = on(t, cue(bT, "tool"), 0.8);
        if (k === 0) {                                   /* try square */
          out += G(R(-8, -52, 16, 104, 2, HANDLEC(), "#5E3A1B", 2, {}) +
            R(8, 34, 92, 16, 2, STEEL, STEEL_D, 2, {}), { transform: "translate(" + c.x + ",300)", opacity: q });
        } else if (k === 1) {                            /* spirit level */
          out += G(levelTool(0, 0, 170, 0, 1, 0), { transform: "translate(" + c.x + ",300)", opacity: q });
        } else {                                         /* plumb bob */
          out += L(c.x, 258, c.x, 326, STEEL_D, 2, { opacity: q });
          out += Pth("M" + (c.x - 11) + ",326h22l-11,34z", P.gold, "#9A7A18", 2, { opacity: q });
        }
      }
    }
    if (i === bT) out += sum(584, 404, "one tool each, and they do not swap", on(t, cue(bT, "swap"), 0.8), P.blue);
    return svg(out);
  }
  function HANDLEC() { return "#7A4A22"; }

  /* ==== scene: reading the bubble ========================================== */
  function sceneBubble(scene, beat, t, i) {
    var b0 = scene.first, bW = b0 + 1;
    var out = "";
    if (i === b0) {
      var tilt = lerp(0.85, 0.85, 1);
      out += G(R(-170, 0, 340, 26, 3, TIMBER, TIMBER_D, 2.5, {}),
        { transform: "translate(584,300) rotate(-4)" });
      out += G(levelTool(0, 0, 250, tilt, 1, on(t, cue(b0, "high"), 0.8)),
        { transform: "translate(584,270) rotate(-4)" });
      out += note(584, 372, "the bubble is not centred", on(t, cue(b0, "centred"), 0.8), P.muted);
      out += sum(584, 404, "it has run to the HIGH end", on(t, cue(b0, "high"), 0.8), P.good);
    } else {
      /* which way the work must move: the high end comes DOWN */
      var f = on(t, cue(bW, "down"), 1.2);
      var ang = lerp(-4, 0, f);
      out += G(R(-170, 0, 340, 26, 3, TIMBER, TIMBER_D, 2.5, {}),
        { transform: "translate(584,300) rotate(" + n3(ang) + ")" });
      out += G(levelTool(0, 0, 250, lerp(0.85, 0, f), 1, f),
        { transform: "translate(584,270) rotate(" + n3(ang) + ")" });
      var ax = 584 + 150, ay = 250;
      out += Pth("M" + ax + "," + n2(ay - 40 + 30 * f) + "v34l-9,-9m9,9l9,-9", "none", P.accent, 3,
        { opacity: 0.9 * (1 - f) });
      out += sum(584, 404, "lower the end the bubble ran to", on(t, cue(bW, "lower"), 0.8), P.good);
    }
    return svg(out);
  }

  /* ==== scene: the diagonals =============================================== */
  function sceneDiagonals(scene, beat, t, i) {
    var b0 = scene.first, bU = b0 + 1;
    var x = 400, y = 165, w = 370, h = 200;
    var skew = i === bU ? 26 * (1 - on(t, cue(bU, "equal"), 1.0)) : 0;
    var pts = [[x, y], [x + w + skew, y], [x + w, y + h], [x - 0, y + h]];
    var d = "M" + pts[0][0] + "," + pts[0][1];
    for (var j = 1; j < pts.length; j++) d += "L" + n2(pts[j][0]) + "," + n2(pts[j][1]);
    d += "Z";
    var out = Pth(d, "none", TIMBER, 8, { "stroke-linejoin": "round" });
    var d1 = on(t, cue(i === b0 ? b0 : bU, i === b0 ? "corner" : "equal"), 0.9);
    var d2 = on(t, cue(i === b0 ? b0 : bU, i === b0 ? "other" : "equal"), 0.9);
    out += L(pts[0][0], pts[0][1], lerp(pts[0][0], pts[2][0], d1), lerp(pts[0][1], pts[2][1], d1),
      P.gold, 3, { "stroke-dasharray": "8 6" });
    out += L(pts[1][0], pts[1][1], lerp(pts[1][0], pts[3][0], d2), lerp(pts[1][1], pts[3][1], d2),
      P.gold, 3, { "stroke-dasharray": "8 6" });
    if (i === b0) {
      out += sum(584, 404, "measure both, corner to corner", Math.min(d1, d2), P.gold);
    } else {
      var eq = on(t, cue(bU, "equal"), 1.0);
      out += Tx(470, 250, "2.41", "lab", "middle", { fill: P.gold, opacity: d1 });
      out += Tx(700, 250, eq > 0.8 ? "2.41" : "2.36", "lab", "middle", { fill: eq > 0.8 ? P.good : P.bad, opacity: d2 });
      out += rightMark(x, y + h, 24, eq, P.good);
      out += sum(584, 404, "equal diagonals, and only then is it square", eq, P.good);
    }
    return svg(out);
  }

  /* ==== scene: three, four, five =========================================== */
  function sceneThreeFourFive(scene, beat, t, i) {
    var b0 = scene.first, bM = b0 + 1;
    var ox = 400, oy = 345, sc = 78;
    var out = R(180, 120, 810, 270, 8, GROUND, "none", 0, { opacity: 0.35 });
    var a = on(t, cue(b0, "three"), 0.7), b = on(t, cue(b0, "four"), 0.7), c = on(t, cue(b0, "five"), 0.9);
    /* the 3 along, the 4 up, the 5 closing it */
    out += L(ox, oy, ox + 4 * sc * Math.min(1, b), oy, LINEC, 4, { opacity: 0.95 });
    out += L(ox, oy, ox, oy - 3 * sc * Math.min(1, a), LINEC, 4, { opacity: 0.95 });
    out += L(ox, oy - 3 * sc, lerp(ox, ox + 4 * sc, c), lerp(oy - 3 * sc, oy, c), P.accent, 4,
      { opacity: c > 0 ? 1 : 0 });
    out += dim(ox - 26, oy, ox - 26, oy - 3 * sc, "3", a, P.gold);
    out += dim(ox, oy + 30, ox + 4 * sc, oy + 30, "4", b, P.gold, true);
    if (c > 0.6) out += Tx(ox + 190, oy - 140, "5", "lab big", "middle", { fill: P.accent });
    out += rightMark(ox, oy, 26, c > 0.9 ? 1 : 0, P.good);
    if (i === bM) {
      out += sum(584, 424, "any multiple: 300, 400, 500 — or 1.5, 2, 2.5",
        on(t, cue(bM, "multiple"), 0.8), P.accent);
    } else {
      out += sum(584, 424, "three, four, five — and the corner is true", c, P.accent);
    }
    return svg(out);
  }

  /* ==== scene: how many units ============================================== */
  function sceneUnits(scene, beat, t, i) {
    var b0 = scene.first;
    var x = 380, y = 170, w = 420, h = 180;
    var out = R(x, y, w, h, 3, P.cell, P.line, 2.5, {});
    var p = on(t, cue(b0, "divide"), 1.4);
    var cols = 7, rows = 3, n = cols * rows, shown = Math.min(n, Math.floor(p * n + 0.0001));
    for (var k = 0; k < shown; k++) {
      var cc = k % cols, rr = Math.floor(k / cols);
      out += R(x + cc * (w / cols) + 2, y + rr * (h / rows) + 2, w / cols - 4, h / rows - 4, 2,
        TIMBER, TIMBER_D, 1.5, { opacity: 0.95 });
    }
    out += dim(x, y + h + 30, x + w, y + h + 30, "4.2 m", 1, P.plum, true);
    out += sum(584, 400, "4.2 ÷ 0.6 = 7 boards a row, three rows — 21",
      on(t, cue(b0, "twenty"), 0.8), P.plum);
    return svg(out);
  }

  /* ==== scene: the waste allowance ========================================= */
  function sceneWaste(scene, beat, t, i) {
    var b0 = scene.first, bP = b0 + 1;
    var out = "";
    var rows = [
      ["measured", "21 boards", P.ink, "measured"],
      ["waste at 10%", "+ 2.1", P.gold, "waste"],
      ["order", "24 boards", P.good, "order"]
    ];
    /* Each row is cued from the beat that SPEAKS it, not from whichever beat
       is on screen. Reading them all from the current beat made rows one and
       two vanish the moment beat two began, because their phrases are not in
       its words - an accumulating table that emptied itself. */
    var beatOf = [b0, b0, bP];
    for (var k = 0; k < rows.length; k++) {
      var p = on(t, cue(beatOf[k], rows[k][3]), 0.6);
      if (!(p > 0)) continue;
      var yy = 172 + k * 70;
      out += R(330, yy, 510, 54, 10, P.cell, rows[k][2], 2, { opacity: 0.9 * p });
      out += Tx(355, yy + 33, rows[k][0], "lab", "start", { fill: P.muted, opacity: p });
      out += Tx(815, yy + 33, rows[k][1], "lab big", "end", { fill: rows[k][2], opacity: p });
    }
    if (i === bP) {
      out += sum(584, 408, "round UP — you cannot buy a tenth of a board",
        on(t, cue(bP, "round"), 0.8), P.good);
    }
    return svg(out);
  }

  /* ==== scene: recap ======================================================= */
  function sceneRecap(scene, beat, t, i) {
    var b0 = scene.first;
    var rows = [
      ["square", "diagonals equal", P.gold, "square"],
      ["level and plumb", "bubble to the middle", P.good, "bubble"],
      ["setting out", "3, 4, 5 · count · add waste", P.accent, "setting"]
    ];
    var out = "";
    for (var k = 0; k < rows.length; k++) {
      var p = on(t, cue(b0, rows[k][3]), 0.6);
      if (!(p > 0)) continue;
      var yy = 165 + k * 78;
      out += R(270, yy, 630, 58, 10, P.cell, rows[k][2], 2, { opacity: 0.9 * p });
      out += Tx(295, yy + 36, rows[k][0], "lab", "start", { fill: rows[k][2], opacity: p });
      out += Tx(875, yy + 36, rows[k][1], "lab big", "end", { fill: P.ink, opacity: p });
    }
    out += sum(584, 412, "prove it, then build to it", on(t, cue(b0, "prove"), 0.8), P.teal);
    return svg(out);
  }

  var KINDS = {
    title: sceneTitle, words: sceneWords, bubble: sceneBubble,
    diagonals: sceneDiagonals, threefourfive: sceneThreeFourFive,
    units: sceneUnits, waste: sceneWaste, recap: sceneRecap
  };
