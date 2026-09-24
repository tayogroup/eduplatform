  /* ==== Bee-Bot Journeys, part 2 ==============================================
     The first three teaching chapters: the floor robot and its buttons, CLEAR
     then GO, and one press one square. See bee-bot-journeys.js for the grid,
     the robot and the rules they all share. */

  /* the 2 x 2 pad of command buttons, with at most one of them lit */
  var BB_KINDS = ["F", "B", "L", "R"];
  /* lit is the one button being named, or a map of the ones named so far:
     "On its back are buttons: forward, backwards, turn left, turn right" names
     four things in about two and a half seconds, so a pad that lights only the
     latest strobes. There each stays lit once it has been said. */
  function bbPad(x, y, bw, bh, gap, o, lit) {
    var out = "";
    BB_KINDS.forEach(function (k, i) {
      var on2 = typeof lit === "string" ? lit === k : !!(lit && lit[k]);
      out += bbButton(x + (i % 2) * (bw + gap), y + Math.floor(i / 2) * (bh + gap), bw, bh, k,
        { o: o, lit: on2 });
    });
    return out;
  }
  /* A counting number in the corner of a square. It is a filled disc rather
     than bare text because the squares being counted are exactly the ones the
     robot drives over, and a gold numeral on a robot's face is unreadable.
     TOP RIGHT, not top left: a destination the robot is standing on moves to
     the top left of its square (bbOnCell, so the shop is still visible under
     the robot that just reached it), and a counted square is very often that
     square - the shop at the end of Journey 1, the house at the end of
     Journey 2, the shop the finger predicts. Top left hid all three. */
  function bbCount(g, c, r, text, o, col) {
    if (!(o > 0)) return "";
    var rr = g.cell * 0.21, x = g.x + (c + 1) * g.cell - rr - 3, y = g.y + r * g.cell + rr + 3;
    col = col || P.gold;
    return G(C(x, y, rr, col === P.gold ? "#3A3016" : "#12363A", col, 2.5) +
      Tx(x, y + rr * 0.38, text, "lab", "middle", { fill: col, "font-size": rr * 1.15 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: the floor robot ==============================================
     The lesson's Journey 1 - the shop three squares straight ahead. The four
     buttons appear as they are named, three forward presses land in the memory
     as chips, the chips are named "the program", and GO runs them one square at
     a time. */
  var BB_R_PAD = { x: 44, y: 18, bw: 300, bh: 76, gap: 16 };     /* 44..660, 18..178 */
  var BB_R_GO = { x: 44, y: 190, w: 300, h: 70 };
  var BB_R_TRAY = { x: 44, y: 318, w: 616, h: 88 };
  var BB_R_RUN = bbRun({ start: [0, 4], facing: "up", prog: ["F", "F", "F"], cols: 5, rows: 5 });

  function bbRobotChapter(scene, beat, t, i) {
    var cRobot = sc(scene, 0, "robot"), cGrid = sc(scene, 0, "grid");
    var cBack = sc(scene, 1, "back"), cF = sc(scene, 1, "f"), cB = sc(scene, 1, "b"),
      cL = sc(scene, 1, "l"), cR = sc(scene, 1, "r");
    var cThree = sc(scene, 2, "three"), cPress = sc(scene, 2, "press");
    var cRem = sc(scene, 3, "remembered"), cProg = sc(scene, 3, "program");
    var cGo = sc(scene, 4, "go"), cAll = sc(scene, 4, "all"), cOne = sc(scene, 4, "one");
    var g = BB_G, out = "";

    /* the mat, the shop, and how far the run has got */
    var u = bbProgress(t, cAll == null ? null : cAll + 0.15, BB_R_RUN, 0.7);
    var occ = bbOccupied(BB_R_RUN, u, [0, 1]);
    out += bbGrid(g, 0.4, {});
    out += bbGrid(g, 1, { at: cGrid, t: t });
    out += bbOnCell(g, 0, 1, "\u{1F3EA}", popIn(t, cGrid, 0.7), occ ? -15 : 0, occ ? -15 : 0, occ ? 0.74 : 1);

    out += bbRunRobot(g, BB_R_RUN, u, popIn(t, cRobot, 0.5),
      occ ? 13 : 0, occ ? 13 : 0, occ ? 0.82 : 1);

    /* "three squares ahead": the three squares the robot must cross */
    var three = tally(t, cThree, 3, 0.7);
    for (var k = 0; k < three; k++) out += bbCount(g, 0, 3 - k, String(k + 1), on(t, cThree + k * 0.24, 0.3));

    /* the buttons on its back */
    var padO = on(t, cBack, 0.45);
    out += bbPad(BB_R_PAD.x, BB_R_PAD.y, BB_R_PAD.bw, BB_R_PAD.bh, BB_R_PAD.gap, padO,
      bbPast(t, cThree) ? (bbPast(t, cPress) ? "F" : null)
        : { F: bbPast(t, cF), B: bbPast(t, cB), L: bbPast(t, cL), R: bbPast(t, cR) });

    /* GO: it arrives with the buttons and lights when it is pressed */
    out += bbBigButton(BB_R_GO.x, BB_R_GO.y, BB_R_GO.w, BB_R_GO.h, "GO",
      { o: padO, lit: bbPast(t, cGo) });
    out += MK.ripple(BB_R_GO.x + BB_R_GO.h * 0.58, BB_R_GO.y + BB_R_GO.h / 2, t, cGo, P.good);

    /* the memory: one chip per press, in the order they were pressed */
    var trayO = on(t, cPress, 0.4);
    out += bbTray(BB_R_TRAY.x, BB_R_TRAY.y, BB_R_TRAY.w, BB_R_TRAY.h, "Memory", trayO);
    var n = tally(t, cPress, 3, 0.9), chips = [];
    for (var m = 0; m < n; m++) {
      chips.push({ kind: "F", o: popIn(t, cPress + m * 0.3, 0.35), now: u > m && u <= m + 1,
        n: bbPast(t, cRem) ? m + 1 : null });
      out += MK.ripple(BB_R_PAD.x + BB_R_PAD.bh * 0.56, BB_R_PAD.y + BB_R_PAD.bh / 2, t, cPress + m * 0.3, P.gold);
    }
    out += bbStrip(BB_R_TRAY.x + 10, BB_R_TRAY.y + 7, BB_R_TRAY.w - 20, BB_R_TRAY.h - 14, chips, 3);

    /* "That list is the program." */
    out += MK.pill(660, 280, "the program", on(t, cProg, 0.45), { size: 24, anchor: "end", col: P.gold, ink: P.gold });

    /* "one square at a time": the square the robot has just reached */
    var one = on(t, cOne, 0.4);
    if (one > 0 && u > 0) {
      var w = bbWhere(BB_R_RUN, Math.floor(u));
      out += bbCellRing(g, w.c, w.r, one * 0.9, P.gold);
    }
    out += MK.tick(1090, 64, 28, popIn(t, cOne == null ? null : cOne + 1.1, 0.4) * (u >= 3 ? 1 : 0));
    return svg(out);
  }

  /* ==== chapter: CLEAR, then GO ===============================================
     No mat here: the whole chapter is about what is in the robot's memory. An
     old program of three presses is already there; CLEAR wipes it; forgetting
     CLEAR leaves the new presses joined on to the old ones, and the robot sets
     off doing both. The lesson's own correction - "The robot is not confused.
     It is doing just what is in its memory." - is the last beat. */
  var BB_C_TRAY = { x: 330, y: 96, w: 790, h: 116 };
  var BB_C_OLD = ["F", "R", "F"], BB_C_NEW = ["F", "F", "R"];
  /* half is the pill's own half width at size 26, so the arrows stop at its edge */
  var BB_C_LADDER = [
    { x: 420, half: 75, text: "1. CLEAR" },
    { x: 700, half: 119, text: "2. the presses" },
    { x: 960, half: 54, text: "3. GO" }
  ];

  function bbClearChapter(scene, beat, t, i) {
    var cKeeps = sc(scene, 0, "keeps"), cClr0 = sc(scene, 0, "clear");
    var cClr1 = sc(scene, 1, "clear"), cWipes = sc(scene, 1, "wipes");
    var cForget = sc(scene, 2, "forget"), cJoin = sc(scene, 2, "join");
    var cBoth = sc(scene, 3, "both"), cWrong = sc(scene, 3, "wrong");
    var cConf = sc(scene, 4, "confused"), cClr4 = sc(scene, 4, "clear"),
      cEnter = sc(scene, 4, "enter"), cGo4 = sc(scene, 4, "go");
    var out = "";

    /* the robot itself, holding its memory */
    out += bbRobot(150, 100, 0, 1.35, 1);
    out += MK.leader(200, 104, BB_C_TRAY.x - 12, BB_C_TRAY.y + 58, on(t, cKeeps, 0.7), P.gold);

    /* the two buttons the chapter is about */
    out += bbBigButton(46, 250, 236, 72, "CLEAR", { o: on(t, cClr0, 0.45), lit: bbPast(t, cClr1) && !bbPast(t, cForget) });
    out += MK.ripple(46 + 72 * 0.58, 250 + 36, t, cClr1, P.bad);
    out += bbBigButton(46, 336, 236, 72, "GO", { o: on(t, cClr0, 0.45), lit: bbPast(t, cBoth) });
    out += MK.ripple(46 + 72 * 0.58, 336 + 36, t, cBoth, P.good);
    /* "Forget CLEAR": a cross lands on the button nobody pressed */
    out += MK.cross(282, 250, 26, popIn(t, cForget, 0.4) * (1 - on(t, cConf, 0.5)));

    /* the memory tray, and what is in it */
    out += bbTray(BB_C_TRAY.x, BB_C_TRAY.y, BB_C_TRAY.w, BB_C_TRAY.h, "Memory", on(t, cKeeps, 0.45));
    var wiped = bbPast(t, cWipes) && !bbPast(t, cJoin);
    var joined = bbPast(t, cJoin);
    var run = bbProgress(t, cBoth == null ? null : cBoth + 0.2, { length: 7 }, 0.42);
    var chips = [], k;
    for (k = 0; k < 3; k++) chips.push({
      kind: BB_C_OLD[k],
      o: wiped ? 1 - on(t, cWipes, 0.5) : joined ? on(t, cJoin, 0.4) : popIn(t, cKeeps + k * 0.26, 0.35),
      old: joined, now: joined && run > k && run <= k + 1
    });
    if (joined) for (k = 0; k < 3; k++) chips.push({
      kind: BB_C_NEW[k],
      o: popIn(t, cJoin + 0.25 + k * 0.22, 0.35),
      now: run > k + 3 && run <= k + 4
    });
    out += bbStrip(BB_C_TRAY.x + 12, BB_C_TRAY.y + 8, BB_C_TRAY.w - 24, BB_C_TRAY.h - 16, chips, 6);

    /* which are old and which are new */
    var half = (BB_C_TRAY.w - 24) / 2;
    var lab = on(t, cJoin, 0.5);
    if (lab > 0) {
      out += Tx(BB_C_TRAY.x + 12 + half * 0.5, BB_C_TRAY.y + BB_C_TRAY.h + 30, "the old presses", "lab mid muted", "middle", { opacity: lab });
      out += Tx(BB_C_TRAY.x + 12 + half * 1.5, BB_C_TRAY.y + BB_C_TRAY.h + 30, "your new presses", "lab mid gold", "middle", { opacity: lab });
    }
    /* "wipes the old program away": the tray is empty and says so */
    out += Tx(BB_C_TRAY.x + BB_C_TRAY.w / 2, BB_C_TRAY.y + BB_C_TRAY.h / 2 + 10, "empty", "lab big muted", "middle",
      { opacity: wiped ? on(t, cWipes, 0.6) : 0 });

    /* "stops in the wrong place" */
    var wr = bbOnly(t, scene, 3) * popIn(t, cWrong, 0.4);
    out += MK.cross(760, 288, 28, wr);
    out += MK.pill(930, 288, "the wrong place", on(t, cWrong, 0.45) * bbOnly(t, scene, 3), { size: 24, col: P.bad, ink: P.bad });

    /* "It is not confused." - the question mark beside the robot is crossed out */
    var cf = popIn(t, cConf, 0.45);
    out += MK.qmark(238, 178, 30, Math.min(1, cf));
    out += MK.cross(238, 178, 27, popIn(t, cConf == null ? null : cConf + 0.45, 0.4));

    /* clear it, enter the presses, then GO */
    var steps = [cClr4, cEnter, cGo4];
    BB_C_LADDER.forEach(function (s, k2) {
      var o = popIn(t, steps[k2], 0.4);
      out += MK.pill(s.x, 372, s.text, Math.min(1, o), { size: 26, col: P.good, ink: P.ink, fill: "#12402F" });
      if (k2 > 0) out += MK.arrow(BB_C_LADDER[k2 - 1].x + BB_C_LADDER[k2 - 1].half + 10, 372,
        s.x - s.half - 10, 372, on(t, steps[k2], 0.5), P.good, 6);
    });
    return svg(out);
  }

  /* ==== chapter: one press, one square ========================================
     Two pictures. First a bare mat: one forward press moves the robot exactly
     one square, and a turn spins it without moving it at all. Then the lesson's
     Journey 2 - the house two squares up and two to the right - counted,
     entered as five chips, and run. */
  var BB_S_PAD = { x: 44, y: 22, bw: 300, bh: 76, gap: 16 };      /* 44..660, 22..182 */
  var BB_S_TRAY = { x: 44, y: 306, w: 616, h: 92 };
  var BB_S_GO = { x: 44, y: 206, w: 300, h: 70 };
  var BB_S_DEMO = bbRun({ start: [2, 3], facing: "up", prog: ["F", "R"], cols: 5, rows: 5 });
  var BB_S_RUN = bbRun({ start: [0, 4], facing: "up", prog: ["F", "F", "R", "F", "F"], cols: 5, rows: 5 });
  var BB_S_PROG = ["F", "F", "R", "F", "F"];

  /* beats 0 and 1: the bare mat */
  function bbSquaresDemo(scene, t) {
    var cFwd = sc(scene, 0, "forward"), cOne = sc(scene, 0, "one");
    var cTurn = sc(scene, 1, "turn"), cQuarter = sc(scene, 1, "quarter"), cMove = sc(scene, 1, "move");
    var g = BB_G, out = "";
    var u = bbProgress(t, cQuarter, BB_S_DEMO, 0.6, bbPast(t, cOne) ? clamp((t - cOne) / 0.6, 0, 1) : 0);
    out += bbGrid(g, 1, {});

    /* the one square the press is worth, measured beside the ROBOT'S OWN
       column: the first cut measured it down the mat's left edge, two columns
       away from the square the robot had just crossed, so the arrow and the
       move it is about were nowhere near each other */
    var oneO = on(t, cOne, 0.4) * (1 - on(t, cQuarter, 0.5));
    var mx = g.x + 2 * g.cell - 16;
    out += bbCellRing(g, 2, 2, oneO, P.gold);
    out += MK.arrow(mx, bbY(g, 3), mx, bbY(g, 2), oneO, P.gold, 7);
    out += MK.pill(700, 250, "1 square", oneO, { size: 24, anchor: "end", col: P.gold, ink: P.gold });

    /* the turn: it spins where it stands */
    var mv = on(t, cMove, 0.4);
    out += bbCellRing(g, 2, 2, mv, P.good);
    out += MK.pill(700, 250, "0 squares", mv, { size: 24, anchor: "end", col: P.good, ink: P.good });

    out += bbRunRobot(g, BB_S_DEMO, u, 1);
    return out;
  }

  /* beats 2 to 4: the journey to the house */
  function bbSquaresJourney(scene, t) {
    var cCount = sc(scene, 2, "count"), cUp = sc(scene, 2, "up"), cRight = sc(scene, 2, "right");
    var cFive = sc(scene, 3, "five");
    var cGo = sc(scene, 4, "go"), cDrives = sc(scene, 4, "drives"), cHouse = sc(scene, 4, "house");
    var g = BB_G, out = "";
    var u = bbProgress(t, cGo == null ? null : cGo + 0.25, BB_S_RUN, 0.52);
    var occ = bbOccupied(BB_S_RUN, u, [2, 2]);
    out += bbGrid(g, 1, {});
    out += bbOnCell(g, 2, 2, "\u{1F3E0}", popIn(t, cCount, 0.5), occ ? -15 : 0, occ ? -15 : 0, occ ? 0.74 : 1);

    /* two squares up, then two to the right - the lesson's own hint */
    var up = tally(t, cUp, 2, 0.5);
    for (var k = 0; k < up; k++) out += bbCount(g, 0, 3 - k, String(k + 1), on(t, cUp + k * 0.3, 0.3));
    var rt = tally(t, cRight, 2, 0.5);
    for (var m = 0; m < rt; m++) out += bbCount(g, 1 + m, 2, String(m + 1), on(t, cRight + m * 0.3, 0.3), P.teal);

    out += bbRunRobot(g, BB_S_RUN, u, 1, occ ? 13 : 0, occ ? 13 : 0, occ ? 0.82 : 1);
    out += MK.tick(1090, 64, 28, popIn(t, cHouse, 0.4) * (u >= 5 ? 1 : 0));
    out += MK.pill(700, 250, "5 presses", on(t, cFive, 0.45) * (1 - on(t, cDrives, 0.5)), { size: 24, anchor: "end", col: P.gold, ink: P.gold });
    return out;
  }

  function bbSquaresChapter(scene, beat, t, i) {
    var cFwd = sc(scene, 0, "forward");
    var cTurn = sc(scene, 1, "turn"), cQuarter = sc(scene, 1, "quarter");
    var cCount = sc(scene, 2, "count");
    var cFf = sc(scene, 3, "ff"), cTurn3 = sc(scene, 3, "turn"), cFf2 = sc(scene, 3, "ff2");
    var cGo = sc(scene, 4, "go");
    var out = "", swap = into(t, scene.first + 2);

    /* the buttons: whichever the voice named last is the one lit - and nothing
       at all while the beat is about counting squares rather than pressing */
    var lit = null, litAt = -1;
    [[cFwd, "F"], [cTurn, "R"], [cQuarter, "R"], [cCount, null], [cFf, "F"], [cTurn3, "R"], [cFf2, "F"]]
      .forEach(function (pr) { if (bbPast(t, pr[0]) && pr[0] > litAt) { litAt = pr[0]; lit = pr[1]; } });
    var u = bbProgress(t, cGo == null ? null : cGo + 0.25, BB_S_RUN, 0.52);
    /* once GO is pressed the pad shows the press the robot is making */
    if (u > 0 && u < 5) lit = BB_S_PROG[Math.floor(u)];
    out += bbPad(BB_S_PAD.x, BB_S_PAD.y, BB_S_PAD.bw, BB_S_PAD.bh, BB_S_PAD.gap, 1, lit);
    out += bbBigButton(BB_S_GO.x, BB_S_GO.y, BB_S_GO.w, BB_S_GO.h, "GO", { o: 1, lit: bbPast(t, cGo) });
    out += MK.ripple(BB_S_GO.x + BB_S_GO.h * 0.58, BB_S_GO.y + BB_S_GO.h / 2, t, cGo, P.good);

    /* the five presses, entered as they are said */
    var trayO = on(t, cFf, 0.45);
    out += bbTray(BB_S_TRAY.x, BB_S_TRAY.y, BB_S_TRAY.w, BB_S_TRAY.h, "Memory", trayO);
    var ats = [cFf, cFf == null ? null : cFf + 0.4, cTurn3, cFf2, cFf2 == null ? null : cFf2 + 0.4];
    var chips = [];
    ats.forEach(function (at, k) {
      var o = popIn(t, at, 0.35);
      if (o > 0) chips.push({ kind: BB_S_PROG[k], o: Math.min(1, o), now: u > k && u <= k + 1 });
    });
    out += bbStrip(BB_S_TRAY.x + 10, BB_S_TRAY.y + 8, BB_S_TRAY.w - 20, BB_S_TRAY.h - 16, chips, 5);

    if (swap < 1) out += G(bbSquaresDemo(scene, t), { opacity: 1 - swap });
    if (swap > 0) out += G(bbSquaresJourney(scene, t), { opacity: swap });
    return svg(out);
  }
