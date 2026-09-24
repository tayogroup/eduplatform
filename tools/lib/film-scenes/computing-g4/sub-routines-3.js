  /* ==== Sub-routines, part 3: following a call, reuse, one place, the recap ====
     tools/lib/film-scenes/computing-g4/sub-routines-3.js. Follows
     sub-routines-2.js in renderer.scenes and shares its scope.

     "Following a call" is the chapter the lesson's claim rests on, so its
     ribbon of finished steps is SR_STEPS - ART.algo.subExpand(SR_MAIN,
     SR_SUBS), the lesson's own rule - drawn in its own order. The five lines on
     the left and the fourteen chips along the bottom therefore end in the same
     place because the kit says they do, not because this film counted. */

  /* ==== chapter: following a call =============================================== */
  var SR_FM = { x: 34, y: 30, w: 380, rh: 50, gap: 8 };
  function srFollowRowY(k) { return SR_FM.y + k * (SR_FM.rh + SR_FM.gap); }
  var SR_FB = { x: 448, y: 26, w: 370, h: 292 };            /* the open sub-routine */
  var SR_FC = { x: 850, y: 26, w: 284, h: 64, gap: 10 };    /* the four name cards */
  var SR_RIB = { x0: 74, pitch: 78, y: 366, size: 56 };     /* the steps actually done */

  /* how many of SR_STEPS have been done by t - every count taken from a cue */
  function srDone(scene, t) {
    var cFace = sc(scene, 1, "face"), cTeeth = sc(scene, 1, "teeth"), cHair = sc(scene, 1, "hair");
    var cClothes = sc(scene, 3, "clothes"), cRest = sc(scene, 4, "rest"), cLeave = sc(scene, 4, "leave");
    var n = 0;
    if (srPast(t, cFace)) n = 1;
    if (srPast(t, cTeeth)) n = 2;
    if (srPast(t, cHair)) n = 3;
    if (srPast(t, cClothes)) n = 3 + tally(t, cClothes, SR_SUBS.DRESS.length, 0.9);
    if (srPast(t, cRest)) n = 7 + tally(t, cRest, SR_SUBS.BREAKFAST.length + SR_SUBS.BAG.length, 1.2);
    if (srPast(t, cLeave)) n = SR_STEPS.length;
    return Math.min(n, SR_STEPS.length);
  }

  /* which line the reader is on, which sub-routine is open, and whether the
     reader is inside it */
  function srWhere(scene, t) {
    var done = srDone(scene, t);
    var cReach = sc(scene, 0, "reach"), cJump = sc(scene, 0, "jump");
    var cBack = sc(scene, 2, "back"), cAfter = sc(scene, 2, "after");
    var cAgain = sc(scene, 3, "again"), cBackAgain = sc(scene, 4, "backagain");
    var cRest = sc(scene, 4, "rest"), cLeave = sc(scene, 4, "leave");
    if (srPast(t, cLeave)) return { name: "BAG", line: 4, inside: false, done: done };
    if (srPast(t, cRest)) return { name: done < 10 ? "BREAKFAST" : "BAG", line: done < 10 ? 2 : 3, inside: true, done: done };
    if (srPast(t, cBackAgain)) return { name: "DRESS", line: 1, inside: false, done: done };
    if (srPast(t, cAgain)) return { name: "DRESS", line: 1, inside: true, done: done };
    if (srPast(t, cBack)) return { name: "WASH", line: srPast(t, cAfter) ? 1 : 0, inside: false, done: done };
    if (srPast(t, cJump)) return { name: "WASH", line: 0, inside: true, done: done };
    return { name: null, line: srPast(t, cReach) ? 0 : -1, inside: false, done: done };
  }

  function srFollowChapter(scene, beat, t, i) {
    var cReach = sc(scene, 0, "reach"), cJump = sc(scene, 0, "jump");
    var cEvery1 = sc(scene, 1, "every");
    var cBack = sc(scene, 2, "back"), cCarry = sc(scene, 2, "carry");
    var cDress = sc(scene, 3, "dress"), cAgain = sc(scene, 3, "again");
    var cBackAgain = sc(scene, 4, "backagain");
    var cFive = sc(scene, 5, "five"), cEvery = sc(scene, 5, "every"), cSkipped = sc(scene, 5, "skipped");
    var w = srWhere(scene, t), out = "";

    /* the main algorithm, with the line being read ringed */
    SR_MAIN.forEach(function (item, k) {
      var here = w.line === k;
      out += srRow(SR_FM.x, srFollowRowY(k), SR_FM.w, SR_FM.rh, item,
        { n: k + 1, fs: 21, col: here ? P.gold : null,
          mark: k < w.line ? "tick" : null, markP: 1, faded: !here && k > w.line });
    });
    out += MK.ripple(SR_FM.x + 28, srFollowRowY(0) + SR_FM.rh / 2, t, cReach, P.gold);
    out += MK.ripple(SR_FM.x + 28, srFollowRowY(1) + SR_FM.rh / 2, t, cDress, P.gold);
    /* five lines, all of them read: the last beat rings the whole list */
    out += R(SR_FM.x - 8, SR_FM.y - 8, SR_FM.w + 16, 5 * SR_FM.rh + 4 * SR_FM.gap + 16, 20, "none", P.gold, 3,
      { opacity: on(t, cFive, 0.5) });

    /* the sub-routine that is open, and the fourteen steps as they are done */
    if (w.name) {
      var base = srBefore(w.name), len = SR_SUBS[w.name].length;
      var doneHere = clamp(w.done - base, 0, len);
      out += srBox(SR_FB.x, SR_FB.y, SR_FB.w, SR_FB.h, w.name,
        { col: w.inside ? P.gold : P.line, done: doneHere, live: w.inside && doneHere < len ? doneHere : -1, fs: 19 });
      /* "every one of its steps": the whole box of steps, ringed as it is said */
      out += R(SR_FB.x + 6, SR_FB.y + 50, SR_FB.w - 12, SR_FB.h - 58, 14, "none", P.gold, 3,
        { opacity: bump(t, cEvery1, 1.8) });
      /* the jump in, while the reader is inside it */
      if (w.inside)
        out += MK.arrow(SR_FM.x + SR_FM.w + 10, srFollowRowY(w.line) + SR_FM.rh / 2, SR_FB.x - 10, SR_FB.y + 26,
          1, P.gold, 6);
    }
    /* the jump back to the line after the call */
    var backF = Math.max(bump(t, cBack, 1.1), bump(t, cBackAgain, 1.1));
    if (backF > 0)
      out += G(MK.arrow(SR_FB.x - 10, SR_FB.y + SR_FB.h - 30, SR_FM.x + SR_FM.w + 10,
        srFollowRowY(Math.max(w.line, 1)) + SR_FM.rh / 2, 1, P.good, 6), { opacity: backF });
    out += MK.pill(SR_FB.x + SR_FB.w / 2, SR_FB.y + SR_FB.h + 22, "back to the line after the call",
      bump(t, cCarry, 2.2), { size: 20, col: P.good, ink: P.good });

    /* the four parts, and which are finished */
    SR_ORDER.forEach(function (nm, k) {
      var y = SR_FC.y + k * (SR_FC.h + SR_FC.gap), fin = w.done >= srBefore(nm) + SR_SUBS[nm].length;
      var live = w.name === nm;
      out += G(R(SR_FC.x, y, SR_FC.w, SR_FC.h, 16, P.card, live ? P.gold : P.line, live ? 3.5 : 2) +
        Em(SR_FC.x + 34, y + SR_FC.h / 2, 28, "\u{1F4E6}") +
        Tx(SR_FC.x + 58, y + SR_FC.h / 2 + 8, nm, "lab caps", "start", { "font-size": 22, fill: live ? P.gold : P.ink }) +
        MK.tick(SR_FC.x + SR_FC.w - 34, y + SR_FC.h / 2, 18, fin ? 1 : 0),
        { opacity: live || fin ? 1 : 0.45 });
    });

    /* every step the five lines did, in the kit's own order */
    SR_STEPS.forEach(function (st, k) {
      if (k >= w.done) return;
      var cx = SR_RIB.x0 + k * SR_RIB.pitch, s = SR_RIB.size, lit = on(t, cEvery, 0.9);
      var ringed = k === SR_STEPS.length - 1 && w.done === SR_STEPS.length;
      var fresh = k === w.done - 1 ? 1.06 : 1;
      out += MK.pop(R(cx - s / 2, SR_RIB.y - s / 2, s, s, 14, P.cell, ringed ? P.good : lit > 0.4 ? P.gold : P.line, ringed || lit > 0.4 ? 3 : 2) +
        Em(cx, SR_RIB.y, s * 0.56, st.pic || "\u{2022}"), cx, SR_RIB.y, fresh);
    });
    out += MK.pill(430, 420, "every step in the parts", on(t, cEvery, 0.6), { size: 19, col: P.gold, ink: P.gold });
    out += MK.tick(760, 420, 17, popIn(t, cSkipped, 0.4));
    return svg(out);
  }

  /* ==== the two routines that share one sub-routine ============================
     The same three panels serve "Written once, used many times" and the first
     half of "Change it in one place", so the child keeps the picture. */
  var SR_R = {
    morn: { x: 26, y: 120, w: 316, rh: 46, gap: 8 },
    bed: { x: 786, y: 148, w: 316, rh: 46, gap: 8 },
    box: { x: 400, y: 112, w: 320, h: 276 }
  };
  function srMornY(k) { return SR_R.morn.y + k * (SR_R.morn.rh + SR_R.morn.gap); }
  function srBedY(k) { return SR_R.bed.y + k * (SR_R.bed.rh + SR_R.bed.gap); }

  /* the morning list, with the do WASH line ringed when opt.ring is on */
  function srMorningPanel(t, opt) {
    opt = opt || {};
    var out = MK.pill(SR_R.morn.x, SR_R.morn.y - 26, "Morning", 1,
      { size: 20, anchor: "start", col: opt.lit ? P.good : P.line, ink: opt.lit ? P.good : P.muted });
    SR_MAIN.forEach(function (item, k) {
      out += srRow(SR_R.morn.x, srMornY(k), SR_R.morn.w, SR_R.morn.rh, item,
        { n: k + 1, fs: 19, col: k === 0 && opt.ring ? P.gold : null, faded: opt.faded });
    });
    if (opt.lit) out += R(SR_R.morn.x - 8, SR_R.morn.y - 8, SR_R.morn.w + 16,
      5 * SR_R.morn.rh + 4 * SR_R.morn.gap + 16, 18, "none", P.good, 3, { opacity: opt.lit });
    return out;
  }
  /* the bedtime list, built one line at a time as it is read out */
  function srBedPanel(t, opt) {
    opt = opt || {};
    var at = opt.at || [null, null, null, null], out = "";
    out += MK.pill(SR_R.bed.x, SR_R.bed.y - 26, "Bedtime", opt.title == null ? 1 : opt.title,
      { size: 20, anchor: "start", col: opt.lit ? P.good : P.line, ink: opt.lit ? P.good : P.muted });
    SR_BED.forEach(function (item, k) {
      var o = at[k] === undefined || at[k] === null ? (opt.all ? 1 : 0) : on(t, at[k], 0.4);
      if (!(o > 0)) return;
      out += srRow(SR_R.bed.x, srBedY(k), SR_R.bed.w, SR_R.bed.rh, item,
        { n: k + 1, fs: 19, o: o, col: k === 1 && opt.ring ? P.gold : null, faded: opt.faded });
    });
    if (opt.lit) out += R(SR_R.bed.x - 8, SR_R.bed.y - 8, SR_R.bed.w + 16,
      4 * SR_R.bed.rh + 3 * SR_R.bed.gap + 16, 18, "none", P.good, 3, { opacity: opt.lit });
    return out;
  }

  function srReuseChapter(scene, beat, t, i) {
    var cBedtime = sc(scene, 0, "bedtime"), cPy = sc(scene, 0, "pyjamas"), cWash = sc(scene, 0, "wash"),
      cStory = sc(scene, 0, "story"), cLights = sc(scene, 0, "lights");
    var cAgain = sc(scene, 1, "again"), cSame = sc(scene, 1, "same");
    var cPoint = sc(scene, 2, "point"), cWritten = sc(scene, 2, "written");
    var cMorning = sc(scene, 3, "morning"), cBed = sc(scene, 3, "bed");
    var cCopy = sc(scene, 4, "copy"), cCalls = sc(scene, 4, "calls"), cReuse = sc(scene, 4, "reuse");
    var out = "";

    out += srMorningPanel(t, { ring: srPast(t, cSame), lit: bump(t, cMorning, 1.6) });
    out += srBedPanel(t, { at: [cPy, cWash, cStory, cLights], title: on(t, cBedtime, 0.5),
      ring: srPast(t, cAgain), lit: bump(t, cBed, 1.6) });

    /* the one box of steps both lists call */
    var pop = popIn(t, cSame, 0.45);
    out += srBox(SR_R.box.x, SR_R.box.y, SR_R.box.w, SR_R.box.h, "WASH",
      { o: 0.3 + 0.7 * Math.min(1, pop), col: pop > 0.2 ? P.gold : P.line, fs: 19 });
    out += MK.pill(SR_R.box.x + SR_R.box.w / 2, SR_R.box.y - 26, "written out once",
      on(t, cWritten, 0.5), { size: 20, col: P.good, ink: P.good });

    /* both lists point at it */
    var aL = Math.max(on(t, cPoint, 0.6), bump(t, cMorning, 1.4));
    var aR = Math.max(on(t, cPoint == null ? null : cPoint + 0.35, 0.6), bump(t, cBed, 1.4));
    out += MK.arrow(SR_R.morn.x + SR_R.morn.w + 10, srMornY(0) + 23, SR_R.box.x - 10, SR_R.box.y + 96, aL, P.gold, 6);
    out += MK.arrow(SR_R.bed.x - 10, srBedY(1) + 23, SR_R.box.x + SR_R.box.w + 10, SR_R.box.y + 96, aR, P.gold, 6);

    /* one copy, two calls, reuse */
    out += MK.pill(SR_R.box.x + SR_R.box.w / 2, SR_R.box.y + SR_R.box.h + 26, "one copy",
      popIn(t, cCopy, 0.45) * (1 - on(t, cReuse, 0.5)), { size: 21, col: P.good, ink: P.good });
    out += MK.pill(SR_R.box.x + SR_R.box.w / 2, SR_R.box.y + SR_R.box.h + 26, "reuse",
      on(t, cReuse, 0.5), { size: 21, col: P.good, ink: P.good });
    out += MK.pill(SR_R.box.x + SR_R.box.w - 66, SR_R.box.y + 23, "2 calls", popIn(t, cCalls, 0.45),
      { size: 19, col: P.gold, ink: P.gold });
    return svg(out);
  }

  /* ==== chapter: change it in one place ========================================
     Three pictures: the flossing step going into the one box; one list edited
     against three copies edited three times; and two people writing a part each.
     They are crossfaded, so nothing of one is left in the next. */
  function srFlossPicture(scene, t) {
    var cAdd = sc(scene, 0, "add"), cWash = sc(scene, 0, "wash"), cLook = sc(scene, 0, "look");
    var cBoth = sc(scene, 1, "both"), cNeither = sc(scene, 1, "neither");
    var lit = on(t, cBoth, 0.7), out = "";
    out += srMorningPanel(t, { ring: 1, lit: lit });
    out += srBedPanel(t, { all: true, ring: 1, lit: lit });

    var steps = SR_SUBS.WASH.concat([SR_FLOSS]);
    out += srBox(SR_R.box.x, SR_R.box.y, SR_R.box.w, SR_R.box.h, "WASH",
      { col: srPast(t, cAdd) ? P.good : P.gold, steps: srPast(t, cAdd) ? steps : SR_SUBS.WASH, fs: 19 });
    out += MK.ripple(SR_R.box.x + SR_R.box.w / 2, SR_R.box.y + SR_R.box.h - 40, t, cAdd, P.good);
    out += MK.pill(SR_R.box.x + SR_R.box.w / 2, SR_R.box.y - 26, "one edit, here",
      on(t, cWash, 0.5), { size: 20, col: P.good, ink: P.good });
    out += MK.arrow(SR_R.box.x - 10, SR_R.box.y + 96, SR_R.morn.x + SR_R.morn.w + 10, srMornY(0) + 23,
      Math.max(on(t, cLook, 0.5) * 0.6, on(t, cBoth, 0.6)), P.good, 6);
    out += MK.arrow(SR_R.box.x + SR_R.box.w + 10, SR_R.box.y + 96, SR_R.bed.x - 10, srBedY(1) + 23,
      Math.max(on(t, cLook, 0.5) * 0.6, on(t, cBoth == null ? null : cBoth + 0.3, 0.6)), P.good, 6);
    out += MK.pill(SR_R.morn.x + SR_R.morn.w / 2, 402, "not edited", on(t, cNeither, 0.5), { size: 19 });
    out += MK.pill(SR_R.bed.x + SR_R.bed.w / 2, 402, "not edited", on(t, cNeither, 0.5), { size: 19 });
    return out;
  }

  /* one sub-routine against three copied-out lists ----------------------------
     The one list carries the lesson's words; the three copies carry the same
     four things as pictures, because three sets of words at this width could
     not be read. */
  function srCopyCard(x, y, w, h, floss, col) {
    var th = 40;
    var out = R(x, y, w, h, 16, P.card, col, 3) + R(x, y, w, th, 16, col, null, null, { opacity: 0.22 }) +
      Em(x + 26, y + th / 2, 24, "\u{1F4E6}") +
      Tx(x + 44, y + th / 2 + 7, "WASH", "lab caps", "start", { "font-size": 19, fill: col });
    var spots = [[x + w * 0.31, y + 96], [x + w * 0.69, y + 96], [x + w * 0.31, y + 162], [x + w * 0.69, y + 162]];
    SR_SUBS.WASH.forEach(function (st, k) { out += Em(spots[k][0], spots[k][1], 40, st.pic); });
    if (floss) out += C(spots[3][0], spots[3][1], 21, P.card, P.good, 3) +
      Tx(spots[3][0], spots[3][1] + 10, "+", "lab", "middle", { fill: P.good, "font-size": 30 });
    return out;
  }
  function srCopiesPicture(scene, t) {
    var cOne = sc(scene, 2, "one"), cThree = sc(scene, 2, "three"), cChances = sc(scene, 2, "chances");
    var out = "", steps = SR_SUBS.WASH.concat([SR_FLOSS]);
    /* the shape of the comparison arrives with the beat, so nothing is blank
       while the first line is still being said */
    var base = into(t, scene.first + 2);
    var pOne = Math.min(1, popIn(t, cOne, 0.45));
    out += G(R(128, 82, 280, 300, 18, "none", P.line, 2.5, { "stroke-dasharray": "14 10" }), { opacity: base * (1 - pOne) });
    [0, 1, 2].forEach(function (k) {
      var pk = Math.min(1, popIn(t, cThree == null ? null : cThree + k * 0.22, 0.4));
      out += G(R(610 + k * 186, 100, 168, 230, 16, "none", P.line, 2.5, { "stroke-dasharray": "12 9" }), { opacity: base * (1 - pk) });
    });
    out += MK.pill(268, 40, "one list to change", on(t, cOne, 0.5), { size: 21, col: P.good, ink: P.good });
    out += MK.pop(srBox(128, 82, 280, 300, "WASH", { steps: steps, col: P.good, fs: 18 }), 268, 232, popIn(t, cOne, 0.45));
    out += MK.tick(268, 408, 20, popIn(t, cOne == null ? null : cOne + 0.5, 0.4));
    out += L(584, 46, 584, 400, P.line, 3, { "stroke-dasharray": "10 10", opacity: base });

    out += MK.pill(876, 40, "three lists to change", on(t, cThree, 0.5), { size: 21, col: P.bad, ink: P.bad });
    [0, 1, 2].forEach(function (k) {
      var x = 610 + k * 186, missed = k === 2 && srPast(t, cChances);
      var p = popIn(t, cThree == null ? null : cThree + k * 0.22, 0.4);
      out += MK.pop(srCopyCard(x, 100, 168, 230, !missed, P.bad), x + 84, 215, p);
      if (k < 2) out += MK.tick(x + 84, 352, 19, popIn(t, cThree == null ? null : cThree + k * 0.22 + 0.5, 0.4));
      else out += MK.cross(x + 84, 352, 19, popIn(t, cChances, 0.45));
    });
    out += MK.pill(876, 408, "miss one, and it is wrong", on(t, cChances, 0.6), { size: 20, col: P.bad, ink: P.bad });
    return out;
  }

  /* two people, a part each, joined by the main algorithm */
  function srSharePicture(scene, t) {
    var cShare = sc(scene, 3, "share"), cPerson = sc(scene, 3, "person");
    var cAnother = sc(scene, 4, "another"), cJoins = sc(scene, 4, "joins");
    var out = "", card = popIn(t, cShare, 0.45);
    /* the main algorithm's own shape arrives with the beat */
    out += G(R(444, 24, 280, 150, 22, "none", P.line, 2.5, { "stroke-dasharray": "14 10" }),
      { opacity: into(t, scene.first + 3) * (1 - Math.min(1, card)) });
    out += MK.pop(R(444, 24, 280, 150, 22, P.card, P.accent, 3) +
      srRow(460, 40, 248, 56, SR_MAIN[0], { n: null, fs: 21 }) +
      srRow(460, 104, 248, 56, SR_MAIN[1], { n: null, fs: 21 }), 584, 99, card);
    out += MK.pill(584, 198, "the main algorithm joins them", on(t, cJoins, 0.5),
      { size: 20, col: P.accent, ink: P.accent });

    var pL = popIn(t, cPerson, 0.45), pR = popIn(t, cAnother, 0.45);
    out += MK.pop(srBox(30, 220, 210, 210, "WASH", { fs: 14, col: P.good }), 135, 325, pL);
    out += MK.pop(Em(310, 268, 72, "\u{1F9D1}") + Tx(310, 340, "one person", "lab mid muted", "middle"), 310, 296, pL);
    out += MK.pop(srBox(928, 220, 210, 210, "DRESS", { fs: 14, col: P.good }), 1033, 325, pR);
    out += MK.pop(Em(858, 268, 72, "\u{1F9D1}") + Tx(858, 340, "another", "lab mid muted", "middle"), 858, 296, pR);
    out += MK.arrow(246, 296, 440, 118, Math.min(1, pL), P.good, 5);
    out += MK.arrow(922, 296, 728, 118, Math.min(1, pR), P.good, 5);
    return out;
  }

  function srOnceChapter(scene, beat, t, i) {
    return svg(crossfade(t, i, scene, function (k) {
      var n = k - scene.first;
      if (n <= 1) return srFlossPicture(scene, t);
      if (n === 2) return srCopiesPicture(scene, t);
      return srSharePicture(scene, t);
    }));
  }

  /* ---- what you now know ------------------------------------------------------
     The lesson's own five words, with the lesson's own pictures for them. */
  var SR_RECAP = MK.recapKind([
    { beat: 0, at: "decomposition", title: "Decomposition", sub: "a big task in named parts", pic: "\u{1F9E9}" },
    { beat: 1, at: "sub", title: "Sub-routine", sub: "a named part of its own", pic: "\u{1F4E6}" },
    { beat: 1, at: "main", title: "Main algorithm", sub: "it calls the parts in order", pic: "\u{1F4CB}" },
    { beat: 2, at: "call", title: "Call", sub: "a line that runs a sub-routine", pic: "\u{21AA}\u{FE0F}" },
    { beat: 2, at: "ret", title: "Return", sub: "back to the line after the call", pic: "\u{21A9}\u{FE0F}" }
  ], { goBeat: 3, goAt: "once" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "What decomposition means",
      "How a main algorithm calls its parts",
      "Into the sub-routine, and back again"
    ] }),
    decompose: srDecomposeChapter, main: srMainChapter, follow: srFollowChapter,
    reuse: srReuseChapter, once: srOnceChapter, recap: SR_RECAP
  };
