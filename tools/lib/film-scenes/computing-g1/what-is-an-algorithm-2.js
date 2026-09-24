  /* ==== Grade 1 Computing, Lesson 1, part 2 ==================================
     The chapters "Algorithms all around" and "Following an algorithm". Part 1
     of this film holds the header. */

  /* ==== chapter: algorithms all around ==========================================
     Four of the lesson's own everyday algorithms, side by side: getting
     dressed and brushing teeth are the kit's own scenes, built in the order
     the line says them; the recipe and the dance are the lesson's own
     pictures. Each card's frame arrives first and is filled as its algorithm
     is named, so the child sees four empty places and watches them fill. */
  var WA_E = { w: 269, gap: 20, left: 16, top: 58, h: 300, art: 78, artH: 190 };
  function waECx(k) { return WA_E.left + k * (WA_E.w + WA_E.gap) + WA_E.w / 2; }

  function waEverydayChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRobots = c(0, "robots"), cDay = c(0, "day");
    var cDressed = c(1, "dressed"), cSocks = c(1, "socks"), cShoes = c(1, "shoes"), cCoat = c(1, "coat");
    var cTeeth = c(2, "teeth"), cPaste = c(2, "paste"), cBrush = c(2, "brush"), cRinse = c(2, "rinse");
    var cRecipe = c(3, "recipe"), cDance = c(3, "dance");
    var cHard = c(4, "hard"), cThree = c(4, "three");
    var out = "";

    var reached = function (at) { return at != null && t >= at ? 1 : 0; };
    var grown = function (cues, ids) {
      var n = 0;
      for (var k = 0; k < cues.length; k++) n += reached(cues[k]);
      return ids.slice(0, n);
    };

    var frameAt = [cRobots, cRobots == null ? null : cRobots + 0.2, cRobots == null ? null : cRobots + 0.4,
      cRobots == null ? null : cRobots + 0.6];
    var litBy = [waOnly(t, scene, 1), waOnly(t, scene, 2), waOnly(t, scene, 3), waOnly(t, scene, 3)];
    var titles = ["getting dressed", "brushing your teeth", "a recipe", "a dance"];

    for (var k = 0; k < 4; k++) {
      var fo = on(t, frameAt[k], 0.4);
      if (!(fo > 0)) continue;
      var cx = waECx(k), lit = litBy[k];
      var card = waCard(cx - WA_E.w / 2, WA_E.top, WA_E.w, WA_E.h, lit);
      var body = "";
      if (k === 0) {
        var dressIds = grown([cSocks, cShoes, cCoat], ["socks", "shoes", "coat"]);
        if (reached(cDressed)) body += waScene("dress", dressIds, cx, WA_E.art, WA_E.artH);
      } else if (k === 1) {
        var teethIds = grown([cPaste, cBrush, cRinse], ["paste", "brush", "rinse"]);
        if (reached(cTeeth)) body += waScene("teeth", teethIds, cx, WA_E.art, WA_E.artH);
      } else if (k === 2) {
        body += MK.pop(Em(cx, WA_E.art + 96, 130, "\u{1F373}"), cx, WA_E.art + 96, popIn(t, cRecipe, 0.4));
      } else {
        body += MK.pop(Em(cx, WA_E.art + 88, 128, "\u{1F483}"), cx, WA_E.art + 88, popIn(t, cDance, 0.4));
        for (var m = 0; m < 4; m++) {
          body += waBead(cx - 78 + m * 52, 332, 19, m + 1,
            popIn(t, cDance == null ? null : cDance + 0.3 + m * 0.18, 0.3), P.gold);
        }
      }
      var named = k === 0 ? cDressed : k === 1 ? cTeeth : k === 2 ? cRecipe : cDance;
      var tOpen = on(t, named, 0.4);
      body += MK.qmark(cx, 168, 30, popIn(t, cDay == null ? null : cDay + k * 0.12, 0.35) * (1 - tOpen));
      out += G(card + body, { opacity: fo }) +
        Tx(cx, k === 3 ? 300 : 306, titles[k], "lab mid", "middle", { opacity: tOpen, fill: lit > 0.5 ? P.ink : P.muted });
    }

    /* it does not have to be hard: three steps is enough */
    out += MK.qmark(584, 400, 28, popIn(t, cHard, 0.4) * (1 - on(t, cThree, 0.35)));
    for (var b = 0; b < 3; b++) {
      out += waBead(500 + b * 84, 400, 26, b + 1, popIn(t, cThree == null ? null : cThree + b * 0.2, 0.35), P.gold);
    }
    out += MK.tick(756, 400, 24, popIn(t, cThree == null ? null : cThree + 0.7, 0.35));
    return svg(out);
  }

  /* ==== chapter: following an algorithm ==========================================
     Two pictures, one after the other. First the shape of it: step one, step
     two, step three, a red line skipping the middle one and a cross on it,
     and then the three in order with ticks. Then the lesson's own handwash
     activity: its five steps listed on the left, the kit's scene on the right
     built one step at a time as each is said, exactly as the child will do
     it. */
  var WA_F_ROWS = [118, 228, 338];

  function waFollowShape(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOne = c(0, "one"), cTwo = c(0, "two"), cThree = c(0, "three");
    var cSkip = c(1, "skip"), cJump = c(1, "jump");
    var cues = [cOne, cTwo, cThree], words = ["step one", "step two", "step three"], out = "";

    for (var k = 0; k < 3; k++) {
      var p = popIn(t, cues[k], 0.38);
      if (p > 0) {
        var y = WA_F_ROWS[k];
        out += G(R(404, y - 38, 360, 76, 38, P.cell, P.line, 2) + waBead(444, y, 26, k + 1, 1) +
          Tx(496, y + 11, words[k], "lab big", "start"),
          { transform: around(584, y, Math.min(p, 1.1)), opacity: Math.min(1, p) });
      }
      if (k < 2) out += MK.arrow(584, WA_F_ROWS[k] + 42, 584, WA_F_ROWS[k] + 70, on(t, cues[k + 1], 0.35), P.muted, 6);
    }

    /* never skip: a line that leaves out step two, and a cross on it */
    var skip = on(t, cSkip, 0.8) * (1 - on(t, cJump, 0.4));
    if (skip > 0) {
      var len = 300;
      out += Pth("M404,118 C292,152 292,304 404,338", null, P.bad, 7,
        { opacity: skip, "stroke-dasharray": n2(len), "stroke-dashoffset": n2(len * (1 - skip)) });
      out += MK.cross(584, 228, 32, popIn(t, cSkip == null ? null : cSkip + 0.45, 0.35) * (1 - on(t, cJump, 0.4)));
    }
    /* in order instead: each step ticked, top to bottom */
    for (var j = 0; j < 3; j++) {
      out += MK.tick(806, WA_F_ROWS[j], 24, popIn(t, cJump == null ? null : cJump + 0.12 + j * 0.24, 0.32));
    }
    return out;
  }

  var WA_H = { panelX: 40, panelY: 40, panelW: 440, panelH: 364, rows: [100, 162, 224, 286, 348] };

  function waFollowWash(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFive = c(2, "five"), cTap = c(2, "tap");
    var cSoap = c(3, "soap"), cRub = c(3, "rub"), cRinse = c(3, "rinse");
    var cDry = c(4, "dry"), cOrder = c(4, "order"), cClean = c(4, "clean");
    var cues = [cTap, cSoap, cRub, cRinse, cDry];
    var words = ["turn the tap on", "soap", "rub your hands", "rinse", "dry"];
    var ids = ["tap", "soap", "rub", "rinse", "dry"];
    var out = "";

    var panel = on(t, cFive, 0.5);
    out += R(WA_H.panelX, WA_H.panelY, WA_H.panelW, WA_H.panelH, 22, P.card, P.line, 2, { opacity: panel });
    for (var k = 0; k < 5; k++) {
      out += R(56, WA_H.rows[k] - 27, 408, 54, 27, P.cell, null, null,
        { opacity: 0.6 * on(t, cFive == null ? null : cFive + k * 0.07, 0.35) });
    }
    var rows = [];
    for (var r = 0; r < 5; r++) {
      rows.push({ text: words[r], at: cues[r], mark: "tick", markAt: cues[r] == null ? null : cues[r] + 0.55 });
    }
    out += MK.list(72, WA_H.rows[0], rows, t, { lh: 62, cls: "lab big", markR: 18 });
    out += MK.arrow(22, 76, 22, 372, on(t, cOrder, 0.75), P.gold, 7);

    /* the kit's own scene, one step at a time */
    var n = 0;
    for (var q = 0; q < 5; q++) if (cues[q] != null && t >= cues[q]) n++;
    out += G(waCard(601, 40, 478, 364, on(t, cTap, 0.4)) +
      (n > 0 ? waScene("handwash", ids.slice(0, n), 840, 50, 344) : ""), { opacity: panel });
    out += MK.tick(1048, 78, 26, popIn(t, cClean, 0.4));
    out += MK.glow(840, 222, 190, P.good, on(t, cClean, 0.6) * 0.8);
    return out;
  }

  function waFollowChapter(scene, beat, t, i) {
    var ph = into(t, scene.first + 2);
    var out = "";
    if (ph < 1) out += G(waFollowShape(scene, t), { opacity: 1 - ph });
    if (ph > 0) out += G(waFollowWash(scene, t), { opacity: ph });
    return svg(out);
  }
