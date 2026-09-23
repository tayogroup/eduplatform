
  /* ==== Professor Adow TVET — Marking Out and Cutting a Halving Joint ======
     The pictures of the halving-joint film, between the shared engine's head
     and tail (tools/lib/ehel-film-engine-head.js explains the assembly).

     NOTHING IS LIFTED FROM THE LESSON. The Science films pass
     renderer.art: ["science"] and the engine pulls the kit's own drawings in.
     That works there because those drawings are pure functions of a state
     index. Carpentry's are SVG DOM built at run time by carpentry.js, and
     this engine emits SVG STRINGS at a time t, so every picture here is drawn
     fresh — in the colours the lesson uses, so a learner who watches the film
     and then opens the lesson sees the same timber and the same marks.

     THE ANIMATION IS CUED OFF THE WORDS, not off a schedule. `cue(beat, name)`
     is the measured moment a phrase is spoken, so the shoulder line is drawn
     as the narrator says "square the shoulder line" — which is the whole
     reason the storyboard keys its marks to phrases rather than to seconds.

     A learner here is an adult at grade 8 to 11 level. There are no stickers
     and no cartoon hands: the drawings are the drawings a tradesperson would
     make on the wood. */

  /* ---- the timber palette, the lesson's own ---------------------------- */
  var WOOD = "#C98A4B", WOOD_D = "#A96E35", WOOD_END = "#B87C3F", GRAIN = "#8A5A28";
  var STEEL = "#B9C6D0", STEEL_D = "#7E8E9B", BRASS = "#C9A227", HANDLE = "#7A4A22";

  /* Each scene owns a colour, as in the science and maths films, so the film
     reads as chapters. */
  var HUE = {
    title: P.teal, joint: P.teal, tools: P.blue, faces: P.gold,
    shoulder: P.plum, gauge: P.teal, waste: P.accent, saw: P.bad,
    fit: P.good, recap: P.teal
  };

  /* ==== the timber ========================================================= */

  /* A board seen face on. Grain runs ALONG the length, never across it —
     drawing grain across a board is the mistake a trainer spots first. */
  function board(x, y, w, h, o) {
    o = o || {};
    var out = R(x, y, w, h, 3, o.fill || WOOD, WOOD_D, 2.5);
    var rows = Math.max(2, Math.round(h / 22));
    for (var k = 1; k <= rows; k++) {
      var gy = y + (h * k) / (rows + 1);
      out += Pth("M" + n2(x + 5) + "," + n2(gy) +
        " C" + n2(x + w * 0.3) + "," + n2(gy - 3) +
        " " + n2(x + w * 0.62) + "," + n2(gy + 3) +
        " " + n2(x + w - 5) + "," + n2(gy),
        null, GRAIN, 1.4, { opacity: 0.34 });
    }
    if (o.end) {
      var ex = o.end === "left" ? x : x + w - 14;
      out += R(ex, y, 14, h, 2, WOOD_END, WOOD_D, 2.5);
      for (var r = 1; r <= 3; r++) {
        out += Pth("M" + n2(ex + 2) + "," + n2(y + (h * r) / 4) + " q6,-4 11,0", null, GRAIN, 1.3, { opacity: 0.5 });
      }
    }
    return out;
  }

  /* the carpenter's own handwriting: a looping f on the face side, and the
     mark on the edge that meets it */
  function faceMark(x, y, s, p) {
    if (!(p > 0)) return "";
    return G(Pth("M" + n2(x) + "," + n2(y) + " c0," + n2(-26 * s) + " " + n2(6 * s) + "," + n2(-34 * s) +
      " " + n2(13 * s) + "," + n2(-34 * s) + " c" + n2(5 * s) + ",0 " + n2(7 * s) + "," + n2(5 * s) +
      " " + n2(6 * s) + "," + n2(9 * s), null, P.ink, 3 * s),
      { opacity: Math.min(1, p) });
  }
  function edgeMark(x1, x2, y, p) {
    if (!(p > 0)) return "";
    return L(x1, y, lerp(x1, x2, Math.min(1, p)), y, P.teal, 4.5, { opacity: 0.95 });
  }

  /* ==== the tools ========================================================== */

  function trySquareFig(cx, cy, s, glow) {
    var out = "";
    if (glow > 0) out += R(cx - 30 * s, cy - 92 * s, 250 * s, 150 * s, 18 * s, P.blue, null, null, { opacity: 0.1 * glow });
    out += R(cx, cy - 78 * s, 38 * s, 156 * s, 4 * s, HANDLE, "#5C3517", 3);        /* stock */
    out += R(cx + 9 * s, cy - 70 * s, 7 * s, 140 * s, 0, BRASS, null, null, { opacity: 0.9 });
    out += R(cx + 26 * s, cy - 70 * s, 5 * s, 140 * s, 0, BRASS, null, null, { opacity: 0.55 });
    out += R(cx + 38 * s, cy - 78 * s, 190 * s, 24 * s, 2, STEEL, STEEL_D, 3);      /* blade */
    for (var k = 1; k < 9; k++) {
      out += L(cx + 38 * s + k * 21 * s, cy - 78 * s, cx + 38 * s + k * 21 * s, cy - 78 * s + (k % 5 === 0 ? 14 : 8) * s, STEEL_D, 1.6);
    }
    out += Pth("M" + n2(cx + 38 * s) + "," + n2(cy - 38 * s) + " v" + n2(-16 * s) + " h" + n2(16 * s), null, P.teal, 3.2 * s);
    return out;
  }

  function gaugeFig(cx, cy, s, glow, setP) {
    var out = "";
    if (glow > 0) out += R(cx - 20 * s, cy - 56 * s, 280 * s, 116 * s, 18 * s, P.teal, null, null, { opacity: 0.1 * glow });
    var stemW = lerp(150, 240, clamp(setP == null ? 1 : setP, 0, 1)) * s;
    out += R(cx, cy - 10 * s, stemW, 22 * s, 3, HANDLE, "#5C3517", 2.5);            /* stem */
    out += R(cx + 62 * s, cy - 44 * s, 46 * s, 92 * s, 6, "#8B5A2B", "#5C3517", 2.5); /* fence */
    out += C(cx + 85 * s, cy - 50 * s, 10 * s, BRASS, "#8A6E12", 2.2);              /* thumbscrew */
    out += Pth("M" + n2(cx + stemW) + "," + n2(cy) + " l" + n2(13 * s) + "," + n2(-9 * s) +
      " v" + n2(18 * s) + " z", STEEL, STEEL_D, 1.8);                                /* the pin */
    return out;
  }

  function sawFig(cx, cy, s, glow, teethP, backP) {
    var out = "";
    if (glow > 0) out += R(cx - 20 * s, cy - 54 * s, 330 * s, 120 * s, 18 * s, P.blue, null, null, { opacity: 0.1 * glow });
    out += R(cx, cy - 6 * s, 236 * s, 34 * s, 0, STEEL, STEEL_D, 2.5);              /* blade */
    out += R(cx, cy - 18 * s, 236 * s, 13 * s, 3, "#6E7B86", STEEL_D, 2.5,
      backP > 0 ? { stroke: P.gold, "stroke-width": 3.4 } : null);                  /* the back */
    var d = "M" + n2(cx) + "," + n2(cy + 28 * s);
    for (var x = 0; x < 236; x += 9) d += " l" + n2(4.5 * s) + "," + n2(8 * s) + " l" + n2(4.5 * s) + "," + n2(-8 * s);
    out += Pth(d, null, teethP > 0 ? P.gold : STEEL_D, teethP > 0 ? 3 : 2.2);
    out += Pth("M" + n2(cx + 236 * s) + "," + n2(cy - 22 * s) + " h" + n2(44 * s) +
      " a" + n2(16 * s) + "," + n2(16 * s) + " 0 0 1 " + n2(16 * s) + "," + n2(16 * s) +
      " v" + n2(34 * s) + " a" + n2(16 * s) + "," + n2(16 * s) + " 0 0 1 " + n2(-16 * s) + "," + n2(16 * s) +
      " h" + n2(-44 * s) + " z", HANDLE, "#5C3517", 2.5);
    return out;
  }

  function chiselFig(cx, cy, s, ang) {
    return G(Pth("M0,0 l" + n2(-18 * s) + "," + n2(13 * s) + " l" + n2(18 * s) + "," + n2(13 * s) + " z", "#D8E2EA", STEEL_D, 2) +
      R(0, 0, 150 * s, 26 * s, 0, STEEL, STEEL_D, 2) +
      R(150 * s, -6 * s, 20 * s, 38 * s, 2, BRASS, "#8A6E12", 2) +
      Pth("M" + n2(170 * s) + "," + n2(-8 * s) + " h" + n2(62 * s) +
        " a" + n2(14 * s) + "," + n2(14 * s) + " 0 0 1 " + n2(14 * s) + "," + n2(14 * s) +
        " v" + n2(20 * s) + " a" + n2(14 * s) + "," + n2(14 * s) + " 0 0 1 " + n2(-14 * s) + "," + n2(14 * s) +
        " h" + n2(-62 * s) + " z", HANDLE, "#5C3517", 2),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n2(ang || 0) + ")" });
  }

  /* a caption under the stage, in the scene's own colour */
  function cap(x, y, s, p, col) {
    if (!(p > 0)) return "";
    return Tx(x, y, s, "lab big", "middle", { opacity: Math.min(1, p), fill: col || P.ink,
      transform: "translate(0," + n2((1 - Math.min(1, p)) * 10) + ")" });
  }

  /* ==== scene: title ======================================================= */
  function sceneTitle(scene, beat, t) {
    var one = scene.first;
    var a = inAt(t, BEATS[one].start, 1.0);
    var cross = on(t, cue(one, "cross"), 0.8);
    var flush = on(t, cue(one, "flush"), 0.7);
    var gap = lerp(70, 0, flush);
    var out = board(320, 250, 300, 54, {});
    out += G(board(0, 0, 300, 54, {}), { transform: "translate(" + n2(470) + "," + n2(196 - gap) + ")", opacity: cross });
    out += G(cap(584, 372, "two pieces, crossing — and finishing flush", flush, P.teal), {});
    return svg(G(out, { opacity: 0.35 + a * 0.65 }));
  }

  function titleMotif(o) {
    var t = (o && o.t) || 0;
    var s = 0.42;
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A halving joint, two members crossing flush">' +
      G(board(0, 150, 300, 56, {}) +
        G(board(0, 0, 300, 56, {}), { transform: "translate(30,96)" }) +
        L(20, 178, 320, 178, P.teal, 3, { opacity: 0.5 + 0.3 * breathe(t) }),
        { transform: "translate(30,20) scale(" + n3(s * 2.4) + ")" }) +
      "</svg>";
  }

  /* ==== scene: what a halving joint is ===================================== */
  function sceneJoint(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1;
    var apart = on(t, cue(b0, "apart"), 0.7);
    var half = on(t, cue(b0, "half"), 0.7);
    var close = on(t, cue(b1, "close"), 1.1);
    var flush = on(t, cue(b1, "flush"), 0.6);

    var MW = 300, MH = 62, LAP = 130;
    var X = 300, Y = 250;
    var lift = lerp(96, 0, close);

    var out = board(X, Y, MW, MH, {});
    /* the lower member's notch, cut away as "half" is said */
    if (half > 0) {
      out += R(X + MW - LAP, Y, LAP, (MH / 2) * half, 0, P.ground, WOOD_D, 2.5);
      out += L(X + MW - LAP, Y + MH / 2, X + MW, Y + MH / 2, WOOD_D, 2, { opacity: half });
    }
    /* the upper member, coming down to meet it */
    var UX = X + MW - LAP, UY = Y - MH - lift;
    var upper = board(0, 0, MW, MH, {});
    if (half > 0) upper += R(0, (MH / 2) * (1 - 0) - (MH / 2) * (1 - half), LAP, (MH / 2) * half, 0, P.ground, WOOD_D, 2.5);
    out += G(upper, { transform: "translate(" + n2(UX) + "," + n2(UY) + ")", opacity: 0.25 + 0.75 * apart });

    if (half > 0 && close < 0.9) {
      out += Tx(X + MW - LAP / 2, Y - MH - lift - 18, "half the thickness off each", "lab", "middle",
        { opacity: half * (1 - close), fill: P.gold });
    }
    if (flush > 0) {
      out += L(X - 14, Y, X + MW + LAP + 14, Y, P.good, 3, { opacity: 0.9 * flush });
      out += L(X - 14, Y + MH, X + MW + LAP + 14, Y + MH, P.good, 3, { opacity: 0.9 * flush });
      out += cap(584, 386, "the two faces finish flush", flush, P.good);
    }
    return svg(out);
  }

  /* ==== scene: three tools ================================================= */
  function sceneTools(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var sq = on(t, cue(b0, "square"), 0.6);
    var ga = on(t, cue(b1, "gauge"), 0.6);
    var sa = on(t, cue(b2, "saw"), 0.6);
    var teeth = bump(t, cue(b2, "teeth"), 1.4);
    var back = bump(t, cue(b2, "back"), 1.4);

    /* Drawn at 0.78 the three tools sat small in a 1168 x 440 stage with
       dead space all round them — legible, but nobody would call them
       drawings of tools. Bigger, and spaced on thirds. */
    var out = "";
    out += G(trySquareFig(0, 0, 1.15, sq), { transform: "translate(120,196)", opacity: 0.18 + 0.82 * sq });
    out += Tx(255, 356, "try square", "lab big", "middle", { opacity: sq, fill: P.blue });

    out += G(gaugeFig(0, 0, 1.15, ga, 1), { transform: "translate(470,214)", opacity: 0.18 + 0.82 * ga });
    out += Tx(620, 356, "marking gauge", "lab big", "middle", { opacity: ga, fill: P.teal });

    out += G(sawFig(0, 0, 1.0, sa, teeth, back), { transform: "translate(810,196)", opacity: 0.18 + 0.82 * sa });
    out += Tx(960, 356, "tenon saw", "lab big", "middle", { opacity: sa, fill: P.blue });

    /* y 372 put this straight through the tool labels once they moved down
       to 356 and grew. The caption belt for this scene is the bottom of the
       stage, clear of them. */
    if (teeth > 0) out += cap(584, 416, "fine teeth — a clean cut across the grain", teeth, P.gold);
    else if (back > 0) out += cap(584, 416, "a stiff back — the cut runs straight", back, P.gold);
    return svg(out);
  }

  /* ==== scene: face side, face edge ======================================== */
  var BX = 300, BY = 210, BW = 560, BH = 108;

  function sceneFaces(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var bd = on(t, cue(b0, "board"), 0.7);
    var fs = on(t, cue(b1, "faceside"), 0.6);
    var fe = on(t, cue(b1, "faceedge"), 0.6);
    var both = bump(t, cue(b2, "both"), 1.6);
    var no = on(t, cue(b2, "no"), 0.6);

    var out = board(BX, BY, BW, BH, { end: "right" });
    out += G(faceMark(BX + 120, BY + BH * 0.74, 1.1, fs), {});
    if (fs > 0) out += Tx(BX + 128, BY - 16, "face side", "lab", "middle", { opacity: fs, fill: P.ink });
    out += edgeMark(BX, BX + BW, BY + BH, fe);
    if (fe > 0) out += Tx(BX + BW - 10, BY + BH + 30, "face edge", "lab", "end", { opacity: fe, fill: P.teal });
    if (both > 0) {
      out += R(BX - 10, BY - 10, BW + 20, BH + 20, 8, null, P.gold, 3, { opacity: 0.8 * both });
      out += cap(584, 386, "every measurement comes off these two", both, P.gold);
    }
    if (no > 0) {
      out += G(L(-16, -16, 16, 16, P.bad, 5) + L(16, -16, -16, 16, P.bad, 5),
        { transform: "translate(" + n2(BX + BW + 34) + "," + n2(BY + BH / 2) + ")", opacity: no });
      out += Tx(BX + BW + 34, BY + BH / 2 + 52, "not a sawn end", "lab", "middle", { opacity: no, fill: P.bad });
    }
    return svg(G(out, { opacity: 0.25 + 0.75 * bd }));
  }

  /* ==== scene: the shoulder line =========================================== */
  var SHX = BX + 330;   /* where the shoulder falls */

  function sceneShoulder(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var meas = on(t, cue(b0, "measure"), 0.7);
    var line = on(t, cue(b1, "line"), 0.8);
    var edges = on(t, cue(b1, "edges"), 0.8);
    var press = bump(t, cue(b1, "press"), 1.5);
    var lift = on(t, cue(b2, "lift"), 0.7);
    var bad = on(t, cue(b2, "bad"), 0.6);

    var out = board(BX, BY, BW, BH, { end: "right" });
    out += faceMark(BX + 120, BY + BH * 0.74, 1.1, 1);
    out += edgeMark(BX, BX + BW, BY + BH, 1);

    if (meas > 0) {
      out += L(SHX, BY - 34, BX + BW, BY - 34, P.gold, 2, { opacity: meas });
      out += Tx((SHX + BX + BW) / 2, BY - 44, "the width of the other piece", "lab", "middle", { opacity: meas, fill: P.gold });
    }
    /* the square, riding on the face edge, tilting if it lifts */
    var tilt = lift * 4.5;
    var sqG = trySquareFig(0, 0, 0.95, 0);
    out += G(sqG, { transform: "translate(" + n2(SHX - 24) + "," + n2(BY + BH + 10) + ") rotate(" + n2(-90 + tilt) + ")",
      opacity: 0.25 + 0.75 * Math.max(line, lift) });
    if (press > 0) out += C(SHX - 12, BY + BH - 6, 16 + 6 * press, null, P.good, 3, { opacity: press });

    /* the line itself, drawn down the face as it is named */
    if (line > 0) out += L(SHX, BY - 12, SHX, BY - 12 + (BH + 24) * line, P.ink, 3.2);
    if (edges > 0) {
      out += L(SHX - 16, BY, SHX - 16 + 0, BY + BH * edges, P.ink, 2.4, { opacity: 0.85 });
      out += L(SHX + 16, BY, SHX + 16 + 0, BY + BH * edges, P.ink, 2.4, { opacity: 0.85 });
      out += Tx(SHX, BY - 26, "shoulder", "lab", "middle", { opacity: edges, fill: P.ink });
    }
    if (bad > 0) {
      out += L(SHX, BY - 12, SHX + 22, BY + BH + 12, P.bad, 3.2, { opacity: bad });
      out += cap(584, 396, "the stock lifted — the line is not square", bad, P.bad);
    }
    return svg(out);
  }

  /* ==== scene: half the thickness ========================================== */
  function sceneGauge(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var set = on(t, cue(b0, "set"), 0.8);
    var lock = bump(t, cue(b0, "lock"), 1.4);
    var score = on(t, cue(b1, "score"), 1.0);
    var both = on(t, cue(b1, "both"), 0.7);
    var equal = on(t, cue(b2, "equal"), 0.6);
    var error = on(t, cue(b2, "error"), 0.7);

    var out = board(BX, BY, BW, BH, { end: "right" });
    out += faceMark(BX + 120, BY + BH * 0.74, 1.1, 1);
    out += edgeMark(BX, BX + BW, BY + BH, 1);
    out += L(SHX, BY - 12, SHX, BY + BH + 12, P.ink, 3.2);

    /* the gauge, its stem opening to half the thickness */
    out += G(gaugeFig(0, 0, 0.55, 0, set), { transform: "translate(" + n2(BX + 40) + "," + n2(BY - 78) + ")", opacity: 0.3 + 0.7 * set });
    if (lock > 0) out += C(BX + 40 + 47, BY - 78 - 28, 14 + 5 * lock, null, P.gold, 3, { opacity: lock });

    if (score > 0) {
      out += L(SHX, BY + BH / 2, SHX + (BX + BW - SHX) * score, BY + BH / 2, P.teal, 3.4);
      out += Tx(BX + BW + 10, BY + BH / 2 + 6, "½", "lab big", "start", { opacity: score, fill: P.teal });
    }
    /* Beat 15 drew this caption and the error caption ten pixels apart, so
       they printed on top of each other. The later line replaces the
       earlier one rather than sharing the space with it. */
    if (both > 0 && !(error > 0)) out += cap(584, 386, "both members, from the one setting", both, P.teal);
    if (equal > 0) {
      out += L(SHX + 20, BY + 8, SHX + 20, BY + BH / 2 - 8, P.good, 3, { opacity: equal });
      out += L(SHX + 20, BY + BH / 2 + 8, SHX + 20, BY + BH - 8, P.good, 3, { opacity: equal });
    }
    if (error > 0) {
      out += L(SHX, BY + BH / 2 + 9, BX + BW, BY + BH / 2 + 9, P.bad, 3, { opacity: error });
      out += cap(584, 386, "one millimetre out, twice — the joint is two out", error, P.bad);
    }
    return svg(out);
  }

  /* ==== scene: mark the waste ============================================== */
  function hatch(x, y, w, h, p, col) {
    if (!(p > 0)) return "";
    var out = "", n = Math.round(w / 15), got = Math.round(n * Math.min(1, p));
    for (var k = 0; k < got; k++) {
      var hx = x + 4 + k * 15;
      out += L(hx, y + 3, hx - h * 0.55, y + h - 3, col || P.bad, 2.2, { opacity: 0.92 });
    }
    return out;
  }

  function sceneWaste(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1;
    var h = on(t, cue(b0, "hatch"), 1.2);
    var safe = on(t, cue(b1, "safe"), 0.7);

    var out = board(BX, BY, BW, BH, { end: "right" });
    out += faceMark(BX + 120, BY + BH * 0.74, 1.1, 1);
    out += edgeMark(BX, BX + BW, BY + BH, 1);
    out += L(SHX, BY - 12, SHX, BY + BH + 12, P.ink, 3.2);
    out += L(SHX, BY + BH / 2, BX + BW, BY + BH / 2, P.teal, 3.4);
    out += hatch(SHX, BY, BX + BW - SHX, BH / 2, h);
    if (h > 0) out += Tx((SHX + BX + BW) / 2, BY - 22, "waste", "lab big", "middle", { opacity: h, fill: P.bad });
    if (safe > 0) out += cap(584, 396, "nobody who hatches the waste saws off the wrong half", safe, P.accent);
    return svg(out);
  }

  /* ==== scene: which side of the line ====================================== */
  function kerfBoard(x, y, w, h, lineX, offset, col, kp) {
    var out = board(x, y, w, h, {});
    out += L(lineX, y - 12, lineX, y + h + 12, P.ink, 3.2);
    if (kp > 0) {
      out += R(lineX + offset - 5, y, 10, h * kp, 0, P.ground, col, 2.4);
    }
    return out;
  }

  function sceneSaw(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var kerf = on(t, cue(b0, "kerf"), 0.8);
    var waste = bump(t, cue(b0, "waste"), 1.5);
    var good = on(t, cue(b1, "good"), 0.9);
    var lineOn = bump(t, cue(b1, "line"), 1.4);
    var bad = on(t, cue(b2, "bad"), 0.9);
    var slack = on(t, cue(b2, "slack"), 0.7);

    var W = 380, H = 116;
    var out = "";
    /* left: the right way. right: the wrong way, once it is named. */
    out += G(kerfBoard(0, 0, W, H, 210, 9, P.good, Math.max(kerf, good)),
      { transform: "translate(110,200)" });
    out += Tx(300, 180, "on the waste side", "lab", "middle", { opacity: Math.max(kerf, good), fill: P.good });
    if (good > 0) out += Tx(300, 356, "the line stays on the work", "lab", "middle", { opacity: good, fill: P.good });
    if (lineOn > 0) out += C(320, 258, 16 + 7 * lineOn, null, P.good, 3, { opacity: lineOn });

    if (bad > 0) {
      out += G(kerfBoard(0, 0, W, H, 210, 0, P.bad, bad), { transform: "translate(660,200)", opacity: bad });
      out += Tx(850, 180, "down the middle", "lab", "middle", { opacity: bad, fill: P.bad });
      if (slack > 0) out += Tx(850, 356, "half a kerf out of the joint — slack", "lab", "middle", { opacity: slack, fill: P.bad });
    }
    if (waste > 0) out += cap(584, 400, "the kerf comes out of the waste", waste, P.gold);
    return svg(out);
  }

  /* ==== scene: pare, and fit it dry ======================================== */
  function sceneFit(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var pare = on(t, cue(b0, "pare"), 1.0);
    var clean = on(t, cue(b0, "clean"), 0.7);
    var dry = on(t, cue(b1, "dry"), 0.8);
    var tight = on(t, cue(b1, "tight"), 0.7);
    var closed = on(t, cue(b2, "closed"), 1.1);
    var diag = on(t, cue(b2, "diag"), 0.8);

    var out = "";
    if (closed < 0.15) {
      /* paring: two chisels, one from each face, meeting in the middle */
      var X = 320, Y = 214, W = 420, H = 116;
      out += board(X, Y, W, H, {});
      out += L(X + W / 2, Y - 10, X + W / 2, Y + H + 10, P.ink, 3);
      out += G(chiselFig(0, 0, 0.62, 0), { transform: "translate(" + n2(X + 60 - 90 * (1 - pare)) + "," + n2(Y + 18) + ")", opacity: pare });
      out += G(chiselFig(0, 0, 0.62, 180), { transform: "translate(" + n2(X + W - 60 + 90 * (1 - pare)) + "," + n2(Y + H - 18) + ")", opacity: pare });
      if (clean > 0) {
        out += L(X + W / 2, Y, X + W / 2, Y + H, P.good, 4, { opacity: clean });
        out += cap(584, 392, "supported on both faces — no break-out", clean, P.good);
      }
    } else {
      /* the joint, coming together */
      var MW = 300, MH = 62, LAP = 130, JX = 300, JY = 250;
      var gap = lerp(90, 0, closed);
      out += board(JX, JY, MW, MH, {});
      out += R(JX + MW - LAP, JY, LAP, MH / 2, 0, P.ground, WOOD_D, 2.5);
      var up = board(0, 0, MW, MH, {}) + R(0, MH / 2, LAP, MH / 2, 0, P.ground, WOOD_D, 2.5);
      out += G(up, { transform: "translate(" + n2(JX + MW - LAP) + "," + n2(JY - MH - gap) + ")" });
      if (diag > 0) {
        /* ACROSS THE LAP, not across the bounding box. The first cut drew
           the lap; the second drew corner to corner of the whole assembly,
           which is worse — two members crossing make a staircase, not a
           rectangle, so those diagonals ended in empty stage on both sides
           and measured nothing. The square thing here is the lap, and that
           is what a carpenter puts a tape across. */
        var x0 = JX + MW - LAP, y0 = JY - MH, x1 = JX + MW, y1 = JY + MH;
        out += L(x0, y0, x1, y1, P.teal, 2.4, { opacity: diag, "stroke-dasharray": "8 5" });
        out += L(x1, y0, x0, y1, P.teal, 2.4, { opacity: diag, "stroke-dasharray": "8 5" });
        out += cap(584, 396, "equal diagonals — check before any glue", diag, P.teal);
      } else if (closed > 0.7) {
        out += cap(584, 396, "together by hand, and it stays there", closed, P.good);
      }
    }
    if (tight > 0 && closed < 0.15) {
      out += cap(584, 62, "if it needs a mallet it is too tight", tight, P.bad);
    }
    if (dry > 0 && closed < 0.15) {
      out += cap(584, 92, "fit it dry first", dry, P.gold);
    }
    return svg(out);
  }

  /* ==== scene: the order of work =========================================== */
  var ORDER = [
    ["one", "face side"], ["two", "shoulder"], ["three", "gauge"], ["four", "waste"],
    ["five", "saw"], ["six", "pare"], ["seven", "fit dry"]
  ];

  function sceneRecap(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1;
    var out = "";
    var cx = 118, gap = 156;
    for (var k = 0; k < ORDER.length; k++) {
      var at = k < 4 ? cue(b0, ORDER[k][0]) : cue(b1, ORDER[k][0]);
      var p = popIn(t, at, 0.42);
      if (!(p > 0)) continue;
      var x = cx + k * gap;
      out += G(C(0, 0, 40, P.cell, P.teal, 3) +
        Tx(0, 11, String(k + 1), "lab big", "middle", { fill: P.teal }) +
        Tx(0, 76, ORDER[k][1], "lab", "middle", { fill: P.ink }),
        { transform: "translate(" + n2(x) + ",210) " + around(0, 0, Math.min(p, 1.08)), opacity: Math.min(1, p) });
      if (k > 0) {
        var pp = on(t, at, 0.4);
        out += L(x - gap + 44, 210, x - 44, 210, P.line, 3, { opacity: 0.8 * pp });
      }
    }
    var done = on(t, cue(b1, "seven"), 0.8);
    if (done > 0) out += cap(584, 350, "in that order, every time", done, P.teal);
    return svg(out);
  }

  var KINDS = {
    title: sceneTitle, joint: sceneJoint, tools: sceneTools, faces: sceneFaces,
    shoulder: sceneShoulder, gauge: sceneGauge, waste: sceneWaste, saw: sceneSaw,
    fit: sceneFit, recap: sceneRecap
  };
