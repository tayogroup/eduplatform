  /* ==== chapters: a model to scale, how we found out, and the recap ===========
     tools/lib/film-scenes/science-g4/the-solar-system-3.js. */

  /* ---- a model to scale --------------------------------------------------------
     The picture that squeezes the planets in, and then the lesson's own
     football model laid out on a LINE that is to scale: 90 px is the football
     and 1120 px is 750 metres, so the peppercorn sits 34 px from the football
     and the pea is right across the screen. The objects are drawn big enough to
     name; the distances between them are the true ones, which is the claim the
     chapter makes. */
  function ssM(m) { return 90 + (m / 750) * 1030; }
  var SS_LINEY = 336;
  /* one object of the model: a card above the line with a leader down to its mark */
  function ssScaleItem(t, at, cx, metres, title, sub, draw, o) {
    var p = popIn(t, at, 0.45) * (o == null ? 1 : o);
    if (!(p > 0)) return "";
    var mx = ssM(metres);
    return MK.leader(cx, 268, mx, SS_LINEY - 12, on(t, at, 0.7) * (o == null ? 1 : o), P.gold) +
      C(mx, SS_LINEY, 8, P.gold, P.ground, 2, { opacity: Math.min(1, p) }) +
      G(draw(cx, 178) + Tx(cx, 236, title, "lab big gold", "middle") + Tx(cx, 262, sub, "lab mid muted readable", "middle"),
        { transform: around(cx, 200, Math.min(1.08, p)), opacity: Math.min(1, p) });
  }

  function ssScaleChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSq = c(0, "squeeze"), cPage = c(0, "page");
    var cModel = c(1, "model"), cSame = c(1, "same"), cBoth = c(1, "both");
    var cBall = c(2, "football"), cCm = c(2, "cm");
    var cPep = c(3, "pepper"), cM25 = c(3, "m25");
    var cGrape = c(4, "grape"), cM130 = c(4, "m130");
    var cPea = c(5, "pea"), cM750 = c(5, "m750"), cKm = c(5, "km");
    var page = ssSpan(t, scene, 0, 1), sizes = ssOnly(t, scene, 1), field = ssFrom(t, scene, 2), out = "", k;

    /* "Pictures squeeze the planets together so they fit on the page" */
    if (page > 0) {
      var inner = R(334, 96, 500, 250, 14, P.paper);
      for (k = 0; k < 8; k++) inner += ssPlanet(372 + k * 60, 214, k, 0.5);
      inner += Tx(584, 318, "a picture of the planets", "lab mid dark", "middle");
      var sq = on(t, cSq, 0.9);
      inner += MK.arrow(250, 214, lerp(250, 320, sq), 214, sq, P.accent, 8);
      inner += MK.arrow(918, 214, lerp(918, 848, sq), 214, sq, P.accent, 8);
      inner += MK.pill(584, 392, "squeezed to fit", on(t, cPage, 0.4), { size: 28, col: P.accent });
      out += G(inner, { opacity: page });
    }

    /* "shrinks everything by the same amount: sizes and distances" */
    if (sizes > 0) {
      var kk = lerp(1, 0.44, on(t, cSame, 1.3)), two = "";
      two += Tx(310, 118, "sizes", "lab big gold", "middle");
      /* two plain discs, not a gold one and a blue one: coloured that way they
         read as the Sun and the Earth, and their ratio here is 4 to 1, nothing
         like the real one. What this half claims is only that both shrink by
         the same amount. */
      two += G(C(240, 224, 64, P.muted) + C(400, 224, 17, P.muted), { transform: around(310, 224, kk) });
      two += Tx(858, 118, "distances", "lab big gold", "middle");
      two += G(C(660, 224, 11, P.muted) + C(1056, 224, 11, P.muted) +
        L(671, 224, 1045, 224, P.muted, 4, { "stroke-dasharray": "12 9" }), { transform: around(858, 224, kk) });
      two += L(584, 132, 584, 320, P.line, 2, { opacity: 0.6 });
      two += MK.pill(584, 380, "shrunk by the same amount", on(t, cBoth, 0.4), { size: 28, col: P.gold });
      out += G(two, { opacity: sizes });
    }

    /* the field, to scale: 90 px is the football, 1120 px is 750 metres.
       The four pictures are drawn big enough to recognise, so they are NOT to
       scale with each other - a peppercorn beside a 74 px football would be
       three quarters of a pixel. What is to scale is the line they point down
       to, and the caption says so, because this is the one chapter whose whole
       claim is about scale. */
    if (field > 0) {
      /* The line and its metre marks are drawn from the START of the beat, not
         from the football cue two thirds of the way through it: they used to
         leave the stage empty but for one caption for the first second and a
         half of the chapter's longest part. */
      var lineAt = BEATS[scene.first + 2].start - 0.3;
      var line = Tx(20, 60, "the line below is to scale", "lab mid muted", "start");
      line += L(90, SS_LINEY, lerp(90, 1120, on(t, lineAt, 1.1)), SS_LINEY, P.line, 4);
      [0, 250, 500, 750].forEach(function (m) {
        var mx = ssM(m), mo = on(t, lineAt + (m / 750) * 1.1, 0.4);
        if (mo <= 0) return;
        line += L(mx, SS_LINEY - 10, mx, SS_LINEY + 10, P.muted, 3, { opacity: mo }) +
          Tx(mx, SS_LINEY + 36, m === 0 ? "0" : m + " m", "lab mid muted", "middle", { opacity: mo });
      });
      /* the football: the Sun, twenty centimetres across */
      line += ssScaleItem(t, cBall, 150, 0, "football", "the Sun", function (cx, cy) {
        var o = Em(cx, cy, 74, "⚽");
        /* the measure reads to the LEFT of the ball: at cx + 66 it ran into
           the card's own "football", and then into "peppercorn" beside it */
        var cm = on(t, cCm, 0.5);
        if (cm > 0) o += L(cx - 37, cy + 50, cx + 37, cy + 50, P.gold, 3, { opacity: cm }) +
          L(cx - 37, cy + 44, cx - 37, cy + 56, P.gold, 3, { opacity: cm }) +
          L(cx + 37, cy + 44, cx + 37, cy + 56, P.gold, 3, { opacity: cm }) +
          Tx(cx - 72, cy + 56, "20 cm", "lab mid gold", "end", { opacity: cm });
        return o;
      });
      /* the Earth: a peppercorn, twenty-five metres away */
      line += ssScaleItem(t, cPep, 344, 25, "peppercorn", "Earth, 25 m away", function (cx, cy) {
        /* light enough to see on the dark stage, and still a peppercorn */
        return C(cx, cy, 9, "#6B5238", "#A98F6C", 2) + C(cx - 3, cy - 3, 2.6, "#C4AC88");
      });
      /* Jupiter: a grape, a hundred and thirty metres off */
      line += ssScaleItem(t, cGrape, 580, 130, "grape", "Jupiter, 130 m", function (cx, cy) {
        return Em(cx, cy, 52, "\u{1F347}");
      });
      /* Neptune: a small pea, seven hundred and fifty metres away */
      line += ssScaleItem(t, cPea, 972, 750, "pea", "Neptune, 750 m", function (cx, cy) {
        return C(cx, cy, 13, "#6FB24A", "#3E7A2C", 2) + C(cx - 4, cy - 5, 3.6, "#9BD47A");
      });
      /* the span the last line measures: most of a kilometre */
      var km = on(t, cKm, 0.8) * ssOnly(t, scene, 5);
      if (km > 0) out += G(MK.arrow(ssM(0), 412, lerp(ssM(0), ssM(750), on(t, cKm, 1.1)), 412, km, P.gold, 6) +
        MK.pill(584, 412, "most of a kilometre", on(t, cKm == null ? null : cKm + 0.5, 0.4), { size: 26, col: P.gold, fill: P.ground }), { opacity: km });
      out += G(line, { opacity: field });
    }
    return svg(out);
  }

  /* ---- how we found out --------------------------------------------------------
     The same four rings the whole way through: only the Earth and the Sun swap
     places, which is the whole of what Copernicus changed. On the right, what
     you see from the ground, then what Galileo saw through the telescope. */
  var SS_SKY = { x: 300, y: 232, r: [58, 90, 122, 154] };
  function ssModel(t, q, o) {
    if (!(o > 0)) return "";
    var S = SS_SKY, out = "", k;
    for (k = 0; k < 4; k++) out += C(S.x, S.y, S.r[k], "none", P.line, 1.8, { opacity: 0.6, "stroke-dasharray": "8 8" });
    /* two other planets, on the same rings in either model */
    out += ssPlanet(S.x + Math.cos(2.3) * S.r[2], S.y + Math.sin(2.3) * S.r[2], 3, 0.9);
    out += ssPlanet(S.x + Math.cos(5.4) * S.r[3], S.y + Math.sin(5.4) * S.r[3], 5, 0.5);
    /* the Sun moves in to the centre as the Earth moves out to a ring */
    var sx = lerp(S.x - S.r[1], S.x, q), ex = lerp(S.x, S.x + S.r[1], q);
    out += ssPlanet(ex, S.y, 2, lerp(1.5, 1.2, q));
    out += ssSun(sx, S.y, lerp(22, 30, q), 1, t);
    out += Tx(ex, S.y + lerp(38, 32, q), "Earth", "lab mid", "middle");
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* one phase of Venus: f 0 is new, 0.5 half, 1 full */
  function ssPhase(cx, cy, r, f, o) {
    if (!(o > 0)) return "";
    var rx = r * Math.abs(1 - 2 * f), sweep = f < 0.5 ? 1 : 0;
    return G(C(cx, cy, r, "none", P.line, 1.6) +
      Pth("M" + n2(cx) + "," + n2(cy - r) + " A" + n2(r) + "," + n2(r) + " 0 0 1 " + n2(cx) + "," + n2(cy + r) +
        " A" + n2(rx) + "," + n2(r) + " 0 0 " + sweep + " " + n2(cx) + "," + n2(cy - r) + " Z", "#E4B565"),
      { opacity: clamp(o, 0, 1) });
  }

  function ssFoundChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cYears = c(0, "years"), cEarth = c(0, "earth");
    var cMatch = c(1, "matched"), cRises = c(1, "rises"), cSets = c(1, "sets");
    var cCop = c(2, "copernicus"), cSums = c(2, "sums"), cSun = c(2, "sun");
    var cTel = c(3, "telescope"), cMoons = c(3, "moons"), cJup = c(3, "jupiter");
    var cVenus = c(4, "venus"), cNot = c(4, "not");
    var cWon = c(5, "won"), cChanges = c(5, "changes");
    var q = on(t, cSun, 1.3), out = "", k;

    out += ssModel(t, q, 1);
    out += Tx(SS_SKY.x, 420, q > 0.5 ? "the Sun at the centre" : "the Earth at the centre", "lab big",
      "middle", { fill: q > 0.5 ? P.good : P.muted });
    var ey = bump(t, cEarth, 1.3) * ssOnly(t, scene, 0);
    if (ey > 0) out += C(SS_SKY.x, SS_SKY.y, 44, "none", P.muted, 4, { opacity: ey });
    out += MK.pill(SS_SKY.x, 58, "two thousand years", on(t, cYears, 0.4) * ssOnly(t, scene, 0), { size: 26, col: P.muted });
    out += MK.pill(SS_SKY.x, 58, "Copernicus did the sums", on(t, cCop, 0.4) * ssSpan(t, scene, 2, 3), { size: 26, col: P.gold });

    /* what you see from the ground: the Sun rises, crosses and sets */
    var sky = ssOnly(t, scene, 1);
    if (sky > 0) {
      /* The Sun reaches the horizon exactly as the word "sets" is said, rather
         than over a fixed 2.1 s that landed it there first and left the word
         with nothing to do. */
      var u = cRises == null ? 0 : cSets == null ? ease((t - cRises) / 2.1)
        : ease((t - cRises) / Math.max(0.8, cSets - cRises));
      var a = Math.PI - u * Math.PI, g = "";
      g += L(620, 330, 1140, 330, "#6B4A2B", 7);
      g += Pth("M730,330 A150,150 0 0 1 1030,330", null, P.line, 1.8, { opacity: 0.5, "stroke-dasharray": "9 8" });
      g += ssSun(880 + 150 * Math.cos(a), 330 - 150 * Math.sin(a), 22, on(t, cRises, 0.4), t);
      /* This is the one beat of the film with a Sun in each half of the frame:
         the plan view of the old idea on the left, the sky above your head on
         the right. The right half wears the same words the spinning Earth
         chapter used for its ground view, so the second Sun reads as the same
         Sun seen from somewhere else and not as another one. */
      g += Tx(660, 42, "from where you stand", "lab mid muted", "start");
      g += Tx(740, 366, "rises", "lab mid muted", "middle", { opacity: on(t, cRises, 0.4) });
      g += Tx(1022, 366, "sets", "lab mid muted", "middle", { opacity: on(t, cSets, 0.4) });
      g += MK.pill(880, 106, "it matched what you see", on(t, cMatch, 0.4), { size: 26, col: P.muted });
      out += G(g, { opacity: sky });
    }
    /* the sums: a page of figures beside the model */
    var sm = popIn(t, cSums, 0.45) * ssOnly(t, scene, 2);
    if (sm > 0) {
      var pg = R(760, 96, 300, 250, 14, P.paper);
      for (k = 0; k < 6; k++) pg += L(790, 140 + k * 34, 790 + [180, 240, 150, 210, 170, 230][k], 140 + k * 34, "#8AA0B2", 7);
      out += MK.pop(pg + Tx(910, 380, "the sums fitted better", "lab mid muted", "middle"), 910, 220, sm);
    }
    /* the telescope, and what it saw */
    var tel = ssFrom(t, scene, 3) * (1 - 0.7 * ssFrom(t, scene, 5)), eye = "";
    if (tel > 0) {
      eye += C(900, 200, 118, "#0A1B29", P.line, 5);
      var mn = ssOnly(t, scene, 3);
      if (mn > 0) {
        var jg = ssPlanet(900, 200, 4, 0.85);
        for (k = 0; k < 4; k++) {
          var mo = popIn(t, cMoons == null ? null : cMoons + k * 0.3, 0.35);
          if (mo <= 0) continue;
          var mx = 900 + [-88, -56, 56, 88][k], my = 200 + [14, -18, 18, -12][k];
          jg += MK.pop(C(mx, my, 7, "#E9E4D6"), mx, my, mo);
        }
        eye += G(jg, { opacity: mn });
      }
      var vn = ssOnly(t, scene, 4);
      if (vn > 0) {
        var vg = "";
        [0.18, 0.5, 0.78, 1].forEach(function (f, n) {
          vg += ssPhase(830 + n * 47, 200, 19, f, popIn(t, cVenus == null ? null : cVenus + n * 0.26, 0.35));
        });
        vg += Tx(900, 284, "Venus, changing phase", "lab mid muted", "middle", { opacity: on(t, cVenus, 0.5) });
        eye += G(vg, { opacity: vn });
      }
      eye += Em(700, 352, 78, "\u{1F52D}");
      eye += MK.leader(742, 322, 800, 262, on(t, cTel, 0.6), P.good);
      var jl = on(t, cJup, 0.4) * ssOnly(t, scene, 3);
      if (jl > 0) out += MK.pill(900, 356, "moons going round Jupiter", jl, { size: 24, col: P.good });
      var nt = on(t, cNot, 0.4) * ssOnly(t, scene, 4);
      if (nt > 0) out += MK.pill(900, 356, "not everything goes round us", nt, { size: 24, col: P.good });
      out += G(eye, { opacity: tel });
    }
    /* the evidence won */
    var won = ssOnly(t, scene, 5);
    if (won > 0) {
      out += MK.tick(900, 174, 54, popIn(t, cWon, 0.45) * won);
      out += G(MK.pill(900, 268, "evidence", on(t, cWon, 0.4), { size: 30, col: P.good }) +
        MK.pill(900, 332, "knowledge changes", on(t, cChanges, 0.4), { size: 30, col: P.good }), { opacity: won });
    }
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------- */
  var SS_RECAP = MK.recapKind([
    { beat: 0, at: "spins", title: "The Earth spins", sub: "one spin, one day and night",
      pic: function (cx, cy, size, t) { return ssSun(cx - 40, cy, 17, 1, t) + ssPlanet(cx + 34, cy, 2, 1.4) +
        Pth("M" + n2(cx + 12) + "," + n2(cy - 32) + " a26,26 0 0 1 44,10", null, P.gold, 3); } },
    { beat: 1, at: "planets", title: "Eight planets", sub: "the Sun at the centre",
      pic: function (cx, cy, size, t) { return ssSun(cx - 62, cy, 15, 1, t) + ssPlanet(cx - 8, cy, 2, 1) +
        ssPlanet(cx + 46, cy, 4, 0.7); } },
    { beat: 1, at: "asteroids", title: "Asteroids, comets", sub: "rock, and ice with a tail",
      pic: function (cx, cy) { return ssRock(cx - 52, cy + 6, 38, 30, 1) + ssComet(cx + 10, cy - 6, 0.25, 62, 1, 1); } },
    { beat: 2, at: "scale", title: "A scale model", sub: "sizes and distances true",
      pic: function (cx, cy) { return Em(cx - 48, cy, 52, "⚽") +
        L(cx - 16, cy, cx + 44, cy, P.muted, 2, { "stroke-dasharray": "7 6" }) + C(cx + 52, cy, 7, "#4A3524", "#2C1F14", 2); } },
    { beat: 2, at: "evidence", title: "Evidence", sub: "it moved the Sun to the centre",
      pic: function (cx, cy) { return Em(cx, cy, 68, "\u{1F52D}"); } }
  ], { goBeat: 2, goAt: "evidence" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Why the Earth's spin makes day and night",
      "The eight planets, in order from the Sun",
      "Asteroids, comets, and a model to scale"
    ] }),
    spin: ssSpinChapter, centre: ssCentreChapter, rocks: ssRocksChapter,
    scale: ssScaleChapter, found: ssFoundChapter, recap: SS_RECAP
  };
