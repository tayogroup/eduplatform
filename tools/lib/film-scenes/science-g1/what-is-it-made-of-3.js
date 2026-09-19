
  /* ==== What Is It Made Of?, part 3: "Squash, bend, twist, stretch" and
     "The right material for the job" */

  /* ==== chapter: Squash, bend, twist, stretch ==================================
     The lesson's shape experiment (SIMS.shapeChange): its four action buttons
     and its three things, each in its own box with the sim's own name for it.
     Each change is the sim's own transform, eased in as it is said: squash
     scale(1.6, 0.45), bend rotate(-30deg) skewX(20deg), twist rotate(180deg)
     scaleX(0.6) (turned one and a half times, "round and round", to end where
     the sim ends), stretch scale(2.1, 0.8), with an arrow for each push and
     pull. The stone is pushed and stays exactly as it was. Then the results,
     in the record step's own words. */
  var SA = [
    { cue: "squash", label: "Squash it", w: 152 },
    { cue: "bend", label: "Bend it", w: 128 },
    { cue: "twist", label: "Twist it", w: 140 },
    { cue: "stretch", label: "Stretch it", w: 164 }
  ];
  (function () { var x = (1168 - (152 + 128 + 140 + 164 + 48)) / 2; SA.forEach(function (a) { a.x = x + a.w / 2; x += a.w + 16; }); })();
  var SH = { top: 86, h: 228, w: 352, xs: [196, 584, 972], y: 206, size: 124, resY: 368 };
  var SH_ITEMS = [
    { pic: PIC.clay, label: "a ball of clay" },
    { pic: PIC.band, label: "an elastic band" },
    { pic: PIC.rock, label: "a stone" }
  ];
  /* the sim's four transforms (SIMS.shapeChange.draw), as wmShaped reads them */
  var SHAPE_SQUASH = { sx: 1.6, sy: 0.45 }, SHAPE_BEND = { rot: -30, skew: 20 },
    SHAPE_TWIST = { rot: 180, sx: 0.6 }, SHAPE_STRETCH = { sx: 2.1, sy: 0.8 };

  /* the sim's action button: gold on its darker step (lesson.css .big) */
  function shapeButton(a, t, o, flashAt) {
    var down = 3 * bump(t, flashAt, 0.4), x = a.x - a.w / 2, y = 14 + down;
    var out = R(x, 19, a.w, 52, 16, P.goldDeep) + R(x, y, a.w, 52, 16, P.gold) +
      Tx(a.x, y + 34, a.label, "lab", "middle", { fill: "#142B3E" });
    var ring = bump(t, flashAt, 0.7);
    if (ring > 0) out += R(x - 6, 8, a.w + 12, 66, 20, "none", P.ink, 4, { opacity: ring });
    return G(out, { opacity: o, transform: around(a.x, 40, Math.max(0.001, Math.min(o, 1.1))) });
  }

  /* a box of the experiment: a floor line for the thing to stand on, and the
     sim's name for the thing under it (at the foot, where no arrow comes) */
  function shapeBox(k, edge, kids) {
    var cx = SH.xs[k], x = cx - SH.w / 2, label = SH_ITEMS[k].label, tw = label.length * 19 * 0.56 + 28;
    return R(x, SH.top, SH.w, SH.h, 22, P.cell, edge || P.line, edge ? 3.5 : 2) +
      L(x + 24, SH.y + 66, x + SH.w - 24, SH.y + 66, P.line, 3) +
      R(cx - tw / 2, SH.y + 73, tw, 34, 17, "rgba(0,0,0,0.35)") + Tx(cx, SH.y + 96, label, "lab mid", "middle") + kids;
  }

  function wmShape(scene, beat, t, i) {
    var b = scene.first, out = "";
    var btnAt = SA.map(function (a) { return sc(scene, 0, a.cue); }), changeAt = sc(scene, 0, "change");
    var cPush = sc(scene, 1, "push"), cSquash = sc(scene, 1, "squash"), cBend = sc(scene, 1, "bend");
    var bPull = sc(scene, 2, "pull"), bStretch = sc(scene, 2, "stretch"), bTwist = sc(scene, 2, "twist");
    var sPush = sc(scene, 3, "push"), sNothing = sc(scene, 3, "nothing"), sKeeps = sc(scene, 3, "keeps");
    var rChange = sc(scene, 4, "change"), rNot = sc(scene, 4, "not");
    var clayStart = BEATS[b + 1].start, bandStart = BEATS[b + 2].start, stoneStart = BEATS[b + 3].start, endStart = BEATS[b + 4].start;

    /* the four buttons, and which one each push or pull uses */
    var flashes = [[cPush, sPush], [cBend], [bTwist], [bPull]];
    SA.forEach(function (a, k) {
      var o = popIn(t, btnAt[k], 0.4);
      if (o <= 0) return;
      var f = null;
      flashes[k].forEach(function (x) { if (x != null && t >= x) f = x; });
      out += shapeButton(a, t, o, f);
    });

    /* which box is in use */
    var active = t >= endStart ? -1 : t >= stoneStart ? 2 : t >= bandStart ? 1 : t >= clayStart ? 0 : -1;

    /* the clay: squashed about its bottom, then bent about its middle; it stays bent */
    var bottom = SH.y + SH.size * 0.48;
    var sq = on(t, cSquash, 0.55), bd = on(t, cBend == null ? null : cBend + 0.2, 0.6);
    var clayTf = wmMix(wmMix({}, SHAPE_SQUASH, sq), SHAPE_BEND, bd);
    var clay = wmShaped(SH.xs[0], SH.y, SH.size, PIC.clay, clayTf, SH.xs[0], lerp(bottom, SH.y, bd));
    var ca = on(t, cPush, 0.35) * (1 - on(t, cBend, 0.3));
    if (ca > 0) {
      var tip = lerp(SH.y - SH.size * 0.5 - 6, bottom - SH.size * 0.45 - 6, sq);
      clay += G(MK.arrow(SH.xs[0], tip - 50, SH.xs[0], tip, 1, P.gold, 9), { opacity: ca });
    }
    var cb = on(t, cBend, 0.45) * (1 - on(t, bandStart - 0.2, 0.3));
    clay += bendArrows(SH.xs[0], SH.y, 104, cb, Math.min(1, cb * 1.5), 48);

    /* the elastic band: pulled wide, springing back, then twisted round and round */
    var st = on(t, bStretch, 0.55) * (1 - on(t, bTwist == null ? null : bTwist - 0.25, 0.3));
    var tw = bTwist == null || t < bTwist ? 0 : clamp((t - bTwist) / 1.5, 0, 1);
    var twe = ease(tw);
    var bandTf = wmMix(wmMix({}, SHAPE_STRETCH, st), SHAPE_TWIST, twe);
    bandTf.rot = 540 * twe;
    var band = wmShaped(SH.xs[1], SH.y, SH.size, PIC.band, bandTf, SH.xs[1], SH.y);
    var pa = on(t, bPull, 0.4) * (1 - on(t, bTwist == null ? null : bTwist - 0.25, 0.3));
    if (pa > 0) {
      var half = SH.size * 0.49 * (bandTf.sx || 1);
      band += G(MK.arrow(SH.xs[1] - half + 4, SH.y, SH.xs[1] - half - 40, SH.y, 1, P.gold, 8) +
        MK.arrow(SH.xs[1] + half - 4, SH.y, SH.xs[1] + half + 40, SH.y, 1, P.gold, 8), { opacity: pa });
    }
    var ta = on(t, bTwist, 0.35) * (1 - on(t, stoneStart - 0.2, 0.3));
    /* round the right side, under it and up the left, inside the floor line
       and clear of the name tag under it */
    if (ta > 0) band += G(wmArc(SH.xs[1], SH.y - 4, 70, -Math.PI * 0.35, Math.PI * 1.15, on(t, bTwist, 0.9), P.gold, 7), { opacity: ta });

    /* the stone: pushed, and nothing happens. The kit's rock fills y 15..56 of
       its 64-high drawing, so centred on STONE_Y it stands on the floor line. */
    var STONE_Y = SH.y + 14, STONE = 132, stoneTop = STONE_Y - STONE * (17 / 64);
    var sp = on(t, sPush, 0.35) * (1 - on(t, sNothing == null ? null : sNothing + 0.5, 0.4));
    var press = bump(t, sPush == null ? null : sPush + 0.3, 1.0);
    var stone = G(MK.pic(SH.xs[2], STONE_Y, STONE, PIC.rock), { transform: "translate(0," + n2(1.5 * Math.sin(t * 50) * bump(t, sPush == null ? null : sPush + 0.55, 0.3)) + ")" });
    stone += MK.glow(SH.xs[2], STONE_Y, 110, P.teal, bump(t, sKeeps, 1.2));
    if (sp > 0) {
      var sTip = stoneTop - 12 + 10 * press;
      stone += G(MK.arrow(SH.xs[2], sTip - 56, SH.xs[2], sTip, 1, P.gold, 9), { opacity: sp });
    }

    var kids = [clay, band, stone];
    for (var k = 0; k < 3; k++) {
      var q = popIn(t, changeAt == null ? null : changeAt + k * 0.15, 0.35) * (1 - on(t, [cSquash, bStretch, sNothing][k], 0.3));
      var qm = q > 0 ? MK.qmark(SH.xs[k] + SH.w / 2 - 30, SH.top + 30, 20, Math.min(1, q)) : "";
      out += shapeBox(k, active === k ? P.gold : null, kids[k] + qm);
    }

    /* the results, as the record step writes them */
    var yes = [rChange, rChange == null ? null : rChange + 0.3];
    for (var r = 0; r < 2; r++) {
      var p = popIn(t, yes[r], 0.35);
      if (p <= 0) continue;
      out += G(MK.tick(SH.xs[r] - 104, SH.resY, 22, p) + Tx(SH.xs[r] - 72, SH.resY + 8, "Yes, it changed", "lab", "start", { fill: P.good }), { opacity: Math.min(1, p) });
    }
    var np = popIn(t, rNot, 0.35);
    if (np > 0) out += G(MK.cross(SH.xs[2] - 138, SH.resY, 22, np) + Tx(SH.xs[2] - 106, SH.resY + 8, "No, it stayed the same", "lab", "start", { fill: P.bad }), { opacity: Math.min(1, np) });
    return svg(out);
  }

  /* ==== chapter: The right material for the job ===============================
     The lesson's context step first: its four things, each with the property
     that made its material the right one. Then three of them side by side: the
     window lets the light through, the raincoat lets the rain run off, and a
     paper raincoat soaks it up and drips. */
  var JOB_CARDS = [
    { pic: PIC.window, label: "glass window", prop: "see-through" },
    { pic: PIC.coat, label: "plastic raincoat", prop: "waterproof" },
    { pic: PIC.pillow, label: "fabric pillow", prop: "soft" },
    { pic: PIC.spoon, label: "metal spoon", prop: "hard" }
  ];
  var JB = { xs: [196, 584, 972], top: 12, h: 262, w: 352, y: 148, badgeY: 318, markY: 394 };

  /* a raincoat made of paper, drawn in the pose of the lesson's raincoat, with
     printed lines to say it is paper; wet (0..1) darkens it, and patches spread
     from where each drop landed */
  var COAT_PATH = "M-26,-86 L-74,-72 L-96,50 L-70,54 L-60,-24 L-66,92 L66,92 L60,-24 L70,54 L96,50 L74,-72 L26,-86 L0,-50 Z";
  function paperCoat(cx, cy, s, t, lands, wet) {
    var ink = "#B8B0A0", out = "", lines = "";
    for (var k = 0; k < 7; k++) {
      var y = -30 + k * 16;
      lines += L(-48, y, -12, y, "#C9C1B0", 3) + L(12, y, 48, y, "#C9C1B0", 3);
    }
    /* a wet stain: dark in the middle, fading at its edge, so stains that
       meet run together instead of reading as spots */
    var patches = "";
    lands.forEach(function (d) {
      var r = 36 * on(t, d[2], 0.9);
      if (r > 0) patches += C(d[0], d[1], r, "url(#wmWetStain)");
    });
    var stain = el("radialGradient", { id: "wmWetStain" },
      el("stop", { offset: "0", "stop-color": "#5E7489", "stop-opacity": "0.8" }) +
      el("stop", { offset: "0.55", "stop-color": "#5E7489", "stop-opacity": "0.55" }) +
      el("stop", { offset: "1", "stop-color": "#5E7489", "stop-opacity": "0" }));
    out += el("clipPath", { id: "wmPaperCoat" }, Pth(COAT_PATH, "#fff")) + stain +
      Pth(COAT_PATH, P.paper, ink, 3) +
      G(lines + patches + R(-100, -90, 200, 190, 0, "#6F8397", null, null, { opacity: 0.4 * wet }), { "clip-path": "url(#wmPaperCoat)" }) +
      L(0, -50, 0, 92, ink, 2.5) + Pth(COAT_PATH, "none", ink, 3);
    return G(out, { transform: tr(cx, cy, s) });
  }

  function wmJob(scene, beat, t, i) {
    var b = scene.first, out = "";
    var choose = sc(scene, 0, "choose"), props = sc(scene, 0, "props"), science = sc(scene, 0, "science");
    var winAt = sc(scene, 1, "window"), glassAt = sc(scene, 1, "glass"), seeAt = sc(scene, 1, "see");
    var coatAt = sc(scene, 2, "coat"), plasticAt = sc(scene, 2, "plastic"), runsAt = sc(scene, 2, "runs");
    var paperAt = sc(scene, 3, "paper"), soaksAt = sc(scene, 3, "soaks"), wetAt = sc(scene, 3, "wet");
    var rightAt = sc(scene, 4, "right"), jobAt = sc(scene, 4, "job");
    var u = scene.beats.length > 1 ? into(t, b + 1) : 0;

    /* the context step's four things, each with its property */
    if (u < 1) {
      var cards = "";
      JOB_CARDS.forEach(function (c, k) {
        var cx = 176 + k * 272, p = popIn(t, choose == null ? null : choose + k * 0.15, 0.4);
        if (p <= 0) return;
        var lit = bump(t, science == null ? null : science + k * 0.15, 0.8);
        cards += wmCard(cx, 170, 250, 236, { pic: c.pic, size: 110, label: c.label, edge: lit > 0.05 || (science != null && t > science + 0.6) ? "heard" : "",
          s: Math.min(p, 1.1) * (1 + 0.05 * lit), op: Math.min(1, p) });
        cards += wmBadge(cx, 338, c.prop, popIn(t, props == null ? null : props + k * 0.3, 0.35));
      });
      out += G(cards, { opacity: 1 - u });
    }
    if (u <= 0) return svg(out);

    var panels = "";
    /* 1: the window lets the light through */
    var w1 = popIn(t, winAt, 0.45);
    if (w1 > 0) {
      /* the sun at the top right; its light crosses the glass to the floor at the bottom left */
      var x1 = JB.xs[0], beam = on(t, seeAt, 0.9), win = "";
      var sx0 = x1 + 124, sy0 = JB.y - 92, ex = x1 - 104, ey = JB.y + 92;
      win += C(sx0, sy0, 22, P.gold) + C(sx0, sy0, 32, P.gold, null, null, { opacity: 0.25 });
      win += MK.pic(x1, JB.y, 176, PIC.window);
      if (beam > 0) {
        var len = Math.hypot(ex - sx0, ey - sy0), nx = (ey - sy0) / len, ny = -(ex - sx0) / len;
        var px = lerp(sx0, ex, beam), py = lerp(sy0, ey, beam), w0 = 12, w1 = 12 + 18 * beam;
        win += Pth("M" + n2(sx0 + nx * w0) + "," + n2(sy0 + ny * w0) + " L" + n2(px + nx * w1) + "," + n2(py + ny * w1) +
          " L" + n2(px - nx * w1) + "," + n2(py - ny * w1) + " L" + n2(sx0 - nx * w0) + "," + n2(sy0 - ny * w0) + " Z", P.gold, null, null, { opacity: 0.3 });
        win += E(ex + 2, ey + 4, 38, 9, P.gold, null, null, { opacity: 0.55 * on(t, seeAt == null ? null : seeAt + 0.7, 0.4) });
      }
      panels += G(jobPanel(0, "glass", on(t, glassAt, 0.35), win, jobEdge(t, 0, rightAt, jobAt)), { opacity: Math.min(1, w1), transform: around(x1, JB.top + JB.h / 2, Math.min(w1, 1.08)) });
      panels += wmBadge(x1, JB.badgeY, "see-through", popIn(t, seeAt == null ? null : seeAt + 0.4, 0.35));
    }
    /* 2: the raincoat lets the rain run off */
    var w2 = popIn(t, coatAt, 0.45);
    if (w2 > 0) {
      var x2 = JB.xs[1], coat = MK.pic(x2, JB.y + 6, 172, PIC.coat) + coatRain(t, runsAt, x2, JB.y + 6);
      panels += G(jobPanel(1, "plastic", on(t, plasticAt, 0.35), coat, jobEdge(t, 1, rightAt, jobAt)), { opacity: Math.min(1, w2), transform: around(x2, JB.top + JB.h / 2, Math.min(w2, 1.08)) });
      panels += wmBadge(x2, JB.badgeY, "waterproof", popIn(t, runsAt == null ? null : runsAt + 0.6, 0.35));
    }
    /* 3: a paper raincoat soaks it up, and the water comes through */
    var w3 = popIn(t, paperAt, 0.45);
    if (w3 > 0) {
      var x3 = JB.xs[2], cy3 = JB.y + 10, lands = [], drops = "";
      var DX = [-34, 22, -6, 40, -46, 10, 30, -20];
      var DY = [-70, -64, -40, -20, 4, 16, 40, 58];
      for (var k = 0; k < DX.length; k++) {
        var st = soaksAt == null ? null : soaksAt - 0.3 + k * 0.2;
        if (st == null) continue;
        var land = st + 0.4;
        lands.push([DX[k], DY[k], land]);
        if (t >= st && t < land) drops += wmDrop(x3 + DX[k] * 0.86, lerp(JB.top + 20, cy3 + DY[k] * 0.86, ease((t - st) / 0.4)), 8, null, 1);
      }
      var wetU = on(t, soaksAt == null ? null : soaksAt + 0.3, 1.6);
      var drip = "";
      if (soaksAt != null && t > soaksAt + 1.0) {
        for (var d = 0; d < 4; d++) {
          var ph = ((t - soaksAt - 1.0) / 0.9 + d / 4) % 1;
          drip += wmDrop(x3 + [-40, -12, 18, 44][d], cy3 + 82 + 26 * ph * ph, 6, null, 1 - ph);
        }
      }
      var paper = paperCoat(x3, cy3, 0.86, t, lands, wetU) + drops + drip;
      panels += G(jobPanel(2, "paper", 1, paper, jobEdge(t, 2, rightAt, jobAt)), { opacity: Math.min(1, w3) * (1 - 0.4 * on(t, jobAt, 0.5)), transform: around(x3, JB.top + JB.h / 2, Math.min(w3, 1.08)) });
      panels += wmBadge(x3, JB.badgeY, "soaks up water", popIn(t, soaksAt == null ? null : soaksAt + 0.5, 0.35));
      panels += MK.cross(x3, JB.markY, 26, popIn(t, wetAt, 0.4));
    }
    /* the right material for the job */
    panels += MK.tick(JB.xs[0], JB.markY, 26, popIn(t, rightAt, 0.4)) + MK.tick(JB.xs[1], JB.markY, 26, popIn(t, rightAt == null ? null : rightAt + 0.25, 0.4));
    out += G(panels, { opacity: u });
    return svg(out);
  }

  function jobPanel(k, tag, tagO, kids, edge) {
    var cx = JB.xs[k], x = cx - JB.w / 2, tw = tag.length * 19 * 0.56 + 28;
    return R(x, JB.top, JB.w, JB.h, 22, P.cell, edge || P.line, edge ? 4 : 2) + kids +
      (tagO > 0 ? G(R(x + 14, JB.top + 12, tw, 36, 18, "rgba(0,0,0,0.35)") + Tx(x + 14 + tw / 2, JB.top + 37, tag, "lab mid", "middle"), { opacity: tagO }) : "");
  }
  function jobEdge(t, k, rightAt, jobAt) {
    if (jobAt == null || t < jobAt) return null;
    return k < 2 ? P.good : null;
  }

  /* rain on the raincoat: each drop lands on a shoulder, runs down the outside
     of the sleeve, and drips off below it */
  function coatRain(t, at, cx, cy) {
    if (at == null || t < at - 0.2) return "";
    var out = "", S = [-1, 1, -1, 1, -1, 1, -1, 1], X = [-40, 38, -22, 52, -54, 24, -32, 44];
    for (var k = 0; k < S.length; k++) {
      var st = at - 0.2 + k * 0.24, u = t - st;
      if (u < 0) continue;
      var sx = cx + X[k], topY = cy - 56, side = cx + S[k] * 80;
      if (u < 0.35) out += wmDrop(sx, lerp(cy - 118, topY, ease(u / 0.35)), 8, null, 1);
      else if (u < 0.95) {
        var v = (u - 0.35) / 0.6;
        out += wmDrop(lerp(sx, side, Math.min(1, v * 2)), topY + Math.max(0, v * 2 - 1) * 110 + v * 20, 7, null, 1);
      } else if (u < 1.35) {
        var w = (u - 0.95) / 0.4;
        out += wmDrop(side + S[k] * 6 * w, cy + 70 + 50 * w * w, 7, null, 1 - w);
      }
    }
    return out;
  }
