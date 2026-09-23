  /* ==== chapter: it is the Earth that turns, and the recap ======================
     tools/lib/film-scenes/science-g2/the-sun-across-the-sky-4.js.

     Five pictures, one per beat, crossfading: the Sun apparently crossing the
     sky and that being crossed out; the lesson's own Earth (ART.scene
     "globe") turning, carrying a child round out of the dark and into the
     Sun's light; the roundabout its explain()
     block uses to answer "why does it look as if the Sun moves"; what people
     thought long ago; and the astronomers who worked it out. */

  /* an arc that draws itself, with a head: which way a thing is turning */
  function sasTurnArrow(cx, cy, r, a0, a1, u, col) {
    if (!(u > 0)) return "";
    col = col || P.gold;
    var n = 26, d = "", k, a, ae = a0 + (a1 - a0) * u;
    for (k = 0; k <= n; k++) {
      a = lerp(a0, ae, k / n);
      d += (k ? " L" : "M") + n2(cx + r * Math.cos(a)) + "," + n2(cy + r * Math.sin(a));
    }
    var ex = cx + r * Math.cos(ae), ey = cy + r * Math.sin(ae);
    var dir = ae + (a1 > a0 ? Math.PI / 2 : -Math.PI / 2), h = 17;
    return Pth(d, null, col, 4, { opacity: 0.95 }) +
      Pth("M" + n2(ex + Math.cos(dir) * h) + "," + n2(ey + Math.sin(dir) * h) +
        " L" + n2(ex + Math.cos(dir + 2.5) * h) + "," + n2(ey + Math.sin(dir + 2.5) * h) +
        " L" + n2(ex + Math.cos(dir - 2.5) * h) + "," + n2(ey + Math.sin(dir - 2.5) * h) + " Z", col, col, 2);
  }

  /* beat 0: it only LOOKS as if the Sun crosses the sky */
  function sasSeemsPic(t, scene) {
    var cMoves = sc(scene, 0, "moves"), cNot = sc(scene, 0, "not");
    var u = on(t, cMoves, 2.0), v = 1 - u;
    var x = v * v * 240 + 2 * v * u * 584 + u * u * 928, y = v * v * 308 + 2 * v * u * (-30) + u * u * 308;
    var out = R(120, 40, 928, 296, 18, "#1B3A52", P.line, 2);
    out += R(126, 308, 916, 22, 0, SAS_GRASS);
    out += Pth("M240,308 Q584,-30 928,308", null, "#FFFFFF", 2.5, { "stroke-dasharray": "9 12", opacity: 0.45 });
    out += R(578, 262, 12, 46, 3, SAS_WOOD);
    out += sasSunDisc(x, y, 34, 1, t);
    out += MK.cross(584, 176, 68, popIn(t, cNot, 0.45), P.bad);
    return out;
  }

  /* beat 1: the lesson's Earth, turning, swinging us past the Sun.
     The child starts on the dark side, away from the Sun, and the turn carries
     them HALF a circle, so by "That swings us past the Sun" they are on the
     lit rim with the light reaching them. A whole 360 would put them back
     where they began - in the dark, on the words that say otherwise. The
     "once a day" arrow round the globe is what says how far a whole day is. */
  function sasTurnsPic(t, scene) {
    var cTurns = sc(scene, 1, "turns"), cOnce = sc(scene, 1, "once"), cSwings = sc(scene, 1, "swings");
    var p = on(t, cTurns, 2.6), turn = 180 * p, th = (180 + turn) * Math.PI / 180;
    var out = ART.place(ART.scene("globe", turn), 146, 56, 308, 308);
    out += sasSunDisc(930, 210, 50, 1, t);
    /* three rays, stopping just clear of the child the turn has brought round */
    var sw = on(t, cSwings, 0.8);
    if (sw > 0) [172, 210, 248].forEach(function (ry) {
      out += L(876, ry, lerp(876, 548, sw), ry, SAS_GOLD, 4, { "stroke-dasharray": "11 9", opacity: 0.9 });
    });
    out += sasTurnArrow(300, 210, 152, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * 0.86, on(t, cOnce, 1.4), P.gold);
    /* a child standing on the rim, feet to the middle, carried round by it;
       drawn after the arrow so the arrow passes behind them.
       90 px tall, and that is a ceiling rather than a taste: sasChild reaches
       about 0.99 of its height above its ground point (the head and the hair),
       the turn carries this one over the TOP of the globe at y = 210 - 116 = 94,
       and the chapter heading sits above y = 0. At 120 the head and hair were
       painted over "It is the Earth that turns" (review, 2026-09-23; the sweep
       had it 11 and 12 px out). */
    var px = 300 + 116 * Math.cos(th), py = 210 + 116 * Math.sin(th);
    out += G(sasChild(px, py, 90), { transform: "rotate(" + n2(th * 180 / Math.PI + 90) + " " + n2(px) + " " + n2(py) + ")" });
    out += MK.pill(300, 404, "once a day", on(t, cOnce, 0.5), { size: 26, col: P.gold });
    return out;
  }

  /* beat 2: the roundabout from the lesson's own explain() block */
  var SAS_PARK = [[170, 130, "\u{1F333}"], [998, 130, "\u{1F333}"], [160, 368, "⚽"], [1008, 368, "\u{1F3E0}"]];
  function sasRoundaboutPic(t, scene) {
    var cRound = sc(scene, 2, "round"), cSeems = sc(scene, 2, "seems"), cYou = sc(scene, 2, "you");
    var p = on(t, cRound, 3.4), ph = (-90 + 360 * p) * Math.PI / 180, out = "";
    var pop = popIn(t, cRound, 0.45);
    if (pop > 0) {
      var disc = C(584, 232, 152, "#2B5673", P.line, 4) + C(584, 232, 108, "none", P.line, 3) + C(584, 232, 14, P.muted);
      for (var k = 0; k < 6; k++) {
        var a = ph + k * Math.PI / 3;
        disc += L(584, 232, 584 + 146 * Math.cos(a), 232 + 146 * Math.sin(a), P.line, 6);
      }
      out += MK.pop(disc, 584, 232, pop);
      out += MK.pop(Em(584 + 118 * Math.cos(ph), 232 + 118 * Math.sin(ph), 66, "\u{1F9D2}"),
        584 + 118 * Math.cos(ph), 232 + 118 * Math.sin(ph), pop);
    }
    /* the playground, standing still; on "seems to move" it appears to sweep past */
    var sm = on(t, cSeems, 0.6) * (1 - on(t, cYou, 0.6));
    SAS_PARK.forEach(function (thing, k) {
      out += Em(thing[0], thing[1], 92, thing[2]);
      if (!(sm > 0)) return;
      /* speed lines: the playground streaking past, which is what it looks like */
      for (var j = 0; j < 3; j++) {
        var dx = thing[0] < 584 ? -1 : 1, y = thing[1] - 22 + j * 22, len = 46 - Math.abs(j - 1) * 14;
        out += L(thing[0] + dx * 56, y, thing[0] + dx * (56 + len), y, P.muted, 5, { opacity: sm * 0.9 });
      }
    });
    var yo = on(t, cYou, 0.5);
    if (yo > 0) {
      out += sasTurnArrow(584, 232, 186, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * 0.84, yo, P.gold);
      out += MK.pill(584, 232, "you are turning", yo, { size: 26, col: P.gold });
    }
    return out;
  }

  /* beat 3: what people thought long ago */
  function sasLongAgoPic(t, scene) {
    var cAgo = sc(scene, 3, "ago"), cThought = sc(scene, 3, "thought"), cRound = sc(scene, 3, "round");
    var a = (-90 + 360 * on(t, cRound, 2.4)) * Math.PI / 180;
    var out = E(584, 240, 300, 120, "none", P.muted, 3, { "stroke-dasharray": "12 12", opacity: 0.6 });
    out += ART.place(ART.scene("globe", 0), 494, 150, 180, 180);
    out += sasSunDisc(584 + 300 * Math.cos(a), 240 + 120 * Math.sin(a), 28, on(t, cRound, 0.5), t);
    out += sasChild(150, 372, 168);
    out += MK.pill(150, 406, "long ago", on(t, cAgo, 0.5), { size: 24, col: P.line, ink: P.muted });
    out += MK.bubble(46, 32, 400, 86, "the Sun goes round us", on(t, cThought, 0.5), 150, 244);
    return out;
  }

  /* beat 4: the astronomers, and how they worked it out */
  var SAS_STARS = [[470, 64], [556, 118], [648, 52], [740, 104], [826, 58], [912, 120], [996, 64], [1078, 112]];
  function sasAstroPic(t, scene) {
    var cAstro = sc(scene, 4, "astro"), cSky = sc(scene, 4, "sky"), cWorked = sc(scene, 4, "worked");
    var cWatch = sc(scene, 4, "watching"), cMeas = sc(scene, 4, "measuring");
    var out = "", n = tally(t, cSky, SAS_STARS.length, 1.1);
    for (var k = 0; k < n; k++) {
      var s = SAS_STARS[k], p = popIn(t, cSky == null ? null : cSky + k * 0.13, 0.3);
      out += MK.pop(Pth("M" + s[0] + "," + (s[1] - 17) + " q3,11 14,14 q-11,3 -14,14 q-3,-11 -14,-14 q11,-3 14,-14z", SAS_GOLD) +
        C(s[0], s[1], 4, "#FFFFFF"), s[0], s[1], p);
    }
    out += MK.pop(Em(220, 258, 164, "\u{1F52D}"), 220, 258, popIn(t, cAstro, 0.45));
    out += MK.pill(220, 388, "astronomers", on(t, cAstro, 0.5), { size: 26, col: P.gold });
    out += MK.list(556, 226, [
      { text: "watching the sky", at: cWatch, mark: "tick", markAt: cWatch == null ? null : cWatch + 0.15 },
      { text: "measuring shadows", at: cMeas, mark: "tick", markAt: cMeas == null ? null : cMeas + 0.15 }
    ], t, { lh: 66, cls: "lab big" });
    out += MK.pill(820, 386, "the Earth turns", on(t, cWorked, 0.5), { size: 26, col: P.good });
    return out;
  }

  function sasEarthChapter(scene, beat, t, i) {
    var pics = [sasSeemsPic, sasTurnsPic, sasRoundaboutPic, sasLongAgoPic, sasAstroPic];
    return svg(crossfade(t, i, scene, function (n) { return pics[n - scene.first](t, scene); }));
  }

  /* ==== what you now know ========================================================= */
  function sasRecapBars(cx, cy, size) {
    var w = size * 1.7, out = "";
    [1, 0.32, 1].forEach(function (f, k) {
      out += R(cx - w / 2, cy - size * 0.38 + k * size * 0.32, w * f, size * 0.19, 4, k === 1 ? P.gold : P.muted);
    });
    return out;
  }
  function sasRecapMeasure(cx, cy, size) {
    return Em(cx - size * 0.44, cy, size * 0.92, SAS_HAND) +
      R(cx + size * 0.14, cy - size * 0.34, size * 0.64, size * 0.68, 7, P.cell, P.muted, 2) +
      L(cx + size * 0.14, cy - size * 0.1, cx + size * 0.78, cy - size * 0.1, P.muted, 2) +
      L(cx + size * 0.46, cy - size * 0.34, cx + size * 0.46, cy + size * 0.34, P.muted, 2);
  }

  var SAS_RECAP = MK.recapKind([
    { beat: 0, at: "east", title: "Sunrise", sub: "the Sun rises in the east", pic: "\u{1F305}" },
    { beat: 0, at: "midday", title: "Midday", sub: "the Sun is at its highest", pic: "☀️" },
    { beat: 0, at: "west", title: "Sunset", sub: "the Sun sets in the west", pic: "\u{1F307}" },
    { beat: 1, at: "shadows", title: "Long, short, long", sub: "the shadow changes all day", pic: sasRecapBars },
    { beat: 2, at: "measure", title: "Hand spans", sub: "measure it, then record it", pic: sasRecapMeasure },
    { beat: 3, at: "earth", title: "The Earth turns", sub: "the Sun only seems to move", pic: "\u{1F30D}" }
  ], { goBeat: 3, goAt: "earth" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "East in the morning, west in the evening",
      "What the stick's shadow does all day",
      "And what is really turning"
    ] }),
    sunrise: sasSunriseChapter, midday: sasMiddayChapter, sunset: sasSunsetChapter,
    measure: sasMeasureChapter, record: sasRecordChapter, earth: sasEarthChapter,
    recap: SAS_RECAP
  };
