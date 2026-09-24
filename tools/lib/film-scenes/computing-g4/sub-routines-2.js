  /* ==== Sub-routines, part 2: "Big task, named parts" and "The main algorithm"
     tools/lib/film-scenes/computing-g4/sub-routines-2.js. Follows
     sub-routines.js in renderer.scenes and shares its scope. */

  /* ---- an empty numbered line, for a list before it is read out ------------- */
  function srSlot(x, y, w, h, n, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.28, P.card, P.line, 2, { "stroke-dasharray": "11 9" }) +
      C(x + h * 0.52, y + h / 2, h * 0.27, P.card, P.line, 2) +
      Tx(x + h * 0.52, y + h / 2 + h * 0.12, String(n), "lab", "middle", { fill: P.muted, "font-size": h * 0.34 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- one of the four parts of the morning --------------------------------
     Three states, in the order the chapter says them: a tile with the part's
     own picture and its everyday word; the same tile with the lesson's parcel
     and the sub-routine's NAME on the bar; and the box opened out to show the
     steps that were inside it all along.
     opt: {o, named (0 -> 1), open (0 -> 1), col, faded} */
  function srPartBox(x, y, w, h, name, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var named = clamp(opt.named == null ? 1 : opt.named, 0, 1);
    var open = clamp(opt.open == null ? 0 : opt.open, 0, 1);
    var col = opt.col || P.line, th = 52, steps = SR_SUBS[name];
    var out = R(x, y, w, h, 20, P.card, col, opt.col ? 3.5 : 2) +
      R(x, y, w, th, 20, col, null, null, { opacity: 0.20 });
    /* the bar: the everyday word, becoming the parcel and the NAME */
    if (named < 1)
      out += G(Tx(x + w / 2, y + th / 2 + 9, name.toLowerCase(), "lab big", "middle", { fill: P.muted }),
        { opacity: 1 - named });
    if (named > 0)
      out += G(Em(x + 34, y + th / 2, 30, "\u{1F4E6}") +
        Tx(x + 58, y + th / 2 + 9, name, "lab caps", "start", { "font-size": 25, fill: opt.col ? col : P.ink }),
        { opacity: named });

    var bodyTop = y + th, bodyH = h - th;
    var away = clamp(open * 1.7, 0, 1), arrive = clamp((open - 0.4) / 0.6, 0, 1);
    if (away < 1)
      out += G(Em(x + w / 2, bodyTop + bodyH * 0.50, Math.min(92, bodyH * 0.55), SR_BIN[name]), { opacity: 1 - away });
    if (arrive > 0) {
      var rows = "";
      if (opt.pics) {
        /* a small box shows its steps as the lesson's own pictures, side by
           side: four rows of words in a box this size would come out at 13px,
           under the size anything in a picture is allowed to be read at. */
        var cw = (w - 26) / steps.length, ch = bodyH - 22;
        steps.forEach(function (st, k) {
          var cx = x + 13 + cw * k;
          rows += R(cx + 3, bodyTop + 10, cw - 6, ch, 12, P.cell, P.line, 2) +
            Em(cx + cw / 2, bodyTop + 10 + ch / 2, Math.min(44, cw * 0.62), st.pic);
        });
      } else {
        var gap = 8, rh = (bodyH - 22 - (steps.length - 1) * gap) / steps.length;
        steps.forEach(function (st, k) {
          rows += srRow(x + 13, bodyTop + 10 + k * (rh + gap), w - 26, rh, st,
            { n: null, fs: Math.min(19, rh * 0.48) });
        });
      }
      out += G(rows, { opacity: arrive });
    }
    return G(out, { opacity: clamp(o, 0, 1) * (opt.faded ? 0.38 : 1) });
  }

  /* ==== chapter: big task, named parts =========================================
     One big job at the top, four named parts under it, and then the parts opened
     so the child sees that nothing was thrown away. Nothing here is a picture of
     a mistake; every state is the lesson's own decomposition of a school
     morning, in the lesson's own words. */
  var SR_PART_X = [40, 316, 592, 868];     /* four boxes, 260 wide, 16 apart */
  var SR_PART = { y: 186, w: 260, h: 236 };

  function srDecomposeChapter(scene, beat, t, i) {
    var cTask = sc(scene, 0, "task"), cEasier = sc(scene, 0, "easier"), cMorning = sc(scene, 0, "morning");
    var cDecomp = sc(scene, 1, "decomposition"), cFour = sc(scene, 1, "four"), cNames = sc(scene, 1, "names");
    var cEach = sc(scene, 2, "each"), cSub = sc(scene, 2, "sub"), cName = sc(scene, 2, "name");
    var cSmall = sc(scene, 3, "small"), cWash = sc(scene, 3, "wash"), cSteps = sc(scene, 3, "steps");
    var cSkips = sc(scene, 4, "skips"), cStill = sc(scene, 4, "still");
    var out = "";

    /* the one big job */
    out += MK.pop(R(404, 20, 360, 98, 24, P.card, P.gold, 3) +
      Em(452, 69, 52, "\u{1F9E9}") +
      Tx(488, 62, "a school morning", "lab big", "start") +
      Tx(488, 93, "one big task", "lab mid muted", "start"), 584, 69, popIn(t, cTask, 0.45));
    out += R(400, 16, 368, 106, 26, "none", P.gold, 4, { opacity: bump(t, cEasier, 1.6) * 0.9 });
    out += R(400, 16, 368, 106, 26, "none", P.gold, 4, { opacity: bump(t, cDecomp, 1.6) * 0.9 });
    out += MK.leader(584, 122, 584, 152, on(t, cMorning, 0.5), P.gold);

    /* four places for the four parts, then the parts themselves as they are named */
    var boxes = tally(t, cFour, 4, 0.6), shown = tally(t, cNames, 4, 1.2);
    var named = on(t, cSub, 0.6), openAll = on(t, cStill, 0.45);
    var washOnly = srPast(t, cWash) && !srPast(t, cSkips);
    SR_ORDER.forEach(function (nm, k) {
      var x = SR_PART_X[k];
      if (k >= boxes) return;
      if (k >= shown) {
        out += R(x, SR_PART.y, SR_PART.w, SR_PART.h, 20, "none", P.line, 2.5, { "stroke-dasharray": "14 10" });
        return;
      }
      var isWash = nm === "WASH";
      var appear = popIn(t, cNames == null ? null : cNames + k * 0.4, 0.4);
      out += G(MK.arrow(584, 126, x + SR_PART.w / 2, SR_PART.y - 8, 1, P.gold, 5), { opacity: Math.min(1, appear) });
      out += srPartBox(x, SR_PART.y, SR_PART.w, SR_PART.h, nm, {
        o: appear, named: named,
        open: Math.max(isWash ? on(t, cSteps, 0.6) : 0, openAll),
        col: isWash && washOnly ? P.gold : null,
        faded: washOnly && !isWash
      });
    });

    /* the words the chapter is naming, clear of the arrows */
    out += MK.pill(192, 52, "each part is a sub-routine",
      on(t, cEach, 0.5) * (1 - on(t, cSmall, 0.28)), { size: 21, col: P.gold, ink: P.gold });
    out += MK.pill(192, 52, "a small algorithm",
      on(t, cSmall == null ? null : cSmall + 0.32, 0.42) * (1 - on(t, cSkips, 0.28)),
      { size: 21, col: P.gold, ink: P.gold });
    out += MK.pill(192, 52, "nothing is skipped", on(t, cSkips == null ? null : cSkips + 0.32, 0.42),
      { size: 21, col: P.good, ink: P.good });
    out += MK.pill(968, 52, "four parts", popIn(t, cFour, 0.45) * (1 - on(t, cSkips, 0.4)),
      { size: 21, col: P.gold, ink: P.gold });
    out += MK.pill(968, 52, "all the steps are still there", on(t, cStill, 0.6),
      { size: 21, col: P.good, ink: P.good });

    /* "a name of its own": the name on each bar, ringed as it is said */
    var nameFlash = bump(t, cName, 1.6);
    if (nameFlash > 0) SR_ORDER.forEach(function (nm, k) {
      if (k >= shown) return;
      out += R(SR_PART_X[k] + 7, SR_PART.y + 7, SR_PART.w - 14, 38, 12, "none", P.gold, 3, { opacity: nameFlash });
    });
    return svg(out);
  }

  /* ==== chapter: the main algorithm =============================================
     The five lines on the left, the four parts they call on the right. The lines
     arrive as they are read out, one arrow at a time shows a call reaching its
     part, and the parts open on "tucked away" so the detail is seen to be
     there. */
  var SR_MM = { x: 44, y: 62, w: 520, rh: 58, gap: 11 };
  function srMainRowY(k) { return SR_MM.y + k * (SR_MM.rh + SR_MM.gap); }
  var SR_MB = [{ x: 610, y: 36 }, { x: 884, y: 36 }, { x: 610, y: 228 }, { x: 884, y: 228 }];
  var SR_MB_W = 258, SR_MB_H = 178;

  function srMainChapter(scene, beat, t, i) {
    var cMain = sc(scene, 0, "main"), cShort = sc(scene, 0, "short");
    var cLine = sc(scene, 1, "line"), cOrder = sc(scene, 1, "order");
    var cW = sc(scene, 2, "wash"), cD = sc(scene, 2, "dress"), cB = sc(scene, 2, "breakfast"), cG = sc(scene, 2, "bag");
    var cLeave = sc(scene, 3, "leave"), cFive = sc(scene, 3, "five"), cGlance = sc(scene, 3, "glance");
    var cEach = sc(scene, 4, "each"), cCall = sc(scene, 4, "call"), cRuns = sc(scene, 4, "runs");
    var cBehind = sc(scene, 5, "behind"), cDetail = sc(scene, 5, "detail"), cTucked = sc(scene, 5, "tucked");
    var out = "";

    out += MK.pill(SR_MM.x, 34, "Main algorithm", popIn(t, cMain, 0.45),
      { size: 21, anchor: "start", col: P.accent, ink: P.accent });
    out += MK.pill(564, 34, "the short list at the top", on(t, cShort, 0.5) * (1 - on(t, cFive, 0.5)),
      { size: 20, anchor: "end", col: P.line });

    /* the shape of the short list, then five empty lines, one for each part */
    out += G(R(SR_MM.x - 14, SR_MM.y - 12, SR_MM.w + 28, 5 * SR_MM.rh + 4 * SR_MM.gap + 24, 22,
      "none", P.accent, 3, { "stroke-dasharray": "16 12" }),
      { opacity: on(t, cShort, 0.6) * (1 - on(t, cW, 0.5)) });
    var slots = tally(t, cLine, 5, 0.9), at = [cW, cD, cB, cG, cLeave];
    SR_MAIN.forEach(function (item, k) {
      var here = on(t, at[k], 0.4);
      if (k < slots && here < 1) out += srSlot(SR_MM.x, srMainRowY(k), SR_MM.w, SR_MM.rh, k + 1, 1 - here);
      if (here > 0) {
        out += srRow(SR_MM.x, srMainRowY(k), SR_MM.w, SR_MM.rh, item, { n: k + 1, fs: 24, o: here });
        out += MK.ripple(SR_MM.x + 30, srMainRowY(k) + SR_MM.rh / 2, t, at[k], P.gold);
      }
    });
    /* the order they happen in: a line drawn down beside the numbers */
    out += MK.leader(SR_MM.x - 12, srMainRowY(0) + 10, SR_MM.x - 12, srMainRowY(4) + SR_MM.rh - 10,
      on(t, cOrder, 0.9) * (1 - on(t, cW, 0.4)), P.muted);

    /* five lines, read at a glance */
    out += MK.pill(564, 34, "five lines", popIn(t, cFive, 0.45), { size: 21, anchor: "end", col: P.accent, ink: P.accent });
    out += MK.tick(588, 400, 21, popIn(t, cGlance, 0.4));

    /* the four parts: dark, then one arrow at a time, then opened out */
    var boxO = Math.max(on(t, cRuns, 0.7) * 0.55, on(t, cDetail, 0.8));
    SR_ORDER.forEach(function (nm, k) {
      var b = SR_MB[k], f = bump(t, cCall == null ? null : cCall + k * 0.34, 0.8);
      out += srPartBox(b.x, b.y, SR_MB_W, SR_MB_H, nm, {
        o: 0.28 + 0.72 * boxO, named: 1, open: on(t, cTucked, 0.9),
        col: f > 0.25 ? P.gold : null
      });
      if (f > 0)
        out += G(MK.arrow(SR_MM.x + SR_MM.w + 14, srMainRowY(k) + SR_MM.rh / 2, b.x - 10, b.y + 28, 1, P.gold, 5),
          { opacity: f });
    });

    /* "each do is a call": the four call lines, ringed together */
    var eachF = bump(t, cEach, 1.5);
    if (eachF > 0) for (var k = 0; k < 4; k++)
      out += R(SR_MM.x + 4, srMainRowY(k) + 4, SR_MM.w - 8, SR_MM.rh - 8, 15, "none", P.gold, 3, { opacity: eachF });

    out += MK.pill(300, 420, "all the detail, tucked away", on(t, cBehind, 0.6),
      { size: 20, col: P.accent, ink: P.accent });
    return svg(out);
  }
