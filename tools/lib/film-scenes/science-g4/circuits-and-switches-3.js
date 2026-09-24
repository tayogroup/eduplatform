  /* ==== Circuits and Switches, part 3: Conductors and insulators ==============
     The lesson's own conductor test: its circuit with a gap in the bottom
     wire, the material sitting in that gap, and its lamp saying yes or no.
     The eight things the child tests are the lesson's own pictures. */

  var CS_MAT = csBox(34, 30, 480, 320, 200);
  /* the loop, from the cell round through the lamp to the two edges of the gap */
  var CS_MAT_PTS = [CS_MAT.at(60, 40), CS_MAT.at(280, 40), CS_MAT.at(280, 100), CS_MAT.at(280, 160),
    CS_MAT.at(200, 160), CS_MAT.at(120, 160), CS_MAT.at(40, 160), CS_MAT.at(40, 40), CS_MAT.at(60, 40)];
  var CS_MAT_GAP_U = 420 / 720;   /* the near edge of the gap */

  /* the lesson's conductor circuit, with a material in the gap and its own
     caption. Everything it changes, the sim changes by id when the child runs
     it; here each one is named, so a change to the lesson stops the film. */
  function csConductorSvg(pic, lit, caption) {
    var m = ART.sim("conductor", "init");
    var slot = '<g id="cm"></g>';
    if (m.indexOf(slot) < 0) throw new Error("conductor.init no longer draws the gap's item group the way this film expects");
    m = m.replace(slot, '<g id="cm">' + (pic ? ART.glyphAt(160, 172, 40, ART.icon(pic)) : "") + "</g>");
    var off = '<circle id="cl" r="18" fill="#1B3A52"';
    if (m.indexOf(off) < 0) throw new Error("conductor.init no longer draws its lamp the way this film expects");
    if (lit) m = m.replace(off, '<circle id="cl" r="18" fill="#F4C95D"');
    var cap = ">the gap</text>";
    if (m.indexOf(cap) < 0) throw new Error("conductor.init no longer captions its gap the way this film expects");
    if (caption != null) m = m.replace(cap, ">" + esc(caption) + "</text>");
    return m;
  }

  /* a shiny plastic lid, seen at an angle: the glint is the point of it */
  function csLid(cx, cy, w) {
    var rx = w / 2, ry = w * 0.3;
    return E(cx, cy + 5, rx, ry, "#8FA2B4") +
      E(cx, cy, rx, ry, "#C6D3DE", "#7E93A6", 3) +
      E(cx, cy, rx * 0.72, ry * 0.66, "none", "#9FB2C2", 2) +
      Pth("M" + n2(cx - rx * 0.62) + "," + n2(cy - ry * 0.3) + " Q" + n2(cx - rx * 0.2) + "," + n2(cy - ry * 0.92) + " " + n2(cx + rx * 0.24) + "," + n2(cy - ry * 0.62),
        null, "#FFFFFF", 5, { opacity: 0.85 });
  }

  /* a wire in section: plastic outside, copper strands inside, the cover cut
     back on the right so both are visible at once */
  function csCable(x, y, w, h, t, coverO, coreO) {
    var cut = x + w * 0.56, mid = y + h / 2, out = "";
    out += R(x, y, w, h, h / 2, "#2B5673", "#7E93A6", 3, { opacity: clamp(coverO, 0, 1) });
    out += R(x + 8, y + 6, w * 0.42, h * 0.26, h * 0.13, "#6E9DE8", null, null, { opacity: 0.35 * clamp(coverO, 0, 1) });
    /* the copper core, running the whole length, uncovered past the cut */
    var co = clamp(coreO, 0, 1);
    if (co > 0) {
      out += R(cut, mid - h * 0.21, x + w - cut - 6, h * 0.42, h * 0.2, "#C9762F", null, null, { opacity: co });
      for (var k = 0; k < 3; k++)
        out += L(cut + 4, mid - h * 0.12 + k * h * 0.12, x + w - 12, mid - h * 0.12 + k * h * 0.12, "#E89A52", 3, { opacity: co });
      /* the cut edge of the plastic cover */
      out += Pth("M" + n2(cut) + "," + n2(y) + " L" + n2(cut + 16) + "," + n2(mid) + " L" + n2(cut) + "," + n2(y + h),
        "#1B3A52", "#7E93A6", 3, { opacity: clamp(coverO, 0, 1) });
    }
    return out;
  }

  /* one row of the record: the lesson's picture, its material, and the verdict */
  function csRow(x, y, pic, label, good, o) {
    if (!(o > 0)) return "";
    var p = Math.min(1, o);
    return G(MK.pic(x + 34, y, 44, pic) + Tx(x + 72, y + 8, label, "lab mid", "start") +
      (good ? MK.tick(x + 244, y, 17, p) : MK.cross(x + 244, y, 17, p)),
      { opacity: p, transform: "translate(" + n2((1 - p) * 16) + ",0)" });
  }

  var CS_COND_X = 570, CS_INS_X = 862, CS_ROW0 = 124, CS_ROW_H = 62;

  function csMaterialsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cGap = c(0, "gap"), cMaterial = c(0, "material"), cTest = c(0, "test");
    var cConductor = c(1, "conductor"), cThrough = c(1, "through"), cLights = c(1, "lights");
    var cCopper = c(2, "copper"), cKey = c(2, "key"), cCoin = c(2, "coin"), cMetals = c(2, "metals");
    var cIns = c(3, "insulator"), cPlastic = c(3, "plastic"), cRubber = c(3, "rubber"), cWood = c(3, "wood"), cGlass = c(3, "glass");
    var cShiny = c(4, "shiny"), cMetal = c(4, "metal");
    var cCopper2 = c(5, "copper"), cPlastic2 = c(5, "plastic");

    /* the copper wire sits in the gap until the insulator's line, then the
       lesson's plastic ruler does */
    var insulating = cIns != null && t >= cIns;
    var hasItem = cMaterial != null && t >= cMaterial;
    var lit = !insulating && cLights != null && t >= cLights;
    var caption = !hasItem ? null : insulating ? "lamp off: an insulator" : lit ? "lamp ON: a conductor" : "the gap";
    var item = !hasItem ? null : insulating ? "\u{1F4CF}" : ART.ICONS.wire;

    var out = csCard(CS_MAT);
    out += ART.place(csConductorSvg(item, lit, caption), CS_MAT.x, CS_MAT.y, CS_MAT.w, CS_MAT.h);

    var gp = CS_MAT.at(160, 160), lampP = CS_MAT.at(280, 100);
    /* "Leave a gap in the loop": the lesson's own gap, ringed while it is named */
    var gapRing = on(t, cGap, 0.4) * clamp(1 - (t - cGap) / 2.0, 0, 1);
    if (gapRing > 0) out += E(gp[0], gp[1], 78, 46, "none", P.gold, 5, { opacity: gapRing });
    out += MK.ripple(gp[0], gp[1], t, cMaterial, P.gold);
    out += MK.ripple(gp[0], gp[1], t, cTest, P.teal);
    out += MK.ripple(gp[0], gp[1], t, cIns, P.bad);

    /* "lets electricity through": the sparks go all the way round, through the
       material in the gap. With the insulator in they stop at its near edge. */
    var flowO = on(t, cThrough, 0.5) * (insulating ? clamp(1 - (t - cIns) / 0.4, 0, 1) : 1);
    out += csFlow(t, CS_MAT_PTS, cThrough, flowO, { n: 7, speed: 0.24, r: 7 });
    if (insulating) {
      /* they get as far as the material and no further. It belongs to this
         beat alone: by the next line the picture has moved on. */
      var stuck = on(t, cIns == null ? null : cIns + 0.3, 0.4) * csOnly(t, scene, 3);
      out += csFlow(t, CS_MAT_PTS, cIns == null ? null : cIns + 0.3, stuck * 0.9,
        { n: 7, speed: 0.22, r: 7, stop: CS_MAT_GAP_U - 0.02 });
    }
    if (lit) out += MK.glow(lampP[0], lampP[1], 84, P.gold, on(t, cLights, 0.5) * (0.8 + 0.2 * breathe(t)));
    /* the verdict, above the card: the lesson's own two words, one at a time */
    out += MK.pill(CS_MAT.X(160), CS_MAT.y - 2, "conductor", on(t, cConductor, 0.4) * csOnly(t, scene, 1), { size: 24, col: P.good, ink: P.good });
    out += MK.pill(CS_MAT.X(160), CS_MAT.y - 2, "insulator", on(t, cIns, 0.4) * csOnly(t, scene, 3), { size: 24, col: P.bad, ink: P.bad });

    /* the record, on the right: what let the electricity through, and what did not */
    var condO = on(t, cCopper, 0.4), insO = on(t, cPlastic, 0.4);
    out += Tx(CS_COND_X + 6, 84, "Conductors", "lab big good", "start", { opacity: condO });
    out += Tx(CS_INS_X + 6, 84, "Insulators", "lab big bad", "start", { opacity: insO });
    out += csRow(CS_COND_X, CS_ROW0, ART.ICONS.wire, "copper wire", true, popIn(t, cCopper, 0.4));
    out += csRow(CS_COND_X, CS_ROW0 + CS_ROW_H, "\u{1F511}", "steel key", true, popIn(t, cKey, 0.4));
    out += csRow(CS_COND_X, CS_ROW0 + 2 * CS_ROW_H, ART.ICONS.coin, "coin", true, popIn(t, cCoin, 0.4));
    out += csRow(CS_INS_X, CS_ROW0, "\u{1F4CF}", "plastic", false, popIn(t, cPlastic, 0.4));
    out += csRow(CS_INS_X, CS_ROW0 + CS_ROW_H, "\u{1F388}", "rubber", false, popIn(t, cRubber, 0.4));
    out += csRow(CS_INS_X, CS_ROW0 + 2 * CS_ROW_H, ART.ICONS.lollystick, "wood", false, popIn(t, cWood, 0.4));
    out += csRow(CS_INS_X, CS_ROW0 + 3 * CS_ROW_H, ART.ICONS.glass, "glass", false, popIn(t, cGlass, 0.4));
    /* "metals are the best conductors": the column that is all metal is named */
    var mo = on(t, cMetals, 0.4) * csFrom(t, scene, 2);
    if (mo > 0) out += R(CS_COND_X - 8, 58, 286, 3 * CS_ROW_H + 18, 16, "none", P.good, 3,
      { opacity: mo * (csOnly(t, scene, 2) > 0.5 ? 0.6 + 0.4 * breathe(t) : 0.35) });
    out += MK.pill(CS_COND_X + 140, 42, "all metals", on(t, cMetals, 0.4) * csOnly(t, scene, 2), { size: 22, col: P.good, ink: P.good });

    /* "A shiny plastic lid is an insulator. It is the metal that conducts." */
    var lidO = popIn(t, cShiny, 0.45) * csOnly(t, scene, 4);
    if (lidO > 0) {
      var lid = csLid(648, 374, 88) + MK.cross(706, 340, 20, popIn(t, cShiny == null ? null : cShiny + 0.5, 0.35)) +
        Tx(648, 416, "shiny plastic lid", "lab mid muted", "middle");
      out += G(lid, { opacity: Math.min(1, lidO), transform: around(648, 374, Math.min(1.08, lidO)) });
      out += MK.arrow(748, 374, 856, 374, on(t, cMetal, 0.45), P.gold, 8);
      out += MK.pill(1010, 374, "the metal conducts", on(t, cMetal, 0.4), { size: 22, col: P.gold, ink: P.gold });
    }

    /* "a wire is copper inside and plastic outside": the wire, cut back */
    var cabO = csFrom(t, scene, 5);
    if (cabO > 0) {
      var cab = csCable(60, 362, 452, 58, t, on(t, cPlastic2, 0.5), on(t, cCopper2, 0.5));
      cab += Tx(72, 350, "plastic outside", "lab mid muted", "start", { opacity: on(t, cPlastic2, 0.5) });
      cab += Tx(330, 350, "copper inside", "lab mid gold", "start", { opacity: on(t, cCopper2, 0.5) });
      out += G(cab, { opacity: cabO });
    }
    return svg(out);
  }
