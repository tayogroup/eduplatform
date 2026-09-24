  /* ==== Which Way From Here, part 2 ==========================================
     tools/lib/film-scenes/math-g2/which-way-from-here-2.js: the chapters
     "How big is the turn?" and "Drive it to the flag". See the header of
     which-way-from-here.js for the direction convention - everything that
     faces or turns goes through wwFace(a), a degrees clockwise from up. */

  /* ==== chapter: How big is the turn? ===================================
     One dial with four quarter marks and the robot at its centre. The turn is
     drawn as the arc it sweeps, a increasing, which is to the right. The
     robot starts facing the top of the page in every beat. */
  var WW_DIAL = { cx: 380, cy: 222, r: 142 };
  function wwDial(t, lit) {
    var out = "", k, a, p1, p2;
    out += R(116, 26, 528, 392, 26, WC.card, WC.line, 2);
    out += C(WW_DIAL.cx, WW_DIAL.cy, WW_DIAL.r, WC.ground, WC.muted, 3);
    for (k = 0; k < 4; k++) {
      a = k * 90;
      p1 = wwAt(WW_DIAL.cx, WW_DIAL.cy, WW_DIAL.r - 22, a);
      p2 = wwAt(WW_DIAL.cx, WW_DIAL.cy, WW_DIAL.r + 3, a);
      out += L(p1[0], p1[1], p2[0], p2[1], k < lit ? WC.plum : WC.muted, k < lit ? 8 : 4);
    }
    return out;
  }
  /* the quarter marks a turn of `ang` degrees has passed */
  function wwQuarters(ang) { return Math.min(4, Math.floor(ang / 90 + 1e-6)); }

  function wwTurnsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSize = c(0, "size"), cMuch = c(0, "much"), cQuarter = c(0, "quarter");
    var cTwo = c(1, "two"), cHalf = c(1, "half"), cBack = c(1, "back");
    var cFour = c(2, "four"), cWhole = c(2, "whole"), cRound = c(2, "round"), cStart = c(2, "start");
    var cChanges = c(3, "changes"), cMove = c(3, "move");
    var k = i - scene.first, ang = 0, out = "", n, from;

    if (k === 0) ang = 90 * wwStep(t, cMuch, 0.75);
    else if (k === 1) ang = 90 * wwStep(t, cTwo, 0.55) + 90 * wwStep(t, cTwo == null ? null : cTwo + 0.7, 0.55);
    else if (k === 2) {
      from = cFour;
      for (n = 0; n < 4; n++) ang += 90 * wwStep(t, from == null ? null : from + n * 0.5, 0.42);
    } else ang = 90 * wwStep(t, cChanges, 0.85);

    out += wwDial(t, wwQuarters(ang));
    /* the arc of the turn, and a ghost of where it started */
    if (ang > 1) {
      out += wwArc(WW_DIAL.cx, WW_DIAL.cy, WW_DIAL.r * 0.66, 0, ang, WC.plum, 6);
      out += wwBot(WW_DIAL.cx, WW_DIAL.cy, 58, 0, WC.muted, 0.25);
    }
    out += wwBot(WW_DIAL.cx, WW_DIAL.cy, 58, ang, WC.accent, 1);
    /* "A turn has a size" */
    var sz = on(t, cSize, 0.5) * wwOnly(t, scene, 0);
    if (sz > 0) out += MK.glow(WW_DIAL.cx, WW_DIAL.cy, 176, P.gold, sz * (0.55 + 0.45 * breathe(t)));
    /* "You face back the way you came": the way it came, and the way it faces */
    var bk = on(t, cBack, 0.5) * wwOnly(t, scene, 1);
    if (bk > 0) {
      out += MK.arrow(WW_DIAL.cx, WW_DIAL.cy - 86, WW_DIAL.cx, WW_DIAL.cy - 176, bk, P.muted, 6);
      out += MK.arrow(WW_DIAL.cx, WW_DIAL.cy + 86, WW_DIAL.cx, WW_DIAL.cy + 176, bk, P.gold, 6);
    }
    /* "all the way round to the start" */
    var st = popIn(t, cStart, 0.4) * wwOnly(t, scene, 2);
    if (st > 0) out += MK.tick(WW_DIAL.cx, WW_DIAL.cy - WW_DIAL.r - 30, 24, st);
    var rd = on(t, cRound, 0.5) * wwOnly(t, scene, 2);
    if (rd > 0) out += C(WW_DIAL.cx, WW_DIAL.cy, WW_DIAL.r + 16, "none", P.gold, 4, { opacity: rd * 0.8, "stroke-dasharray": "14 10" });
    /* "It does not move you along" */
    var mv = popIn(t, cMove, 0.45) * wwOnly(t, scene, 3);
    if (mv > 0) {
      out += C(WW_DIAL.cx, WW_DIAL.cy, 13, WC.bad, WC.card, 3, { opacity: Math.min(1, mv) });
      out += MK.pill(WW_DIAL.cx, WW_DIAL.cy + WW_DIAL.r + 38, "same place", Math.min(1, mv), { size: 26, col: P.bad, ink: P.bad });
    }

    out += MK.list(706, 128, [
      { text: "a quarter turn", at: cQuarter, mark: "tick", markAt: cQuarter == null ? null : cQuarter + 1.0 },
      { text: "a half turn", at: cHalf, mark: "tick", markAt: cHalf == null ? null : cHalf + 0.6 },
      { text: "a whole turn", at: cWhole, mark: "tick", markAt: cWhole == null ? null : cWhole + 0.6 }
    ], t, { lh: 84, cls: "lab big", markR: 20 });
    return svg(out);
  }

  /* ==== chapter: Drive it to the flag ===================================
     The lesson's own route: the flag two squares up and two to the right, so
     face the top, forward two, turn right, forward two. This is MAPS5[0] in
     which-way-from-here.html - start {c:0,r:1,f:0}, flag {gc:2,gr:3}, a
     2-column by 2-row difference - and MAPS5 is drawn in array order, never
     shuffled, so it is the map every learner meets first. The robot's column
     and row are worked out here and the trail is the cells it has left, so a
     move the voice names is the move the picture makes, and no other. */
  var WW_DRIVE = { start: [1, 3], flag: [3, 1] };
  function wwDriveMap() { return wwMap({ cols: 5, rows: 5, cell: 54, x: 56, y: 20, w: 400, h: 400 }); }

  function wwDriveChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cForward = c(0, "forward"), cTurn0 = c(0, "turn");
    var cUp = c(1, "up"), cRight = c(1, "right");
    var cTop = c(2, "top"), cGo2 = c(2, "go");
    var cTurn3 = c(3, "turn"), cFaces = c(3, "faces");
    var cGo4 = c(4, "go"), cFlag = c(4, "flag");
    var k = i - scene.first, m = wwDriveMap(), out = "";

    /* where the robot is, and which way it faces, at time t. Two staggered
       steps off the same cue, as the two "up" squares already did, so both
       squares of the "forward two" move land inside the one beat that says it. */
    var up1 = k >= 2 ? wwStep(t, cGo2, 0.5) : 0;
    var up2 = k >= 2 ? wwStep(t, cGo2 == null ? null : cGo2 + 0.62, 0.5) : 0;
    var turn = k >= 3 ? wwStep(t, cTurn3, 0.6) : 0;
    var across1 = k >= 4 ? wwStep(t, cGo4, 0.5) : 0;
    var across2 = k >= 4 ? wwStep(t, cGo4 == null ? null : cGo4 + 0.62, 0.5) : 0;
    var across = across1 + across2;
    var col = WW_DRIVE.start[0] + across;
    var row = WW_DRIVE.start[1] - up1 - up2;
    var ang = 90 * turn;

    /* the squares it has left behind */
    var trail = [];
    if (up1 > 0.5) trail.push([1, 3]);
    if (up2 > 0.5) trail.push([1, 2]);
    if (across1 > 0.5) trail.push([1, 1]);
    if (across2 > 0.5) trail.push([2, 1]);
    out += m.card(trail, "gold");

    /* the flag, and the plan drawn over the map */
    var arrived = across >= 2 && k >= 4;
    out += Em(m.cx(WW_DRIVE.flag[0]) + m.size * 0.15, m.cy(WW_DRIVE.flag[1]) - m.size * 0.15, m.size * 0.62, "\u{1F6A9}");
    if (arrived) out += MK.glow(m.cx(WW_DRIVE.flag[0]), m.cy(WW_DRIVE.flag[1]), m.size * 1.1, P.good, 0.6 + 0.4 * breathe(t));

    /* beat 1: the flag is two squares up and two to the right */
    var pl2 = on(t, cUp, 0.55) * wwOnly(t, scene, 1), pl1 = on(t, cRight, 0.55) * wwOnly(t, scene, 1);
    if (pl2 > 0) {
      out += MK.arrow(m.cx(1), m.cy(3) - m.size * 0.42, m.cx(1), lerp(m.cy(3) - m.size * 0.42, m.cy(1) + m.size * 0.42, pl2), pl2, P.gold, 7);
      out += MK.pill(m.cx(2) + m.size * 0.1, m.cy(2), "2 up", pl2, { size: 25, col: P.gold, ink: P.gold });
    }
    if (pl1 > 0) {
      out += MK.arrow(m.cx(1), m.cy(1), lerp(m.cx(1), m.cx(3) - m.size * 0.12, pl1), m.cy(1), pl1, P.gold, 7);
      out += MK.pill(m.cx(2), m.cy(0), "2 right", pl1, { size: 25, col: P.gold, ink: P.gold });
    }
    /* beat 0: forward goes the way it faces; turn first, then go */
    var fw = on(t, cForward, 0.55) * wwOnly(t, scene, 0);
    if (fw > 0) out += MK.arrow(m.cx(1), m.cy(3) - m.size * 0.4, m.cx(1), m.cy(2) - m.size * 0.1, fw, P.gold, 7);
    var tn = on(t, cTurn0, 0.55) * wwOnly(t, scene, 0);
    if (tn > 0) out += wwArc(m.cx(1), m.cy(3), m.size * 0.62, 0, 90 * tn, P.plum, 5);
    /* beat 2 and 3: the moves it is told */
    var tp = on(t, cTop, 0.5) * wwOnly(t, scene, 2);
    if (tp > 0) out += MK.pill(912, 62, "facing the top", tp, { size: 25, col: P.gold, ink: P.gold });
    var fc = on(t, cFaces, 0.5) * (wwOnly(t, scene, 3) + wwFrom(t, scene, 4));
    if (fc > 0) out += MK.pill(912, 62, "facing the right", Math.min(1, fc), { size: 25, col: P.gold, ink: P.gold });
    if (k === 3 && turn > 0) out += wwArc(m.cx(col), m.cy(row), m.size * 0.62, 0, 90 * turn, P.plum, 5);

    out += wwBot(m.cx(col), m.cy(row), m.size * 0.35, ang, WC.accent, 1);
    var fl = popIn(t, cFlag, 0.4) * wwOnly(t, scene, 4);
    if (fl > 0) out += MK.tick(m.cx(WW_DRIVE.flag[0]) + m.size * 0.62, m.cy(WW_DRIVE.flag[1]) - m.size * 0.62, 24, fl);

    /* the moves, written out as the lesson's own run line does */
    out += MK.pill(556, 62, "the moves", on(t, cForward, 0.5), { size: 26, anchor: "start", col: P.gold, ink: P.gold });
    out += MK.list(560, 128, [
      { text: "forward", at: cGo2 },
      { text: "forward", at: cGo2 == null ? null : cGo2 + 0.62 },
      { text: "turn right", at: cTurn3 },
      { text: "forward", at: cGo4 },
      { text: "forward", at: cGo4 == null ? null : cGo4 + 0.62 }
    ], t, { lh: 58, cls: "lab big", markR: 15 });
    return svg(out);
  }
