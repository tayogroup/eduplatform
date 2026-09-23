  /* ==== chapters: highest at midday, and sunset in the west =====================
     tools/lib/film-scenes/science-g2/the-sun-across-the-sky-2.js. Both stand on
     the sky stage in the first file, so the Sun carries on from where the
     sunrise chapter left it: low in the east, then the apex, then down to the
     west. The sunset chapter ends on the lesson's own two sky pictures, the
     first and last frames of its "Sunrise to sunset" demo. */

  /* ---- highest at midday ----------------------------------------------------- */
  function sasMiddayChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cMorning = c(0, "morning"), cClimbs = c(0, "climbs");
    var cNoon = c(1, "midday"), cHigh = c(1, "highest");
    var cShort = c(2, "short"), cShortest = c(2, "shortest");
    var cHigher = c(3, "higher"), cShorter = c(3, "shorter");

    var u = lerp(SAS_U.rise, SAS_U.morning, on(t, cMorning, 2.3));
    u = lerp(u, SAS_U.noon, on(t, cNoon, 1.5));
    var s = sasSunAt(u), tip = sasTip(s[0], s[1]);
    var out = sasStage(t, { u: u });

    /* "climbs higher": an arrow up the path, from where the Sun came from */
    var cl = on(t, cClimbs, 0.7) * sasOnly(t, scene, 0);
    if (cl > 0) {
      var was = sasSunAt(SAS_U.rise);
      out += MK.arrow(was[0] + 40, was[1] - 16, s[0] - 46, s[1] + 34, cl, P.gold, 8);
    }
    /* "its highest point": the apex ringed, and how high it is */
    var hi = on(t, cHigh, 0.6) * sasOnly(t, scene, 1);
    if (hi > 0) {
      out += C(s[0], s[1], 46 + 6 * breathe(t), "none", SAS_GOLD, 4, { opacity: hi });
      out += L(s[0] - 60, s[1], 268, s[1], SAS_GOLD, 3, { "stroke-dasharray": "9 9", opacity: hi });
      /* how much sky there is under it, measured both ways */
      var mid = (s[1] + SAS_H) / 2, hh = on(t, cHigh == null ? null : cHigh + 0.2, 0.7) * hi;
      out += MK.arrow(300, mid, 300, s[1] + 6, hh, P.gold, 6) + MK.arrow(300, mid, 300, SAS_H - 6, hh, P.gold, 6);
      out += MK.pill(160, s[1], "highest", hi, { size: 26, col: P.gold });
    }

    /* "the shadow is short": the morning's shadow, faint, beside today's stub */
    /* the short shadow, the morning's beside it and the tick belong to that
       beat alone: left up they crowd "the higher the Sun, the shorter" with
       five labels at once */
    var sh = sasOnly(t, scene, 2);
    if (sh > 0) {
      var wasTip = sasTip.apply(null, sasSunAt(SAS_U.rise));
      var gh = on(t, cShortest, 0.7) * sh;
      if (gh > 0) {
        out += L(SAS_SX, SAS_H, wasTip, SAS_H + SAS_DROP, SAS_SHADE, 15, { opacity: 0.42 * gh });
        out += MK.pill((SAS_SX + wasTip) / 2, 356, "morning", gh, { size: 22, col: P.line, ink: P.muted });
      }
      var so = on(t, cShort, 0.5) * sh;
      if (so > 0) {
        out += C((SAS_SX + tip) / 2, SAS_H + SAS_DROP / 2, 40, "none", SAS_GOLD, 4, { opacity: so });
        out += MK.leader(738, 292, (SAS_SX + tip) / 2 + 44, SAS_H + SAS_DROP / 2, on(t, cShort, 0.6), P.gold);
        out += MK.pill(802, 292, "short", so, { size: 26, col: P.gold });
      }
      out += MK.tick(886, 292, 20, popIn(t, cShortest, 0.4) * sh);
    }

    /* "The higher the Sun, the shorter the shadow" */
    var hr = sasOnly(t, scene, 3);
    if (hr > 0) {
      /* the arrow belongs BESIDE the Sun: at a fixed x it stood in empty sky
         with nothing named under it */
      out += MK.arrow(s[0] + 96, s[1] + 72, s[0] + 96, s[1] - 18, on(t, cHigher, 0.6) * hr, P.gold, 8);
      out += MK.pill(s[0] + 96, s[1] - 50, "higher", on(t, cHigher, 0.5) * hr, { size: 24, col: P.gold });
      var sr = on(t, cShorter, 0.6) * hr;
      out += MK.arrow(440, 330, 548, 330, sr, P.gold, 8) + MK.arrow(740, 330, 632, 330, sr, P.gold, 8);
      out += MK.pill(590, 386, "shorter", sr, { size: 24, col: P.gold });
    }
    return svg(out);
  }

  /* ---- sunset in the west ------------------------------------------------------
     The Sun sinks to the western horizon and goes out; the shadow swings to the
     east and runs off the picture, as it does outdoors. The last beat leaves
     the stage for the lesson's own two sky pictures. */
  var SAS_CARD = [{ x: 96, label: "rises in the east", s: 1 }, { x: 632, label: "sets in the west", s: 4 }];
  function sasSkyCards(t, scene) {
    var cEast = sc(scene, 3, "east"), cWest = sc(scene, 3, "west"), cEvery = sc(scene, 3, "every");
    /* the first card comes in as "The Sun rises..." begins, so the chapter
       never shows an empty stage, and is ringed again on "every day" */
    var at = [BEATS[scene.first + 3].start + 0.1, cWest], out = "";
    SAS_CARD.forEach(function (card, k) {
      var p = popIn(t, at[k], 0.45);
      if (!(p > 0)) return;
      var ring = on(t, cEvery, 0.5) * (0.6 + 0.4 * breathe(t + k * 0.5));
      out += G(R(card.x - 8, 12, 456, 373, 18, P.card, ring > 0.2 ? SAS_GOLD : P.line, ring > 0.2 ? 4 : 2) +
        ART.place(ART.scene("sky", card.s), card.x, 20, 440, 357.5) +
        Tx(card.x + 220, 414, card.label, "lab big", "middle"),
        { opacity: Math.min(1, p), transform: around(card.x + 220, 200, 0.96 + 0.04 * Math.min(p, 1.08)) });
    });
    return out;
  }

  function sasSunsetChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cAfter = c(0, "afternoon"), cSinks = c(0, "sinks");
    var cLong = c(1, "long"), cEast = c(1, "east");
    var cEve = c(2, "evening"), cLow = c(2, "low"), cGone = c(2, "gone");

    var u = lerp(SAS_U.noon, SAS_U.after, on(t, cAfter, 2.4));
    u = lerp(u, SAS_U.evening, on(t, cEve, 1.6));
    var s = sasSunAt(u), tip = sasTip(s[0], s[1]);
    var gone = on(t, cGone, 1.1);
    /* "and disappears": the disc fades right out and drops below the horizon,
       and the shadow goes with it - no Sun, no shadow */
    var out = sasStage(t, {
      u: u, sunO: 1 - gone, sunDip: gone * 120, shadowFade: 1 - gone,
      eastLit: bump(t, cEast, 1.8), westLit: Math.max(bump(t, cSinks, 1.8), bump(t, cLow, 1.8))
    });

    /* "sinks towards the west": an arrow down the path */
    var sk = on(t, cSinks, 0.7) * sasOnly(t, scene, 0);
    if (sk > 0) {
      var top = sasSunAt(SAS_U.noon);
      out += MK.arrow(top[0] + 48, top[1] + 16, s[0] - 44, s[1] - 30, sk, P.gold, 8);
    }
    /* "Shadows grow long again. Now they point east." */
    var lg = sasOnly(t, scene, 1);
    if (lg > 0) {
      var lo = on(t, cLong, 0.6) * lg;
      out += L(tip, 336, tip, 350, SAS_GOLD, 4, { opacity: lo }) + L(SAS_SX, 336, SAS_SX, 350, SAS_GOLD, 4, { opacity: lo });
      out += L(SAS_SX, 343, lerp(SAS_SX, tip, on(t, cLong, 0.9)), 343, SAS_GOLD, 4, { opacity: lo });
      out += MK.pill((SAS_SX + tip) / 2, 378, "long again", lo, { size: 26, col: P.gold });
      out += MK.arrow(SAS_SX - 30, 298, tip + 20, 304, on(t, cEast, 0.8) * lg, P.gold, 8);
    }
    /* "it sinks low in the west and disappears" */
    var ev = sasOnly(t, scene, 2);
    if (ev > 0 && gone > 0.05) out += MK.pill(s[0], SAS_H - 96, "gone", gone * ev, { size: 26, col: P.line, ink: P.muted });

    /* the lesson's own sunrise and sunset pictures close the chapter */
    var swap = into(t, scene.first + 3);
    if (swap >= 1) return svg(sasSkyCards(t, scene));
    out = G(out, { opacity: 1 - swap });
    if (swap > 0) out += G(sasSkyCards(t, scene), { opacity: swap });
    return svg(out);
  }
