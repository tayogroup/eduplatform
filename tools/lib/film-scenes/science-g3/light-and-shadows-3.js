  /* ==== chapters: big and small shadows, and asking your own question ========
     tools/lib/film-scenes/science-g3/light-and-shadows-3.js. */

  /* ---- big and small shadows --------------------------------------------------
     The lesson's own experiment (ART.sim "shadowSize"), at the three positions
     its two buttons step through: the middle to start, then nearer the torch,
     then nearer the wall. The prediction the step asks for stands beside it,
     and the one the experiment confirms is ticked as the line says it. */
  var LS_SZ = { x: 60, y: 30, w: 608, h: 380, k: 1.9 };
  var LS_SZ_SIZE = [40, 64, 110];        /* the sim's own shadow half-heights */
  var LS_SZ_OX = [220, 160, 100];        /* and where it stands the toy */
  function lsZX(v) { return LS_SZ.x + v * LS_SZ.k; }
  function lsZY(v) { return LS_SZ.y + v * LS_SZ.k; }
  function lsZCard(pos) { return ART.place(ART.sim("shadowSize", "draw", pos), LS_SZ.x, LS_SZ.y, LS_SZ.w, LS_SZ.h); }

  /* which of the sim's three pictures is on screen, and the dissolve between two */
  function lsZPos(t, scene) {
    var m3 = sc(scene, 3, "move"), m4 = sc(scene, 4, "move");
    if (lsPast(t, m4)) return { a: 2, b: 0, u: ease(clamp((t - m4) / 1.1, 0, 1)) };
    if (lsPast(t, m3)) return { a: 1, b: 2, u: ease(clamp((t - m3) / 1.0, 0, 1)) };
    return { a: 1, b: 1, u: 1 };
  }

  function lsSizeChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTorch = c(0, "torch"), cToy = c(0, "toy"), cWall = c(0, "wall");
    var cPredict = c(1, "predict"), cBigger = c(1, "bigger"), cSmaller = c(1, "smaller"), cSame = c(1, "same");
    var cKeep = c(2, "keep"), cOnly = c(2, "only");
    var cMove3 = c(3, "move"), cGrows = c(3, "grows"), cMove4 = c(4, "move"), cShrinks = c(4, "shrinks");
    var cToy5 = c(5, "toy"), cWhere = c(5, "where"), cLight = c(5, "light");
    var p = lsZPos(t, scene), out = "";

    /* the lesson's picture, dissolving from one of its positions to the next */
    out += R(LS_SZ.x - 8, LS_SZ.y - 8, LS_SZ.w + 16, LS_SZ.h + 16, 18, P.card, P.line, 2);
    if (p.u < 1) out += G(lsZCard(p.a), { opacity: n2(1 - p.u) });
    out += G(lsZCard(p.b), p.u < 1 ? { opacity: n2(p.u) } : {});

    /* "a torch, a toy and a wall": each ringed as it is named */
    var toyX = lsZX(lerp(LS_SZ_OX[p.a], LS_SZ_OX[p.b], p.u));
    out += C(lsZX(30), lsZY(104), 54, "none", P.gold, 4, { opacity: n2(bump(t, cTorch, 1.5)) });
    out += C(toyX, lsZY(104), 56, "none", P.gold, 4, { opacity: n2(bump(t, cToy, 1.5)) });
    out += R(lsZX(286), lsZY(6), 28 * LS_SZ.k, 188 * LS_SZ.k, 6, "none", P.gold, 4, { opacity: n2(bump(t, cWall, 1.5)) });

    /* "keep the torch and the wall still. Move only the toy." */
    var keep = on(t, cKeep, 0.4) * lsOnly(t, scene, 2);
    if (keep > 0) {
      out += R(lsZX(8), lsZY(76), 44 * LS_SZ.k, 52 * LS_SZ.k, 10, "none", P.gold, 3, { opacity: n2(keep), "stroke-dasharray": "12 8" });
      out += R(lsZX(284), lsZY(4), 32 * LS_SZ.k, 192 * LS_SZ.k, 10, "none", P.gold, 3, { opacity: n2(keep), "stroke-dasharray": "12 8" });
    }
    var only = on(t, cOnly, 0.5) * lsOnly(t, scene, 2);
    if (only > 0) {
      out += G(MK.arrow(toyX, 320, toyX - 104, 320, only, P.gold, 6) +
        MK.arrow(toyX, 320, toyX + 104, 320, only, P.gold, 6), { opacity: n2(only) });
    }
    /* the toy moving, each way, on its own line */
    out += MK.arrow(430, 106, 252, 106, on(t, cMove3, 0.6) * lsOnly(t, scene, 3), P.gold, 7);
    out += MK.arrow(300, 106, 520, 106, on(t, cMove4, 0.6) * lsOnly(t, scene, 4), P.gold, 7);

    /* how tall the shadow is now, measured off the wall as it grows and shrinks */
    var sz = lerp(LS_SZ_SIZE[p.a], LS_SZ_SIZE[p.b], p.u);
    var top = Math.max(lsZY(6), lsZY(100 - sz)), bot = Math.min(lsZY(194), lsZY(100 + sz)), mid = (top + bot) / 2;
    var gauge = Math.max(on(t, cGrows, 0.5), on(t, cShrinks, 0.5)) * (1 - on(t, cToy5, 0.5));
    if (gauge > 0) {
      out += L(lsZX(312), top, 692, top, P.gold, 3, { opacity: n2(gauge), "stroke-dasharray": "10 8" });
      out += L(lsZX(312), bot, 692, bot, P.gold, 3, { opacity: n2(gauge), "stroke-dasharray": "10 8" });
      out += G(MK.arrow(700, mid, 700, top + 5, 1, P.gold, 6) + MK.arrow(700, mid, 700, bot - 5, 1, P.gold, 6), { opacity: n2(gauge) });
    }

    /* the prediction the lesson's step asks for, and the one the test confirms */
    out += MK.qmark(1116, 60, 28, on(t, cPredict, 0.45) * (1 - on(t, cToy5, 0.5)));
    out += G(MK.list(738, 132, [
      { text: "Get bigger", at: cBigger, mark: "tick", markAt: cGrows },
      { text: "Get smaller", at: cSmaller },
      { text: "Stay the same size", at: cSame }
    ], t, { lh: 84, cls: "lab big" }), { opacity: n2(1 - 0.72 * on(t, cToy5, 0.5)) });

    /* the last line: the toy is the same, its place is not, and that is what
       changes how much of the beam it stands in */
    out += C(toyX, lsZY(104), 58, "none", P.good, 5, { opacity: n2(on(t, cToy5, 0.4)) });
    out += MK.pill(toyX, 356, "same toy", on(t, cToy5, 0.4), { size: 26, col: P.good });
    var wh = on(t, cWhere, 0.5);
    if (wh > 0) {
      out += G(MK.arrow(380, 394, 240, 394, wh, P.gold, 6) + MK.arrow(380, 394, 520, 394, wh, P.gold, 6), { opacity: n2(wh) });
      out += MK.pill(160, 394, "position", wh, { size: 24, col: P.gold });
    }
    var blk = bump(t, cLight, 2.0);
    if (blk > 0) out += el("polygon", { points: n2(lsZX(30)) + "," + n2(lsZY(104)) + " " + n2(toyX) + "," + n2(lsZY(104) - 46) +
      " " + n2(toyX) + "," + n2(lsZY(104) + 46), fill: "none", stroke: P.gold, "stroke-width": 4, opacity: n2(blk) });
    return svg(out);
  }

  /* ---- ask your own question --------------------------------------------------
     The first of the three questions the lesson's ask step offers, and the fair
     test it offers for it: keep the toy and the wall still and move only the
     torch. The lesson's own sim cannot move its torch, so the torch, the toy
     and the wall are drawn here, and the torch really does slide back: the
     shadow shrinks with it, which is the answer the lesson's quiz gives. */
  /* ts is held down by the shadow it throws: a big emoji's own <text> box is
     about 1.67 times its font-size, and at ts 96 the toy's biggest shadow
     measured 15 px past the bottom of the 1168 x 440 space (--sweep). */
  var LS_Q = { ay: 226, wx: 852, ww: 300, wy: 22, wh: 400, toy: 660, ts: 92, half: 176 };
  /* where the torch stands, and the shadow it throws from there */
  function lsQTorch(u) { return lerp(340, 120, clamp(u, 0, 1)); }
  function lsQShadow(tx) {
    var ax = tx + 44, k = (LS_Q.wx + LS_Q.ww / 2 - ax) / (LS_Q.toy - ax);
    return { ax: ax, k: k, size: LS_Q.ts * k };
  }

  function lsQuestionChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cGood = c(0, "good"), cTested = c(0, "tested");
    var cShadow = c(1, "shadow"), cFurther = c(1, "further");
    var cBack = c(2, "back"), cLook = c(2, "look"), cSmaller = c(2, "smaller");
    var u = on(t, cBack, 1.3), tx = lsQTorch(u), s = lsQShadow(tx), out = "";
    var here = lsFrom(t, scene, 0);

    /* the wall, and the light on it */
    out += R(LS_Q.wx, LS_Q.wy, LS_Q.ww, LS_Q.wh, 10, "#4A4640");
    out += el("polygon", { points: n2(s.ax) + "," + n2(LS_Q.ay) + " 1152," + n2(LS_Q.ay - LS_Q.half) +
      " 1152," + n2(LS_Q.ay + LS_Q.half), fill: LS_WALL_LIT, opacity: 0.9 });
    out += R(LS_Q.wx, LS_Q.wy, LS_Q.ww, LS_Q.wh, 10, "none", P.line, 2);
    /* the shadow of the toy, which shrinks as the torch goes back */
    out += lsSilhouette(LS_Q.wx + LS_Q.ww / 2, LS_Q.ay, s.size, "\u{1F9F8}", here);
    /* the toy, and the torch that slides back on its own line */
    out += Em(LS_Q.toy, LS_Q.ay, LS_Q.ts, "\u{1F9F8}");
    out += MK.glow(tx + 34, LS_Q.ay, 62, P.gold, 0.8 * (0.7 + 0.3 * breathe(t)));
    out += Em(tx, LS_Q.ay, 84, "\u{1F526}");

    /* a question you can test */
    var q = on(t, cGood, 0.45) * (1 - on(t, cBack, 0.5));
    out += MK.qmark(748, 92, 38, q * (1 - on(t, cShadow, 0.5)));
    out += MK.tick(146, 92, 32, popIn(t, cTested, 0.4) * (1 - on(t, cBack, 0.5)));
    out += MK.pill(146, 150, "test it", on(t, cTested, 0.4) * (1 - on(t, cBack, 0.5)), { size: 26, col: P.gold });
    /* the question: this shadow, and the torch moving away from it */
    out += C(LS_Q.wx + LS_Q.ww / 2, LS_Q.ay, s.size * 0.6, "none", P.gold, 4, { opacity: n2(bump(t, cShadow, 1.8)) });
    var plan = on(t, cFurther, 0.5) * (1 - on(t, cBack, 0.5));
    if (plan > 0) out += G(MK.arrow(322, 356, 158, 356, plan, P.gold, 7), { opacity: n2(plan) }) +
      MK.pill(240, 402, "move the torch back", plan, { size: 24, col: P.gold });
    /* and look: a line from the wall, and the answer */
    out += MK.leader(1016, 402, 1016, LS_Q.ay + s.size / 2 + 8, on(t, cLook, 0.6), P.gold);
    out += MK.pill(1016, 412, "smaller", on(t, cSmaller, 0.4), { size: 26, col: P.gold });
    return svg(out);
  }
