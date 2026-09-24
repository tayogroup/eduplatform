  /* ==== Grade 1 Computing, Lesson 4: Algorithm to Program, part 3 =============
     The chapters "Running and testing" and "Programs everywhere", the recap
     cards, and KINDS. */

  /* a thought bubble, for the one thing a computer cannot do */
  function apThought(cx, cy, w, h, o, tx, ty) {
    if (!(o > 0)) return "";
    return G(C(lerp(cx, tx, 0.62), lerp(cy + h / 2, ty, 0.55), 13, P.paper) +
      C(lerp(cx, tx, 0.86), lerp(cy + h / 2, ty, 0.85), 8, P.paper) +
      R(cx - w / 2, cy - h / 2, w, h, h / 2, P.paper) +
      Tx(cx, cy + h * 0.3, "?", "lab dark", "middle", { "font-size": h * 0.78 }),
      { transform: around(cx, cy, 0.9 + 0.1 * Math.min(1, o)), opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: Running and testing ==========================================
     The algorithm on the left, the program and the Run button in the middle,
     the cat on its stage on the right. Run, watch, tick each step off: that is
     testing. Then the lesson's own repair - change the block and run it again -
     and the thing the lesson says matters most: the computer cannot think. */
  var AP_T_CARD = { x: 30, y: 76, w: 310, h: 208 };
  var AP_T_LINE = [190, 250];
  var AP_T_BLK = { x: 396, w: 262, h: 66, y: [98, 182] };
  var AP_T_STAGE = { x: 690, y: 110, w: 440, h: 210 };

  function apTestChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRun = c(0, "run"), cOrder = c(0, "order");
    var cWatch = c(1, "watch"), cDid = c(1, "did");
    var cCheck = c(2, "check"), cTesting = c(2, "testing");
    var cWrong = c(3, "wrong"), cChange = c(3, "change"), cAgain = c(3, "again");
    var cThink = c(4, "think"), cTold = c(4, "told");
    var S = AP_T_STAGE, cx = S.x + S.w / 2, out = "";

    /* what the algorithm asked for */
    out += apCard(AP_T_CARD.x, AP_T_CARD.y, AP_T_CARD.w, AP_T_CARD.h, "Algorithm", 1, 0);
    for (var n = 0; n < 2; n++) {
      out += apCardLine(AP_T_CARD.x + 8, AP_T_LINE[n], n + 1, AP_C_STEPS[n], 1, bump(t, cDid == null ? null : cDid + n * 0.35, 0.7));
      var qo = on(t, cDid == null ? null : cDid + n * 0.35, 0.4) * (1 - on(t, cCheck, 0.4));
      var mx = AP_T_CARD.x + AP_T_CARD.w - 34;
      out += MK.qmark(mx, AP_T_LINE[n] - 10, 20, qo);
      out += MK.tick(mx, AP_T_LINE[n] - 10, 20, popIn(t, cCheck == null ? null : cCheck + n * 0.3, 0.4));
    }

    /* the program, and the button that runs it */
    out += R(376, 70, 300, 200, 20, "rgba(0,0,0,0.16)", P.line, 3, { "stroke-dasharray": "14 10" });
    var blkAt = [cRun == null ? null : cRun + 0.25, cRun == null ? null : cRun + 1.25];
    for (var b = 0; b < 2; b++) {
      var live = blkAt[b] != null && t >= blkAt[b] && t < blkAt[b] + 1.0;
      out += apBlock(AP_T_BLK.x, AP_T_BLK.y[b], AP_T_BLK.w, AP_T_BLK.h, AP_C_IDS[b], 1,
        { fs: 28, ring: live ? P.gold : blkAt[b] != null && t >= blkAt[b] ? P.good : null });
      out += apChip(AP_T_BLK.x - 22, AP_T_BLK.y[b] + AP_T_BLK.h / 2, 22, String(b + 1), popIn(t, cOrder == null ? null : cOrder + b * 0.25, 0.35));
    }
    var press = cRun == null || t < cRun ? 0 : clamp(1 - (t - cRun) / 0.5, 0, 1);
    out += apRunBtn(426, 296, 180, 60, 1, press);
    out += MK.ripple(460, 326, t, cRun, P.good);
    out += MK.pill(526, 44, "testing", on(t, cTesting, 0.45), { size: 30, col: P.gold });

    /* the cat, doing exactly those two blocks */
    out += apStage(S.x, S.y, S.w, S.h, 1, { squares: 2 });
    var st = { x: 0, scale: 1, spin: 0, hidden: false };
    if (blkAt[0] != null) st.x = lerp(0, AP_BUILD[1].x, on(t, blkAt[0], 0.5));
    var hop = blkAt[1] == null || t < blkAt[1] ? 0 : Math.max(0, Math.sin(Math.PI * clamp((t - blkAt[1]) / 0.62, 0, 1)));
    var hop2 = cAgain == null || t < cAgain + 0.4 ? 0 : Math.max(0, Math.sin(Math.PI * clamp((t - cAgain - 0.4) / 0.62, 0, 1)));
    out += MK.glow(cx + st.x * apSQ(S.h), apCatY(S.y, S.h), 96, P.gold, on(t, cWatch, 0.5) * (1 - on(t, cCheck, 0.6)) * (0.55 + 0.45 * breathe(t)));
    out += apCat(cx, S.y, S.h, st, Math.max(hop, hop2), 1);

    /* if it did the wrong thing, change the block and run it again */
    var fix = apOnly(t, scene, 3);
    if (fix > 0.01) {
      out += apBlock(60, 376, 170, 56, "spin", popIn(t, cWrong, 0.4) * fix, { fs: 24 });
      out += MK.cross(272, 404, 24, popIn(t, cWrong, 0.4) * fix);
      out += MK.arrow(312, 404, 382, 404, on(t, cChange, 0.45) * fix, P.gold, 7);
      out += apBlock(400, 376, 170, 56, "jump", popIn(t, cChange, 0.4) * fix, { fs: 24, ring: P.good });
      out += MK.tick(612, 404, 24, popIn(t, cChange == null ? null : cChange + 0.3, 0.35) * fix);
      out += apRunBtn(676, 378, 150, 52, on(t, cAgain, 0.4) * fix, cAgain == null || t < cAgain ? 0 : clamp(1 - (t - cAgain) / 0.5, 0, 1));
      out += MK.ripple(706, 392, t, cAgain, P.good);
    }

    /* a computer cannot think for itself */
    var mind = apOnly(t, scene, 4);
    if (mind > 0.01) {
      var th = on(t, cThink, 0.45) * mind;
      out += apThought(cx, 58, 210, 84, th, cx - 40, S.y - 4);
      out += MK.cross(cx, 58, 34, popIn(t, cThink == null ? null : cThink + 0.5, 0.4) * mind);
      out += MK.arrow(626, 390, 726, 390, on(t, cTold, 0.5) * mind, P.gold, 8);
      out += MK.pill(748, 390, "does what it is told", on(t, cTold, 0.45) * mind, { size: 26, anchor: "start", col: P.gold });
    }
    return svg(out);
  }

  /* ==== chapter: Programs everywhere ==========================================
     The lesson's Program spotter step: a program does not only run on a tablet.
     The four things the child taps there, each drawn doing the steps the lesson
     says its program does - red then amber then green; fill, wash, spin, drain. */
  var AP_E_TAB = { x: 481, y: 26, w: 206, h: 300 };
  var AP_E_CARD = { y: 76, w: 246, h: 306, x: [44, 330, 616, 902] };
  var AP_E_LABEL = ["traffic light", "washing machine", "robot vacuum", "game"];

  /* the three lamps, lit one at a time as they are named */
  function apTrafficLight(cx, top, s, lit) {
    var col = ["#E3453C", "#F4B63F", "#4FD1A0"], out = "";
    out += R(cx - s * 0.09, top + s * 1.62, s * 0.18, s * 0.42, s * 0.05, "#5A6672");
    out += R(cx - s * 0.46, top, s * 0.92, s * 1.66, s * 0.16, "#20313F", P.line, 3);
    for (var k = 0; k < 3; k++) {
      var cy = top + s * (0.34 + k * 0.5), on0 = clamp(lit[k] || 0, 0, 1);
      out += C(cx, cy, s * 0.24, "#33414E");
      if (on0 > 0) out += MK.glow(cx, cy, s * 0.5, col[k], on0) + C(cx, cy, s * 0.24, col[k], null, null, { opacity: on0 });
    }
    return out;
  }
  /* the drum, with the water and the suds the lesson's steps put in it */
  function apWasher(cx, top, s, fill, suds, spin, t) {
    var out = R(cx - s * 0.5, top, s, s * 1.3, s * 0.1, "#C6D2DC", "#8FA0AE", 3);
    out += R(cx - s * 0.5, top, s, s * 0.26, s * 0.1, "#9FB0BE");
    out += C(cx - s * 0.3, top + s * 0.13, s * 0.06, "#4A5A68") + C(cx - s * 0.12, top + s * 0.13, s * 0.06, "#4A5A68");
    var dy = top + s * 0.78, dr = s * 0.32;
    out += C(cx, dy, dr + s * 0.05, "#8FA0AE");
    out += el("clipPath", { id: "apDrum" }, C(cx, dy, dr));
    out += C(cx, dy, dr, "#0E2434");
    var inner = "";
    if (fill > 0) inner += R(cx - dr, dy + dr - 2 * dr * clamp(fill, 0, 1), dr * 2, 2 * dr * clamp(fill, 0, 1), 0, "#3E8EC8");
    if (suds > 0) for (var k = 0; k < 6; k++)
      inner += C(cx - dr * 0.6 + (k % 3) * dr * 0.6, dy + dr * (0.1 + Math.floor(k / 3) * 0.45), dr * 0.18, "#EAF4FA", null, null, { opacity: 0.85 * clamp(suds, 0, 1) });
    if (spin > 0) {
      var a = (t || 0) * 300 * clamp(spin, 0, 1);
      var sp = "";
      for (var q = 0; q < 4; q++) sp += L(cx, dy, cx + Math.cos(q * Math.PI / 2) * dr * 0.8, dy + Math.sin(q * Math.PI / 2) * dr * 0.8, "#7FB6DE", 5, { opacity: 0.8 * clamp(spin, 0, 1) });
      inner += G(sp, { transform: "rotate(" + n2(a % 360) + " " + n2(cx) + " " + n2(dy) + ")" });
    }
    out += G(inner, { "clip-path": "url(#apDrum)" });
    out += C(cx, dy, dr, "none", "#B9C8D6", 5);
    return out;
  }
  /* a small computer, inside an everyday thing */
  function apChipBadge(cx, cy, s, o) {
    if (!(o > 0)) return "";
    var legs = "";
    for (var k = 0; k < 3; k++) {
      legs += L(cx - s * 0.5, cy - s * 0.24 + k * s * 0.24, cx - s * 0.68, cy - s * 0.24 + k * s * 0.24, P.gold, 3);
      legs += L(cx + s * 0.5, cy - s * 0.24 + k * s * 0.24, cx + s * 0.68, cy - s * 0.24 + k * s * 0.24, P.gold, 3);
    }
    return G(legs + R(cx - s * 0.5, cy - s * 0.5, s, s, s * 0.16, "#1B3A52", P.gold, 3) +
      R(cx - s * 0.22, cy - s * 0.22, s * 0.44, s * 0.44, s * 0.08, P.gold),
      { transform: around(cx, cy, Math.min(o, 1.1)), opacity: Math.min(1, o) });
  }

  function apEveryChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTablet = c(0, "tablet"), cHome = c(0, "home");
    var cMany = c(1, "many"), cInside = c(1, "inside");
    var cTraffic = c(2, "traffic"), cRed = c(2, "red"), cAmber = c(2, "amber"), cGreen = c(2, "green");
    var cWash = c(3, "washing"), cFill = c(3, "fill"), cWashing = c(3, "wash"), cSpin = c(3, "spin"), cDrain = c(3, "drain");
    var cRobot = c(4, "robot"), cGame = c(4, "game");
    var out = "", first = apOnly(t, scene, 0);

    /* the tablet everyone thinks of first */
    if (first > 0.01) {
      var ho = on(t, cHome, 0.6) * first;
      if (ho > 0) out += Pth("M" + n2(584 - 250) + ",230 L584,58 L" + n2(584 + 250) + ",230 M" + n2(584 - 200) +
        ",206 L" + n2(584 - 200) + ",392 L" + n2(584 + 200) + ",392 L" + n2(584 + 200) + ",206",
        null, P.line, 5, { opacity: 0.8 * ho });
      out += G(ART.place(ART.figure("tablet"), AP_E_TAB.x, AP_E_TAB.y, AP_E_TAB.w, AP_E_TAB.h),
        { opacity: popIn(t, cTablet, 0.45) * first });
      out += MK.pill(584, 358, "a program", on(t, cTablet, 0.5) * first, { size: 26, col: P.teal });
    }

    /* and the four the lesson asks the child to spot */
    var rest = clamp(1 - first, 0, 1);
    if (rest > 0.01) {
      var nowK = cGame != null && t >= cGame ? 3 : cRobot != null && t >= cRobot ? 2 :
        cWash != null && t >= cWash ? 1 : cTraffic != null && t >= cTraffic ? 0 : -1;
      var ringAt = [cTraffic, cWash, cRobot, cGame];
      for (var k = 0; k < 4; k++) {
        var X = AP_E_CARD.x[k], cx = X + AP_E_CARD.w / 2;
        var p = popIn(t, cMany == null ? null : cMany + k * 0.16, 0.4) * rest;
        if (p <= 0) continue;
        var isNow = k === nowK, body = "";
        body += R(X, AP_E_CARD.y, AP_E_CARD.w, AP_E_CARD.h, 22, P.card, isNow ? P.gold : P.line, isNow ? 5 : 2);
        /* red, THEN amber, THEN green: the lamp named is the only one lit */
        if (k === 0) body += apTrafficLight(cx, AP_E_CARD.y + 34, 112,
          [on(t, cRed, 0.35) - on(t, cAmber, 0.35), on(t, cAmber, 0.35) - on(t, cGreen, 0.35), on(t, cGreen, 0.35)]);
        else if (k === 1) body += apWasher(cx, AP_E_CARD.y + 40, 150,
          on(t, cFill, 0.55) - on(t, cDrain, 0.6), on(t, cWashing, 0.5) - on(t, cDrain, 0.6),
          on(t, cSpin, 0.5) - on(t, cDrain, 0.6), t);
        else body += Em(cx, AP_E_CARD.y + 134, 130, k === 2 ? "\u{1F916}" : "\u{1F3AE}");
        body += Tx(cx, AP_E_CARD.y + AP_E_CARD.h - 28, AP_E_LABEL[k], "lab", "middle");
        body += apChipBadge(X + AP_E_CARD.w - 40, AP_E_CARD.y + AP_E_CARD.h - 84, 30,
          popIn(t, cInside == null ? null : cInside + k * 0.14, 0.35) * rest);
        out += G(body, { opacity: Math.min(1, p) * (nowK < 0 || isNow ? 1 : 0.5),
          transform: around(cx, AP_E_CARD.y + AP_E_CARD.h / 2, isNow ? 1 : Math.min(p, 1.06)) });
        if (isNow) out += MK.ripple(cx, AP_E_CARD.y + AP_E_CARD.h - 26, t, ringAt[k], P.gold);
      }
    }
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------- */
  function apPicBlock(cx, cy, size) {
    return R(cx - size * 0.55, cy - size * 0.19, size * 1.1, size * 0.38, size * 0.1, P.teal) +
      Em(cx, cy, size * 0.28, ART.block("right").icon);
  }
  function apPicProgram(cx, cy, size) {
    var ids = ["right", "jump", "say"], out = "";
    for (var k = 0; k < 3; k++)
      out += R(cx - size * 0.5, cy - size * 0.46 + k * size * 0.32, size, size * 0.26, size * 0.07,
        AP_CAT_FILL[ART.block(ids[k]).cat]) +
        Em(cx - size * 0.34, cy - size * 0.33 + k * size * 0.32, size * 0.19, ART.block(ids[k]).icon);
    return out;
  }
  function apPicBuild(cx, cy, size) {
    return R(cx - size * 0.56, cy + size * 0.04, size * 1.12, size * 0.34, size * 0.09, "rgba(0,0,0,0.2)", P.line, 3,
      { "stroke-dasharray": "7 6" }) +
      R(cx - size * 0.5, cy - size * 0.44, size, size * 0.3, size * 0.08, P.teal) +
      MK.arrow(cx, cy - size * 0.08, cx, cy + size * 0.06, 1, P.gold, 5);
  }
  function apPicEvery(cx, cy, size) {
    return apTrafficLight(cx, cy - size * 0.58, size * 0.62, [1, 0, 0]);
  }

  var AP_RECAP = MK.recapKind([
    { beat: 0, at: "code", title: "Code", sub: "the steps a computer understands", pic: apPicBlock },
    { beat: 0, at: "program", title: "Program", sub: "code a computer runs", pic: apPicProgram },
    { beat: 1, at: "build", title: "Build", sub: "one block for each step", pic: apPicBuild },
    { beat: 1, at: "predict", title: "Predict", sub: "say it before you run it", pic: "\u{1F52E}" },
    { beat: 1, at: "test", title: "Test", sub: "run it and check it", pic: "\u{1F50E}" },
    { beat: 2, at: "everywhere", title: "Everywhere", sub: "traffic lights run programs", pic: apPicEvery }
  ], { goBeat: 2, goAt: "everywhere" });

  var KINDS = {
    title: MK.titleKind({ sub: ["An algorithm in words, written as blocks", "Build it, predict it, run it", "Testing: did the cat do what you said?"] }),
    words: apWordsChapter, blocks: apBlocksChapter, build: apBuildChapter,
    predict: apPredictChapter, test: apTestChapter, everywhere: apEveryChapter,
    recap: AP_RECAP
  };
