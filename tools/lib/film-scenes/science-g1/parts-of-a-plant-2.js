
  /* ==== chapters: roots and stem, leaves and flower ==============================
     tools/lib/film-scenes/science-g1/parts-of-a-plant-2.js. The lesson's tap
     figure (ART.figure("plant"), the drawing of its "Tap the part" step) for
     two chapters of kind "parts", with the lesson's part list beside it: the
     four names, muted until named, gold while named, green once found, as the
     lesson's own .partlist draws them.

     Rule 3 of the brief: only the part being named wears the lesson's gold
     tap outline (ART.ring), the parts named before it are shown by brightness,
     and the parts not named yet are dimmed to 0.35 (ART.dim). Its job is shown
     ON the part as it is said: water climbing the roots and the stem, the Sun
     on the leaves, seeds falling from the flower. */
  var PP_FIG = { x: 250, y: 6, k: 1.19 };            /* 320 x 360 drawn at 380.8 x 428.4 */
  function ppFX(v) { return PP_FIG.x + v * PP_FIG.k; }
  function ppFY(v) { return PP_FIG.y + v * PP_FIG.k; }
  /* the part list: each name's pill, and where its line ends on the figure */
  var PP_LIST = [
    { id: "flower", y: 112, to: [223, 97] },
    { id: "leaves", y: 196, to: [212, 128] },
    { id: "stem", y: 280, to: [169, 222] },
    { id: "roots", y: 364, to: [181, 286] }
  ];
  /* the lesson's roots (FIGURES.plant draws each as one quadratic), tip last */
  var PP_ROOTS = [
    [[160, 252], [152, 282], [120, 300]], [[160, 252], [170, 286], [206, 302]],
    [[160, 252], [158, 292], [148, 322]], [[160, 256], [180, 282], [172, 316]]
  ];
  function ppQuad(q, u) {
    var v = 1 - u;
    return [v * v * q[0][0] + 2 * u * v * q[1][0] + u * u * q[2][0], v * v * q[0][1] + 2 * u * v * q[1][1] + u * u * q[2][1]];
  }
  /* water's way up the stem to every part: the leaves and the flower */
  var PP_UP = [
    [[160, 250], [160, 200], [116, 150]],
    [[160, 250], [160, 172], [214, 118]],
    [[160, 250], [160, 104]]
  ];

  /* When each part is first named, and which part beat i points at: read from
     the storyboard (art.part and the cue of the same name), never hard-coded. */
  function ppNamedAt(p) {
    for (var b = 0; b < BEATS.length; b++) {
      var a = BEATS[b].art;
      if (a && a.part === p && a.at && a.at[p] != null) return cue(b, p);
    }
    return null;
  }
  function ppPointed(i) {
    for (var b = i; b >= 0 && F.scenes[BEATS[b].scene].kind === "parts"; b--) {
      var a = BEATS[b].art || {};
      if (a.whole) return null;
      if (a.part) return a.part;
    }
    return null;
  }

  function ppPartsChapter(scene, beat, t, i) {
    var k = i - scene.first, out = "", root = scene.id === "rootstem";
    var named = {}, lit = {};
    PP_PARTS.forEach(function (p) { named[p] = ppNamedAt(p); });
    /* "at the bottom": the three parts above the roots dim until they are named */
    var bottom = F.scenes.filter(function (s) { return s.id === "rootstem"; })[0];
    var bottomAt = bottom ? cue(bottom.first, "bottom") : null;
    var wholeAt = scene.id === "leafflower" ? sc(scene, 5, "whole") : null, oneAt = scene.id === "leafflower" ? sc(scene, 5, "one") : null;
    var everyAt = root ? sc(scene, 4, "every") : null;

    /* how bright each part is: named ones whole, the rest at 0.35 */
    var fig = ART.figure("plant");
    PP_PARTS.forEach(function (p) {
      var o = p === "roots" ? 1 : lerp(1, 0.35, on(t, bottomAt, 0.5));
      o = lerp(o, 1, on(t, named[p], 0.45));
      if (p === "leaves" || p === "flower") o = Math.min(1, o + 0.45 * bump(t, everyAt, 1.05));
      lit[p] = o;
    });
    /* The gold tap outline on the ONE part being named. The part named on the
       line before keeps its outline until this line names the next one, and
       the two cross over; "The whole thing" takes the outline off, and "only
       one part" puts it back on the flower. */
    var isWhole = wholeAt != null && i === scene.first + 5;
    var ringP = isWhole ? "flower" : ppPointed(i), ringFrom = isWhole ? oneAt : ringP ? named[ringP] : null;
    var prevP = i - 1 >= scene.first ? ppPointed(i - 1) : null, alpha = {};
    if (isWhole) alpha.flower = Math.max(1 - on(t, wholeAt, 0.35), on(t, oneAt, 0.35));
    else if (ringP) {
      alpha[ringP] = on(t, ringFrom, 0.35);
      if (prevP && prevP !== ringP) alpha[prevP] = 1 - alpha[ringP];
    }
    var widen = bump(t, root ? sc(scene, 3, "stalk") : sc(scene, 3, "colour"), 0.9);
    PP_PARTS.forEach(function (p) {
      if (alpha[p] > 0.004) fig = ART.ring(fig, p, "rgba(244,201,93," + n2(alpha[p]) + ")", 5 + 4.5 * widen * (p === (root ? "stem" : "flower") ? 1 : 0));
    });
    /* Dim AFTER ringing, never before: ART.dim writes its opacity inside the
       part's own <g ...>, and after that ART.ring cannot find the part and
       throws. A part being named is still fading up from 0.35 while its
       outline comes in, so for a moment it is both. */
    PP_PARTS.forEach(function (p) { if (lit[p] < 0.995) fig = ART.dim(fig, p, lit[p]); });
    /* the part wearing the outline now, and when its line started to draw */
    var nowP = null;
    PP_PARTS.forEach(function (p) { if (alpha[p] > 0.5 && (!nowP || alpha[p] > alpha[nowP])) nowP = p; });
    var nowFrom = nowP === "flower" && isWhole && oneAt != null && t >= oneAt ? oneAt : nowP ? named[nowP] : null;

    /* a pool of light behind the whole plant when it is called a plant */
    var whole = on(t, wholeAt, 0.5);
    if (whole > 0) out += MK.glow(ppFX(160), ppFY(175), 200, P.teal, whole * 0.8);
    out += ART.place(fig, PP_FIG.x, PP_FIG.y, 320 * PP_FIG.k, 360 * PP_FIG.k);

    /* ---- roots and stem ---- */
    if (root) {
      var cHere = sc(scene, 0, "whole"), cHold = sc(scene, 1, "hold"), cDrink = sc(scene, 2, "drink"),
        cStraw = sc(scene, 2, "straws"), cUp = sc(scene, 3, "up"), cCarry = sc(scene, 4, "carries");
      /* "Here is the whole plant": a ring round all of it, for its line */
      out += R(ppFX(56), ppFY(14), ppFX(266) - ppFX(56), ppFY(332) - ppFY(14), 34, "none", P.teal, 4,
        { opacity: on(t, cHere, 0.4) * ppOnly(t, scene, 0) * 0.9, "stroke-dasharray": "14 10" });
      /* "at the bottom" */
      out += MK.arrow(ppFX(40), ppFY(150), ppFX(40), ppFY(262), on(t, bottomAt, 0.6) * ppOnly(t, scene, 0), P.gold, 8);
      /* "hold the plant steady": each root pushes down and out into the soil */
      var ho = on(t, cHold, 0.5) * ppOnly(t, scene, 1);
      if (ho > 0) PP_ROOTS.forEach(function (q, n) {
        var a = ppQuad(q, 0.86), b = ppQuad(q, 1), dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
        out += MK.arrow(ppFX(b[0]), ppFY(b[1]), ppFX(b[0] + dx / m * 26), ppFY(b[1] + dy / m * 26), on(t, cHold + n * 0.12, 0.45) * ho, P.gold, 5);
      });
      /* "like straws": each root fills with water from its tip up */
      var st = on(t, cStraw, 1.0);
      if (st > 0) PP_ROOTS.forEach(function (q) {
        var pts = [];
        for (var s = 0; s <= 12; s++) { var pq = ppQuad(q, 1 - s / 12 * st); pts.push(n2(ppFX(pq[0])) + "," + n2(ppFY(pq[1]))); }
        out += Pth("M" + pts.join(" L"), null, "#7FC4EA", 3.5, { opacity: 0.95 });
      });
      /* "drink up water": drops climb the roots, from the soil to the stem */
      if (cDrink != null && t >= cDrink) PP_ROOTS.forEach(function (q, n) {
        for (var d = 0; d < 2; d++) {
          var ph = ((t - cDrink) / 1.5 + n * 0.23 + d * 0.5) % 1, pq = ppQuad(q, 1 - ph);
          out += ppDrop(ppFX(pq[0]), ppFY(pq[1]) + 3, 5, Math.min(1, ph * 5, (1 - ph) * 5, on(t, cDrink, 0.3)));
        }
      });
      /* "holds the plant up" */
      out += MK.arrow(ppFX(188), ppFY(234), ppFX(188), ppFY(170), on(t, cUp, 0.5) * ppOnly(t, scene, 3), P.gold, 7);
      /* "carries the water up, to every part": drops climb the stem and go out
         into the leaves and the flower */
      if (cCarry != null && t >= cCarry) PP_UP.forEach(function (pts, n) {
        var len = polyLen(pts);
        for (var d = 0; d < 3; d++) {
          var ph = ((t - cCarry) / 1.8 + n * 0.17 + d / 3) % 1, pp = polyAt(pts, ph * len);
          out += ppDrop(ppFX(pp[0]), ppFY(pp[1]) + 3, 5, Math.min(1, ph * 6, (1 - ph) * 5, on(t, cCarry, 0.3)));
        }
      });
    }

    /* ---- leaves and flower ---- */
    if (!root) {
      var cFlat = sc(scene, 0, "flat"), cCatch = sc(scene, 1, "catch"), cFood = sc(scene, 1, "food"),
        cOwn = sc(scene, 2, "own"), cSoil = sc(scene, 2, "soil"), cColour = sc(scene, 3, "colour"),
        cSeeds = sc(scene, 4, "seeds"), cNew = sc(scene, 4, "new");
      /* "flat and green" */
      out += MK.glow(ppFX(200), ppFY(128), 120, P.good, bump(t, cFlat, 1.1));
      /* "catch sunlight": the Sun, and its light reaching the leaves */
      var sunO = on(t, cCatch, 0.45) * (1 - ppFrom(t, scene, 3));
      if (sunO > 0) {
        var S = [168, 74];
        out += ppSun(S[0], S[1], 26, sunO, t);
        [[82, 112], [90, 130], [100, 146]].forEach(function (e, n) {
          var u = on(t, cCatch + 0.2 + n * 0.1, 0.6), ex = ppFX(e[0]) - 4, ey = ppFY(e[1]) - 2;
          out += L(S[0] + 30, S[1] + 18, lerp(S[0] + 30, ex, u), lerp(S[1] + 18, ey, u), P.gold, 4,
            { opacity: 0.9 * sunO, "stroke-dasharray": "12 9", "stroke-dashoffset": n2(-(t * 40) % 21) });
        });
        out += MK.glow(ppFX(118), ppFY(150), 70, P.gold, on(t, cCatch + 0.6, 0.5) * sunO * 0.8) +
          MK.glow(ppFX(206), ppFY(128), 64, P.gold, on(t, cCatch + 0.8, 0.5) * sunO * 0.7);
      }
      /* "the plant's food": food made in the leaves, sparkling there */
      var fo = on(t, cFood, 0.4) * (1 - ppFrom(t, scene, 3));
      if (fo > 0) [[106, 136], [124, 164], [96, 118], [204, 124], [224, 106], [190, 146]].forEach(function (s0, n) {
        var tw = 0.45 + 0.55 * breathe(t * 1.3 + n * 0.9), x = ppFX(s0[0]), y = ppFY(s0[1]), r = 9 * tw;
        out += Pth("M" + n2(x) + "," + n2(y - r) + " L" + n2(x + r * 0.3) + "," + n2(y - r * 0.3) + " L" + n2(x + r) + "," + n2(y) +
          " L" + n2(x + r * 0.3) + "," + n2(y + r * 0.3) + " L" + n2(x) + "," + n2(y + r) + " L" + n2(x - r * 0.3) + "," + n2(y + r * 0.3) +
          " L" + n2(x - r) + "," + n2(y) + " L" + n2(x - r * 0.3) + "," + n2(y - r * 0.3) + " Z", "#FFF3B0", null, null, { opacity: fo * popIn(t, cFood + n * 0.08, 0.3) });
      });
      /* its own food, yes; soil, no */
      var two = ppOnly(t, scene, 2);
      out += MK.tick(ppFX(58), ppFY(146), 24, popIn(t, cOwn, 0.35) * two);
      out += MK.cross(ppFX(58), ppFY(298), 24, popIn(t, cSoil, 0.35) * two);
      /* "the colourful part" */
      var burst = bump(t, cColour, 1.4);
      if (burst > 0) for (var d = 0; d < 12; d++) {
        var ang = d * Math.PI / 6 + 0.26, rad = 86 + 30 * on(t, cColour, 1.2);
        out += C(ppFX(160) + Math.cos(ang) * rad, ppFY(95) + Math.sin(ang) * rad * 0.94, 7 + 3 * (d % 2),
          ["#F2A7C4", P.gold, P.plum, P.accent][d % 4], null, null, { opacity: burst });
      }
      /* "makes seeds": seeds fall from the flower; "new plants": each one grows */
      var so = ppOnly(t, scene, 4);
      if (so > 0 && cSeeds != null && t >= cSeeds) [[24, 234], [68, 236], [276, 236]].forEach(function (land, n) {
        var st0 = cSeeds + n * 0.18, u = clamp((t - st0) / 1.0, 0, 1);
        if (t < st0) return;
        var x0 = ppFX(160), y0 = ppFY(98), x1 = ppFX(land[0]), y1 = ppFY(land[1]);
        var x = lerp(x0, x1, u), y = lerp(y0, y1, u) - Math.sin(Math.PI * u) * 70;
        out += ppSeed(x, y, 10, u * 300, so);
        out += G(ppSprout(x1, y1 - 6, 44, on(t, cNew == null ? null : cNew + n * 0.15, 0.8)), { opacity: so });
      });
    }

    /* "The whole thing is a plant": a ring round all of it, and its name */
    if (whole > 0) {
      var wo = whole * (1 - 0.45 * on(t, oneAt, 0.5));
      out += R(ppFX(56), ppFY(14), ppFX(266) - ppFX(56), ppFY(332) - ppFY(14), 34, "none", P.teal, 4, { opacity: wo, "stroke-dasharray": "14 10" });
      out += MK.pill(ppFX(60) - 18, ppFY(14) + 4, "a plant", popIn(t, wholeAt, 0.4) > 0 ? Math.min(1, popIn(t, wholeAt, 0.4)) : 0, { size: 28, col: P.teal, fill: "#123A40" });
    }

    /* the lesson's part list, and a line from the named one to its part */
    var listO = root ? on(t, sc(scene, 0, "whole"), 0.5) : 1;
    PP_LIST.forEach(function (it, n) {
      var o = listO * (root ? on(t, sc(scene, 0, "whole") + n * 0.12, 0.4) : 1);
      if (o <= 0) return;
      var isNow = nowP === it.id, found = named[it.id] != null && t >= named[it.id];
      var col = isNow ? P.gold : found ? P.good : P.line, ink = isNow ? P.ink : found ? P.good : P.muted;
      if (isNow) out += MK.leader(712, it.y, ppFX(it.to[0]), ppFY(it.to[1]), on(t, nowFrom, 0.6), P.gold);
      out += MK.pill(720, it.y, it.id, o, { size: 30, anchor: "start", col: col, ink: ink, fill: isNow ? "#1B3A52" : P.card });
    });
    return svg(out);
  }
