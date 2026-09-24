  /* ==== Grade 2 Computing, Lesson 11, part 4 ===================================
     The chapter "Story robots, real robots", and the recap.

     THE TWO BINS ARE THE LESSON'S OWN - "In a story" and "Real, with a job" -
     and NEITHER IS MARKED WRONG. A story robot is not a mistake; it is a story.
     So there is no tick and no cross anywhere in this chapter: each bin carries
     the words that belong to it, and the contrast is that they stand apart.

     The three real robots are DRAWN rather than borrowed from the emoji font: a
     welding arm, a vacuum that bumps and turns, and a rover. The lesson's own
     job sorter shows them as a car, a robot face and a lorry, which read as a
     car, a robot face and a lorry. */

  /* ---- what a robot is ------------------------------------------------------ */
  function cdrWhatIsARobot(scene, t) {
    var cRobot = sc(scene, 0, "robot"), cJob = sc(scene, 0, "job");
    var p = popIn(t, cRobot, 0.5), out = "";
    if (p > 0) out += G(Em(400, 168, 130, "\u{1F916}"), { opacity: Math.min(1, p), transform: around(400, 168, Math.min(1.06, p)) });
    out += MK.pill(400, 262, "a machine", on(t, cRobot == null ? null : cRobot + 0.3, 0.4), { size: 24, col: P.good, ink: P.good });
    out += MK.pill(400, 316, "programmed to move", on(t, cRobot == null ? null : cRobot + 0.6, 0.4), { size: 24, col: P.good, ink: P.good });
    out += MK.leader(490, 196, 690, 196, on(t, cJob, 0.5), P.good);
    var pj = popIn(t, cJob, 0.45);
    if (pj > 0) out += MK.pop(R(700, 110, 300, 200, 22, P.cell, P.good, 3) + Em(850, 180, 80, "\u{1F3ED}") +
      Tx(850, 268, "and do a job", "lab big", "middle"), 850, 210, pj);
    return out;
  }

  /* ---- the two bins --------------------------------------------------------- */
  var CDR_BIN_Y = 40, CDR_BIN_H = 330, CDR_CARD_Y = 124, CDR_CARD_H = 180;

  function cdrBinHead(cx, pic, label, o) {
    if (!(o > 0)) return "";
    var w = String(label).length * 14.5;
    return G(Em(cx - w / 2 - 30, 80, 42, pic) + Tx(cx - w / 2, 92, label, "lab big", "start"), { opacity: Math.min(1, o) });
  }

  /* a robot from a story: the lesson's robot with the thing that makes it one */
  function cdrStoryCard(x, w, badge, label, p) {
    if (!(p > 0)) return "";
    var cx = x + w / 2;
    return G(R(x, CDR_CARD_Y, w, CDR_CARD_H, 20, P.cell, P.plum, 3) +
      Em(cx - 12, 180, 80, "\u{1F916}") + Em(cx + 44, 150, 44, badge) +
      Tx(cx, 276, label, "lab mid readable", "middle"),
      { transform: around(cx, CDR_CARD_Y + CDR_CARD_H / 2, Math.min(1.06, p)), opacity: Math.min(1, p) });
  }

  /* a real robot: a card whose picture is drawn by draw(cx, t) */
  function cdrRealCard(x, w, draw, label, t, p) {
    if (!(p > 0)) return "";
    var cx = x + w / 2;
    return G(R(x, CDR_CARD_Y, w, CDR_CARD_H, 20, P.cell, P.good, 3) + draw(cx, t) +
      Tx(cx, 290, label, "lab mid readable", "middle"),
      { transform: around(cx, CDR_CARD_Y + CDR_CARD_H / 2, Math.min(1.06, p)), opacity: Math.min(1, p) });
  }

  /* a welding arm that keeps welding the same joint */
  function cdrWeldArm(cx, t) {
    var a = 0.22 * Math.sin(t * 2.3);
    var ex = cx - 14 + 46 * Math.cos(a - 0.3), ey = 180 + 46 * Math.sin(a - 0.3) + 20;
    var out = R(cx - 38, 246, 48, 14, 5, P.plastic) +
      L(cx - 14, 250, cx - 14, 180, P.plastic, 11) +
      L(cx - 14, 180, ex, ey, P.plastic, 9) + C(cx - 14, 180, 7, P.line);
    var fl = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 11));
    out += L(ex, ey, ex + 5, ey + 12, P.gold, 4, { opacity: fl }) +
      L(ex - 7, ey + 4, ex - 1, ey + 14, P.gold, 3, { opacity: fl * 0.8 }) +
      L(ex + 9, ey + 3, ex + 4, ey + 13, P.gold, 3, { opacity: fl * 0.8 });
    out += Em(cx + 34, 236, 36, "\u{1F697}");
    return out;
  }

  /* a vacuum that runs at a wall, bumps it and comes back */
  function cdrVacuum(cx, t) {
    var u = (t * 0.42) % 2, p = u < 1 ? u : 2 - u;
    var x = cx - 44 + 78 * p, right = u < 1;
    var out = L(cx - 58, 254, cx + 50, 254, P.line, 4) + R(cx + 50, 200, 11, 54, 3, P.line);
    out += C(x, 234, 20, P.plastic, P.line, 3) + C(x, 234, 7, P.dark);
    out += Pth("M" + n2(x + (right ? 20 : -20)) + ",228 A20,20 0 0 " + (right ? "1" : "0") + " " +
      n2(x + (right ? 20 : -20)) + ",240", null, P.good, 5);
    /* the bump itself, when it is up against the wall */
    if (p > 0.93) out += C(cx + 46, 234, 7, P.gold, null, null, { opacity: (p - 0.93) / 0.07 });
    return out;
  }

  /* a rover on a red ground */
  function cdrRover(cx, t) {
    return R(cx - 58, 250, 116, 20, 8, "#8C4A32") +
      R(cx - 26, 210, 52, 26, 7, P.plastic, P.line, 2) +
      C(cx - 16, 244, 11, P.dark, P.line, 2) + C(cx + 16, 244, 11, P.dark, P.line, 2) +
      L(cx + 12, 210, cx + 22, 184, P.plastic, 4) + C(cx + 22, 182, 7, P.gold) +
      R(cx - 18, 216, 22, 12, 3, P.glass);
  }

  var CDR_REAL = [
    { draw: cdrWeldArm, label: "welds cars", at: "arm", beat: 3 },
    { draw: cdrVacuum, label: "bumps and turns", at: "vacuum", beat: 4 },
    { draw: cdrRover, label: "drives on Mars", at: "rover", beat: 4 }
  ];
  var CDR_REAL_X = [645, 811, 977], CDR_REAL_W = 150;

  function cdrRobotBins(scene, t) {
    var cStories = sc(scene, 1, "stories"), cFeel = sc(scene, 1, "feelings"), cFunny = sc(scene, 1, "funny");
    var cFict = sc(scene, 2, "fictional"), cMade = sc(scene, 2, "madeup");
    var cProg = sc(scene, 3, "program");
    var cSens = sc(scene, 5, "sensors"), cNoFeel = sc(scene, 5, "feelings");
    var cBoring = sc(scene, 6, "boring"), cUseful = sc(scene, 6, "useful");
    var out = "", k;

    /* ---- in a story ---- */
    var oL = on(t, cStories, 0.45);
    if (oL > 0) out += G(R(32, CDR_BIN_Y, 500, CDR_BIN_H, 24, P.card, P.plum, 3), { opacity: oL });
    out += cdrBinHead(282, "\u{1F4D6}", "In a story", oL);
    out += cdrStoryCard(48, 224, "❤️", "has feelings", popIn(t, cFeel, 0.45));
    out += cdrStoryCard(292, 224, "\u{1F602}", "finds jokes funny", popIn(t, cFunny, 0.45));
    out += MK.pill(121, 336, "fictional", on(t, cFict, 0.4), { size: 22, col: P.plum, ink: P.plum });
    out += MK.pill(338, 336, "made up for a story", on(t, cMade, 0.4), { size: 22, col: P.plum, ink: P.plum });

    /* ---- real, with a job ---- */
    var oR = on(t, cProg, 0.45);
    if (oR > 0) out += G(R(636, CDR_BIN_Y, 500, CDR_BIN_H, 24, P.card, P.good, 3), { opacity: oR });
    out += cdrBinHead(886, "\u{1F3ED}", "Real, with a job", oR);
    for (k = 0; k < 3; k++) {
      var c = sc(scene, CDR_REAL[k].beat, CDR_REAL[k].at);
      var p = popIn(t, c, 0.45);
      out += cdrRealCard(CDR_REAL_X[k], CDR_REAL_W, CDR_REAL[k].draw, CDR_REAL[k].label, t, p);
      /* "more boring": each one does its own job again and again */
      if (p > 0) out += cdrLoopMark(CDR_REAL_X[k] + CDR_REAL_W - 28, 146, 13, P.muted,
        popIn(t, cBoring == null ? null : cBoring + k * 0.1, 0.34));
    }

    /* the right bin's foot says a different thing in each of its last three
       beats, and only one of them is on screen at a time */
    var footA = cdrFrom(t, scene, 3) * (1 - into(t, scene.first + 5));
    out += G(MK.pill(886, 336, "a program and a job", 1, { size: 22, col: P.good, ink: P.good }), { opacity: footA });
    var footB = cdrOnly(t, scene, 5);
    out += G(MK.pill(787, 336, "sensors", on(t, cSens, 0.4), { size: 22, col: P.good, ink: P.good }) +
      MK.pill(953, 336, "not feelings", on(t, cNoFeel, 0.4), { size: 22, col: P.line, ink: P.muted }), { opacity: footB });
    var footC = cdrFrom(t, scene, 6);
    out += G(MK.pill(768, 336, "more boring", on(t, cBoring, 0.4), { size: 22, col: P.line, ink: P.muted }) +
      MK.pill(976, 336, "far more useful", on(t, cUseful, 0.4), { size: 22, col: P.good, ink: P.good }), { opacity: footC });

    /* the vacuum's bump sensor, noticed */
    if (footB > 0) out += G(MK.waves(CDR_REAL_X[1] + CDR_REAL_W / 2 + 34, 234, t, cSens,
      { dir: 0, spread: 1.2, reach: 42, n: 2, col: P.good, until: cSens == null ? null : cSens + 2.2 }), { opacity: footB });
    return out;
  }

  /* a circular arrow: this job, again and again */
  function cdrLoopMark(cx, cy, r, col, o) {
    if (!(o > 0)) return "";
    return G(Pth("M" + n2(cx + r) + "," + n2(cy) + " A" + n2(r) + "," + n2(r) + " 0 1 1 " + n2(cx) + "," + n2(cy - r), null, col, 3.5) +
      Pth("M" + n2(cx - 6) + "," + n2(cy - r - 5) + " L" + n2(cx) + "," + n2(cy - r) + " L" + n2(cx - 6) + "," + n2(cy - r + 6), null, col, 3.5),
      { transform: around(cx, cy, Math.min(1.1, o)), opacity: Math.min(1, o) });
  }

  KINDS.robots = function (scene, beat, t, i) {
    var toBins = into(t, scene.first + 1), out = "";
    if (toBins < 1) out += G(cdrWhatIsARobot(scene, t), { opacity: 1 - toBins });
    if (toBins > 0) out += G(cdrRobotBins(scene, t), { opacity: toBins });
    return svg(out);
  };

  /* ==== what you now know =======================================================
     The lesson's own closing line, card by card. On "wins the sums" every lit
     card breathes, for the film's last sentence. */
  KINDS.recap = MK.recapKind([
    { beat: 0, at: "fast", title: "Fast", sub: "and accurate, every time", pic: "\u{1F4BB}" },
    { beat: 0, at: "kind", title: "Kind", sub: "and fair: those jobs are ours", pic: "\u{1F91D}" },
    { beat: 1, at: "choose", title: "Device", sub: "the place and the purpose", pic: "\u{1F4F2}" },
    { beat: 2, at: "feel", title: "Fictional", sub: "made up for a story", pic: "\u{1F4D6}" },
    { beat: 2, at: "program", title: "Real robot", sub: "a program and a job", pic: "\u{1F916}" },
    { beat: 3, at: "kindness", title: "You", sub: "you win the kindness", pic: "\u{1F9D1}" }
  ], { goBeat: 3, goAt: "sums" });
