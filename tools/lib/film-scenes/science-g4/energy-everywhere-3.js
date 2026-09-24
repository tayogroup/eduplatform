  /* ==== chapters: where the energy goes, leaking out, recording it, the recap ====
     tools/lib/film-scenes/science-g4/energy-everywhere-3.js. */

  /* ---- where the energy goes ----------------------------------------------------
     The lesson's OWN sim, ART.sim("energyDrop", "draw", n, y): the drawing its
     "Drop the ball" button steps through, with the marked scale on the left and
     the ball / sound / warmth bars on the right. Its bars always total 100, so
     the film never has to draw energy as a substance: it shows how much of it
     is where. The ball is the sim's own ball, moved by redrawing the sim at the
     y that frame needs. Marks laid over the sim are drawn in its own dark ink,
     because its card is cream and gold would vanish on it. */
  var EE_SIM = { x: 440, y: 14, w: 600, h: 412.5, k: 1.875 };
  function eeSX(v) { return EE_SIM.x + v * EE_SIM.k; }
  function eeSY(v) { return EE_SIM.y + v * EE_SIM.k; }
  var EE_INK = "#1B1B1B";
  var EE_PEAK = [164, 74, 104, 134];         /* the floor, then the three bounce peaks */

  function eeSeg(t, t0, t1, y0, y1, down) {
    var u = clamp((t - t0) / Math.max(t1 - t0, 0.001), 0, 1);
    return lerp(y0, y1, down ? u * u : 1 - (1 - u) * (1 - u));
  }
  /* the ball's height in the sim's own coordinates, as a pure function of t */
  function eeBallY(t, K) {
    if (K.fall == null || K.thud == null || K.two == null || K.three == null) return 44;
    if (t < K.fall) return 44;
    if (t < K.fall + 1.1) return eeSeg(t, K.fall, K.fall + 1.1, 44, 164, 1);
    if (t < K.thud) return 164;
    if (t < K.thud + 0.55) return eeSeg(t, K.thud, K.thud + 0.55, 164, EE_PEAK[1], 0);
    if (t < K.two - 0.65) return EE_PEAK[1];
    if (t < K.two) return eeSeg(t, K.two - 0.65, K.two, EE_PEAK[1], 164, 1);
    if (t < K.two + 0.55) return eeSeg(t, K.two, K.two + 0.55, 164, EE_PEAK[2], 0);
    if (t < K.three - 0.65) return EE_PEAK[2];
    if (t < K.three) return eeSeg(t, K.three - 0.65, K.three, EE_PEAK[2], 164, 1);
    if (t < K.three + 0.55) return eeSeg(t, K.three, K.three + 0.55, 164, EE_PEAK[3], 0);
    return EE_PEAK[3];
  }
  function eeBounceN(t, K) {
    if (K.thud == null) return 0;
    return t >= K.three ? 3 : t >= K.two ? 2 : t >= K.thud ? 1 : 0;
  }
  /* the sim's own bar widths at bounce n, in sim units (ball, sound, warmth) */
  function eeBars(n) {
    var ball = [4, 3, 2, 1][n] * 25, lost = 100 - ball, sound = Math.round(lost * 0.4);
    return [ball, sound, lost - sound];
  }
  /* a pill hung on the left of the stage, with a line to the thing it names */
  function eeLeft(t, y, text, at, to, size, col) {
    var o = on(t, at, 0.4);
    if (!(o > 0)) return "";
    var s = size || 26, w = String(text).length * s * 0.56 + s * 1.3;
    return (to ? MK.leader(30 + w + 12, y, to[0], to[1], on(t, at, 0.7), col || P.gold) : "") +
      MK.pill(30, y, text, o, { size: s, anchor: "start", col: col || P.gold });
  }

  function eeBounceChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var K = { fall: c(1, "falls"), thud: c(2, "thud"), two: c(3, "two"), three: c(4, "three") };
    var cDrop = c(0, "drop"), cPredict = c(0, "predict");
    var cHigh = c(1, "high"), cStored = c(1, "stored"), cMove = c(1, "movement");
    var cThree = c(2, "three"), cMarks = c(3, "marks"), cOne = c(4, "one");
    var cSound = c(3, "sound"), cLower = c(4, "lower");
    var cVanish = c(5, "vanished"), cBars = c(5, "bars"), cTotal = c(5, "add");

    var y = eeBallY(t, K), n = eeBounceN(t, K), out = "";
    out += R(430, 4, 620, 432, 20, P.card, P.line, 2);
    out += ART.place(ART.sim("energyDrop", "draw", n, y), EE_SIM.x, EE_SIM.y, EE_SIM.w, EE_SIM.h);

    var ballX = eeSX(90), ballY = eeSY(y), ballR = 16 * EE_SIM.k;
    /* "drop a ball": the held ball is picked out */
    out += C(ballX, ballY, ballR + 9 + 4 * bump(t, cDrop, 0.9), "none", EE_INK, 3,
      { opacity: on(t, cDrop, 0.4) * (1 - on(t, cVanish, 0.6)) });
    out += MK.ripple(ballX, ballY, t, cDrop, EE_INK);

    /* the prediction, before anything is dropped */
    var first = eeOnly(t, scene, 0);
    out += MK.bubble(26, 118, 386, 118, "Lower each time?", on(t, cPredict, 0.45) * first, null, null);
    out += MK.qmark(372, 108, 28, popIn(t, cPredict == null ? null : cPredict + 0.4, 0.4) * first);

    /* the lesson's two names for the ball's energy */
    out += eeLeft(t, 60, "stored energy", cStored, [eeSX(90) - 36, eeSY(44)], 26, P.gold);
    /* where it was let go: 4 marks up, which is the store */
    out += C(ballX, eeSY(44), ballR + 8, "none", EE_INK, 2.5,
      { opacity: on(t, cHigh, 0.5) * 0.75, "stroke-dasharray": "9 8" });
    out += C(ballX, eeSY(44), ballR + 14, "none", EE_INK, 3, { opacity: bump(t, cHigh, 1.1) });
    out += eeLeft(t, 132, "movement energy", cMove, [ballX - 34, ballY], 26, P.gold);

    /* thud: the bounce is heard */
    out += MK.waves(eeSX(90), eeSY(176), t, K.thud, { dir: -Math.PI / 2, spread: 1.5, n: 3, period: 0.9, reach: 90, col: EE_INK, until: K.thud == null ? null : K.thud + 1.1 });
    out += MK.ripple(eeSX(90), eeSY(178), t, K.thud, EE_INK);
    out += MK.ripple(eeSX(90), eeSY(178), t, K.two, EE_INK);
    out += MK.ripple(eeSX(90), eeSY(178), t, K.three, EE_INK);

    /* the mark each bounce reaches, ringed on the sim's own scale */
    var markAt = [cThree, cMarks, cOne], markY = [90, 120, 150];
    for (var m = 0; m < 3; m++) {
      var mo = on(t, markAt[m], 0.35) * (m === 2 ? 1 : 1 - on(t, markAt[m + 1], 0.35));
      if (mo <= 0) continue;
      out += C(eeSX(169), eeSY(markY[m]), 17, "none", EE_INK, 3, { opacity: mo });
    }
    /* "lower than the last": the three heights, side by side */
    var low = on(t, cLower, 0.9);
    if (low > 0) {
      var pts = "";
      for (var q = 0; q < 3; q++) {
        var ly = eeSY(EE_PEAK[q + 1]);
        out += L(eeSX(18), ly, eeSX(60), ly, EE_INK, 4, { opacity: low });
        pts += (q ? " L" : "M") + n2(eeSX(39)) + "," + n2(ly);
      }
      out += Pth(pts, null, EE_INK, 3, { opacity: low, "stroke-dasharray": "9 7" });
    }

    /* the bars: sound and warmth grow as the ball's share falls */
    var bars = eeBars(n), bx = eeSX(200);
    var soundO = Math.max(on(t, cSound, 0.5) * eeOnly(t, scene, 3), on(t, cBars, 0.5));
    var barsO = on(t, cBars, 0.5);
    for (var b = 0; b < 3; b++) {
      var o = b === 0 ? barsO : Math.max(soundO, barsO);
      if (o <= 0) continue;
      out += R(bx - 3, eeSY(30 + b * 50) - 3, bars[b] * EE_SIM.k + 6, 22 * EE_SIM.k + 6, 6, "none", EE_INK, 3, { opacity: clamp(o, 0, 1) });
    }
    /* "the same total": the three laid end to end, always 100 */
    var tot = on(t, cTotal, 0.8), cols = ["#3B7FD1", "#F4C95D", "#E9744F"], at = bx;
    if (tot > 0) {
      for (var s = 0; s < 3; s++) {
        var w = bars[s] * EE_SIM.k * tot;
        out += R(at, 314, w, 22, 5, cols[s], EE_INK, 2);
        at += w;
      }
      out += Tx(bx + 100 * EE_SIM.k + 6, 333, "100", "lab mid dark", "start", { opacity: tot });
    }
    out += eeLeft(t, 400, "nothing was lost", cVanish, null, 26, P.good);
    return svg(out);
  }

  /* ---- leaking out ---------------------------------------------------------------
     The lesson's transfers demo, frames four and five: the ball thumps into the
     wall and some of its energy leaves as sound and some warms the wall; then
     the lamp, electricity in and light out, with the bulb a little warm. The
     lesson's own misconception is answered here: a warm bulb is not broken. */
  function eeLeakChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cWall = c(0, "wall"), cThump = c(0, "thump"), cSound = c(0, "sound");
    var cWarmed = c(1, "warmed"), cLost = c(1, "lost");
    var cLamp = c(2, "lamp"), cIn = c(2, "in"), cOut = c(2, "out"), cWarm = c(2, "warm");
    var cBroken = c(3, "broken"), cLeaks = c(3, "leaks"), cSur = c(3, "surroundings");
    var half = eeFrom(t, scene, 2), out = "";

    /* the wall */
    var wallSide = 1 - 0.55 * half;
    var w = R(40, 60, 520, 320, 20, P.card, P.line, 2);
    w += R(430, 86, 110, 268, 6, "#8A6A4A");
    var fly = on(t, cWall, 0.7);
    w += MK.pic(lerp(130, 392, fly), 220, 84, "⚽");
    w += MK.waves(418, 220, t, cThump, { dir: Math.PI, spread: 1.6, n: 3, period: 1.0, reach: 150, col: P.gold });
    w += MK.ripple(424, 220, t, cThump, P.gold);
    w += MK.pop(MK.pic(178, 120, 70, "\u{1F50A}"), 178, 120, popIn(t, cSound, 0.45));
    w += MK.pill(178, 180, "sound", on(t, cSound, 0.4), { size: 22, col: P.gold });
    w += MK.glow(452, 220, 84, P.accent, on(t, cWarmed, 0.6) * (0.72 + 0.28 * breathe(t)));
    w += MK.pill(310, 322, "a little warmer", on(t, cWarmed, 0.4), { size: 22, col: P.accent });
    var lost = on(t, cLost, 0.45);
    if (lost > 0) {
      w += MK.pill(120, 322, "lost", lost, { size: 22, col: P.line, ink: P.muted });
      w += L(86, 322, 154, 322, P.bad, 4, { opacity: lost });
    }
    out += G(w, { opacity: 0.45 + 0.55 * wallSide });

    /* the lamp */
    var lamp = popIn(t, cLamp, 0.5);
    if (lamp > 0) {
      var l = R(608, 60, 520, 320, 20, P.card, P.line, 2);
      var litU = on(t, cOut, 0.6);
      l += MK.glow(880, 176, 132, P.gold, litU * (0.75 + 0.25 * breathe(t)));
      l += G(MK.pic(880, 190, 150, "\u{1F4A1}"), { style: litU < 0.5 ? "filter:brightness(0.55)" : null });
      l += MK.pop(MK.pic(690, 190, 72, "⚡"), 690, 190, popIn(t, cIn, 0.45));
      l += Tx(690, 252, "electricity", "lab mid muted readable", "middle", { opacity: on(t, cIn, 0.4) });
      l += MK.arrow(730, 190, 800, 190, on(t, cIn == null ? null : cIn + 0.25, 0.5), P.gold, 8);
      l += MK.pill(1040, 132, "light", litU, { size: 22, col: P.gold });
      l += MK.glow(886, 262, 72, P.accent, on(t, cWarm, 0.6) * (0.7 + 0.3 * breathe(t)));
      l += MK.pill(1040, 258, "heat", on(t, cWarm, 0.4), { size: 22, col: P.accent });
      var br = on(t, cBroken, 0.45);
      if (br > 0) {
        l += MK.pill(740, 340, "broken", br, { size: 22, col: P.line, ink: P.muted });
        l += L(696, 340, 784, 340, P.bad, 4, { opacity: br });
        l += MK.tick(852, 340, 18, popIn(t, cBroken == null ? null : cBroken + 0.3, 0.4));
        l += MK.pill(960, 340, "working", br, { size: 22, col: P.good });
      }
      /* every transfer leaks a little, outwards */
      var lk = on(t, cLeaks, 0.7);
      if (lk > 0) {
        var dirs = [[-0.95, -0.55], [0.95, -0.55], [0, 1]];
        for (var k = 0; k < 3; k++) {
          var a = 92, ex = 880 + dirs[k][0] * a, ey = 176 + dirs[k][1] * a;
          out += "";
          l += MK.arrow(880 + dirs[k][0] * 52, 176 + dirs[k][1] * 52, ex, ey, clamp(lk * 1.3 - k * 0.12, 0, 1), P.accent, 7);
        }
      }
      out += G(l, { opacity: clamp(lamp, 0, 1) });
    }

    /* the surroundings: the lesson's word for everything around a thing */
    var su = on(t, cLeaks == null ? null : cLeaks + 0.3, 0.8);
    if (su > 0) {
      out += R(10, 10, 1148, 420, 18, "none", P.muted, 3, { opacity: su, "stroke-dasharray": "16 12" });
      out += MK.pill(584, 34, "the surroundings", on(t, cSur, 0.4), { size: 22, col: P.muted });
    }
    return svg(out);
  }

  /* ---- record it and chart it -----------------------------------------------------
     The lesson's own table (Bounce, Height in marks: 3, 2, 1) read off the
     marked scale, and the bar chart it becomes: a falling staircase. */
  var EE_TICK_Y = [380, 310, 240, 170, 100];      /* the marked scale, 0 to 4 */
  var EE_BAR_X = [730, 850, 970], EE_BAR_TOP = [136, 206, 276], EE_AXIS_Y = 346, EE_ROW_LABEL = ["first", "second", "third"];
  var EE_ROW_PIC = ["1️⃣", "2️⃣", "3️⃣"];

  function eeChartChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cScale = c(0, "scale"), cTable = c(0, "table");
    var cPlate = cScale == null ? null : cScale + 0.4;
    var cFirst = c(1, "first"), cSecond = c(1, "second"), cThird = c(1, "third");
    var cChart = c(2, "chart"), cBar = c(2, "bar");
    var cStair = c(3, "staircase"), cPattern = c(3, "pattern"), cAway = c(3, "away");
    var valAt = [cFirst, cSecond, cThird], out = "";
    var left = 1 - 0.5 * eeFrom(t, scene, 2);

    /* the marked scale the heights are read off */
    var sc0 = popIn(t, cScale, 0.5), g = "";
    if (sc0 > 0) {
      g += L(100, 100, 100, 380, P.muted, 3);
      for (var k = 0; k < 5; k++) {
        g += L(88, EE_TICK_Y[k], 112, EE_TICK_Y[k], P.muted, 3);
        g += Tx(76, EE_TICK_Y[k] + 7, String(k), "lab mid muted", "end");
      }
      g += Tx(100, 74, "marks", "lab mid muted", "middle");
      /* the ring slides down the scale as each height is read */
      for (var v = 0; v < 3; v++) {
        g += C(100, EE_TICK_Y[3 - v], 20, "none", P.gold, 4,
          { opacity: on(t, valAt[v], 0.35) * (v === 2 ? 1 : 1 - on(t, valAt[v + 1], 0.35)) });
      }
      g = G(g, { opacity: Math.min(1, sc0) });
    }

    /* the table */
    var tb = popIn(t, cPlate, 0.5), tg = "";
    if (tb > 0) {
      tg += R(170, 80, 400, 300, 18, P.card, P.line, 2);
      tg += Tx(250, 118, "Bounce", "lab mid muted readable", "middle");
      tg += Tx(450, 118, "Height in marks", "lab mid muted readable", "middle");
      tg += L(186, 136, 554, 136, P.line, 2);
      tg += L(186, 136, lerp(186, 554, on(t, cTable, 0.6)), 136, P.gold, 3, { opacity: on(t, cTable, 0.3) });
      for (var r = 0; r < 3; r++) {
        var ry = 190 + r * 66, rp = popIn(t, cTable == null ? null : cTable + r * 0.16, 0.4);
        tg += MK.pop(MK.pic(214, ry, 46, EE_ROW_PIC[r]), 214, ry, rp);
        tg += Tx(248, ry + 7, EE_ROW_LABEL[r], "lab mid muted readable", "start", { opacity: Math.min(1, rp) });
        tg += MK.pop(Tx(450, ry + 16, String(3 - r), "lab huge gold", "middle"), 450, ry, popIn(t, valAt[r], 0.4));
      }
      tg = G(tg, { opacity: Math.min(1, tb), transform: around(370, 230, Math.min(1, tb)) });
    }
    out += G(g + tg, { opacity: left });

    /* the bar chart */
    var ch = popIn(t, cChart, 0.5);
    if (ch > 0) {
      var cg = R(600, 80, 540, 300, 18, P.card, P.line, 2);
      cg += L(680, EE_AXIS_Y, 1110, EE_AXIS_Y, P.muted, 3);
      cg += L(680, EE_AXIS_Y, 680, 126, P.muted, 3);
      for (var y = 0; y < 4; y++) {
        cg += L(668, EE_AXIS_Y - y * 70, 680, EE_AXIS_Y - y * 70, P.muted, 2);
        cg += Tx(660, EE_AXIS_Y + 7 - y * 70, String(y), "lab mid muted", "end");
      }
      var grown = tally(t, cBar, 3, 1.1);
      for (var b = 0; b < 3; b++) {
        var u = b < grown ? on(t, cBar == null ? null : cBar + b * 0.37, 0.45) : 0;
        var h = (EE_AXIS_Y - EE_BAR_TOP[b]) * u;
        cg += R(EE_BAR_X[b], EE_AXIS_Y - h, 86, h, 6, P.good, P.line, 2);
        cg += Tx(EE_BAR_X[b] + 43, 372, EE_ROW_LABEL[b], "lab mid muted readable", "middle", { opacity: u });
      }
      /* the falling staircase, and where the energy went */
      var st = on(t, cStair, 0.9);
      if (st > 0) {
        var d = "M" + n2(EE_BAR_X[0]) + "," + n2(EE_BAR_TOP[0]);
        for (var s = 0; s < 3; s++) {
          d += " L" + n2(EE_BAR_X[s] + 86) + "," + n2(EE_BAR_TOP[s]);
          if (s < 2) d += " L" + n2(EE_BAR_X[s + 1]) + "," + n2(EE_BAR_TOP[s + 1]);
        }
        cg += Pth(d, null, P.gold, 4, { opacity: st, "stroke-dasharray": "12 8" });
      }
      var aw = on(t, cAway, 0.7);
      for (var a = 0; a < 3; a++) {
        cg += MK.arrow(EE_BAR_X[a] + 43, EE_BAR_TOP[a] - 10, EE_BAR_X[a] + 79, EE_BAR_TOP[a] - 48,
          clamp(aw * 1.25 - a * 0.14, 0, 1), P.accent, 6);
      }
      cg += MK.pill(956, 106, "each one lower", on(t, cPattern, 0.4), { size: 22, col: P.gold });
      out += G(cg, { opacity: clamp(ch, 0, 1) });
    }
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------------- */
  var EE_RECAP = MK.recapKind([
    { beat: 0, at: "every", title: "Energy", sub: "in everything there is", pic: "⚡" },
    { beat: 0, at: "slh", title: "Sound, light, heat", sub: "all of them carry energy",
      pic: function (cx, cy, size) {
        return Em(cx - size * 0.64, cy, size * 0.56, "\u{1F50A}") + Em(cx, cy, size * 0.56, "☀️") +
          Em(cx + size * 0.64, cy, size * 0.56, "\u{1F525}");
      } },
    { beat: 1, at: "nothing", title: "Nothing happens", sub: "without energy", pic: "\u{1F3C3}\u{1F3FE}" },
    { beat: 1, at: "never", title: "Never made", sub: "and never destroyed", pic: "\u{1F6D1}" },
    { beat: 2, at: "transferred", title: "Only transferred", sub: "from thing to thing", pic: "\u{1F504}" },
    { beat: 2, at: "leaks", title: "Some leaks out", sub: "to the surroundings", pic: "\u{1F3E0}" }
  ], { goBeat: 2, goAt: "leaks" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Where energy is, and what it does", "The rule: never made, never lost", "Where a bouncing ball's energy goes"] }),
    everywhere: eeEverywhereChapter, nothing: eeNothingChapter, rule: eeRuleChapter,
    bounce: eeBounceChapter, leak: eeLeakChapter, chart: eeChartChapter, recap: EE_RECAP
  };
