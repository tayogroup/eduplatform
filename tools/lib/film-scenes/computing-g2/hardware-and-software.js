  /* ==== Grade 2 Computing, Lesson 10: Hardware and Software ===================
     tools/lib/film-scenes/computing-g2/hardware-and-software.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/hardware-and-software.json.

     THE LESSON'S OWN HARDWARE IS DRAWN BY THE LESSON. Every laptop and every
     tablet in this film is ART.figure("laptop") / ART.figure("tablet") - the
     kit's figures, with a data-part and an .outline on every piece - and each
     part is pointed at with ART.ring, which draws that part's own tap outline
     the way the lesson page draws it (gold while it is being named, green once
     it has been). The film draws no computer of its own anywhere.

     This file: the palette, the shared timing and tile helpers, the title
     motif, and the chapter "Hardware and software".
     Every top-level name here starts with hs, so nothing can replace a name of
     the engine, ART or MK. */

  var HUE = {
    title: P.teal, hardware: P.gold, job: P.accent, tablet: P.plum,
    friendly: P.good, inout: P.blue, reader: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function hsOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function hsFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function hsPast(t, at) { return at != null && t >= at; }

  /* ---- the tiles every chapter shares ------------------------------------------
     One card: the thing's picture with the lesson's own word under it. */
  function hsTile(cx, cy, w, h, pic, label, o, col, lab2) {
    if (!(o > 0)) return "";
    var sz = Math.min(h * 0.46, 62);
    var body = R(cx - w / 2, cy - h / 2, w, h, 18, P.cell, col || P.line, col ? 3.5 : 2) +
      MK.pic(cx, cy - h * 0.16, sz, pic) +
      Tx(cx, cy + h * (lab2 ? 0.20 : 0.34), label, "lab mid", "middle", col ? { fill: col } : null);
    if (lab2) body += Tx(cx, cy + h * 0.42, lab2, "lab small muted readable", "middle");
    return G(body, { transform: around(cx, cy, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  /* A tray: a soft panel with a heading, the two halves of the first chapter
     and the two sides of "In and out" both stand in one. */
  function hsTray(x, y, w, h, head, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 20, P.card, col || P.line, 2, { "stroke-opacity": 0.8 }) +
      Tx(x + 22, y + 34, head, "lab big", "start", { fill: col || P.muted }),
      { opacity: Math.min(1, o) });
  }

  /* ==== the title ===============================================================
     The whole lesson in one picture: a keyboard you can put a finger on, and a
     game you cannot. In the spoken title chapter the keyboard arrives on "touch
     a keyboard", the game on "touch a game", the two words label them, and the
     line underneath lands on "make a computer work". On the two cards it stands
     still. */
  function hsKeyboardArt(cx, cy, w, h, col) {
    var keys = "", cols = 6, rows = 3, kw = (w - 16) / cols - 5, kh = (h - 14) / rows - 5;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++)
      keys += R(cx - w / 2 + 8 + c * (kw + 5), cy - h / 2 + 7 + r * (kh + 5), kw, kh, 3, P.body);
    return R(cx - w / 2, cy - h / 2, w, h, 10, P.cell, col || P.line, 3) + keys;
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cKey = sn ? sc(sn, 0, "keyboard") : null, cGame = sn ? sc(sn, 0, "game") : null,
      cHard = sn ? sc(sn, 1, "hardware") : null, cSoft = sn ? sc(sn, 1, "software") : null,
      cWork = sn ? sc(sn, 1, "work") : null;
    var pA = sn ? popIn(t, cKey, 0.42) : 1, pB = sn ? popIn(t, cGame, 0.42) : 1;
    var lA = sn ? on(t, cHard, 0.45) : 1, lB = sn ? on(t, cSoft, 0.45) : 1;
    var pW = sn ? popIn(t, cWork, 0.45) : 1;

    out += R(8, 26, 344, 308, 30, P.card, P.line, 3);
    /* hardware: a keyboard, a finger on it, a tick */
    out += G(hsKeyboardArt(100, 122, 132, 66, P.good), { transform: around(100, 122, Math.min(1.08, pA)), opacity: Math.min(1, pA) });
    out += MK.finger(96, 166, pA);
    out += MK.tick(154, 182, 18, pA);
    out += MK.pill(100, 244, "hardware", lA, { size: 19, col: P.good, ink: P.good });
    /* software: a game, a finger that cannot reach it, a cross */
    out += G(R(212, 89, 100, 66, 14, P.cell, P.plum, 3) + Em(262, 122, 44, "\u{1F3AE}"),
      { transform: around(262, 122, Math.min(1.08, pB)), opacity: Math.min(1, pB) });
    out += MK.finger(236, 166, pB);
    out += MK.cross(298, 182, 18, pB);
    out += MK.pill(262, 244, "software", lB, { size: 19, col: P.plum, ink: P.plum });
    /* and the two together */
    out += MK.pill(180, 300, "a computer needs both", pW, { size: 19, col: P.teal, ink: P.teal });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A keyboard you can touch and a game you cannot">' + out + "</svg>";
  }

  /* ==== chapter: hardware and software ==========================================
     The lesson's own tablet on the left, and the lesson's own six explore items
     in two trays on the right - the three you can touch above, the programs
     below. The finger that taps the tablet's touchscreen is the lesson's ring on
     that part. At the end the two programs fly onto the tablet's screen, which
     is where the lesson says they run. */
  var HS_TAB = { x: 56, y: 34, w: 248, h: 360 };
  /* the tablet figure's viewBox is 260 x 378 */
  function hsTX(v) { return HS_TAB.x + v * HS_TAB.w / 260; }
  function hsTY(v) { return HS_TAB.y + v * HS_TAB.h / 378; }

  var HS_HW = [
    { pic: "\u{1F5A5}️", label: "screen", at: "screen" },
    { pic: "⌨️", label: "keyboard", at: "keyboard" },
    { pic: "\u{1F50A}", label: "speaker", at: "speaker" }
  ];
  var HS_SW = [
    { pic: "\u{1F3AE}", label: "a game", at: "game" },
    { pic: "\u{1F3A8}", label: "a drawing app", at: "app" }
  ];
  var HS_HW_X = [520, 740, 960], HS_SW_X = [620, 860];
  var HS_HW_Y = 150, HS_SW_Y = 342;

  function hsHardwareChapter(scene, beat, t, i) {
    var cHard = sc(scene, 0, "hardware"), cTouch = sc(scene, 0, "touch");
    var cSoft = sc(scene, 1, "software"), cProg = sc(scene, 1, "programs");
    var cPick = sc(scene, 2, "pick"), cNoPick = sc(scene, 2, "nopick");
    var cAsk = sc(scene, 3, "ask"), cNo = sc(scene, 3, "no");
    var cTab = sc(scene, 4, "tablet"), cApps = sc(scene, 4, "apps");
    var out = "";

    /* the lesson's tablet, ringed on its touchscreen as "you can touch" is said */
    var touched = on(t, cTouch, 0.4), lit = popIn(t, cTab, 0.45);
    var tab = ART.figure("tablet");
    if (touched > 0.3 || lit > 0) tab = ART.ring(tab, "screen", lit > 0 ? P.good : P.gold, lit > 0 ? 6 : 5);
    out += ART.place(tab, HS_TAB.x, HS_TAB.y, HS_TAB.w, HS_TAB.h);
    if (lit > 0) out += R(HS_TAB.x - 14, HS_TAB.y - 10, HS_TAB.w + 28, HS_TAB.h + 20, 24, "none", P.good, 4, { opacity: Math.min(1, lit) });
    out += MK.pill(180, 418, "hardware", popIn(t, cTab, 0.4), { size: 21, col: P.good, ink: P.good });
    out += MK.finger(hsTX(130), hsTY(200), touched * (1 - on(t, cPick, 0.4)));
    out += MK.ripple(hsTX(130), hsTY(179), t, cTouch, P.gold);

    /* the two trays */
    out += hsTray(360, 44, 776, 176, "Hardware · you can touch it", on(t, cHard, 0.5), P.gold);
    out += hsTray(360, 236, 776, 176, "Software · the programs", on(t, cSoft, 0.5), P.plum);
    out += MK.pill(1000, 270, "programs", popIn(t, cProg, 0.4), { size: 20, col: P.plum, ink: P.plum });

    HS_HW.forEach(function (it, k) {
      out += hsTile(HS_HW_X[k], HS_HW_Y, 188, 96, it.pic, it.label, popIn(t, sc(scene, 0, it.at), 0.4), P.gold);
    });

    /* the programs sit in their tray, and at the end fly onto the tablet screen */
    var fly = on(t, cApps, 0.8);
    HS_SW.forEach(function (it, k) {
      var p = popIn(t, sc(scene, 1, it.at), 0.4);
      if (!(p > 0)) return;
      var cx = lerp(HS_SW_X[k], hsTX(130) + (k === 0 ? -46 : 46), fly);
      var cy = lerp(HS_SW_Y, hsTY(179), fly);
      var s = lerp(1, 0.34, fly);
      out += G(hsTile(0, 0, 188, 96, it.pic, it.label, p, P.plum), { transform: tr(cx, cy, s) });
    });
    out += MK.pill(748, 330, "software running on it", popIn(t, cApps == null ? null : cApps + 0.5, 0.45),
      { size: 21, col: P.plum, ink: P.plum });

    /* you can pick up a keyboard; you cannot pick up a game */
    var only2 = hsOnly(t, scene, 2);
    if (only2 > 0) {
      out += G(MK.finger(HS_HW_X[1] - 4, HS_HW_Y + 54, popIn(t, cPick, 0.4)) +
        MK.tick(HS_HW_X[1] + 80, HS_HW_Y - 40, 21, popIn(t, cPick, 0.4)) +
        MK.finger(HS_SW_X[0] - 4, HS_SW_Y + 34, popIn(t, cNoPick, 0.4)) +
        MK.cross(HS_SW_X[0] + 80, HS_SW_Y - 40, 21, popIn(t, cNoPick, 0.4)), { opacity: only2 });
    }

    /* is the drawing app the same thing as the tablet? no */
    var only3 = hsOnly(t, scene, 3);
    if (only3 > 0) {
      var au = on(t, cAsk, 0.7);
      var nou = popIn(t, cNo, 0.4);
      out += G(MK.leader(HS_SW_X[1] - 96, HS_SW_Y, 312, 214, au, P.gold) +
        MK.qmark(180, 204, 34, au * (1 - Math.min(1, nou))) +
        MK.cross(180, 204, 30, nou), { opacity: only3 });
    }
    return svg(out);
  }
