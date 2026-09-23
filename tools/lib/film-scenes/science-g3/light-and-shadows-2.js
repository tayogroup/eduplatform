  /* ==== chapter: a shadow ====================================================
     tools/lib/film-scenes/science-g3/light-and-shadows-2.js.

     The lesson's demo step, which has no drawing of its own: four frames of a
     torch, a hand, a shadow and the torch switched off. Drawn here in the
     colours its own light sims use - the wall of shadowSize, the pale gold
     beam of both of them - with the hand emoji the demo itself shows, and its
     shadow drawn as that same hand's black silhouette, because the line says
     the shadow is the shape of the hand.

     The three things stand where the lesson's own sims stand them, left to
     right: the torch, then the hand IN the beam with the dark stage behind it,
     then the wall as a panel on the right with the shadow on it. The wall used
     to be a rectangle starting at x = 280, so the hand was drawn on top of it
     and read as being stuck to the wall beside its own shadow. */
  /* The sizes are held down by what a big emoji's own box measures, not by
     what it draws: at 260 the shadow's <text> box ran 13 px past the bottom of
     the 1168 x 440 space, which --sweep reports. The shadow is the hand times
     (sx - ax) / (hx - ax), so the two sizes move together. */
  var LS_SH = { ax: 196, ay: 226, hx: 660, hs: 138, sx: 1002, ss: 240,
    wx: 852, ww: 300, wy: 20, wh: 406, half: 186, far: 1152 };

  /* the cone of light, drawn as the patch it lights: it sweeps out from the
     torch as the wall is called bright, and reaches the wall at the far edge */
  function lsShBeam(u) {
    if (!(u > 0)) return "";
    var far = lerp(LS_SH.ax + 30, LS_SH.far, clamp(u, 0, 1));
    var h = LS_SH.half * (far - LS_SH.ax) / (LS_SH.far - LS_SH.ax);
    return el("polygon", { points: n2(LS_SH.ax) + "," + n2(LS_SH.ay) + " " + n2(far) + "," + n2(LS_SH.ay - h) +
      " " + n2(far) + "," + n2(LS_SH.ay + h), fill: LS_WALL_LIT, opacity: n2(0.92 * clamp(u, 0, 1)) });
  }

  function lsShadowChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTorch = c(0, "torch"), cWall = c(0, "wall"), cBright = c(0, "bright");
    var cHand = c(1, "hand"), cOpaque = c(1, "opaque"), cBlocks = c(1, "blocks");
    var cWhere = c(2, "where"), cDark = c(2, "dark");
    var cShadow = c(3, "shadow"), cShape = c(3, "shape");
    var cNot = c(4, "not"), cReach = c(4, "reach");
    var cOff = c(5, "off"), cNone = c(5, "none");

    var off = on(t, cOff, 0.6);
    var lit = on(t, cBright, 0.9) * (1 - off);
    var hand = popIn(t, cHand, 0.5);
    var shade = Math.min(1, hand) * on(t, cWhere, 0.7) * (1 - on(t, cOff, 0.5));
    var out = "";

    /* the wall: a panel on the right, dull until the light lands on it */
    out += R(LS_SH.wx, LS_SH.wy, LS_SH.ww, LS_SH.wh, 10, "#4A4640");
    out += lsShBeam(lit);
    out += R(LS_SH.wx, LS_SH.wy, LS_SH.ww, LS_SH.wh, 10, "none", P.line, 2);
    /* ringed as "on a wall" is said */
    out += R(LS_SH.wx - 5, LS_SH.wy - 5, LS_SH.ww + 10, LS_SH.wh + 10, 12, "none", P.gold, 4,
      { opacity: n2(bump(t, cWall, 1.6)) });
    /* the dark shape settling in: the same hand, in black, bigger, on the wall */
    out += lsSilhouette(LS_SH.sx, LS_SH.ay, LS_SH.ss, "✋", shade);
    out += MK.ripple(LS_SH.sx, LS_SH.ay, t, cDark, P.ink);
    /* the hand itself, opaque, standing in the beam; it dims with the torch,
       because with the light off there is nothing lighting the hand either */
    out += G(Em(LS_SH.hx, LS_SH.ay, LS_SH.hs, "✋"),
      { transform: around(LS_SH.hx, LS_SH.ay, Math.min(hand, 1.1)), opacity: n2(Math.min(1, hand) * (1 - 0.45 * off)) });

    /* "it blocks the light", and again on "where light cannot reach": rays from
       the torch that stop dead at the hand */
    var stop = Math.max(bump(t, cBlocks, 1.8), bump(t, cReach, 2.0)) * (1 - off);
    if (stop > 0) {
      for (var r = 0; r < 5; r++) {
        out += L(LS_SH.ax + 16, LS_SH.ay + (r - 2) * 12, LS_SH.hx - 84, LS_SH.ay + (r - 2) * 34, P.gold, 5,
          { opacity: n2(0.9 * stop), "stroke-dasharray": "13 10" });
      }
    }
    /* the torch, whose glow goes out with it */
    out += MK.glow(LS_SH.ax - 14, LS_SH.ay, 78, P.gold,
      Math.max(on(t, cTorch, 0.5) * 0.7, lit) * (0.7 + 0.3 * breathe(t)) * (1 - off));
    out += G(Em(150, LS_SH.ay, 100, "\u{1F526}"), { transform: around(150, LS_SH.ay, Math.min(popIn(t, cTorch, 0.45), 1.1)) });

    /* the words: opaque on the hand, shadow on the dark shape */
    out += lsLabel(t, LS_SH.hx, 386, "opaque", cOpaque, [LS_SH.hx, 314], true, 28);
    /* the shadow's label goes with the shadow when the torch is switched off */
    out += G(lsLabel(t, LS_SH.sx, 406, "shadow", cShadow, [LS_SH.sx, 368], true, 28),
      { opacity: n2(1 - on(t, cOff, 0.5)) });
    /* "the shape of your hand": both outlined together, and a line between them */
    var same = bump(t, cShape, 2.0);
    if (same > 0) {
      out += C(LS_SH.hx, LS_SH.ay, 88, "none", P.gold, 4, { opacity: n2(same) });
      out += C(LS_SH.sx, LS_SH.ay, 132, "none", P.gold, 4, { opacity: n2(same) });
      out += L(LS_SH.hx + 94, LS_SH.ay, LS_SH.sx - 138, LS_SH.ay, P.gold, 3, { opacity: n2(same), "stroke-dasharray": "10 9" });
    }
    /* "a shadow does not come out of your hand" */
    var giv = on(t, cNot, 0.45) * (1 - on(t, cReach, 0.5));
    if (giv > 0) {
      out += G(MK.arrow(744, LS_SH.ay, 846, LS_SH.ay, on(t, cNot, 0.5), P.gold, 7), { opacity: n2(giv) });
      out += MK.cross(795, LS_SH.ay, 26, popIn(t, cNot == null ? null : cNot + 0.45, 0.4) * giv);
    }
    /* the torch switched off: no light, nothing to block, no shadow */
    out += MK.cross(150, 106, 34, popIn(t, cOff, 0.4));
    out += MK.pill(LS_SH.sx, LS_SH.ay, "no shadow", on(t, cNone, 0.4), { size: 30, col: P.muted, ink: P.muted });
    return svg(out);
  }
