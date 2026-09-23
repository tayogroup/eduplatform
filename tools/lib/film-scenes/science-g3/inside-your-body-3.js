  /* ==== chapters: the stomach and the intestine, and the diagram ===============
     tools/lib/film-scenes/science-g3/inside-your-body-3.js. The gut chapter
     watches food go down the lesson's own drawing of it: a window onto the
     stomach and the intestine of ART.figure("organs"), with the food swallowed
     into the bag, churned to mush, and the goodness crossing the wall of the
     long coiled tube. The diagram chapter is the lesson's "Label a diagram of
     the organs" step: five labels leave the tray and land beside their organ. */

  /* the window onto the gut, and the lesson's own intestine as a line of points
     (read off the coil's own path in FIGURES.organs) */
  var IB_GUT_V = { x: 26, y: 232, w: 200, h: 200 }, IB_GUT_B = { x: 470, y: 32, w: 330, h: 330 };
  function ibGX(px) { return ibWX(IB_GUT_V, IB_GUT_B, px); }
  function ibGY(py) { return ibWY(IB_GUT_V, IB_GUT_B, py); }
  /* the coil, segment by segment, exactly as the lesson's path draws it:
     M80,320 q60,-10 60,20  q0,26 -50,20  q-30,0 -20,26  q10,20 60,12  q40,-6 50,16
     as [start, control, end] in the figure's own 260 x 420 space */
  var IB_COIL_Q = [
    [[80, 320], [140, 310], [140, 340]], [[140, 340], [140, 366], [90, 360]],
    [[90, 360], [60, 360], [70, 386]], [[70, 386], [80, 406], [130, 398]],
    [[130, 398], [170, 392], [180, 414]]
  ];
  function ibQuad(q, u) {
    var v = 1 - u;
    return [v * v * q[0][0] + 2 * u * v * q[1][0] + u * u * q[2][0],
            v * v * q[0][1] + 2 * u * v * q[1][1] + u * u * q[2][1]];
  }
  /* the middle of the tube as a fine line of points in the film's space, so a
     lump of mush travels ALONG the coil rather than cutting across it */
  function ibCoil() {
    var pts = [];
    IB_COIL_Q.forEach(function (q, n) {
      for (var k = n ? 1 : 0; k <= 8; k++) { var p = ibQuad(q, k / 8); pts.push([ibGX(p[0]), ibGY(p[1])]); }
    });
    return pts;
  }
  var IB_BAG = [164, 318];

  function ibGutChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSwallow = c(0, "swallow"), cStom = c(0, "stomach");
    var cBag = c(1, "bag"), cChurn = c(1, "churn"), cMush = c(1, "mush");
    var cNot = c(2, "not"), cOne = c(2, "one"), cRibs = c(2, "ribs");
    var cMoves = c(3, "moves"), cTube = c(3, "tube");
    var cGood = c(4, "goodness"), cWalls = c(4, "walls"), cBlood = c(4, "blood");
    var out = "", coil = ibCoil(), bag = [ibGX(IB_BAG[0]), ibGY(IB_BAG[1])];

    /* ---- the body on the left ---- */
    var lit = { brain: 0.3, lungs: 0.3, heart: 0.3 };
    lit.stomach = lerp(0.35, 1, on(t, cStom, 0.45));
    lit.intestine = lerp(0.35, 1, on(t, cMoves, 0.45));
    var ring = { stomach: on(t, cStom, 0.4) * (1 - on(t, cMoves, 0.4)), intestine: on(t, cMoves, 0.4) };
    out += ibBodyCard(ibBody({ ring: ring, lit: lit }));

    /* ---- the window onto the gut ---- */
    out += ibWindowCard(IB_GUT_B);
    out += ibWindow(ibBody({ ring: ring, lit: { brain: 0.3, lungs: 0.3, heart: 0.3 } }), IB_GUT_V, IB_GUT_B);

    /* "not your whole tummy": the whole of the window is the tummy, and it is
       crossed; then the one bag is lit and ticked, under the ribs */
    var third = ibOnly(t, scene, 2);
    if (third > 0.01) {
      var big = on(t, cNot, 0.45) * (1 - on(t, cOne, 0.5)) * third;
      if (big > 0) {
        out += R(IB_GUT_B.x + 8, IB_GUT_B.y + 8, IB_GUT_B.w - 16, IB_GUT_B.h - 16, 18, P.bad, P.bad, 3,
          { opacity: 0.34 * big, "fill-opacity": 0.42 });
        out += MK.cross(IB_GUT_B.x + IB_GUT_B.w / 2, IB_GUT_B.y + IB_GUT_B.h - 58, 32,
          popIn(t, cNot == null ? null : cNot + 0.3, 0.4) * big);
      }
      var one = on(t, cOne, 0.45) * third;
      if (one > 0) out += MK.glow(bag[0], bag[1], 84, P.good, one * 0.95) +
        MK.tick(bag[0] + 74, bag[1] - 54, 24, popIn(t, cOne == null ? null : cOne + 0.2, 0.4) * one);
      var rb = bump(t, cRibs, 1.3) * third;
      if (rb > 0) for (var r = 0; r < 3; r++)
        out += Pth("M" + n2(ibGX(92)) + "," + n2(ibGY(246 + r * 15)) + " Q" + n2(ibGX(130)) + "," + n2(ibGY(268 + r * 15)) + " " + n2(ibGX(168)) + "," + n2(ibGY(246 + r * 15)),
          null, P.gold, 5, { opacity: rb });
    }

    /* "When you swallow": the tube down from the mouth, and one lump of food */
    var sw = on(t, cSwallow, 0.4) * ibOnly(t, scene, 0);
    if (sw > 0) {
      out += L(bag[0], 16, bag[0], bag[1] - 30, P.gold, 4, { opacity: sw * 0.7, "stroke-dasharray": "11 9" });
      var u = on(t, cSwallow == null ? null : cSwallow + 0.15, 1.1);
      if (u > 0) out += ibFood(bag[0], lerp(20, bag[1], u), 15, sw, "#C98A3E", 2);
    }

    /* "a stretchy bag ... churns the food into mush" */
    var churn = on(t, cBag, 0.5) * (1 - into(t, scene.first + 3));
    if (churn > 0) {
      var sq = 1 + 0.07 * Math.sin((t - cBag) * 3.4);
      out += E(bag[0], bag[1], 48 * sq, 44 / sq, "none", P.gold, 4, { opacity: churn * 0.9 });
      var ch = on(t, cChurn, 0.5) * churn, mu = on(t, cMush, 0.5) * churn;
      if (ch > 0) for (var k = 0; k < 7; k++) {
        var a = (t - cChurn) * 1.9 + k * 2 * Math.PI / 7, rr = 12 + 18 * IB_SCATTER[k];
        out += ibFood(bag[0] + Math.cos(a) * rr, bag[1] + Math.sin(a) * rr * 0.84, 7 + 4 * IB_SCATTER[k + 3], ch, mu > 0.5 ? "#A9752F" : "#C98A3E", k);
      }
      if (mu > 0) out += MK.pill(bag[0], bag[1] - 78, "mush", mu, { size: 26, col: P.gold });
    }

    /* "the mush moves into the intestine, a long coiled tube" */
    var move = on(t, cMoves, 0.5);
    if (move > 0) {
      var tb = on(t, cTube, 0.6);
      if (tb > 0) {
        var d = "M" + n2(coil[0][0]) + "," + n2(coil[0][1]);
        for (var q = 1; q < coil.length; q++) d += " L" + n2(coil[q][0]) + "," + n2(coil[q][1]);
        out += Pth(d, null, P.gold, 6, { opacity: tb * 0.75, "stroke-dasharray": "12 9" });
      }
      var len = polyLen(coil);
      for (var m = 0; m < 5; m++) {
        var ph = (((t - cMoves) / 5.2) + m * 0.2) % 1, p = polyAt(coil, ph * len);
        out += ibFood(p[0], p[1], 9, move, "#A9752F", m + 1);
      }
    }

    /* "The goodness passes through its walls and into your blood" */
    var gd = on(t, cGood, 0.5);
    if (gd > 0) {
      /* a blood vessel beside the tube, for the goodness to cross into */
      out += R(1060, 70, 32, 300, 16, "#6E2A26", "#A83A33", 3, { opacity: gd });
      for (var g = 0; g < 6; g++) {
        var pool = [1076, 150 + g * 28];
        var start = polyAt(coil, (0.12 + g * 0.15) * polyLen(coil)), born = cGood + 0.15 + g * 0.2;
        if (t < born) continue;
        var v = clamp((t - born) / 1.6, 0, 1);
        if (v >= 1) continue;                          /* it has gone into the blood */
        var x = lerp(start[0], pool[0], ease(v)), y = lerp(start[1], pool[1], ease(v));
        if (v < 0.4) out += C(x, y, 8, P.gold, null, null, { opacity: gd });
        else out += ibDrop(x, y, 8, gd);
      }
      var wl = bump(t, cWalls, 1.3), mid = coil[Math.floor(coil.length * 0.45)];
      if (wl > 0) out += C(mid[0], mid[1], 20 + 16 * wl, "none", P.gold, 4, { opacity: wl });
      out += MK.pill(1160, 404, "into your blood", on(t, cBlood, 0.5), { size: 22, anchor: "end", col: P.bad });
    }

    /* the two names, each with a line to the lesson's own drawing of it */
    out += ibLabel(t, 832, 108, "stomach", cStom, [bag[0] + 42, bag[1] - 20], ring.stomach > 0.5, 28);
    out += ibLabel(t, 832, 340, "intestine", cMoves, coil[coil.length - 1], ring.intestine > 0.5, 28);
    return svg(out);
  }

  /* ==== chapter: a diagram is a model ================================================
     The lesson's "Label a diagram of the organs" step, as the child is about to
     meet it: five labels wait in a tray, and each flies to its organ as it is
     named. Beat 0 is why a model is needed at all - we cannot look inside. */
  var IB_TRAY = { x: 890, y: 36, w: 256, h: 368 };
  var IB_LABELS = [
    { id: "brain", y: 60 }, { id: "lungs", y: 150 }, { id: "heart", y: 224 },
    { id: "stomach", y: 300 }, { id: "intestine", y: 376 }
  ];
  var IB_SLOT_X = 912, IB_TARGET_X = 404;

  function ibDiagramChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cCannot = c(0, "cannot"), cModels = c(0, "models");
    var cDiagram = c(1, "diagram"), cDrawing = c(1, "drawing");
    var cFive = c(2, "five"), cBody = c(2, "body");
    var cDone = c(3, "done");
    var out = "", lit = {}, placed = {};
    IB_LABELS.forEach(function (l) { placed[l.id] = c(3, l.id); });

    /* beat 0 takes the organs out of sight again, and "use models" brings them back */
    var hide = on(t, cCannot, 0.5) * (1 - on(t, cModels, 0.5));
    IB_IDS.forEach(function (p) { lit[p] = lerp(1, 0.08, hide); });
    out += ibBodyCard(ibBody({ lit: lit }));

    var first = ibOnly(t, scene, 0);
    if (first > 0.01) {
      out += ibNoLook(700, 168, 150, on(t, cCannot, 0.45) * first * (1 - on(t, cModels, 0.4)));
      out += MK.pill(700, 300, "models", popIn(t, cModels, 0.45) * first, { size: 42, col: P.blue });
    }

    /* beat 1: a diagram is one of them - a drawing with labels */
    var second = ibOnly(t, scene, 1);
    if (second > 0.01) {
      out += MK.pill(700, 150, "diagram", popIn(t, cDiagram, 0.45) * second, { size: 42, col: P.blue });
      var dr = on(t, cDrawing, 0.5) * second;
      if (dr > 0) out += Tx(700, 246, "a drawing", "lab big muted", "middle", { opacity: dr }) +
        Tx(700, 290, "with labels", "lab big muted", "middle", { opacity: dr });
    }

    /* the tray, from "a drawing with labels" on */
    var tray = on(t, cDrawing, 0.6);
    if (tray > 0.01) {
      out += R(IB_TRAY.x, IB_TRAY.y, IB_TRAY.w, IB_TRAY.h, 22, P.card, P.line, 2, { opacity: tray });
      out += Tx(IB_TRAY.x + IB_TRAY.w / 2, IB_TRAY.y + 34, "labels", "lab mid muted", "middle", { opacity: tray });
    }

    IB_LABELS.forEach(function (l, n) {
      /* 76 + 64n keeps the fifth pill (h = 28 * 1.8) clear inside the tray:
         its bottom is 368 + 26 = 394 against the tray's own 404, and the
         first one's top clears the word "labels" above it. */
      var slotY = IB_TRAY.y + 76 + n * 64;
      var word = on(t, cFive == null ? null : cFive + n * 0.13, 0.4) * tray;
      var fly = on(t, placed[l.id], 0.55);
      if (word <= 0 && fly <= 0) return;
      var x = lerp(IB_SLOT_X, IB_TARGET_X, ease(fly)), y = lerp(slotY, l.y, ease(fly));
      if (fly >= 1) out += MK.leader(IB_TARGET_X - 8, l.y, ibAt(l.id)[0], ibAt(l.id)[1], on(t, placed[l.id] + 0.25, 0.5), P.gold);
      out += MK.pill(x, y, ibOrgan(l.id).label, Math.max(word, fly > 0 ? 1 : 0),
        { size: 28, anchor: "start", col: fly > 0.5 ? P.gold : P.line });
    });

    /* "Today you will put five labels on a picture of the body" */
    var third = ibOnly(t, scene, 2);
    if (third > 0.01) {
      var bo = on(t, cBody, 0.5) * third;
      if (bo > 0) out += R(ibFX(34), ibFY(16), ibFX(228) - ibFX(34), ibFY(412) - ibFY(16), 40, "none", P.blue, 4,
        { opacity: bo * 0.9, "stroke-dasharray": "14 11" });
    }

    /* "That is a diagram." */
    var done = popIn(t, cDone, 0.45);
    if (done > 0) out += MK.tick(700, 196, 34, done) +
      MK.pill(700, 286, "a diagram", Math.min(1, done), { size: 34, col: P.good });
    return svg(out);
  }
