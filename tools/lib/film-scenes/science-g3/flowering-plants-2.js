  /* ==== chapters: roots and stem, leaves and flower ==============================
     tools/lib/film-scenes/science-g3/flowering-plants-2.js. The lesson's tap
     figure (ART.figure("plant"), the drawing of its "Tap the part" step) for
     two chapters of kind "parts", with the lesson's own part list beside it:
     the four names, and under each the job the lesson's "What each part does"
     step gives it ("anchor, take in water", "holds up, carries water",
     "make food from light", "makes seeds"), written in as it is said.

     Rule 3 of the brief: only the part being named wears the lesson's gold tap
     outline (ART.ring), the parts named before it are shown by brightness, and
     the parts not named yet are dimmed to 0.35 (ART.dim). Its job happens ON
     the part as it is said: the roots grip the soil against the wind, water
     climbs the roots and the stem, the Sun reaches the leaves, seeds fall from
     the flower and grow. */
  var FP_FIG = { x: 248, y: 10, k: 1.17 };           /* 320 x 360 drawn at 374.4 x 421.2 */
  function fpFX(v) { return FP_FIG.x + v * FP_FIG.k; }
  function fpFY(v) { return FP_FIG.y + v * FP_FIG.k; }

  /* the part list: the name, where its line lands on the figure, and the job
     the lesson gives it, written in from the cue that says it */
  var FP_LIST = [
    { id: "flower", y: 92, to: [210, 78], job: "makes seeds", jobAt: "seeds" },
    { id: "leaves", y: 188, to: [222, 112], job: "make food from light", jobAt: "food" },
    { id: "stem", y: 284, to: [170, 205], job: "holds up, carries water", jobAt: "up" },
    { id: "roots", y: 380, to: [196, 296], job: "anchor, take in water", jobAt: "anchor" }
  ];
  /* the lesson's roots (FIGURES.plant draws each as one quadratic), tip last */
  var FP_ROOTS = [
    [[160, 252], [152, 282], [120, 300]], [[160, 252], [170, 286], [206, 302]],
    [[160, 252], [158, 292], [148, 322]], [[160, 256], [180, 282], [172, 316]]
  ];
  function fpQuad(q, u) {
    var v = 1 - u;
    return [v * v * q[0][0] + 2 * u * v * q[1][0] + u * u * q[2][0], v * v * q[0][1] + 2 * u * v * q[1][1] + u * u * q[2][1]];
  }
  /* the way water goes up the stem to every leaf and flower */
  var FP_UP = [
    [[160, 250], [160, 200], [112, 148]],
    [[160, 250], [160, 172], [216, 116]],
    [[160, 250], [160, 104]]
  ];

  /* When each part is first named, and the cue that says its job: read from the
     storyboard (art.part and the cue of that name), never hard-coded. */
  function fpCueOf(part, name) {
    for (var b = 0; b < BEATS.length; b++) {
      var a = BEATS[b].art;
      if (a && a.part === part && a.at && a.at[name] != null) return cue(b, name);
    }
    return null;
  }
  function fpPointed(i) {
    for (var b = i; b >= 0 && F.scenes[BEATS[b].scene].kind === "parts"; b--) {
      var a = BEATS[b].art || {};
      if (a.whole) return null;
      if (a.part) return a.part;
    }
    return null;
  }

  /* wind blowing at the plant: four gusts crossing from the left, over it */
  function fpWind(t, at, o) {
    if (at == null || !(o > 0)) return "";
    var out = "", ys = [86, 158, 230, 302];
    for (var k = 0; k < 4; k++) {
      var u = ((t - at) / 1.3 + k * 0.25) % 1;
      if (u < 0) continue;
      var x = lerp(4, 462, u), y = ys[k], a = Math.sin(Math.PI * u) * o;
      out += Pth("M" + n2(x) + "," + n2(y) + " q56,-16 112,0 q56,16 112,0", null, "#BFE3F5", 7, { opacity: a }) +
        Pth("M" + n2(x + 224) + "," + n2(y) + " q30,-3 26,-22", null, "#BFE3F5", 7, { opacity: a });
    }
    return out;
  }

  function fpPartsChapter(scene, beat, t, i) {
    var out = "", root = scene.id === "rootstem";
    var named = {}, jobs = {}, lit = {};
    FP_PARTS.forEach(function (p) { named[p] = fpCueOf(p, p); });
    FP_LIST.forEach(function (it) { jobs[it.id] = fpCueOf(it.id, it.jobAt); });

    /* "under the soil": the three parts above ground dim until they are named */
    var first = F.scenes.filter(function (s) { return s.id === "rootstem"; })[0];
    var soilAt = first ? cue(first.first, "soil") : null;
    var wholeAt = scene.id === "leafflower" ? sc(scene, 5, "whole") : null;
    var oneAt = scene.id === "leafflower" ? sc(scene, 5, "one") : null;
    var everyAt = root ? sc(scene, 5, "every") : null;

    /* how bright each part is: named ones whole, the rest at 0.35 */
    var fig = ART.figure("plant");
    FP_PARTS.forEach(function (p) {
      var o = p === "roots" ? 1 : lerp(1, 0.35, on(t, soilAt, 0.5));
      o = lerp(o, 1, on(t, named[p], 0.45));
      if (p === "leaves" || p === "flower") o = Math.min(1, o + 0.45 * bump(t, everyAt, 1.05));
      lit[p] = o;
    });
    /* the gold tap outline on the ONE part being named. The part named on the
       line before keeps it until this line names the next, and the two cross
       over; "one part" puts it on the flower, "the whole plant" takes it off. */
    var isWhole = wholeAt != null && i === scene.first + 5;
    var ringP = isWhole ? "flower" : fpPointed(i), ringFrom = isWhole ? oneAt : ringP ? named[ringP] : null;
    var prevP = i - 1 >= scene.first ? fpPointed(i - 1) : null, alpha = {};
    if (isWhole) alpha.flower = on(t, oneAt, 0.35) * (1 - on(t, wholeAt, 0.4));
    else if (ringP) {
      alpha[ringP] = on(t, ringFrom, 0.35);
      if (prevP && prevP !== ringP) alpha[prevP] = 1 - alpha[ringP];
    }
    FP_PARTS.forEach(function (p) {
      if (alpha[p] > 0.004) fig = ART.ring(fig, p, "rgba(244,201,93," + n2(alpha[p]) + ")", 5);
    });
    /* Dim AFTER ringing, never before: ART.dim writes its opacity inside the
       part's own <g ...>, and ART.ring then cannot find the part. */
    FP_PARTS.forEach(function (p) { if (lit[p] < 0.995) fig = ART.dim(fig, p, lit[p]); });
    var nowP = null;
    FP_PARTS.forEach(function (p) { if (alpha[p] > 0.5 && (!nowP || alpha[p] > alpha[nowP])) nowP = p; });
    var nowFrom = nowP === "flower" && isWhole ? oneAt : nowP ? named[nowP] : null;

    /* the wind, before the figure, so it blows behind the plant */
    if (root) out += fpWind(t, sc(scene, 2, "wind"), fpOnly(t, scene, 2));
    var whole = on(t, wholeAt, 0.5);
    if (whole > 0) out += MK.glow(fpFX(160), fpFY(170), 210, P.teal, whole * 0.8);
    out += ART.place(fig, FP_FIG.x, FP_FIG.y, 320 * FP_FIG.k, 360 * FP_FIG.k);

    /* ---- roots and stem ---- */
    if (root) {
      var cHere = sc(scene, 0, "whole"), cAnchor = sc(scene, 1, "anchor"), cHold = sc(scene, 2, "hold"),
        cWind = sc(scene, 2, "wind"), cWater = sc(scene, 3, "water"), cMin = sc(scene, 3, "minerals"),
        cUp = sc(scene, 4, "up"), cCarry = sc(scene, 5, "carries");
      /* "a whole flowering plant": a ring round all of it, for its line */
      out += R(fpFX(56), fpFY(14), fpFX(266) - fpFX(56), fpFY(332) - fpFY(14), 34, "none", P.teal, 4,
        { opacity: on(t, cHere, 0.4) * fpOnly(t, scene, 0) * 0.9, "stroke-dasharray": "14 10" });
      /* "under the soil": the soil lights up, and an arrow points down into it */
      var soil = on(t, soilAt, 0.5) * fpOnly(t, scene, 0);
      if (soil > 0) out += R(FP_FIG.x, fpFY(254), 320 * FP_FIG.k, fpFY(346) - fpFY(254), 0, P.gold, null, null, { opacity: 0.22 * soil });
      out += MK.arrow(fpFX(36), fpFY(190), fpFX(36), fpFY(292), soil, P.gold, 8);
      /* "anchor the plant": each root pushes down and out into the soil */
      var ao = on(t, cAnchor, 0.5) * fpOnly(t, scene, 1);
      if (ao > 0) FP_ROOTS.forEach(function (q, n) {
        var a = fpQuad(q, 0.86), b = fpQuad(q, 1), dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
        out += MK.arrow(fpFX(b[0]), fpFY(b[1]), fpFX(b[0] + dx / m * 24), fpFY(b[1] + dy / m * 24), on(t, cAnchor + n * 0.12, 0.45) * ao, P.gold, 5);
      });
      /* "hold it so well": the roots grip, and the plant does not blow over */
      var ho = on(t, cHold, 0.5) * fpOnly(t, scene, 2);
      if (ho > 0) out += E(fpFX(160), fpFY(288), 72, 46, "none", P.gold, 5, { opacity: ho, "stroke-dasharray": "12 8" });
      out += MK.tick(fpFX(70), fpFY(300), 26, popIn(t, cWind == null ? null : cWind + 1.0, 0.4) * fpOnly(t, scene, 2));
      /* "take in water": drops climb the roots, with specks of the minerals */
      if (cWater != null && t >= cWater) FP_ROOTS.forEach(function (q, n) {
        for (var d = 0; d < 2; d++) {
          var ph = ((t - cWater) / 1.6 + n * 0.23 + d * 0.5) % 1, pq = fpQuad(q, 1 - ph);
          out += fpDrop(fpFX(pq[0]), fpFY(pq[1]) + 3, 5, Math.min(1, ph * 5, (1 - ph) * 5, on(t, cWater, 0.3)) * fpOnly(t, scene, 3));
          if (cMin != null && t >= cMin) out += C(fpFX(pq[0]) + 9, fpFY(pq[1]) - 6, 3.5, P.gold, null, null,
            { opacity: Math.min(1, ph * 5, (1 - ph) * 5) * on(t, cMin, 0.4) * fpOnly(t, scene, 3) });
        }
      });
      out += MK.pill(88, 300, "water", on(t, cWater, 0.4) * fpOnly(t, scene, 3), { size: 26, col: "#7FC4EA" });
      out += MK.pill(88, 356, "minerals", on(t, cMin, 0.4) * fpOnly(t, scene, 3), { size: 26, col: P.gold });
      /* "holds the plant up towards the light" */
      var upO = fpOnly(t, scene, 4);
      out += MK.arrow(fpFX(196), fpFY(238), fpFX(196), fpFY(168), on(t, cUp, 0.5) * upO, P.gold, 7);
      out += fpSun(124, 92, 32, on(t, cUp == null ? null : cUp + 0.3, 0.5) * upO, t);
      [[96, 122], [112, 150]].forEach(function (e, n) {
        var u = on(t, cUp == null ? null : cUp + 0.5 + n * 0.12, 0.6) * upO;
        out += L(160, 116, lerp(160, fpFX(e[0]), u), lerp(116, fpFY(e[1]), u), P.gold, 4,
          { opacity: 0.9 * upO, "stroke-dasharray": "12 9" });
      });
      /* "carries that water to every leaf and flower" */
      if (cCarry != null && t >= cCarry) FP_UP.forEach(function (pts, n) {
        var len = polyLen(pts);
        for (var d = 0; d < 3; d++) {
          var ph = ((t - cCarry) / 1.9 + n * 0.17 + d / 3) % 1, pp = polyAt(pts, ph * len);
          out += fpDrop(fpFX(pp[0]), fpFY(pp[1]) + 3, 5, Math.min(1, ph * 6, (1 - ph) * 5, on(t, cCarry, 0.3)));
        }
      });
    }

    /* ---- leaves and flower ---- */
    if (!root) {
      var cLeaves = sc(scene, 0, "leaves"), cFlat = sc(scene, 0, "flat"), cLight = sc(scene, 0, "light"),
        cCatch = sc(scene, 1, "catch"), cFood = sc(scene, 1, "food"),
        cSoil = sc(scene, 2, "soil"), cMade = sc(scene, 2, "made"),
        cFlower = sc(scene, 3, "flower"), cPetals = sc(scene, 3, "petals"), cInsects = sc(scene, 3, "insects"),
        cSeeds = sc(scene, 4, "seeds"), cNew = sc(scene, 4, "new");
      /* "wide and flat": both leaf blades light up, and the words point at the
         left one from the empty side. A width arrow across the two leaf tips
         was tried and removed: in this drawing the flower sits BETWEEN the
         leaves (its petals run to y 160), so the arrow measured the flower
         while the line talked about the leaves. */
      var flatO = on(t, cFlat, 0.5) * fpOnly(t, scene, 0);
      if (flatO > 0) {
        out += MK.glow(fpFX(116), fpFY(156), 78, P.good, flatO * 0.95);
        out += MK.glow(fpFX(228), fpFY(104), 56, P.good, flatO * 0.95);
        out += MK.leader(324, 166, fpFX(110), fpFY(158), flatO, P.gold);
        out += MK.pill(96, 166, "wide and flat", flatO, { size: 26, anchor: "start", col: P.gold });
      }
      /* "as much light as they can": the light gathers on those flat blades */
      var wo = on(t, cLight, 0.5) * fpOnly(t, scene, 0);
      if (wo > 0) {
        out += MK.glow(fpFX(116), fpFY(156), 100, P.gold, wo * (0.7 + 0.3 * breathe(t)));
        out += MK.glow(fpFX(228), fpFY(104), 74, P.gold, wo * (0.7 + 0.3 * breathe(t)));
      }
      /* "catch sunlight": the Sun, and its light reaching the leaves */
      var sunO = on(t, cCatch, 0.45) * (1 - fpFrom(t, scene, 3));
      if (sunO > 0) {
        var S = [140, 96];
        out += fpSun(S[0], S[1], 30, sunO, t);
        [[86, 112], [96, 134], [108, 152]].forEach(function (e, n) {
          var u = on(t, cCatch + 0.2 + n * 0.1, 0.6), ex = fpFX(e[0]) - 4, ey = fpFY(e[1]) - 2;
          out += L(S[0] + 34, S[1] + 20, lerp(S[0] + 34, ex, u), lerp(S[1] + 20, ey, u), P.gold, 4,
            { opacity: 0.9 * sunO, "stroke-dasharray": "12 9" });
        });
        out += MK.glow(fpFX(116), fpFY(148), 72, P.gold, on(t, cCatch + 0.6, 0.5) * sunO * 0.8) +
          MK.glow(fpFX(206), fpFY(126), 66, P.gold, on(t, cCatch + 0.8, 0.5) * sunO * 0.7);
      }
      /* "the plant's food": food made in the leaves, sparkling there */
      var fo = Math.max(on(t, cFood, 0.4) * fpOnly(t, scene, 1), on(t, cMade, 0.4) * fpOnly(t, scene, 2));
      if (fo > 0) [[104, 134], [122, 160], [94, 116], [202, 122], [222, 104], [190, 142]].forEach(function (s0, n) {
        var tw = 0.45 + 0.55 * breathe(t * 1.3 + n * 0.9);
        out += fpSpark(fpFX(s0[0]), fpFY(s0[1]), 9 * tw, "#FFF3B0", fo * popIn(t, (cFood == null ? cMade : cFood) + n * 0.08, 0.3));
      });
      /* "Roots do not eat soil. The food is made in the leaves." */
      var two = fpOnly(t, scene, 2);
      out += MK.cross(fpFX(30), fpFY(300), 26, popIn(t, cSoil, 0.35) * two);
      out += MK.tick(fpFX(30), fpFY(140), 26, popIn(t, cMade, 0.35) * two);
      /* "bright petals attract insects": colour round the flower, and a bee */
      var burst = bump(t, cPetals, 1.4);
      if (burst > 0) for (var d = 0; d < 12; d++) {
        var ang = d * Math.PI / 6 + 0.26, rad = 88 + 30 * on(t, cPetals, 1.2);
        out += C(fpFX(160) + Math.cos(ang) * rad, fpFY(95) + Math.sin(ang) * rad * 0.94, 7 + 3 * (d % 2),
          ["#F2A7C4", P.gold, P.plum, P.accent][d % 4], null, null, { opacity: burst });
      }
      /* the bee comes in from the left, over the empty half, and stays at the
         flower through the seeds line: the lesson's insects, then its seeds */
      var bee = on(t, cInsects, 0.4) * (1 - fpFrom(t, scene, 5));
      if (bee > 0) {
        var bu = clamp((t - cInsects) / 0.9, 0, 1);
        out += Em(lerp(60, fpFX(206), bu), lerp(120, fpFY(66), bu) - Math.sin(bu * Math.PI) * 26, 62, "\u{1F41D}",
          { opacity: bee, transform: "translate(0," + n2(bu >= 1 ? 6 * Math.sin(t * 4) : 0) + ")" });
      }
      /* "makes seeds": seeds fall from the flower; "new plants": each one grows */
      var so = fpOnly(t, scene, 4);
      if (so > 0 && cSeeds != null && t >= cSeeds) [[38, 270], [78, 272], [272, 272]].forEach(function (land, n) {
        var st0 = cSeeds + n * 0.18, u = clamp((t - st0) / 1.0, 0, 1);
        if (t < st0) return;
        var x0 = fpFX(160), y0 = fpFY(98), x1 = fpFX(land[0]), y1 = fpFY(land[1]);
        var x = lerp(x0, x1, u), y = lerp(y0, y1, u) - Math.sin(Math.PI * u) * 70;
        out += fpSeed(x, y, 14, u * 300, so);
        out += G(fpSprout(x1, y1 - 6, 58, on(t, cNew == null ? null : cNew + n * 0.15, 0.8)), { opacity: so });
      });
    }

    /* "not the whole plant": a ring round all of it, and its name */
    if (whole > 0) {
      out += R(fpFX(56), fpFY(14), fpFX(266) - fpFX(56), fpFY(332) - fpFY(14), 34, "none", P.teal, 4,
        { opacity: whole, "stroke-dasharray": "14 10" });
      out += MK.pill(fpFX(60) - 16, fpFY(14) - 4, "the whole plant", Math.min(1, popIn(t, wholeAt, 0.4)), { size: 26, col: P.teal, fill: "#123A40" });
    }

    /* the lesson's part list, each with the job the lesson gives it */
    var listO = root ? on(t, sc(scene, 0, "whole"), 0.5) : 1;
    FP_LIST.forEach(function (it, n) {
      var o = listO * (root ? on(t, sc(scene, 0, "whole") + n * 0.12, 0.4) : 1);
      if (o <= 0) return;
      var isNow = nowP === it.id, found = named[it.id] != null && t >= named[it.id];
      var col = isNow ? P.gold : found ? P.good : P.line, ink = isNow ? P.ink : found ? P.good : P.muted;
      if (isNow) out += MK.leader(728, it.y, fpFX(it.to[0]), fpFY(it.to[1]), on(t, nowFrom, 0.6), P.gold);
      out += MK.pill(736, it.y, it.id, o, { size: 30, anchor: "start", col: col, ink: ink, fill: isNow ? "#1B3A52" : P.card });
      var jo = on(t, jobs[it.id], 0.5);
      if (jo > 0) out += Tx(744, it.y + 40, it.job, "lab mid muted readable", "start", { opacity: jo });
    });
    return svg(out);
  }
