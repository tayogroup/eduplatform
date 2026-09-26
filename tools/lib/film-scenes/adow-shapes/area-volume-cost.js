  /* ==== Professor Adow TVET — Area, Volume and What They Cost ==============
     The pictures of the area/volume film, between the shared engine's head
     and tail (tools/lib/ehel-film-engine-head.js explains the assembly).

     REWRITTEN FOR MOVEMENT. The first cut of this film had ZERO lerps — every
     "animation" was a fade, so a learner saw finished answers appear beside a
     static drawing. Measured against the halving-joint film (16) and the
     tiling film (14) it was the outlier, and the owner's standard is that for
     a learner at grade 8 to 12 the MOVEMENT is the teaching.

     WHAT MOVES HERE IS THE MEASURING, because that is the skill. A tape
     unrolls along the side before a figure appears. The squares that MEAN
     area are laid one at a time in reading order. The triangle is cut out of
     its rectangle by a blade travelling corner to corner. The circle's area is
     SWEPT by its own radius. The trench fills layer by layer. The cans fill
     from a pour. Nothing arrives already finished.

     THE ANIMATION IS CUED OFF THE WORDS: cue(beat, name) is the measured
     moment a phrase is spoken, so the squares start landing as the narrator
     says "how many one-metre squares". */

  /* ---- the materials palette --------------------------------------------- */
  var FLOOR = "#C98A4B", FLOOR_D = "#A96E35";
  var WALL = "#93A7B5", WALL_D = "#6C8291";
  var WATER = "#4FA3D1", WATER_D = "#2E7BA6";
  var STEEL = "#B9C6D0", STEEL_D = "#7E8E9B";
  var CHALK = "#F7F4EC", TAPEC = "#F0E4B0";

  var HUE = {
    title: P.teal, perimeter: P.blue, area: P.teal, split: P.gold,
    openings: P.accent, volume: P.plum, litres: P.blue, density: P.good,
    recap: P.teal
  };

  /* ---- time -------------------------------------------------------------- */
  function beatU(t, i) {
    var b = BEATS[i], end = spokenEnd(i);
    return clamp((t - b.start) / Math.max(0.2, end - b.start), 0, 1);
  }
  function loop(t, at, period) {
    if (at == null || t < at) return 0;
    return ((t - at) % period) / period;
  }

  /* ---- small parts -------------------------------------------------------- */

  /* A dimension line that EXTENDS rather than appearing: the arrow travels to
     the far witness line and the figure lands when it arrives. */
  function dim(x1, y1, x2, y2, label, p, col, below) {
    if (!(p > 0)) return "";
    col = col || P.teal;
    var u = clamp(p, 0, 1);
    var horiz = Math.abs(y2 - y1) > Math.abs(x2 - x1) ? false : true;
    var ux = x1 + (x2 - x1) * u, uy = y1 + (y2 - y1) * u;
    var a = 7;
    var out = L(x1, y1, ux, uy, col, 2, {});
    out += Pth("M" + n2(x1) + "," + n2(y1) + (horiz
      ? "l" + a + ",-" + a + "v" + (2 * a) + "z" : "l-" + a + "," + a + "h" + (2 * a) + "z"), col, "none", 0, {});
    if (u > 0.95) {
      out += Pth("M" + n2(x2) + "," + n2(y2) + (horiz
        ? "l-" + a + ",-" + a + "v" + (2 * a) + "z" : "l-" + a + ",-" + a + "h" + (2 * a) + "z"), col, "none", 0, {});
    }
    if (label && u > 0.55) {
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      var o = below ? 22 : -12;
      out += Tx(horiz ? mx : mx + (below ? 34 : -34), horiz ? my + o : my + 5, label, "lab", "middle",
        { fill: col, opacity: Math.min(1, (u - 0.55) / 0.35) });
    }
    return out;
  }

  /* A steel tape UNROLLING along a line — the thing a learner actually does
     before any figure exists. */
  function tape(x1, y1, x2, y2, p) {
    if (!(p > 0)) return "";
    var u = clamp(p, 0, 1);
    var ux = x1 + (x2 - x1) * u, uy = y1 + (y2 - y1) * u;
    var ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    var len = Math.sqrt((ux - x1) * (ux - x1) + (uy - y1) * (uy - y1));
    var ticks = "";
    for (var k = 10; k < len; k += 18) {
      ticks += L(k, -7, k, (k % 90 < 18) ? 8 : 2, "#33414C", 1.2, {});
    }
    return G(R(0, -8, len, 16, 1, TAPEC, STEEL_D, 1.5, {}) + ticks,
      { transform: "translate(" + n2(x1) + "," + n2(y1) + ") rotate(" + n3(ang) + ")" }) +
      R(ux - 5, uy - 13, 10, 26, 2, "#C9433A", "#8E2E28", 1.5, {});
  }

  /* The squares that MEAN area, laid one at a time in reading order. */
  function squares(x, y, w, h, cols, rows, p, col) {
    if (!(p > 0)) return "";
    var cw = w / cols, ch = h / rows, n = cols * rows, out = "";
    for (var k = 0; k < n; k++) {
      var f = clamp(p * n - k, 0, 1);
      if (f <= 0) continue;
      var c = k % cols, r = Math.floor(k / cols);
      /* each one drops the last few pixels into place */
      out += R(x + c * cw + 1.5, y + r * ch + 1.5 - (1 - f) * 10, cw - 3, ch - 3, 2,
        col || P.teal, "none", 0, { opacity: 0.42 * f });
    }
    return out;
  }

  function slab(x, y, w, h, col, dark, o) {
    o = o || {};
    return R(x, y, w, h, 3, col, dark, 2.5, { opacity: o.opacity == null ? 1 : o.opacity });
  }

  function sum(x, y, text, p, col) {
    if (!(p > 0)) return "";
    return Tx(x, y, text, "lab big", "middle", { fill: col || P.ink, opacity: Math.min(1, p),
      transform: "translate(0," + n2((1 - Math.min(1, p)) * 8) + ")" });
  }
  function note(x, y, text, p, col) {
    if (!(p > 0)) return "";
    return Tx(x, y, text, "lab", "middle", { fill: col || P.muted, opacity: Math.min(1, p) });
  }

  /* A box in flat isometric. `fill` 0..1 fills it layer by layer. */
  function boxIso(x, y, w, h, d, fill, col, dark, p) {
    p = p == null ? 1 : p;
    var dx = d * 0.55, dy = -d * 0.42, out = "";
    out += Pth("M" + n2(x) + "," + n2(y) + "h" + n2(w) + "l" + n2(dx) + "," + n2(dy) +
      "h" + n2(-w) + "z", dark, dark, 1.5, { opacity: 0.85 * p });
    out += Pth("M" + n2(x + w) + "," + n2(y) + "v" + n2(h) + "l" + n2(dx) + "," + n2(dy) +
      "v" + n2(-h) + "z", dark, dark, 1.5, { opacity: 0.6 * p });
    out += R(x, y, w, h, 2, col, dark, 2.5, { opacity: p });
    if (fill > 0) {
      var fh = h * clamp(fill, 0, 1);
      out += R(x + 2, y + h - fh, w - 4, fh, 0, WATER, "none", 0, { opacity: 0.85 });
    }
    return out;
  }

  /* A pouring stream, for filling things. */
  function pour(x, y1, y2, p) {
    if (!(p > 0) || p >= 1) return "";
    return L(x, y1, x, y2, WATER, 7, { opacity: 0.8, "stroke-linecap": "round" });
  }

  /* ==== scenes ============================================================ */

  /* Title: the tape runs the length first, then the squares are laid. */
  function sceneTitle(scene, beat, t) {
    var one = scene.first;
    var a = inAt(t, BEATS[one].start, 1.0);
    var cover = on(t, cue(one, "cover"), 1.6);
    var pay = on(t, cue(one, "pay"), 0.8);
    var x = 434, y = 190, w = 300, h = 150;
    var out = slab(x, y, w, h, FLOOR, FLOOR_D, {});
    out += tape(x, y + h + 22, x + w, y + h + 22, clamp(cover * 2, 0, 1));
    out += squares(x, y, w, h, 6, 3, clamp(cover * 1.6 - 0.6, 0, 1), P.teal);
    out += sum(584, 400, "every one of these is bought and paid for", pay, P.teal);
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

  /* Perimeter: a measuring wheel ROLLS the edge and the trace follows it. */
  function scenePerimeter(scene, beat, t, i) {
    var b0 = scene.first, bL = b0 + 1;
    var out = "";
    if (i === b0) {
      var x = 400, y = 180, w = 360, h = 170;
      var walk = on(t, cue(b0, "round"), 2.4);
      out += slab(x, y, w, h, FLOOR, FLOOR_D, { opacity: 0.55 });
      var pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
      var per = 2 * (w + h), run = walk * per, used = 0;
      var d = "M" + n2(x) + "," + n2(y), px = x, py = y;
      for (var k = 1; k < pts.length; k++) {
        var seg = Math.abs(pts[k][0] - pts[k - 1][0]) + Math.abs(pts[k][1] - pts[k - 1][1]);
        var f = clamp((run - used) / seg, 0, 1);
        px = pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f;
        py = pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f;
        d += "L" + n2(px) + "," + n2(py);
        used += seg;
        if (run < used) break;
      }
      if (walk > 0) out += Pth(d, "none", P.blue, 5, { "stroke-linecap": "round" });
      /* the wheel itself, rolling: spokes turn with distance travelled */
      if (walk > 0 && walk < 1) {
        out += C(px, py, 16, "none", P.blue, 3, {});
        for (var s = 0; s < 4; s++) {
          var a2 = (run / 16) + s * Math.PI / 2;
          out += L(px, py, px + Math.cos(a2) * 16, py + Math.sin(a2) * 16, P.blue, 2, {});
        }
      }
      out += dim(x, y + h + 40, x + w, y + h + 40, "4.2 m", on(t, cue(b0, "sides"), 1.0), P.blue, true);
      out += dim(x - 40, y, x - 40, y + h, "3.0 m", on(t, cue(b0, "sides"), 1.0), P.blue);
      out += sum(584, 400, "4.2 + 3.0 + 4.2 + 3.0 = 14.4 m", on(t, cue(b0, "add"), 0.8), P.blue);
    } else {
      var ox = 410, oy = 170;
      var poly = [[ox, oy], [ox + 300, oy], [ox + 300, oy + 100], [ox + 170, oy + 100],
                  [ox + 170, oy + 190], [ox, oy + 190]];
      var dd = "M" + poly[0][0] + "," + poly[0][1];
      for (var j = 1; j < poly.length; j++) dd += "L" + poly[j][0] + "," + poly[j][1];
      dd += "Z";
      out += Pth(dd, FLOOR, FLOOR_D, 2.5, { opacity: 0.55 });
      var lp = on(t, cue(bL, "every"), 2.2);
      out += Pth(dd, "none", P.blue, 5, {
        "stroke-linecap": "round", "stroke-dasharray": 1180,
        "stroke-dashoffset": n2(1180 * (1 - lp))
      });
      /* a tick lands on each side as the trace passes its corner */
      for (var c2 = 0; c2 < 6; c2++) {
        var f2 = clamp(lp * 6 - c2, 0, 1);
        if (f2 <= 0) continue;
        var a3 = poly[c2], b3 = poly[(c2 + 1) % 6];
        out += C((a3[0] + b3[0]) / 2, (a3[1] + b3[1]) / 2, 8 * f2, P.gold, "none", 0, { opacity: 0.9 * f2 });
      }
      out += sum(584, 400, "six sides, and every one of them is measured", lp, P.blue);
    }
    return svg(out);
  }

  /* Area: the tape runs both sides, the squares land, the triangle is CUT out
     of its rectangle, and the circle's area is swept by its own radius. */
  function sceneArea(scene, beat, t, i) {
    var b0 = scene.first, bT = b0 + 1, bC = b0 + 2;
    var out = "";
    if (i === b0) {
      var x = 434, y = 175, w = 300, h = 150;
      var u = beatU(t, b0);
      out += slab(x, y, w, h, FLOOR, FLOOR_D, { opacity: 0.5 });
      out += tape(x, y + h + 20, x + w, y + h + 20, clamp(u * 3, 0, 1));
      out += tape(x - 20, y + h, x - 20, y, clamp(u * 3 - 1, 0, 1));
      out += squares(x, y, w, h, 6, 3, on(t, cue(b0, "count"), 2.2), P.teal);
      /* No dimension line under the base: the TAPE is already lying there and
         saying it, and a second line put "6 m" on top of the sum caption. */
      out += note(x + w / 2, y + h + 44, "6 m", clamp(u * 3, 0, 1), P.teal);
      out += note(x - 44, y + h / 2, "3 m", clamp(u * 3 - 1, 0, 1), P.teal);
      out += sum(584, 400, "6 × 3 = 18 square metres", on(t, cue(b0, "shortcut"), 0.8), P.teal);
    } else if (i === bT) {
      var tx = 420, ty = 180, tw = 300, th = 160;
      var cut = on(t, cue(bT, "half"), 1.8);
      out += R(tx, ty, tw, th, 2, "none", P.muted, 2, { "stroke-dasharray": "6 6", opacity: 0.6 });
      /* the blade travels the diagonal and the upper half lifts away */
      out += Pth("M" + tx + "," + (ty + th) + "L" + (tx + tw) + "," + (ty + th) +
        "L" + tx + "," + ty + "Z", P.teal, P.teal, 2.5, { opacity: 0.34 });
      if (cut > 0) {
        var bx = lerp(tx + tw, tx, ease(cut)), by = lerp(ty + th, ty, ease(cut));
        out += L(tx + tw, ty + th, bx, by, CHALK, 3, {});
        out += C(bx, by, 6, P.gold, "none", 0, {});
        out += G(Pth("M" + tx + "," + ty + "L" + (tx + tw) + "," + (ty + th) + "L" + (tx + tw) + "," + ty + "Z",
          P.muted, "none", 0, { opacity: 0.25 * (1 - cut) }),
          { transform: "translate(" + n2(cut * 46) + "," + n2(-cut * 34) + ")" });
      }
      /* label ABOVE its line: below the line it landed on the caption */
      out += dim(tx, ty + th + 30, tx + tw, ty + th + 30, "base", 1, P.gold, false);
      out += dim(tx - 30, ty, tx - 30, ty + th, "height", 1, P.gold);
      out += sum(584, 400, "half the base times the height", cut, P.gold);
    } else {
      var cx = 584, cy = 250, r = 95;
      var swp = on(t, cue(bC, "pi"), 2.0);
      out += C(cx, cy, r, "none", P.teal, 2.5, {});
      /* the radius sweeps the area out, a wedge at a time */
      if (swp > 0) {
        var ang = swp * 2 * Math.PI;
        var ex = cx + r * Math.cos(ang - Math.PI / 2), ey = cy + r * Math.sin(ang - Math.PI / 2);
        var large = swp > 0.5 ? 1 : 0;
        out += Pth("M" + cx + "," + cy + "L" + cx + "," + (cy - r) +
          "A" + r + "," + r + " 0 " + large + " 1 " + n2(ex) + "," + n2(ey) + "Z",
          P.tealSoft, "none", 0, { opacity: 0.9 });
        out += L(cx, cy, ex, ey, P.gold, 3, {});
      }
      var rp = on(t, cue(bC, "radius"), 0.8);
      out += L(cx, cy, cx + r * Math.min(1, rp), cy, P.gold, 3, { opacity: swp > 0 ? 0.35 : 1 });
      out += Tx(cx + r / 2, cy - 12, "r", "lab", "middle", { fill: P.gold, opacity: rp });
      out += C(cx, cy, 4, P.gold, "none", 0, { opacity: rp });
      out += sum(584, 400, "pi × r × r — and the duct is round, so this is the one you need", swp, P.teal);
    }
    return svg(out);
  }

  /* Splitting: the chalk line is drawn, then each rectangle lights in turn. */
  function sceneSplit(scene, beat, t, i) {
    var b0 = scene.first, bK = b0 + 1;
    var ox = 400, oy = 165;
    var poly = [[ox, oy], [ox + 320, oy], [ox + 320, oy + 105], [ox + 180, oy + 105],
                [ox + 180, oy + 200], [ox, oy + 200]];
    var d = "M" + poly[0][0] + "," + poly[0][1];
    for (var j = 1; j < poly.length; j++) d += "L" + poly[j][0] + "," + poly[j][1];
    d += "Z";
    var out = Pth(d, FLOOR, FLOOR_D, 2.5, { opacity: 0.5 });
    if (i === b0) {
      var cut = on(t, cue(b0, "two"), 1.4);
      out += L(ox + 180, oy, ox + 180, oy + 200 * clamp(cut, 0, 1), CHALK, 3, { opacity: 0.95 });
      if (cut > 0 && cut < 1) out += C(ox + 180, oy + 200 * cut, 6, CHALK, "none", 0, {});
      var lit = on(t, cue(b0, "nothing"), 1.4);
      out += R(ox, oy, 180, 200, 2, P.gold, "none", 0, { opacity: 0.3 * clamp(lit * 2, 0, 1) });
      out += R(ox + 180, oy, 140, 105, 2, P.blue, "none", 0, { opacity: 0.3 * clamp(lit * 2 - 1, 0, 1) });
      out += sum(584, 400, "two rectangles, and nothing left over", lit, P.gold);
    } else {
      var add = on(t, cue(bK, "adds"), 1.6);
      out += R(ox, oy, 180, 200, 2, P.gold, "none", 0, { opacity: 0.3 });
      out += R(ox + 180, oy, 140, 105, 2, P.blue, "none", 0, { opacity: 0.3 });
      out += Tx(ox + 90, oy + 108, "1.8 × 2.0", "lab", "middle", { fill: P.gold });
      out += Tx(ox + 250, oy + 60, "1.4 × 1.05", "lab", "middle", { fill: P.blue });
      /* the two areas travel to the sum */
      if (add > 0) {
        out += Tx(lerp(ox + 90, 500, ease(add)), lerp(oy + 130, 400, ease(add)), "3.6",
          "lab big", "middle", { fill: P.gold });
        out += Tx(lerp(ox + 250, 620, ease(add)), lerp(oy + 82, 400, ease(add)), "1.47",
          "lab big", "middle", { fill: P.blue });
      }
      if (add > 0.92) out += sum(584, 400, "= 5.07 square metres", (add - 0.92) / 0.08, P.teal);
      out += note(584, 424, "add the parts — never measure the longest way across",
        on(t, cue(bK, "never"), 0.8), P.muted);
    }
    return svg(out);
  }

  /* Openings: a cutter travels and the opening appears behind it; then the
     figure counts DOWN as each opening is taken off. */
  function sceneOpenings(scene, beat, t, i) {
    var b0 = scene.first, bS = b0 + 1;
    var x = 400, y = 150, w = 370, h = 220;
    var out = R(x, y, w, h, 3, WALL, WALL_D, 2.5, {});
    for (var k = 1; k < 6; k++) out += L(x, y + k * (h / 6), x + w, y + k * (h / 6), WALL_D, 1, { opacity: 0.5 });
    var dp = on(t, cue(b0, "door"), 1.1), wp = on(t, cue(b0, "window"), 1.1);
    if (dp > 0) {
      out += R(x + 40, y + h - 120 * dp, 70, 120 * dp, 2, P.ground, WALL_D, 2, {});
      if (dp < 1) out += C(x + 75, y + h - 120 * dp, 7, P.accent, "none", 0, {});
    }
    if (wp > 0) {
      out += R(x + 210, y + 40, 110 * wp, 80, 2, P.ground, WALL_D, 2, {});
      if (wp < 1) out += C(x + 210 + 110 * wp, y + 80, 7, P.accent, "none", 0, {});
    }
    if (i === bS) {
      var s = on(t, cue(bS, "take"), 1.6);
      out += R(x + 40, y + h - 120, 70, 120, 2, P.accent, "none", 0, { opacity: 0.34 * clamp(s * 2, 0, 1) });
      out += R(x + 210, y + 40, 110, 80, 2, P.accent, "none", 0, { opacity: 0.34 * clamp(s * 2 - 1, 0, 1) });
      /* the running total comes down as each opening is taken off */
      var total = 8.14 - 0.84 * clamp(s * 2, 0, 1) - 0.88 * clamp(s * 2 - 1, 0, 1);
      out += sum(584, 400, total.toFixed(2) + " square metres", s > 0 ? 1 : 0,
        s > 0.96 ? P.good : P.accent);
    } else {
      out += sum(584, 400, "a wall is not a rectangle once there is a way through it",
        on(t, cue(b0, "through"), 0.8), P.accent);
    }
    return svg(out);
  }

  /* Volume: the trench fills layer by layer; the cylinder extrudes upward. */
  function sceneVolume(scene, beat, t, i) {
    var b0 = scene.first, bC = b0 + 1;
    var out = "";
    if (i === b0) {
      var u = beatU(t, b0);
      var deep = on(t, cue(b0, "deep"), 1.0);
      var three = on(t, cue(b0, "three"), 1.8);
      out += boxIso(430, 190, 260, 140, 110, three, P.cell, P.line, 1);
      out += dim(430, 348, 690, 348, "2.0 m", clamp(u * 4, 0, 1), P.plum, true);
      out += dim(400, 190, 400, 330, "1.2 m", clamp(u * 4 - 1, 0, 1), P.plum);
      out += dim(700, 330, 760, 285, "0.9 m", deep, P.plum, false);
      if (three > 0) out += pour(560, 120, 190, three);
      out += sum(584, 412, "2.0 × 1.2 × 0.9 = 2.16 cubic metres", three, P.plum);
    } else {
      var cx = 584, top = 180, hgt = 150, rx = 95, ry = 26;
      var ext = on(t, cue(bC, "height"), 1.8);
      var hh = hgt * clamp(ext, 0.02, 1);
      out += Pth("M" + (cx - rx) + "," + top + "v" + n2(hh) + "a" + rx + "," + ry + " 0 0 0 " + (2 * rx) + ",0V" + top + "Z",
        P.cell, P.line, 2.5, {});
      out += E(cx, top, rx, ry, P.cell, P.line, 2.5, {});
      var rp = on(t, cue(bC, "circle"), 1.2);
      if (rp > 0) {
        out += Pth("M" + cx + "," + top + "L" + cx + "," + (top - ry) +
          "A" + rx + "," + ry + " 0 " + (rp > 0.5 ? 1 : 0) + " 1 " +
          n2(cx + rx * Math.sin(rp * 2 * Math.PI)) + "," + n2(top - ry * Math.cos(rp * 2 * Math.PI)) + "Z",
          P.tealSoft, "none", 0, { opacity: 0.85 });
        out += L(cx, top, cx + rx * Math.sin(rp * 2 * Math.PI), top - ry * Math.cos(rp * 2 * Math.PI), P.gold, 3, {});
      }
      out += dim(cx + rx + 40, top, cx + rx + 40, top + hh, "height", ext, P.plum, false);
      out += sum(584, 400, "the area of the circle, times the height", ext, P.plum);
    }
    return svg(out);
  }

  /* Litres: the cans FILL from a pour, one after another. */
  function sceneLitres(scene, beat, t, i) {
    var b0 = scene.first;
    var p = on(t, cue(b0, "thousand"), 2.4);
    var out = boxIso(360, 180, 190, 150, 90, 1 - p, P.cell, P.line, 1);
    out += Tx(455, 262, "1 m³", "lab big", "middle", { fill: P.ink });
    var cans = 10;
    for (var k = 0; k < cans; k++) {
      var f = clamp(p * cans - k, 0, 1);
      if (f <= 0) continue;
      var cxp = 700 + (k % 5) * 58, cyp = 200 + Math.floor(k / 5) * 96;
      out += R(cxp, cyp, 40, 62, 5, P.cell, WATER_D, 2, {});
      out += R(cxp + 2, cyp + 62 - 58 * f, 36, 58 * f, 3, WATER, "none", 0, {});
      out += R(cxp + 13, cyp - 10, 14, 12, 2, WATER_D, WATER_D, 1, {});
      if (f > 0 && f < 1) out += pour(cxp + 20, 150, cyp, f);
    }
    out += note(800, 386, "ten of these, ten times over", p > 0.95 ? 1 : 0, P.muted);
    out += sum(584, 414, "one cubic metre is a thousand litres", p, P.blue);
    return svg(out);
  }

  /* Density: a balance that actually TIPS as the tonne goes on. */
  function sceneDensity(scene, beat, t, i) {
    var b0 = scene.first;
    var w = on(t, cue(b0, "weighs"), 1.6);
    var carry = on(t, cue(b0, "carry"), 1.0);
    var tilt = 12 * ease(clamp(w, 0, 1));
    var out = L(584, 150, 584, 330, STEEL_D, 6, {});
    out += G(L(-180, 0, 180, 0, STEEL, 7, {}) +
      G(boxIso(-70, -76, 100, 64, 44, 1, WATER, WATER_D, 1), { transform: "translate(-110,0)" }) +
      Tx(-110, 34, "1 m³ of water", "lab", "middle", { fill: P.muted }) +
      (w > 0.25 ? R(130, -54, 96, 54, 6, P.cell, P.good, 2, { opacity: clamp(w * 1.4 - 0.35, 0, 1) }) : "") +
      (w > 0.25 ? Tx(178, -20, "1000 kg", "lab big", "middle", { fill: P.good, opacity: clamp(w * 1.4 - 0.35, 0, 1) }) : ""),
      { transform: "translate(584,150) rotate(" + n3(tilt) + ")" });
    out += Pth("M544,330 h80 l-40,-38 z", STEEL_D, "none", 0, {});
    if (carry > 0) {
      out += R(430, 346, 308, 12, 2, P.accent, "none", 0, { opacity: 0.55 * carry });
      /* the bar is the floor; the caption below already says "a tonne", so this
         labels the thing rather than repeating the figure */
      out += note(584, 386, "the floor, the joists, the shelf", carry, P.accent);
    }
    out += sum(584, 414, "a tonne — and the floor under it has to carry that", carry, P.good);
    return svg(out);
  }

  function sceneRecap(scene, beat, t, i) {
    var b0 = scene.first;
    var rows = [
      ["round the edge", "add every side", P.blue, "edge"],
      ["the surface", "l × w   ·   ½ b × h   ·   π r²", P.teal, "surface"],
      ["what it holds", "end area × length", P.plum, "holds"]
    ];
    var out = "";
    for (var k = 0; k < rows.length; k++) {
      var p = on(t, cue(b0, rows[k][3]), 0.6);
      if (!(p > 0)) continue;
      var yy = 150 + k * 78;
      out += G(R(270, yy, 630, 58, 10, P.cell, rows[k][2], 2, { opacity: 0.9 * p }) +
        Tx(295, yy + 36, rows[k][0], "lab", "start", { fill: rows[k][2], opacity: p }) +
        Tx(875, yy + 36, rows[k][1], "lab big", "end", { fill: P.ink, opacity: p }),
        { transform: "translate(" + n2((1 - Math.min(1, p)) * -60) + ",0)" });
    }
    out += sum(584, 416, "measure it, work it out, then order it",
      on(t, cue(b0, "order"), 0.8), P.teal);
    return svg(out);
  }

  var KINDS = {
    title: sceneTitle, perimeter: scenePerimeter, area: sceneArea,
    split: sceneSplit, openings: sceneOpenings, volume: sceneVolume,
    litres: sceneLitres, density: sceneDensity, recap: sceneRecap
  };
