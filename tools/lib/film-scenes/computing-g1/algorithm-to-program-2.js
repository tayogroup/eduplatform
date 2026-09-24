  /* ==== Grade 1 Computing, Lesson 4: Algorithm to Program, part 2 =============
     The chapters "One block, one job", "Building a program" and "Predicting".
     Every position and size the cat takes is one the lesson's own kit worked
     out (AP_RIGHT1, AP_BACK, AP_GROW, AP_SHRINK, AP_BUILD, AP_PRED in part 1),
     so the film cannot disagree with the step the child does next. */

  /* ==== chapter: One block, one job ===========================================
     The lesson's block reader: the seven blocks the cat understands, down the
     left, and the cat on its stage. A block is outlined gold as it is named -
     the lesson's own .block.now - and the cat does that one thing, once. The
     last beat leaves the stage for the misconception the lesson names: one
     block cannot do two things. */
  var AP_B_IDS = ["right", "left", "jump", "say", "spin", "grow", "shrink"];
  var AP_B_BLK = { x: 30, w: 252, h: 52, top: 14, pitch: 58 };
  var AP_B_STAGE = { x: 336, y: 104, w: 784, h: 230 };

  function apBlocksChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cBlocks = c(0, "blocks"), cCat = c(0, "cat");
    var cRight = c(1, "right"), cLeft = c(1, "left");
    var cJump = c(2, "jump"), cSay = c(2, "say");
    var cSpin = c(3, "spin"), cGrow = c(3, "grow"), cShrink = c(3, "shrink");
    var cOne = c(4, "one"), cTwo = c(4, "two");
    var out = "", live = apOnly(t, scene, 0) + apOnly(t, scene, 1) + apOnly(t, scene, 2) + apOnly(t, scene, 3);
    live = clamp(live, 0, 1);
    var last = apOnly(t, scene, 4);

    /* which block is being named now */
    var ringAt = [cRight, cLeft, cJump, cSay, cSpin, cGrow, cShrink];
    var nowK = -1;
    for (var r = 0; r < 7; r++) if (ringAt[r] != null && t >= ringAt[r]) nowK = r;
    if (last > 0.5) nowK = 2;                      /* the jump block, for "one thing" */

    var nB = tally(t, cBlocks, 7, 1.3);
    for (var b = 0; b < 7; b++) {
      if (b >= nB) break;
      var at = cBlocks == null ? null : cBlocks + b * 0.19, p = popIn(t, at, 0.34);
      var y = AP_B_BLK.top + b * AP_B_BLK.pitch;
      var done = ringAt[b] != null && t >= ringAt[b];
      out += G(apBlock(AP_B_BLK.x, y, AP_B_BLK.w, AP_B_BLK.h, AP_B_IDS[b], Math.min(1, p),
        { fs: 22, ring: b === nowK ? P.gold : done ? P.good : null }),
        { transform: around(AP_B_BLK.x + AP_B_BLK.w / 2, y + AP_B_BLK.h / 2, Math.min(p, 1.1)),
          opacity: b === nowK || nowK < 0 ? 1 : 0.55 });
    }

    /* ---- the stage, for the first four beats ---- */
    if (live > 0.01) {
      var S = AP_B_STAGE, cx = S.x + S.w / 2;
      var st = { x: 0, scale: 1, spin: 0, hidden: false };
      if (cRight != null) st.x = lerp(0, AP_RIGHT1.x, on(t, cRight, 0.5));
      if (cLeft != null && t >= cLeft) st.x = lerp(AP_RIGHT1.x, AP_BACK.x, on(t, cLeft, 0.5));
      st.spin = 360 * on(t, cSpin, 0.65);
      if (cGrow != null) st.scale = lerp(1, AP_GROW.scale, on(t, cGrow, 0.5));
      if (cShrink != null && t >= cShrink) st.scale = lerp(AP_GROW.scale, AP_SHRINK.scale, on(t, cShrink, 0.5));
      var hop = cJump == null || t < cJump ? 0 : Math.max(0, Math.sin(Math.PI * clamp((t - cJump) / 0.95, 0, 1)));

      var stageO = on(t, cCat == null ? BEATS[scene.first].start : cCat, 0.5) * live;
      out += apStage(S.x, S.y, S.w, S.h, stageO, { squares: 3 });
      out += apCat(cx, S.y, S.h, st, hop, stageO);
      /* say hello: the lesson's white bubble over the cat */
      var sayO = on(t, cSay, 0.4) * apOnly(t, scene, 2);
      if (sayO > 0) out += MK.bubble(cx + 16, S.y + 18, 168, 60, "Hello!", sayO, cx + 8, apCatY(S.y, S.h) - 56);
      /* one space: the arrow that says how far move right goes */
      var sq = apSQ(S.h), ay = S.y + S.h - S.h * 0.2118 - 16;
      out += MK.arrow(cx, ay, cx + sq, ay, on(t, cRight, 0.5) * apOnly(t, scene, 1), P.gold, 6);
      out += MK.arrow(cx + sq, ay - 24, cx, ay - 24, on(t, cLeft, 0.5) * apOnly(t, scene, 1), P.gold, 6);
    }

    /* ---- the last beat: one block, one thing ---- */
    if (last > 0.01) {
      var pOne = popIn(t, cOne, 0.4) * last, pTwo = popIn(t, cTwo, 0.4) * last;
      out += apBlock(420, 92, 200, 56, "jump", pOne, { fs: 24 });
      out += MK.tick(680, 120, 26, pOne);
      out += MK.pill(730, 120, "one thing", pOne, { size: 24, anchor: "start", col: P.good });
      /* the block a child imagines, which the lesson says does not exist */
      out += apBlock(420, 214, 320, 56, null, pTwo,
        { fs: 24, label: "jump and spin", icon: "⬆️", fill: P.muted });
      out += MK.cross(800, 242, 26, pTwo);
      /* two things need two blocks */
      var pTwo2 = popIn(t, cTwo == null ? null : cTwo + 0.45, 0.4) * last;
      out += apBlock(420, 324, 170, 56, "jump", pTwo2, { fs: 24 });
      out += apBlock(614, 324, 170, 56, "spin", pTwo2, { fs: 24 });
      out += MK.tick(840, 352, 26, pTwo2);
    }
    return svg(out);
  }

  /* ==== chapter: Building a program ===========================================
     The lesson's round 1: the algorithm says move right, jump, and the child
     picks the block for each step, in order. The card on the left, the empty
     script strip in the middle, and each block flying into its slot as it is
     named. The last beat numbers the slots and joins them to the card. */
  var AP_C_CARD = { x: 52, y: 92, w: 330, h: 236 };
  var AP_C_LINE = [200, 272];
  var AP_C_STEPS = ["Move right", "Jump"];
  var AP_C_IDS = ["right", "jump"];
  var AP_C_SLOT = { x: 496, w: 348, h: 74, y: [110, 222] };

  function apBuildChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cBuild = c(0, "build"), cRead = c(0, "read");
    var cSays = c(1, "says"), cTwo = c(1, "two");
    var cPick = c(2, "pick"), cFirst = c(2, "first");
    var cThen = c(3, "then"), cSecond = c(3, "second");
    var cOrder = c(4, "order"), cMatch = c(4, "match");
    var out = "", slotCue = [cPick, cThen], chipCue = [cFirst, cSecond];

    out += apCard(AP_C_CARD.x, AP_C_CARD.y, AP_C_CARD.w, AP_C_CARD.h, "Algorithm", 1, on(t, cRead, 0.5) * (1 - on(t, cSays, 0.5)));
    for (var n = 0; n < 2; n++)
      out += apCardLine(AP_C_CARD.x + 14, AP_C_LINE[n], n + 1, AP_C_STEPS[n], 1,
        Math.max(bump(t, cSays == null ? null : cSays + n * 0.5, 0.8), on(t, cMatch, 0.4) * 0.6));

    /* the empty script the child is about to fill */
    out += R(470, 56, 400, 316, 20, "rgba(0,0,0,0.16)", P.line, 3,
      { "stroke-dasharray": "14 10", opacity: on(t, cBuild, 0.5) });
    for (var s = 0; s < 2; s++) {
      var sy = AP_C_SLOT.y[s], slotO = on(t, cTwo == null ? cBuild : cTwo, 0.45);
      out += apSlot(AP_C_SLOT.x, sy, AP_C_SLOT.w, AP_C_SLOT.h, slotO, on(t, cTwo, 0.4) > 0 ? P.gold : P.line);
      /* the block flies in from the card as it is picked */
      var u = on(t, slotCue[s], 0.55);
      if (u > 0) {
        var fx = lerp(AP_C_CARD.x + 40, AP_C_SLOT.x, ease(u)), fy = lerp(AP_C_LINE[s] - 46, sy, ease(u));
        out += apBlock(fx, fy, AP_C_SLOT.w, AP_C_SLOT.h, AP_C_IDS[s], Math.min(1, u * 2.2),
          { fs: 30, ring: u >= 1 && on(t, cMatch, 0.4) > 0 ? P.good : u >= 1 && t < (chipCue[s] || 0) + 1.2 ? P.gold : null });
      }
      out += apChip(AP_C_SLOT.x - 26, sy + AP_C_SLOT.h / 2, 24, String(s + 1), popIn(t, chipCue[s], 0.4));
      /* the card's step joined to the slot it became */
      var m = on(t, cMatch == null ? null : cMatch + s * 0.3, 0.5);
      if (m > 0) {
        out += MK.arrow(AP_C_CARD.x + AP_C_CARD.w + 6, AP_C_LINE[s] - 10, AP_C_SLOT.x - 46, sy + AP_C_SLOT.h / 2, m, P.good, 6);
        out += MK.tick(882, sy + AP_C_SLOT.h / 2, 24, popIn(t, cMatch == null ? null : cMatch + 0.25 + s * 0.3, 0.35));
      }
    }

    /* the computer does them in the order they are placed */
    var od = on(t, cOrder, 0.6);
    out += MK.arrow(944, 118, 944, lerp(118, 300, od), od, P.gold, 9);
    out += MK.pill(974, 200, "in order", od, { size: 24, anchor: "start", col: P.gold });
    return svg(out);
  }

  /* ==== chapter: Predicting ===================================================
     The lesson's predictor round 1: move right, move right, jump, already
     written. The blocks are read left to right, and the prediction is drawn
     as a pale cat walking the squares ahead of the real one, which has not
     moved because nothing has been run yet. */
  var AP_P_BLK = { y: 26, h: 56, w: 210, x: [243, 479, 715] };
  var AP_P_IDS = ["right", "right", "jump"];
  var AP_P_STAGE = { x: 170, y: 134, w: 830, h: 256 };

  /* a dashed arrow: the step the cat has not taken yet */
  function apGhostArrow(x1, y, x2, u, col) {
    if (!(u > 0)) return "";
    var ex = lerp(x1, x2, u);
    return L(x1, y, ex, y, col, 5, { "stroke-dasharray": "13 10" }) +
      Pth("M" + n2(ex) + "," + n2(y) + " L" + n2(ex - 20) + "," + n2(y - 12) + " L" + n2(ex - 20) + "," + n2(y + 12) + " Z", col, col, 2);
  }

  function apPredictChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cProgram = c(0, "program"), cWhat = c(0, "what");
    var cEvery = c(1, "every"), cFirst = c(1, "first");
    var cOne = c(2, "one"), cTwo = c(2, "two"), cThree = c(2, "three");
    var cPredict = c(3, "predict"), cAll = c(3, "all");
    var S = AP_P_STAGE, cx = S.x + S.w / 2, sq = apSQ(S.h), out = "";

    /* the program somebody else wrote */
    var nB = tally(t, cProgram, 3, 0.7);
    var readK = cEvery == null ? -1 : tally(t, cEvery, 3, 1.0) - 1;
    var stepK = cThree != null && t >= cThree ? 2 : cTwo != null && t >= cTwo ? 1 : cOne != null && t >= cOne ? 0 : -1;
    for (var b = 0; b < 3; b++) {
      if (b >= nB) break;
      var p = popIn(t, cProgram == null ? null : cProgram + b * 0.24, 0.36);
      var lit = b === stepK || (stepK < 0 && b === readK);
      out += G(apBlock(AP_P_BLK.x[b], AP_P_BLK.y, AP_P_BLK.w, AP_P_BLK.h, AP_P_IDS[b], Math.min(1, p),
        { fs: 22, ring: lit ? P.gold : null }),
        { transform: around(AP_P_BLK.x[b] + AP_P_BLK.w / 2, AP_P_BLK.y + 28, Math.min(p, 1.1)),
          opacity: lit || (readK < 0 && stepK < 0) ? 1 : 0.6 });
      out += apChip(AP_P_BLK.x[b] + AP_P_BLK.w - 8, AP_P_BLK.y + 6, 18, String(b + 1),
        popIn(t, cProgram == null ? null : cProgram + b * 0.24 + 0.2, 0.3));
    }
    /* not just the first one */
    var fo = popIn(t, cFirst, 0.4) * apOnly(t, scene, 1);
    if (fo > 0) {
      out += R(AP_P_BLK.x[0] - 10, AP_P_BLK.y - 10, AP_P_BLK.w + 20, AP_P_BLK.h + 20, 18, "none", P.bad, 4,
        { "stroke-dasharray": "12 9", opacity: Math.min(1, fo) });
      out += MK.cross(AP_P_BLK.x[0] - 46, AP_P_BLK.y + AP_P_BLK.h / 2, 22, fo);
    }

    /* the stage: the cat has not run, so it stands at home */
    out += apStage(S.x, S.y, S.w, S.h, 1, { squares: 3 });
    out += apCat(cx, S.y, S.h, AP_HOME, 0, 1);
    out += MK.qmark(cx + 96, S.y + 54, 34, on(t, cWhat, 0.5) * apOnly(t, scene, 0));

    /* the prediction: a pale cat walking the squares before anything runs */
    var ay = S.y + S.h - S.h * 0.2118 - 14;
    var u1 = on(t, cOne, 0.5), u2 = on(t, cTwo, 0.5), u3 = on(t, cThree, 0.55);
    out += apGhostArrow(cx + sq * 0.15, ay, cx + sq * 0.9, u1, P.blue);
    out += apGhostArrow(cx + sq * 1.15, ay, cx + sq * 1.9, u2, P.blue);
    if (u1 > 0) {
      var gx = { x: lerp(0, AP_PRED[1].x, u1), scale: 1, spin: 0, hidden: false };
      if (u2 > 0) gx.x = lerp(AP_PRED[1].x, AP_PRED[2].x, u2);
      var hop = cThree == null || t < cThree ? 0 : Math.max(0, Math.sin(Math.PI * clamp((t - cThree) / 0.95, 0, 1)));
      out += G(apCat(cx, S.y, S.h, gx, hop, 1), { opacity: 0.45 * clamp(u1 * 4 - 0.3, 0, 1) });
      if (u3 > 0) out += Pth("M" + n2(cx + gx.x * sq - 36) + "," + n2(apCatY(S.y, S.h) - 50) + " q36,-58 72,0", null, P.blue, 5,
        { "stroke-dasharray": "13 10", opacity: u3 });
      out += MK.pill(cx - sq * 2.2, S.y + 40, "prediction", Math.min(u1, 1), { size: 24, col: P.blue });
    }

    /* saying it before it runs is predicting - and programmers keep doing it */
    var po = on(t, cPredict, 0.45);
    if (po > 0) {
      var pulse = cAll != null && t >= cAll ? 0.75 + 0.25 * breathe(t) : 1;
      out += MK.pill(520, 404, "predicting", po * pulse, { size: 32, col: P.gold });
      out += MK.tick(700, 404, 24, popIn(t, cPredict == null ? null : cPredict + 0.3, 0.35));
    }
    if (cAll != null && t >= cAll) {
      var w = clamp((t - cAll) / 0.95, 0, 1);
      out += C(lerp(cx, cx + sq * 2, w), ay, 11, P.gold, null, null, { opacity: 1 - w * 0.5 });
    }
    return svg(out);
  }
