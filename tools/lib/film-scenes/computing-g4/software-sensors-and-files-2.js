  /* ==== Software, Sensors and Files, part 2: systems software underneath =====
     tools/lib/film-scenes/computing-g4/software-sensors-and-files-2.js. See the
     header of software-sensors-and-files.js.

     WHAT IS BORROWED RATHER THAN RETYPED. The machine is the lesson kit's own
     laptop (ART.figure("laptop")), rung and dimmed part by part exactly as the
     lesson rings them when a child taps: screen, then keyboard, then camera,
     each turning from gold (being named) to green (already named) as the next
     is rung, the way ioFigure does it in Lesson 6's film. The mouse is drawn
     separately - the laptop has a touchpad, not a mouse, and the voice says
     "mouse" - so nothing here rings a part the word does not match. */

  /* ==== chapter: systems software underneath ==================================
     The operating system as the foundation the laptop stands on: a plate that
     rises as "runs the computer itself" is said, with the gear that never
     stops turning while the machine is on. Then the three things the lesson's
     own lecture names it doing - the screen/keyboard/mouse, the files in
     folders shared between applications, the driver that reaches a printer or
     a camera - and the correction the lesson itself makes: not just the
     desktop picture. */
  var SSF_LAP = { x: 40, y: 54, w: 404, h: 300 };

  /* the laptop with one part gold (being named), the parts already named
     green, and everything else dimmed - ART's own idiom, the way Lesson 6's
     ioFigure rings it */
  function ssfLaptop(gold, done, o) {
    if (!(o > 0)) return "";
    var m = ART.figure("laptop");
    ART.parts(m).forEach(function (p) { if (p !== gold && done.indexOf(p) < 0) m = ART.dim(m, p, 0.35); });
    done.forEach(function (p) { if (p !== gold) m = ART.ring(m, p, P.good, 5); });
    if (gold) m = ART.ring(m, gold, P.gold, 6);
    return G(ART.place(m, SSF_LAP.x, SSF_LAP.y, SSF_LAP.w, SSF_LAP.h), { opacity: clamp(o, 0, 1) });
  }

  /* the gear that runs underneath: a plate the laptop stands on, turning
     whenever it is on screen at all (a pure function of the clock t) */
  var SSF_PLATE = { x: 40, y: 372, w: 404, h: 44 };
  function ssfPlate(o, spin) {
    if (!(o > 0)) return "";
    var p = SSF_PLATE, cx = p.x + 34, cy = p.y + p.h / 2 - 2;
    return G(R(p.x, p.y, p.w, p.h, 14, P.tealSoft, P.blue, 3) +
      G(Em(cx, cy, 28, "⚙️"), { transform: "rotate(" + n2(spin * 40 % 360) + " " + n2(cx) + " " + n2(cy) + ")" }) +
      Tx(p.x + 64, cy + 8, "systems software", "lab mid", "start", { fill: P.blue }),
      { opacity: clamp(o, 0, 1), transform: "translate(0," + n2((1 - clamp(o, 0, 1)) * 12) + ")" });
  }

  function ssfSystemsChapter(scene, beat, t, i) {
    var cRuns = sc(scene, 0, "runs"), cNever = sc(scene, 0, "never");
    var cOs = sc(scene, 1, "os"), cPower = sc(scene, 1, "power");
    var cScreen = sc(scene, 2, "screen"), cKeyboard = sc(scene, 2, "keyboard"), cMouse = sc(scene, 2, "mouse");
    var cFolders = sc(scene, 3, "folders"), cShares = sc(scene, 3, "shares");
    var cDriver = sc(scene, 4, "driver"), cPrinter = sc(scene, 4, "printer"), cCamera = sc(scene, 4, "camera");
    var cDesktop = sc(scene, 5, "desktop"), cEverything = sc(scene, 5, "everything");
    var out = "";

    /* which laptop part is being named now, and which are already named -
       screen, then keyboard (screen settles green), then camera much later
       (keyboard settles green): one chain across the whole chapter */
    var afterCamera = ssfPast(t, cCamera);
    var afterKeyboard = !afterCamera && ssfPast(t, cKeyboard);
    var afterScreen = !afterCamera && !afterKeyboard && ssfPast(t, cScreen);
    var gold = afterCamera ? "camera" : afterKeyboard ? "keyboard" : afterScreen ? "screen" : null;
    var done = []; if (afterKeyboard || afterCamera) done.push("screen"); if (afterCamera) done.push("keyboard");

    out += ssfLaptop(gold, done, 1);
    out += ssfPlate(on(t, cRuns, 0.6), t);
    if (bump(t, cNever, 1.8) > 0.02)
      out += MK.pill(SSF_PLATE.x + SSF_PLATE.w / 2, SSF_PLATE.y - 30, "you never open it",
        on(t, cNever, 0.5), { size: 20, col: P.blue, ink: P.blue });

    /* the operating system, starting when you press power */
    out += MK.pill(SSF_LAP.x + SSF_LAP.w / 2, 30, "the operating system", on(t, cOs, 0.5),
      { size: 21, col: P.blue, ink: P.blue });
    out += ssfPower(560, 120, 34, P.gold, on(t, cPower, 0.5));
    out += Tx(560, 176, "press power", "lab mid muted readable", "middle",
      { opacity: on(t, cPower, 0.5).toFixed(3) });

    /* the mouse: drawn beside the laptop, since the figure has a touchpad and
       the voice says mouse */
    var mp = popIn(t, cMouse, 0.42);
    if (mp > 0) out += G(ssfMouse(590, 250, 56, P.gold), { transform: around(590, 250, Math.min(1.06, mp)), opacity: Math.min(1, mp) });

    /* files in folders, shared between the four applications the lesson has
       already named */
    var nf = tally(t, cFolders, 3, 0.9);
    for (var k = 0; k < 3; k++) {
      var fo = k < nf ? 1 : 0;
      if (fo > 0) out += G(Em(760 + k * 76, 150, 46, "\u{1F4C2}"), { transform: around(760 + k * 76, 150, Math.min(1.06, popIn(t, cFolders, 0.5))), opacity: fo });
    }
    out += Tx(836, 196, "files in folders", "lab mid muted readable", "middle",
      { opacity: on(t, cFolders, 0.5).toFixed(3) });

    var sh = on(t, cShares, 0.6);
    if (sh > 0) {
      var barX = 700, barW = 350, barY = 250, quarter = barW / 4;
      out += R(barX, barY, barW, 30, 10, P.card, P.line, 2, { opacity: sh });
      SSF_APPS.forEach(function (a, k) {
        out += R(barX + k * quarter, barY, quarter, 30, 0, k % 2 ? P.tealSoft : "none", null, null, { opacity: 0.5 * sh });
        out += Em(barX + k * quarter + quarter / 2, barY - 24, 26, a.pic, { opacity: sh });
      });
      out += Tx(barX + barW / 2, barY + 54, "shares the machine", "lab mid muted readable", "middle", { opacity: sh });
    }

    /* a driver: a cable from the laptop's own port, reaching a printer, or a
       camera the laptop already carries */
    var dv = on(t, cDriver, 0.5);
    if (dv > 0) {
      out += Pth("M" + n2(SSF_LAP.x + SSF_LAP.w - 10) + "," + n2(SSF_LAP.y + 210) +
        " C 760,300 760,330 800,330", null, P.blue, 4, { opacity: dv, "stroke-dasharray": "3 7" });
    }
    var pr = popIn(t, cPrinter, 0.42);
    if (pr > 0) out += G(R(796, 302, 130, 76, 16, P.cell, P.blue, 3) + Em(861, 340, 44, "\u{1F5A8}️") +
      Tx(861, 388, "a printer", "lab mid", "middle"),
      { transform: around(861, 340, Math.min(1.06, pr)), opacity: Math.min(1, pr) });
    /* "the camera" beside the laptop's own ringed camera dot (top-centre of
       the screen bezel, x 242 y 83 once ART.place has scaled the figure into
       SSF_LAP), a SHORT leader rather than the far-away pill the operating
       system already owns at (242, 30) - stacking the two there was the
       original fault: both labels stay on screen once triggered, and from
       "the camera" to the end of the chapter they sat illegibly on top of
       one another. */
    var cmO = on(t, cCamera, 0.5);
    if (cmO > 0) {
      var camX = 242, camY = 83, camLabX = camX + 108, camLabY = camY - 4;
      out += MK.leader(camLabX, camLabY, camX + 21, camY, cmO, P.gold);
      out += Tx(camLabX + 10, camLabY + 5, "the camera", "lab mid", "start",
        { fill: P.gold, opacity: cmO.toFixed(3) });
    }

    /* the desktop picture is not the whole story: it appears on the wallpaper
       card and is crossed there, never over the machine the film has just
       built */
    var dp = popIn(t, cDesktop, 0.4);
    if (dp > 0) {
      out += G(R(944, 60, 176, 118, 16, P.cell, P.line, 2) +
        C(1032, 100, 26, P.sky) + Pth("M960,166 L1002,120 L1032,150 L1064,106 L1104,166 Z", P.grass, null, null),
        { transform: around(1032, 119, Math.min(1.06, dp)), opacity: Math.min(1, dp) });
      out += Tx(1032, 194, "the desktop picture", "lab mid muted readable", "middle", { opacity: dp.toFixed(3) });
      out += MK.cross(1032, 119, 60, popIn(t, cDesktop == null ? null : cDesktop + 0.35, 0.4));
    }
    if (bump(t, cEverything, 2.2) > 0.02) {
      out += MK.glow(584, 220, 210, P.blue, bump(t, cEverything, 2.2) * 0.55);
      out += MK.pill(584, 412, "runs everything else", on(t, cEverything, 0.5), { size: 24, col: P.good, ink: P.good });
    }
    return svg(out);
  }
