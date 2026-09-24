  /* ==== Grade 3 Computing, Lesson 13: Systems, Inputs and Files ===============
     tools/lib/film-scenes/computing-g3/systems-inputs-and-files.js, with -2.js
     and -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/systems-inputs-and-files.json.

     THERE IS NO ART.sim FOR ANY OF THIS. The lesson's own ideas here - a
     working system, hardware vs software roles, manual vs automatic input,
     file types - are not a kit scene, a Robo grid or a Bitsy board, so nothing
     here is lifted from computing.js. The one kit piece this film borrows is
     ART.figure("laptop"): it already carries a "keyboard" part and a "screen"
     part with their own tap outlines (2CS.01's own figure), so the K-press
     demo rings the LESSON'S OWN laptop rather than a laptop drawn from
     scratch, and if the kit's laptop ever changes, this film's does too.

     This file: the palette, the laptop placement helpers, the title motif,
     and the chapter "One working system" (the lesson's own key-press demo,
     step "demo", plus its own second example, the e-reader, drawn from
     LESSON["lecture"]'s sixth part on the chapter's last two beats). Every
     top-level name here starts with sif. */

  var HUE = {
    title: P.teal, system: P.gold, roles: P.blue, inputs: P.plum,
    files: P.accent, recap: P.teal
  };

  /* ---- the lesson's own laptop, placed in the film's space -------------------
     ART.figure("laptop")'s viewBox is 360 x 268; sifLX/sifLY convert one of its
     own coordinates into the box below, so a ring or a leader line lands on the
     real part rather than a guessed one. */
  var SIF_LAPTOP = { x: 30, y: 56, w: 460, h: 342 };
  function sifLX(v) { return SIF_LAPTOP.x + v * SIF_LAPTOP.w / 360; }
  function sifLY(v) { return SIF_LAPTOP.y + v * SIF_LAPTOP.h / 268; }
  var SIF_KB_AT = [157, 200];      /* the keyboard part's own centre, in its viewBox */
  var SIF_SCREEN_AT = [180, 95];   /* the screen part's own centre */

  function sifLaptop(ringPart, ringCol, dimOthers) {
    var svg = ART.figure("laptop");
    if (ringPart) svg = ART.ring(svg, ringPart, ringCol || P.gold, 6);
    if (dimOthers) ART.parts(svg).forEach(function (p) { if (p !== ringPart) svg = ART.dim(svg, p, 0.35); });
    return ART.place(svg, SIF_LAPTOP.x, SIF_LAPTOP.y, SIF_LAPTOP.w, SIF_LAPTOP.h);
  }

  /* ==== the title motif ==========================================================
     The lesson's own laptop, small, with a keyboard for hardware on one side
     and a gear for software on the other (the title beat's own words: "Hardware,
     software, hardware"), and five small file-type dots underneath: the whole
     lesson in one picture. Deliberately NOT a hand and a sensor - those mean
     manual and automatic once the inputs chapter and the recap use them, and
     popping them in on "Hardware"/"software" here would teach that wrong pairing
     first. On the two cards (sn is null) everything is simply drawn; on the
     title chapter each piece pops in as its own words are said. */
  var SIF_FILE_DOTS = [
    { pic: "\u{1F4C4}", col: P.blue },
    { pic: "\u{1F3B5}", col: P.good },
    { pic: "\u{1F5BC}\uFE0F", col: P.plum },
    { pic: "\u{1F3AC}", col: P.accent },
    { pic: "\u{1F3AE}", col: P.gold }
  ];

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cPress = sn ? sc(sn, 0, "press") : null, cKeyboard = sn ? sc(sn, 0, "keyboard") : null, cScreen = sn ? sc(sn, 0, "screen") : null;
    var cHw1 = sn ? sc(sn, 1, "hw1") : null, cSw1 = sn ? sc(sn, 1, "sw1") : null, cSys = sn ? sc(sn, 1, "system") : null;
    out += R(6, 10, 348, 340, 26, P.card, P.line, 3);
    /* the laptop, small, at the card's centre. It scales the mini box by
       300/360 and 222/268, so the keyboard's own ripple lands on its own key. */
    var lapSvg = ART.figure("laptop");
    var lp = sn ? Math.min(1, popIn(t, cPress, 0.6)) : 1;
    if (lp > 0) {
      var lapMarked = fecPastSafe(t, cScreen) || !sn ? ART.ring(lapSvg, "screen", P.gold, 8) : lapSvg;
      out += G(ART.place(lapMarked, 30, 96, 300, 222), { opacity: lp });
      out += MK.ripple(30 + SIF_KB_AT[0] * 300 / 360, 96 + SIF_KB_AT[1] * 222 / 268, t, cKeyboard, P.gold);
      if (sn ? fecPastSafe(t, cScreen) : true) out += Tx(180, 168, "K", "lab huge hue", "middle", { fill: P.gold, "font-size": 30 });
    }
    /* hardware: a keyboard (the same icon the system chapter's "Hardware
       alone" myth uses) - NOT the hand, which means manual input from the
       inputs chapter on and would teach hand=hardware, sensor=software a
       beat before hand=manual, sensor=automatic is the real pairing. */
    var hp = sn ? popIn(t, cHw1, 0.4) : 1;
    if (hp > 0) out += MK.pop(Em(56, 56, 44, "⌨️"), 56, 56, hp);
    /* software: a gear (the same icon the system chapter's "operating
       system" and "Software alone" myth use) */
    var sp = sn ? popIn(t, cSw1, 0.4) : 1;
    if (sp > 0) out += MK.pop(Em(304, 56, 44, "⚙️"), 304, 56, sp);
    /* five small file types, in a row */
    var fp = sn ? popIn(t, cSys, 0.42) : 1;
    if (fp > 0) SIF_FILE_DOTS.forEach(function (d, k) {
      var x = 84 + k * 48;
      out += G(C(x, 314, 18, P.cell, d.col, 2) + Em(x, 315, 20, d.pic), { opacity: Math.min(1, fp) });
    });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A laptop with a K on its screen, a keyboard for hardware, a gear for software, and five file types in a row">' +
      out + "</svg>";
  }
  /* a null-safe past(), for the title motif's use on the two cards, where sn is null */
  function fecPastSafe(t, at) { return at != null && t >= at; }

  /* ==== chapter: one working system ===============================================
     The lesson's own key-press demo. First the two "alone" myths, each in its
     own panel; then the real chain, on the lesson's own laptop: the keyboard
     senses K, a signal runs to the software (the operating system and the
     app), and the screen shows the letter. */
  var SIF_MYTH_HW = { x: 560, y: 84, w: 260, h: 264 };
  var SIF_MYTH_SW = { x: 868, y: 84, w: 260, h: 264 };
  var SIF_SOFT = { x: 590, y: 104, w: 520, h: 224 };
  /* the e-reader, beats 6-7: a device with a screen, centred in the box */
  var SIF_ER = { x: 464, y: 50, w: 240, h: 320 };

  function sifSystemChapter(scene, beat, t, i) {
    var cKbword = sc(scene, 0, "kbword"), cNoSoftware = sc(scene, 0, "nosoftware"), cButtons = sc(scene, 0, "buttons");
    var cProgram = sc(scene, 1, "program"), cNoHardware = sc(scene, 1, "nohardware"), cNowhere = sc(scene, 1, "nowhere");
    var cPressk = sc(scene, 2, "pressk"), cKbhw = sc(scene, 2, "kbhw"), cSignal = sc(scene, 2, "signal");
    var cOs = sc(scene, 3, "os"), cApp = sc(scene, 3, "app"), cDecide = sc(scene, 3, "decide");
    var cScreenhw = sc(scene, 4, "screenhw"), cShowsk = sc(scene, 4, "showsk"), cCombine = sc(scene, 4, "combine");
    /* beats 5-6: the lesson's own second example of a system, appended after
       LESSON["lecture"]'s first four parts - the e-reader (LESSON["lecture"]
       part 6, "Hardware and software, working as one system"). */
    var cEreader = sc(scene, 5, "ereader"), cSysT2 = sc(scene, 5, "sysT2"), cHw3 = sc(scene, 5, "hw3"),
      cSw4 = sc(scene, 5, "sw4"), cPage = sc(scene, 5, "page");
    var cNoSoftware2 = sc(scene, 6, "nosoftware2"), cNoShow = sc(scene, 6, "noshow"),
      cNoScreen2 = sc(scene, 6, "noscreen2"), cNowhere2 = sc(scene, 6, "nowhere2");
    var out = "", toReal = into(t, scene.first + 2), toEreader = into(t, scene.first + 5), chain = "";

    /* ---- the two myths, side by side, fading out once the real chain starts ---- */
    if (toReal < 1) {
      var hwOn = on(t, cKbword, 0.5) * (1 - toReal), swOn = on(t, cProgram, 0.5) * (1 - toReal);
      if (hwOn > 0) {
        chain += G(R(SIF_MYTH_HW.x, SIF_MYTH_HW.y, SIF_MYTH_HW.w, SIF_MYTH_HW.h, 22, P.card, P.bad, 3) +
          Em(SIF_MYTH_HW.x + SIF_MYTH_HW.w / 2, SIF_MYTH_HW.y + 88, 76, "⌨️") +
          Tx(SIF_MYTH_HW.x + SIF_MYTH_HW.w / 2, SIF_MYTH_HW.y + 150, "Hardware alone", "lab big", "middle"),
          { opacity: hwOn });
        /* "no software": a crossed gear, before the buttons pill lands */
        chain += MK.cross(SIF_MYTH_HW.x + SIF_MYTH_HW.w - 34, SIF_MYTH_HW.y + 34, 22,
          popIn(t, cNoSoftware, 0.4) * (1 - fecPastSafe(t, cButtons)));
        var btp = popIn(t, cButtons, 0.42);
        if (btp > 0) chain += G(R(SIF_MYTH_HW.x + 18, SIF_MYTH_HW.y + 172, SIF_MYTH_HW.w - 36, 66, 16, P.cell, P.bad, 2) +
          Tx(SIF_MYTH_HW.x + SIF_MYTH_HW.w / 2, SIF_MYTH_HW.y + 202, "a box of buttons", "lab mid muted readable", "middle") +
          MK.cross(SIF_MYTH_HW.x + SIF_MYTH_HW.w - 30, SIF_MYTH_HW.y + 182, 22, Math.min(1, btp)),
          { opacity: Math.min(1, btp) * hwOn });
      }
      if (swOn > 0) {
        chain += G(R(SIF_MYTH_SW.x, SIF_MYTH_SW.y, SIF_MYTH_SW.w, SIF_MYTH_SW.h, 22, P.card, P.bad, 3) +
          Em(SIF_MYTH_SW.x + SIF_MYTH_SW.w / 2, SIF_MYTH_SW.y + 88, 76, "⚙️") +
          Tx(SIF_MYTH_SW.x + SIF_MYTH_SW.w / 2, SIF_MYTH_SW.y + 150, "Software alone", "lab big", "middle"),
          { opacity: swOn });
        /* "no hardware": a crossed keyboard, before the nowhere-to-run pill lands */
        chain += MK.cross(SIF_MYTH_SW.x + SIF_MYTH_SW.w - 34, SIF_MYTH_SW.y + 34, 22,
          popIn(t, cNoHardware, 0.4) * (1 - fecPastSafe(t, cNowhere)));
        var nwp = popIn(t, cNowhere, 0.42);
        if (nwp > 0) chain += G(R(SIF_MYTH_SW.x + 18, SIF_MYTH_SW.y + 172, SIF_MYTH_SW.w - 36, 66, 16, P.cell, P.bad, 2) +
          Tx(SIF_MYTH_SW.x + SIF_MYTH_SW.w / 2, SIF_MYTH_SW.y + 202, "nowhere to run", "lab mid muted readable", "middle") +
          MK.cross(SIF_MYTH_SW.x + SIF_MYTH_SW.w - 30, SIF_MYTH_SW.y + 182, 22, Math.min(1, nwp)),
          { opacity: Math.min(1, nwp) * swOn });
      }
    }

    /* ---- the real chain: the lesson's own laptop, then the software zone ---- */
    if (toReal > 0) {
      var kbRing = fecPastSafe(t, cPressk) && !fecPastSafe(t, cScreenhw);
      var scRing = fecPastSafe(t, cScreenhw);
      var lap = sifLaptop(scRing ? "screen" : kbRing ? "keyboard" : null, P.gold, false);
      chain += G(lap, { opacity: toReal });
      /* computing.js's own laptop figure permanently bakes the word "hello"
         into the screen at its own (180, 102): converted into this chapter's
         placed box that lands within a few px of where this chapter's own K
         is drawn (sifLX(180), sifLY(95)) - so once the K appears the screen
         read "hKo"/"heKlo". Cover the baked word with a small opaque rect in
         the screen's own colour (computing.js's inner-screen fill, #0B1D2C)
         before the K is drawn, so the two can never overlap. */
      chain += R(sifLX(130), sifLY(84), 100 * SIF_LAPTOP.w / 360, 28 * SIF_LAPTOP.h / 268, 4, "#0B1D2C", "none", 0,
        { opacity: toReal });
      if (fecPastSafe(t, cShowsk)) chain += G(Tx(sifLX(SIF_SCREEN_AT[0]), sifLY(SIF_SCREEN_AT[1]) + 8, "K", "lab huge hue", "middle",
        { fill: P.gold, "font-size": 34 }), { opacity: Math.min(1, popIn(t, cShowsk, 0.35)) });
      chain += MK.ripple(sifLX(SIF_KB_AT[0]), sifLY(SIF_KB_AT[1]), t, cPressk, P.gold);
      chain += MK.pill(sifLX(SIF_KB_AT[0]), sifLY(SIF_KB_AT[1]) - 46, "hardware", popIn(t, cKbhw, 0.4) * (1 - on(t, cSignal, 0.4)),
        { size: 20, col: P.gold, ink: P.gold });

      /* the signal, running from the keyboard to the software zone */
      var sigU = on(t, cSignal, 0.7);
      if (sigU > 0) chain += MK.leader(sifLX(SIF_KB_AT[0]) + 40, sifLY(SIF_KB_AT[1]), SIF_SOFT.x, SIF_SOFT.y + SIF_SOFT.h / 2, sigU, P.gold) +
        (sigU < 1 ? MK.pop(Em(lerp(sifLX(SIF_KB_AT[0]) + 40, SIF_SOFT.x, sigU), lerp(sifLY(SIF_KB_AT[1]), SIF_SOFT.y + SIF_SOFT.h / 2, sigU), 34, "⚡"),
          lerp(sifLX(SIF_KB_AT[0]) + 40, SIF_SOFT.x, sigU), lerp(sifLY(SIF_KB_AT[1]), SIF_SOFT.y + SIF_SOFT.h / 2, sigU), 1) : "");

      /* the software zone: the operating system, and the app */
      var osOn = on(t, cOs, 0.5), appOn = on(t, cApp, 0.5);
      if (osOn > 0 || appOn > 0) {
        chain += G(R(SIF_SOFT.x, SIF_SOFT.y, SIF_SOFT.w, SIF_SOFT.h, 22, P.card, P.blue, 3),
          { opacity: Math.max(osOn, appOn) });
        if (osOn > 0) chain += MK.pop(Em(SIF_SOFT.x + 140, SIF_SOFT.y + 96, 70, "⚙️"), SIF_SOFT.x + 140, SIF_SOFT.y + 96, Math.min(1, osOn)) +
          Tx(SIF_SOFT.x + 140, SIF_SOFT.y + 172, "operating system", "lab mid", "middle", { opacity: osOn });
        if (appOn > 0) chain += MK.pop(Em(SIF_SOFT.x + 380, SIF_SOFT.y + 96, 70, "\u{1F4DD}"), SIF_SOFT.x + 380, SIF_SOFT.y + 96, Math.min(1, appOn)) +
          Tx(SIF_SOFT.x + 380, SIF_SOFT.y + 172, "the app", "lab mid", "middle", { opacity: appOn });
        chain += MK.pill(SIF_SOFT.x + SIF_SOFT.w / 2, SIF_SOFT.y - 20, "software", on(t, cDecide, 0.5), { size: 22, col: P.blue, ink: P.blue });
      }

      /* combine: hardware and software, one system */
      var cb = bump(t, cCombine, 1.2);
      if (cb > 0) chain += R(SIF_LAPTOP.x - 8, SIF_LAPTOP.y - 8, (SIF_SOFT.x + SIF_SOFT.w) - SIF_LAPTOP.x + 16,
        SIF_LAPTOP.h + 16, 26, "none", P.good, 5, { opacity: cb });
      chain += MK.tick(SIF_SOFT.x + SIF_SOFT.w - 24, SIF_LAPTOP.y - 10, 26, popIn(t, cCombine, 0.4));
    }
    /* the K-press chain fades out once beat 6 ("An e-reader is a system too...")
       starts, making room for the film's second system example. */
    out += G(chain, { opacity: Math.max(0, 1 - toEreader) });

    /* ---- beats 6-7: the e-reader, the lesson's own second system --------------
       A device with a screen (hardware) and a page of text drawn in it
       (software). Beat 7 runs the same "alone" idea the chapter opened with,
       on this second example: cross the page for "no software", then cross
       the case and set the page adrift for "no screen". */
    if (toEreader > 0) {
      var caseCrossed = fecPastSafe(t, cNoScreen2);
      var pageHidden = fecPastSafe(t, cNoShow) && !caseCrossed;
      var erOn = popIn(t, cEreader, 0.5);
      if (erOn > 0) {
        out += G(R(SIF_ER.x, SIF_ER.y, SIF_ER.w, SIF_ER.h, 20, P.card, P.gold, 3) +
          R(SIF_ER.x + 18, SIF_ER.y + 18, SIF_ER.w - 36, SIF_ER.h - 60, 10, P.cell, P.line, 2),
          { opacity: Math.min(1, erOn) * (caseCrossed ? 0.3 : 1) });
        out += Tx(SIF_ER.x + SIF_ER.w / 2, SIF_ER.y + SIF_ER.h - 20, "e-reader", "lab mid", "middle",
          { opacity: Math.min(1, erOn) * toEreader });
      }
      /* the page: five lines of "text" inside the screen */
      var lineOn = (pageHidden || caseCrossed) ? 0 : Math.min(1, popIn(t, cPage, 0.45));
      if (lineOn > 0) [0, 1, 2, 3, 4].forEach(function (r) {
        out += R(SIF_ER.x + 34, SIF_ER.y + 40 + r * 26, SIF_ER.w - 68, 14, 5, P.blue, "none", 0, { opacity: lineOn });
      });
      out += MK.cross(SIF_ER.x + SIF_ER.w / 2, SIF_ER.y + 130, 30, caseCrossed ? 0 : popIn(t, cNoSoftware2, 0.4));
      out += MK.pill(SIF_ER.x + SIF_ER.w / 2, SIF_ER.y - 24, "hardware", (caseCrossed ? 0 : 1) * popIn(t, cHw3, 0.4),
        { size: 20, col: P.gold, ink: P.gold });
      out += MK.pill(SIF_ER.x + SIF_ER.w / 2, SIF_ER.y + SIF_ER.h + 24, "software",
        (pageHidden || caseCrossed ? 0 : 1) * popIn(t, cSw4, 0.4), { size: 20, col: P.blue, ink: P.blue });
      out += MK.tick(SIF_ER.x + SIF_ER.w - 20, SIF_ER.y - 10, 22, (caseCrossed ? 0 : 1) * popIn(t, cSysT2, 0.4));
      /* "no screen": the whole case crossed out */
      out += MK.cross(SIF_ER.x + SIF_ER.w / 2, SIF_ER.y + SIF_ER.h / 2, 46, popIn(t, cNoScreen2, 0.45));
      /* "software has nowhere to go": the page's lines float free beside the crossed case */
      if (caseCrossed) {
        var flOn = Math.min(1, popIn(t, cNowhere2, 0.4));
        [0, 1, 2].forEach(function (r) {
          out += R(SIF_ER.x + SIF_ER.w + 40, SIF_ER.y + 60 + r * 26, 140, 14, 5, P.blue, "none", 0, { opacity: flOn });
        });
        out += MK.qmark(SIF_ER.x + SIF_ER.w + 110, SIF_ER.y + 30, 22, flOn);
      }
    }
    return svg(out);
  }
