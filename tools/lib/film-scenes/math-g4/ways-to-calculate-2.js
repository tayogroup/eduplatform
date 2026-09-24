  /* ==== Ways to Calculate, part 2: the two written methods ====================
     347 + 185 and 623 - 187, both drawn by ART.columnSum with its own computed
     working, uncovered one mark at a time as the voice says it. See the note
     at the top of ways-to-calculate.js: nothing here writes a carry or a
     total. */

  var WTC_SUM = wtcBox(150, 36, 1.42, 3);        /* where both calculations sit */
  var WTC_PILLX = 830;                            /* the working, said in words */

  /* one line of working, in a pill, at row k */
  function wtcWork(k, text, o) {
    if (!(o > 0)) return "";
    return MK.pill(WTC_PILLX, 120 + k * 110, text, Math.min(1, o), { size: 32, col: P.gold });
  }

  /* ---- adding: 347 + 185 --------------------------------------------------- */
  function wtcAddingChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cExact = c(0, "exact"), cCols = c(0, "cols");
    var cSum = c(1, "sum"), cOnes = c(1, "ones"), cTwelve = c(1, "twelve");
    var cTwo = c(2, "two"), cCarry = c(2, "carry");
    var cTens = c(3, "tens"), cThirteen = c(3, "thirteen");
    var cThree = c(4, "three"), cCarryH = c(4, "carryh"), cHund = c(4, "hund"), cAns = c(4, "ans");
    var box = WTC_SUM, out = "";

    var appear = popIn(t, cExact, 0.5);
    if (!(appear > 0)) return svg("");

    var cx = box.x + box.vw * box.s / 2, cy = box.y + WTC_VH * box.s / 2;
    var inner = "";
    /* "347 add 185": the whole calculation is named */
    inner += MK.glow(cx, cy, Math.min(230, cy, 440 - cy), P.gold, 0.85 * bump(t, cSum, 1.1));
    inner += wtcCard(box, ART.columnSum({ a: 347, b: 185, op: "+" }));
    /* nothing of the working is shown until it is said */
    inner += wtcHideCarry(box, 1, 1 - on(t, cCarry, 0.4));
    inner += wtcHideCarry(box, 2, 1 - on(t, cCarryH, 0.4));
    inner += wtcHideAns(box, 0, 1 - on(t, cTwo, 0.4));
    inner += wtcHideAns(box, 1, 1 - on(t, cThree, 0.4));
    inner += wtcHideAns(box, 2, 1 - on(t, cAns, 0.4));
    /* the columns, then one column at a time */
    var faint = 0.3 * on(t, cCols, 0.5);
    inner += wtcColBox(box, 0, faint) + wtcColBox(box, 1, faint) + wtcColBox(box, 2, faint);
    inner += wtcColBox(box, 0, on(t, cOnes, 0.4) * (1 - on(t, cTens, 0.4)));
    inner += wtcColBox(box, 1, on(t, cTens, 0.4) * (1 - on(t, cHund, 0.4)));
    inner += wtcColBox(box, 2, on(t, cHund, 0.4));
    inner += wtcAnsGlow(box, 0.9 * on(t, cAns, 0.5) * (0.6 + 0.4 * breathe(t)));
    out += G(inner, { transform: around(cx, cy, Math.min(appear, 1.1)), opacity: Math.min(1, appear) });

    /* the working, said in words */
    out += wtcWork(0, "7 + 5 = 12", popIn(t, cTwelve, 0.4));
    out += wtcWork(1, "4 + 8 + 1 = 13", popIn(t, cThirteen, 0.4));
    out += wtcWork(2, "3 + 1 + 1 = 5", popIn(t, cHund, 0.4));
    return svg(out);
  }

  /* ---- taking away: 623 - 187 ----------------------------------------------
     The library strikes a column that lends and writes what it became above
     it. Both strikes belong to the finished calculation, so each column is
     covered by wtcUnexchanged - its plain digit, redrawn - until the exchange
     that changes it is spoken. */
  function wtcTakingChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cBack = c(0, "back"), cSum = c(0, "sum");
    var cLess = c(1, "less"), cEx1 = c(1, "ex"), cSix = c(1, "six");
    var cTens = c(2, "tens"), cEx2 = c(2, "ex"), cThree = c(2, "three");
    var cFour = c(3, "four"), cAns = c(3, "ans");
    var box = WTC_SUM, out = "";

    /* "the opposite of carrying" */
    out += MK.pill(WTC_PILLX, 56, "carry → exchange", on(t, cBack, 0.45), { size: 30, col: P.accent });

    var appear = popIn(t, cSum, 0.5);
    if (appear > 0) {
      var cx = box.x + box.vw * box.s / 2, cy = box.y + WTC_VH * box.s / 2;
      var inner = "";
      inner += wtcCard(box, ART.columnSum({ a: 623, b: 187, op: "-" }));
      /* the tens lend on the first exchange, the hundreds on the second */
      inner += wtcUnexchanged(box, 1, "2", 1 - on(t, cEx1, 0.45));
      inner += wtcUnexchanged(box, 2, "6", 1 - on(t, cEx2, 0.45));
      inner += wtcHideBorrow(box, 0, 1 - on(t, cEx1, 0.45));
      inner += wtcHideBorrow(box, 1, 1 - on(t, cEx2, 0.45));
      inner += wtcHideAns(box, 0, 1 - on(t, cSix, 0.4));
      inner += wtcHideAns(box, 1, 1 - on(t, cThree, 0.4));
      inner += wtcHideAns(box, 2, 1 - on(t, cFour, 0.4));
      inner += wtcColBox(box, 0, on(t, cLess, 0.4) * (1 - on(t, cTens, 0.4)));
      inner += wtcColBox(box, 1, on(t, cTens, 0.4) * (1 - on(t, cFour, 0.4)));
      inner += wtcColBox(box, 2, on(t, cFour, 0.4));
      inner += wtcAnsGlow(box, 0.9 * on(t, cAns, 0.5) * (0.6 + 0.4 * breathe(t)));
      out += G(inner, { transform: around(cx, cy, Math.min(appear, 1.1)), opacity: Math.min(1, appear) });
    }

    out += wtcWork(0, "13 − 7 = 6", popIn(t, cSix, 0.4));
    out += wtcWork(1, "11 − 8 = 3", popIn(t, cThree, 0.4));
    out += wtcWork(2, "5 − 1 = 4", popIn(t, cFour, 0.4));
    return svg(out);
  }
