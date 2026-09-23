  /* ==== Grade 3 Science, Lesson 8: Mixtures, part 3 ============================
     The insoluble solid in a liquid (the filter) and the soluble one
     (dissolving). The lesson's own things: sand in water, filter paper in a
     funnel, a jug below; then salt stirred into water, tasted with a grown-up,
     and the four solids of its Dissolve table. The glassware is drawn here
     because the kit's beaker is baked at #1B1B1B on a light plate, and this
     film's stage is dark. Its colours are the kit's: #3B7FD1 water,
     #C9A26B sand.

     The apparatus is stacked in the order the liquid travels, and the numbers
     below say so: the jar stands ABOVE the funnel's mouth and tips towards it,
     the funnel's stem ends above the jug, and nothing is drawn outside
     0..1168 x 0..440. (The first cut had the jar's lip at y = 140 and the
     funnel's mouth at y = 96, so the water poured upwards.) */

  /* ---- glassware ------------------------------------------------------------- */
  function mxVesselPath(cx, topY, botY, hwT, hwB) {
    var r = 16;
    return "M" + n2(cx - hwT) + "," + n2(topY) +
      " L" + n2(cx - hwB) + "," + n2(botY - r) +
      " Q" + n2(cx - hwB) + "," + n2(botY) + " " + n2(cx - hwB + r) + "," + n2(botY) +
      " H" + n2(cx + hwB - r) +
      " Q" + n2(cx + hwB) + "," + n2(botY) + " " + n2(cx + hwB) + "," + n2(botY - r) +
      " L" + n2(cx + hwT) + "," + n2(topY);
  }
  function mxHalfAt(topY, botY, hwT, hwB, y) { return lerp(hwT, hwB, clamp((y - topY) / (botY - topY), 0, 1)); }
  function mxVessel(cx, topY, botY, hwT, hwB, wTop, fill, o, inner) {
    if (!(o > 0)) return "";
    var r = 16, body = "";
    if (wTop != null && wTop < botY - 2) {
      var hw = mxHalfAt(topY, botY, hwT, hwB, wTop);
      body = Pth("M" + n2(cx - hw) + "," + n2(wTop) + " L" + n2(cx - hwB) + "," + n2(botY - r) +
        " Q" + n2(cx - hwB) + "," + n2(botY) + " " + n2(cx - hwB + r) + "," + n2(botY) +
        " H" + n2(cx + hwB - r) + " Q" + n2(cx + hwB) + "," + n2(botY) + " " + n2(cx + hwB) + "," + n2(botY - r) +
        " L" + n2(cx + hw) + "," + n2(wTop) + " Z", fill || MX_WATER, null, null, { opacity: 0.78 }) +
        E(cx, wTop, hw, 7, MX_WATER2, null, null, { opacity: 0.85 });
    }
    return G(body + (inner || "") + Pth(mxVesselPath(cx, topY, botY, hwT, hwB), null, P.plastic, 5), { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: the filter ======================================================
     The jar of sandy water stands top left and tips 38 degrees about its own
     bottom right corner, which puts its lip at about (400, 89) - inside the
     funnel's mouth, which spans x 388..652 at y 134. */
  var MX_JAR = { cx: 308, top: 64, bot: 184, hwT: 58, hwB: 50 };
  var MX_JAR_PIVOT = [358, 184], MX_JAR_TILT = 38;
  var MX_JAR_LIP = [438, 94];
  var MX_FUN = { cx: 520, mouthY: 134, mouthHw: 132, apexY: 262, stemHw: 12, stemY: 310 };
  var MX_JUG = { cx: 520, top: 338, bot: 428, hwT: 86, hwB: 74 };

  /* the funnel: a V open at the top, with a stem below it */
  function mxFunnel(o) {
    if (!(o > 0)) return "";
    var f = MX_FUN;
    var cone = "M" + n2(f.cx - f.mouthHw) + "," + n2(f.mouthY) +
      " L" + n2(f.cx - f.stemHw) + "," + n2(f.apexY) + " L" + n2(f.cx - f.stemHw) + "," + n2(f.stemY) +
      " M" + n2(f.cx + f.mouthHw) + "," + n2(f.mouthY) +
      " L" + n2(f.cx + f.stemHw) + "," + n2(f.apexY) + " L" + n2(f.cx + f.stemHw) + "," + n2(f.stemY);
    return G(Pth(cone, null, P.plastic, 5) + L(f.cx - f.mouthHw, f.mouthY, f.cx + f.mouthHw, f.mouthY, P.plastic, 5),
      { opacity: clamp(o, 0, 1) });
  }
  /* the paper cone, holding `sand` (0 none, 1 a heap up near the mouth).
     The cone is wide at the top and narrow at the bottom, so the heap's half
     width has to shrink as its top sinks towards the apex. */
  function mxPaper(o, sand) {
    if (!(o > 0)) return "";
    var f = MX_FUN, inset = 14, yTop = f.mouthY + 8, yBot = f.apexY - 4;
    var d = "M" + n2(f.cx - f.mouthHw + inset) + "," + n2(yTop) +
      " L" + n2(f.cx - f.stemHw + 2) + "," + n2(yBot) +
      " L" + n2(f.cx + f.stemHw - 2) + "," + n2(yBot) +
      " L" + n2(f.cx + f.mouthHw - inset) + "," + n2(yTop) + " Z";
    var heap = "";
    if (sand > 0.004) {
      var top = lerp(yBot - 4, yTop + 48, clamp(sand, 0, 1));
      var u = clamp((top - yTop) / (yBot - yTop), 0, 1);
      var hw = lerp(f.mouthHw - inset - 3, f.stemHw + 2, u);
      heap = Pth("M" + n2(f.cx - hw) + "," + n2(top) + " L" + n2(f.cx - f.stemHw + 3) + "," + n2(yBot - 2) +
        " L" + n2(f.cx + f.stemHw - 3) + "," + n2(yBot - 2) + " L" + n2(f.cx + hw) + "," + n2(top) + " Z", MX_SAND2) +
        mxGrains(f.cx, top + 10, hw * 0.6, 8, 10, 10, 5, 1, 53, {});
    }
    return G(Pth(d, P.paper, "#CFC6AE", 3) + heap, { opacity: clamp(o, 0, 1) });
  }

  function mxFilterChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSW = c(0, "sandwater"), cBoth = c(0, "both");
    var cFunnel = c(1, "funnel"), cJug = c(1, "jug"), cPaper = c(1, "paper"), cPour = c(1, "pour");
    var cDrips = c(2, "drips"), cClear = c(2, "clear");
    var cCannot = c(3, "cannot"), cHoles = c(3, "holes"), cStays = c(3, "stays");
    var cGuides = c(4, "guides"), cSep = c(4, "separating");
    var f = MX_FUN, out = "";

    /* ---- the jar of sandy water, tipping towards the funnel ----------------- */
    var jarO = on(t, cSW, 0.5);
    var pourEnd = spokenEnd(scene.first + 2) - 0.45;          /* the pour finishes inside beat 2 */
    var pourSpan = cPour == null ? 1 : Math.max(0.7, Math.min(1.6, spokenEnd(scene.first + 1) - cPour - 0.25));
    var tip = cPour == null ? 0 : ease((t - cPour) / pourSpan);
    var drain = cPour == null ? 0 : clamp((t - cPour - 0.35) / Math.max(0.8, pourEnd - cPour - 0.35), 0, 1);
    var jarLevel = lerp(MX_JAR.top + 34, MX_JAR.bot - 14, drain);
    var jarSand = Math.max(0, Math.round(14 * (1 - drain)));
    out += G(mxVessel(MX_JAR.cx, MX_JAR.top, MX_JAR.bot, MX_JAR.hwT, MX_JAR.hwB, jarLevel, MX_WATER, jarO,
      mxGrains(MX_JAR.cx, MX_JAR.bot - 34, MX_JAR.hwB * 0.68, 20, 14, jarSand, 6, 1, 61, {})),
      { transform: "rotate(" + n2(MX_JAR_TILT * tip) + "," + n2(MX_JAR_PIVOT[0]) + "," + n2(MX_JAR_PIVOT[1]) + ")" });

    /* "Both of them are still there": the water and the sand, named in the jar */
    var bo = on(t, cBoth, 0.45) * (1 - on(t, cFunnel, 0.5));
    if (bo > 0) out += G(mxLabel(t, 500, 92, "water", cBoth, [360, 112], true, 26) +
      mxLabel(t, 500, 214, "sand", cBoth == null ? null : cBoth + 0.45, [350, 162], true, 26), { opacity: bo });

    /* ---- the funnel, the paper and the jug ---------------------------------- */
    out += mxFunnel(on(t, cFunnel, 0.5));
    var sandIn = cPour == null ? 0 : clamp((t - cPour - 0.55) / Math.max(1.2, pourEnd - cPour - 0.55), 0, 1);
    out += mxPaper(on(t, cPaper, 0.5), sandIn * 0.82);

    /* the stream out of the jar's lip into the funnel's mouth */
    if (cPour != null) out += mxFall(t, cPour + 0.2, pourEnd, MX_JAR_LIP[0], MX_JAR_LIP[1] + 4, f.mouthY + 16,
      10, 8, 7, Math.min(1, tip * 3), [MX_WATER2, MX_WATER]);

    /* the jug below, filling with clear water as it drips through */
    var jugO = on(t, cJug, 0.5);
    var fill = cDrips == null ? 0 : clamp((t - cDrips - 0.25) / 2.0, 0, 1);
    out += mxVessel(MX_JUG.cx, MX_JUG.top, MX_JUG.bot, MX_JUG.hwT, MX_JUG.hwB,
      fill > 0.02 ? lerp(MX_JUG.bot - 8, MX_JUG.top + 14, fill) : null, MX_WATER2, jugO, "");
    if (cDrips != null) out += mxFall(t, cDrips, spokenEnd(scene.first + 2) - 0.1, f.cx, f.stemY + 4,
      MX_JUG.top + 8, 5, 5, 6, 1, [MX_WATER2, MX_WATER2]);
    var cw = on(t, cClear, 0.45);
    if (cw > 0) out += MK.leader(766, 386, MX_JUG.cx + MX_JUG.hwT - 14, MX_JUG.top + 44, on(t, cClear, 0.7), P.teal) +
      MK.pill(880, 386, "clear water", cw, { size: 28, col: P.teal });

    /* ---- "too big for the tiny holes": the paper seen close up -------------- */
    var lens = popIn(t, cHoles, 0.45) * mxSpan(t, scene, 3, 4);
    if (lens > 0) {
      var lx = 930, ly = 146, r = 98, inner = "";
      inner += Pth("M" + n2(lx - r) + "," + n2(ly + 14) + " H" + n2(lx + r), null, "#CFC6AE", 16);
      for (var h = 0; h < 7; h++) inner += C(lx - 78 + h * 26, ly + 14, 4, "#0E2434");
      for (var w = 0; w < 6; w++) {
        var ph = ((t * 0.9 + w * 0.17) % 1);
        inner += C(lx - 70 + w * 28, lerp(ly - 30, ly + 76, ph), 5.5, MX_WATER2, null, null,
          { opacity: Math.min(1, ph * 6, (1 - ph) * 6) });
      }
      inner += C(lx - 52, ly - 26, 17, MX_SAND) + C(lx + 4, ly - 32, 20, MX_SAND2) + C(lx + 58, ly - 24, 15, MX_SAND3);
      out += G(mxLens(lx, ly, r, inner, 1, 2.3) +
        MK.pill(lx, ly + 152, "too big for the holes", on(t, cCannot, 0.45), { size: 26, col: P.gold }), { opacity: lens });
    }
    /* the sand that stayed behind, named where it sits */
    var st = on(t, cStays, 0.5) * mxOnly(t, scene, 3);
    if (st > 0) out += G(MK.leader(336, 300, f.cx - 44, f.mouthY + 88, on(t, cStays, 0.7), P.gold) +
      MK.pill(330, 300, "stays behind", st, { size: 26, anchor: "end", col: P.gold }), { opacity: st });

    /* ---- the funnel only guides; the paper does the separating -------------- */
    var gu = on(t, cGuides, 0.45), sp = on(t, cSep, 0.45);
    if (gu > 0) out += MK.pill(320, 254, "only guides", gu, { size: 24, anchor: "end", col: P.line, ink: P.muted }) +
      MK.leader(326, 254, f.cx - f.mouthHw + 22, f.mouthY + 34, on(t, cGuides, 0.7), P.muted);
    if (sp > 0) out += MK.pill(320, 336, "does the separating", sp, { size: 24, anchor: "end", col: P.gold }) +
      MK.leader(326, 336, f.cx - 58, f.mouthY + 74, on(t, cSep, 0.7), P.gold) +
      MK.tick(250, 400, 26, popIn(t, cSep == null ? null : cSep + 0.5, 0.4));
    return svg(out);
  }

  /* ==== chapter: dissolving ====================================================== */
  var MX_GLASS = { cx: 330, top: 128, bot: 398, hwT: 96, hwB: 82 };

  /* a spoon tipping its salt in, `u` of the way over */
  function mxSpoon(cx, cy, u, o) {
    if (!(o > 0)) return "";
    return G(E(0, 0, 46, 26, "#CBD6E0", "#8FA2B2", 3) +
      E(0, -3, 34, 16, MX_SALT, null, null, { opacity: 1 - clamp(u * 1.6, 0, 1) }) +
      Pth("M40,6 L146,34", null, "#8FA2B2", 10),
      { transform: tr(cx, cy) + " rotate(" + n2(-52 * u) + ")", opacity: clamp(o, 0, 1) });
  }

  function mxDissolveChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cStir = c(0, "stir"), cGone = c(0, "gone");
    var cEver = c(1, "forever"), cNo = c(1, "no"), cStill = c(1, "still");
    var cTaste = c(2, "taste"), cGrown = c(2, "grownup"), cSalty = c(2, "salty");
    var cInGlass = c(3, "inglass"), cSmall = c(3, "small");
    var cMixing = c(4, "mixing"), cVanish = c(4, "vanishing");
    var cSol = c(5, "soluble"), cInsol = c(5, "insoluble");
    var g = MX_GLASS, out = "";

    var A = mxSpan(t, scene, 0, 5), B = mxFrom(t, scene, 5);

    if (A > 0) {
      var a = "", wTop = g.top + 42;
      /* the salt going in, and disappearing into the water */
      var tipSpan = cStir == null ? 1 : Math.max(0.6, Math.min(1.4, spokenEnd(scene.first) - cStir - 0.4));
      var tip = cStir == null ? 0 : ease((t - cStir) / tipSpan);
      /* low enough that the handle stays inside the box when it tips: at the
         full 52 degrees its tip rises about 94 px above the spoon's bowl */
      a += mxSpoon(g.cx - 30, g.top - 12, tip, on(t, cStir, 0.35) * (1 - on(t, cGone, 1.0)));
      /* where the spoonful came from, while it is going in and no longer */
      var pot = popIn(t, cStir, 0.45) * mxOnly(t, scene, 0);
      if (pot > 0) a += MK.pop(MK.pic(768, 182, 140, "\u{1F9C2}") +
        MK.pill(768, 292, "salt", 1, { size: 30, col: P.gold }), 768, 210, pot);
      a += mxVessel(g.cx, g.top, g.bot, g.hwT, g.hwB, wTop, MX_WATER, 1,
        mxFall(t, cStir == null ? null : cStir + 0.35, cGone == null ? 0 : cGone + 0.4, g.cx, wTop + 14, g.bot - 30, 34, 8, 6,
          1 - on(t, cGone, 0.9), [MX_SALT, "#DCE5EC"]));
      /* the tiny pieces that are still there. Once beat 3 has said they are in
         the glass they STAY in it, faintly, for the rest of the chapter: the
         film has just told the child the salt did not go anywhere. */
      var seen = on(t, cSmall, 0.5) * mxFrom(t, scene, 3);
      a += mxGrains(g.cx, (wTop + g.bot) / 2, g.hwB * 0.72, 92, 22, 22, 3, 0.55 * seen, 67, {});
      if (on(t, cInGlass, 0.5) > 0) a += Pth(mxVesselPath(g.cx, g.top, g.bot, g.hwT, g.hwB), null, P.gold, 6,
        { opacity: on(t, cInGlass, 0.5) * mxSpan(t, scene, 3, 4) * (0.5 + 0.5 * breathe(t)) });
      var lensOn = on(t, cSmall, 0.5) * mxSpan(t, scene, 3, 4);
      if (lensOn > 0) a += G(mxLens(g.cx + 166, 300, 92,
        mxGrains(g.cx + 166, 300, 58, 54, 12, 12, 7, 1, 71, { cols: [MX_SALT, "#DCE5EC", MX_SALT] }), 1, 1.1) +
        MK.pill(g.cx + 166, 414, "too small to see", 1, { size: 24, col: P.gold }), { opacity: lensOn });

      /* "Has the salt gone for ever?" - asked, then answered. The cross sits
         BESIDE the question, not over it: a mark on top of the words hid them. */
      var q = mxOnly(t, scene, 1);
      if (q > 0) {
        var qq = "";
        qq += MK.qmark(700, 112, 36, popIn(t, cEver, 0.4));
        qq += MK.pill(900, 112, "gone for ever?", on(t, cEver, 0.45), { size: 28, col: P.line, ink: P.muted });
        qq += MK.cross(1080, 112, 34, popIn(t, cNo, 0.4));
        qq += MK.pill(880, 262, "still there", on(t, cStill, 0.45), { size: 30, col: P.gold });
        qq += MK.tick(1062, 262, 32, popIn(t, cStill == null ? null : cStill + 0.4, 0.4));
        a += G(qq, { opacity: q });
      }

      /* "Taste one drop, with a grown-up" */
      var ta = mxOnly(t, scene, 2);
      if (ta > 0) {
        var tt = "";
        tt += R(676, 70, 456, 300, 22, P.card, P.line, 2, { opacity: on(t, cTaste, 0.45) });
        /* the spoon holds one drop of the salty WATER, not the dry salt, so
           its bowl is filled blue over mxSpoon's white */
        tt += MK.pop(mxSpoon(800, 136, 0, 1) + E(800, 133, 34, 16, MX_WATER2), 800, 136, popIn(t, cTaste, 0.45));
        tt += MK.pop(MK.pic(792, 262, 112, "\u{1F9D1}") + MK.pic(902, 272, 96, "\u{1F9D2}"), 850, 266, popIn(t, cGrown, 0.45));
        tt += MK.pill(1032, 214, "salty!", on(t, cSalty, 0.4), { size: 32, col: P.gold });
        tt += MK.leader(962, 240, 926, 282, on(t, cSalty, 0.6), P.gold);
        a += G(tt, { opacity: ta });
      }

      /* mixing, not vanishing */
      var mv = mxOnly(t, scene, 4);
      if (mv > 0) {
        var m = "";
        m += MK.pill(876, 150, "a kind of mixing", on(t, cMixing, 0.45), { size: 30, col: P.teal });
        m += MK.tick(1084, 150, 30, popIn(t, cMixing == null ? null : cMixing + 0.4, 0.4));
        m += MK.pill(876, 292, "a vanishing", on(t, cVanish, 0.45), { size: 30, col: P.line, ink: P.muted });
        m += MK.cross(1084, 292, 30, popIn(t, cVanish == null ? null : cVanish + 0.4, 0.4));
        a += G(m, { opacity: mv });
      }
      out += G(a, { opacity: A });
    }

    /* ---- beat 5: which solids dissolve, from the lesson's own table --------- */
    if (B > 0) {
      var b = "", W = 262, GAP = 28, X0 = 18, Y = 78, H = 264;
      var cards = [
        ["salt", "\u{1F9C2}", true, cSol],
        ["sugar", "\u{1F36C}", true, cSol == null ? null : cSol + 0.5],
        ["sand", null, false, cInsol],
        ["pebbles", null, false, cInsol == null ? null : cInsol + 0.5]
      ];
      for (var k = 0; k < 4; k++) {
        var x = X0 + k * (W + GAP), o = on(t, cards[k][3], 0.45), p = popIn(t, cards[k][3], 0.45);
        if (!(o > 0)) continue;
        var art = cards[k][1] ? MK.pic(x + W / 2, Y + 104, 104, cards[k][1])
          : k === 2 ? mxHeap(x + W / 2, Y + 150, 150, 42, 1) : mxStone(x + W / 2, Y + 104, 118, 1, 0);
        b += G(R(x, Y, W, H, 22, P.card, cards[k][2] ? P.good : P.line, 3) + art +
          Tx(x + W / 2, Y + 208, cards[k][0], "lab big", "middle") +
          Tx(x + W / 2, Y + 244, cards[k][2] ? "dissolves" : "does not", "lab mid muted readable", "middle"),
          { opacity: o, transform: around(x + W / 2, Y + H / 2, 0.96 + 0.04 * Math.min(p, 1.08)) });
        b += (cards[k][2] ? MK.tick : MK.cross)(x + W - 26, Y + 24, 26, popIn(t, cards[k][3] == null ? null : cards[k][3] + 0.35, 0.4));
      }
      out += G(b, { opacity: B });
    }
    return svg(out);
  }
