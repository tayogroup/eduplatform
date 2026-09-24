  /* ==== Bee-Bot Journeys, part 3 ==============================================
     Round the wall, predicting before GO, robots at work, and the two cards.
     Every route here is run through bbRun, so the wall, the edge and each turn
     are the lesson kit's own (ART.robo). */

  /* ==== chapter: round the wall ===============================================
     The lesson's Journey 4: start at column 3 row 5 facing up, a wall in the
     square two ahead, the school beyond it. F L F R F F R F - which is the
     lesson's own solution, so the film cannot narrate a route the lesson would
     fail. */
  var BB_W_LV = { start: [2, 4], facing: "up", prog: ["F", "L", "F", "R", "F", "F", "R", "F"],
    walls: [[2, 2]], cols: 5, rows: 5 };
  var BB_W_RUN = bbRun(BB_W_LV);
  var BB_W_PATH = bbPath(BB_W_RUN);
  var BB_W_PLACES = [
    { x: 52, pic: "\u{1F3EA}", word: "shop" },
    { x: 268, pic: "\u{1F3E0}", word: "home" },
    { x: 484, pic: "\u{1F3EB}", word: "school" }
  ];

  function bbWallChapter(scene, beat, t, i) {
    var cDest = sc(scene, 0, "dest"), cShop = sc(scene, 0, "shop"),
      cHome = sc(scene, 0, "home"), cSchool = sc(scene, 0, "school");
    var cWall = sc(scene, 1, "wall"), cThrough = sc(scene, 1, "through");
    var cTurn2 = sc(scene, 2, "turn"), cRound = sc(scene, 2, "round");
    var cFl = sc(scene, 3, "fl"), cRff = sc(scene, 3, "rff");
    var cTurn4 = sc(scene, 4, "turn"), cFwd4 = sc(scene, 4, "forward"), cAt = sc(scene, 4, "school");
    var g = BB_G, out = "";

    /* how far the robot has driven: three commands on "Forward, turn left,
       forward", three more on "Turn right, forward, forward", then the last
       two, each waiting for its own words */
    var u = 0;
    if (bbPast(t, cFwd4)) u = clamp(7 + (t - cFwd4) / 0.5, 0, 8);
    else if (bbPast(t, cTurn4)) u = clamp(6 + (t - cTurn4) / 0.45, 0, 7);
    else if (bbPast(t, cRff)) u = clamp(3 + (t - cRff) / 0.5, 0, 6);
    else if (bbPast(t, cFl)) u = clamp((t - cFl) / 0.5, 0, 3);

    var occ = bbOccupied(BB_W_RUN, u, [2, 1]);
    out += bbGrid(g, 1, {});
    out += bbOnCell(g, 2, 1, "\u{1F3EB}", 1, occ ? -15 : 0, occ ? -15 : 0, occ ? 0.74 : 1);
    out += bbOnCell(g, 2, 2, "\u{1F9F1}", popIn(t, cWall, 0.45));

    /* "You cannot drive through it": straight on stops at the wall. The cross
       sits on the line BETWEEN the square before and the wall, never on the
       wall itself - a cross over the brick hides the thing being talked about. */
    var gone = 1 - on(t, cTurn2, 0.5);
    var thr = on(t, cThrough, 0.45) * gone;
    out += MK.arrow(bbX(g, 2), bbY(g, 4) - 26, bbX(g, 2), bbY(g, 3) - 26, thr, P.bad, 8);
    out += MK.cross(bbX(g, 2), (bbY(g, 3) + bbY(g, 2)) / 2, 23,
      popIn(t, cThrough == null ? null : cThrough + 0.4, 0.4) * gone);

    /* "Turn before you reach it": the square the turn happens on, then the
       whole way round drawn out */
    out += bbCellRing(g, 2, 3, on(t, cTurn2, 0.45) * (1 - on(t, cFl, 0.5)), P.gold);
    out += bbRoute(g, BB_W_PATH, on(t, cRound, 1.3), P.gold);
    out += bbRunRobot(g, BB_W_RUN, u, 1, occ ? 13 : 0, occ ? 13 : 0, occ ? 0.82 : 1);
    out += MK.tick(bbX(g, 3) + 6, bbY(g, 1) - 30, 24, popIn(t, cAt, 0.4) * (u >= 8 ? 1 : 0));

    /* the destinations, and then the presses that reach this one */
    var cards = 1 - into(t, scene.first + 3), chipsO = into(t, scene.first + 3);
    if (cards > 0) {
      var deck = MK.pill(366, 76, "a destination", on(t, cDest, 0.45), { size: 26, col: P.gold, ink: P.gold });
      var ats = [cShop, cHome, cSchool];
      BB_W_PLACES.forEach(function (pl, k) {
        var p = popIn(t, ats[k], 0.4), lit = k === 2 && bbPast(t, cSchool);
        deck += MK.pop(R(pl.x, 124, 196, 186, 24, P.card, lit ? P.gold : P.line, lit ? 4 : 2) +
          MK.pic(pl.x + 98, 196, 84, pl.pic) +
          Tx(pl.x + 98, 282, pl.word, "lab big", "middle", { fill: lit ? P.gold : P.ink }),
          pl.x + 98, 216, Math.min(1, p));
      });
      out += G(deck, { opacity: cards });
    }
    if (chipsO > 0) {
      /* the destination stays on screen while the presses that reach it arrive */
      var tray = R(212, 30, 288, 160, 24, P.card, P.gold, 4) +
        MK.pic(356, 92, 76, "\u{1F3EB}") + Tx(356, 166, "school", "lab big gold", "middle");
      tray += bbTray(52, 212, 608, 184, "Memory", 1);
      var chips = [], k2;
      for (k2 = 0; k2 < 8; k2++) {
        var at = k2 < 3 ? (cFl == null ? null : cFl + k2 * 0.42)
          : k2 < 6 ? (cRff == null ? null : cRff + (k2 - 3) * 0.42)
          : k2 === 6 ? cTurn4 : cFwd4;
        chips.push({ kind: BB_W_LV.prog[k2], o: popIn(t, at, 0.35), now: u > k2 && u <= k2 + 1, n: k2 + 1 });
      }
      tray += bbStrip(62, 222, 588, 78, chips.slice(0, 4), 4);
      tray += bbStrip(62, 308, 588, 78, chips.slice(4), 4);
      out += G(tray, { opacity: chipsO });
    }
    return svg(out);
  }

  /* ==== chapter: predict first ================================================
     The lesson's Program 1 in the Journey predictor: the robot starts facing
     DOWN, and the program is forward, forward, turn left, forward. The robot
     does not move until GO - the finger does, one square per forward, which is
     what the lesson tells the child to do. The turn is the trap the lesson
     names ("Children forget which way the robot faces after a turn"), and
     ART.robo.TURN_L is what answers it: facing down, a left turn faces right. */
  var BB_P_LV = { start: [0, 0], facing: "down", prog: ["F", "F", "L", "F"], cols: 5, rows: 5 };
  var BB_P_RUN = bbRun(BB_P_LV);
  var BB_P_CELLS = [[0, 0], [0, 1], [0, 2], [1, 2]];
  var BB_P_TRAY = { x: 56, y: 156, w: 604, h: 104 };
  var BB_P_GO = { x: 56, y: 306, w: 300, h: 72 };

  function bbPredictChapter(scene, beat, t, i) {
    var cBefore = sc(scene, 0, "before"), cHead = sc(scene, 0, "head");
    var cFinger = sc(scene, 1, "finger"), cOne = sc(scene, 1, "one"), cFwd = sc(scene, 1, "forward");
    var cDown = sc(scene, 2, "down"), cTwo = sc(scene, 2, "two");
    var cTurnL = sc(scene, 3, "turnleft"), cRight = sc(scene, 3, "right"), cMoved = sc(scene, 3, "moved");
    var cMore = sc(scene, 4, "more"), cShop = sc(scene, 4, "shop");
    var cGo = sc(scene, 5, "go"), cStops = sc(scene, 5, "stops");
    var g = BB_G, out = "";

    var u = bbProgress(t, cGo == null ? null : cGo + 0.25, BB_P_RUN, 0.55);

    var occ = bbOccupied(BB_P_RUN, u, [1, 2]);
    out += bbGrid(g, 1, {});
    out += bbOnCell(g, 1, 2, "\u{1F3EA}", 1, occ ? -15 : 0, occ ? -15 : 0, occ ? 0.74 : 1);

    /* where the finger has got to */
    var fu = 0;
    if (bbPast(t, cMore)) fu = 2 + clamp((t - cMore) / 0.5, 0, 1);
    else if (bbPast(t, cTwo)) fu = clamp((t - cTwo) / 0.55, 0, 2);
    var fk = clamp(Math.floor(fu), 0, BB_P_CELLS.length - 2), ff = ease(clamp(fu - fk, 0, 1));
    var fx = lerp(bbX(g, BB_P_CELLS[fk][0]), bbX(g, BB_P_CELLS[fk + 1][0]), ff);
    var fy = lerp(bbY(g, BB_P_CELLS[fk][1]), bbY(g, BB_P_CELLS[fk + 1][1]), ff);

    /* the squares the finger has counted, and the one it is asked to look at */
    out += bbCellRing(g, 0, 1, on(t, cOne, 0.4) * (1 - on(t, cTwo, 0.5)), P.gold);
    var counted = bbPast(t, cTwo) ? tally(t, cTwo, 2, 0.55) : 0;
    for (var k = 0; k < counted; k++) out += bbCount(g, 0, k + 1, String(k + 1), on(t, cTwo + k * 0.28, 0.3));
    out += bbCount(g, 1, 2, "3", on(t, cMore, 0.4));

    /* the robot: still on its square, facing down, until GO */
    var fl = bump(t, cDown, 0.9);
    /* "This robot faces down": the pointer flashes, and an arrow beside the mat
       says which way down is before the finger starts moving that way */
    out += MK.arrow(g.x - 18, bbY(g, 0) - 22, g.x - 18, bbY(g, 0) + 24,
      on(t, cDown, 0.4) * (1 - on(t, cTwo, 0.5)), P.gold, 7);
    out += bbRunRobot(g, BB_P_RUN, u, 1, occ ? 13 : 0, occ ? 13 : 0, occ ? 0.82 : 1);
    if (fl > 0) out += bbPointer(bbX(g, 0), bbY(g, 0), BB_P_RUN[0].ang, (g.cell / 56) * (1 + 0.4 * fl), fl * 0.9, P.gold);

    /* the finger, and the facing the child has to keep in their head */
    var fo = on(t, cFinger, 0.4) * (1 - on(t, cGo, 0.5));
    /* the tip sits low and right in the square, so the hand does not cover the
       robot on the square it starts from */
    out += MK.finger(fx + 15, fy + 15, fo);
    /* TOP LEFT of the square, and small. This mark IS the answer to the
       misconception the lesson names ("Children forget which way the robot
       faces after a turn"), so it has to be plainly readable - and the first
       cut put it at the top centre, where bbCount's numeral sits on top of it:
       the green triangle showed as a sliver beside the "2" on the very beat
       that says "It faces right now". The count disc is at (+19, -19) with a
       radius of 16 and the finger's hand fills below and right, so the top
       left corner is the one free part of the square. */
    var gh = on(t, cRight, 0.5) * (1 - on(t, cGo, 0.5));
    if (gh > 0) out += G(C(fx - 21, fy - 21, 15, P.good, null, null, { opacity: 0.22 }) +
      bbPointer(fx - 21, fy - 21, lerp(BB_P_RUN[2].ang, BB_P_RUN[3].ang, ease(clamp((t - cRight) / 0.7, 0, 1))),
        (g.cell / 56) * 0.62, 1, P.good), { opacity: gh });
    out += bbCellRing(g, 0, 2, on(t, cMoved, 0.4) * (1 - on(t, cMore, 0.5)), P.good);
    /* the tick sits OFF the mat, level with the shop's row: inside the mat it
       landed on the corner the "3" now counts, and a tick on a square the
       robot never drives to reads as a destination */
    out += MK.tick(1138, bbY(g, 2), 24, Math.min(1.08,
      popIn(t, cShop, 0.4) * (1 - on(t, cGo, 0.5)) + popIn(t, cStops, 0.4) * (u >= 4 ? 1 : 0)));

    /* the program, which the child may read and not change */
    out += bbTray(BB_P_TRAY.x, BB_P_TRAY.y, BB_P_TRAY.w, BB_P_TRAY.h, "The program", 1);
    var chipAt = [cFwd, cTwo, cTurnL, cMore], chips = [];
    BB_P_LV.prog.forEach(function (kind, k2) {
      var live = bbPast(t, cGo) ? (u > k2 && u <= k2 + 1)
        : bbPast(t, chipAt[k2]) && (k2 === 3 || !bbPast(t, chipAt[k2 + 1]));
      chips.push({ kind: kind, o: 1, now: live, n: k2 + 1 });
    });
    out += bbStrip(BB_P_TRAY.x + 10, BB_P_TRAY.y + 10, BB_P_TRAY.w - 20, BB_P_TRAY.h - 20, chips, 4);

    /* GO waits until the prediction is made */
    out += bbBigButton(BB_P_GO.x, BB_P_GO.y, BB_P_GO.w, BB_P_GO.h, "GO", { o: 1, lit: bbPast(t, cGo) });
    out += MK.ripple(BB_P_GO.x + BB_P_GO.h * 0.58, BB_P_GO.y + BB_P_GO.h / 2, t, cGo, P.good);
    out += MK.cross(BB_P_GO.x + BB_P_GO.w - 40, BB_P_GO.y + BB_P_GO.h / 2, 24,
      popIn(t, cBefore, 0.4) * (1 - on(t, cGo, 0.4)));

    /* "follow the program in your head" */
    /* no tail: MK.bubble points its tail downwards, and the robot this thought
       belongs to sits above and to the right of it */
    out += MK.bubble(336, 26, 368, 94, "Where will it stop?", Math.min(1, popIn(t, cHead, 0.45)) * (1 - on(t, cFinger, 0.5)));
    return svg(out);
  }

  /* ==== chapter: robots at work ===============================================
     The lesson's own four, in its own words. Each card carries a small mat with
     the route that robot drives, run through bbRun like every other route in
     this film - so the vacuum really does stop at its wall and turn. */
  var BB_K_CARDS = [
    { x: 44, pic: "\u{1F4E6}", word: "a warehouse robot", tag: "shelf 14",
      lv: { start: [0, 2], facing: "up", prog: ["F", "F", "R", "F"], cols: 3, rows: 3 } },
    { x: 330, pic: "\u{1F3E5}", word: "a hospital robot", tag: "the door",
      lv: { start: [2, 2], facing: "up", prog: ["F", "L", "F"], cols: 3, rows: 3 } },
    { x: 616, pic: "\u{1F916}", word: "a robot vacuum", tag: "bump!",
      lv: { start: [1, 2], facing: "up", prog: ["F", "F", "R", "F"], walls: [[1, 0]], cols: 3, rows: 3 } },
    { x: 902, pic: "\u{1F6F5}", word: "a delivery robot", tag: "number 14",
      lv: { start: [0, 2], facing: "up", prog: ["F", "R", "F", "F"], cols: 3, rows: 3 } }
  ];
  BB_K_CARDS.forEach(function (c) {
    c.run = bbRun(c.lv);
    c.path = bbPath(c.run);
    c.g = { x: c.x + 67, y: 184, cell: 42, cols: 3, rows: 3 };
  });
  var BB_K_CHIPS = ["F", "F", "R", "F"];

  function bbWorkChapter(scene, beat, t, i) {
    var cBig = sc(scene, 0, "big"), cSame = sc(scene, 0, "same");
    var cWare = sc(scene, 1, "warehouse"), cShelf = sc(scene, 1, "shelf");
    var cHosp = sc(scene, 2, "hospital"), cDoor = sc(scene, 2, "door");
    var cVac = sc(scene, 3, "vacuum"), cBumps = sc(scene, 3, "bumps"),
      cDel = sc(scene, 3, "delivery"), cNum = sc(scene, 3, "numbers");
    var ats = [cWare, cHosp, cVac, cDel], tags = [cShelf, cDoor, cBumps, cNum];
    var out = "";

    BB_K_CARDS.forEach(function (c, k) {
      var o = on(t, cBig + k * 0.16, 0.4), lit = bbPast(t, ats[k]);
      if (!(o > 0)) return;
      var body = R(c.x, 42, 260, 314, 24, P.card, lit ? P.gold : P.line, lit ? 4 : 2) +
        MK.pic(c.x + 130, 98, 72, c.pic) +
        Tx(c.x + 130, 158, c.word, "lab mid", "middle", { fill: lit ? P.ink : P.muted });
      body += bbGrid(c.g, lit ? 1 : 0.45, {});
      (c.lv.walls || []).forEach(function (w) { body += bbOnCell(c.g, w[0], w[1], "\u{1F9F1}", lit ? 1 : 0.45); });
      var u = lit ? clamp((t - ats[k]) / 0.42, 0, c.run.length - 1) : 0;
      body += bbRoute(c.g, c.path, lit ? on(t, ats[k], 0.9) : 0, P.gold);
      if (lit) body += bbRunRobot(c.g, c.run, u, 1);
      /* what that robot is driving to */
      var last = c.path[c.path.length - 1];
      body += MK.pill(c.x + 130, 334, c.tag, Math.min(1, popIn(t, tags[k], 0.4)), { size: 20, col: P.gold, ink: P.gold });
      if (k === 2) body += MK.cross(c.g.x + 1.5 * c.g.cell, c.g.y + 0.5 * c.g.cell, 16, popIn(t, cBumps, 0.4));
      else body += bbCellRing(c.g, last[0], last[1], lit ? on(t, tags[k], 0.4) : 0, P.good);
      out += G(body, { opacity: clamp(o, 0, 1) * (lit ? 1 : 0.7) });
    });

    /* the same kind of program as the child's own */
    var pro = on(t, cSame, 0.45), chips = BB_K_CHIPS.map(function (kind, k) {
      return { kind: kind, o: popIn(t, cSame + k * 0.16, 0.35) };
    });
    if (pro > 0) out += G(bbStrip(346, 380, 476, 52, chips, 4), { opacity: pro });
    return svg(out);
  }

  /* ==== the two cards =========================================================
     What the child now knows, one card per idea, each lit as it is said. */
  function bbRecapPad(cx, cy, size) {
    var s = size * 0.42, gap = size * 0.07, out = "";
    BB_KINDS.forEach(function (k, i) {
      var x = cx - s - gap / 2 + (i % 2) * (s + gap), y = cy - s - gap / 2 + Math.floor(i / 2) * (s + gap);
      out += R(x, y, s, s, s * 0.24, P.cell, P.line, 2) + G(bbIcon(k, s * 0.66, P.ink), { transform: tr(x + s / 2, y + s / 2) });
    });
    return out;
  }
  function bbRecapButtons(cx, cy, size) {
    return MK.pill(cx, cy - size * 0.28, "CLEAR", 1, { size: size * 0.24, col: P.bad, ink: P.bad }) +
      MK.pill(cx, cy + size * 0.28, "GO", 1, { size: size * 0.24, col: P.good, ink: P.good });
  }
  function bbRecapSquare(cx, cy, size) {
    var cell = size * 0.54, g = { x: cx - cell, y: cy - cell * 0.78, cell: cell, cols: 2, rows: 1 };
    return bbGrid(g, 1, {}) +
      MK.arrow(bbX(g, 0), g.y + cell + 22, bbX(g, 1), g.y + cell + 22, 1, P.gold, 6) +
      bbRobot(bbX(g, 1), bbY(g, 0), 0, cell / 56, 1);
  }

  var BB_RECAP = [
    { beat: 0, at: "buttons", title: "The buttons", sub: "make the program", pic: bbRecapPad },
    { beat: 1, at: "clear", title: "CLEAR, then GO", sub: "clear before you enter", pic: bbRecapButtons },
    { beat: 2, at: "one", title: "One press, one square", sub: "a turn only spins", pic: bbRecapSquare },
    { beat: 3, at: "predict", title: "Predict first", sub: "follow it in your head", pic: "\u{1F52E}" }
  ];

  /* ---- the chapters, by kind -------------------------------------------------- */
  var KINDS = {
    title: MK.titleKind({ sub: [
      "Forward, backwards, turn left, turn right",
      "CLEAR, then the presses, then GO",
      "Predict where it stops, then press GO"
    ] }),
    robot: bbRobotChapter,
    clear: bbClearChapter,
    squares: bbSquaresChapter,
    wall: bbWallChapter,
    predict: bbPredictChapter,
    work: bbWorkChapter,
    recap: MK.recapKind(BB_RECAP, { goBeat: 3, goAt: "go" })
  };
