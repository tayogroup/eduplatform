  /* ==== Professor Adow TVET — Area, Volume and What They Cost ==============
     The pictures of the area/volume film, between the shared engine's head
     and tail (tools/lib/ehel-film-engine-head.js explains the assembly).

     WHY THIS FILM EXISTS. All 116 storyboards in the Ehel library were
     scanned for the words this lesson is about, and "volume" appears nowhere
     in a measuring sense — its only hits are two Computing films, where it
     means loudness. "area" appears four times in the Stage 4 maths film that
     another lesson already uses, and twice more. So there was nothing to
     borrow, and this was drawn rather than reused.

     IT IS A TRADE FILM, not a primary one. Every quantity on screen is a
     thing somebody orders or pays for: a floor, a wall with a door in it, a
     tank of water. A learner here is an adult at grade 8 to 11 level, so
     there are no stickers and no cartoon hands, and the arithmetic is shown
     the way it would be written on a job sheet.

     THE ANIMATION IS CUED OFF THE WORDS. `cue(beat, name)` is the measured
     moment a phrase is spoken, so the grid fills as the narrator says "how
     many squares cover it" — which is why the storyboard keys marks to
     phrases rather than to seconds. */

  /* ---- the materials palette --------------------------------------------- */
  var FLOOR = "#C98A4B", FLOOR_D = "#A96E35";      /* boarded floor, the lesson's timber */
  var WALL = "#93A7B5", WALL_D = "#6C8291";        /* rendered blockwork */
  var WATER = "#4FA3D1", WATER_D = "#2E7BA6";
  var CHALK = "#F7F4EC";

  var HUE = {
    title: P.teal, perimeter: P.blue, area: P.teal, split: P.gold,
    openings: P.accent, volume: P.plum, litres: P.blue, density: P.good,
    recap: P.teal
  };

  /* ==== small parts ======================================================== */

  /* A dimension line: the arrow pair a drawing office puts between two
     witness lines, with the figure sitting on it. */
  function dim(x1, y1, x2, y2, label, p, col, above) {
    if (!(p > 0)) return "";
    col = col || P.teal;
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var horiz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    var ux = x1 + (x2 - x1) * Math.min(1, p), uy = y1 + (y2 - y1) * Math.min(1, p);
    var out = L(x1, y1, ux, uy, col, 2, { opacity: 0.95 });
    var a = 7;
    out += Pth("M" + n2(x1) + "," + n2(y1) + (horiz
      ? "l" + a + ",-" + a + "v" + (2 * a) + "z" : "l-" + a + "," + a + "h" + (2 * a) + "z"), col, "none", 0, {});
    if (p > 0.92) {
      out += Pth("M" + n2(x2) + "," + n2(y2) + (horiz
        ? "l-" + a + ",-" + a + "v" + (2 * a) + "z" : "l-" + a + ",-" + a + "h" + (2 * a) + "z"), col, "none", 0, {});
    }
    if (label && p > 0.35) {
      var off = above === false ? 20 : -12;
      out += Tx(horiz ? mx : mx + (above === false ? 34 : -34), horiz ? my + off : my + 5,
        label, "lab", "middle", { fill: col, opacity: Math.min(1, (p - 0.35) / 0.4) });
    }
    return out;
  }

  /* A rectangle of floor, seen in plan. */
  function slab(x, y, w, h, col, dark, o) {
    o = o || {};
    var out = R(x, y, w, h, 3, col, dark, 2.5, { opacity: o.opacity == null ? 1 : o.opacity });
    return out;
  }

  /* The squares that MEAN area. They arrive one at a time, in reading order,
     because "length times width" is a shortcut for counting these and a
     learner who has never seen them counted has only the shortcut. */
  function squares(x, y, w, h, cols, rows, p, col) {
    if (!(p > 0)) return "";
    var cw = w / cols, ch = h / rows, n = cols * rows;
    var shown = Math.min(n, Math.floor(p * n + 0.0001));
    var out = "";
    for (var k = 0; k < shown; k++) {
      var c = k % cols, r = Math.floor(k / cols);
      out += R(x + c * cw + 1.5, y + r * ch + 1.5, cw - 3, ch - 3, 2,
        col || P.teal, "none", 0, { opacity: 0.42 });
    }
    return out;
  }

  /* A figure written as a job sheet writes it. */
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

  /* A box drawn in the flat isometric the trade's own sketches use. */
  function boxIso(x, y, w, h, d, p, col, dark) {
    var out = "";
    var dx = d * 0.55, dy = -d * 0.42;
    out += Pth("M" + n2(x) + "," + n2(y) + "h" + n2(w) + "l" + n2(dx) + "," + n2(dy) +
      "h" + n2(-w) + "z", dark, dark, 1.5, { opacity: 0.85 * p });           /* top */
    out += Pth("M" + n2(x + w) + "," + n2(y) + "v" + n2(h) + "l" + n2(dx) + "," + n2(dy) +
      "v" + n2(-h) + "z", dark, dark, 1.5, { opacity: 0.6 * p });            /* side */
    out += R(x, y, w, h, 2, col, dark, 2.5, { opacity: p });                  /* face */
    return out;
  }

  /* ==== scene: title ======================================================= */
  function sceneTitle(scene, beat, t) {
    var one = scene.first;
    var a = inAt(t, BEATS[one].start, 1.0);
    var cover = on(t, cue(one, "cover"), 0.9);
    var pay = on(t, cue(one, "pay"), 0.8);
    var x = 434, y = 190, w = 300, h = 150;
    var out = slab(x, y, w, h, FLOOR, FLOOR_D, {});
    out += squares(x, y, w, h, 6, 3, cover, P.teal);
    out += sum(584, 372, "every one of these is bought and paid for", pay, P.teal);
    return svg(G(out, { opacity: 0.35 + a * 0.65 }));
  }

  function titleMotif(o) {
    var t = (o && o.t) || 0;
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A rectangle covered in unit squares">' +
      G(slab(0, 0, 260, 170, FLOOR, FLOOR_D, {}) +
        squares(0, 0, 260, 170, 5, 3, 1, P.teal) +
        L(0, 185, 260, 185, P.teal, 3, { opacity: 0.5 + 0.3 * breathe(t) }),
        { transform: "translate(50,95)" }) +
      "</svg>";
  }

  /* ==== scene: perimeter =================================================== */
  function scenePerimeter(scene, beat, t, i) {
    var b0 = scene.first, bL = b0 + 1;
    var out = "";
    if (i === b0) {
      var x = 400, y = 180, w = 360, h = 170;
      var walk = on(t, cue(b0, "round"), 1.6);
      out += slab(x, y, w, h, FLOOR, FLOOR_D, { opacity: 0.55 });
      /* the trace runs the whole way round, one side at a time */
      var per = 2 * (w + h), run = walk * per, pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
      var used = 0, d = "M" + n2(x) + "," + n2(y);
      for (var k = 1; k < pts.length; k++) {
        var segLen = Math.abs(pts[k][0] - pts[k - 1][0]) + Math.abs(pts[k][1] - pts[k - 1][1]);
        var f = clamp((run - used) / segLen, 0, 1);
        d += "L" + n2(pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f) + "," +
          n2(pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f);
        used += segLen;
        if (run < used) break;
      }
      out += Pth(d, "none", P.blue, 5, { "stroke-linecap": "round", opacity: walk > 0 ? 1 : 0 });
      out += dim(x, y + h + 34, x + w, y + h + 34, "4.2 m", on(t, cue(b0, "sides"), 0.7), P.blue);
      out += dim(x - 34, y, x - 34, y + h, "3.0 m", on(t, cue(b0, "sides"), 0.7), P.blue);
      out += sum(584, 392, "4.2 + 3.0 + 4.2 + 3.0 = 14.4 m", on(t, cue(b0, "add"), 0.8), P.blue);
    } else {
      /* the L-shaped room: the same walk, with two more corners in it */
      var ox = 410, oy = 170;
      var poly = [[ox, oy], [ox + 300, oy], [ox + 300, oy + 100], [ox + 170, oy + 100],
                  [ox + 170, oy + 190], [ox, oy + 190]];
      var dd = "M" + poly[0][0] + "," + poly[0][1];
      for (var j = 1; j < poly.length; j++) dd += "L" + poly[j][0] + "," + poly[j][1];
      dd += "Z";
      out += Pth(dd, FLOOR, FLOOR_D, 2.5, { opacity: 0.55 });
      var lp = on(t, cue(bL, "every"), 1.4);
      out += Pth(dd, "none", P.blue, 5, {
        "stroke-linecap": "round", "stroke-dasharray": 1180,
        "stroke-dashoffset": n2(1180 * (1 - lp))
      });
      out += sum(584, 392, "six sides, and every one of them is measured", on(t, cue(bL, "every"), 0.9), P.blue);
    }
    return svg(out);
  }

  /* ==== scene: area ======================================================== */
  function sceneArea(scene, beat, t, i) {
    var b0 = scene.first, bT = b0 + 1, bC = b0 + 2;
    var out = "";
    if (i === b0) {
      var x = 434, y = 175, w = 300, h = 150;
      out += slab(x, y, w, h, FLOOR, FLOOR_D, { opacity: 0.5 });
      out += squares(x, y, w, h, 6, 3, on(t, cue(b0, "count"), 1.5), P.teal);
      out += dim(x, y + h + 30, x + w, y + h + 30, "6 m", 1, P.teal);
      out += dim(x - 30, y, x - 30, y + h, "3 m", 1, P.teal);
      out += sum(584, 386, "6 × 3 = 18 square metres", on(t, cue(b0, "shortcut"), 0.8), P.teal);
    } else if (i === bT) {
      var tx = 420, ty = 180, tw = 300, th = 160;
      /* the triangle IS half its rectangle, so the rectangle is drawn first */
      var gh = on(t, cue(bT, "half"), 0.9);
      out += R(tx, ty, tw, th, 2, "none", P.muted, 2, { "stroke-dasharray": "6 6", opacity: 0.6 * gh });
      out += Pth("M" + tx + "," + (ty + th) + "L" + (tx + tw) + "," + (ty + th) +
        "L" + tx + "," + ty + "Z", P.teal, P.teal, 2.5, { opacity: 0.34 });
      out += dim(tx, ty + th + 30, tx + tw, ty + th + 30, "base", 1, P.gold);
      out += dim(tx - 30, ty, tx - 30, ty + th, "height", 1, P.gold);
      out += sum(584, 392, "half the base times the height", on(t, cue(bT, "half"), 0.8), P.gold);
    } else {
      var cx = 584, cy = 250, r = 95;
      out += C(cx, cy, r, P.tealSoft, P.teal, 2.5, { opacity: 0.9 });
      var rp = on(t, cue(bC, "radius"), 0.8);
      out += L(cx, cy, cx + r * Math.min(1, rp), cy, P.gold, 3, {});
      out += Tx(cx + r / 2, cy - 12, "r", "lab", "middle", { fill: P.gold, opacity: rp });
      out += C(cx, cy, 4, P.gold, "none", 0, { opacity: rp });
      out += sum(584, 392, "pi × r × r — and the duct is round, so this is the one you need",
        on(t, cue(bC, "pi"), 0.8), P.teal);
    }
    return svg(out);
  }

  /* ==== scene: splitting an awkward shape ================================== */
  function sceneSplit(scene, beat, t, i) {
    var b0 = scene.first, bK = b0 + 1;
    var ox = 400, oy = 165;
    var poly = [[ox, oy], [ox + 320, oy], [ox + 320, oy + 105], [ox + 180, oy + 105],
                [ox + 180, oy + 200], [ox, oy + 200]];
    var d = "M" + poly[0][0] + "," + poly[0][1];
    for (var j = 1; j < poly.length; j++) d += "L" + poly[j][0] + "," + poly[j][1];
    d += "Z";
    var out = Pth(d, FLOOR, FLOOR_D, 2.5, { opacity: 0.5 });
    var cut = on(t, cue(i === b0 ? b0 : bK, i === b0 ? "two" : "adds"), 0.9);
    if (i === b0) {
      out += L(ox + 180, oy, ox + 180, oy + 200, CHALK, 3, {
        "stroke-dasharray": 200, "stroke-dashoffset": n2(200 * (1 - cut)), opacity: 0.95
      });
      out += R(ox, oy, 180, 200, 2, P.gold, "none", 0, { opacity: 0.3 * cut });
      out += R(ox + 180, oy, 140, 105, 2, P.blue, "none", 0, { opacity: 0.3 * cut });
      out += sum(584, 392, "two rectangles, and nothing left over", on(t, cue(b0, "nothing"), 0.8), P.gold);
    } else {
      out += R(ox, oy, 180, 200, 2, P.gold, "none", 0, { opacity: 0.3 });
      out += R(ox + 180, oy, 140, 105, 2, P.blue, "none", 0, { opacity: 0.3 });
      out += Tx(ox + 90, oy + 108, "1.8 × 2.0", "lab", "middle", { fill: P.gold });
      out += Tx(ox + 250, oy + 60, "1.4 × 1.05", "lab", "middle", { fill: P.blue });
      out += sum(584, 392, "3.6 + 1.47 = 5.07 square metres", on(t, cue(bK, "adds"), 0.8), P.teal);
      out += note(584, 418, "add the parts — never measure the longest way across",
        on(t, cue(bK, "never"), 0.8), P.muted);
    }
    return svg(out);
  }

  /* ==== scene: what you do NOT order ======================================= */
  function sceneOpenings(scene, beat, t, i) {
    var b0 = scene.first, bS = b0 + 1;
    var x = 400, y = 150, w = 370, h = 220;
    var out = R(x, y, w, h, 3, WALL, WALL_D, 2.5, {});
    /* courses, so it reads as a wall rather than a rectangle */
    for (var k = 1; k < 6; k++) out += L(x, y + k * (h / 6), x + w, y + k * (h / 6), WALL_D, 1, { opacity: 0.5 });
    var dp = on(t, cue(b0, "door"), 0.7), wp = on(t, cue(b0, "window"), 0.7);
    out += R(x + 40, y + h - 120 * dp, 70, 120 * dp, 2, P.ground, WALL_D, 2, { opacity: dp });
    out += R(x + 210, y + 40, 110 * wp, 80, 2, P.ground, WALL_D, 2, { opacity: wp });
    if (i === bS) {
      var s = on(t, cue(bS, "take"), 0.9);
      out += R(x + 40, y + h - 120, 70, 120, 2, P.accent, "none", 0, { opacity: 0.34 * s });
      out += R(x + 210, y + 40, 110, 80, 2, P.accent, "none", 0, { opacity: 0.34 * s });
      out += sum(584, 400, "8.14 − 0.84 − 0.88 = 6.42 square metres", s, P.accent);
    } else {
      out += sum(584, 400, "a wall is not a rectangle once there is a way through it",
        on(t, cue(b0, "through"), 0.8), P.accent);
    }
    return svg(out);
  }

  /* ==== scene: volume ====================================================== */
  function sceneVolume(scene, beat, t, i) {
    var b0 = scene.first, bC = b0 + 1;
    var out = "";
    if (i === b0) {
      var p = on(t, cue(b0, "deep"), 0.9);
      out += boxIso(430, 190, 260, 140, 110, 1, P.cell, P.line);
      out += dim(430, 348, 690, 348, "2.0 m", 1, P.plum);
      out += dim(400, 190, 400, 330, "1.2 m", 1, P.plum);
      out += dim(700, 330, 760, 285, "0.9 m", p, P.plum, false);
      out += sum(584, 402, "2.0 × 1.2 × 0.9 = 2.16 cubic metres", on(t, cue(b0, "three"), 0.8), P.plum);
    } else {
      /* a cylinder: the round tank, which is the one the trade actually meets */
      var cx = 584, top = 180, hgt = 150, rx = 95, ry = 26;
      out += Pth("M" + (cx - rx) + "," + top + "v" + hgt + "a" + rx + "," + ry + " 0 0 0 " + (2 * rx) + ",0V" + top + "Z",
        P.cell, P.line, 2.5, {});
      out += E(cx, top, rx, ry, P.cell, P.line, 2.5, {});
      var rp = on(t, cue(bC, "circle"), 0.8);
      out += L(cx, top, cx + rx * Math.min(1, rp), top, P.gold, 3, {});
      out += dim(cx + rx + 40, top, cx + rx + 40, top + hgt, "height", on(t, cue(bC, "height"), 0.7), P.plum, false);
      out += sum(584, 400, "the area of the circle, times the height", on(t, cue(bC, "height"), 0.8), P.plum);
    }
    return svg(out);
  }

  /* ==== scene: cubic metres into litres ==================================== */
  function sceneLitres(scene, beat, t, i) {
    var b0 = scene.first;
    var p = on(t, cue(b0, "thousand"), 1.1);
    var out = boxIso(360, 180, 190, 150, 90, 1, P.cell, P.line);
    out += Tx(455, 262, "1 m³", "lab big", "middle", { fill: P.ink });
    /* the same quantity, poured into jerrycans a site would recognise */
    var cans = 10, shown = Math.floor(p * cans + 0.0001);
    for (var k = 0; k < shown; k++) {
      var cxp = 700 + (k % 5) * 58, cyp = 200 + Math.floor(k / 5) * 96;
      out += R(cxp, cyp, 40, 62, 5, WATER, WATER_D, 2, { opacity: 0.95 });
      out += R(cxp + 13, cyp - 10, 14, 12, 2, WATER_D, WATER_D, 1, {});
    }
    out += note(800, 390, "ten of these, ten times over", p > 0.95 ? 1 : 0, P.muted);
    out += sum(584, 418, "one cubic metre is a thousand litres", on(t, cue(b0, "thousand"), 0.8), P.blue);
    return svg(out);
  }

  /* ==== scene: what it weighs ============================================== */
  function sceneDensity(scene, beat, t, i) {
    var b0 = scene.first;
    var out = boxIso(400, 190, 210, 140, 95, 1, WATER, WATER_D);
    var p = on(t, cue(b0, "weighs"), 0.9);
    out += Tx(505, 268, "1 m³ of water", "lab", "middle", { fill: P.ink });
    out += Tx(760, 232, "×", "lab big", "middle", { fill: P.muted, opacity: p });
    out += Tx(880, 210, "1000 kg", "lab big", "middle", { fill: P.good, opacity: p });
    out += Tx(880, 244, "per cubic metre", "lab", "middle", { fill: P.muted, opacity: p });
    out += sum(584, 392, "a tonne — and the floor under it has to carry that",
      on(t, cue(b0, "carry"), 0.8), P.good);
    return svg(out);
  }

  /* ==== scene: recap ======================================================= */
  function sceneRecap(scene, beat, t, i) {
    var b0 = scene.first;
    /* The right-hand column is a FORMULA, not a sentence. Written out in
       words it ran back into its own label and the two overlapped - caught
       on a preview still, which is the only thing that can see it: the
       sweep checks the box and the throws, and both were clean. */
    var rows = [
      ["round the edge", "add every side", P.blue],
      ["the surface", "l × w   ·   ½ b × h   ·   π r²", P.teal],
      ["what it holds", "end area × length", P.plum]
    ];
    var out = "";
    for (var k = 0; k < rows.length; k++) {
      var p = on(t, cue(b0, ["edge", "surface", "holds"][k]), 0.6);
      if (!(p > 0)) continue;
      var yy = 165 + k * 78;
      out += R(270, yy, 630, 58, 10, P.cell, rows[k][2], 2, { opacity: 0.9 * p });
      out += Tx(295, yy + 36, rows[k][0], "lab", "start", { fill: rows[k][2], opacity: p });
      out += Tx(875, yy + 36, rows[k][1], "lab big", "end", { fill: P.ink, opacity: p });
    }
    out += sum(584, 412, "measure it, work it out, then order it",
      on(t, cue(b0, "order"), 0.8), P.teal);
    return svg(out);
  }

  var KINDS = {
    title: sceneTitle, perimeter: scenePerimeter, area: sceneArea,
    split: sceneSplit, openings: sceneOpenings, volume: sceneVolume,
    litres: sceneLitres, density: sceneDensity, recap: sceneRecap
  };
