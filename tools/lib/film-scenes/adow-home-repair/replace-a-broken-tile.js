  /* ==== Professor Adow TVET — Replace a Broken Tile ========================
     The pictures of the tiling film, between the shared engine's head and
     tail (tools/lib/ehel-film-engine-head.js explains the assembly).

     EVERY TOOL WORKS. The first cut of this film faded things in and out and
     nothing ever travelled: measured against the halving-joint film it had
     16 fewer lerps — none at all — and a learner saw a static chisel beside a
     shape that changed by itself. For a learner at grade 8 to 12 who has
     never done this, the MOVEMENT is the teaching: which way the rake runs,
     how far the drill goes in, that the chisel is struck rather than pushed,
     that the spreader travels across the back of the tile. So every scene
     here has a tool that moves, and something that comes off the work when
     it does — dust, crumbs, shavings, fragments.

     EVERY FRAME SHOWS THE NEIGHBOURS. The broken tile is never drawn alone,
     because it is never alone on a wall and because the sound tiles around
     it ARE the difficulty of the job.

     THE JOINTS ARE GAPS, NOT LINES: the wall is a bed with tiles laid on it,
     so a raked joint is an empty channel and a grouted one is the bed covered
     over, with no redrawing.

     THE ANIMATION IS CUED OFF THE WORDS. cue(beat, name) is the measured
     moment a phrase is spoken, so the chisel bites as the narrator says
     "starts in the middle". Motion that has no phrase of its own is timed
     from the beat itself with beatU(). */

  /* ---- the materials --------------------------------------------------- */
  var TILE = "#DCE6EA", TILE_D = "#A8BCC6", TILE_NEW = "#EEF6F9";
  var GROUT = "#8C9AA3", BED = "#6E5B4A", BED_D = "#54453A";
  var STEEL = "#B9C6D0", STEEL_D = "#7E8E9B", HANDLE = "#7A4A22", HANDLE_D = "#5E3A1B";
  var TAPE = "#E8D9A0", ADH = "#CFCAC0", SKIN = "#C98A5B", SKIN_D = "#96683F";

  var HUE = {
    title: P.teal, ppe: P.accent, mask: P.gold, rake: P.blue,
    chip: P.accent, bed: P.plum, fit: P.gold, set: P.good,
    grout: P.teal, recap: P.teal
  };

  /* ---- time ------------------------------------------------------------- */

  /* 0..1 across the SPOKEN part of beat i, for motion that belongs to the
     whole sentence rather than to one phrase in it. */
  function beatU(t, i) {
    var b = BEATS[i], end = spokenEnd(i);
    return clamp((t - b.start) / Math.max(0.2, end - b.start), 0, 1);
  }

  /* A tool being struck: travels back, lands, recoils. Returns how far it is
     drawn back (0 at the work, 1 at the top of the swing), which blow number
     this is, and a short spike at the moment of contact for the debris. */
  function strike(t, at, period) {
    if (at == null || t < at) return { back: 1, blow: -1, hit: 0 };
    var e = t - at, ph = (e % period) / period;
    var back = ph < 0.55 ? 1 - ease(ph / 0.55) : ease((ph - 0.55) / 0.45);
    return { back: back, blow: Math.floor(e / period), hit: ph > 0.5 && ph < 0.66 ? 1 - (ph - 0.5) / 0.16 : 0 };
  }

  /* ---- debris ----------------------------------------------------------- */
  function dust(cx, cy, amount, col) {
    if (!(amount > 0)) return "";
    var out = "";
    for (var k = 0; k < 7; k++) {
      var a = (k / 7) * Math.PI * 2, r = 9 + amount * 26;
      out += C(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6 - amount * 9,
        2.4 + (k % 2), col || BED_D, "none", 0, { opacity: 0.6 * (1 - amount) });
    }
    return out;
  }

  function crumbs(x, y, p, n, col) {
    if (!(p > 0)) return "";
    var out = "";
    for (var k = 0; k < (n || 5); k++) {
      var u = clamp(p * 1.5 - k * 0.12, 0, 1);
      if (u <= 0) continue;
      out += R(x + k * 9 - 12, y + u * u * 58, 4, 3.5, 1, col || GROUT, "none", 0,
        { opacity: 0.85 * (1 - u * 0.8) });
    }
    return out;
  }

  function shaving(x, y, p, col) {
    if (!(p > 0) || p > 1) return "";
    var r = 7 + p * 5;
    return Pth("M" + n2(x) + "," + n2(y) + "q" + n2(r) + ",-" + n2(r) + " " + n2(2 * r) + ",0",
      "none", col || ADH, 3, { opacity: 0.9 * (1 - p) });
  }

  /* ---- the wall --------------------------------------------------------- */
  var TW = 116, TH = 92, J = 9;
  var WX = 380, WY = 96;
  var TARGET = 5;

  function tileXY(i) {
    var c = i % 4, r = Math.floor(i / 4);
    return [WX + c * (TW + J), WY + r * (TH + J)];
  }

  function crack(x, y, p) {
    p = p == null ? 1 : clamp(p, 0, 1);
    var d1 = "M" + (x + 14) + "," + (y + 70) + "L" + (x + 44) + "," + (y + 36) +
      "L" + (x + 37) + "," + (y + 52) + "L" + (x + 74) + "," + (y + 18);
    var d2 = "M" + (x + 44) + "," + (y + 36) + "L" + (x + 86) + "," + (y + 62) +
      "L" + (x + 108) + "," + (y + 30);
    /* the crack DRAWS ON rather than appearing: a learner sees it travel */
    return Pth(d1, "none", P.bad, 3, { "stroke-dasharray": 150, "stroke-dashoffset": n2(150 * (1 - p)) }) +
      Pth(d2, "none", P.bad, 2.5, { "stroke-dasharray": 110, "stroke-dashoffset": n2(110 * (1 - Math.max(0, p * 1.6 - 0.6))) });
  }

  /* o: { broken, crackP, missing, lumpy, newTile, rakedP, holes, tapeP, hole, lift } */
  function wall(o) {
    o = o || {};
    var out = R(WX - J, WY - J, 4 * TW + 5 * J, 3 * TH + 4 * J, 4, GROUT, GROUT, 2, {});
    if (o.rakedP > 0) {
      var t0 = tileXY(TARGET), rx = t0[0], ry = t0[1], p = clamp(o.rakedP, 0, 1);
      /* the four joints empty in sequence, a quarter of the progress each */
      var seg = [0, 0.25, 0.5, 0.75].map(function (s) { return clamp((p - s) * 4, 0, 1); });
      out += R(rx - J, ry - J, (TW + 2 * J) * seg[0], J, 0, BED, BED_D, 1, {});
      out += R(rx + TW, ry - J, J, (TH + 2 * J) * seg[1], 0, BED, BED_D, 1, {});
      out += R(rx - J + (TW + 2 * J) * (1 - seg[2]), ry + TH, (TW + 2 * J) * seg[2], J, 0, BED, BED_D, 1, {});
      out += R(rx - J, ry - J + (TH + 2 * J) * (1 - seg[3]), J, (TH + 2 * J) * seg[3], 0, BED, BED_D, 1, {});
    }
    for (var i = 0; i < 12; i++) {
      var xy = tileXY(i), x = xy[0], y = xy[1];
      if (i === TARGET && o.missing) {
        out += R(x, y, TW, TH, 2, BED, BED_D, 2, {});
        if (o.lumpy > 0) {
          for (var k = 0; k < 4; k++) {
            var gone = clamp((o.sweep || 0) * 4 - k, 0, 1);
            if (gone >= 1) continue;
            out += E(x + 24 + k * 24, y + 28 + (k % 2) * 34, 15, 9, ADH, BED_D, 1,
              { opacity: clamp(o.lumpy, 0, 1) * (1 - gone) });
          }
        }
        continue;
      }
      if (i === TARGET && o.hole > 0) {
        var h = clamp(o.hole, 0, 1);
        out += R(x, y, TW, TH, 2, TILE, TILE_D, 2, {});
        out += R(x + TW / 2 - (TW / 2) * h, y + TH / 2 - (TH / 2) * h, TW * h, TH * h, 2, BED, BED_D, 1.5, {});
        continue;
      }
      out += R(x, y, TW, TH, 2, i === TARGET && o.newTile ? TILE_NEW : TILE, TILE_D, 2, {});
      if (i === TARGET && (o.broken || o.crackP > 0)) out += crack(x, y, o.crackP == null ? 1 : o.crackP);
    }
    if (o.tapeP > 0) out += tape(o.tapeP, o.lift);
    if (o.holes > 0) out += holes(o.holes);
    return out;
  }

  function tape(p, lift) {
    var xy = tileXY(TARGET), x = xy[0], y = xy[1], u = clamp(p, 0, 1);
    var out = "";
    var legs = [[x + 6, y + 6, x + TW - 6, y + TH - 6], [x + TW - 6, y + 6, x + 6, y + TH - 6]];
    for (var k = 0; k < 2; k++) {
      var g4 = legs[k], f = clamp(u * 2 - k, 0, 1);
      if (f <= 0) continue;
      out += Pth("M" + g4[0] + "," + g4[1] + "L" + n2(g4[0] + (g4[2] - g4[0]) * f) + "," +
        n2(g4[1] + (g4[3] - g4[1]) * f), "none", TAPE, 14, { "stroke-linecap": "butt", opacity: 0.93 });
    }
    /* peeling: the X lifts away to the upper right, carrying the tile with it */
    if (lift > 0) {
      return G(out, {
        transform: "translate(" + n2(lift * 150) + "," + n2(-lift * 96) + ") rotate(" + n3(lift * 22) + "," + (x + TW / 2) + "," + (y + TH / 2) + ")",
        opacity: 1 - lift * 0.35
      });
    }
    return out;
  }

  function holes(p) {
    var xy = tileXY(TARGET), x = xy[0], y = xy[1];
    var n = 10, u = clamp(p, 0, 1), out = "";
    for (var k = 0; k < n; k++) {
      var f = clamp(u * n - k, 0, 1);
      if (f <= 0) continue;
      var leg = k % 2, idx = Math.floor(k / 2), s = 0.18 + idx * 0.16;
      var px = leg ? x + TW - 6 - (TW - 12) * s : x + 6 + (TW - 12) * s;
      var py = y + 6 + (TH - 12) * s;
      out += C(px, py, 4.5 * f, "#1B2830", "none", 0, {});
    }
    return out;
  }

  /* index of the hole the drill is working on, and where it is */
  function holeAt(k) {
    var xy = tileXY(TARGET), x = xy[0], y = xy[1];
    var leg = k % 2, idx = Math.floor(k / 2), s = 0.18 + idx * 0.16;
    return [leg ? x + TW - 6 - (TW - 12) * s : x + 6 + (TW - 12) * s, y + 6 + (TH - 12) * s];
  }

  /* ---- the tools, which now move --------------------------------------- */
  function chiselFig(cx, cy, len, ang, bevel) {
    var inner = R(0, -9, len * 0.44, 18, 4, HANDLE, HANDLE_D, 2, {}) +
      R(len * 0.44, -6, len * 0.42, 12, 1, STEEL, STEEL_D, 2, {}) +
      Pth("M" + n2(len * 0.86) + "," + (bevel ? -6 : -7) + "L" + n2(len) + ",0L" +
        n2(len * 0.86) + "," + (bevel ? 6 : 7) + "z", STEEL, STEEL_D, 1.5, {});
    return G(inner, { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(ang) + ")" });
  }

  function malletFig(cx, cy, ang) {
    return G(R(0, -7, 78, 14, 4, HANDLE, HANDLE_D, 2, {}) +
      R(-34, -22, 38, 44, 5, "#B8763A", "#8A5326", 2, {}),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(ang) + ")" });
  }

  function rakeFig(cx, cy, ang) {
    return G(R(0, -10, 54, 20, 5, HANDLE, HANDLE_D, 2, {}) +
      L(54, 0, 112, 0, STEEL_D, 5, {}) +
      Pth("M112,-9 l18,9 l-18,9 z", "#C9433A", "#8E2E28", 1.5, {}),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(ang) + ")" });
  }

  function drillFig(cx, cy, stopP) {
    return G(R(0, 0, 96, 36, 7, "#3C4B57", "#2A363F", 2, {}) +
      R(10, 36, 30, 30, 5, "#3C4B57", "#2A363F", 2, {}) +
      L(96, 18, 156, 18, STEEL_D, 6, {}) +
      (stopP > 0 ? R(128, 9, 15, 18, 2, TAPE, "#B2941F", 1.5, { opacity: stopP }) : ""),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ")" });
  }

  function spreaderFig(cx, cy, ang) {
    var teeth = "";
    for (var k = 0; k < 6; k++) teeth += R(6 + k * 12, 22, 6, 10, 0, P.ground, "none", 0, {});
    return G(R(-44, -8, 44, 20, 4, HANDLE, HANDLE_D, 2, {}) +
      R(0, -6, 78, 32, 2, STEEL, STEEL_D, 2, {}) + teeth,
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(ang) + ")" });
  }

  function floatFig(cx, cy, ang) {
    return G(R(-50, -10, 100, 22, 3, "#D8D2C4", "#A79F8E", 2, {}) +
      R(-22, -30, 44, 20, 5, HANDLE, HANDLE_D, 2, {}),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(ang) + ")" });
  }

  /* a fingertip, for pressing a corner */
  function finger(cx, cy, press) {
    return G(Pth("M0,0 q14,-10 28,0 v34 q-14,10 -28,0 z", SKIN, SKIN_D, 2, {}) +
      E(14, 2, 14, 7, SKIN, SKIN_D, 1.5, {}),
      { transform: "translate(" + n2(cx) + "," + n2(cy + press * 5) + ")" });
  }

  function spacerFig(cx, cy, s) {
    var a = s * 0.3;
    return Pth("M" + (cx - s) + "," + (cy - a) + "h" + (s - a) + "v" + (-(s - a)) + "h" + (2 * a) +
      "v" + (s - a) + "h" + (s - a) + "v" + (2 * a) + "h" + (-(s - a)) + "v" + (s - a) +
      "h" + (-2 * a) + "v" + (-(s - a)) + "h" + (-(s - a)) + "z", P.gold, "#B2941F", 1.5, {});
  }

  function cap(x, y, s, p, col) {
    if (!(p > 0)) return "";
    return Tx(x, y, s, "lab big", "middle", { fill: col || P.ink, opacity: Math.min(1, p),
      transform: "translate(0," + n2((1 - Math.min(1, p)) * 9) + ")" });
  }
  function note(x, y, s, p, col) {
    if (!(p > 0)) return "";
    return Tx(x, y, s, "lab", "middle", { fill: col || P.muted, opacity: Math.min(1, p) });
  }

  /* ==== scenes ============================================================ */

  function sceneTitle(scene, beat, t) {
    var one = scene.first;
    var a = inAt(t, BEATS[one].start, 1.0);
    var cp = on(t, cue(one, "broken"), 1.1);          /* the crack travels */
    var n = on(t, cue(one, "eight"), 0.9);
    var out = wall({ crackP: cp });
    if (n > 0) {
      for (var i = 0; i < 12; i++) {
        if (i === TARGET) continue;
        var xy = tileXY(i);
        var pulse = 0.35 + 0.3 * breathe(t + i * 0.2);
        out += R(xy[0], xy[1], TW, TH, 2, "none", P.good, 3, { opacity: pulse * n });
      }
    }
    out += cap(584, 424, "one is ruined; the other eight are the job", n, P.teal);
    return svg(G(out, { opacity: 0.35 + a * 0.65 }));
  }

  function titleMotif(o) {
    var t = (o && o.t) || 0;
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A wall of tiles with one cracked">' +
      G(R(0, 0, 100, 80, 2, TILE, TILE_D, 3, {}) +
        R(109, 0, 100, 80, 2, TILE, TILE_D, 3, {}) +
        R(0, 89, 100, 80, 2, TILE, TILE_D, 3, {}) +
        R(109, 89, 100, 80, 2, TILE, TILE_D, 3, {}) +
        Pth("M124,150 L150,110 L144,130 L182,100", "none", P.bad, 4, {}) +
        L(0, 186, 209, 186, P.teal, 3, { opacity: 0.5 + 0.3 * breathe(t) }),
        { transform: "translate(75,95)" }) +
      "</svg>";
  }

  /* PPE: a splinter is thrown off the tile and turned away by the lens, on a
     loop. The reason for goggles is a thing that happens, not a label. */
  function scenePpe(scene, beat, t, i) {
    var b0 = scene.first;
    var g = on(t, cue(b0, "goggles"), 0.7), gl = on(t, cue(b0, "gloves"), 0.7);
    var out = wall({ broken: true });
    if (g > 0) {
      var xy = tileXY(TARGET);
      var f = ((t - cue(b0, "goggles")) % 1.6) / 1.6;      /* one splinter every 1.6 s */
      var sx = lerp(xy[0] + 30, 262, clamp(f * 1.6, 0, 1));
      var sy = lerp(xy[1] + 20, 196, clamp(f * 1.6, 0, 1));
      if (f < 0.62) {
        out += Pth("M0,0 l11,4 l-8,6 z", "#EAF3F7", TILE_D, 1, {
          transform: "translate(" + n2(sx) + "," + n2(sy) + ") rotate(" + n3(f * 900) + ")", opacity: g });
      } else {
        /* deflected: it drops away below the lens */
        var d = (f - 0.62) / 0.38;
        out += Pth("M0,0 l11,4 l-8,6 z", "#EAF3F7", TILE_D, 1, {
          transform: "translate(" + n2(262 - d * 48) + "," + n2(196 + d * d * 150) + ") rotate(" + n3(d * 400) + ")",
          opacity: g * (1 - d) });
      }
      out += G(Pth("M0,20 q38,-26 76,0 q-10,26 -38,26 q-28,0 -38,-26 z", "#2E5A6E", "#1C3C4A", 2.5, {}) +
        E(23, 22, 14, 11, "#BEE3F0", "none", 0, { opacity: 0.85 }) +
        E(53, 22, 14, 11, "#BEE3F0", "none", 0, { opacity: 0.85 }),
        { transform: "translate(198,168)", opacity: g });
      out += note(236, 244, "goggles", g, P.accent);
    }
    if (gl > 0) {
      var grip = 0.5 + 0.5 * breathe(t * 0.6);
      out += G(Pth("M0,44 v-22 q0,-10 9,-10 q9,0 9,10 v-16 q0,-10 9,-10 q9,0 9,10 v13 q0,-10 9,-10 q9,0 9,10 v28 q0,18 -18,18 h-18 q-18,0 -18,-23 z",
        "#C96A3A", "#8E4623", 2.5, {}),
        { transform: "translate(206," + n2(292 + grip * 4) + ")", opacity: gl });
      out += note(236, 384, "gloves", gl, P.accent);
    }
    out += cap(584, 424, "neither of these is advice", Math.min(g, gl), P.accent);
    return svg(out);
  }

  /* Masking, then drilling: the drill TRAVELS hole to hole and plunges. */
  function sceneMask(scene, beat, t, i) {
    var b0 = scene.first, bD = b0 + 1;
    var out;
    if (i === b0) {
      var tp = on(t, cue(b0, "diagonals"), 1.5);
      out = wall({ broken: true, tapeP: tp });
      /* a fingertip runs along each strip as it is laid */
      if (tp > 0 && tp < 1) {
        var xy0 = tileXY(TARGET);
        var leg = tp < 0.5 ? 0 : 1, f = clamp(tp * 2 - leg, 0, 1);
        var ax = leg ? xy0[0] + TW - 6 : xy0[0] + 6, bx = leg ? xy0[0] + 6 : xy0[0] + TW - 6;
        out += finger(lerp(ax, bx, f) - 14, lerp(xy0[1] + 6, xy0[1] + TH - 6, f) - 18, 1);
      }
      out += cap(584, 424, "an X, corner to corner", on(t, cue(b0, "slipping"), 0.8), P.gold);
    } else {
      var hp = on(t, cue(bD, "holes"), 1.9);
      out = wall({ broken: true, tapeP: 1, holes: hp });
      var k = clamp(Math.floor(hp * 10), 0, 9);
      var hxy = holeAt(k);
      /* the drill plunges in and withdraws for each hole */
      var sub = clamp(hp * 10 - k, 0, 1);
      var plunge = sub < 0.5 ? ease(sub / 0.5) : 1 - ease((sub - 0.5) / 0.5);
      var dg = on(t, cue(bD, "depth"), 0.8);
      out += drillFig(hxy[0] - 168 + plunge * 14, hxy[1] - 18, dg);
      out += dust(hxy[0], hxy[1], hp > 0 ? 1 - plunge : 0, "#C6CED3");
      out += note(250, 300, "a wrap of tape = a depth stop", dg, P.accent);
      out += cap(584, 424, "the thickness of the tile, and no further", dg, P.gold);
    }
    return svg(out);
  }

  /* Raking: the rake travels each joint and the joint empties behind it. */
  function sceneRake(scene, beat, t, i) {
    var b0 = scene.first;
    var p = on(t, cue(b0, "four"), 2.2);
    var out = wall({ broken: true, rakedP: p });
    var xy = tileXY(TARGET);
    if (p > 0 && p < 1) {
      var side = Math.min(3, Math.floor(p * 4)), f = clamp(p * 4 - side, 0, 1);
      var px, py, ang;
      if (side === 0) { px = lerp(xy[0] - J, xy[0] + TW + J, f); py = xy[1] - J / 2; ang = 0; }
      else if (side === 1) { px = xy[0] + TW + J / 2; py = lerp(xy[1] - J, xy[1] + TH + J, f); ang = 90; }
      else if (side === 2) { px = lerp(xy[0] + TW + J, xy[0] - J, f); py = xy[1] + TH + J / 2; ang = 180; }
      else { px = xy[0] - J / 2; py = lerp(xy[1] + TH + J, xy[1] - J, f); ang = 270; }
      out += rakeFig(px - 130, py, ang === 90 || ang === 270 ? ang - 180 : ang);
      out += crumbs(px - 16, py + 6, (t * 1.6) % 1, 4, GROUT);
    } else if (p >= 1) {
      out += rakeFig(xy[0] + TW + 150, xy[1] + 20, 0);
    }
    out += cap(584, 424, "now it is an island", on(t, cue(b0, "island"), 0.8), P.blue);
    return svg(out);
  }

  /* Chipping: the chisel is STRUCK. The hole opens a step per blow, and each
     blow throws fragments. Then the tape peels and carries the tile away. */
  function sceneChip(scene, beat, t, i) {
    var b0 = scene.first, bE = b0 + 1;
    var xy = tileXY(TARGET);
    var out;
    if (i === b0) {
      var at = cue(b0, "middle");
      var s = strike(t, at, 0.62);
      var h = clamp((s.blow + 1) / 7, 0, 1) * (at != null && t >= at ? 1 : 0);
      out = wall({ broken: true, tapeP: 1, rakedP: 1, hole: h });
      var cx = xy[0] + TW / 2, cy = xy[1] + TH / 2;
      out += chiselFig(cx + 118 + s.back * 26, cy - 92 - s.back * 22, 150, 128, false);
      /* The swing is kept low deliberately: at -168 - back*60 the mallet head
         left the top of the 1168 x 440 box by 25 px at the top of every blow,
         which --sweep catches and --sample cannot, because it only ever looks
         0.75 s after a cue and the overshoot is mid-swing. */
      out += malletFig(cx + 226 + s.back * 40, cy - 124 - s.back * 40, 128);
      out += dust(cx, cy, s.hit, BED_D);
      if (s.hit > 0) {
        for (var k = 0; k < 3; k++) {
          var a2 = -2.2 + k * 0.7, d2 = (1 - s.hit) * 54;
          out += Pth("M0,0 l13,5 l-9,8 z", TILE, TILE_D, 1, {
            transform: "translate(" + n2(cx + Math.cos(a2) * d2) + "," + n2(cy + Math.sin(a2) * d2) + ")",
            opacity: s.hit });
        }
      }
      out += cap(584, 424, "from the centre, outwards", on(t, cue(b0, "middle"), 0.9), P.accent);
    } else {
      var lift = on(t, cue(bE, "adhesive"), 1.5);
      out = wall({ rakedP: 1, missing: lift > 0.45, hole: lift > 0.45 ? 0 : 1,
        tapeP: 1, lift: lift, lumpy: lift > 0.45 ? lift : 0 });
      out += cap(584, 424, "strike it — never lever it", on(t, cue(bE, "lever"), 0.8), P.bad);
    }
    return svg(out);
  }

  /* Clearing: the chisel SWEEPS across and the lumps go as it passes. */
  function sceneBed(scene, beat, t, i) {
    var b0 = scene.first;
    var sweep = on(t, cue(b0, "flat"), 2.0);
    var xy = tileXY(TARGET);
    var out = wall({ rakedP: 1, missing: true, lumpy: 1, sweep: sweep });
    var cx = lerp(xy[0] - 6, xy[0] + TW + 6, sweep);
    out += chiselFig(cx - 132, xy[1] + TH / 2 + 26, 140, -14, true);
    if (sweep > 0 && sweep < 1) out += shaving(cx + 6, xy[1] + TH / 2 + 8, (t * 1.3) % 1, ADH);
    out += note(584, 74, "bevel side DOWN, so the tool rides out of the work",
      on(t, cue(b0, "bevel"), 0.8), P.muted);
    out += cap(584, 424, "a flat bed, or nothing sits flush", sweep, P.plum);
    return svg(out);
  }

  /* The dry fit: the tile rocks, and a finger presses each corner in turn. */
  function sceneFit(scene, beat, t, i) {
    var b0 = scene.first;
    var r = on(t, cue(b0, "rocks"), 0.9);
    var xy = tileXY(TARGET);
    var out = wall({ rakedP: 1, missing: true, lumpy: 0.8 });
    var swing = Math.sin(t * 2.6);
    var tilt = -5 * swing * r;
    out += G(R(0, 0, TW, TH, 2, TILE_NEW, TILE_D, 2.5, {}),
      { transform: "translate(" + xy[0] + "," + (xy[1] - 6) + ") rotate(" + n3(tilt) + "," + (TW / 2) + "," + (TH / 2) + ")" });
    if (r > 0.3) {
      /* the finger presses whichever corner is currently high */
      var left = swing > 0;
      out += finger((left ? xy[0] + 6 : xy[0] + TW - 34), xy[1] - 58, Math.abs(swing));
      var gx = left ? xy[0] + TW - 16 : xy[0] + 4;
      out += R(gx, xy[1] - 10 + Math.abs(swing) * 5, 12, 4, 1, P.bad, "none", 0, { opacity: 0.8 * r });
    }
    out += cap(584, 424, "it rocks — that is the WALL talking, not the tile", r, P.gold);
    return svg(out);
  }

  /* Setting: the spreader travels across the back leaving ribs; then the tile
     moves into the hole and settles flush, and the spacers go in. */
  function sceneSet(scene, beat, t, i) {
    var b0 = scene.first, bS = b0 + 1;
    var xy = tileXY(TARGET);
    var out;
    if (i === b0) {
      var b = on(t, cue(b0, "sparingly"), 1.8);
      out = wall({ rakedP: 1, missing: true });
      var bx = xy[0] - 232, by = xy[1] + 4;
      var ribs = "";
      for (var k = 0; k < 6; k++) {
        var f = clamp(b * 6 - k, 0, 1);
        if (f <= 0) continue;
        ribs += R(12 + k * 17, 12, 10, (TH - 24) * f, 2, ADH, "none", 0, { opacity: 0.9 });
      }
      out += G(R(0, 0, TW, TH, 2, TILE_NEW, TILE_D, 2.5, {}) + ribs, { transform: "translate(" + bx + "," + by + ")" });
      if (b > 0 && b < 1) out += spreaderFig(bx + 16 + b * (TW - 20), by + TH + 34, -90);
      out += cap(584, 424, "sparingly — too much and it stands proud", b, P.good);
    } else {
      var f2 = on(t, cue(bS, "flush"), 1.5);
      out = wall({ rakedP: 1 - f2, missing: f2 < 0.95, newTile: f2 >= 0.95 });
      if (f2 < 0.95) {
        /* the tile travels in from the left and seats */
        out += G(R(0, 0, TW, TH, 2, TILE_NEW, TILE_D, 2.5, {}),
          { transform: "translate(" + n2(lerp(xy[0] - 232, xy[0], ease(f2))) + "," + n2(lerp(xy[1] + 4, xy[1], ease(f2))) + ")" });
      }
      var sp = on(t, cue(bS, "hours"), 0.7);
      if (sp > 0) {
        out += spacerFig(xy[0] - 4, xy[1] - 4, 11 * sp);
        out += spacerFig(xy[0] + TW + 4, xy[1] - 4, 11 * sp);
        out += spacerFig(xy[0] - 4, xy[1] + TH + 4, 11 * sp);
        out += spacerFig(xy[0] + TW + 4, xy[1] + TH + 4, 11 * sp);
      }
      out += cap(584, 424, "flush on all four edges, then left alone", sp, P.good);
    }
    return svg(out);
  }

  /* Grouting: the float sweeps diagonally across the joints, then the
     finishing tool runs one joint, then the polish passes over. */
  function sceneGrout(scene, beat, t, i) {
    var b0 = scene.first;
    var g = on(t, cue(b0, "grout"), 2.0);
    var xy = tileXY(TARGET);
    var out = wall({ newTile: true, rakedP: 1 - g });
    if (g > 0 && g < 1) {
      out += floatFig(lerp(xy[0] - 40, xy[0] + TW + 40, g), lerp(xy[1] - 40, xy[1] + TH + 40, g), -38);
    }
    var w = on(t, cue(b0, "which"), 1.2);
    if (w > 0 && w < 1) {
      /* the polish: a soft highlight travelling across the finished tile */
      out += R(lerp(xy[0] - 30, xy[0] + TW, w), xy[1], 26, TH, 2, P.ink, "none", 0, { opacity: 0.18 });
    }
    out += cap(584, 424, "and nobody can tell which one it was", w, P.teal);
    return svg(out);
  }

  function sceneRecap(scene, beat, t, i) {
    var b0 = scene.first;
    var rows = [
      ["protect", "goggles, gloves, and the eight sound tiles", P.accent, "protect"],
      ["release", "rake all four joints before you strike", P.blue, "release"],
      ["remove", "from the centre outwards, striking not levering", P.gold, "remove"],
      ["replace", "flat bed, sparing adhesive, flush, then wait", P.good, "replace"]
    ];
    var out = "";
    for (var k = 0; k < rows.length; k++) {
      var p = on(t, cue(b0, rows[k][3]), 0.5);
      if (!(p > 0)) continue;
      var yy = 130 + k * 66;
      /* each row slides in from the left rather than fading in place */
      var dx = (1 - Math.min(1, p)) * -60;
      out += G(R(250, yy, 670, 50, 10, P.cell, rows[k][2], 2, { opacity: 0.9 * p }) +
        Tx(274, yy + 31, rows[k][0], "lab", "start", { fill: rows[k][2], opacity: p }) +
        Tx(896, yy + 31, rows[k][1], "lab", "end", { fill: P.ink, opacity: p }),
        { transform: "translate(" + n2(dx) + ",0)" });
    }
    out += cap(584, 424, "the repair you cannot find is the finished one",
      on(t, cue(b0, "finished"), 0.8), P.teal);
    return svg(out);
  }

  var KINDS = {
    title: sceneTitle, ppe: scenePpe, mask: sceneMask, rake: sceneRake,
    chip: sceneChip, bed: sceneBed, fit: sceneFit, set: sceneSet,
    grout: sceneGrout, recap: sceneRecap
  };
