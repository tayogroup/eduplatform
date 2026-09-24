  /* ==== Hardware and Software, part 2 ==========================================
     The two figure chapters: the laptop's six parts and their jobs, and the
     tablet that is made to be easy. Both figures are the LESSON'S OWN
     (ART.figure), and every point is the lesson's own ring on that part -
     gold while it is being named, green once it has been, exactly as
     computing.css rings a part the child has found. */

  /* ---- chapter: every part has a job ------------------------------------------- */

  var HS_LAP = { x: 24, y: 40, w: 470, h: 350 };   /* the laptop figure is 360 x 268 */
  function hsLX(v) { return HS_LAP.x + v * HS_LAP.w / 360; }
  function hsLY(v) { return HS_LAP.y + v * HS_LAP.h / 268; }

  var HS_ROW = { x: 560, w: 580, h: 56, gap: 10 };
  function hsRowY(k) { return (440 - 6 * HS_ROW.h - 5 * HS_ROW.gap) / 2 + k * (HS_ROW.h + HS_ROW.gap); }

  /* the lesson's touchpad: a pad with a finger's dot on it, drawn rather than
     borrowed from the emoji font, which has no touchpad */
  function hsTouchpadArt(cx, cy, s) {
    return R(cx - s * 0.42, cy - s * 0.34, s * 0.84, s * 0.68, s * 0.14, P.plastic, P.edge, 2) +
      C(cx + s * 0.12, cy, s * 0.11, P.body);
  }

  /* The six parts, in the order the lesson's own step lists them, each with the
     job that step gives it. */
  var HS_PARTS = [
    { id: "screen", beat: 1, at: "screen", jobAt: "shows", name: "screen", job: "shows pictures and words", pic: "\u{1F5A5}️", px: 180, py: 95 },
    { id: "keyboard", beat: 1, at: "keyboard", jobAt: "letters", name: "keyboard", job: "puts letters in", pic: "⌨️", px: 157, py: 200 },
    { id: "touchpad", beat: 2, at: "touchpad", jobAt: "pointer", name: "touchpad", job: "moves the pointer", pic: "pad", px: 302, py: 201 },
    { id: "camera", beat: 2, at: "camera", jobAt: "photos", name: "camera", job: "takes pictures", pic: "\u{1F4F7}", px: 180, py: 26 },
    { id: "speaker", beat: 3, at: "speaker", jobAt: "sound", name: "speaker", job: "makes sound", pic: "\u{1F50A}", px: 307, py: 247 },
    { id: "port", beat: 3, at: "port", jobAt: "port", name: "charging port", job: "the charger goes in", pic: "\u{1F50C}", px: 41, py: 247 }
  ];

  function hsJobRow(k, part, o, col, jobO) {
    if (!(o > 0)) return "";
    var y = hsRowY(k), cy = y + HS_ROW.h / 2;
    var body = R(HS_ROW.x, y, HS_ROW.w, HS_ROW.h, 16, P.cell, col || P.line, col ? 3.5 : 2);
    body += part.pic === "pad" ? hsTouchpadArt(HS_ROW.x + 34, cy, 38) : MK.pic(HS_ROW.x + 34, cy, 34, part.pic);
    body += Tx(HS_ROW.x + 68, cy + 8, part.name, "lab", "start", { fill: col || P.gold });
    if (jobO > 0) body += Tx(HS_ROW.x + 240, cy + 7, part.job, "lab mid muted readable", "start", { opacity: Math.min(1, jobO) });
    return G(body, { opacity: Math.min(1, o) });
  }

  function hsJobSlot(k, o) {
    if (!(o > 0)) return "";
    var y = hsRowY(k);
    return R(HS_ROW.x, y, HS_ROW.w, HS_ROW.h, 16, P.card, P.line, 2, { "stroke-dasharray": "10 8", opacity: Math.min(1, o) });
  }

  function hsJobChapter(scene, beat, t, i) {
    var cPart = sc(scene, 0, "part"), cJob = sc(scene, 0, "job"), cFn = sc(scene, 0, "function");
    var cSix = sc(scene, 4, "six"), cJobs = sc(scene, 4, "jobs"), cName = sc(scene, 4, "name"), cFn2 = sc(scene, 4, "function");
    var cCharger = sc(scene, 3, "charger");
    var out = "", k;

    /* which part is being named now, and which have been */
    var at = HS_PARTS.map(function (p) { return sc(scene, p.beat, p.at); });
    var jobAt = HS_PARTS.map(function (p) { return sc(scene, p.beat, p.jobAt); });
    var current = -1;
    for (k = 0; k < at.length; k++) if (hsPast(t, at[k])) current = k;
    var all = hsFrom(t, scene, 4);   /* the last beat: every part named */

    /* the lesson's laptop, ringed one part at a time */
    var lap = ART.figure("laptop");
    for (k = 0; k < HS_PARTS.length; k++) {
      if (all > 0.5) lap = ART.ring(lap, HS_PARTS[k].id, P.good, 4);
      else if (k === current) lap = ART.ring(lap, HS_PARTS[k].id, P.gold, 6);
      else if (hsPast(t, at[k])) lap = ART.ring(lap, HS_PARTS[k].id, P.good, 3);
    }
    out += ART.place(lap, HS_LAP.x, HS_LAP.y, HS_LAP.w, HS_LAP.h);

    /* "every part": a dot on each one, counted in, before any is named */
    var dots = (1 - on(t, at[0], 0.5)) * on(t, cPart, 0.3);
    if (dots > 0) {
      var n = tally(t, cPart, 6, 1.1);
      for (k = 0; k < n; k++) out += C(hsLX(HS_PARTS[k].px), hsLY(HS_PARTS[k].py), 9, P.gold, P.ground, 2, { opacity: dots });
    }

    /* the term this chapter teaches, and the six rows it fills */
    out += MK.pill(259, 26, "function = the job it does", clamp(on(t, cFn, 0.5) * (1 + 0.3 * bump(t, cFn2, 1.2)), 0, 1),
      { size: 21, col: P.accent, ink: P.accent });
    for (k = 0; k < 6; k++) {
      var o = on(t, at[k], 0.45);
      out += hsJobSlot(k, on(t, cJob, 0.5) * (1 - o));
      out += hsJobRow(k, HS_PARTS[k], o,
        all > 0.5 ? P.good : k === current ? P.gold : null, on(t, jobAt[k], 0.45));
    }

    /* the line from the part being named to its row */
    if (current >= 0 && all < 0.5) {
      var p = HS_PARTS[current], y = hsRowY(current) + HS_ROW.h / 2;
      out += MK.leader(hsLX(p.px), hsLY(p.py), HS_ROW.x - 12, y, on(t, at[current], 0.5), P.gold);
      out += MK.ripple(hsLX(p.px), hsLY(p.py), t, at[current], P.gold);
    }

    /* the charger, plugged into the charging port as the two are said */
    var ch = hsOnly(t, scene, 3) * clamp(popIn(t, cCharger, 0.4), 0, 1);
    if (ch > 0) {
      var pu = on(t, at[5], 0.6);
      out += G(Em(lerp(36, hsLX(41), pu), lerp(406, hsLY(247) + 5, pu), 40, "\u{1F50C}"), { opacity: ch });
    }

    /* six parts, six jobs */
    if (all > 0) {
      out += MK.pill(259, 420, "six parts, six jobs", popIn(t, cSix, 0.4), { size: 21, col: P.good, ink: P.good });
      for (k = 0; k < 6; k++) out += MK.tick(HS_ROW.x + HS_ROW.w - 30, hsRowY(k) + HS_ROW.h / 2, 18,
        popIn(t, cJobs == null ? null : cJobs + k * 0.12, 0.35));
      out += MK.finger(hsLX(HS_PARTS[0].px) - 6, hsLY(HS_PARTS[0].py) + 26, popIn(t, cName, 0.4));
    }
    return svg(out);
  }

  /* ---- chapter: a tablet made to be easy ---------------------------------------- */

  var HS_TB = { x: 440, y: 24, w: 270, h: 392 };   /* the tablet figure is 260 x 378 */
  function hsBX(v) { return HS_TB.x + v * HS_TB.w / 260; }
  function hsBY(v) { return HS_TB.y + v * HS_TB.h / 378; }
  var HS_TB_PART = {
    screen: [130, 179], camera: [130, 28], home: [130, 334],
    volume: [14, 120], port: [130, 363], speaker: [78, 335]
  };
  var HS_TB_ORDER = ["screen", "camera", "home", "volume", "speaker", "port"];

  /* the three things a touchscreen does at once, in the lesson's own order */
  var HS_THREE = [
    { pic: "⌨️", label: "the keyboard", at: "keyboard" },
    { pic: "\u{1F5B1}️", label: "the mouse", at: "mouse" },
    { pic: "\u{1F5A5}️", label: "the screen", at: "screen" }
  ];
  var HS_THREE_Y = [70, 200, 330];

  function hsEasyCard(cx, cy, w, h, art, title, sub, o, col) {
    if (!(o > 0)) return "";
    return G(R(cx - w / 2, cy - h / 2, w, h, 20, P.cell, col || P.line, col ? 3.5 : 2) +
      art + Tx(cx, cy + h * 0.16, title, "lab big", "middle", { fill: col || P.ink }) +
      Tx(cx, cy + h * 0.38, sub, "lab mid muted readable", "middle"),
      { transform: around(cx, cy, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }

  function hsTabletChapter(scene, beat, t, i) {
    var cTab = sc(scene, 0, "tablet"), cEasy = sc(scene, 0, "easy"), cParts = sc(scene, 0, "parts");
    var cTouch = sc(scene, 1, "touchscreen"), cOne = sc(scene, 1, "one");
    var cHome = sc(scene, 2, "home"), cStart = sc(scene, 2, "start");
    var cVol = sc(scene, 3, "volume"), cStick = sc(scene, 3, "stick"), cLook = sc(scene, 3, "looking");
    var out = "", k;

    /* the lesson's tablet, with the part being named ringed */
    var tab = ART.figure("tablet");
    if (hsPast(t, cVol)) tab = ART.ring(tab, "volume", P.gold, 6);
    if (hsPast(t, cHome)) tab = ART.ring(tab, "home", hsPast(t, cVol) ? P.good : P.gold, hsPast(t, cVol) ? 4 : 6);
    if (hsPast(t, cTouch)) tab = ART.ring(tab, "screen", hsPast(t, cHome) ? P.good : P.gold, hsPast(t, cHome) ? 4 : 6);
    out += G(ART.place(tab, HS_TB.x, HS_TB.y, HS_TB.w, HS_TB.h), { opacity: on(t, cTab, 0.5) });

    /* "look at its parts": one dot on each part of the tablet */
    var dots = on(t, cParts, 0.3) * (1 - on(t, cTouch, 0.5));
    if (dots > 0) {
      var n = tally(t, cParts, 6, 1.0);
      for (k = 0; k < n; k++) {
        var pt = HS_TB_PART[HS_TB_ORDER[k]];
        out += C(hsBX(pt[0]), hsBY(pt[1]), 8, P.plum, P.ground, 2, { opacity: dots });
      }
    }
    out += MK.pill(180, 210, "made to be easy to use", on(t, cEasy, 0.5) * (1 - on(t, cTouch, 0.5)),
      { size: 22, col: P.plum, ink: P.plum });

    /* the keyboard, the mouse and the screen, flying into the one touchscreen */
    var fly = on(t, cOne, 0.45);
    HS_THREE.forEach(function (it, m) {
      var p = popIn(t, sc(scene, 1, it.at), 0.4);
      if (!(p > 0)) return;
      var cx = lerp(180, hsBX(130), fly), cy = lerp(HS_THREE_Y[m], hsBY(179), fly);
      out += G(hsTile(0, 0, 290, 104, it.pic, it.label, p, P.plum), { transform: tr(cx, cy, lerp(1, 0.3, fly)), opacity: 1 - fly });
    });
    out += MK.pill(180, 200, "all three in one", popIn(t, cOne == null ? null : cOne + 0.15, 0.35),
      { size: 24, col: P.gold, ink: P.gold });
    out += MK.pill(180, 258, "touchscreen", popIn(t, cOne == null ? null : cOne + 0.3, 0.35),
      { size: 22, col: P.gold, ink: P.gold });
    out += MK.ripple(hsBX(130), hsBY(179), t, cOne, P.gold);

    /* the home button: press it anywhere, and you are back at the start */
    var homeO = hsFrom(t, scene, 2);
    if (homeO > 0) {
      out += hsEasyCard(950, 128, 372, 168, MK.pic(950, 90, 56, "\u{1F3E0}"), "home button", "back to the start",
        popIn(t, cHome, 0.45), hsPast(t, cVol) ? null : P.gold);
      out += MK.leader(hsBX(130), hsBY(334), 764, 128, on(t, cHome, 0.6), P.gold);
      out += MK.ripple(hsBX(130), hsBY(334), t, cHome, P.gold);
      out += MK.finger(hsBX(130) - 6, hsBY(334) + 6, popIn(t, cHome, 0.4) * (1 - on(t, cVol, 0.4)));
      var back = on(t, cStart, 0.7) * (1 - on(t, cVol, 0.45));
      if (back > 0) {
        out += R(hsBX(36), hsBY(44), hsBX(224) - hsBX(36), hsBY(314) - hsBY(44), 8, P.good, null, null, { opacity: 0.18 * back });
        out += MK.arrow(hsBX(130), hsBY(318), hsBX(130), hsBY(210), back, P.good, 7);
      }
    }

    /* the volume buttons: they stick out, so a finger finds them */
    var volO = hsFrom(t, scene, 3);
    if (volO > 0) {
      out += hsEasyCard(950, 322, 372, 168,
        R(920, 268, 18, 40, 6, P.plastic, P.edge, 2) + R(950, 268, 18, 40, 6, P.plastic, P.edge, 2),
        "volume buttons", "found without looking", popIn(t, cVol, 0.45), P.gold);
      out += MK.arrow(300, 148, hsBX(14) - 26, 148, on(t, cStick, 0.6), P.gold, 8);
      out += MK.pill(232, 104, "they stick out", popIn(t, cStick, 0.4), { size: 21, col: P.gold, ink: P.gold });
      out += MK.finger(hsBX(14) - 4, hsBY(120) + 24, popIn(t, cVol, 0.4));
      out += MK.ripple(hsBX(14), hsBY(120), t, cVol, P.gold);
      out += MK.tick(1112, 250, 22, popIn(t, cLook, 0.4));
    }
    return svg(out);
  }
