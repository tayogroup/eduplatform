  /* ==== chapters: the Moon's month, and always a ball ==========================
     tools/lib/film-scenes/science-g3/the-moon-2.js. */

  /* ---- the Moon's month -------------------------------------------------------
     The lesson's own drawing, large (ART.sim "moonPhases", the picture its
     Three days later button steps through, caption and all), beside a wheel of
     the same month: one disc for each of the nine pictures, drawn with the
     lesson's own phase geometry, appearing as its phase is said. The wheel has
     a gap at the top, and the last line closes it. */

  var TM_CARD = { x: 30, y: 44, w: 528, h: 330 };       /* 320 x 200, drawn at 1.65 */
  var TM_WHEEL = { cx: 860, cy: 215, r: 150, dr: 26 };

  function tmWheelPos(k) {
    var a = (-90 + k * 40) * Math.PI / 180;
    return [TM_WHEEL.cx + Math.cos(a) * TM_WHEEL.r, TM_WHEEL.cy + Math.sin(a) * TM_WHEEL.r];
  }

  /* which of the lesson's nine pictures the big card shows, from the cues */
  function tmMonthK(t, scene) {
    var c = function (k, name) { return sc(scene, k, name); };
    var again = c(4, "again"), waning = c(3, "waning");
    if (again != null && t >= again) return 0;
    if (waning != null && t >= waning) return 4 + Math.min(4, Math.floor((t - waning) / 0.26));
    var full = c(2, "full"), half = c(2, "half"), cres = c(2, "crescent");
    if (full != null && t >= full) return 4;
    if (half != null && t >= half) return 2;
    if (cres != null && t >= cres) return 1;
    return 0;
  }

  /* how many of the nine discs the wheel has drawn, and when each arrived */
  function tmWheelAt(scene, k) {
    var c = function (b, name) { return sc(scene, b, name); };
    if (k === 0) return c(1, "new");
    if (k === 1) return c(2, "crescent");
    if (k === 2) return c(2, "half");
    if (k === 3) { var f = c(2, "full"); return f == null ? null : f + 0.18; }
    if (k === 4) { var g = c(2, "full"); return g == null ? null : g + 0.42; }
    var w = c(3, "waning");
    return w == null ? null : w + 0.2 + (k - 5) * 0.33;
  }

  function tmMonthChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cLook = c(0, "look"), cChange = c(0, "change");
    var cNew = c(1, "new"), cDark = c(1, "dark");
    var cWax = c(3, "waxing"), cWan = c(3, "waning");
    var cFour = c(4, "four"), cAgain = c(4, "again");
    var out = "", k = tmMonthK(t, scene), card = popIn(t, cLook, 0.5);

    /* the lesson's own picture of tonight's Moon */
    out += G(tmCard(TM_CARD.x, TM_CARD.y, TM_CARD.w, TM_CARD.h, 1) +
      ART.place(ART.sim("moonPhases", "draw", k), TM_CARD.x, TM_CARD.y, TM_CARD.w, TM_CARD.h),
      { transform: around(294, 209, Math.min(1, card)), opacity: Math.min(1, card) });

    /* "it seems to change" */
    out += MK.qmark(294, 410, 26, on(t, cChange, 0.4) * tmOnly(t, scene, 0));
    /* "the side facing us is dark": the dark face, ringed on the lesson's card */
    out += C(294, 209, 112, "none", P.gold, 5, { opacity: bump(t, cDark, 1.5) });

    /* the month waiting to be filled in, and then one disc per picture */
    out += C(TM_WHEEL.cx, TM_WHEEL.cy, TM_WHEEL.r, "none", P.line, 2,
      { "stroke-dasharray": "10 9", opacity: 0.75 * Math.min(1, card) });
    var arcs = "", discs = "";
    for (var n = 0; n < 9; n++) {
      var at = tmWheelAt(scene, n), p = popIn(t, at, 0.4);
      if (!(p > 0)) continue;
      var pos = tmWheelPos(n), live = n === k ? 1 : 0;
      discs += G(tmMoon(pos[0], pos[1], TM_WHEEL.dr, n) +
        C(pos[0], pos[1], TM_WHEEL.dr + 7, "none", P.gold, 4, { opacity: live }),
        { transform: around(pos[0], pos[1], Math.min(1, p)), opacity: Math.min(1, p) });
    }
    /* the two halves of the month, named */
    var wax = on(t, cWax, 0.5), wan = on(t, cWan, 0.5);
    if (wax > 0) arcs += Pth("M" + n2(TM_WHEEL.cx) + "," + n2(TM_WHEEL.cy - 108) +
      " A108,108 0 0 1 " + n2(TM_WHEEL.cx) + "," + n2(TM_WHEEL.cy + 108), null, P.gold, 6, { opacity: wax * 0.85 });
    if (wan > 0) arcs += Pth("M" + n2(TM_WHEEL.cx) + "," + n2(TM_WHEEL.cy + 108) +
      " A108,108 0 0 1 " + n2(TM_WHEEL.cx) + "," + n2(TM_WHEEL.cy - 108), null, P.plum, 6, { opacity: wan * 0.85 });
    out += arcs + discs;
    out += MK.pill(1092, 196, "waxing", wax, { size: 22, col: P.gold });
    out += MK.pill(628, 244, "waning", wan, { size: 22, col: P.plum });

    /* "about four weeks", and then it starts again */
    var four = on(t, cFour, 0.45);
    out += MK.pill(TM_WHEEL.cx, 196, "about four weeks", four, { size: 24, col: P.gold });
    out += MK.pill(TM_WHEEL.cx, 240, "one month", on(t, cFour == null ? null : cFour + 0.4, 0.45), { size: 24, col: P.gold });
    var ag = on(t, cAgain, 0.7);
    if (ag > 0) {
      var a0 = tmWheelPos(8), a1 = tmWheelPos(9);      /* disc 9 stands where disc 0 does */
      out += MK.arrow(a0[0] + 17, a0[1] - 20, a1[0] - 17, a1[1] + 5, ag, P.gold, 7);
      out += C(a1[0], a1[1], TM_WHEEL.dr + 12, "none", P.gold, 4, { opacity: bump(t, cAgain, 1.6) });
    }
    return svg(out);
  }

  /* ---- always a ball ----------------------------------------------------------
     The lesson's demo, frames five and six: a ball on a stick, a lamp in a dark
     room, and the child turning on the spot. The lamp is on the left, so the
     ball's left half is always the lit one; what the CHILD sees is drawn in the
     card on the right, at the phase the ball's place gives it. */

  var TM_HEAD = [400, 306];                              /* the child, the Earth */
  var TM_ORB = { cx: 400, cy: 160, rx: 160, ry: 34 };
  var TM_SEE = { x: 860, y: 70, w: 290, h: 290 };

  /* where the ball is, in degrees: 270 between the lamp and the head (new),
     360 in front of the child (half), 450 beyond the head (full) */
  function tmBallAngle(t, scene) {
    var c = function (k, name) { return sc(scene, k, name); };
    var turn = c(3, "turn"), cres = c(4, "crescent"), half = c(4, "half"), face = c(4, "face");
    var a = 270;
    a = lerp(a, 288, on(t, turn, 0.8));
    a = lerp(a, 315, on(t, cres, 0.5));
    a = lerp(a, 360, on(t, half, 0.55));
    a = lerp(a, 450, on(t, face, 0.9));
    return a;
  }
  function tmBallPos(a) {
    var r = a * Math.PI / 180;
    return [TM_ORB.cx + Math.sin(r) * TM_ORB.rx, TM_ORB.cy + Math.cos(r) * TM_ORB.ry];
  }
  /* the phase the child sees: 0 new, 2 half, 4 full */
  function tmSeen(a) {
    return Math.acos(clamp(-Math.sin(a * Math.PI / 180), -1, 1)) * 180 / Math.PI / 45;
  }
  function tmSeenName(k) {
    return k < 0.45 ? "new Moon" : k < 1.6 ? "crescent" : k < 2.5 ? "half Moon" : k < 3.6 ? "gibbous" : "full Moon";
  }

  /* beat 1: three phases, and one ball */
  function tmNotChanging(t, scene) {
    var cNot = sc(scene, 0, "not"), cBall = sc(scene, 0, "ball"), out = "";
    var xs = [310, 484, 658];
    for (var n = 0; n < 3; n++) {
      var p = popIn(t, cNot == null ? null : cNot + n * 0.16, 0.4);
      out += G(tmMoon(xs[n], 150, 58, [1, 2, 4][n]), { transform: around(xs[n], 150, Math.min(1, p)), opacity: Math.min(1, p) });
      if (n < 2) out += MK.arrow(xs[n] + 68, 150, xs[n] + 106, 150, on(t, cNot == null ? null : cNot + 0.2 + n * 0.16, 0.4), P.muted, 6);
    }
    var nx = popIn(t, cNot == null ? null : cNot + 0.7, 0.4);
    out += MK.cross(772, 150, 30, nx, P.bad);
    out += MK.pill(812, 150, "changing shape", Math.min(1, nx), { size: 26, anchor: "start", col: P.bad, ink: P.bad });
    var bp = popIn(t, cBall, 0.45);
    out += G(tmMoon(400, 336, 70, 4) +
      C(400, 336, 82, "none", P.good, 4, { opacity: 0.45 + 0.55 * breathe(t) }),
      { transform: around(400, 336, Math.min(1, bp)), opacity: Math.min(1, bp) });
    out += MK.tick(496, 336, 26, popIn(t, cBall == null ? null : cBall + 0.25, 0.4));
    out += MK.pill(540, 336, "always a ball", on(t, cBall, 0.45), { size: 28, anchor: "start", col: P.good });
    return out;
  }

  /* beats 2 to 6: the model */
  function tmModel(t, scene) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cModel = c(1, "model"), cGrown = c(1, "grown"), cBall = c(1, "ball"), cLamp = c(1, "lamp");
    var cSun = c(2, "sun"), cHalf = c(2, "half"), cDark = c(2, "dark");
    var cHead = c(3, "head"), cHold = c(3, "hold"), cTurn = c(3, "turn");
    var cNever = c(5, "never"), cMuch = c(5, "much");
    var out = "", a = tmBallAngle(t, scene), pos = tmBallPos(a), seen = tmSeen(a);
    var lamp = popIn(t, cLamp, 0.45), ballIn = popIn(t, cBall, 0.45);

    /* the lamp: the Sun of the model */
    out += MK.glow(118, 214, 112, P.gold, Math.min(1, lamp) * (0.72 + 0.28 * breathe(t)));
    out += G(Em(118, 214, 120, "\u{1F4A1}"), { transform: around(118, 214, Math.min(1, lamp)), opacity: Math.min(1, lamp) });
    out += MK.pill(118, 292, "the Sun", on(t, cSun, 0.4), { size: 22, col: P.gold });
    /* the grown-up who sets it up */
    var gr = popIn(t, cGrown, 0.45);
    out += G(Em(118, 366, 92, "\u{1F9D1}"), { transform: around(118, 366, Math.min(1, gr)), opacity: Math.min(1, gr) });
    out += MK.pill(118, 418, "a grown-up", Math.min(1, gr), { size: 20, col: P.line });

    /* the child: the Earth */
    out += Em(TM_HEAD[0], TM_HEAD[1], 136, "\u{1F9D2}");
    out += E(TM_HEAD[0], 266, 48, 54, "none", P.gold, 4, { opacity: on(t, cHead, 0.45) });
    out += MK.pill(TM_HEAD[0], 412, "the Earth", on(t, cHead, 0.45), { size: 24, col: P.gold });

    /* the path the ball takes, and the ball on its stick */
    out += E(TM_ORB.cx, TM_ORB.cy, TM_ORB.rx, TM_ORB.ry, "none", "#4A5A6A", 2.5,
      { "stroke-dasharray": "9 8", opacity: on(t, cTurn, 0.6) });
    if (ballIn > 0) {
      var hx = TM_HEAD[0], hy = 320, dx = pos[0] - hx, dy = pos[1] - hy, len = Math.hypot(dx, dy);
      var ex = pos[0] - dx / len * 34, ey = pos[1] - dy / len * 34;
      out += G(L(hx, hy, ex, ey, "#8B6A3A", 7) +
        C(pos[0], pos[1], 34, "#1B2A3A", "#4A5A6A", 2) +
        Pth("M" + n2(pos[0]) + "," + n2(pos[1] - 34) + " a34,34 0 0 0 0,68z", "#F3EFE6") +
        C(pos[0], pos[1], 42, "none", P.gold, 4, { opacity: Math.max(on(t, cNever, 0.45), bump(t, cHold, 1.2)) }),
        { transform: around(pos[0], pos[1], Math.min(1, ballIn)), opacity: Math.min(1, ballIn) });
    }
    /* the light, from the lamp to the ball */
    var rays = Math.min(1, lamp) * Math.min(1, ballIn);
    for (var n = 0; n < 3; n++) {
      var ry0 = 186 + n * 26, u = on(t, cLamp == null ? null : cLamp + 0.2 + n * 0.08, 0.5) * rays;
      if (u > 0) out += L(182, ry0, lerp(182, pos[0] - 36, u), lerp(ry0, pos[1] + (n - 1) * 12, u), P.gold, 4,
        { opacity: 0.85, "stroke-dasharray": "11 8" });
    }
    /* "one half of the ball", "the other half stays dark" */
    var halves = tmOnly(t, scene, 2);
    if (halves > 0.02) {
      var litArc = on(t, cHalf, 0.5) * halves, drkArc = on(t, cDark, 0.5) * halves;
      out += Pth("M" + n2(pos[0]) + "," + n2(pos[1] - 34) + " a34,34 0 0 0 0,68", null, P.gold, 7,
        { opacity: litArc });
      out += Pth("M" + n2(pos[0]) + "," + n2(pos[1] - 34) + " a34,34 0 0 1 0,68", null, P.blue, 7,
        { opacity: drkArc });
    }
    if (halves > 0.02) out += G(tmLabel(t, 176, 88, "lit half", cHalf, [pos[0] - 20, pos[1] - 16], true, 22) +
      tmLabel(t, 470, 88, "dark half", cDark, [pos[0] + 20, pos[1] - 16], true, 22), { opacity: halves });
    /* "a model you can hold" */
    out += MK.pill(330, 32, "a model you can hold", on(t, cModel, 0.45) * tmOnly(t, scene, 1), { size: 26, col: P.gold });

    /* what the child sees, from where the ball is */
    var card = Math.min(1, ballIn);
    out += G(tmNightCard(TM_SEE.x, TM_SEE.y, TM_SEE.w, TM_SEE.h, 1) +
      tmMoon(1005, 215, 86, seen) +
      C(1005, 215, 96, "none", P.gold, 5, { opacity: bump(t, cMuch, 1.6) }), { opacity: card });
    out += MK.pill(1005, 36, "what you see", card, { size: 24, col: P.line });
    out += MK.pill(1005, 398, tmSeenName(seen), card, { size: 26, col: P.gold });
    return out;
  }

  function tmBallChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 0) return svg(tmNotChanging(t, scene));
    if (k === 1) {
      var u = into(t, i);
      return svg(tmModel(t, scene) + (u < 1 ? G(tmNotChanging(t, scene), { opacity: 1 - u }) : ""));
    }
    return svg(tmModel(t, scene));
  }
