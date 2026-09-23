  /* ==== chapters: shining back, and darkness ===================================
     tools/lib/film-scenes/science-g2/light-and-dark-2.js. */

  /* ---- shining back ------------------------------------------------------------
     The three things the lesson's lecture says shine light back -- the Moon, a
     mirror and white paper -- in a column between the Sun and an eye, so the
     child sees the light arrive and leave again. The mirror is the lesson kit's
     own drawing (ART.ICONS.mirror). Then the dark cupboard test the lesson's
     explain() gives, and the two bins of its "Source, or not?" step. */
  var LD_BACK = [
    { pic: "\u{1F319}", label: "the Moon", y: 78 },
    { pic: "\u{1FA9E}", label: "a mirror", y: 214 },
    { pic: "\u{1F4C4}", label: "white paper", y: 350 }
  ];
  var LD_BX = 470;                              /* the column */
  var LD_STARS = [[64, 64], [252, 44], [330, 152], [700, 112], [840, 68], [1096, 52],
    [1042, 336], [76, 340], [214, 404], [880, 398], [636, 396], [1112, 200]];

  function ldBackScene(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cMoon = c(0, "moon"), cBright = c(0, "bright"), cAsk = c(0, "ask");
    var cNo = c(1, "no"), cOwn = c(1, "own"), cBack = c(1, "back"), cSunL = c(1, "sun");
    var cMir = c(2, "mirror"), cPap = c(2, "paper"), cBack2 = c(2, "back");
    var cCup = c(3, "cupboard"), cDark = c(3, "dark"), cNot = c(3, "not");
    var shut = on(t, cCup, 0.7), murk = on(t, cDark, 0.6), out = "";
    var lit = 1 - shut;

    /* night: a few fixed stars, never scattered at random */
    LD_STARS.forEach(function (s, k) {
      out += C(s[0], s[1], k % 3 === 0 ? 3 : 2, "#FFFFFF", null, null, { opacity: 0.55 * lit });
    });

    /* the Sun, once we say whose light it is */
    var sunO = popIn(t, cBack, 0.5) * lit;
    out += ldSun(140, 218, 48, sunO, t);

    /* the dark cupboard, behind them, so what is shut in still shows */
    if (shut > 0) {
      out += R(398, 26, 144, 400, 10, "#1A1209", null, null, { opacity: shut });
    }

    /* the three, each lit by the Sun and sending it on to the eye */
    var appear = [popIn(t, cMoon, 0.45), popIn(t, cMir, 0.45), popIn(t, cPap, 0.45)];
    var inU = [on(t, cBack, 0.9), on(t, cBack2, 0.5), on(t, cBack2 == null ? null : cBack2 + 0.12, 0.5)];
    var outU = [on(t, cSunL, 0.8), on(t, cBack2 == null ? null : cBack2 + 0.22, 0.5), on(t, cBack2 == null ? null : cBack2 + 0.34, 0.5)];
    var inFrom = [[192, 200], [192, 218], [192, 236]];
    var toEye = [[920, 206], [916, 218], [920, 231]];   /* on the eye, not past it */
    LD_BACK.forEach(function (s, k) {
      out += ldBeam(inFrom[k][0], inFrom[k][1], 426, s.y, inU[k] * lit, P.gold, 6);
      out += ldBeam(514, s.y, toEye[k][0], toEye[k][1], outU[k] * lit, P.gold, 6);
      out += MK.pop(MK.pic(LD_BX, s.y, 100, s.pic), LD_BX, s.y, appear[k]);
      out += Tx(LD_BX, s.y + 66, s.label, "lab mid muted", "middle", { opacity: Math.min(1, appear[k]) });
    });
    /* the Moon's own glow, until we say it makes none of its own */
    out += MK.glow(LD_BX, LD_BACK[0].y, 74, "#DCE8F5",
      on(t, cBright, 0.6) * (1 - on(t, cOwn, 0.5)) * (0.7 + 0.3 * breathe(t)));

    /* the eye the light reaches */
    out += ldEye(980, 218, 150, on(t, cSunL, 0.5) * lit);

    /* "Is it a light source?", then the answer */
    var ask = on(t, cAsk, 0.4) * (1 - on(t, cNo, 0.4));
    out += MK.qmark(700, 58, 32, ask * lit);
    out += MK.cross(700, 58, 32, popIn(t, cNo, 0.4) * lit);

    /* shut in, they go dark: the light in the cupboard goes, not the things */
    if (shut > 0) {
      out += R(398, 26, 144, 400, 10, "#000000", null, null, { opacity: 0.8 * murk });
      out += G(R(392, 24, 156, 404, 14, "none", "#6B4A2B", 12) +
        R(398, 26, 144, 24, 6, "#6B4A2B") +
        C(532, 150, 8, "#C9A26B") + C(532, 300, 8, "#C9A26B"), { opacity: shut });
    }
    out += MK.cross(800, 146, 38, popIn(t, cNot, 0.4));
    out += MK.pill(800, 268, "not sources", on(t, cNot, 0.45), { size: 30, col: P.bad, ink: P.ink });
    return out;
  }

  /* "Now sort them into two groups: makes light, or only shines it back." --
     the lesson's own two bins, with its own labels and pictures. */
  var LD_YES = ["☀️", "\u{1F56F}️", "\u{1F526}"];
  var LD_NO = ["\u{1F319}", "\u{1FA9E}", "\u{1F4C4}"];

  /* The two empty bins are drawn from the first frame of the beat, not from
     the word "sort": the chapter's crossfade has the cupboard gone by then, and
     waiting for the cue left most of a second with nothing on the screen at
     all. The labels and the things still arrive as they are said. */
  function ldBins(t, scene) {
    var cSort = sc(scene, 4, "sort"), cMakes = sc(scene, 4, "makes"), cBack = sc(scene, 4, "back");
    var s = on(t, cSort, 0.5), out = "";
    out += R(70, 56, 490, 350, 22, P.cell, P.line, 2);
    out += R(608, 56, 490, 350, 22, P.cell, P.line, 2);
    out += G(MK.pic(142, 122, 68, "\u{1F4A1}") + Tx(196, 134, "Makes light", "lab big", "start"), { opacity: s });
    out += G(MK.pic(680, 122, 68, "\u{1FA9E}") + Tx(734, 134, "Only shines it back", "lab big", "start"), { opacity: s });
    for (var k = 0; k < 3; k++) {
      var x = 180 + k * 135;
      out += MK.pop(MK.pic(x, 282, 110, LD_YES[k]), x, 282, popIn(t, cMakes == null ? null : cMakes + k * 0.16, 0.34));
      out += MK.pop(MK.pic(x + 538, 282, 110, LD_NO[k]), x + 538, 282, popIn(t, cBack == null ? null : cBack + k * 0.16, 0.34));
    }
    return out;
  }

  function ldBackChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k <= 3) return svg(ldBackScene(t, scene));
    var u = into(t, i);
    return svg((u < 1 ? G(ldBackScene(t, scene), { opacity: 1 - u }) : "") + G(ldBins(t, scene), { opacity: u }));
  }

  /* ---- darkness -----------------------------------------------------------------
     The lesson's own room (ART.sim "darkRoom"), in the states the child clicks
     it through: daylight and the lamp on, the curtains closed, the lamp off and
     the room completely dark, and the lamp on again. The prediction the lesson
     asks for waits beside it and is ticked when the room answers it. */
  var LD_ROOM = { x: 180, y: 40, w: 560, h: 350 };
  function ldRX(v) { return LD_ROOM.x + v * LD_ROOM.w / 320; }
  function ldRY(v) { return LD_ROOM.y + v * LD_ROOM.h / 200; }
  function ldRoom(curtains, lamp, x, y, w, h) {
    return ART.place(ART.sim("darkRoom", "draw", curtains, lamp), x, y, w, h);
  }

  function ldDarkRoom(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRoom = c(0, "room"), cDay = c(0, "daylight"), cLamp = c(0, "lamp");
    var cPred = c(1, "predict"), cShut = c(1, "shut"), cOffP = c(1, "off"), cSee = c(1, "see");
    var cClose = c(2, "close"), cStill = c(2, "still");
    var cOff = c(3, "off"), cDark3 = c(3, "dark");
    var cNothing = c(4, "nothing"), cNoLight = c(4, "nolight");
    var cMatch = c(5, "match"), cOn = c(5, "on"), cAgain = c(5, "again");

    var curtains = cClose != null && t >= cClose;
    var lampOff = cOff != null && t >= cOff, lampBack = cOn != null && t >= cOn;
    var lamp = !lampOff || lampBack;
    var out = "";
    out += R(LD_ROOM.x - 10, LD_ROOM.y - 10, LD_ROOM.w + 20, LD_ROOM.h + 20, 18, P.card, P.line, 2);
    out += ldRoom(curtains, lamp, LD_ROOM.x, LD_ROOM.y, LD_ROOM.w, LD_ROOM.h);
    /* "Here is a room": the card itself, as it is named */
    out += R(LD_ROOM.x - 10, LD_ROOM.y - 10, LD_ROOM.w + 20, LD_ROOM.h + 20, 18, "none", P.teal, 5,
      { opacity: bump(t, cRoom, 1.2) });

    /* "Daylight comes in": the window. "the lamp is on": the lamp. */
    var winO = on(t, cDay, 0.45) * (1 - on(t, cLamp == null ? null : cLamp + 0.05, 0.35));
    out += R(ldRX(20), ldRY(20), ldRX(120) - ldRX(20), ldRY(110) - ldRY(20), 10, "none", P.accent, 6,
      { opacity: Math.max(winO, bump(t, cClose, 1.3), bump(t, cShut, 1.1)) });
    var lampO = Math.max(on(t, cLamp, 0.45) * (1 - on(t, cPred, 0.5)), on(t, cStill, 0.45) * (1 - on(t, cOff, 0.5)));
    out += R(ldRX(232), ldRY(18), ldRX(308) - ldRX(232), ldRY(164) - ldRY(18), 12, "none", P.accent, 6,
      { opacity: Math.max(lampO, bump(t, cOffP, 1.1)) });

    /* the prediction, waiting beside the room, and ticked when it is answered */
    var predO = on(t, cPred, 0.45), tickP = popIn(t, cMatch, 0.4);
    out += MK.qmark(955, 100, 34 + 6 * bump(t, cSee, 0.8), predO * (1 - Math.min(1, tickP)));
    out += MK.tick(955, 100, 34, tickP);
    out += MK.pill(955, 190, "completely dark?", on(t, cSee, 0.45), { size: 24, col: P.gold });
    /* "It is completely dark": the prediction the room has just answered */
    out += E(955, 190, 146, 32, "none", P.gold, 4, { opacity: bump(t, cDark3, 1.2) });

    /* "You cannot see anything": an eye, crossed, until the lamp comes back on */
    var seeO = on(t, cNothing, 0.5), back = on(t, cOn, 0.5);
    out += MK.glow(955, 310, 108, P.gold, on(t, cAgain, 0.5) * (0.6 + 0.4 * breathe(t)));
    out += ldEye(955, 310, 182, seeO);
    out += MK.cross(955, 310, 46, popIn(t, cNothing == null ? null : cNothing + 0.3, 0.4) * (1 - back));
    out += MK.pill(955, 404, "no light to see by", on(t, cNoLight, 0.45) * (1 - back), { size: 22, col: P.line, ink: P.muted });
    return out;
  }

  /* "Darkness is what is left when there is no light." -- the same room with
     the light, and without it, side by side. */
  function ldDarkPair(t, scene) {
    var cDarkness = sc(scene, 6, "darkness"), cLeft = sc(scene, 6, "left"), cNoLight = sc(scene, 6, "nolight");
    var a = on(t, cDarkness, 0.5), b = on(t, cLeft, 0.6), out = "";
    out += G(R(110, 86, 420, 270, 16, P.card, P.line, 2) + ldRoom(true, true, 120, 96, 400, 250) +
      Tx(320, 394, "the light", "lab big", "middle"), { opacity: a });
    out += MK.arrow(548, 221, 622, 221, b, P.gold, 9);
    out += G(R(638, 86, 420, 270, 16, P.card, P.line, 2) + ldRoom(true, false, 648, 96, 400, 250), { opacity: b });
    out += Tx(848, 394, "darkness", "lab big gold", "middle", { opacity: on(t, cNoLight, 0.5) });
    return out;
  }

  function ldDarkChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k <= 5) return svg(ldDarkRoom(t, scene));
    var u = into(t, i);
    return svg((u < 1 ? G(ldDarkRoom(t, scene), { opacity: 1 - u }) : "") + G(ldDarkPair(t, scene), { opacity: u }));
  }
