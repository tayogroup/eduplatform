  /* ==== Hardware and Software, part 3 ==========================================
     The three chapters that are not one of the lesson's figures - what makes a
     device user-friendly, the direction the information goes, and the barcode
     reader that looks instead of being typed at - and the recap.
     The devices here are drawn, because the lesson kit draws only the laptop
     and the tablet, and both are already on screen in part 2. */

  /* ---- chapter: made so anybody can use it ------------------------------------ */

  var HS_DEV = { x: 56, y: 30, w: 440, h: 330 };
  var HS_SCR = { x: 76, y: 54, w: 400, h: 286 };
  /* the six icons on the device's screen, in the lesson's own sense of an icon:
     a little picture that says what the program is */
  var HS_ICONS = [
    { cx: 142.7, cy: 125.5, pic: "✉\u{FE0F}", label: "mail" },
    { cx: 276, cy: 125.5, pic: "\u{1F4F7}", label: "photos" },
    { cx: 409.3, cy: 125.5, pic: "\u{1F3A8}", label: "drawing" },
    { cx: 142.7, cy: 268.5, pic: "\u{1F3B5}", label: "music" },
    { cx: 276, cy: 268.5, pic: "\u{1F4D6}", label: "a reading app" },
    { cx: 409.3, cy: 268.5, pic: "\u{1F3E0}", label: "home" }
  ];
  var HS_TILE = 108;

  function hsIcon(k, o, col, big) {
    if (!(o > 0)) return "";
    var it = HS_ICONS[k], s = HS_TILE * (big || 1);
    return G(R(it.cx - s / 2, it.cy - s / 2, s, s, s * 0.24, P.cell, col || P.line, col ? 4 : 2) +
      Em(it.cx, it.cy, s * 0.52, it.pic),
      { transform: around(it.cx, it.cy, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function hsFriendlyChapter(scene, beat, t, i) {
    var cFriendly = sc(scene, 0, "friendly"), cTaught = sc(scene, 0, "taught");
    var cIcon = sc(scene, 1, "icon"), cPress = sc(scene, 1, "press"), cProgram = sc(scene, 1, "program");
    var cEnv = sc(scene, 2, "envelope"), cCam = sc(scene, 2, "camera"), cRead = sc(scene, 2, "reading");
    var cBig = sc(scene, 3, "big"), cFinger = sc(scene, 3, "finger"), cPoint = sc(scene, 3, "point");
    var cVoice = sc(scene, 4, "voice"), cDes = sc(scene, 4, "designers");
    var out = "", k;

    /* the device, and its six icons */
    var lit = popIn(t, cDes, 0.5);
    out += R(HS_DEV.x, HS_DEV.y, HS_DEV.w, HS_DEV.h, 26, P.body, lit > 0 ? P.good : P.edge, lit > 0 ? 5 : 4);
    out += R(HS_SCR.x, HS_SCR.y, HS_SCR.w, HS_SCR.h, 10, P.night);
    var shown = tally(t, BEATS[scene.first].start + 0.1, 6, 1.0);
    for (k = 0; k < 6; k++) {
      if (k >= shown) continue;
      var col = null, big = 1;
      /* a ring belongs to the beat that names it: nothing is left ringed after */
      if (k === 2 && hsPast(t, cIcon) && hsOnly(t, scene, 1) > 0.5) col = P.gold;
      if (k === 0 && hsPast(t, cEnv) && hsOnly(t, scene, 2) > 0.5) col = P.gold;
      if (k === 1 && hsPast(t, cCam) && hsOnly(t, scene, 2) > 0.5) col = P.gold;
      if (k === 5 && hsPast(t, cBig) && hsOnly(t, scene, 3) > 0.5) { col = P.good; big = 1.18; }
      out += hsIcon(k, 1, col, big);
    }
    /* an icon is the little picture you press to open a program */
    var o1 = hsOnly(t, scene, 1);
    if (o1 > 0) {
      out += G(MK.glow(HS_ICONS[2].cx, HS_ICONS[2].cy, 110, P.gold, on(t, cProgram, 0.6)) +
        MK.pill(HS_ICONS[2].cx, 388, "icon", popIn(t, cIcon, 0.4), { size: 22, col: P.gold, ink: P.gold }) +
        MK.finger(HS_ICONS[2].cx - 6, HS_ICONS[2].cy + 22, popIn(t, cPress, 0.4)), { opacity: o1 });
      out += MK.ripple(HS_ICONS[2].cx, HS_ICONS[2].cy, t, cPress, P.gold);
    }
    /* an envelope for mail, a camera for photos */
    var o2 = hsOnly(t, scene, 2);
    if (o2 > 0) {
      out += G(MK.pill(HS_ICONS[0].cx, 197, "mail", popIn(t, cEnv, 0.4), { size: 18, col: P.gold, ink: P.gold }) +
        MK.pill(HS_ICONS[1].cx, 197, "photos", popIn(t, cCam, 0.4), { size: 18, col: P.gold, ink: P.gold }),
        { opacity: o2 });
    }
    /* big buttons you can hit with a finger, and a screen you point at */
    var o3 = hsOnly(t, scene, 3);
    if (o3 > 0) {
      out += G(MK.finger(HS_ICONS[5].cx - 6, HS_ICONS[5].cy + 26, popIn(t, cFinger, 0.4)) +
        MK.finger(HS_SCR.x + HS_SCR.w / 2 - 6, HS_SCR.y + HS_SCR.h / 2, popIn(t, cPoint, 0.4)), { opacity: o3 });
      out += MK.ripple(HS_ICONS[5].cx, HS_ICONS[5].cy, t, cFinger, P.good);
      out += MK.ripple(HS_SCR.x + HS_SCR.w / 2, HS_SCR.y + HS_SCR.h / 2, t, cPoint, P.good);
      /* "a screen you point at" names the screen, so the screen is what is marked */
      out += R(HS_SCR.x - 6, HS_SCR.y - 6, HS_SCR.w + 12, HS_SCR.h + 12, 14, "none", P.good, 4,
        { opacity: o3 * on(t, cPoint, 0.5) });
    }
    /* a voice you can talk to */
    var o4 = hsOnly(t, scene, 4);
    if (o4 > 0) {
      out += G(Em(120, 400, 54, "\u{1F5E3}\u{FE0F}"), { opacity: o4 * on(t, cVoice, 0.4) });
      out += MK.waves(160, 388, t, cVoice, { dir: -0.7, spread: 1.0, reach: 120, col: P.good, until: cDes });
      out += MK.pill(340, 404, "designers made it this way", popIn(t, cDes, 0.45) * o4,
        { size: 20, col: P.good, ink: P.good });
    }

    /* what makes it user-friendly, ticked as each one is said */
    out += MK.pill(830, 40, "user-friendly", popIn(t, cFriendly, 0.45), { size: 23, col: P.good, ink: P.good });
    out += MK.list(560, 96, [
      { text: "use it without being taught", at: cTaught, mark: "tick" },
      { text: "an icon you press", at: cIcon, mark: "tick" },
      { text: "pictures, not words", at: cRead, mark: "tick" },
      { text: "big buttons for a finger", at: cBig, mark: "tick" },
      { text: "a screen you point at", at: cPoint, mark: "tick" },
      { text: "a voice you can talk to", at: cVoice, mark: "tick" }
    ], t, { lh: 60, cls: "lab", markR: 15 });
    return svg(out);
  }

  /* ---- chapter: in and out ----------------------------------------------------- */

  var HS_BOX = { x: 468, y: 164, w: 232, h: 128 };
  var HS_IN = [
    { pic: "⌨\u{FE0F}", label: "keyboard", at: "keyboard" },
    { pic: "\u{1F5B1}\u{FE0F}", label: "a mouse", at: "mouse" },
    { pic: "\u{1F3A4}", label: "a microphone", at: "mic" }
  ];
  var HS_OUT = [
    { pic: "\u{1F5A5}\u{FE0F}", label: "a screen", at: "screen" },
    { pic: "\u{1F50A}", label: "a speaker", at: "speaker" },
    { pic: "\u{1F5A8}\u{FE0F}", label: "a printer", at: "printer" }
  ];
  var HS_SIDE_Y = [116, 228, 340];

  function hsComputerBox(o, col) {
    if (!(o > 0)) return "";
    return G(R(HS_BOX.x, HS_BOX.y, HS_BOX.w, HS_BOX.h, 22, P.cell, col || P.blue, 3) +
      Em(HS_BOX.x + HS_BOX.w / 2, HS_BOX.y + 48, 46, "\u{1F4BB}") +
      Tx(HS_BOX.x + HS_BOX.w / 2, HS_BOX.y + 104, "computer", "lab big", "middle"),
      { opacity: Math.min(1, o) });
  }

  function hsInOutMain(scene, t) {
    var cIn = sc(scene, 0, "in"), cOut = sc(scene, 0, "out");
    var cInput = sc(scene, 1, "input"), cSendIn = sc(scene, 1, "sendin");
    var cOutput = sc(scene, 2, "output"), cSendOut = sc(scene, 2, "sendout");
    var cPlug = sc(scene, 3, "plugged"), cMeans = sc(scene, 3, "means");
    var out = "", k;

    out += hsComputerBox(1);

    /* the first beat: one arrow in, one arrow out, and nothing else */
    var o0 = hsOnly(t, scene, 0);
    if (o0 > 0) {
      out += G(MK.arrow(214, 228, HS_BOX.x - 12, 228, on(t, cIn, 0.8), P.good, 11) +
        Tx(310, 199, "in", "lab big good", "middle") +
        MK.arrow(HS_BOX.x + HS_BOX.w + 12, 228, 954, 228, on(t, cOut, 0.8), P.gold, 11) +
        Tx(846, 199, "out", "lab big gold", "middle"), { opacity: o0 });
    }

    /* the input devices, each with its arrow into the computer */
    var inO = hsFrom(t, scene, 1);
    if (inO > 0) {
      out += G(Tx(60, 32, "Input · information in", "lab big good", "start"), { opacity: on(t, cInput, 0.5) });
      out += MK.arrow(60, 52, 330, 52, on(t, cSendIn, 0.7), P.good, 7);
      HS_IN.forEach(function (it, m) {
        var at = sc(scene, 1, it.at), p = popIn(t, at, 0.4);
        if (!(p > 0)) return;
        out += hsTile(170, HS_SIDE_Y[m], 216, 92, it.pic, it.label, p, P.good);
        out += MK.arrow(288, HS_SIDE_Y[m], HS_BOX.x - 10, lerp(HS_SIDE_Y[m], 228, 0.72),
          on(t, at == null ? null : at + 0.22, 0.5), P.good, 7);
      });
    }

    /* the output devices, each with its arrow out of the computer */
    var outO = hsFrom(t, scene, 2);
    if (outO > 0) {
      out += G(Tx(1108, 32, "Output · information out", "lab big gold", "end"), { opacity: on(t, cOutput, 0.5) });
      out += MK.arrow(838, 52, 1108, 52, on(t, cSendOut, 0.7), P.gold, 7);
      HS_OUT.forEach(function (it, m) {
        var at = sc(scene, 2, it.at), p = popIn(t, at, 0.4);
        if (!(p > 0)) return;
        out += hsTile(998, HS_SIDE_Y[m], 216, 92, it.pic, it.label, p, P.gold);
        out += MK.arrow(HS_BOX.x + HS_BOX.w + 10, lerp(HS_SIDE_Y[m], 228, 0.72), 880, HS_SIDE_Y[m],
          on(t, at == null ? null : at + 0.22, 0.5), P.gold, 7);
      });
    }

    /* input does not mean plugged in */
    var o3 = hsOnly(t, scene, 3);
    if (o3 > 0) {
      out += G(Em(548, 352, 48, "\u{1F50C}") + MK.cross(608, 342, 22, popIn(t, cPlug, 0.4)),
        { opacity: o3 * popIn(t, cPlug, 0.5) });
      out += MK.pill(584, 406, "information going in", popIn(t, cMeans, 0.45) * o3,
        { size: 21, col: P.good, ink: P.good });
      out += G(MK.arrow(288, 228, HS_BOX.x - 10, 228, 1, P.good, 9), { opacity: o3 * bump(t, cMeans, 1.6) });
    }
    return out;
  }

  /* the last beat: one thing going in, one thing coming out */
  function hsInOutExample(scene, t) {
    var cPress = sc(scene, 4, "press"), cCtrl = sc(scene, 4, "controller");
    var cPrinter = sc(scene, 4, "printer"), cPrints = sc(scene, 4, "prints");
    var out = hsComputerBox(1);
    out += hsTile(180, 228, 216, 120, "\u{1F3AE}", "controller", popIn(t, cPress, 0.4), P.good);
    out += MK.ripple(180, 208, t, cPress, P.good);
    out += MK.arrow(296, 228, HS_BOX.x - 10, 228, on(t, cCtrl, 0.6), P.good, 9);
    out += MK.pill(392, 181, "in", popIn(t, cCtrl, 0.4), { size: 22, col: P.good, ink: P.good });
    out += hsTile(988, 228, 216, 120, "\u{1F5A8}\u{FE0F}", "printer", popIn(t, cPrinter, 0.4), P.gold);
    out += MK.arrow(HS_BOX.x + HS_BOX.w + 10, 228, 872, 228, on(t, cPrints, 0.6), P.gold, 9);
    out += MK.pill(790, 181, "out", popIn(t, cPrints, 0.4), { size: 22, col: P.gold, ink: P.gold });
    out += MK.pop(Em(988, 372, 56, "\u{1F4C4}"), 988, 372, popIn(t, cPrints == null ? null : cPrints + 0.5, 0.45));
    return out;
  }

  function hsInOutChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(hsInOutMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(hsInOutExample(scene, t), { opacity: u });
    return svg(out);
  }

  /* ---- chapter: reading instead of typing -------------------------------------- */

  /* thick, thin, thick: the pattern the lesson tells a child to go and look at */
  var HS_BARS = [7, 3, 3, 9, 3, 5, 3, 3, 8, 4, 3, 7, 3, 3, 5];
  function hsBarcode(x, y, w, h, o) {
    if (!(o > 0)) return "";
    var total = 0, k;
    for (k = 0; k < HS_BARS.length; k++) total += HS_BARS[k] + 2;
    var unit = w / total, at = x, bars = "";
    for (k = 0; k < HS_BARS.length; k++) {
      bars += R(at, y, HS_BARS[k] * unit, h, 0, P.dark);
      at += (HS_BARS[k] + 2) * unit;
    }
    return G(bars, { opacity: Math.min(1, o) });
  }

  var HS_READ_TILES = [
    { cx: 190, pic: "⌨\u{FE0F}", label: "keyboard", sub: "it has keys", at: 0, key: "keys" },
    { cx: 450, pic: "\u{1F3F7}\u{FE0F}", label: "barcode reader", sub: "no keys: it looks", at: 0, key: "look" },
    { cx: 710, pic: "\u{1F3A4}", label: "microphone", sub: "your voice goes in", at: 3, key: "mic" },
    { cx: 970, pic: "\u{1F4F7}", label: "camera", sub: "a picture goes in", at: 4, key: "camera" }
  ];

  function hsReaderChapter(scene, beat, t, i) {
    var cKeys = sc(scene, 0, "keys"), cLook = sc(scene, 0, "look");
    var cBar = sc(scene, 1, "barcode"), cStripes = sc(scene, 1, "stripes"), cPacket = sc(scene, 1, "packet");
    var cNum = sc(scene, 2, "number"), cTill = sc(scene, 2, "till"), cFast = sc(scene, 2, "faster");
    var cNever = sc(scene, 3, "never"), cMic = sc(scene, 3, "mic"), cVoice = sc(scene, 3, "voice");
    var cCam = sc(scene, 4, "camera"), cPic = sc(scene, 4, "picture"), cAll = sc(scene, 4, "all");
    var out = "", k;

    /* the packet, with the stripes drawn on it as they are named */
    var pk = hsFrom(t, scene, 1), ring = popIn(t, cPacket, 0.45);
    if (pk > 0) {
      out += G(R(90, 70, 140, 180, 8, P.paper, P.edge, 3) +
        R(90, 70, 140, 44, 8, P.teal) + Tx(160, 100, "milk", "lab dark", "middle") +
        hsBarcode(104, 176, 112, 46, on(t, cStripes, 0.6)) +
        Tx(160, 240, "barcode", "lab small dark", "middle", { opacity: on(t, cStripes, 0.6) }),
        { opacity: Math.min(1, pk) });
      if (ring > 0) out += R(82, 62, 156, 196, 12, "none", P.gold, 4,
        { transform: around(160, 160, Math.min(1.06, ring)), opacity: Math.min(1, ring) });
    }
    /* the reader, looking */
    var rd = popIn(t, cBar, 0.45);
    if (rd > 0) {
      out += G(R(300, 108, 120, 84, 14, P.body, P.edge, 3) + C(316, 150, 11, P.bad) +
        Tx(368, 158, "reader", "lab small", "middle"),
        { transform: around(360, 150, Math.min(1.06, rd)), opacity: Math.min(1, rd) });
      out += L(300, 150, 222, 199, P.bad, 5, { opacity: on(t, cStripes, 0.6) * (0.55 + 0.45 * breathe(t)) });
    }
    /* the till, and the number going straight into it */
    var tl = popIn(t, cTill, 0.45);
    if (tl > 0) {
      out += G(R(620, 50, 480, 200, 18, P.cell, P.line, 3) +
        R(650, 78, 420, 112, 10, P.night) +
        Tx(648, 70, "till", "lab mid muted", "start"),
        { transform: around(860, 150, Math.min(1.06, tl)), opacity: Math.min(1, tl) });
      out += Tx(860, 150, "5 0 4 1 9", "lab huge gold", "middle", { opacity: on(t, cTill, 0.7) });
    }
    out += MK.arrow(438, 150, 606, 150, on(t, cNum, 0.7), P.good, 8);
    out += MK.pill(522, 106, "the number", popIn(t, cNum, 0.4), { size: 20, col: P.good, ink: P.good });
    out += MK.pill(760, 220, "faster than typing", popIn(t, cFast, 0.45), { size: 21, col: P.gold, ink: P.gold });
    out += MK.tick(1042, 220, 22, popIn(t, cNever, 0.4));

    /* the four ways in, the last three of them with no keys at all */
    HS_READ_TILES.forEach(function (it, m) {
      var at = sc(scene, it.at, it.key), p = popIn(t, at, 0.4);
      if (!(p > 0)) return;
      var ringed = hsPast(t, cAll);   /* a keyboard is an input device too */
      out += hsTile(it.cx, 340, 230, 110, it.pic, it.label,
        p, ringed ? P.good : m === 0 ? null : P.gold, it.sub);
    });
    out += MK.ripple(190, 320, t, cKeys, P.muted);
    out += MK.ripple(450, 320, t, cLook, P.gold);
    out += MK.waves(710, 318, t, cVoice, { dir: -1.57, spread: 1.0, reach: 70, col: P.gold, until: cCam });
    out += MK.pop(Em(970, 268, 44, "\u{1F5BC}\u{FE0F}"), 970, 268, popIn(t, cPic, 0.45));
    out += MK.pill(710, 420, "all of them are input devices", popIn(t, cAll, 0.5),
      { size: 21, col: P.good, ink: P.good });
    return svg(out);
  }

  /* ---- what you now know -------------------------------------------------------
     The lesson's own six words, with the lesson's own pictures for them. */
  var HS_RECAP = MK.recapKind([
    { beat: 0, at: "hardware", title: "Hardware", sub: "the parts you can touch", pic: "\u{1F5A5}\u{FE0F}" },
    { beat: 0, at: "software", title: "Software", sub: "the programs that run", pic: "\u{1F4BF}" },
    { beat: 1, at: "function", title: "Function", sub: "the job a part or app does", pic: "⚙\u{FE0F}" },
    { beat: 2, at: "input", title: "Input", sub: "information goes in", pic: "⬇\u{FE0F}" },
    { beat: 2, at: "output", title: "Output", sub: "information comes out", pic: "⬆\u{FE0F}" },
    { beat: 3, at: "friendly", title: "User-friendly", sub: "easy without a lesson", pic: "\u{1F44D}" }
  ], { goBeat: 3, goAt: "friendly" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Hardware you can touch. Software you cannot.",
      "What every part of a laptop and a tablet does",
      "Which way the information goes: in, or out"
    ] }),
    hardware: hsHardwareChapter, job: hsJobChapter, tablet: hsTabletChapter,
    friendly: hsFriendlyChapter, inout: hsInOutChapter, reader: hsReaderChapter,
    recap: HS_RECAP
  };
