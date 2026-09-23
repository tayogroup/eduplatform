  /* ==== chapter: solids and liquids ==========================================
     tools/lib/film-scenes/science-g3/solids-liquids-and-gases-2.js.

     The lesson's own state tester stands on the left for the whole chapter and
     steps through exactly the states its buttons reach: the block tipped over
     on "Turn a block over", the water poured into the glass on "into a glass".
     Beside it the same two ideas drawn big: a block that turns and turns and
     keeps its square, and one lot of water that is glass-shaped and then
     bowl-shaped. */

  var SL_TEST = { x: 40, y: 90, w: 448, h: 280 };
  function slTX(v) { return SL_TEST.x + v * SL_TEST.w / 320; }
  function slTY(v) { return SL_TEST.y + v * SL_TEST.h / 200; }
  function slTestCard(state) { return ART.place(ART.sim("states", "draw", state), SL_TEST.x, SL_TEST.y, SL_TEST.w, SL_TEST.h); }

  /* the lesson's card, stepping from state to state as its buttons are named */
  function slTester(t, cTip, cPour) {
    var u1 = on(t, cTip, 0.45), u2 = on(t, cPour, 0.45), out = "";
    out += slCard(SL_TEST.x - 8, SL_TEST.y - 8, SL_TEST.w + 16, SL_TEST.h + 16);
    if (u2 > 0) {
      out += slTestCard({ tipped: true, poured: true });
      if (u2 < 1) out += G(slTestCard({ tipped: u1 > 0.5 }), { opacity: 1 - u2 });
    } else if (u1 > 0) {
      out += slTestCard({ tipped: true });
      if (u1 < 1) out += G(slTestCard({}), { opacity: 1 - u1 });
    } else out += slTestCard({});
    return out;
  }

  /* a jug, its body centred on (cx, cy), tipped `tip` degrees about its lip */
  function slJug(cx, cy, s, tip, o) {
    if (!(o > 0)) return "";
    var w = s * 0.78, h = s * 0.62, lx = cx + w / 2, ly = cy - h / 2;
    var body = R(cx - w / 2, cy - h / 2, w, h, s * 0.1, SL_GLASS, "#8FA6B8", 4) +
      Pth("M" + n2(lx - 2) + "," + n2(ly) + " l" + n2(s * 0.22) + "," + n2(s * 0.07) + " l" + n2(-s * 0.2) + "," + n2(s * 0.12) + " Z", SL_GLASS) +
      Pth("M" + n2(cx - w / 2) + "," + n2(cy - h * 0.2) + " q" + n2(-s * 0.2) + "," + n2(s * 0.16) + " 0," + n2(s * 0.3), null, "#8FA6B8", 6) +
      R(cx - w / 2 + 6, cy - h / 2 + h * 0.4, w - 12, h * 0.5, s * 0.05, SL_WATER, null, null, { opacity: 0.75 });
    return G(body, { transform: "rotate(" + n2(tip) + " " + n2(lx) + " " + n2(ly) + ")", opacity: clamp(o, 0, 1) });
  }
  function slJugLip(cx, cy, s, tip) {
    var w = s * 0.78, h = s * 0.62, lx = cx + w / 2, ly = cy - h / 2;
    var px = lx + s * 0.2, py = ly + s * 0.1, a = tip * Math.PI / 180;
    return [lx + (px - lx) * Math.cos(a) - (py - ly) * Math.sin(a), ly + (px - lx) * Math.sin(a) + (py - ly) * Math.cos(a)];
  }

  /* (px, py) turned `deg` degrees about (cx, cy): where the tipping glass's
     lip has got to, so the stream leaves the lip instead of a fixed point the
     glass has swung away from */
  function slTurned(px, py, cx, cy, deg) {
    var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), dx = px - cx, dy = py - cy;
    return [cx + dx * c - dy * s, cy + dx * s + dy * c];
  }

  /* beats 0 and 1: the block turns, and keeps its square */
  var SL_BX = 762, SL_BY = 258, SL_BS = 158;
  function slBlockPic(t, scene) {
    var cKeeps = sc(scene, 0, "keeps"), cTurn = sc(scene, 0, "turn"), cStill = sc(scene, 0, "still");
    var cTipH = sc(scene, 1, "tip"), cNot = sc(scene, 1, "not");
    var rot = 90 * on(t, cTurn, 0.9) + 180 * on(t, cTipH, 1.3);
    var out = "";
    /* the square the block had, drawn once and never moved: the block still fits
       it. Nine pixels proud of the block, because a square turned 90 or 180
       degrees covers its own outline exactly and the mark was invisible. */
    var ghost = on(t, cKeeps, 0.5);
    out += R(SL_BX - SL_BS / 2 - 9, SL_BY - SL_BS / 2 - 9, SL_BS + 18, SL_BS + 18, SL_BS * 0.08, "none", P.gold, 4,
      { opacity: ghost * (0.5 + 0.5 * Math.max(bump(t, cStill, 1.3), bump(t, cNot, 1.5))), "stroke-dasharray": "14 10" });
    out += slBlock(SL_BX, SL_BY, SL_BS, rot, 1);
    out += MK.pill(990, 150, "the same shape", on(t, cKeeps, 0.45), { size: 28, col: P.gold });
    out += MK.tick(990, 250, 34, Math.max(popIn(t, cStill, 0.4), popIn(t, cNot, 0.4)));
    out += MK.arrow(SL_BX - 116, SL_BY - 108, SL_BX - 24, SL_BY - 108, on(t, cTurn, 0.5), P.gold, 7);
    return out;
  }

  /* beats 2 and 3: one lot of water, glass-shaped and then bowl-shaped */
  var SL_GX = 686, SL_GTOP = 160, SL_GH = 152, SL_OX = 990, SL_OY = 290;
  function slPourPic(t, scene) {
    var cNone = sc(scene, 2, "none"), cGlass = sc(scene, 2, "glass"), cShaped = sc(scene, 2, "shaped");
    var cBowl = sc(scene, 3, "bowl"), cShaped2 = sc(scene, 3, "shaped");
    var out = "";
    /* "no shape of its own": a blob of water with no shape at all */
    var blob = on(t, cNone, 0.45) * (1 - on(t, cGlass, 0.45));
    if (blob > 0) {
      var wob = Math.sin(t * 2.4) * 10, wo2 = Math.cos(t * 1.9) * 8;
      out += G(Pth("M-62,6 q" + n2(4 + wob) + ",-52 62,-46 q" + n2(58 + wo2) + ",6 60,46 q-2,34 -60,34 q-58,0 -62,-34 Z", SL_WATER, "#8FC4F0", 4, { opacity: 0.85 }),
        { transform: tr(846, 116), opacity: blob });
      out += MK.qmark(944, 96, 24, blob);
    }
    /* the jug pours into the glass */
    var fillG = on(t, cGlass, 1.2), tipJ = 46 * on(t, cGlass, 0.5);
    var jugO = on(t, cNone, 0.4) * (1 - on(t, cBowl, 0.5));
    if (jugO > 0) {
      out += slJug(596, 126, 132, tipJ, jugO);
      var lip = slJugLip(596, 126, 132, tipJ);
      out += G(slStream(t, cGlass == null ? null : cGlass + 0.25, cGlass == null ? 0 : cGlass + 1.15, lip[0], lip[1], SL_GX, SL_GTOP + 14, 14), { opacity: jugO });
    }
    /* the glass, filling and then tipping into the bowl. 46 degrees, not 62:
       tipped further it stopped reading as a glass at all, and an EMPTY glass
       is not what this beat is about, so it goes quiet (0.4) once its water is
       in the bowl and the bowl has the stage. */
    var empty = on(t, cBowl, 1.1), tipG = 46 * empty, pvx = SL_GX - 44, pvy = SL_GTOP + SL_GH;
    var levelG = fillG * 0.74 * (1 - empty);
    out += G(slGlass(SL_GX, SL_GTOP, SL_GH, 118, 88, levelG, 1 - 0.6 * empty), { transform: "rotate(" + n2(tipG) + " " + n2(pvx) + " " + n2(pvy) + ")" });
    out += Pth("M" + n2(SL_GX - 52) + "," + n2(SL_GTOP + 22) + " L" + n2(SL_GX - 40) + "," + n2(SL_GTOP + SL_GH - 6) +
      " L" + n2(SL_GX + 40) + "," + n2(SL_GTOP + SL_GH - 6) + " L" + n2(SL_GX + 52) + "," + n2(SL_GTOP + 22), null, P.gold, 5,
      { opacity: bump(t, cShaped, 1.6), transform: "rotate(" + n2(tipG) + " " + n2(pvx) + " " + n2(pvy) + ")" });
    out += MK.pill(SL_GX, 356, "glass-shaped", on(t, cShaped, 0.45) * (1 - on(t, cBowl, 0.5)), { size: 28, col: P.gold });
    /* the bowl */
    var fillB = on(t, cBowl == null ? null : cBowl + 0.35, 1.1);
    out += slBowl(SL_OX, SL_OY, 232, 66, fillB * 0.8, on(t, cBowl, 0.4), "slBowlA");
    if (cBowl != null) {
      var lipG = slTurned(SL_GX + 59, SL_GTOP, pvx, pvy, tipG);
      out += slStream(t, cBowl + 0.3, cBowl + 1.2, lipG[0], lipG[1], SL_OX - 54, SL_OY + 10, 14);
    }
    out += Pth("M" + n2(SL_OX - 104) + "," + n2(SL_OY + 12) + " Q" + n2(SL_OX) + "," + n2(SL_OY + 118) + " " + n2(SL_OX + 104) + "," + n2(SL_OY + 12), null, P.gold, 5,
      { opacity: bump(t, cShaped2, 1.6) });
    out += MK.pill(SL_OX, 408, "bowl-shaped", on(t, cShaped2, 0.45), { size: 28, col: P.gold });
    return out;
  }

  /* beat 4: the difference, side by side */
  function slDiffPic(t, scene) {
    var cDiff = sc(scene, 4, "diff"), cOwn = sc(scene, 4, "own"), cNot = sc(scene, 4, "not");
    var out = "";
    out += MK.pill(846, 76, "shape is the difference", on(t, cDiff, 0.45), { size: 28, col: P.line });
    /* a solid has its own shape */
    out += slBlock(660, 226, 124, 0, on(t, cOwn, 0.4));
    out += R(598, 164, 124, 124, 10, "none", P.gold, 4, { opacity: on(t, cOwn, 0.5), "stroke-dasharray": "13 9" });
    out += MK.tick(736, 168, 26, popIn(t, cOwn, 0.4));
    out += MK.pill(660, 330, "its own shape", on(t, cOwn, 0.5), { size: 24, col: P.gold });
    /* a liquid does not */
    var nq = on(t, cNot, 0.4);
    out += slGlass(918, 176, 112, 82, 62, 0.72, nq);
    out += slBowl(1068, 268, 140, 42, 0.78, nq, "slBowlB");
    out += MK.cross(1006, 132, 26, popIn(t, cNot, 0.4));
    out += MK.pill(1000, 356, "no shape of its own", nq, { size: 24, col: P.line });
    return out;
  }

  function slShapesChapter(scene, beat, t, i) {
    var k = i - scene.first;
    var left = slTester(t, sc(scene, 0, "turn"), sc(scene, 2, "glass"));
    function draw(bi) {
      var kk = bi - scene.first;
      return kk <= 1 ? slBlockPic(t, scene) : kk <= 3 ? slPourPic(t, scene) : slDiffPic(t, scene);
    }
    var right;
    if (k <= 1 || k === 3) right = draw(i);
    else right = crossfade(t, i, scene, draw);
    return svg(left + right);
  }
