  /* ==== Particles, part 2: in a solid, and heating it until it melts ===========
     tools/lib/film-scenes/science-g4/particles-2.js. The lesson's own box does
     the teaching in both chapters: state 0 and 1 are the same five rows of
     eight with the vibration three times as hard, so the film passes a
     continuous jiggle across the switch and nothing jumps; state 2 is the
     liquid, whose rows slide in opposite directions as tick advances, and tick
     runs at the lesson's own rate (one tick every 0.26 s, one slot every two
     ticks). The marks round it are the film's: the row lines, the rings on two
     touching particles, the zoomed single particle in its dashed home, and the
     zoomed pair of rows sliding past each other. */

  /* ---- marks both chapters use ------------------------------------------------ */

  /* the five rows of the solid, drawn as thin lines through the particles */
  function paRowLines(box, t, at, flash) {
    var o = on(t, at, 0.5);
    if (o <= 0) return "";
    var out = "", x0 = paBX(box, 61), x1 = paBX(box, 260);
    for (var r = 0; r < 5; r++) {
      var u = on(t, at == null ? null : at + r * 0.1, 0.35);
      if (u <= 0) continue;
      out += L(x0, paRowY(box, r), lerp(x0, x1, u), paRowY(box, r), flash > 0.2 ? "#FFFFFF" : P.gold, paBS(box, 3.2),
        { opacity: 0.92 });
    }
    return out;
  }
  /* rings on two particles that are side by side, wherever they are */
  function paTouchRings(cx0, cy0, cx1, cy1, r, o) {
    if (!(o > 0)) return "";
    return G(C(cx0, cy0, r, "none", P.gold, 4) + C(cx1, cy1, r, "none", P.gold, 4), { opacity: clamp(o, 0, 1) });
  }
  /* one particle jiggling inside the dashed ring that is its place */
  function paSpotInset(t, cx, cy, r, ringO, shakeO, amp) {
    var out = "", dx = Math.sin(t * 22.5) * amp, dy = Math.cos(t * 19.5) * amp * 0.6;
    if (ringO > 0) out += C(cx, cy, r * 1.5, "none", P.muted, 3, { "stroke-dasharray": "9 9", opacity: 0.8 * clamp(ringO, 0, 1) });
    out += paBall(cx + dx, cy + dy, r);
    out += paShake(cx, cy, r, shakeO);
    return out;
  }

  /* ==== chapter: in a solid ======================================================= */
  function paSolidChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cRows = c(0, "rows"), cTouch = c(0, "touches");
    var cCannot = c(1, "cannot"), cVib = c(1, "vibrate"), cSpot = c(1, "spot");
    var cHold = c(2, "hold"), cShape = c(2, "shape"), cBrick = c(2, "brick");
    var cIce = c(3, "ice"), cStop = c(3, "stop"), cNo = c(3, "no");
    var cTime = c(4, "time"), cLittle = c(4, "little"), cAlways = c(4, "always");

    var box = PA_BOX, out = "";
    var amp = lerp(0.62, 1.15, on(t, cVib, 1.2));
    out += paBoxCard(box);
    out += paBoxAt(box, 0, paJig(t, amp), 0);
    out += paRowLines(box, t, cRows, bump(t, cHold, 1.1));
    /* two particles side by side, in the middle row */
    out += paTouchRings(paColX(box, 3), paRowY(box, 2), paColX(box, 4), paRowY(box, 2), paBS(box, 13),
      on(t, cTouch, 0.4) * paOnly(t, scene, 0));

    /* ---- the right-hand column, one thing per beat ---- */
    var b0 = paOnly(t, scene, 0), b1 = paOnly(t, scene, 1), b2 = paOnly(t, scene, 2),
      b3 = paOnly(t, scene, 3), b4 = paOnly(t, scene, 4);

    /* beat 1: the pair, touching */
    if (b0 > 0) {
      var pr = on(t, cTouch, 0.5), pa0 = "";
      pa0 += MK.pill(880, 96, "packed in rows", on(t, cRows, 0.4), { size: 30, col: P.gold });
      if (pr > 0) {
        pa0 += paBall(818, 260, 62) + paBall(942, 260, 62);
        pa0 += MK.glow(880, 260, 54, P.gold, 0.9 * pr);
        pa0 += MK.pill(880, 372, "touching", pr, { size: 28 });
      }
      out += G(pa0, { opacity: b0 });
    }

    /* beat 2: it cannot travel, but it never stops jiggling */
    if (b1 > 0) {
      var pa1 = "", cn = on(t, cCannot, 0.5) * (1 - on(t, cVib, 0.4));
      pa1 += paSpotInset(t, 858, 240, 56, on(t, cVib, 0.5), on(t, cVib, 0.6), 3 + 9 * on(t, cVib, 1.0));
      if (cn > 0) {
        pa1 += MK.arrow(936, 240, 1058, 240, cn, P.muted, 7);
        pa1 += MK.cross(1058, 240, 30, popIn(t, cCannot == null ? null : cCannot + 0.35, 0.35) * cn);
        pa1 += MK.pill(1000, 150, "cannot move about", cn, { size: 24 });
      }
      pa1 += MK.pill(858, 372, "it jiggles on the spot", on(t, cSpot, 0.4), { size: 28, col: P.gold });
      out += G(pa1, { opacity: b1 });
    }

    /* beat 3: the rows hold, so the brick keeps its shape */
    if (b2 > 0) {
      var pa2 = "", sh = on(t, cShape, 0.6);
      pa2 += MK.pic(870, 210, 168, "\u{1F9F1}");
      if (sh > 0) pa2 += R(lerp(870, 776, sh), lerp(210, 132, sh), 188 * sh, 156 * sh, 12, "none", P.gold, 4, { "stroke-dasharray": "13 9" });
      pa2 += MK.pill(870, 344, "keeps its shape", on(t, cShape, 0.4), { size: 28, col: P.gold });
      pa2 += MK.tick(1020, 210, 30, popIn(t, cBrick, 0.4));
      out += G(pa2, { opacity: b2 });
    }

    /* beat 4: and in ice they are still moving */
    if (b3 > 0) {
      var pa3 = "", zo = on(t, cIce, 0.6);
      pa3 += MK.pic(766, 200, 156, "\u{1F9CA}");
      if (zo > 0) {
        pa3 += MK.leader(830, 264, 952, 300, zo, P.gold);
        pa3 += C(1024, 300, 86, P.paper, P.gold, 4, { opacity: zo });
        for (var q = 0; q < 5; q++) {
          var ax = 1024 + [-42, 0, 42, -21, 21][q], ay = 300 + [-28, -28, -28, 24, 24][q];
          pa3 += G(paBall(ax + Math.sin(t * 22.5 + q) * 4, ay + Math.cos(t * 19.5 + q) * 4, 19), { opacity: zo });
        }
      }
      pa3 += MK.qmark(830, 92, 32, on(t, cStop, 0.4));
      pa3 += MK.cross(922, 92, 32, popIn(t, cNo, 0.4));
      pa3 += MK.pill(1024, 408, "still moving", on(t, cNo, 0.4), { size: 26, col: P.gold });
      out += G(pa3, { opacity: b3 });
    }

    /* beat 5: a little, but always */
    if (b4 > 0) {
      var pa4 = "";
      pa4 += paSpotInset(t, 880, 228, 58, 1, 1, 11);
      pa4 += MK.pill(880, 348, "only a little", on(t, cLittle, 0.4), { size: 28 });
      pa4 += MK.pill(880, 408, "but always", on(t, cAlways, 0.4), { size: 28, col: P.gold });
      pa4 += MK.pill(880, 96, "all the time", on(t, cTime, 0.4), { size: 28, col: P.gold });
      out += G(pa4, { opacity: b4 });
    }
    return svg(out);
  }

  /* ==== chapter: heat it, and it melts ============================================ */
  var PA_FLAME_X = [148, 232, 316, 400, 484];

  /* the zoomed pair of rows, sliding past each other the way the lesson's
     liquid does: the upper row right, the lower row left, endlessly, clipped */
  function paSlideZoom(t, at, o) {
    if (!(o > 0)) return "";
    var x0 = 686, x1 = 1074, yA = 214, yB = 276, r = 31, step = 66;
    var u = at == null ? 0 : Math.max(0, t - at) * 30;
    var out = el("clipPath", { id: "paSlideClip" }, R(x0, yA - 46, x1 - x0, yB - yA + 92));
    var rows = "";
    for (var k = -2; k < 8; k++) {
      rows += paBall(x0 + 22 + k * step + (((u % step) + step) % step), yA, r, "#3B7FD1");
      rows += paBall(x0 + 22 + k * step - (((u % step) + step) % step), yB, r, k === 3 ? "#1F4F8A" : "#3B7FD1");
    }
    out += G(rows, { "clip-path": "url(#paSlideClip)" });
    out += MK.arrow(830, 148, 1010, 148, 1, P.gold, 7);
    out += MK.arrow(930, 348, 750, 348, 1, P.gold, 7);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a jar and a dish, the same water taking each one's shape */
  function paContainers(t, atJar, atDish, pourAt, both) {
    var out = "", jx = 742, jy0 = 178, jy1 = 366, jw = 116;
    var jo = on(t, atJar, 0.5), so = on(t, atDish, 0.5), mark = on(t, both, 0.6);
    /* water falling in */
    if (pourAt != null && t >= pourAt && t < pourAt + 1.6) {
      for (var k = 0; k < 4; k++) {
        var ph = ((t - pourAt) / 0.5 + k * 0.25) % 1;
        out += paDrop(jx, lerp(120, jy0 + 30, ph), 11, Math.min(1, (1 - ph) * 3));
      }
    }
    if (jo > 0) {
      var fill = lerp(0, 112, Math.min(1, jo));
      out += R(jx - jw / 2, jy0, jw, jy1 - jy0, 10, "#F2EFE6", "#3A3A3A", 4, { opacity: jo });
      out += R(jx - jw / 2 + 5, jy1 - 5 - fill, jw - 10, fill, 6, "#5FA8DC", null, null, { opacity: jo });
      out += Tx(jx, jy1 + 40, "a tall jar", "lab mid muted readable", "middle", { opacity: jo });
      if (mark > 0) out += R(jx - jw / 2 + 5, jy1 - 5 - fill, jw - 10, fill, 6, "none", P.gold, 3, { opacity: mark });
    }
    if (so > 0) {
      var dx = 976, dy1 = 366, dw = 232, dh = 92;
      out += R(dx - dw / 2, dy1 - dh, dw, dh, 10, "#F2EFE6", "#3A3A3A", 4, { opacity: so });
      out += R(dx - dw / 2 + 5, dy1 - 5 - 56 * so, dw - 10, 56 * so, 6, "#5FA8DC", null, null, { opacity: so });
      out += Tx(dx, dy1 + 40, "a wide dish", "lab mid muted readable", "middle", { opacity: so });
      if (mark > 0) out += R(dx - dw / 2 + 5, dy1 - 5 - 56 * so, dw - 10, 56 * so, 6, "none", P.gold, 3, { opacity: mark });
    }
    return out;
  }

  function paLiquidChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cHeat = c(0, "heat"), cEnergy = c(0, "energy"), cHarder = c(0, "harder");
    var cMore = c(1, "more"), cBreak = c(1, "break"), cMelted = c(1, "melted");
    var cLiq = c(2, "liquid"), cTouch = c(2, "touch"), cSlide = c(2, "slide");
    var cFlows = c(3, "flows"), cShape = c(3, "shape"), cCont = c(3, "container");
    var cCool = c(4, "cool"), cLock = c(4, "lock"), cSame = c(4, "same");

    var box = PA_BOX, out = "";
    var warm = on(t, cHarder, 0.5), warmU = on(t, cHarder, 1.3);
    var melt = on(t, cBreak, 0.7), froze = on(t, cLock, 0.7);
    var liqO = clamp(melt - froze, 0, 1);

    /* the solid half: cold, then warm at the same visible amplitude, then cold
       again as it freezes. 0 draws the jiggle at 1.2x and 1 at 3x, so 1.15 and
       0.46 are the same picture and the switch cannot be seen. */
    var state = froze > 0.02 ? 0 : warm > 0.5 ? 1 : 0;
    var jig = froze > 0.02 ? lerp(1.15, 0.78, froze) : warm > 0.5 ? lerp(0.46, 1.15, warmU) : 1.15;
    out += paBoxCard(box);
    out += G(paBoxAt(box, state, paJig(t, jig), 0), { opacity: 1 - liqO });
    if (liqO > 0) out += G(paBoxAt(box, 2, 1, cBreak == null ? 0 : Math.max(0, (t - cBreak) / 0.26)), { opacity: liqO });

    /* the rows, while it is still a solid */
    out += G(paRowLines(box, t, BEATS[scene.first].start - 0.4, bump(t, cBreak, 0.9)), { opacity: 1 - melt });
    /* two particles side by side in the liquid: still touching */
    out += paTouchRings(paBX(box, 63.5 + 4 * 23), paLiqY(box, 1), paBX(box, 63.5 + 5 * 23), paLiqY(box, 1),
      paBS(box, 13), on(t, cTouch, 0.4) * paOnly(t, scene, 2));

    /* the heat under the box, and the cold at the end */
    var hot = Math.max(on(t, cHeat, 0.5), on(t, cMore, 0.4)) * (1 - on(t, cCool, 0.4));
    var many = on(t, cMore, 0.6);
    for (var f = 0; f < 5; f++) {
      var show = (f === 0 || f === 4) ? many : 1;
      out += MK.pic(PA_FLAME_X[f], 412, 46, "\u{1F525}", { opacity: clamp(hot * show, 0, 1) });
    }
    var cold = on(t, cCool, 0.5);
    for (var s = 0; s < 3; s++) out += MK.pic(PA_FLAME_X[s + 1], 412, 46, "❄️", { opacity: clamp(cold, 0, 1) });

    /* the thermometer: up with the heat, down with the cold */
    var lvl = 0.12 + 0.3 * on(t, cEnergy, 0.9) + 0.14 * on(t, cHarder, 0.8) + 0.3 * on(t, cMore, 1.1) - 0.6 * on(t, cCool, 1.2);
    out += paThermo(664, 392, 300, lvl, Math.max(paSpan(t, scene, 0, 2), paOnly(t, scene, 4)));

    var b0 = paOnly(t, scene, 0), b1 = paOnly(t, scene, 1), b2 = paOnly(t, scene, 2),
      b3 = paOnly(t, scene, 3), b4 = paOnly(t, scene, 4);

    if (b0 > 0) {
      var g0 = "";
      g0 += MK.pill(906, 110, "heat", on(t, cHeat, 0.4), { size: 32, col: P.accent });
      g0 += MK.pill(906, 186, "more energy", on(t, cEnergy, 0.4), { size: 28, col: P.gold });
      g0 += MK.pill(906, 262, "vibrating harder", on(t, cHarder, 0.4), { size: 28, col: P.gold });
      g0 += paSpotInset(t, 906, 356, 42, 0, on(t, cHarder, 0.6), 2 + 11 * on(t, cHarder, 1.0));
      out += G(g0, { opacity: b0 });
    }
    if (b1 > 0) {
      var g1 = "";
      var esc0 = on(t, cBreak, 0.9);
      g1 += MK.pill(906, 116, "out of their rows", on(t, cBreak, 0.4), { size: 30, col: P.gold });
      g1 += paBall(700, 252, 24) + paBall(748, 252, 24) + paBall(796, 252, 24);
      g1 += MK.arrow(830, 252, 962, 252, esc0, P.gold, 8);
      g1 += paBall(lerp(844, 968, esc0), 252 - 26 * Math.sin(Math.PI * esc0), 24);
      g1 += MK.pic(1080, 252, 88, "\u{1F4A7}", { opacity: on(t, cMelted, 0.5) });
      g1 += MK.pill(906, 388, "it has melted", on(t, cMelted, 0.4), { size: 32, col: P.gold });
      out += G(g1, { opacity: b1 });
    }
    if (b2 > 0) {
      var g2 = "";
      g2 += MK.pill(880, 92, "still touching", on(t, cTouch, 0.4), { size: 28 });
      g2 += paSlideZoom(t, cTouch, on(t, cTouch, 0.5));
      g2 += MK.pill(880, 408, "sliding past each other", on(t, cSlide, 0.5), { size: 28, col: P.gold });
      out += G(g2, { opacity: b2 });
    }
    if (b3 > 0) {
      var g3 = "";
      g3 += paContainers(t, BEATS[scene.first + 3].start - 0.3, cShape, cFlows, cCont);
      g3 += MK.pill(880, 58, "it takes the shape of its container", on(t, cShape, 0.4), { size: 25, col: P.gold });
      out += G(g3, { opacity: b3 });
    }
    if (b4 > 0) {
      var g4 = "";
      g4 += MK.pic(812, 250, 116, "\u{1F9CA}", { opacity: on(t, cCool, 0.5) });
      g4 += MK.pic(1044, 250, 116, "\u{1F4A7}", { opacity: on(t, cCool, 0.5) });
      g4 += MK.arrow(892, 232, 964, 232, on(t, cLock, 0.5), P.gold, 6);
      g4 += MK.arrow(964, 272, 892, 272, on(t, cLock, 0.5), P.gold, 6);
      g4 += MK.pill(928, 110, "locked back into rows", on(t, cLock, 0.4), { size: 27, col: P.gold });
      g4 += MK.pill(928, 388, "the same particles", on(t, cSame, 0.4), { size: 30, col: P.gold });
      out += G(g4, { opacity: b4 });
    }
    return svg(out);
  }
