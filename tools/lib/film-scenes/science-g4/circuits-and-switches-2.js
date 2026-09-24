  /* ==== Circuits and Switches, part 2: A switch, and Brighter and dimmer ======
     Both chapters stand on the lesson's own seriesCircuit drawing
     (ART.kit.seriesSvg): the cells sit on the top wire, the lamps on the
     bottom one and the switch on the right, exactly where the child will tap
     "Add a cell", "Add a lamp" and "Open the switch". Beside it the film draws
     what the lesson's picture is too small to show: inside the switch. */

  /* the seriesSvg loop, starting at the first cell and running round through
     the switch, the lamps and back */
  function csSeriesPts(b) {
    return [b.at(70, 40), b.at(280, 40), b.at(280, 110), b.at(280, 180),
      b.at(40, 180), b.at(40, 40), b.at(70, 40)];
  }
  var CS_SW_U = 210 / 760;   /* where the switch sits on that loop */

  /* ==== chapter: A switch ========================================================= */
  var CS_SW = csBox(46, 52, 452, 320, 220);
  var CS_SW_PTS = csSeriesPts(CS_SW);
  var CS_ZOOM = { x: 574, y: 62, w: 560, h: 330 };   /* the cut-away, right of it */

  /* two metal contacts and the lever between them. ang is the lever's angle
     from straight down, in degrees: 0 touches the lower contact. */
  function csContacts(cx, top, bot, ang, t, opt) {
    opt = opt || {};
    var len = bot - top, a = ang * Math.PI / 180;
    var ex = cx + Math.sin(a) * len, ey = top + Math.cos(a) * len;
    var out = R(cx - 92, top - 58, 184, len + 116, 18, "#123247", P.line, 2);
    out += C(cx, top, 17, P.gold, "#0E2434", 3);
    out += C(cx, bot, 17, P.gold, "#0E2434", 3);
    out += L(cx, top, ex, ey, P.gold, 13);
    out += C(ex, ey, 9, "#FFF3B0");
    /* the gap the lever leaves, measured across to the lower contact */
    if (opt.gapO > 0 && ang > 6) {
      out += L(ex, ey, cx, bot, P.bad, 4, { "stroke-dasharray": "8 7", opacity: opt.gapO });
      out += MK.pill((ex + cx) / 2 + 52, (ey + bot) / 2 + 6, "gap", opt.gapO, { size: 22, col: P.bad, ink: P.bad });
    }
    if (opt.touchAt != null) out += MK.ripple(cx, bot, t, opt.touchAt, P.good);
    return out;
  }

  /* one coil of a spring, from (x, yTop) down to yBot, n turns wide w */
  function csSpring(x, yTop, yBot, w, n) {
    var d = "M" + n2(x - w / 2) + "," + n2(yBot), h = (yBot - yTop) / n;
    for (var k = 0; k < n; k++)
      d += " L" + n2(x + w / 2) + "," + n2(yBot - (k + 0.5) * h) + " L" + n2(x - w / 2) + "," + n2(yBot - (k + 1) * h);
    return Pth(d, null, "#7E93A6", 4);
  }
  /* a doorbell button in section: a cap on two springs, a bridge bar under it,
     and two fixed contacts the bar lands across. press 0 = up, 1 = pressed
     home, where the bar bridges the two contacts and the circuit is closed. */
  var CS_BTN = { cx: 854, base: 320, drop: 48 };
  function csButton(press, t, lit) {
    var cx = CS_BTN.cx, base = CS_BTN.base, d = CS_BTN.drop * clamp(press, 0, 1);
    var conY = base - 16, bridgeY = conY - 56 + d, capY = 192 + d, out = "";
    if (lit > 0) out += MK.glow(cx, conY, 132, P.good, lit);
    out += R(cx - 190, base, 380, 44, 12, "#123247", P.line, 2);
    /* the two fixed contacts, and the bar that bridges them when pressed */
    out += R(cx - 92, conY, 40, 16, 4, P.gold) + R(cx + 52, conY, 40, 16, 4, P.gold);
    out += csSpring(cx - 138, bridgeY + 16, conY, 22, 3);
    out += csSpring(cx + 138, bridgeY + 16, conY, 22, 3);
    out += R(cx - 154, bridgeY, 308, 16, 6, P.gold);
    out += R(cx - 8, capY + 34, 16, bridgeY - capY - 34, 3, "#93AABE");
    out += E(cx, capY + 38, 40, 11, "#7E93A6");
    out += C(cx, capY, 46, "#D9473F", "#F0806F", 5);
    out += C(cx - 15, capY - 17, 13, "#FFFFFF", null, null, { opacity: 0.32 });
    return out;
  }

  function csSwitchChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSwitch = c(0, "switch"), cControl = c(0, "control"), cContacts = c(0, "contacts");
    var cClosed = c(1, "closed"), cTouch = c(1, "touch"), cLights = c(1, "lights");
    var cOpen = c(2, "open"), cGap = c(2, "gap"), cDark = c(2, "dark");
    var cFull = c(3, "full"), cPath = c(3, "path"), cBroken = c(3, "broken");
    var cBell = c(4, "doorbell"), cCloses = c(4, "closes"), cPress = c(4, "press");
    var cGo = c(5, "go"), cSprings = c(5, "springs"), cStops = c(5, "stops");

    /* the lever: open to begin with, closed on "the contacts touch", open again
       on "Open", and the doorbell takes over from beat 4 */
    var ang = 32;
    if (cTouch != null && t >= cTouch) ang = 32 * (1 - ease((t - cTouch) / 0.45));
    if (cOpen != null && t >= cOpen) ang = 32 * ease((t - cOpen) / 0.45);
    var closed = ang < 6;
    /* the doorbell is closed only while it is pressed: the finger comes down on
       "closes only", lifts on "Let go", and the spring pushes the cap back up
       on "springs open" */
    var doorbell = csFrom(t, scene, 4);
    var press = 0;
    if (cCloses != null && t >= cCloses) press = ease((t - cCloses) / 0.4);
    if (cSprings != null && t >= cSprings) press = 1 - ease((t - cSprings) / 0.4);
    var flowing = doorbell > 0.5 ? press > 0.5 : closed;

    var st = { cells: 1, lamps: 1, open: !flowing };
    var out = csCard(CS_SW);
    out += ART.place(ART.kit.seriesSvg(st), CS_SW.x, CS_SW.y, CS_SW.w, CS_SW.h);

    var sw = CS_SW.at(280, 110), cell = CS_SW.at(70, 40), lamp = CS_SW.at(110, 180);
    /* "A switch": the lesson's switch, ringed, and a finger on it for "you control" */
    var swRing = on(t, cSwitch, 0.4) * clamp(1 - (t - cSwitch) / 2.4, 0, 1) * csOnly(t, scene, 0);
    if (swRing > 0) out += C(sw[0], sw[1], 44, "none", P.gold, 5, { opacity: swRing });
    out += MK.finger(sw[0] + 4, sw[1] + 34, on(t, cControl, 0.35) * csOnly(t, scene, 0));

    /* the cut-away: two metal contacts, and the gap between them */
    var zoomO = popIn(t, cContacts, 0.45) * (1 - doorbell);
    if (zoomO > 0) {
      var zx = CS_ZOOM.x + CS_ZOOM.w / 2;
      var inner = csContacts(zx, CS_ZOOM.y + 64, CS_ZOOM.y + 244, ang, t,
        { gapO: on(t, cGap, 0.4) * csOnly(t, scene, 2), touchAt: cTouch });
      /* the zoom lines, from the lesson's little switch to the big drawing */
      var zu = on(t, cContacts, 0.55);
      inner = L(sw[0], sw[1] - 26, lerp(sw[0], zx - 92, zu), lerp(sw[1] - 26, CS_ZOOM.y + 6, zu), P.gold, 2.5, { opacity: 0.7, "stroke-dasharray": "8 7" }) +
        L(sw[0], sw[1] + 26, lerp(sw[0], zx - 92, zu), lerp(sw[1] + 26, CS_ZOOM.y + 302, zu), P.gold, 2.5, { opacity: 0.7, "stroke-dasharray": "8 7" }) + inner;
      inner += MK.pill(zx, CS_ZOOM.y + 296, "two metal contacts", 1, { size: 24, col: P.gold });
      inner += MK.pill(zx, CS_ZOOM.y + 20, closed ? "closed" : "open", Math.max(on(t, cClosed, 0.4), on(t, cOpen, 0.4)),
        { size: 26, col: closed ? P.good : P.bad, ink: closed ? P.good : P.bad });
      out += G(inner, { opacity: Math.min(1, zoomO), transform: around(zx, CS_ZOOM.y + 160, Math.min(1, zoomO)) });
    }

    /* "the lamp lights" / "the lamp is dark": the lesson's own lamp says so */
    var litO = on(t, cLights, 0.4) * csOnly(t, scene, 1);
    if (litO > 0) out += MK.glow(lamp[0], lamp[1], 84, P.gold, litO * (0.8 + 0.2 * breathe(t)));
    out += MK.cross(lamp[0], lamp[1] - 74, 24, popIn(t, cDark, 0.4) * csOnly(t, scene, 2));

    /* "The cell is still full": the lesson's cell, ringed, with a full bar */
    var fullO = on(t, cFull, 0.4) * csOnly(t, scene, 3);
    if (fullO > 0) {
      out += C(cell[0], cell[1], 40, "none", P.good, 5, { opacity: fullO });
      out += MK.pill(cell[0], CS_SW.y - 26, "still full", fullO, { size: 24, col: P.good, ink: P.good });
    }
    /* "the path ... is broken": the loop traces gold and stops dead at the switch */
    var pathO = on(t, cPath, 0.9) * csOnly(t, scene, 3);
    if (pathO > 0) out += csTrace(CS_SW_PTS, pathO * CS_SW_U, "#FFF3B0", 5, { opacity: 0.95 });
    out += MK.cross(sw[0], sw[1], 22, popIn(t, cBroken, 0.4) * csOnly(t, scene, 3));

    /* "A doorbell button": a button on a spring, closed only while pressed */
    if (doorbell > 0) {
      var bx = CS_BTN.cx, capY = 192 + CS_BTN.drop * press;
      var inner2 = csButton(press, t, press > 0.6 ? (press - 0.6) * 2.5 : 0);
      /* the finger comes down on the cap, and lifts on "Let go" */
      var lift = cGo == null ? 0 : ease((t - cGo) / 0.4) * 46;
      inner2 += Em(bx, capY - 96 - lift, 56, "\u{1F447}", { opacity: on(t, cBell, 0.4) });
      /* "while you press it": the contacts, held closed under the finger */
      inner2 += MK.ripple(CS_BTN.cx, CS_BTN.base - 8, t, cPress, P.good);
      inner2 += MK.pic(646, 150, 62, "\u{1F514}");
      inner2 += MK.waves(674, 158, t, cCloses == null ? null : cCloses + 0.35,
        { dir: -0.55, spread: 1.4, reach: 78, col: P.gold, until: cSprings });
      inner2 += MK.arrow(1062, 286, 1062, 212, on(t, cSprings, 0.45), P.good, 8);
      /* "let go" only once it HAS been let go: before the first press it is
         simply open */
      var lbl = press > 0.5 ? "pressed: closed" : (cGo != null && t >= cGo) ? "let go: open" : "open";
      inner2 += MK.pill(bx, 400, lbl, 1,
        { size: 24, col: press > 0.5 ? P.good : P.bad, ink: press > 0.5 ? P.good : P.bad });
      out += G(inner2, { opacity: doorbell });
    }
    return svg(out);
  }

  /* ==== chapter: Brighter and dimmer ==============================================
     The lesson's seriesCircuit again, with the buttons the child presses: a
     second cell, then a second lamp. Beside it, why: the cells' push, and how
     it is shared. */
  var CS_BR = csBox(352, 44, 464, 320, 220);
  var CS_BR_PTS = csSeriesPts(CS_BR);
  var CS_PUSH_X = 856, CS_PUSH_W = 138;   /* the push bar: one cell's worth */

  function csBrightChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPush = c(0, "push"), cOne = c(0, "one");
    var cAdd = c(1, "add"), cBigger = c(1, "bigger"), cBrighter = c(1, "brighter");
    var cLamp2 = c(2, "lamp"), cShared = c(2, "shared");
    var cShared2 = c(3, "shared"), cEach = c(3, "each"), cDimmer = c(3, "dimmer");
    var cCells = c(4, "cells"), cLamps = c(4, "lamps"), cOff = c(4, "off");

    var cells = cAdd != null && t >= cAdd ? 2 : 1;
    var lamps = cLamp2 != null && t >= cLamp2 ? 2 : 1;
    var open = cOff != null && t >= cOff;
    var out = csCard(CS_BR);
    out += ART.place(ART.kit.seriesSvg({ cells: cells, lamps: lamps, open: open }), CS_BR.x, CS_BR.y, CS_BR.w, CS_BR.h);

    var sw = CS_BR.at(280, 110);
    /* "Cells push the electricity round the loop": sparks leave the cell */
    var flowO = on(t, cPush, 0.5) * (open ? 0 : 1);
    out += csFlow(t, CS_BR_PTS, cPush, flowO, { n: 6, speed: 0.26, r: 7 });
    /* "One cell, one lamp": each is ringed once, as it is named */
    var oneO = on(t, cOne, 0.4) * csOnly(t, scene, 0);
    if (oneO > 0) {
      out += C(CS_BR.X(70), CS_BR.Y(40), 34, "none", P.gold, 4, { opacity: oneO });
      out += C(CS_BR.X(110), CS_BR.Y(180), 34, "none", P.gold, 4, { opacity: on(t, cOne == null ? null : cOne + 0.5, 0.4) * csOnly(t, scene, 0) });
    }
    /* the new cell and the new lamp pop in where the lesson draws them */
    out += MK.ripple(CS_BR.X(110), CS_BR.Y(40), t, cAdd, P.gold);
    out += MK.ripple(CS_BR.X(170), CS_BR.Y(180), t, cLamp2, P.gold);
    /* the switch, opened on the film's last line of the chapter */
    out += MK.ripple(sw[0], sw[1], t, cOff, P.bad);
    if (open) out += C(sw[0], sw[1], 40, "none", P.bad, 5, { opacity: 0.6 + 0.4 * breathe(t) });

    /* the two rules, on the left, each written as it is learned */
    var r1 = popIn(t, cBrighter, 0.45), r2 = popIn(t, cDimmer, 0.45);
    if (r1 > 0) {
      var f1 = 1 + 0.06 * bump(t, cCells, 0.8);
      out += G(MK.pic(74, 150, 56, "\u{1F50B}") + MK.arrow(134, 176, 134, 122, 1, P.good, 9) +
        Tx(168, 162, "brighter", "lab big good", "start"),
        { opacity: Math.min(1, r1), transform: around(140, 150, Math.min(1.08, r1) * f1) });
    }
    if (r2 > 0) {
      var f2 = 1 + 0.06 * bump(t, cLamps, 0.8);
      out += G(MK.pic(74, 286, 56, "\u{1F4A1}") + MK.arrow(134, 260, 134, 314, 1, P.accent, 9) +
        Tx(168, 298, "dimmer", "lab big", "start", { fill: P.accent }),
        { opacity: Math.min(1, r2), transform: around(140, 286, Math.min(1.08, r2) * f2) });
    }
    out += MK.pill(74, 90, "More cells", Math.min(1, r1), { size: 24, anchor: "start", col: P.good });
    out += MK.pill(74, 226, "More lamps", Math.min(1, r2), { size: 24, anchor: "start", col: P.accent });

    /* the gauge, on the right: how big the push is, and how it is shared */
    var gO = on(t, cPush, 0.5), dark = open ? 0.3 : 1;
    if (gO > 0) {
      var pw = CS_PUSH_W * lerp(1, 2, on(t, cBigger, 0.5));
      out += Tx(CS_PUSH_X, 106, "push", "lab big muted caps", "start", { opacity: gO });
      out += R(CS_PUSH_X, 124, 2 * CS_PUSH_W, 34, 10, "none", P.line, 2, { opacity: gO });
      out += R(CS_PUSH_X, 124, pw, 34, 10, P.gold, null, null, { opacity: gO * dark });
      /* the push bar flashes as "A shared push" is said: it is the bar that is
         about to be divided */
      out += R(CS_PUSH_X, 124, pw, 34, 10, "#FFF3B0", null, null, { opacity: 0.55 * bump(t, cShared2, 1.0) });
      out += Tx(CS_PUSH_X, 228, "each lamp", "lab big muted caps", "start", { opacity: gO });
      var share = on(t, cShared, 0.5) > 0.5 || on(t, cShared2, 0.5) > 0.5 ? lamps : 1;
      var bw = (pw - (share - 1) * 10) / share;
      for (var k = 0; k < share; k++) {
        out += R(CS_PUSH_X + k * (bw + 10), 246, bw, 34, 10, P.gold, null, null, { opacity: gO * dark * (share > 1 ? 0.8 : 1) });
        /* "each lamp": each share lights in turn, so the halving is seen */
        out += R(CS_PUSH_X + k * (bw + 10), 246, bw, 34, 10, "#FFF3B0", null, null,
          { opacity: 0.55 * bump(t, cEach == null ? null : cEach + k * 0.3, 0.8) });
      }
      out += MK.pill(CS_PUSH_X + pw / 2, 322, share > 1 ? "half each" : "all of it",
        share > 1 ? Math.max(on(t, cShared, 0.4), on(t, cEach, 0.4)) : on(t, cOne, 0.4),
        { size: 22, col: share > 1 ? P.accent : P.gold });
    }
    out += MK.pill(CS_PUSH_X + CS_PUSH_W, 386, "switch open: off", on(t, cOff, 0.4), { size: 24, col: P.bad, ink: P.bad });
    return svg(out);
  }
