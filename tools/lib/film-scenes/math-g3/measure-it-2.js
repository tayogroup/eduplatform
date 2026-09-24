  /* ==== Grade 3 Mathematics, Lesson 6: Measure It - part 2 =====================
     tools/lib/film-scenes/math-g3/measure-it-2.js, joined to measure-it.js in
     one scope. The chapters "Reading a scale", "Measure from any mark" and
     "Right angles and turns", then the recap and the KINDS table.

     The scale chapter is the film's hardest promise: the pointer must sit on
     the mark the voice reads. It does, because both the printed numbers and
     the pointer come from ONE ART.numberLine call (300 to 400, ticked every
     50, printed every 100, marked at 350), and everything this file draws over
     it - the pointer, the gap arcs, the hundred-apart span - is positioned by
     minX(), which maps a value through that call's own geometry. The same is
     true of misX() over the ruler in "Measure from any mark": the seven
     counting squares are drawn one per centimetre cell from 2 to 9, so the
     seven the voice counts is the seven on the ruler. */

  /* ==== chapter: reading a scale ===============================================
     The lesson's own words: "A scale is the marked line on an instrument", and
     "count the gaps, not the marks". */
  /* The scale runs 200 to 500 rather than only 300 to 400, so that the small
     marks the chapter is ABOUT can be seen along the rest of it: the pointer
     stands on the 350 mark and 300 and 400 are two of the four printed
     numbers. The pointer is drawn here, above the line, rather than asked of
     numberLine as a mark - a mark is a filled circle of radius 14 and it sat
     squarely on top of the one small tick the voice is talking about. */
  var MI_N = { x: 24, y: 242.8, w: 1120, W: 900, k: 1120 / 900, pad: 36, from: 200, to: 500 };
  function minX(v) {
    return MI_N.x + (MI_N.pad + ((v - MI_N.from) / (MI_N.to - MI_N.from)) * (MI_N.W - 2 * MI_N.pad)) * MI_N.k;
  }
  var MI_AY = MI_N.y + 46 * MI_N.k;          /* 300: the line itself, in film space */
  var MI_NUM = MI_N.y + 78 * MI_N.k;         /* 340: the row of printed numbers */

  /* a gap arc from the value a to the value b, with a word at its top */
  function miGapArc(a, b, y, apex, word, wo, col) {
    var xa = minX(a), xb = minX(b), xm = (xa + xb) / 2;
    var out = Pth("M" + n2(xa) + "," + n2(y) + " Q" + n2(xm) + "," + n2(apex) + " " + n2(xb) + "," + n2(y),
      null, col || P.gold, 5);
    if (wo > 0) out += MK.pill(xm, (y + apex) / 2 - 6, word, wo, { size: 26, col: col || P.gold, ink: col || P.gold });
    return out;
  }

  function miScaleChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cLine = c(0, "line"), cPointer = c(0, "pointer"), cMark = c(1, "mark");
    var cPrinted = c(2, "printed"), cApart = c(2, "apart");
    var cGaps = c(3, "gaps"), cTwo = c(3, "two");
    var cShare = c(4, "share"), cReads = c(4, "reads");
    var out = "", answered = cReads != null && t >= cReads, shared = cShare != null && t >= cShare;

    out += ART.place(ART.numberLine({
      from: 200, to: 500, step: 50, labelEvery: 100, width: MI_N.W,
      label: "the kitchen scale, in grams"
    }), MI_N.x, MI_N.y, MI_N.w, MI_N.w * 138 / MI_N.W);

    /* "this pointer": a pointer standing on the 350 mark, gold once it is read */
    var po = popIn(t, cPointer, 0.45);
    if (po > 0) {
      var px = minX(350), col = answered ? P.gold : P.accent;
      out += MK.pop(Pth("M" + n2(px) + "," + n2(MI_AY - 12) + " L" + n2(px - 19) + "," + n2(MI_AY - 50) +
        " L" + n2(px + 19) + "," + n2(MI_AY - 50) + " Z", col, P.ground, 2), px, MI_AY - 30, po);
      out += MK.qmark(px + 86, MI_AY - 54, 24, on(t, cPointer, 0.5) * (1 - miFrom(t, scene, 3)));
    }
    /* "the marked line": the whole line brightens */
    var lo = bump(t, cLine, 1.1);
    if (lo > 0) out += L(minX(200) - 22, MI_AY, minX(500) + 22, MI_AY, P.gold, 7, { opacity: 0.5 * lo });

    /* "one small mark": one of the unprinted ticks is ringed, and so is the
       one the pointer stands on */
    var mo = on(t, cMark, 0.45) * miOnly(t, scene, 1);
    if (mo > 0) {
      out += C(minX(250), MI_AY, 24 + 4 * breathe(t), "none", P.gold, 4, { opacity: mo });
      out += C(minX(450), MI_AY, 24 + 4 * breathe(t), "none", P.gold, 4, { opacity: mo * 0.7 });
      out += MK.pill(minX(250), 146, "worth what?", mo, { size: 28, col: P.gold, ink: P.gold });
    }

    /* "are printed": the two printed numbers this reading sits between */
    var pr = on(t, cPrinted, 0.45) * miBetween(t, scene, 2, 5);
    if (pr > 0) {
      out += MK.glow(minX(300), MI_NUM, 48, P.gold, pr);
      out += MK.glow(minX(400), MI_NUM, 48, P.gold, pr);
    }
    /* "a hundred apart": a span between them, and it stays */
    var ap = on(t, cApart, 0.6) * miBetween(t, scene, 2, 5);
    if (ap > 0) {
      out += miSpan(minX(300), 146, minX(400), 146, ap, shared ? P.teal : P.gold, 5);
      /* the hundred, which is then SHARED between the two gaps in the last beat */
      out += MK.pill(minX(350), 96, shared ? "100 ÷ 2 = 50" : "100",
        on(t, cApart == null ? null : cApart + 0.2, 0.4), { size: 30, col: shared ? P.teal : P.gold, ink: shared ? P.teal : P.gold });
    }

    /* "Count the gaps": two arcs, one at a time, each worth 50 once shared */
    var arcs = tally(t, cGaps, 2, 0.75) * (miBetween(t, scene, 3, 5) > 0.02 ? 1 : 0);
    var aw = shared ? "50" : "1", bw = shared ? "50" : "2";
    if (arcs >= 1) out += miGapArc(300, 350, 238, 184, aw, on(t, cGaps, 0.4), shared ? P.teal : P.gold);
    if (arcs >= 2) out += miGapArc(350, 400, 238, 184, bw, on(t, cGaps == null ? null : cGaps + 0.4, 0.4), shared ? P.teal : P.gold);
    var tw = on(t, cTwo, 0.4) * miBetween(t, scene, 3, 5);
    if (tw > 0) out += MK.pill(268, 96, "2 gaps", tw, { size: 30, col: P.gold, ink: P.gold });

    /* the reading, once the mark is worth something */
    var rd = popIn(t, cReads, 0.45) * miOnly(t, scene, 4);
    if (rd > 0) {
      out += MK.pop(MK.pill(956, 186, "350", 1, { size: 40, col: P.gold, ink: P.gold }), 956, 186, rd);
      out += MK.tick(1070, 186, 26, popIn(t, cReads == null ? null : cReads + 0.4, 0.4));
    }
    return svg(out);
  }

  /* ==== chapter: measure from any mark ==========================================
     The lesson's own example: a pencil from the 2 to the 9 on a ruler ticked
     every centimetre. misX maps a centimetre onto the film through the same
     numbers ART.ruler was asked for (edge 34, pitch floor(440 / 12) = 36). */
  var MI_S = { x: 264, y: 96, w: 640, W: 500, H: 186, edge: 34, pitch: 36 };
  MI_S.k = MI_S.w / MI_S.W;
  MI_S.h = MI_S.H * MI_S.k;
  function misX(v) { return MI_S.x + (MI_S.edge + MI_S.pitch * v) * MI_S.k; }
  function misY(yy) { return MI_S.y + yy * MI_S.k; }

  function miStartChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cZero = c(0, "zero"), cTwo = c(1, "two"), cNine = c(1, "nine");
    var cEnd = c(2, "end"), cLong = c(2, "long");
    var cTake = c(3, "take");
    var cCount = c(4, "count"), cLen = c(4, "len");
    var out = "", solved = cLen != null && t >= cLen;

    out += ART.place(ART.ruler({
      length: 12, unit: "cm",
      item: { from: 2, to: 9, label: solved ? "7 cm" : "?" }
    }), MI_S.x, MI_S.y, MI_S.w, MI_S.h);

    /* "start at zero": the 0 end of the ruler, where the pencil is not */
    var z = on(t, cZero, 0.5) * miOnly(t, scene, 0);
    if (z > 0) {
      out += C(misX(0), misY(107), 22, "none", P.muted, 4, { opacity: z });
      out += MK.cross(misX(0), misY(58), 20, popIn(t, cZero == null ? null : cZero + 0.35, 0.4) * miOnly(t, scene, 0));
    }

    /* "at the two" and "at the nine": the two marks the pencil really sits on */
    var t2 = on(t, cTwo, 0.45), t9 = on(t, cNine, 0.45), keep = miBetween(t, scene, 1, 5), pills = miBetween(t, scene, 1, 4);
    if (t2 * keep > 0) {
      out += C(misX(2), misY(107), 20, "none", P.gold, 4, { opacity: t2 * keep });
      if (pills > 0.02) out += G(miLabel(t, misX(2), 384, "2", cTwo, [misX(2), misY(126)], { size: 28 }), { opacity: pills });
    }
    if (t9 * keep > 0) {
      out += C(misX(9), misY(107), 20, "none", P.gold, 4, { opacity: t9 * keep });
      if (pills > 0.02) out += G(miLabel(t, misX(9), 384, "9", cNine, [misX(9), misY(126)], { size: 28 }), { opacity: pills });
    }

    /* "you get nine": the wrong reading, a span from 0, which then retracts */
    var wrong = miBetween(t, scene, 2, 4), fix = on(t, cTake, 0.8);
    var e = on(t, cEnd, 0.5) * Math.max(wrong, miOnly(t, scene, 3));
    if (e > 0) {
      var x0 = lerp(misX(0), misX(2), fix), col = fix > 0.5 ? P.gold : P.bad;
      out += miSpan(x0, 72, misX(9), 72, e, col, 5);
      if (fix < 0.5) {
        out += MK.pill(misX(4.5), 34, "9 cm", e, { size: 30, col: P.bad, ink: P.bad });
        out += MK.cross(misX(4.5) + 88, 34, 24, popIn(t, cLong, 0.4) * wrong);
      }
    }
    /* "Count on from the two": an arrow grows from the two towards the nine.
       This replaces an earlier "9 − 2 = 7" subtraction pill - the lesson's
       own method here is counting on, and never a written subtraction (its
       "Measure from any mark" step says only "Count on from 2 to 9: that is
       7 centimetres", every time it asks this question). */
    var goOn = on(t, cTake, 0.8) * miFrom(t, scene, 3);
    if (goOn > 0.02) out += MK.arrow(misX(2), 34, misX(9) - 10, 34, goOn, P.gold, 6);

    /* "Count on, one centimetre at a time": one gold square per centimetre cell, 2 to 9 */
    var n = tally(t, cCount, 7, 1.5) * (miOnly(t, scene, 4) > 0.02 ? 1 : 0);
    for (var k = 0; k < n; k++) {
      var cx = misX(2.5 + k), cy = 366;
      out += MK.pop(R(cx - 17, cy - 17, 34, 34, 8, P.gold, P.goldDeep, 2) +
        Tx(cx, cy + 7, String(k + 1), "lab mid dark", "middle"), cx, cy, popIn(t, cCount == null ? null : cCount + k * 0.19, 0.3));
    }
    var lo = popIn(t, cLen, 0.45) * miOnly(t, scene, 4);
    if (lo > 0) {
      out += MK.pop(MK.pill(1010, 200, "7 cm", 1, { size: 38, col: P.gold, ink: P.gold }), 1010, 200, lo);
      out += MK.tick(1010, 288, 26, popIn(t, cLen == null ? null : cLen + 0.4, 0.4));
    }
    return svg(out);
  }

  /* ==== chapter: right angles and turns =========================================
     Drawn here rather than taken from ART: the library's shape2d marks the
     right angles of a shape and its compass turns a needle between compass
     points, and neither of those is this lesson's picture, which is two arms
     opening from one vertex and compared with a square corner. */
  function miArm(cx, cy, len, deg, col, w, o) {
    if (!(o > 0)) return "";
    var a = -deg * Math.PI / 180;
    return L(cx, cy, cx + len * Math.cos(a), cy + len * Math.sin(a), col, w || 8, { opacity: clamp(o, 0, 1) });
  }
  /* A right angle drawn as its OWN small square, set into the quadrant between
     the arms at 0 and 90 or at 90 and 180. Two corner ticks sharing a vertex
     join into one rectangle, and a child told to count two corners sees one -
     the lesson's own two-right-angles step carries the same note. */
  function miQuadSquare(cx, cy, m, sx, sy, col, o) {
    if (!(o > 0)) return "";
    var g = 13;
    return R(sx > 0 ? cx + g : cx - g - m, sy > 0 ? cy + g : cy - g - m, m, m, 5,
      "none", col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }
  /* the arc between the horizontal arm and an arm at `deg`, swept u of the way */
  function miArc(cx, cy, r, deg, u, col, w) {
    if (!(u > 0)) return "";
    var d = deg * clamp(u, 0, 1), a = -d * Math.PI / 180;
    return Pth("M" + n2(cx + r) + "," + n2(cy) + " A" + n2(r) + "," + n2(r) + " 0 " + (d > 180 ? 1 : 0) + ",0 " +
      n2(cx + r * Math.cos(a)) + "," + n2(cy + r * Math.sin(a)), null, col || P.gold, w || 5);
  }
  function miAngle(cx, cy, len, deg, o, opt) {
    opt = opt || {};
    if (!(o > 0)) return "";
    var col = opt.col || P.ink;
    return miArm(cx, cy, len, 0, col, opt.w || 8, o) + miArm(cx, cy, len, deg, col, opt.w || 8, o) +
      C(cx, cy, 7, col, null, null, { opacity: clamp(o, 0, 1) });
  }

  function miAnglesChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCorner = c(0, "corner"), cQuarter = c(0, "quarter");
    var cBook = c(1, "book"), cCheck = c(1, "check");
    var cLess = c(2, "less"), cSmaller = c(2, "smaller");
    var cWider = c(3, "wider"), cArms = c(3, "arms");
    var cTwo = c(4, "two"), cStraight = c(4, "straight"), cHalf = c(4, "half");
    var out = "";

    /* beat 0: the square corner, and the quarter turn */
    var o0 = miOnly(t, scene, 0);
    if (o0 > 0) {
      var vx = 470, vy = 404, len = 264;
      out += G(miAngle(vx, vy, len, 90, 1, { col: P.ink }), { opacity: o0 });
      out += miQuadSquare(vx, vy, 46, 1, -1, P.gold, on(t, cCorner, 0.45) * o0);
      var q = on(t, cQuarter, 1.0) * o0;
      out += miArc(vx, vy, 168, 90, q, P.gold, 6);
      if (q > 0) {
        var qa = -90 * clamp(q, 0, 1) * Math.PI / 180;
        out += C(vx + 168 * Math.cos(qa), vy + 168 * Math.sin(qa), 12, P.gold, P.ground, 2, { opacity: q });
      }
      out += G(MK.pill(930, 186, "a quarter turn", on(t, cQuarter, 0.4), { size: 30, col: P.gold, ink: P.gold }) +
        MK.pill(930, 278, "a square corner", on(t, cCorner, 0.4), { size: 30, col: P.gold, ink: P.gold }), { opacity: o0 });
    }

    /* beat 1: the corner of a book, held against the angle */
    var o1 = miOnly(t, scene, 1);
    if (o1 > 0) {
      var bx = 74, by = 108, bw = 288, bh = 268;
      out += G(R(bx, by, bw, bh, 8, "#F7F4EC", P.muted, 3) + L(bx + bw - 18, by, bx + bw - 18, by + bh, P.muted, 3),
        { opacity: o1 * popIn(t, cBook, 0.4) });
      out += miQuadSquare(bx, by + bh, 40, 1, -1, P.gold, on(t, cBook, 0.45) * o1);
      var vx1 = 790, vy1 = 392;
      out += G(miAngle(vx1, vy1, 242, 90, 1, { col: P.ink }), { opacity: o1 });
      /* the corner flies across and lands on the vertex */
      var fly = on(t, cCheck, 0.9) * o1;
      if (fly > 0) {
        var fx = lerp(bx, vx1, fly), fy = lerp(by + bh, vy1, fly);
        out += miQuadSquare(fx, fy, 46, 1, -1, P.good, fly);
        out += MK.tick(vx1 + 146, vy1 - 178, 26, popIn(t, cCheck == null ? null : cCheck + 0.7, 0.4) * o1);
      }
      out += G(MK.pill(218, 414, "a right angle", on(t, cBook == null ? null : cBook + 0.3, 0.4), { size: 28, col: P.gold, ink: P.gold }), { opacity: o1 });
    }

    /* beats 2 and 3: smaller, then bigger - always against the same right angle */
    var o2 = miOnly(t, scene, 2), o3 = miOnly(t, scene, 3);
    if (o2 > 0 || o3 > 0) {
      var vx2 = 420, vy2 = 400, L2 = 250, deg = o3 > o2 ? 135 : 45;
      var oo = Math.max(o2, o3), cue = o3 > o2 ? cWider : cLess;
      /* the right angle everything is compared with, in the lesson's words */
      out += G(miArm(vx2, vy2, L2, 0, P.muted, 5, 1) + miArm(vx2, vy2, L2, 90, P.muted, 5, 1) +
        miQuadSquare(vx2, vy2, 38, 1, -1, P.muted, 1), { opacity: oo * 0.7 });
      out += G(MK.pill(vx2, vy2 - L2 - 28, "a right angle", 1, { size: 24, col: P.line, ink: P.muted }), { opacity: oo * 0.8 });
      out += G(miAngle(vx2, vy2, L2, deg, 1, { col: P.ink }), { opacity: oo });
      out += miArc(vx2, vy2, 100, deg, on(t, cue, 0.8) * oo, deg === 45 ? P.blue : P.accent, 6);
      if (o2 > 0) out += G(MK.pill(900, 196, "smaller than", on(t, cSmaller, 0.4), { size: 30, col: P.blue, ink: P.blue }) +
        MK.pill(900, 276, "a right angle", on(t, cSmaller, 0.4), { size: 30, col: P.blue, ink: P.blue }), { opacity: o2 });
      /* "Long arms do not make a bigger angle": the same opening, shorter arms */
      if (o3 > 0) {
        var la = on(t, cArms, 0.6) * o3;
        out += G(MK.pill(170, 118, "bigger", on(t, cWider, 0.4), { size: 30, col: P.accent, ink: P.accent }), { opacity: o3 });
        if (la > 0) {
          out += G(miAngle(866, 400, 150 * (0.3 + 0.7 * la), 135, 1, { col: P.ink, w: 6 }) +
            miArc(866, 400, 100, 135, 1, P.accent, 6), { opacity: la });
          out += MK.pill(690, 140, "same angle", la, { size: 28, col: P.good, ink: P.good });
        }
      }
    }

    /* beat 4: two right angles make a straight line */
    var o4 = miOnly(t, scene, 4);
    if (o4 > 0) {
      var vx4 = 584, vy4 = 356, L4 = 252;
      var sweep = clamp(cTwo == null ? 0 : (t - cTwo) / 1.5, 0, 1), d4 = 180 * ease(sweep);
      out += G(miArm(vx4, vy4, L4, 0, P.ink, 8, 1) + C(vx4, vy4, 7, P.ink), { opacity: o4 });
      out += G(miArm(vx4, vy4, L4, d4, P.teal, 8, 1), { opacity: o4 });
      if (d4 > 1) out += miArc(vx4, vy4, 152, d4, 1, P.gold, 6);
      out += miQuadSquare(vx4, vy4, 44, 1, -1, P.gold, d4 >= 89 ? o4 : 0);
      out += miQuadSquare(vx4, vy4, 44, -1, -1, P.gold, d4 >= 179 ? o4 : 0);
      var st = on(t, cStraight, 0.5) * o4;
      if (st > 0) out += L(vx4 - L4, vy4, vx4 + L4, vy4, P.good, 12, { opacity: 0.5 * st });
      out += G(MK.pill(226, 130, "a straight line", on(t, cStraight, 0.4), { size: 30, col: P.good, ink: P.good }) +
        MK.pill(944, 130, "a half turn", on(t, cHalf, 0.4), { size: 30, col: P.gold, ink: P.gold }), { opacity: o4 });
    }
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------ */
  function miMiniScale(cx, cy, size) {
    var w = size * 1.5, y = cy + size * 0.18, out = L(cx - w / 2, y, cx + w / 2, y, P.ink, 4);
    for (var k = 0; k <= 4; k++) {
      var x = cx - w / 2 + (w * k) / 4, big = k % 2 === 0;
      out += L(x, y - (big ? 14 : 8), x, y + (big ? 14 : 8), P.ink, big ? 3 : 2);
    }
    return out + Pth("M" + n2(cx) + "," + n2(y - 16) + " L" + n2(cx - 12) + "," + n2(y - 42) +
      " L" + n2(cx + 12) + "," + n2(y - 42) + " Z", P.gold);
  }
  function miMiniRuler(cx, cy, size) {
    var w = size * 1.7, x0 = cx - w / 2, y = cy - size * 0.1;
    var out = R(x0, y, w, size * 0.5, 5, "#FBEFC9", "#C99700", 3);
    for (var k = 0; k <= 6; k++) out += L(x0 + (w * k) / 6, y, x0 + (w * k) / 6, y + size * 0.2, "#1B2A2F", 2);
    return out + R(x0 + w * 0.26, y - size * 0.34, w * 0.58, size * 0.26, 5, P.tealSoft, P.teal, 3);
  }
  var MI_RECAP = MK.recapKind([
    { beat: 0, at: "length", title: "Length", sub: "cm, m, km", pic: "\u{1F4CF}" },
    { beat: 0, at: "mass", title: "Mass", sub: "g and kg", pic: "⚖️" },
    { beat: 0, at: "capacity", title: "Capacity", sub: "ml and l", pic: "\u{1F964}" },
    { beat: 1, at: "scale", title: "Read the scale", sub: "one mark first", pic: miMiniScale },
    { beat: 2, at: "start", title: "Start anywhere", sub: "count on from the start", pic: miMiniRuler },
    { beat: 3, at: "angle", title: "Right angle", sub: "a quarter turn", pic: "\u{1F4D0}" }
  ], { goBeat: 3, goAt: "line" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Length, mass and capacity", "Reading a scale carefully", "Right angles and turns"] }),
    length: miLengthChapter, mass: miMassChapter, capacity: miCapacityChapter,
    scale: miScaleChapter, startmark: miStartChapter, angles: miAnglesChapter,
    recap: MI_RECAP
  };
