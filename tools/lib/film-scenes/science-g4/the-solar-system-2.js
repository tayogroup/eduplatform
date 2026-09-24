  /* ==== chapters: the Sun and its planets, and asteroids and comets ===========
     tools/lib/film-scenes/science-g4/the-solar-system-2.js. */

  /* ---- the Sun and its planets -----------------------------------------------
     The Sun on the left with its eight planets in a row out from it, each one
     appearing as it is named, and a faint arc of its orbit curving back round
     the Sun so the row reads as "they go round it". The sizes put them in the
     right order - Jupiter biggest, then Saturn with its rings - and the scale
     chapter is where the film says what a picture like this cannot show. */
  var SS_SUNC = { x: 155, y: 220, r: 62 };
  var SS_ROWY = 220;
  function ssRowX(k) { return 322 + k * 108; }
  /* The planet's orbit, drawn as the arc of it that fits in the box: it must
     bulge AWAY from the Sun, through the planet itself, so the row reads as
     eight rings seen edge on. The sweep flag is 1 for that reason - with 0 the
     arc takes the other way round the Sun, and Mercury's, whose radius is half
     its chord, swung out to x = -20 (found by --sweep, not by any sheet). */
  function ssOrbitArc(k, o) {
    if (!(o > 0)) return "";
    var r = ssRowX(k) - SS_SUNC.x, th = Math.asin(Math.min(1, 178 / r));
    var x1 = SS_SUNC.x + Math.cos(th) * r, y1 = SS_SUNC.y - Math.sin(th) * r;
    var x2 = x1, y2 = SS_SUNC.y + Math.sin(th) * r;
    return Pth("M" + n2(x1) + "," + n2(y1) + " A" + n2(r) + "," + n2(r) + " 0 0 1 " + n2(x2) + "," + n2(y2),
      null, P.line, 1.8, { opacity: 0.55 * clamp(o, 0, 1), "stroke-dasharray": "8 8" });
  }
  /* a bracket under the planets a to b, with a word under it */
  function ssBracket(a, b, y, text, o, col) {
    if (!(o > 0)) return "";
    var x1 = ssRowX(a) - 44, x2 = ssRowX(b) + 44;
    return G(Pth("M" + n2(x1) + "," + n2(y - 12) + " L" + n2(x1) + "," + n2(y) + " L" + n2(x2) + "," + n2(y) +
      " L" + n2(x2) + "," + n2(y - 12), null, col || P.gold, 3) +
      Tx((x1 + x2) / 2, y + 30, text, "lab", "middle", { fill: col || P.gold }), { opacity: clamp(o, 0, 1) });
  }

  function ssCentreChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cStar = c(0, "star"), cGas = c(0, "gas");
    var cCentre = c(1, "centre"), cEight = c(1, "eight"), cRound = c(1, "round");
    var inner = [c(2, "mercury"), c(2, "venus"), c(2, "earth"), c(2, "mars")];
    var outer = [c(4, "jupiter"), c(4, "saturn"), c(4, "uranus"), c(4, "neptune")];
    var cRocky = c(3, "rocky"), cThird = c(3, "third"), cFirst = c(3, "first");
    var cGiants = c(4, "giants"), cBig = c(5, "biggest"), cRings = c(5, "rings"), cFar = c(5, "farthest");
    var cue8 = inner.concat(outer), out = "", k;

    /* the orbits, drawn out from the Sun as the planets are promised */
    var orb = on(t, cRound, 1.2);
    for (k = 0; k < 8; k++) out += ssOrbitArc(k, Math.min(1, orb * 8 - k));

    /* the Sun, and what it is */
    out += ssSun(SS_SUNC.x, SS_SUNC.y, SS_SUNC.r, popIn(t, cStar, 0.5), t);
    out += MK.pill(SS_SUNC.x, 356, "a star", on(t, cStar, 0.4), { size: 28, col: P.gold });
    out += Tx(SS_SUNC.x, 400, "hot, glowing gas", "lab mid muted", "middle", { opacity: on(t, cGas, 0.5) });
    var ce = bump(t, cCentre, 1.3);
    if (ce > 0) out += C(SS_SUNC.x, SS_SUNC.y, SS_SUNC.r + 22, "none", P.gold, 4, { opacity: ce }) +
      Tx(SS_SUNC.x, 74, "the centre", "lab gold", "middle", { opacity: ce });

    /* "eight planets": the count, then each planet as it is named */
    var eight = popIn(t, cEight, 0.4) * ssOnly(t, scene, 1);
    if (eight > 0) out += MK.pill(700, 96, "eight planets", Math.min(1, eight), { size: 30, col: P.gold });
    for (k = 0; k < 8; k++) {
      var px = ssRowX(k), p8 = popIn(t, cue8[k], 0.4), ghost = on(t, cEight, 0.5) * ssOnly(t, scene, 1);
      if (p8 <= 0 && ghost <= 0) continue;
      if (p8 <= 0) { out += C(px, SS_ROWY, 9, P.muted, null, null, { opacity: 0.55 * ghost }); continue; }
      out += MK.pop(ssPlanet(px, SS_ROWY, k), px, SS_ROWY, p8);
      out += Tx(px, 302, SS_PLANETS[k].name, "lab", "middle", { opacity: Math.min(1, p8), fill: k === 2 ? P.good : P.ink });
    }
    /* A row of planets claims something about size and distance, and this row
       is honest about only one of them: the discs are in the right ORDER of
       size, and the even spacing is no distance at all. The lesson's own words
       for that, from the last frame of its scale demo, stand in the corner from
       the moment the first planet is drawn; the scale chapter then shows what a
       picture like this cannot. */
    out += Tx(1148, 52, "the order, not the scale", "lab mid muted", "end",
      { opacity: on(t, cue8[0], 0.5) });

    /* "small and rocky", "the giants" */
    out += ssBracket(0, 3, 336, "small and rocky", on(t, cRocky, 0.5) * ssOnly(t, scene, 3), P.gold);
    out += ssBracket(4, 7, 336, "the giants, far out", on(t, cGiants, 0.5) * ssOnly(t, scene, 4), P.plum);

    /* "Earth is third, not first": count the three nearest, and name the first */
    var third = on(t, cThird, 0.5) * ssOnly(t, scene, 3);
    if (third > 0) {
      for (k = 0; k < 3; k++) {
        var no = popIn(t, cThird == null ? null : cThird + k * 0.3, 0.35) * third;
        out += MK.pop(Tx(ssRowX(k), 146, String(k + 1), "lab big gold", "middle"), ssRowX(k), 140, no);
      }
      out += C(ssRowX(2), SS_ROWY, 30, "none", P.good, 4, { opacity: third * on(t, cThird + 0.6, 0.4) });
    }
    var first = on(t, cFirst, 0.4) * ssOnly(t, scene, 3);
    if (first > 0) out += ssLabel(t, ssRowX(0) - 34, 106, "nearest", cFirst, [ssRowX(0), SS_ROWY - 22], true, 22, "end");

    /* "Jupiter is the biggest", "the great rings", "farthest out" */
    var bg = on(t, cBig, 0.5) * ssOnly(t, scene, 5);
    if (bg > 0) out += C(ssRowX(4), SS_ROWY, 46 + 3 * breathe(t), "none", P.gold, 4, { opacity: bg }) +
      Tx(ssRowX(4), 146, "biggest", "lab gold", "middle", { opacity: bg });
    var rg = on(t, cRings, 0.5) * ssOnly(t, scene, 5);
    if (rg > 0) out += E(ssRowX(5), SS_ROWY, 64, 22, "none", P.gold, 3,
      { opacity: rg, transform: "rotate(-15 " + n2(ssRowX(5)) + " " + n2(SS_ROWY) + ")" }) +
      Tx(ssRowX(5), 146, "rings", "lab gold", "middle", { opacity: rg });
    var fr = on(t, cFar, 0.6) * ssOnly(t, scene, 5);
    if (fr > 0) out += MK.arrow(250, 386, lerp(250, ssRowX(7) - 8, on(t, cFar, 0.9)), 386, fr, P.gold, 6) +
      Tx(ssRowX(7), 420, "farthest out", "lab gold", "middle", { opacity: fr });
    return svg(out);
  }

  /* ---- asteroids and comets ----------------------------------------------------
     The belt of rock between Mars and Jupiter, then a comet coming in from the
     cold edge and growing a tail as it nears the Sun, and last the four things
     a planetary system holds. The rock is the kit's own drawing, the one the
     lesson puts on its asteroid card. */
  var SS_RK = { sun: [170, 230, 34], mars: [420, 230], jup: [930, 230] };
  function ssBelt(t, at, o) {
    if (!(o > 0)) return "";
    var n = tally(t, at, 26, 1.1), out = "";
    for (var k = 0; k < n; k++) {
      var x = 520 + (SS_SCATTER[k] * 0.94 + 0.03) * 280;
      var y = 230 + (SS_SCATTER[(k + 13) % 30] - 0.5) * 92;
      out += ssRock(x, y, 12 + SS_SCATTER[(k + 5) % 30] * 16, SS_SCATTER[(k + 9) % 30] * 360, 1);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* the strip every beat of the chapter shares: the Sun, Mars, the belt, Jupiter */
  function ssRockStrip(t, scene, cBelt, o) {
    if (!(o > 0)) return "";
    var S = SS_RK, out = "";
    out += ssSun(S.sun[0], S.sun[1], S.sun[2], 1, t);
    out += ssPlanet(S.mars[0], S.mars[1], 3, 1.6) + Tx(S.mars[0], 306, "Mars", "lab", "middle");
    out += ssPlanet(S.jup[0], S.jup[1], 4, 1.2) + Tx(S.jup[0], 320, "Jupiter", "lab", "middle");
    out += ssBelt(t, cBelt, 1);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function ssRocksChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cBetween = c(0, "between"), cBeltW = c(0, "belt"), cAst = c(0, "asteroids");
    var cHouse = c(1, "house"), cHuge = c(1, "huge");
    var cEdge = c(2, "edge"), cComets = c(2, "comets"), cIce = c(2, "ice");
    var cNear = c(3, "near"), cGas = c(3, "gas"), cTail = c(3, "tail");
    var cShoot = c(4, "shooting"), cOrbit = c(4, "orbit"), cFar = c(4, "far");
    var four = [c(5, "star"), c(5, "planets"), c(5, "asteroids"), c(5, "comets")], cSys = c(5, "system");
    var last = ssFrom(t, scene, 5), strip = 1 - 0.82 * last, out = "";

    out += ssRockStrip(t, scene, cBeltW, strip * (1 - 0.7 * ssFrom(t, scene, 2) * (1 - last)));

    /* "Between Mars and Jupiter": the gap between the two, measured */
    var bw = on(t, cBetween, 0.6) * ssOnly(t, scene, 0);
    if (bw > 0) out += L(460, 130, lerp(460, 890, on(t, cBetween, 0.9)), 130, P.gold, 3, { opacity: bw, "stroke-dasharray": "10 8" }) +
      L(460, 118, 460, 142, P.gold, 3, { opacity: bw }) + L(890, 118, 890, 142, P.gold, 3, { opacity: bw * on(t, cBetween + 0.5, 0.4) });
    var ao = on(t, cAst, 0.4) * ssSpan(t, scene, 0, 2);
    if (ao > 0) out += MK.pill(660, 380, "asteroids: lumps of rock", ao, { size: 26, col: P.plum });

    /* "as small as a house", "hundreds of kilometres across" */
    var hs = popIn(t, cHouse, 0.4) * ssOnly(t, scene, 1);
    if (hs > 0) out += MK.pop(ssRock(250, 392, 22, 20, 1) + Em(318, 392, 54, "\u{1F3E0}") +
      Tx(284, 432, "as small as a house", "lab mid muted", "middle"), 284, 392, hs);
    /* clear to the right of the "asteroids: lumps of rock" pill, which runs to
       x 852 and had the big rock sitting on its end */
    var hg = popIn(t, cHuge, 0.4) * ssOnly(t, scene, 1);
    if (hg > 0) out += MK.pop(ssRock(958, 388, 76, 200, 1) +
      Tx(958, 432, "or hundreds of kilometres", "lab mid muted", "middle"), 958, 388, hg);

    /* the comet: in from the cold edge, then a tail as it nears the Sun */
    var comet = ssSpan(t, scene, 2, 5);
    if (comet > 0) {
      var fly = on(t, cNear, 1.5), cx = lerp(1058, 356, fly), cy = lerp(126, 214, fly);
      var tailU = on(t, cGas, 0.9) * on(t, cNear, 0.5);
      out += G(L(1062, 126, 1148, 92, "#5C8FA6", 2, { opacity: 0.4 * on(t, cEdge, 0.5), "stroke-dasharray": "7 6" }) +
        Tx(1088, 74, "the cold edge", "lab mid muted", "middle", { opacity: on(t, cEdge, 0.5) }), { opacity: comet });
      out += G(ssComet(cx, cy, Math.atan2(cy - SS_RK.sun[1], cx - SS_RK.sun[0]), 180, tailU, 1), { opacity: comet });
      out += G(MK.pill(cx, cy - 62, "ice and dust", on(t, cIce, 0.4) * ssOnly(t, scene, 2), { size: 24, col: "#8FD8E6" }), { opacity: comet });
      var tl = on(t, cTail, 0.4) * ssOnly(t, scene, 3);
      if (tl > 0) out += MK.pill(cx + 210, cy - 66, "a glowing tail", tl, { size: 24, col: "#8FD8E6" }) +
        MK.leader(cx + 210, cy - 52, cx + 120, cy - 14, on(t, cTail, 0.6), "#8FD8E6");
      /* "not a shooting star": a streak in our air, crossed out */
      /* top LEFT: the comet's own loop, drawn on the same beat, rises to about
         y 82 across the middle of the frame, and the crossed-out streak sat on
         it there. At x 175 the loop is down at y 145. */
      var sh = popIn(t, cShoot, 0.4) * ssOnly(t, scene, 4);
      if (sh > 0) out += MK.pop(L(110, 56, 240, 106, P.muted, 5) + C(240, 106, 7, P.muted) +
        Tx(175, 36, "a shooting star", "lab mid muted", "middle"), 175, 81, sh) +
        MK.cross(175, 81, 26, popIn(t, cShoot == null ? null : cShoot + 0.5, 0.35) * ssOnly(t, scene, 4));
      /* "It goes round the Sun, far out in space" */
      var ob = on(t, cOrbit, 0.7) * ssOnly(t, scene, 4);
      if (ob > 0) out += E(560, 230, 470 * ob, 148 * ob, "none", "#8FD8E6", 2.5, { opacity: 0.75 * ob, "stroke-dasharray": "12 9" }) +
        Tx(560, 412, "round the Sun, far out in space", "lab mid", "middle", { opacity: ob, fill: "#8FD8E6" });
    }

    /* "a planetary system": the four things it holds */
    if (last > 0) {
      var cards = [
        { title: "a star", sub: "the Sun", draw: function (x, y) { return ssSun(x, y, 34, 1, t); } },
        { title: "planets", sub: "eight of them", draw: function (x, y) { return ssPlanet(x - 34, y, 2, 1.1) + ssPlanet(x + 30, y, 5, 0.85); } },
        { title: "asteroids", sub: "lumps of rock", draw: function (x, y) { return ssRock(x - 24, y + 8, 40, 20, 1) + ssRock(x + 22, y - 6, 52, 200, 1); } },
        { title: "comets", sub: "ice with a tail", draw: function (x, y) { return ssComet(x - 28, y, 0.2, 96, 1, 1); } }
      ];
      var w = 250, gap = 24, x0 = (1168 - (4 * w + 3 * gap)) / 2, inner = "";
      cards.forEach(function (cd, k) {
        var x = x0 + k * (w + gap), cxm = x + w / 2, p = popIn(t, four[k], 0.4);
        if (p <= 0) return;
        inner += G(R(x, 132, w, 196, 20, "#1B3A52", P.teal, 3) + cd.draw(cxm, 202) +
          Tx(cxm, 282, cd.title, "lab big", "middle") + Tx(cxm, 312, cd.sub, "lab mid muted readable", "middle"),
          { transform: around(cxm, 230, Math.min(1.08, p)), opacity: Math.min(1, p) });
      });
      var sy = on(t, cSys, 0.5);
      inner += R(x0 - 16, 116, 4 * w + 3 * gap + 32, 228, 26, "none", P.gold, 4, { opacity: sy });
      inner += MK.pill(584, 386, "a planetary system", sy, { size: 30, col: P.gold });
      out += G(inner, { opacity: last });
    }
    return svg(out);
  }
