  /* ==== Grade 4 Science, Lesson 11: Inside the Earth, part 2 ==================
     tools/lib/film-scenes/science-g4/inside-the-earth-2.js: the two demo
     chapters, "A volcano" and "Earthquakes". Both draw the lesson's own demo
     (ART.scene "volcano" and "quake", the four frames each Next button steps
     through), whole and in a card, with the lesson's words beside them. */

  /* ---- chapter: a volcano ------------------------------------------------------
     The lesson's volcano demo. Its four states follow the beats: magma under
     unbroken crust, the magma rising through the crack, the eruption, and the
     cooled lava with a taller mountain. Beats 2 and 3 share the eruption, and
     beats 4 and 5 share the cooled one, so the card changes exactly where the
     lesson's own Next button changes it. */
  var IE_V = { x: 44, y: 30, s: 420 };
  IE_V.k = IE_V.s / 320;
  IE_V.h = IE_V.s * 260 / 320;
  function ieVX(v) { return IE_V.x + v * IE_V.k; }
  function ieVY(v) { return IE_V.y + v * IE_V.k; }
  function ieVolCard(state) { return ART.place(ART.scene("volcano", state), IE_V.x, IE_V.y, IE_V.s, IE_V.h); }

  var IE_VSTATE = [0, 1, 2, 2, 3, 3];
  /* the card at the beat's own state, the one before it fading out */
  function ieVolStack(t, scene, i) {
    var k = i - scene.first, now = IE_VSTATE[k];
    if (k === 0 || IE_VSTATE[k - 1] === now) return ieVolCard(now);
    var u = into(t, i);
    return G(ieVolCard(IE_VSTATE[k - 1]), { opacity: 1 - u }) + G(ieVolCard(now), { opacity: u });
  }

  /* a small volcano of the lesson's own colours: base 2w wide, h tall, on (x, y) */
  function ieCone(x, y, w, h, hot) {
    return Pth("M" + n2(x - w) + "," + n2(y) + " L" + n2(x - 5) + "," + n2(y - h) +
        " L" + n2(x + 5) + "," + n2(y - h) + " L" + n2(x + w) + "," + n2(y) + " Z",
      "#5B4A3A", "#B59A78", 2) +
      (hot ? Pth("M" + n2(x - 5) + "," + n2(y - h) + " L" + n2(x - 3) + "," + n2(y - h - 11) +
        " L" + n2(x + 3) + "," + n2(y - h - 11) + " L" + n2(x + 5) + "," + n2(y - h) + " Z", "#E9744F") : "");
  }

  function ieVolcanoChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cHot = c(0, "hot"), cMagma = c(0, "magma");
    var cBroken = c(1, "broken"), cPush = c(1, "push"), cCrack = c(1, "crack");
    var cErupt = c(2, "erupt"), cLava = c(2, "lava"), cAsh = c(2, "ash");
    var cLava2 = c(3, "lava"), cSurf = c(3, "surface");
    var cCools = c(4, "cools"), cGrows = c(4, "grows"), cCrater = c(4, "crater");
    var cBreaks = c(5, "breaks"), cLines = c(5, "lines");
    var out = "";

    /* the lesson's drawing, whole, with room round it */
    out += R(IE_V.x - 12, IE_V.y - 12, IE_V.s + 24, IE_V.h + 24, 20, P.card, P.line, 2);
    out += ieVolStack(t, scene, i);

    /* beat 0: the rock under the crust is so hot that it melts, and that is magma */
    var b0 = ieOnly(t, scene, 0);
    if (b0 > 0) {
      var hot = on(t, cHot, 0.5) * b0;
      if (hot > 0) {
        out += MK.glow(ieVX(160), ieVY(214), 96, P.accent, hot * (0.6 + 0.4 * breathe(t)));
        out += E(ieVX(160), ieVY(214), ieVX(216) - ieVX(160), ieVY(230) - ieVY(214), "none", P.gold, 5,
          { opacity: hot });
      }
      out += ieTag(t, 700, 312, "magma", cMagma, [ieVX(212), ieVY(212)], true, 34, "left");
      var mo = on(t, cMagma, 0.5) * b0;
      if (mo > 0) out += Tx(700, 366, "melted rock, underground", "lab mid muted", "middle", { opacity: mo });
    }

    /* beat 1: the crust is broken, and the magma pushes up the crack */
    var b1 = ieOnly(t, scene, 1);
    if (b1 > 0) {
      var br = on(t, cBroken, 0.45) * b1;
      if (br > 0) out += R(ieVX(140), ieVY(142), ieVX(180) - ieVX(140), ieVY(164) - ieVY(142), 6,
        "none", P.gold, 4, { opacity: br });
      out += MK.arrow(ieVX(160), ieVY(206), ieVX(160), ieVY(142), on(t, cPush, 0.7) * b1, P.gold, 8);
      out += MK.ripple(ieVX(160), ieVY(150), t, cCrack, P.gold);
      out += ieTag(t, 720, 200, "a break in the crust", cBroken, [ieVX(186), ieVY(156)], true, 30, "left");
    }

    /* beat 2: it erupts - lava, ash and gas */
    var b2 = ieOnly(t, scene, 2);
    if (b2 > 0) {
      out += MK.ripple(ieVX(160), ieVY(112), t, cErupt, P.gold);
      out += ieTag(t, 700, 300, "lava", cLava, [ieVX(202), ieVY(143)], true, 34, "left");
      out += ieTag(t, 760, 96, "ash and gas", cAsh, [ieVX(196), ieVY(26)], true, 30, "left");
    }

    /* beat 3: the same melted rock has two names, one below the surface and one above */
    var b3 = ieOnly(t, scene, 3);
    if (b3 > 0) {
      var so = on(t, cSurf, 0.5) * b3;
      out += G(L(640, 244, 1060, 244, P.muted, 3, { "stroke-dasharray": "12 9" }) +
        Tx(1060, 232, "the surface", "lab mid muted", "end"), { opacity: so });
      out += MK.pill(850, 322, "magma", on(t, cLava2, 0.45) * b3, { size: 34, col: P.line });
      out += Tx(850, 372, "underground", "lab mid muted", "middle", { opacity: on(t, cLava2, 0.45) * b3 });
      out += MK.arrow(850, 296, 850, 200, on(t, cSurf, 0.7) * b3, P.gold, 8);
      out += MK.pill(850, 160, "lava", on(t, cSurf == null ? null : cSurf + 0.35, 0.45) * b3, { size: 34, col: P.gold });
      out += Tx(850, 112, "out on the surface", "lab mid muted", "middle",
        { opacity: on(t, cSurf == null ? null : cSurf + 0.35, 0.45) * b3 });
    }

    /* beat 4: the lava cools into new rock, and the mountain grows */
    var b4 = ieOnly(t, scene, 4);
    if (b4 > 0) {
      out += ieTag(t, 700, 322, "new rock", cCools, [ieVX(204), ieVY(121)], true, 32, "left");
      var gu = on(t, cGrows, 0.7) * b4;
      out += MK.arrow(ieVX(272), ieVY(150), ieVX(272), lerp(ieVY(150), ieVY(86), gu), gu, P.gold, 7);
      if (gu > 0) out += L(ieVX(240), ieVY(84), ieVX(290), ieVY(84), P.gold, 3, { opacity: gu, "stroke-dasharray": "9 7" });
      var cr = on(t, cCrater, 0.5) * b4;
      if (cr > 0) out += C(ieVX(160), ieVY(86), 26, "none", P.gold, 4, { opacity: cr });
      out += ieTag(t, 760, 120, "the crater", cCrater, [ieVX(178), ieVY(82)], true, 30, "left");
    }

    /* beat 5: volcanoes sit at the breaks in the crust, so they come in lines */
    var b5 = ieOnly(t, scene, 5);
    if (b5 > 0) {
      var bx = 560, by = 280, bw = 570;
      var brk = on(t, cBreaks, 0.6) * b5;
      out += Pth("M" + bx + "," + by + " l72,-16 l84,20 l78,-22 l86,18 l80,-14 l90,16",
        null, P.gold, 5, { opacity: brk, "stroke-dasharray": "16 10" });
      if (brk > 0) out += Tx(bx + bw / 2, by + 58, "a break in the crust", "lab mid muted", "middle", { opacity: brk });
      var n = tally(t, cLines, 5, 1.1) * (b5 > 0.3 ? 1 : 0);
      var spots = [[632, 264], [716, 284], [794, 262], [880, 280], [960, 266]];
      for (var k = 0; k < 5; k++) {
        if (k >= n) continue;
        var p = popIn(t, cLines == null ? null : cLines + k * 0.22, 0.35);
        out += MK.pop(ieCone(spots[k][0], spots[k][1], 26, 40, 1), spots[k][0], spots[k][1], p * b5);
      }
      out += MK.pill(846, 150, "they come in lines", on(t, cLines, 0.5) * b5, { size: 30, col: P.gold });
    }
    return svg(out);
  }

  /* ---- chapter: earthquakes ----------------------------------------------------
     The lesson's earthquake demo (ART.scene "quake"), the four frames its Next
     button steps through: two plates side by side, the push, the sudden slip,
     and the crack left behind. The picture changes where the lesson's own
     caption changes, with one exception: the slip lands on the word "slip"
     rather than at a beat boundary, because that is the word it belongs to. */
  var IE_Q = { x: 44, y: 34, s: 420 };
  IE_Q.k = IE_Q.s / 320;
  IE_Q.h = IE_Q.s * 240 / 320;
  function ieQX(v) { return IE_Q.x + v * IE_Q.k; }
  function ieQY(v) { return IE_Q.y + v * IE_Q.k; }
  function ieQuakeCard(state, dx) { return ART.place(ART.scene("quake", state), IE_Q.x + dx, IE_Q.y, IE_Q.s, IE_Q.h); }

  /* the four states, mixed by three switches: to the push at beat 2, to the
     slip on the word "slip" in beat 3, to the crack at beat 5 */
  function ieQuakeStack(t, scene, dx) {
    var toPush = into(t, scene.first + 2);
    var toSlip = on(t, sc(scene, 3, "slip"), 0.25);
    var toAfter = into(t, scene.first + 5);
    var w = [1 - toPush, toPush * (1 - toSlip), toSlip * (1 - toAfter), toAfter], out = "";
    for (var s = 0; s < 4; s++) if (w[s] > 0.004) out += G(ieQuakeCard(s, dx), { opacity: Math.min(1, w[s]) });
    return out;
  }

  /* a crack in the ground: a zigzag running down from (x, y) */
  function ieCrack(x, y, h, col, w, extra) {
    var d = "M" + n2(x) + "," + n2(y), yy = y, k = 0, steps = [7, -9, 10, -8, 8, -7];
    while (yy < y + h) { d += " l" + steps[k % steps.length] + "," + n2(Math.min(h / 3, y + h - yy)); yy += h / 3; k++; }
    return Pth(d, null, col || "#1B1B1B", w || 4, extra);
  }

  function ieQuakeChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cOne = c(0, "one"), cPlates = c(0, "plates");
    var cRest = c(1, "rest"), cCreep = c(1, "creep"), cNails = c(1, "nails");
    var cPush = c(2, "push"), cStick = c(2, "stick");
    var cBuilds = c(3, "builds"), cSlip = c(3, "slip");
    var cQuake = c(4, "quake"), cShakes = c(4, "shakes");
    var cCrack = c(5, "crack"), cSame = c(5, "same");
    var out = "", bx = ieQX(160);

    /* the lesson's drawing, whole, with room round it; it shakes on the slip
       and on "the ground shakes", inside its own card */
    var dx = ieShake(t, cSlip, 0.8, 6) + ieShake(t, cShakes, 0.9, 5);
    out += R(IE_Q.x - 12, IE_Q.y - 12, IE_Q.s + 24, IE_Q.h + 24, 20, P.card, P.line, 2);
    out += ieQuakeStack(t, scene, dx);

    /* beat 0: not one shell, but huge pieces called plates */
    var b0 = ieOnly(t, scene, 0);
    if (b0 > 0) {
      var one = on(t, cOne, 0.45) * (1 - on(t, cPlates, 0.35)) * b0;
      if (one > 0) {
        out += R(ieQX(0), ieQY(110), ieQX(320) - ieQX(0), ieQY(240) - ieQY(110), 10, "none", P.gold, 4,
          { "stroke-dasharray": "14 10", opacity: one });
        out += MK.cross(536, 214, 26, popIn(t, cOne == null ? null : cOne + 0.4, 0.35) * one);
      }
      var pl = on(t, cPlates, 0.45) * b0;
      if (pl > 0) {
        out += R(ieQX(2), ieQY(112), bx - ieQX(4), ieQY(238) - ieQY(112), 10, "none", P.gold, 4, { opacity: pl });
        out += R(bx + 2, ieQY(112), ieQX(318) - bx - 2, ieQY(238) - ieQY(112), 10, "none", P.gold, 4, { opacity: pl });
        out += L(bx, ieQY(108), bx, ieQY(242), P.gold, 5, { opacity: pl });
      }
      out += ieTag(t, 149, 392, "plate", cPlates, [149, 300], true, 30, "up");
      out += ieTag(t, 359, 392, "plate", cPlates, [359, 300], true, 30, "up");
    }

    /* beat 1: they rest on the hot mantle, and creep along */
    var b1 = ieOnly(t, scene, 1);
    if (b1 > 0) {
      var re = on(t, cRest, 0.5) * b1;
      if (re > 0) {
        out += MK.glow(bx, 352, 70, P.accent, re * (0.6 + 0.4 * breathe(t)));
        out += G(R(32, 366, 444, 30, 15, "#E9744F") +
          Tx(254, 387, "the hot mantle", "lab mid", "middle", { fill: "#2B1608" }), { opacity: re });
      }
      var cr = cCreep == null ? 0 : clamp((t - cCreep) / 1.5, 0, 1) * b1;
      if (cr > 0) {
        out += MK.arrow(ieQX(26), ieQY(146), ieQX(118), ieQY(146), cr, P.gold, 7);
        out += MK.arrow(ieQX(294), ieQY(146), ieQX(202), ieQY(146), cr, P.gold, 7);
      }
      var na = popIn(t, cNails, 0.45) * b1;
      if (na > 0) out += MK.pop(Em(716, 170, 128, "\u{1F590}️"), 716, 170, na);
      out += MK.pill(716, 296, "a few centimetres a year", on(t, cNails, 0.5) * b1, { size: 28, col: P.gold });
    }

    /* beat 2: the plates push, and their edges catch and stick */
    var b2 = ieOnly(t, scene, 2);
    if (b2 > 0) {
      var pu = on(t, cPush, 0.5) * b2;
      if (pu > 0) {
        out += R(ieQX(96), ieQY(158), ieQX(144) - ieQX(96), ieQY(182) - ieQY(158), 10, "none", P.gold, 4, { opacity: pu });
        out += R(ieQX(176), ieQY(158), ieQX(224) - ieQX(176), ieQY(182) - ieQY(158), 10, "none", P.gold, 4, { opacity: pu });
      }
      var st = on(t, cStick, 0.6) * b2;
      if (st > 0) out += ieCrack(bx, ieQY(122), 132, P.gold, 6, { opacity: st });
      out += ieTag(t, 760, 250, "they catch and stick", cStick, [bx + 6, 264], true, 30, "left");
    }

    /* beat 3: the push builds up for years, then the edges slip */
    var b3 = ieOnly(t, scene, 3);
    if (b3 > 0) {
      var bu = 0;
      if (cBuilds != null) {
        var span = cSlip != null && cSlip > cBuilds + 0.4 ? cSlip - cBuilds : 1.4;
        bu = clamp((t - cBuilds) / span, 0, 1);
        if (cSlip != null && t >= cSlip) bu = 1 - clamp((t - cSlip) / 0.25, 0, 1);
      }
      var go = on(t, cBuilds, 0.4) * b3;
      if (go > 0) {
        out += G(Tx(862, 254, "the push builds up", "lab mid muted", "middle") +
          R(622, 276, 480, 44, 22, P.cell, P.line, 2) +
          R(626, 280, 472 * bu, 36, 18, P.gold), { opacity: go });
      }
      out += MK.ripple(bx, 262, t, cSlip, P.gold);
      var fl = bump(t, cSlip, 0.45) * b3;
      if (fl > 0) out += R(622, 276, 480, 44, 22, "#FFFFFF", null, null, { opacity: 0.55 * fl });
      out += MK.pill(862, 366, "slip!", popIn(t, cSlip, 0.4) * b3, { size: 36, col: P.gold });
    }

    /* beat 4: that sudden move is an earthquake, and the ground shakes */
    var b4 = ieOnly(t, scene, 4);
    if (b4 > 0) {
      out += MK.pill(824, 150, "earthquake", popIn(t, cQuake, 0.45) * b4, { size: 38, col: P.gold });
      out += MK.ripple(bx, 240, t, cQuake, P.gold);
      if (b4 > 0.2) out += G(MK.waves(bx, 206, t, cShakes, { dir: -Math.PI / 2, spread: 2.6, n: 3, period: 0.9, reach: 150, col: P.gold, until: cShakes == null ? null : cShakes + 1.4 }), { opacity: b4 });
      out += MK.pill(824, 300, "a sudden move of the crust", on(t, cShakes, 0.5) * b4, { size: 28, col: P.line });
    }

    /* beat 5: a crack is left, at the same breaks as the volcanoes */
    var b5 = ieOnly(t, scene, 5);
    if (b5 > 0) {
      var ck = on(t, cCrack, 0.5) * b5;
      if (ck > 0) out += E(ieQX(163), ieQY(162), 44, 78, "none", P.gold, 4, { opacity: ck });
      var sa = on(t, cSame, 0.6) * b5;
      if (sa > 0) {
        out += Pth("M560,258 l80,-14 l86,18 l82,-20 l88,16 l84,-12", null, P.gold, 5,
          { opacity: sa, "stroke-dasharray": "16 10" });
        out += Tx(596, 300, "a break in the crust", "lab mid muted", "start", { opacity: sa });
      }
      var v1 = popIn(t, cSame == null ? null : cSame + 0.25, 0.4) * b5;
      out += MK.pop(ieCone(640, 244, 36, 58, 1), 640, 244, v1);
      if (v1 > 0) out += Tx(640, 170, "volcanoes", "lab mid", "middle", { opacity: Math.min(1, v1), fill: P.gold });
      var q1 = popIn(t, cSame == null ? null : cSame + 0.6, 0.4) * b5;
      if (q1 > 0) {
        out += G(ieCrack(896, 258, 80, P.gold, 6), { opacity: Math.min(1, q1) });
        out += Tx(896, 368, "earthquakes", "lab mid", "middle", { opacity: Math.min(1, q1), fill: P.gold });
      }
    }
    return svg(out);
  }
