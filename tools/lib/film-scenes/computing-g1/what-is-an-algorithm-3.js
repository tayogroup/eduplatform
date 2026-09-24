  /* ==== Grade 1 Computing, Lesson 1, part 3 ==================================
     The chapters "Making an algorithm", "Computers follow them too" and "The
     same steps, every time", then the recap and KINDS. Part 1 of this film
     holds the header. */

  /* ==== chapter: making an algorithm =============================================
     The lesson's two ordering activities, side by side: the brick tower and
     the seed. Each is built in the right order and then, on the lesson's own
     misconception line, drawn again in the WRONG order - by passing the wrong
     list to the kit's own scene and nothing else. The flag on its own really
     does stand on the grass; the water really is poured on an empty garden. */
  var WA_O = {
    tower: { cardX: 76, cx: 296, w: 440 },
    plant: { cardX: 620, cx: 846, w: 452 },
    top: 30, h: 336, artTop: 42, artH: 300
  };
  /* plant drawing coordinates -> film coordinates */
  var WA_PS = waSceneW("plant", WA_O.artH) / 320;
  function waPY(v) { return WA_O.artTop + v * WA_PS; }
  /* tower drawing coordinates -> film coordinates */
  var WA_TW = waSceneW("tower", WA_O.artH), WA_TS = WA_TW / 320;
  function waTX(v) { return WA_O.tower.cx - WA_TW / 2 + v * WA_TS; }
  function waTY(v) { return WA_O.artTop + v * WA_TS; }

  function waOrderChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cWrite = c(0, "write"), cFirst = c(0, "first");
    var cTower = c(1, "tower"), cBig = c(1, "big"), cBottom = c(1, "bottom");
    var cMid = c(2, "middle"), cSmall = c(2, "small"), cFlag = c(2, "flag");
    var cStart = c(3, "start"), cNothing = c(3, "nothing"), cFloor = c(3, "floor");
    var cPot = c(4, "pot"), cSoil = c(4, "soil"), cSeed = c(4, "seed"), cWater = c(4, "water");
    var cWFirst = c(5, "wfirst"), cWhat = c(5, "what"), cNoSeed = c(5, "noseed");
    var out = "", reached = function (at) { return at != null && t >= at ? 1 : 0; };

    var onPlant = waFrom(t, scene, 4), onTower = 1 - onPlant;
    var intro = waOnly(t, scene, 0);          /* both cards are bright while neither is the subject */
    var frame = on(t, cWrite, 0.45);

    /* the tower, right way up and then flag first */
    var wrong = waFrom(t, scene, 3) * (1 - onPlant);
    var towerIds = [];
    if (wrong > 0.5) {
      towerIds = reached(cStart) ? ["flag"] : ["big", "middle", "small", "flag"];
    } else if (reached(cTower)) {
      var n = reached(cBig) + reached(cMid) + reached(cSmall) + reached(cFlag);
      towerIds = ["big", "middle", "small", "flag"].slice(0, n);
    }
    var towerBody = reached(cTower) ? waScene("tower", towerIds, WA_O.tower.cx, WA_O.artTop, WA_O.artH) : "";
    /* at the bottom: the grass under the big brick lights up */
    var bo = bump(t, cBottom, 1.3);
    if (bo > 0) towerBody += R(waTX(0), waTY(222), WA_TW, waTY(260) - waTY(222), 0, P.gold, null, null, { opacity: 0.34 * bo }) +
      MK.arrow(waTX(160), waTY(116), waTX(160), waTY(176), on(t, cBottom, 0.6), P.gold, 7);
    /* nothing under it: the space the bricks should fill, empty */
    var no = on(t, cNothing, 0.5) * wrong;
    if (no > 0) towerBody += R(waTX(85), waTY(114), 150 * WA_TS, 108 * WA_TS, 8, "none", P.bad, 4,
      { opacity: no, "stroke-dasharray": "12 9" });
    /* on the floor */
    var fl = on(t, cFloor, 0.5) * wrong;
    if (fl > 0) towerBody += R(waTX(0), waTY(222), WA_TW, waTY(260) - waTY(222), 0, P.bad, null, null, { opacity: 0.4 * fl });
    out += G(waCard(WA_O.tower.cardX, WA_O.top, WA_O.tower.w, WA_O.h, onTower) + towerBody +
      Tx(WA_O.tower.cx, 390, "a tower", "lab mid", "middle", { fill: P.muted }),
      { opacity: frame * (0.35 + 0.65 * onTower) });
    out += MK.cross(WA_O.tower.cx, waTY(196), 34, popIn(t, cFloor == null ? null : cFloor + 0.3, 0.4) * wrong);

    /* the seed, right way round and then water first */
    var plantWrong = waFrom(t, scene, 5);
    var plantIds = [];
    if (plantWrong > 0.5) plantIds = ["water"];
    else {
      var m = reached(cPot) + reached(cSoil) + reached(cSeed) + reached(cWater);
      plantIds = ["pot", "soil", "seed", "water"].slice(0, m);
    }
    var plantBody = reached(cPot) || plantWrong > 0.5 ? waScene("plant", plantIds, WA_O.plant.cx, WA_O.artTop, WA_O.artH) : "";
    out += G(waCard(WA_O.plant.cardX, WA_O.top, WA_O.plant.w, WA_O.h, onPlant) + plantBody +
      Tx(WA_O.plant.cx, 390, "a seed", "lab mid", "middle", { fill: P.muted }),
      { opacity: frame * (0.35 + 0.65 * Math.max(onPlant, intro)) });
    var pot = waPY(170);
    out += MK.qmark(WA_O.plant.cx, pot, 30, popIn(t, cWhat, 0.4) * (1 - on(t, cNoSeed, 0.35)));
    var ns = popIn(t, cNoSeed, 0.4);
    out += waSeedMark(WA_O.plant.cx, pot, 22, Math.min(ns, 1)) + MK.cross(WA_O.plant.cx, pot, 32, ns);

    /* what has to happen first */
    out += MK.pill(584, 416, "what has to happen first?", on(t, cFirst, 0.45) * waOnly(t, scene, 0),
      { size: 24, col: P.gold, ink: P.gold });
    return svg(out);
  }

  /* ==== chapter: computers follow them too =======================================
     The lesson's own four: a cook, a builder, a nurse and a computer. The
     three people first, each with what they follow; then the writing hand,
     because somebody always writes the steps, and the steps as code beside
     the kit's own laptop, whose screen shows what the program printed. */
  var WA_C = { cx: [292, 584, 876], w: 250, lapX: 690, lapY: 80, lapW: 376, lapH: 280 };
  function waLX(v) { return WA_C.lapX + v * WA_C.lapW / 360; }
  function waLY(v) { return WA_C.lapY + v * WA_C.lapW / 360; }

  function waPeople(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPeople = c(0, "people"), cCook = c(0, "cook"), cBuilder = c(1, "builder"), cNurse = c(1, "nurse");
    var cues = [cCook, cBuilder, cNurse];
    var pics = ["\u{1F469}‍\u{1F373}", "\u{1F477}", "\u{1F469}‍⚕️"];
    var names = ["a cook", "a builder", "a nurse"], follows = ["a recipe", "a plan", "the steps"];
    var out = "";
    for (var k = 0; k < 3; k++) {
      var fo = on(t, cPeople == null ? null : cPeople + k * 0.16, 0.4);
      if (!(fo > 0)) continue;
      var cx = WA_C.cx[k], p = popIn(t, cues[k], 0.4);
      out += G(waCard(cx - WA_C.w / 2, 60, WA_C.w, 320, p > 0.4 ? 1 : 0), { opacity: fo });
      out += MK.pop(Em(cx, 168, 118, pics[k]), cx, 168, p);
      out += Tx(cx, 286, names[k], "lab big", "middle", { opacity: Math.min(1, p) });
      out += Tx(cx, 330, follows[k], "lab mid muted", "middle", { opacity: on(t, cues[k] == null ? null : cues[k] + 0.5, 0.4) });
    }
    return out;
  }

  function waMachine(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cComputer = c(2, "computer"), cSome = c(2, "somebody");
    var cCode = c(3, "code"), cProgram = c(3, "program");
    var out = "";

    /* the three, small, still there: a computer follows them TOO */
    var small = ["\u{1F469}‍\u{1F373}", "\u{1F477}", "\u{1F469}‍⚕️"];
    for (var s = 0; s < 3; s++) out += Em(120 + s * 70, 408, 48, small[s], { opacity: 0.5 });

    /* somebody writes the steps */
    var gone = 1 - on(t, cCode, 0.4);
    var hand = popIn(t, cSome, 0.45) * gone;
    out += MK.pop(Em(250, 200, 100, "\u{270D}️"), 250, 200, hand);
    out += MK.arrow(330, 196, 656, 190, on(t, cSome == null ? null : cSome + 0.35, 0.7) * gone, P.gold, 7);

    /* the steps, written in code */
    var codeIn = on(t, cCode, 0.5);
    if (codeIn > 0) {
      var card = R(60, 70, 420, 250, 18, "#0B1D2C", on(t, cProgram, 0.5) > 0.5 ? P.gold : P.line, 3);
      var bars = [[120, 80], [96, 130], [150, 0], [86, 104]];
      for (var k = 0; k < 4; k++) {
        var y = 118 + k * 48, ro = on(t, cCode == null ? null : cCode + 0.15 + k * 0.16, 0.32);
        if (!(ro > 0)) continue;
        card += C(92, y, 7, P.muted, null, null, { opacity: ro });
        card += R(116, y - 9, bars[k][0], 18, 9, P.teal, null, null, { opacity: ro });
        if (bars[k][1]) card += R(116 + bars[k][0] + 12, y - 9, bars[k][1], 18, 9, P.gold, null, null, { opacity: ro });
      }
      out += G(card, { opacity: codeIn });
      out += MK.arrow(498, 190, 660, 178, on(t, cCode == null ? null : cCode + 0.5, 0.7), P.gold, 7);
    }

    /* the kit's own laptop; its screen already shows what the program printed */
    var lap = on(t, cComputer, 0.5);
    out += G(ART.place(ART.figure("laptop"), WA_C.lapX, WA_C.lapY, WA_C.lapW, WA_C.lapH), { opacity: lap });
    out += R(waLX(54), waLY(14), 252 * WA_C.lapW / 360, 162 * WA_C.lapW / 360, 14, "none", P.gold, 4,
      { opacity: on(t, cProgram, 0.5) * (0.6 + 0.4 * breathe(t)) });
    out += MK.pill(878, 400, "program", on(t, cProgram, 0.45), { size: 28, col: P.gold, ink: P.gold });
    return out;
  }

  function waComputersChapter(scene, beat, t, i) {
    var ph = into(t, scene.first + 2), out = "";
    if (ph < 1) out += G(waPeople(scene, t), { opacity: 1 - ph });
    if (ph > 0) out += G(waMachine(scene, t), { opacity: ph });
    return svg(out);
  }

  /* ==== chapter: the same steps, every time ======================================
     The same three steps of the lesson's teeth algorithm, run twice - Monday
     and Friday - and coming out the same both times. Then the algorithm
     written down, and two people picking it up. */
  var WA_S = { left: 294, right: 874, cardY: 34, cardH: 330, artTop: 46, artH: 270 };

  function waSameChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSame = c(0, "same"), cEvery = c(0, "every");
    var cMon = c(1, "monday"), cFri = c(1, "friday");
    var cBoth = c(2, "both"), cDown = c(2, "down");
    var cAny = c(3, "anybody"), cRes = c(3, "result");
    var out = "", ids = ["paste", "brush", "rinse"];

    var frame = on(t, cSame, 0.45);
    var days = [{ cx: WA_S.left, cardX: 84, at: cMon, name: "Monday" }, { cx: WA_S.right, cardX: 664, at: cFri, name: "Friday" }];
    for (var k = 0; k < 2; k++) {
      var d = days[k], n = tally(t, d.at, 3, 0.9);
      out += G(waCard(d.cardX, WA_S.cardY, 420, WA_S.cardH, on(t, d.at, 0.4)) +
        (n > 0 ? waScene("teeth", ids.slice(0, n), d.cx, WA_S.artTop, WA_S.artH) : "") +
        Tx(d.cx, 348, d.name, "lab big", "middle", { opacity: on(t, d.at, 0.4) }), { opacity: frame });
      out += MK.tick(d.cardX + 388, 72, 24, popIn(t, cBoth == null ? null : cBoth + k * 0.25, 0.35));
      out += MK.glow(d.cx, 180, 180, P.good, on(t, cRes, 0.6) * 0.7);
    }
    out += MK.pop(Em(584, 96, 58, "\u{1F501}"), 584, 96, popIn(t, cEvery, 0.4));
    out += Tx(584, 222, "=", "lab huge", "middle", { opacity: frame, "font-size": 72, fill: P.muted });
    out += MK.tick(584, 302, 32, popIn(t, cRes, 0.4));

    /* written down, so anybody can pick it up */
    var down = on(t, cDown, 0.45);
    if (down > 0) {
      out += G(R(404, 374, 360, 48, 12, P.paper) + Em(436, 398, 28, "\u{1F4DD}") +
        Tx(596, 406, "paste · brush · rinse", "lab mid dark", "middle"), { opacity: down });
    }
    var any = popIn(t, cAny, 0.4);
    out += MK.pop(Em(294, 400, 46, "\u{1F9D2}"), 294, 400, any);
    out += MK.pop(Em(874, 400, 46, "\u{1F9D1}"), 874, 400, any);
    out += MK.arrow(396, 398, 346, 398, on(t, cAny == null ? null : cAny + 0.25, 0.5), P.gold, 6);
    out += MK.arrow(772, 398, 822, 398, on(t, cAny == null ? null : cAny + 0.25, 0.5), P.gold, 6);
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------- */
  var WA_RECAP = MK.recapKind([
    { beat: 0, at: "algo", title: "Algorithm", sub: "steps to do a job", pic: "\u{1F4DD}" },
    { beat: 1, at: "follow", title: "Follow", sub: "one step at a time", pic: "\u{1F449}" },
    { beat: 1, at: "order", title: "Order", sub: "it has to work", pic: "\u{1F522}" },
    { beat: 2, at: "code", title: "Program", sub: "an algorithm in code", pic: "\u{1F5A5}️" }
  ], { goBeat: 2, goAt: "code" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What an algorithm is", "How to follow one, in order", "How a computer follows one too"] }),
    robo: waRoboChapter, everyday: waEverydayChapter, follow: waFollowChapter,
    order: waOrderChapter, computers: waComputersChapter, same: waSameChapter,
    recap: WA_RECAP
  };
