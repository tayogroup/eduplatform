  /* ==== chapters: warm or cold, and a fair test ==================================
     tools/lib/film-scenes/science-g3/flowering-plants-3.js. The lesson's own
     warm-and-cold test: ART.pots with exactly the options SIMS.plantWarm gives
     it (labelA "warm place", labelB "cold place", sun, coldB), which is the
     picture the child steps through a day at a time two steps later. The frost
     arrives on the word "cold"; the days run on "Day after day"; only the
     temperature is ever different, and the panel beside the pots says so. */

  var FP_POTS = { x: 96, y: 22, k: 1.32 };            /* 320 x 290 drawn at 422.4 x 382.8 */
  function fpPX(v) { return FP_POTS.x + v * FP_POTS.k; }
  function fpPY(v) { return FP_POTS.y + v * FP_POTS.k; }
  function fpPotsCard(markup) {
    return R(FP_POTS.x - 8, FP_POTS.y - 8, 320 * FP_POTS.k + 16, 290 * FP_POTS.k + 16, 18, P.card, P.line, 2) +
      ART.place(markup, FP_POTS.x, FP_POTS.y, 320 * FP_POTS.k, 290 * FP_POTS.k);
  }
  /* a gold box round one of the card's own labels (the warm pot or the cold one) */
  function fpLabelBox(potX, w, o) {
    if (!(o > 0)) return "";
    return R(fpPX(potX) - w / 2, fpPY(258), w, fpPY(280) - fpPY(258), 11, "none", P.gold, 3, { opacity: clamp(o, 0, 1) });
  }
  /* the card's own "Day N", boxed */
  function fpDayBox(o) {
    if (!(o > 0)) return "";
    return R(fpPX(6), fpPY(10), fpPX(74) - fpPX(6), fpPY(34) - fpPY(10), 8, "none", P.gold, 3, { opacity: clamp(o, 0, 1) });
  }
  /* how far the five days have run: the fair test chapter's own clock, so the
     warm-or-cold chapter shows day one and this one runs to day five */
  function fpDays(t) {
    var s = F.scenes.filter(function (x) { return x.id === "fairtest"; })[0];
    var at = s ? sc(s, 2, "day") : null;
    return 4 * on(t, at, 2.0);
  }
  function fpPots(t, cold) {
    var b = fpDays(t), day = 1 + Math.min(4, Math.round(b)), out = "";
    var opts = function (c) { return { labelA: "warm place", labelB: "cold place", sun: true, coldB: c }; };
    if (cold < 1) out += fpPotsCard(ART.pots(0, b, day, opts(false)));
    if (cold > 0) out += G(fpPotsCard(ART.pots(0, b, day, opts(true))), cold < 1 ? { opacity: cold } : {});
    return out;
  }

  /* ---- what a plant needs (the chapter's first beat) ------------------------- */
  function fpNeedsPic(t, scene) {
    var cW = sc(scene, 0, "water"), cL = sc(scene, 0, "light"), cT = sc(scene, 0, "temperature"), out = "";
    var pw = popIn(t, cW, 0.4), pl = popIn(t, cL, 0.4), pt = popIn(t, cT, 0.4);
    out += MK.pop(Em(300, 110, 96, "\u{1F4A7}"), 300, 110, pw) + MK.pill(300, 186, "water", Math.min(1, pw), { size: 26, col: "#7FC4EA" });
    out += MK.pop(Em(584, 110, 96, "☀️"), 584, 110, pl) + MK.pill(584, 186, "light", Math.min(1, pl), { size: 26, col: P.gold });
    out += MK.pop(Em(868, 110, 96, "\u{1F321}️"), 868, 110, pt) + MK.pill(868, 186, "the right temperature", Math.min(1, pt), { size: 26, col: P.accent });
    out += MK.glow(584, 318, 106, P.good, on(t, cT, 0.8) * 0.7);
    out += MK.pic(584, 330, 170, ART.ICONS.plant);
    out += MK.arrow(340, 214, 496, 288, on(t, cW == null ? null : cW + 0.25, 0.5), "#7FC4EA", 7);
    out += MK.arrow(584, 214, 584, 266, on(t, cL == null ? null : cL + 0.25, 0.5), P.gold, 7);
    out += MK.arrow(828, 214, 672, 288, on(t, cT == null ? null : cT + 0.25, 0.5), P.accent, 7);
    return out;
  }

  /* ---- warm or cold ----------------------------------------------------------- */
  function fpWarmPic(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cWarm = c(1, "warm"), cCold = c(1, "cold"), cW2 = c(2, "water"), cL2 = c(2, "light"),
      cHappen = c(3, "happen"), cFive = c(3, "five"), cThink = c(4, "think"), cPred = c(4, "prediction");
    var cold = on(t, cCold, 0.6), out = fpPots(t, cold);

    /* "keep one plant warm": the LEFT pot, the card's own warm place, glows,
       is ringed, and its own label is boxed. (A thermometer used to pop in on
       this word out on the right of the card, beside the frost and above the
       COLD pot, which read as the cold one being named.) */
    var warm = on(t, cWarm, 0.5) * fpOnly(t, scene, 1);
    out += MK.glow(fpPX(90), fpPY(150), 110, P.accent, warm * (0.75 + 0.25 * breathe(t)));
    out += E(fpPX(90), fpPY(148), 78, 128, "none", P.accent, 5, { opacity: warm });
    out += fpLabelBox(90, 130, warm);
    /* "somewhere very cold": the frost arrives in the RIGHT pot, its label is
       boxed, and the snowflake out on the right points back at it */
    var cb = on(t, cCold, 0.5) * fpOnly(t, scene, 1);
    out += fpLabelBox(230, 130, cb);
    out += fpFlake(620, 140, 44, popIn(t, cCold, 0.5) * fpOnly(t, scene, 1));
    out += MK.leader(566, 158, fpPX(238), fpPY(124), cb, "#BFE3F5");

    /* "the same water", "the same light": one of each, over both pots */
    var two = fpOnly(t, scene, 2);
    if (two > 0.004) {
      var rows = [
        { at: cW2, pic: "\u{1F4A7}", text: "the same water", y: 140 },
        { at: cL2, pic: "☀️", text: "the same light", y: 260 }
      ];
      rows.forEach(function (r) {
        var o = on(t, r.at, 0.4) * two;
        if (o <= 0) return;
        out += MK.pic(628, r.y, 62, r.pic, { opacity: Math.min(1, o) });
        out += Tx(678, r.y + 11, r.text, "lab big", "start", { opacity: o });
        out += MK.tick(1062, r.y, 26, popIn(t, r.at == null ? null : r.at + 0.35, 0.35) * two);
      });
      /* both pots get it: a drop falls on each, and the Sun reaches each */
      var wo = on(t, cW2, 0.4) * two;
      [90, 230].forEach(function (px) {
        var ph = cW2 == null ? 0 : ((t - cW2) / 1.2) % 1;
        if (wo > 0 && t >= cW2) out += fpDrop(fpPX(px), lerp(fpPY(40), fpPY(176), ph), 9, Math.min(1, ph * 6, (1 - ph) * 6) * wo, "#2E86C9");
      });
      var lo = on(t, cL2, 0.5) * two;
      [[90, 120], [230, 120]].forEach(function (e, n) {
        var u = on(t, cL2 == null ? null : cL2 + n * 0.15, 0.6) * two;
        out += L(fpPX(280), fpPY(58), lerp(fpPX(280), fpPX(e[0]), u), lerp(fpPY(58), fpPY(e[1]), u), P.gold, 4,
          { opacity: 0.9 * lo, "stroke-dasharray": "12 9" });
      });
    }

    /* "What will happen ... after five days?": a question over the cold plant,
       and the five days laid out one at a time */
    var three = fpOnly(t, scene, 3);
    out += MK.qmark(fpPX(230), fpPY(96), 46, popIn(t, cHappen, 0.4) * three);
    /* the five days are counted out from the start of the question, so they are
       all there by the time the line says "five days", and the fifth lights */
    if (three > 0.004 && cHappen != null && t >= cHappen) for (var d = 0; d < 5; d++) {
      var p = popIn(t, cHappen + 0.25 + d * 0.16, 0.3) * three, fifth = d === 4 ? on(t, cFive, 0.4) : 0;
      if (p <= 0) continue;
      var x = 626 + d * 102;
      out += G(R(x, 180, 88, 88, 16, fifth > 0.5 ? "#3A2E17" : P.card, fifth > 0.5 ? P.gold : P.line, fifth > 0.5 ? 3 : 2) +
        Tx(x + 44, 238, String(d + 1), "lab huge", "middle", { fill: fifth > 0.5 ? P.gold : P.muted }),
        { transform: around(x + 44, 224, Math.min(p, 1.1) * (1 + 0.08 * bump(t, cFive, 0.8) * (d === 4 ? 1 : 0))), opacity: Math.min(1, p) });
    }
    out += Tx(626, 152, "days", "lab big muted", "start", { opacity: on(t, cHappen == null ? null : cHappen + 0.25, 0.4) * three });

    /* "Say what you think first": the child thinks; "your prediction" names it */
    var four = fpOnly(t, scene, 4);
    out += MK.pic(700, 300, 150, "\u{1F9D2}", { opacity: Math.min(1, popIn(t, cThink, 0.45) * four) });
    out += MK.bubble(790, 110, 200, 96, "?", on(t, cThink == null ? null : cThink + 0.2, 0.5) * four, 782, 244);
    out += MK.pill(930, 330, "your prediction", on(t, cPred, 0.4) * four, { size: 28, col: P.gold });
    return out;
  }

  function fpWarmChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 0) return svg(fpNeedsPic(t, scene));
    if (k === 1) {
      var u = into(t, i);
      return svg(fpWarmPic(t, scene) + (u < 1 ? G(fpNeedsPic(t, scene), { opacity: 1 - u }) : ""));
    }
    return svg(fpWarmPic(t, scene));
  }

  /* ---- a fair test -------------------------------------------------------------
     The same two pots, carrying straight on from the chapter above, with the
     three things the test holds or changes listed beside them. */
  var FP_FAIR = [
    { pic: "\u{1F4A7}", text: "water: the same", y: 108, same: true },
    { pic: "☀️", text: "light: the same", y: 200, same: true },
    { pic: "\u{1F321}️", text: "temperature: different", y: 292, same: false }
  ];

  function fpFairChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOne = c(0, "one"), cTemp = c(0, "temperature"), cSame = c(1, "same"), cFair = c(1, "fair"),
      cDay = c(2, "day"), cHealthy = c(2, "healthy"), cFive = c(3, "five"), cDroop = c(3, "drooped");
    var out = fpPots(t, 1);

    /* "Only one thing changes: the temperature" */
    out += R(fpPX(152), fpPY(18), 156 * FP_POTS.k, 202 * FP_POTS.k, 10, "none", P.gold, 4,
      { opacity: on(t, cTemp, 0.4) * fpOnly(t, scene, 0), "stroke-dasharray": "14 9" });

    /* what the test holds still, and what it changes */
    FP_FAIR.forEach(function (r, n) {
      var at = r.same ? cOne : cTemp;
      var o = on(t, at == null ? null : at + n * 0.16, 0.4);
      if (o <= 0) return;
      if (!r.same) out += R(596, r.y - 36, 470, 72, 16, "#3A2E17", P.gold, 3, { opacity: o * (0.5 + 0.5 * on(t, cTemp, 0.5)) });
      out += MK.pic(632, r.y, 56, r.pic, { opacity: Math.min(1, o) });
      out += Tx(676, r.y + 11, r.text, r.same ? "lab big" : "lab big gold", "start", { opacity: o });
      if (r.same) out += MK.tick(1098, r.y, 26, popIn(t, cSame == null ? null : cSame + n * 0.3, 0.35));
    });
    /* "That is a fair test" */
    var fo = on(t, cFair, 0.4);
    out += MK.pic(648, 384, 62, "⚖️", { opacity: Math.min(1, popIn(t, cFair, 0.45)) });
    out += MK.pill(700, 384, "a fair test", fo, { size: 30, anchor: "start", col: P.gold, fill: "#1B3A52" });

    /* "Day after day": the card's own day counter runs, and the cold plant droops */
    out += fpDayBox(Math.max(bump(t, cDay, 1.6), on(t, cFive, 0.4) * fpOnly(t, scene, 3)));
    /* "healthy and green": the warm plant is ringed and ticked */
    var hp = popIn(t, cHealthy, 0.4);
    out += E(fpPX(90), fpPY(148), 82, 140, "none", P.good, 5, { opacity: on(t, cHealthy, 0.4) * fpOnly(t, scene, 2) });
    out += MK.tick(fpPX(90), fpPY(34), 26, hp * fpOnly(t, scene, 2));
    /* "drooped and gone yellow": the cold plant is ringed and its own label lit */
    var dp = on(t, cDroop, 0.4) * fpOnly(t, scene, 3);
    out += E(fpPX(226), fpPY(158), 86, 130, "none", P.gold, 5, { opacity: dp });
    out += fpLabelBox(230, 130, dp);
    return svg(out);
  }
