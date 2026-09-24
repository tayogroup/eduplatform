  /* ==== Habitats and Survival, part 4 =========================================
     The chapter "Both sides", the recap cards and the kinds table.
     See habitats-and-survival.js for what this film draws and why. */

  /* ==== chapter: both sides ====================================================
     The lesson's own weighing up: most technology helps some living things and
     harms others. The streetlight is the context step's own example, in its
     own words - safer streets, and moths that fly round the lamp until they
     drop. */

  /* ---- the balance ------------------------------------------------------------ */
  var HS_PIV = { x: 584, y: 166, arm: 244 };
  function hsPan(ex, ey, col, o) {
    var rod = 58;
    return L(ex, ey, ex, ey + rod, P.muted, 3) +
      Pth("M" + n2(ex - 78) + "," + n2(ey + rod) + " q78,54 156,0", "none", col || P.muted, 5) +
      L(ex - 78, ey + rod, ex + 78, ey + rod, col || P.muted, 5, { opacity: o == null ? 1 : o });
  }
  function hsBalance(scene, t, o) {
    if (!(o > 0)) return "";
    var cHelps = sc(scene, 0, "helps"), cHarms = sc(scene, 0, "harms");
    var cBoth = sc(scene, 2, "both"), cDecide = sc(scene, 2, "decide");
    var hp = on(t, cHelps, 0.6), hm = on(t, cHarms, 0.6), bo = on(t, cBoth, 0.6);
    var a = -0.13 * hp * (1 - hm) + 0.0 * hm;
    var px = HS_PIV.x, py = HS_PIV.y, arm = HS_PIV.arm, out = "";
    var lx = px - arm * Math.cos(a), ly = py - arm * Math.sin(a);
    var rx = px + arm * Math.cos(a), ry = py + arm * Math.sin(a);

    out += R(px - 8, py, 16, 176, 6, P.line, P.muted, 2);
    out += R(px - 92, py + 166, 184, 18, 9, P.muted);
    out += L(lx, ly, rx, ry, P.muted, 8);
    out += C(px, py, 12, P.gold);
    out += hsPan(lx, ly, hp > 0.3 ? P.good : P.muted, 1);
    out += hsPan(rx, ry, hm > 0.3 ? P.bad : P.muted, 1);

    out += MK.tick(lx, ly + 34, 26, popIn(t, cHelps, 0.45));
    out += MK.cross(rx, ry + 34, 26, popIn(t, cHarms, 0.45));
    out += G(Tx(lx, ly + 116, "helps some", "lab big good", "middle"), { opacity: hp });
    out += G(Tx(rx, ry + 116, "harms others", "lab big bad", "middle"), { opacity: hm });

    /* both sides, then you decide */
    if (bo > 0) {
      out += C(lx, ly + 34, 44 + 6 * breathe(t), "none", P.good, 3, { opacity: bo * 0.8 });
      out += C(rx, ry + 34, 44 + 6 * breathe(t), "none", P.bad, 3, { opacity: bo * 0.8 });
    }
    var dd = popIn(t, cDecide, 0.45);
    if (dd > 0) {
      out += MK.pop(MK.pic(px, 74, 76, "\u{1F9D2}"), px, 74, dd);
      out += MK.pill(px, 402, "you decide", Math.min(1, dd), { size: 30, col: P.gold });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- the streetlight at night ------------------------------------------------ */
  var HS_LAMP = { x: 408, y: 132 };
  var HS_MOTHS = [0.0, 0.42, 0.78, 1.35, 1.92, 2.6];
  function hsMoth(cx, cy, s, t, k, o) {
    if (!(o > 0)) return "";
    var beat = 0.45 + 0.55 * Math.abs(Math.sin(t * 11 + k)), tilt = 16 * Math.sin(t * 3 + k);
    var w = s * 0.52 * beat;
    return G(Pth("M0," + n2(-s * 0.1) + " L" + n2(-w) + "," + n2(-s * 0.46) +
        " L" + n2(-w * 0.78) + "," + n2(s * 0.2) + " Z", "#EFE6C8", "#A2946F", 1.4) +
      Pth("M0," + n2(-s * 0.1) + " L" + n2(w) + "," + n2(-s * 0.46) +
        " L" + n2(w * 0.78) + "," + n2(s * 0.2) + " Z", "#EFE6C8", "#A2946F", 1.4) +
      E(0, 0, s * 0.09, s * 0.3, "#6B5B3E") +
      C(0, -s * 0.3, s * 0.1, "#6B5B3E"),
      { transform: tr(cx, cy) + " rotate(" + n2(tilt) + ")", opacity: clamp(o, 0, 1) });
  }

  function hsStreet(scene, t, o) {
    if (!(o > 0)) return "";
    var cLights = sc(scene, 1, "lights"), cSafer = sc(scene, 1, "safer"), cMoths = sc(scene, 1, "moths"), cDrop = sc(scene, 1, "drop");
    var lo = on(t, cLights, 0.5), ground = 356, out = "";

    out += R(70, ground, 1028, 14, 7, "#2C4356");
    out += R(70, ground + 14, 1028, 32, 0, "#16293A");
    /* the post and its lamp */
    out += R(HS_LAMP.x - 7, HS_LAMP.y, 14, ground - HS_LAMP.y, 5, "#44586B", null, null, { opacity: Math.min(1, lo + 0.25) });
    out += Pth("M" + n2(HS_LAMP.x - 34) + "," + n2(HS_LAMP.y) + " L" + n2(HS_LAMP.x + 34) + "," + n2(HS_LAMP.y) +
      " L" + n2(HS_LAMP.x + 22) + "," + n2(HS_LAMP.y - 26) + " L" + n2(HS_LAMP.x - 22) + "," + n2(HS_LAMP.y - 26) + " Z", lo > 0.3 ? P.gold : "#44586B", "#44586B", 2);
    if (lo > 0) {
      out += MK.glow(HS_LAMP.x, HS_LAMP.y + 24, 156, P.gold, lo * 0.95);
      out += Pth("M" + n2(HS_LAMP.x - 30) + "," + n2(HS_LAMP.y + 4) + " L" + n2(HS_LAMP.x - 146) + "," + n2(ground) +
        " L" + n2(HS_LAMP.x + 146) + "," + n2(ground) + " L" + n2(HS_LAMP.x + 30) + "," + n2(HS_LAMP.y + 4) + " Z", P.gold, null, null, { opacity: 0.18 * lo });
    }
    /* a child walking safely in the light */
    var so = popIn(t, cSafer, 0.5);
    if (so > 0) {
      out += MK.pop(MK.pic(HS_LAMP.x + 82, ground - 46, 86, "\u{1F6B6}"), HS_LAMP.x + 82, ground - 46, so);
      out += MK.tick(756, 178, 26, popIn(t, cSafer, 0.45));
      out += G(Tx(800, 188, "safer at night", "lab big good", "start"), { opacity: Math.min(1, so) });
    }
    /* the moths round the lamp, and then on the ground */
    var mo = on(t, cMoths, 0.5), dropAt = cDrop;
    if (mo > 0) {
      for (var k = 0; k < HS_MOTHS.length; k++) {
        var ang = t * 2.1 + HS_MOTHS[k], r = 74 + 22 * Math.sin(t * 1.4 + k);
        var mx = HS_LAMP.x + r * Math.cos(ang), my = HS_LAMP.y + 16 + r * 0.78 * Math.sin(ang);
        var fall = dropAt == null ? 0 : ease((t - (dropAt + k * 0.16)) / 0.9);
        if (fall > 0) { mx = lerp(mx, HS_LAMP.x - 116 + k * 46, fall); my = lerp(my, ground - 9, fall * fall); }
        out += hsMoth(mx, my, 34, t, k, mo);
      }
      out += G(Tx(608, 86, "moths", "lab big", "middle"), { opacity: mo });
      out += MK.leader(578, 92, HS_LAMP.x + 82, HS_LAMP.y - 6, on(t, cMoths == null ? null : cMoths + 0.2, 0.5), P.gold);
    }
    var fo = on(t, dropAt, 0.6);
    if (fo > 0) {
      out += MK.cross(756, 284, 26, popIn(t, dropAt, 0.45));
      out += G(Tx(800, 294, "until they drop", "lab big bad", "start"), { opacity: fo });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function hsSidesChapter(scene, beat, t, i) {
    var street = hsFrom(t, scene, 1) * hsUntil(t, scene, 2);
    return svg(hsBalance(scene, t, clamp(hsUntil(t, scene, 1) + hsFrom(t, scene, 2), 0, 1)) + hsStreet(scene, t, street));
  }

  /* ---- what you now know -------------------------------------------------------- */
  var HS_RECAP = MK.recapKind([
    { beat: 0, at: "suit", title: "Suited", sub: "its features fit its habitat", pic: "\u{1F42A}" },
    { beat: 1, at: "card", title: "Somewhere else", sub: "if it gets what it needs", pic: "\u{1F41F}" },
    { beat: 2, at: "question", title: "A good question", sub: "one you can go and check", pic: ART.ICONS.woodlouse },
    { beat: 3, at: "tech", title: "Technology near you", sub: "helps some, harms others", pic: "\u{1F4A1}" }
  ], { goBeat: 3, goAt: "weigh" });

  /* recapKind lights each card on the FIRST phrase of its beat alone. Each
     card's beat is two ideas, and the second phrase needs its own mark:
     "wrong" (0), "survive" (1) and "check" (2) each pop a small mark into the
     lit card's free top-right corner, at the moment that word is said. (The
     fourth beat's second phrase, "weigh", is not dead: recapKind's own
     goBeat/goAt already makes every lit card breathe from it.) Corner
     positions are recapKind's own 2-column grid, M 4 / gap 14, read off its
     source so a mark lands inside its card and never on the title or icon. */
  function hsRecapChapter(scene, beat, t, i) {
    var base = HS_RECAP(scene, beat, t, i);
    var cWrong = sc(scene, 0, "wrong"), cSurvive = sc(scene, 1, "survive"), cCheck = sc(scene, 2, "check");
    var extra = MK.cross(547, 34, 20, popIn(t, cWrong, 0.4)) +
      MK.tick(1134, 34, 20, popIn(t, cSurvive, 0.4)) +
      MK.tick(547, 257, 20, popIn(t, cCheck, 0.4));
    /* the "A good question" card's pic is the kit's own woodlouse drawing, a
       NESTED <svg> - a plain .replace("</svg>", ...) would splice this extra
       markup inside that inner element's own close tag, not the outer scene
       svg's, so it must go before the LAST "</svg>" in the string. */
    var idx = base.lastIndexOf("</svg>");
    return base.slice(0, idx) + extra + base.slice(idx);
  }

  var KINDS = {
    title: MK.titleKind({ sub: ["Which habitat suits which animal", "How a living thing survives somewhere else", "What science near you does to habitats"] }),
    suited: hsSuitedChapter,
    matters: hsMattersChapter,
    elsewhere: hsElsewhereChapter,
    question: hsQuestionChapter,
    near: hsNearChapter,
    sides: hsSidesChapter,
    recap: hsRecapChapter
  };
