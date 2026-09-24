  /* ==== Rows and Rules, part 3 ================================================
     "Sharing, and what is left" and "Multiples of 2, 5 and 10". The sharing
     opens with the lesson's own estimate (3Ni.09 asks for it too, not just the
     division): 12 is the friendly multiple of 4 under 13, and 12 / 4 = 3, so
     expect about 3 each. Then the lesson's own 13 shared between 4: the
     sweets are dealt one to each, round and round, twelve of them land and
     the thirteenth is the remainder. The multiples are its number line
     counted in fives and its 100 square, which is what "the last digit tells
     you" looks like. */

  /* ---- sharing ---------------------------------------------------------------
     13 sweets in the bowl, 4 plates, and one left over. */
  var RR_SW = 13, RR_GROUPS = 4, RR_EACH = 3;
  var RR_BOWL = { cx: 250, cy: 108, cell: 40, cols: 7 };
  var RR_PLATE = { y: 300, w: 168, h: 126, xs: [220, 420, 620, 820] };
  var RR_LEFT = { cx: 1032, cy: 300 };

  /* where sweet k sits in the bowl */
  function rrBowlAt(k) {
    var b = RR_BOWL, pad = rrPad(b.cell), rows = 2;
    var w = b.cols * b.cell + 2 * pad, h = rows * b.cell + 2 * pad;
    var x0 = b.cx - w / 2, y0 = b.cy - h / 2;
    return [x0 + pad + (k % b.cols) * b.cell + b.cell / 2, y0 + pad + Math.floor(k / b.cols) * b.cell + b.cell / 2];
  }
  /* where the k-th dealt sweet lands: group k % 4, slot floor(k / 4) */
  function rrPlateAt(k) {
    var g = k % RR_GROUPS, slot = Math.floor(k / RR_GROUPS);
    return [RR_PLATE.xs[g] - 26, RR_PLATE.y - 34 + slot * 34];
  }

  function rrShareChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cEst = c(0, "est"), cNear = c(0, "near"), cExpect = c(0, "expect");
    var cSweets = c(1, "sweets"), cFriends = c(1, "friends"), cDeal = c(1, "deal");
    var cThree = c(2, "three"), cTwelve = c(2, "twelve");
    var cLeft = c(3, "left"), cRem = c(3, "rem");
    var cSmaller = c(4, "smaller"), cOne = c(4, "one");
    var out = "", k, b = RR_BOWL, pad = rrPad(b.cell);

    /* "Estimate first. Twelve is close to thirteen, so expect about three
       each.": the lesson's own round7 makes this estimate before dividing -
       12 is the nearest friendly multiple of 4 under 13, and 12 / 4 = 3 */
    var estO = rrOnly(t, scene, 0);
    if (estO > 0.001) {
      out += G(Tx(b.cx, 90, "13 ÷ 4", "lab", "middle", { "font-size": 54, fill: P.gold }),
        { opacity: n3(on(t, cEst, 0.4) * estO) });
      out += MK.pill(b.cx, 170, "12 is close to 13", on(t, cNear, 0.45) * estO, { size: 27, col: P.teal });
      out += rrFact(b.cx, 254, "12 ÷ 4 = 3", popIn(t, cNear, 0.45) * estO, { size: 38, w: 260, col: P.teal });
      out += G(Tx(b.cx, 320, "expect about 3 each", "lab big", "middle", { fill: P.muted }),
        { opacity: n3(on(t, cExpect, 0.5) * estO) });
    }

    /* the bowl: it empties as the sweets are dealt, and goes when the last
       one is lifted out of it, so nothing on screen says 13 over an empty box */
    var bowlW = b.cols * b.cell + 2 * pad, bowlH = 2 * b.cell + 2 * pad;
    var sweetO = on(t, cSweets, 0.45);
    var bowlO = sweetO * (1 - on(t, cLeft, 0.6));
    if (bowlO > 0.001) out += G(R(b.cx - bowlW / 2, b.cy - bowlH / 2, bowlW, bowlH, 16, ART.C.cell, ART.C.line, 2), { opacity: n3(bowlO) });
    var capO = bowlO * (1 - on(t, cDeal, 0.7));
    if (capO > 0.001) {
      out += G(Tx(b.cx, b.cy + bowlH / 2 + 30, "13 sweets", "lab big", "middle", { fill: P.muted }), { opacity: n3(capO) });
    }

    /* the four plates */
    for (k = 0; k < RR_GROUPS; k++) {
      var po = clamp(tally(t, cFriends, RR_GROUPS, 0.5) - k, 0, 1);
      if (po <= 0.001) continue;
      out += G(R(RR_PLATE.xs[k] - RR_PLATE.w / 2, RR_PLATE.y - RR_PLATE.h / 2, RR_PLATE.w, RR_PLATE.h, 18,
          ART.C.card, ART.C.line, 2.5) +
        Tx(RR_PLATE.xs[k], RR_PLATE.y + RR_PLATE.h / 2 + 30, "friend " + (k + 1), "lab mid", "middle", { fill: P.muted }),
        { opacity: n3(po) });
    }

    /* the sweets: twelve are dealt one to each, round and round; the
       thirteenth stays in the bowl until it is named the remainder */
    var r = b.cell * 0.3;
    for (k = 0; k < RR_SW; k++) {
      var from = rrBowlAt(k), to, u = 0;
      if (k < RR_GROUPS * RR_EACH) {
        to = rrPlateAt(k);
        var go = cDeal == null ? null : cDeal + 0.18 + k * 0.105;
        u = go == null ? 0 : ease(clamp((t - go) / 0.45, 0, 1));
      } else {
        to = [RR_LEFT.cx, RR_LEFT.cy];
        u = ease(clamp(on(t, cLeft, 0.55), 0, 1));
      }
      var x = lerp(from[0], to[0], u), y = lerp(from[1], to[1], u);
      var col = k >= RR_GROUPS * RR_EACH ? ART.C.accent : ART.C.teal;
      out += C(x, y, r * sweetO, col);
      if (k >= RR_GROUPS * RR_EACH && u > 0.5) out += C(x, y, r + 9, "none", P.accent, 3.5, { opacity: n3((u - 0.5) * 2) });
    }

    /* "Three each, and that is twelve given out" */
    var each = on(t, cThree, 0.45);
    if (each > 0.001) {
      for (k = 0; k < RR_GROUPS; k++) {
        out += G(Tx(RR_PLATE.xs[k] + 44, RR_PLATE.y + 12, "3", "lab", "middle",
          { "font-size": 36, fill: P.gold }), { opacity: n3(each) });
      }
    }
    var twelve = on(t, cTwelve, 0.45) * rrOnly(t, scene, 2);
    if (twelve > 0.001) {
      out += G(Tx(1032, 120, "12", "lab", "middle", { "font-size": 84, fill: P.gold }) +
        Tx(1032, 166, "given out", "lab big", "middle", { fill: P.muted }), { opacity: n3(twelve) });
    }

    /* "One sweet is left over. That one is the remainder." */
    var leftO = on(t, cLeft, 0.5);
    if (leftO > 0.001) {
      out += G(R(RR_LEFT.cx - 62, RR_LEFT.cy - RR_PLATE.h / 2, 124, RR_PLATE.h, 18, "none", P.accent, 3,
          { "stroke-dasharray": "10 7" }), { opacity: n3(leftO) });
    }
    var remO = on(t, cRem, 0.45);
    if (remO > 0.001) {
      out += G(Tx(RR_LEFT.cx, RR_LEFT.cy + RR_PLATE.h / 2 + 30, "remainder 1", "lab big", "middle", { fill: P.accent }),
        { opacity: n3(remO) });
    }

    /* "A remainder must be smaller than the number of groups." */
    var rule = rrOnly(t, scene, 4);
    if (rule > 0.01) {
      out += G(Tx(1032, 112, "1 < 4", "lab", "middle", { "font-size": 64, fill: P.good }),
        { opacity: n3(on(t, cSmaller, 0.5) * rule) });
      out += MK.tick(1032, 176, 24, popIn(t, cOne, 0.4) * rule);
      out += G(Tx(640, 112, "13 ÷ 4 = 3 remainder 1", "lab", "middle", { "font-size": 38, fill: P.gold }),
        { opacity: n3(on(t, cOne, 0.5) * rule) });
    }
    return svg(out);
  }

  /* ==== chapter: multiples of 2, 5 and 10 =======================================
     3Ni.10. Counting on in fives, and then the lesson's own rule: the last
     digit tells you, seen as columns of the 100 square. */
  /* The lesson's own multiples step shows THIRTY numbers at a time
     (grid100, base to base + 29), not a hundred, so the chart here is 1 to 30
     in ten columns - which is also what lets its numbers be read. */
  var RR_GRID = { x: 272, y: 40, cell: 58, edge: 22, cols: 10, rows: 3 };
  function rrCellsEnding(step) {
    var out = [], n, last = RR_GRID.cols * RR_GRID.rows;
    for (n = step; n <= last; n += step) out.push([(n - 1) % RR_GRID.cols, Math.floor((n - 1) / RR_GRID.cols)]);
    return out;
  }
  /* the centre of the chart's column j, in film coordinates */
  function rrColX(j) { return RR_GRID.x + RR_GRID.edge + j * RR_GRID.cell + RR_GRID.cell / 2; }

  function rrMultiplesChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSteps = c(0, "steps"), cFive = c(0, "five");
    var cMult = c(1, "mult");
    var cDigit = c(2, "digit"), cEnd = c(2, "end");
    var cTen = c(3, "ten"), cTwo = c(3, "two");

    var late = rrFrom(t, scene, 2), early = 1 - late, out = "", k;

    if (early > 0.001) {
      var jumps = [], marks = [], n = cFive == null ? 0 : tally(t, cFive, 4, 1.5);
      if (cFive == null || t < cFive) n = 0;
      for (k = 0; k < n; k++) jumps.push({ from: k * 5, to: (k + 1) * 5, label: "+5" });
      if (cMult != null && t >= cMult) for (k = 1; k <= 4; k++) marks.push({ at: k * 5, colour: "accent" });
      var line = ART.numberLine({ from: 0, to: 30, step: 5, labelEvery: 5, jumps: jumps, marks: marks });
      var e = ART.place(line, 274, 116, 620, 197);
      e += MK.pill(584, 378, "5, 10, 15, 20 are multiples of 5", on(t, cMult, 0.5), { size: 30, col: P.gold });
      if (on(t, cSteps, 0.5) > 0.001) {
        e += G(Tx(584, 80, "count on in equal steps from 0", "lab big", "middle", { fill: P.muted }),
          { opacity: n3(on(t, cSteps, 0.5)) });
      }
      out += G(e, { opacity: n3(early) });
    }

    if (late > 0.001) {
      var fill = [], head = "", sub = "", col = P.gold;
      if (cTwo != null && t >= cTwo) { fill = rrCellsEnding(2); head = "Multiples of 2"; sub = "end in 0, 2, 4, 6 or 8"; col = P.good; }
      else if (cTen != null && t >= cTen) { fill = rrCellsEnding(10); head = "Multiples of 10"; sub = "end in 0"; col = P.plum; }
      else if (cEnd != null && t >= cEnd) { fill = rrCellsEnding(5); head = "Multiples of 5"; sub = "end in 0 or 5"; col = P.gold; }
      var g = ART.grid({ cols: RR_GRID.cols, rows: RR_GRID.rows, cell: RR_GRID.cell, numbers: true,
        fill: fill, label: false, colour: "gold" });
      var gw = 2 * RR_GRID.edge + RR_GRID.cols * RR_GRID.cell, gh = 2 * RR_GRID.edge + RR_GRID.rows * RR_GRID.cell;
      var m = ART.place(g, RR_GRID.x, RR_GRID.y, gw, gh);
      /* "The last digit tells you": the ten last digits, under their columns */
      var d = on(t, cDigit, 0.5);
      if (d > 0.001) {
        for (k = 0; k < RR_GRID.cols; k++) {
          var dx = rrColX(k), du = clamp(tally(t, cDigit, RR_GRID.cols, 0.7) - k, 0, 1);
          if (du <= 0.001) continue;
          m += G(R(dx - 20, 272, 40, 38, 9, P.cell, P.line, 1.5) +
            Tx(dx, 299, String((k + 1) % 10), "lab", "middle", { fill: P.gold }), { opacity: n3(du) });
        }
        m += G(Tx(rrColX(9) + 40, 299, "the last digit", "lab mid", "start", { fill: P.gold }), { opacity: n3(d) });
      }
      var headO = Math.max(on(t, cEnd, 0.4), on(t, cTen, 0.4), on(t, cTwo, 0.4));
      if (head && headO > 0.001) {
        m += G(Tx(584, 368, head, "lab", "middle", { "font-size": 40, fill: col }) +
          Tx(584, 414, sub, "lab big", "middle", { fill: P.muted }), { opacity: n3(headO) });
      }
      out += G(m, { opacity: n3(late) });
    }
    return svg(out);
  }
