  /* ==== Habitats and Survival, part 2 =========================================
     The chapters "Wrong for another place" and "Surviving somewhere else".
     See habitats-and-survival.js for what this film draws and why. */

  /* ==== chapter: wrong for another place =======================================
     Two of the kit's own desert scenes, each with a strip of its sand carried
     forward so the animal put into it stands clear of everything the drawing
     already has (nothing is drawn across the camel, the cactus, the lizard or
     the scorpion). The polar bear cooks in the first; the fish cannot breathe
     in the second. */
  var HS_MW = 356, HS_MH = HS_MW / 1.6, HS_MY = 20, HS_MAP = 80;
  var HS_M = [{ x: 66 }, { x: 690 }];
  var HS_SAND = "#E0B86A";

  function hsDesertPanel(k, o, lit) {
    if (!(o > 0)) return "";
    var x = HS_M[k].x, bot = HS_MY + HS_MH;
    return G(hsPlate(x, HS_MY, HS_MW, HS_MH + HS_MAP, 1, lit > 0.4 ? P.accent : P.line, lit > 0.4 ? 4 : 2) +
      R(x, bot, HS_MW, HS_MAP, 0, HS_SAND) +
      R(x, bot + HS_MAP - 10, HS_MW, 10, 0, "#C79A50") +
      ART.place(ART.scene("habitat", 1), x, HS_MY, HS_MW, HS_MH), { opacity: clamp(o, 0, 1) });
  }

  function hsMattersChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cPut = c(0, "put"), cDesert = c(0, "desert"), cCook = c(0, "cook");
    var cFish = c(1, "fish"), cGills = c(1, "gills"), cWater = c(1, "water");
    var cSuit = c(2, "suit"), cWrong = c(2, "wrong");
    var out = "", bot = HS_MY + HS_MH, apron = bot + HS_MAP;
    var rule = on(t, cWrong, 0.5), dim = 1 - 0.32 * rule;

    /* --- the polar bear in the desert --- */
    var heat = on(t, cCook, 0.5);
    out += hsDesertPanel(0, dim, on(t, cDesert, 0.45));
    var drop = popIn(t, cPut, 0.5);
    if (drop > 0) {
      var fall = inAt(t, cPut, 0.6), bx = HS_M[0].x + HS_MW / 2 - 12, by = lerp(apron - 130, apron - 44, fall);
      out += G(MK.pic(bx, by, 84, ART.ICONS.polarbear), { opacity: clamp(dim, 0, 1) });
      if (heat > 0) {
        out += MK.glow(bx, by, 86, P.accent, heat * (0.6 + 0.4 * breathe(t)));
        out += hsHeat(HS_M[0].x + 46, apron - 78, HS_MW - 92, 96, 5, t, heat);
        out += MK.cross(HS_M[0].x + HS_MW - 32, bot - 18, 26, popIn(t, cCook, 0.4));
      }
    }
    out += MK.pill(HS_M[0].x + HS_MW / 2, 360, "far too hot", heat, { size: 26, col: P.accent });

    /* --- the fish in the desert --- */
    var fo = popIn(t, cFish, 0.5);
    out += hsDesertPanel(1, on(t, cFish, 0.5) * dim, 0);
    if (fo > 0) {
      var fx = HS_M[1].x + HS_MW / 2 - 20, fy = apron - 46;
      /* it flaps: a small tilt that never settles */
      out += G(Em(0, 0, 88, "\u{1F41F}"), { transform: "translate(" + n2(fx) + "," + n2(fy) + ") rotate(" + n2(12 * Math.sin(t * 5.2)) + ")", opacity: clamp(Math.min(1, fo) * dim, 0, 1) });
      out += hsLabel(t, HS_M[1].x + 240, bot + 26, "gills", cGills, [fx - 28, fy - 2], true, { anchor: "start", size: 26 });
      var wo = popIn(t, cWater, 0.45);
      if (wo > 0) {
        out += MK.pop(C(HS_M[1].x + 54, bot + 34, 30, P.card, P.line, 2) +
          Pth("M" + n2(HS_M[1].x + 54) + "," + n2(bot + 18) + " l12,18 a14,14 0 1,1 -24,0 z", "#7FC4EA"), HS_M[1].x + 54, bot + 34, wo);
        out += MK.cross(HS_M[1].x + 54, bot + 34, 30, wo);
      }
      out += MK.cross(HS_M[1].x + HS_MW - 32, bot - 18, 26, popIn(t, cWater == null ? null : cWater + 0.3, 0.4));
    }
    out += MK.pill(HS_M[1].x + HS_MW / 2, 360, "no water to breathe", on(t, cWater, 0.45), { size: 26, col: P.accent });

    /* --- the rule both pictures make --- */
    var su = on(t, cSuit, 0.5);
    if (su > 0) out += MK.pill(584, 200, "suits one place", su * (1 - rule), { size: 26, col: P.gold });
    out += MK.pill(584, 414, "wrong for another place", rule, { size: 28, col: P.gold });
    return svg(out);
  }

  /* ==== chapter: surviving somewhere else ======================================
     The lookup step's fact card stands on the left for the whole chapter, and
     what it says is shown on the right: the goldfish in its bowl, the
     rainforest plant on the windowsill, and the camels taken to Australia
     (two of the kit's deserts side by side, which is the point of "like their
     home"). */
  var HS_FC = { x: 34, y: 34, w: 404, h: 372 };
  var HS_NEEDS = [
    { pic: "\u{1F34E}", word: "food", cue: "food" },
    { pic: "\u{1F4A7}", word: "water", cue: "water" },
    { pic: "\u{1F321}️", word: "the right temperature", cue: "temp" },
    { pic: "\u{1F3E0}", word: "shelter", cue: "shelter" }
  ];

  function hsFactCard(scene, t) {
    var cLook = sc(scene, 0, "look"), cCard = sc(scene, 0, "card"), cYes = sc(scene, 1, "yes");
    var o = popIn(t, cCard, 0.5);
    if (o <= 0) return MK.qmark(HS_FC.x + HS_FC.w / 2, HS_FC.y + HS_FC.h / 2, 64,
      Math.max(0.45, on(t, cLook, 0.5)));
    var x = HS_FC.x, y = HS_FC.y, w = HS_FC.w, out = "";
    out += R(x, y, w, HS_FC.h, 20, P.paper, "#C9C2B2", 3);
    out += Tx(x + w / 2, y + 50, "Surviving away from home", "lab dark", "middle", { "font-size": 26 });
    out += L(x + 26, y + 70, x + w - 26, y + 70, "#C9C2B2", 2);
    var yes = popIn(t, cYes, 0.4);
    out += MK.pop(Tx(x + w / 2, y + 118, "Yes, if it still gets:", "lab dark", "middle", { "font-size": 24 }),
      x + w / 2, y + 110, yes);
    HS_NEEDS.forEach(function (nd, k) {
      var at = sc(scene, 1, nd.cue), p = popIn(t, at, 0.4);
      if (p <= 0) return;
      var ry = y + 172 + k * 56;
      out += G(MK.pic(x + 48, ry, 42, nd.pic) +
        Tx(x + 82, ry + 9, nd.word, "lab dark", "start", { "font-size": 23 }), { opacity: Math.min(1, p) });
      out += MK.tick(x + w - 38, ry, 16, popIn(t, at == null ? null : at + 0.18, 0.35));
    });
    return G(out, { opacity: Math.min(1, o), transform: around(x + w / 2, y + HS_FC.h / 2, Math.min(1.02, o)) });
  }

  /* ---- the goldfish in its bowl ----------------------------------------------- */
  function hsBowl(t, cBowl, cFeeds, cClean, o) {
    if (!(o > 0)) return "";
    var cx = 760, cy = 236, r = 132, out = "";
    var lvl = cy - r * 0.55;
    out += el("clipPath", { id: "hsBowlClip" }, C(cx, cy, r - 6));
    out += C(cx, cy, r, "#16344A", "#9FD6EE", 5);
    out += G(R(cx - r, lvl, 2 * r, r * 2, 0, "#2E6E96", null, null, { opacity: 0.85 }), { "clip-path": "url(#hsBowlClip)" });
    out += Pth("M" + n2(cx - r * 0.62) + "," + n2(lvl - 22) + " q" + n2(r * 0.62) + ",-18 " + n2(r * 1.24) + ",0", null, "#9FD6EE", 5);
    out += Em(cx - 14, cy + 18, 76, "\u{1F41F}");
    /* the person's hand, feeding it */
    var fo = on(t, cFeeds, 0.4);
    if (fo > 0) {
      out += MK.pic(cx + 78, cy - r - 34, 62, "\u{1F91A}");
      for (var k = 0; k < 6; k++) {
        var ph = ((t * 0.8) + HS_SCATTER[k]) % 1;
        var fy = lerp(cy - r - 6, cy + 40, ph);
        out += C(cx + 70 + (HS_SCATTER[k + 3] - 0.5) * 26, fy, 4, "#D8A25A", null, null, { opacity: fo * (1 - ph * 0.5) });
      }
    }
    /* clean water: a few sparkles */
    var co = on(t, cClean, 0.4);
    if (co > 0) {
      for (var j = 0; j < 5; j++) {
        var sx = cx - 86 + j * 44, sy = cy - 46 + (HS_SCATTER[j] - 0.5) * 90, s = 7 + 4 * breathe(t + j);
        out += Pth("M" + n2(sx) + "," + n2(sy - s) + " L" + n2(sx + s * 0.32) + "," + n2(sy - s * 0.32) +
          " L" + n2(sx + s) + "," + n2(sy) + " L" + n2(sx + s * 0.32) + "," + n2(sy + s * 0.32) +
          " L" + n2(sx) + "," + n2(sy + s) + " L" + n2(sx - s * 0.32) + "," + n2(sy + s * 0.32) +
          " L" + n2(sx - s) + "," + n2(sy) + " L" + n2(sx - s * 0.32) + "," + n2(sy - s * 0.32) + " Z", "#DDEFF7", null, null, { opacity: co * 0.9 });
      }
    }
    out += MK.pill(cx, cy + r + 46, "a bowl", on(t, cBowl, 0.4), { size: 26, col: P.line });
    out += G(Tx(1006, cy - 66, "kept clean", "lab big", "middle", { fill: "#9FD6EE" }), { opacity: co });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- the rainforest plant on the windowsill ---------------------------------- */
  function hsSill(t, cSill, cWaters, cWarm, o) {
    if (!(o > 0)) return "";
    var cx = 760, wy = 178, out = "";
    var warm = on(t, cWarm, 0.5);
    if (warm > 0) out += MK.glow(cx, wy + 42, 196, P.gold, warm * (0.7 + 0.3 * breathe(t)));
    out += MK.pic(cx, wy, 236, ART.ICONS.window);
    out += R(cx - 148, wy + 112, 296, 18, 5, "#8A6A46");
    out += MK.pic(cx - 48, wy + 66, 96, ART.ICONS.plant);
    var wo = on(t, cWaters, 0.4);
    if (wo > 0) {
      var tip = 26 * on(t, cWaters == null ? null : cWaters + 0.15, 0.4);
      out += G(MK.pic(cx + 92, wy + 44, 108, ART.ICONS.wateringcan), { transform: "rotate(" + n2(-tip) + " " + n2(cx + 92) + " " + n2(wy + 44) + ") translate(" + n2(2 * (cx + 92)) + ",0) scale(-1,1)", opacity: wo });
      for (var k = 0; k < 4; k++) {
        var ph = ((t * 1.1) + HS_SCATTER[k]) % 1;
        out += C(cx + 6 + (HS_SCATTER[k + 2] - 0.5) * 16, lerp(wy + 74, wy + 112, ph), 5, "#7FC4EA", null, null, { opacity: wo * (1 - ph * 0.4) });
      }
    }
    var sill = on(t, cSill, 0.4);
    if (sill > 0) out += L(cx - 148, wy + 134, cx - 148 + 296 * sill, wy + 134, P.gold, 5);
    out += MK.pill(cx, wy + 186, "watered, and kept warm", Math.max(wo, warm), { size: 26, col: warm > 0.4 ? P.gold : P.line });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- camels taken to Australia ----------------------------------------------
     The same drawing twice, which is exactly what "like their home" means. */
  function hsAustralia(t, cCamels, cSurvived, cHot, cHome, o) {
    if (!(o > 0)) return "";
    var w = 292, h = w / 1.6, y = 116, x0 = 470, x1 = 838, out = "";
    var hot = on(t, cHot, 0.5), home = on(t, cHome, 0.5);
    out += hsHabitat(1, x0, y, w, 1, P.line, 2);
    out += hsHabitat(1, x1, y, w, on(t, cCamels, 0.5), hot > 0.4 ? P.gold : P.line, hot > 0.4 ? 4 : 2);
    out += Tx(x0 + w / 2, y + h + 44, "their home", "lab big muted", "middle");
    out += G(Tx(x1 + w / 2, y + h + 44, "Australia", "lab big", "middle"), { opacity: on(t, cCamels, 0.5) });
    /* the camel travels from one to the other */
    var trip = on(t, cCamels, 1.1);
    out += MK.arrow(x0 + w + 8, y + h / 2, x1 - 10, y + h / 2, trip, P.gold, 7);
    if (trip > 0) out += Em(lerp(x0 + w + 16, x1 - 18, trip), y + h / 2 - 34, 64, "\u{1F42A}");
    out += MK.tick(x1 + w - 18, y - 14, 24, popIn(t, cSurvived, 0.4));
    if (hot > 0) out += MK.pill(x1 + w / 2, y + h + 96, "hot and dry", hot, { size: 26, col: P.gold });
    if (home > 0) {
      out += L(x0 + w / 2, y + h + 66, x1 + w / 2, y + h + 66, P.gold, 3, { opacity: home, "stroke-dasharray": "10 8" });
      out += MK.pill(x0 + w / 2, y + h + 96, "the same as this", home, { size: 26, col: P.gold });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- all three, given what their habitat gave --------------------------------- */
  function hsSurvivors(t, cGive, cSurvives, o) {
    if (!(o > 0)) return "";
    var out = "", xs = [620, 830, 1040], y = 250;
    var pics = ["\u{1F41F}", ART.ICONS.plant, "\u{1F42A}"], names = ["goldfish", "plant", "camels"];
    /* the four things a habitat gives, carried across from the card */
    HS_NEEDS.forEach(function (nd, k) {
      var u = on(t, cGive == null ? null : cGive + k * 0.1, 0.7);
      if (u <= 0) return;
      out += MK.pic(lerp(HS_FC.x + HS_FC.w + 20, 620 + k * 140, u), lerp(250, 92, u), 50, nd.pic, { opacity: 1 });
    });
    xs.forEach(function (x, k) {
      var p = popIn(t, cGive == null ? null : cGive + 0.5 + k * 0.12, 0.4);
      if (p <= 0) return;
      out += G(R(x - 98, y - 70, 196, 200, 18, P.card, P.line, 2) +
        MK.pic(x, y + 6, 100, pics[k]) + Tx(x, y + 104, names[k], "lab muted", "middle"),
        { opacity: Math.min(1, p), transform: around(x, y + 30, Math.min(1.04, p)) });
      out += MK.tick(x + 74, y - 58, 24, popIn(t, cSurvives == null ? null : cSurvives + k * 0.14, 0.35));
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function hsElsewhereChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var out = hsFactCard(scene, t);
    out += hsBowl(t, c(2, "bowl"), c(2, "feeds"), c(2, "clean"), hsOnly(t, scene, 2));
    out += hsSill(t, c(3, "sill"), c(3, "waters"), c(3, "warm"), hsOnly(t, scene, 3));
    out += hsAustralia(t, c(4, "camels"), c(4, "survived"), c(4, "hot"), c(4, "home"), hsOnly(t, scene, 4));
    out += hsSurvivors(t, c(5, "give"), c(5, "survives"), hsFrom(t, scene, 5));
    /* before the first example, the question the card answers */
    var q = hsUntil(t, scene, 1) * on(t, sc(scene, 0, "survive"), 0.5);
    if (q > 0) out += MK.bubble(560, 150, 500, 124, "Outside its habitat?", q);
    return svg(out);
  }
