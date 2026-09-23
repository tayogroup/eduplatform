  /* ==== Grade 3 Science, Lesson 8: Mixtures, part 4 ============================
     The safety chapter and the recap, and the KINDS table the engine's tail
     reads. The risks and the safe habits are the lesson's own Safe scientist
     items, in its order: goggles on, spills wiped, hair tied back, taste
     nothing unless a grown-up says so. */

  /* ---- the three risks the lesson names --------------------------------------- */
  /* a beaker with a jagged crack, and three shards on the bench beside it */
  function mxBrokenGlass(cx, cy, s) {
    return G(L(-96, 70, 96, 70, "#6E7E8C", 6) +
      E(0, -48, 42, 10, "none", P.plastic, 5) +
      Pth("M-42,-48 v80 q0,14 14,14 h56 q14,0 14,-14 v-80", null, P.plastic, 5) +
      Pth("M-10,-48 L6,-20 L-16,0 L2,24 L-10,46", null, "#EAF3F8", 5) +
      Pth("M-92,66 L-62,42 L-52,68 Z", "#B9D3E2") +
      Pth("M56,68 L84,44 L92,68 Z", "#B9D3E2") +
      Pth("M-34,68 L-20,52 L-8,68 Z", "#8FB0C4"),
      { transform: tr(cx, cy, s / 100) });
  }
  function mxPuddle(cx, cy, s) {
    return G(L(-92, 36, 92, 36, "#6E7E8C", 6) +
      E(-6, 40, 70, 15, MX_WATER2, null, null, { opacity: 0.85 }) +
      Pth("M-58,-26 C-22,-54 26,-42 62,-10", null, P.bad, 6, { "stroke-dasharray": "13 10" }) +
      MK.pic(-62, -38, 56, "\u{1F45F}"), { transform: tr(cx, cy, s / 100) });
  }
  function mxPowderJar(cx, cy, s) {
    return G(R(-44, -20, 88, 74, 10, "#CBD6E0", "#8FA2B2", 4) + R(-32, -34, 64, 16, 7, "#8FA2B2") +
      R(-34, 4, 68, 46, 6, MX_SALT, null, null, { opacity: 0.8 }) +
      G(C(-12, -60, 14, MX_SALT) + C(18, -74, 11, MX_SALT) + C(40, -52, 9, MX_SALT) + C(4, -92, 8, MX_SALT),
        { opacity: 0.6 }), { transform: tr(cx, cy, s / 100) });
  }

  /* ==== chapter: spot the risk =================================================== */
  function mxRisksChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cWork = c(0, "work"), cRisks = c(0, "risks"), cHurt = c(0, "hurt");
    var cGlass = c(1, "glass"), cFloors = c(1, "floors"), cPowders = c(1, "powders");
    var cSci = c(2, "sci"), cSpots = c(2, "spots"), cGoggles = c(2, "goggles"), cSpills = c(2, "spills");
    var cHair = c(3, "hair"), cTaste = c(3, "taste"), cGrown = c(3, "grownup");
    var out = "";

    var A = mxSpan(t, scene, 0, 2), B = mxFrom(t, scene, 2);

    /* ---- beats 0-1: what a risk is, and three of them ----------------------- */
    if (A > 0) {
      var a = "";

      /* "Practical work": the three tools of this very lesson on the bench.
         Only in beat 0 - the risk tiles take the same space in beat 1. */
      var work = on(t, cWork, 0.5) * mxOnly(t, scene, 0);
      if (work > 0) {
        var wk = R(180, 178, 808, 208, 22, P.card, P.line, 2) +
          Tx(584, 218, "your own mixture tests", "lab mid muted readable", "middle") +
          MK.pic(340, 300, 128, ART.ICONS.sieve) + MK.pic(584, 300, 116, "\u{1F9F2}") +
          MK.pic(828, 300, 116, "\u{1F4A7}");
        a += G(wk, { opacity: work });
      }

      a += MK.pop(MK.pic(100, 98, 112, "⚠️"), 100, 98, popIn(t, cRisks, 0.45));
      a += MK.pill(184, 98, "it could hurt someone", on(t, cHurt, 0.45), { size: 30, anchor: "start", col: P.gold });

      var tiles = [
        [36, cGlass, "glass can break", mxBrokenGlass],
        [406, cFloors, "floors get wet", mxPuddle],
        [776, cPowders, "powders can hurt", mxPowderJar]
      ];
      for (var k = 0; k < 3; k++) {
        var x = tiles[k][0], at = tiles[k][1], o = on(t, at, 0.45), p = popIn(t, at, 0.45);
        if (!(o > 0)) continue;
        a += G(R(x, 190, 340, 216, 20, P.card, P.line, 2) + tiles[k][3](x + 170, 288, 108) +
          Tx(x + 170, 384, tiles[k][2], "lab mid muted readable", "middle"),
          { opacity: o, transform: around(x + 170, 298, 0.96 + 0.04 * Math.min(p, 1.08)) });
        a += MK.pic(x + 306, 224, 46, "⚠️", { opacity: on(t, at == null ? null : at + 0.3, 0.4) });
      }
      out += G(a, { opacity: A });
    }

    /* ---- beats 2-3: spot it first, then the four habits --------------------- */
    if (B > 0) {
      var b = "";
      /* the glass comes in on "A scientist", at the top of the line, so the
         beat never opens on an empty stage */
      b += MK.pop(MK.pic(250, 176, 138, "\u{1F50D}"), 250, 176, popIn(t, cSci, 0.45));
      b += MK.pill(250, 306, "spot the risk first", on(t, cSpots, 0.45), { size: 28, col: P.gold });

      var rows = [
        [cGoggles, "goggles on", "tick", "\u{1F97D}"],
        [cSpills, "spills wiped", "tick", "\u{1F9FD}"],
        [cHair, "hair tied back", "tick", "\u{1F487}\u{1F3FE}"],
        [cTaste, "taste nothing", "cross", "\u{1F445}"]
      ];
      var ry = 108, lh = 78;
      for (var r = 0; r < 4; r++) {
        var ro = on(t, rows[r][0], 0.4);
        if (!(ro > 0)) continue;
        b += MK.pic(478, ry + r * lh, 58, rows[r][3], { opacity: ro });
      }
      b += MK.list(520, ry, rows.map(function (row) { return { text: row[1], at: row[0], mark: row[2] }; }), t,
        { lh: lh, cls: "lab big", markR: 20 });

      var gr = on(t, cGrown, 0.45);
      if (gr > 0) {
        b += MK.pic(524, 396, 58, "\u{1F9D1}", { opacity: gr });
        b += MK.pill(566, 396, "unless a grown-up says so", gr, { size: 26, anchor: "start", col: P.gold });
      }
      out += G(b, { opacity: B });
    }
    return svg(out);
  }

  /* ==== what you now know ======================================================== */
  function mxRecapBowl(cx, cy, size) {
    var rx = size * 0.56, rim = cy - size * 0.06;
    var inside = mxGrains(cx, rim + size * 0.08, rx * 0.8, size * 0.1, 12, 12, size * 0.055, 1, 83, {});
    inside += mxStone(cx - rx * 0.44, rim + size * 0.03, size * 0.34, 1, 0);
    inside += mxStone(cx + rx * 0.34, rim + size * 0.07, size * 0.28, 1, 0);
    return mxBowl(cx, rim, rx, size * 0.44, 1, inside);
  }

  var MX_RECAP = MK.recapKind([
    { beat: 0, at: "mixture", title: "Mixture", sub: "each keeps its properties",
      pic: function (cx, cy, size) { return mxRecapBowl(cx, cy, size); } },
    { beat: 1, at: "sieve", title: "Sieve", sub: "separates by size", pic: ART.ICONS.sieve },
    { beat: 1, at: "magnet", title: "Magnet", sub: "only the iron is magnetic", pic: "\u{1F9F2}" },
    { beat: 2, at: "filter", title: "Filter", sub: "sand stays, water goes through", pic: "\u{1F4A7}" },
    { beat: 3, at: "salt", title: "Dissolved salt", sub: "still there, too small to see", pic: "\u{1F9C2}" },
    { beat: 3, at: "risks", title: "Spot the risk", sub: "then you are safe", pic: "⚠️" }
  ], { goBeat: 3, goAt: "risks" });

  /* ==== the chapters, by kind ==================================================== */
  var KINDS = {
    title: MK.titleKind({ sub: ["What a mixture is, and what stays the same",
      "The sieve, the magnet and the filter", "Where the salt goes when it dissolves"] }),
    mixture: mxMixtureChapter,
    sieve: mxSieveChapter,
    magnet: mxMagnetChapter,
    filter: mxFilterChapter,
    dissolve: mxDissolveChapter,
    risks: mxRisksChapter,
    recap: MX_RECAP
  };
