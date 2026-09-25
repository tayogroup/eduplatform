  /* ==== Professor Adow TVET — Replace a Broken Tile ========================
     The pictures of the tiling film, between the shared engine's head and
     tail (tools/lib/ehel-film-engine-head.js explains the assembly).

     EVERY FRAME SHOWS THE NEIGHBOURS. The broken tile is never drawn alone,
     because it is never alone on a wall and because the sound tiles around
     it ARE the difficulty of the job. A learner shown a single tile being
     chiselled has been shown the easy half. The lesson's own drawings make
     the same choice for the same reason.

     THE JOINTS ARE GAPS, NOT LINES. The wall is drawn as a bed with tiles
     laid on it, so a raked joint is simply a tile missing its neighbour's
     grout and a grouted one is the bed covered over. That lets the raking
     scene show an empty channel without redrawing anything.

     THE ANIMATION IS CUED OFF THE WORDS: cue(beat, name) is the measured
     moment a phrase is spoken, so the chisel bites as the narrator says
     "starts in the middle". */

  /* ---- the materials --------------------------------------------------- */
  var TILE = "#DCE6EA", TILE_D = "#A8BCC6", TILE_NEW = "#EEF6F9";
  var GROUT = "#8C9AA3", BED = "#6E5B4A", BED_D = "#54453A";
  var STEEL = "#B9C6D0", STEEL_D = "#7E8E9B", HANDLE = "#7A4A22", HANDLE_D = "#5E3A1B";
  var TAPE = "#E8D9A0", ADH = "#CFCAC0";

  var HUE = {
    title: P.teal, ppe: P.accent, mask: P.gold, rake: P.blue,
    chip: P.accent, bed: P.plum, fit: P.gold, set: P.good,
    grout: P.teal, recap: P.teal
  };

  /* ---- the wall -------------------------------------------------------- */
  var TW = 116, TH = 92, J = 9;
  var WX = 380, WY = 96;                       /* 4 x 3 tiles, centred-ish */
  var TARGET = 5;                              /* second row, second column */

  function tileXY(i) {
    var c = i % 4, r = Math.floor(i / 4);
    return [WX + c * (TW + J), WY + r * (TH + J)];
  }

  function crack(x, y) {
    return Pth("M" + (x + 14) + "," + (y + 70) + "L" + (x + 44) + "," + (y + 36) +
      "L" + (x + 37) + "," + (y + 52) + "L" + (x + 74) + "," + (y + 18),
      "none", P.bad, 3, {}) +
      Pth("M" + (x + 44) + "," + (y + 36) + "L" + (x + 86) + "," + (y + 62) +
        "L" + (x + 108) + "," + (y + 30), "none", P.bad, 2.5, {});
  }

  /* o: { broken, missing, lumpy, newTile, rakedP, holesP, tapeP, hole } */
  function wall(o) {
    o = o || {};
    var out = R(WX - J, WY - J, 4 * TW + 5 * J, 3 * TH + 4 * J, 4, GROUT, GROUT, 2, {});
    /* the four joints around the target empty to the bed as raking runs */
    if (o.rakedP > 0) {
      var t = tileXY(TARGET), rx = t[0], ry = t[1], p = clamp(o.rakedP, 0, 1);
      out += R(rx - J, ry - J, (TW + 2 * J) * p, J, 0, BED, BED_D, 1, {});
      out += R(rx - J, ry + TH, (TW + 2 * J) * p, J, 0, BED, BED_D, 1, {});
      out += R(rx - J, ry - J, J, (TH + 2 * J) * p, 0, BED, BED_D, 1, {});
      out += R(rx + TW, ry - J, J, (TH + 2 * J) * p, 0, BED, BED_D, 1, {});
    }
    for (var i = 0; i < 12; i++) {
      var xy = tileXY(i), x = xy[0], y = xy[1];
      if (i === TARGET && o.missing) {
        out += R(x, y, TW, TH, 2, BED, BED_D, 2, {});
        if (o.lumpy > 0) {
          for (var k = 0; k < 4; k++) {
            out += E(x + 24 + k * 24, y + 28 + (k % 2) * 34, 15, 9, ADH, BED_D, 1,
              { opacity: clamp(o.lumpy, 0, 1) });
          }
        }
        continue;
      }
      if (i === TARGET && o.hole > 0) {
        /* the hole opens from the centre outwards */
        var h = clamp(o.hole, 0, 1);
        out += R(x, y, TW, TH, 2, TILE, TILE_D, 2, {});
        out += R(x + TW / 2 - (TW / 2) * h, y + TH / 2 - (TH / 2) * h, TW * h, TH * h, 2, BED, BED_D, 1.5, {});
        continue;
      }
      out += R(x, y, TW, TH, 2, i === TARGET && o.newTile ? TILE_NEW : TILE, TILE_D, 2, {});
      if (i === TARGET && o.broken) out += crack(x, y);
    }
    if (o.tapeP > 0) out += tape(o.tapeP);
    if (o.holesP > 0) out += holes(o.holesP);
    return out;
  }

  function tape(p) {
    var xy = tileXY(TARGET), x = xy[0], y = xy[1], u = clamp(p, 0, 1);
    var out = "";
    var legs = [[x + 6, y + 6, x + TW - 6, y + TH - 6], [x + TW - 6, y + 6, x + 6, y + TH - 6]];
    for (var k = 0; k < 2; k++) {
      var L4 = legs[k];
      var f = clamp(u * 2 - k, 0, 1);
      if (f <= 0) continue;
      out += Pth("M" + L4[0] + "," + L4[1] + "L" + n2(L4[0] + (L4[2] - L4[0]) * f) + "," +
        n2(L4[1] + (L4[3] - L4[1]) * f), "none", TAPE, 14, { "stroke-linecap": "butt", opacity: 0.93 });
    }
    return out;
  }

  function holes(p) {
    var xy = tileXY(TARGET), x = xy[0], y = xy[1];
    var n = 10, shown = Math.floor(clamp(p, 0, 1) * n + 0.0001), out = "";
    for (var k = 0; k < shown; k++) {
      var leg = k % 2, idx = Math.floor(k / 2), t = 0.18 + idx * 0.16;
      var px = leg ? x + TW - 6 - (TW - 12) * t : x + 6 + (TW - 12) * t;
      out += C(px, y + 6 + (TH - 12) * t, 4.5, "#1B2830", "none", 0, {});
    }
    return out;
  }

  /* ---- the tools, drawn at the wall ------------------------------------ */
  function chiselFig(cx, cy, len, ang, bevel) {
    var inner = R(0, -9, len * 0.44, 18, 4, HANDLE, HANDLE_D, 2, {}) +
      R(len * 0.44, -6, len * 0.42, 12, 1, STEEL, STEEL_D, 2, {}) +
      Pth("M" + n2(len * 0.86) + "," + (bevel ? -6 : -7) + "L" + n2(len) + ",0L" +
        n2(len * 0.86) + "," + (bevel ? 6 : 7) + "z", STEEL, STEEL_D, 1.5, {});
    return G(inner, { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(ang) + ")" });
  }

  function rakeFig(cx, cy, ang) {
    var inner = R(0, -10, 54, 20, 5, HANDLE, HANDLE_D, 2, {}) +
      L(54, 0, 112, 0, STEEL_D, 5, {}) +
      Pth("M112,-9 l18,9 l-18,9 z", "#C9433A", "#8E2E28", 1.5, {});
    return G(inner, { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(ang) + ")" });
  }

  function drillFig(cx, cy) {
    return G(R(0, 0, 96, 36, 7, "#3C4B57", "#2A363F", 2, {}) +
      R(10, 36, 30, 30, 5, "#3C4B57", "#2A363F", 2, {}) +
      L(96, 18, 156, 18, STEEL_D, 6, {}) +
      R(120, 10, 16, 16, 2, P.gold, "#B2941F", 1.5, {}),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ")" });
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
    var b = on(t, cue(one, "broken"), 0.8);
    var n = on(t, cue(one, "eight"), 0.9);
    var out = wall({ broken: b > 0.4 });
    if (n > 0) {
      for (var i = 0; i < 12; i++) {
        if (i === TARGET) continue;
        var xy = tileXY(i);
        out += R(xy[0], xy[1], TW, TH, 2, "none", P.good, 3, { opacity: 0.55 * n });
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

  function scenePpe(scene, beat, t, i) {
    var b0 = scene.first;
    var g = on(t, cue(b0, "goggles"), 0.7), gl = on(t, cue(b0, "gloves"), 0.7);
    var out = wall({ broken: true });
    if (g > 0) {
      out += G(Pth("M0,20 q38,-26 76,0 q-10,26 -38,26 q-28,0 -38,-26 z", "#2E5A6E", "#1C3C4A", 2.5, {}) +
        E(23, 22, 14, 11, "#BEE3F0", "none", 0, { opacity: 0.85 }) +
        E(53, 22, 14, 11, "#BEE3F0", "none", 0, { opacity: 0.85 }),
        { transform: "translate(150,150)", opacity: g });
      out += note(188, 226, "goggles", g, P.accent);
    }
    if (gl > 0) {
      out += G(Pth("M0,44 v-22 q0,-10 9,-10 q9,0 9,10 v-16 q0,-10 9,-10 q9,0 9,10 v13 q0,-10 9,-10 q9,0 9,10 v28 q0,18 -18,18 h-18 q-18,0 -18,-23 z",
        "#C96A3A", "#8E4623", 2.5, {}), { transform: "translate(160,268)", opacity: gl });
      out += note(188, 360, "gloves", gl, P.accent);
    }
    out += cap(584, 424, "neither of these is advice", Math.min(g, gl), P.accent);
    return svg(out);
  }

  function sceneMask(scene, beat, t, i) {
    var b0 = scene.first, bD = b0 + 1;
    var out;
    if (i === b0) {
      out = wall({ broken: true, tapeP: on(t, cue(b0, "diagonals"), 1.3) });
      out += cap(584, 424, "an X, corner to corner", on(t, cue(b0, "slipping"), 0.8), P.gold);
    } else {
      var hp = on(t, cue(bD, "holes"), 1.4);
      out = wall({ broken: true, tapeP: 1, holesP: hp });
      out += drillFig(150, 150);
      var dg = on(t, cue(bD, "depth"), 0.8);
      out += G(R(0, 0, 16, 16, 2, P.accent, "#9A3F27", 1.5, {}),
        { transform: "translate(268,160)", opacity: dg });
      /* below the drill, not across it: at 300,210 this label sat on the
         very tool it names. */
      out += note(228, 252, "a wrap of tape = a depth stop", dg, P.accent);
      out += cap(584, 424, "the thickness of the tile, and no further", dg, P.gold);
    }
    return svg(out);
  }

  function sceneRake(scene, beat, t, i) {
    var b0 = scene.first;
    var p = on(t, cue(b0, "four"), 1.5);
    var out = wall({ broken: true, rakedP: p });
    out += rakeFig(210, 300, -18);
    out += cap(584, 424, "now it is an island", on(t, cue(b0, "island"), 0.8), P.blue);
    return svg(out);
  }

  function sceneChip(scene, beat, t, i) {
    var b0 = scene.first, bE = b0 + 1;
    var out;
    if (i === b0) {
      var h = on(t, cue(b0, "middle"), 1.6);
      out = wall({ broken: true, tapeP: 1, rakedP: 1, hole: h });
      out += chiselFig(300, 210, 150, 34, false);
      out += cap(584, 424, "from the centre, outwards", on(t, cue(b0, "middle"), 0.9), P.accent);
    } else {
      out = wall({ tapeP: 0, rakedP: 1, missing: true, lumpy: on(t, cue(bE, "adhesive"), 0.9) });
      out += cap(584, 424, "strike it — never lever it", on(t, cue(bE, "lever"), 0.8), P.bad);
    }
    return svg(out);
  }

  function sceneBed(scene, beat, t, i) {
    var b0 = scene.first;
    var clear = on(t, cue(b0, "flat"), 1.3);
    var out = wall({ rakedP: 1, missing: true, lumpy: 1 - clear });
    out += chiselFig(300, 250, 140, 8, true);
    /* above the wall. y 392 is inside it - the wall spans y 96 to 408 - so
       this line was printed over the tiles it was explaining. */
    out += note(584, 74, "bevel side DOWN, so the tool rides out of the work",
      on(t, cue(b0, "bevel"), 0.8), P.muted);
    out += cap(584, 424, "a flat bed, or nothing sits flush", clear, P.plum);
    return svg(out);
  }

  function sceneFit(scene, beat, t, i) {
    var b0 = scene.first;
    var r = on(t, cue(b0, "rocks"), 0.9);
    var xy = tileXY(TARGET);
    var out = wall({ rakedP: 1, missing: true, lumpy: 0.7 });
    var tilt = -5 * (0.4 + 0.6 * Math.abs(Math.sin(t * 2.4))) * r;
    out += G(R(0, 0, TW, TH, 2, TILE_NEW, TILE_D, 2.5, {}),
      { transform: "translate(" + xy[0] + "," + (xy[1] - 6) + ") rotate(" + n3(tilt) + "," + (TW / 2) + "," + (TH / 2) + ")" });
    out += cap(584, 424, "it rocks — that is the WALL talking, not the tile", r, P.gold);
    return svg(out);
  }

  function sceneSet(scene, beat, t, i) {
    var b0 = scene.first, bS = b0 + 1;
    var out;
    if (i === b0) {
      var xy = tileXY(TARGET);
      var b = on(t, cue(b0, "sparingly"), 1.0);
      out = wall({ rakedP: 1, missing: true });
      out += G(R(0, 0, TW, TH, 2, TILE_NEW, TILE_D, 2.5, {}) +
        (b > 0 ? R(10, 10, TW - 20, TH - 20, 2, ADH, "none", 0, { opacity: 0.85 * b }) : ""),
        { transform: "translate(" + (xy[0] - 210) + "," + (xy[1] + 10) + ")" });
      out += cap(584, 424, "sparingly — too much and it stands proud", b, P.good);
    } else {
      var f = on(t, cue(bS, "flush"), 1.0);
      out = wall({ newTile: true, rakedP: 1 - f });
      var xy2 = tileXY(TARGET);
      if (f > 0.3) {
        out += spacerFig(xy2[0] - 4, xy2[1] - 4, 11);
        out += spacerFig(xy2[0] + TW + 4, xy2[1] - 4, 11);
        out += spacerFig(xy2[0] - 4, xy2[1] + TH + 4, 11);
        out += spacerFig(xy2[0] + TW + 4, xy2[1] + TH + 4, 11);
      }
      out += cap(584, 424, "flush on all four edges, then left alone",
        on(t, cue(bS, "hours"), 0.8), P.good);
    }
    return svg(out);
  }

  function sceneGrout(scene, beat, t, i) {
    var b0 = scene.first;
    var g = on(t, cue(b0, "grout"), 1.2);
    var out = wall({ newTile: true, rakedP: 1 - g });
    out += cap(584, 424, "and nobody can tell which one it was",
      on(t, cue(b0, "which"), 0.8), P.teal);
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
      out += R(250, yy, 670, 50, 10, P.cell, rows[k][2], 2, { opacity: 0.9 * p });
      out += Tx(274, yy + 31, rows[k][0], "lab", "start", { fill: rows[k][2], opacity: p });
      out += Tx(896, yy + 31, rows[k][1], "lab", "end", { fill: P.ink, opacity: p });
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
