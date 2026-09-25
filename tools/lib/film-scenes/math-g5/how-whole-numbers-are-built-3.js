  /* ==== How Whole Numbers Are Built, part 3 =====================================
     The chapters "What two numbers share", "Divisibility rules", "Prime
     numbers" and "What you now know". */

  /* ==== chapter: what two numbers share ==========================================
     Step 18's own pair, 12 and 18: their factors are {1,2,3,4,6,12} and
     {1,2,3,6,9,18}, so the shared ones are 1, 2, 3 and 6 - the highest common
     factor is 6. Their lowest common multiple is 36, and 6 x 36 = 216 = 12 x 18,
     the check the lesson's own note makes. ART.sortDiagram draws the venn; the
     multiples strip beside it is hand-drawn, because ART has no times-table
     picture to place two lists side by side. */
  var HWN_COMMON_ITEMS = [
    { label: "4", a: true, b: false }, { label: "12", a: true, b: false },
    { label: "9", a: false, b: true }, { label: "18", a: false, b: true },
    { label: "1", a: true, b: true }, { label: "2", a: true, b: true },
    { label: "3", a: true, b: true }, { label: "6", a: true, b: true }
  ];
  function hwnCommonChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCommonFactor = c(0, "commonfactor"), cBoth = c(0, "both");
    var cCommonMultiple = c(1, "commonmultiple"), cTables = c(1, "tables");
    var cHighest = c(2, "highest"), cLowest = c(2, "lowest");
    var cHcf6 = c(3, "hcf6"), cLcm36 = c(3, "lcm36");
    var w0 = hwnOnly(t, scene, 0), w1 = hwnOnly(t, scene, 1), w2 = hwnOnly(t, scene, 2), w3 = hwnOnly(t, scene, 3);
    var out = "";
    var showItems = cHighest != null && t >= cHighest ? HWN_COMMON_ITEMS : [];
    var venn = ART.sortDiagram({ shape: "venn", labels: ["12", "18"], items: showItems });
    out += G(ART.place(venn, 40, 60, 500, 292), { opacity: Math.max(w0, w1, w2, w3) });
    if (w0 > 0.002) {
      out += MK.pill(920, 100, "common factor", popIn(t, cCommonFactor, 0.4) * w0, { size: 30, col: P.teal });
      out += MK.pill(920, 160, "in both numbers", on(t, cBoth, 0.4) * w0, { size: 26, col: P.line });
    }
    var multO = Math.max(w1, w2, w3) * on(t, cCommonMultiple, 0.5);
    if (multO > 0.002) {
      out += G(Tx(920, 220, "12: 12, 24, 36 …", "lab big", "middle", { fill: P.teal }) +
        Tx(920, 260, "18: 18, 36, 54 …", "lab big", "middle", { fill: P.gold }), { opacity: multO });
      out += MK.pill(920, 100, "common multiple", w1 > 0.5 ? popIn(t, cCommonMultiple, 0.4) * w1 : 0, { size: 30, col: P.gold });
      out += MK.pill(920, 160, "both times tables", w1 > 0.5 ? on(t, cTables, 0.4) * w1 : 0, { size: 26, col: P.line });
    }
    if (w2 > 0.002) {
      out += MK.pill(920, 320, "highest", on(t, cHighest, 0.4) * w2, { size: 30, col: P.teal });
      out += MK.pill(920, 380, "lowest", on(t, cLowest, 0.4) * w2, { size: 30, col: P.gold });
    }
    if (w3 > 0.002) {
      out += MK.pill(920, 320, "HCF 6", popIn(t, cHcf6, 0.4) * w3, { size: 32, col: P.teal });
      out += MK.pill(920, 380, "LCM 36", popIn(t, cLcm36, 0.4) * w3, { size: 32, col: P.gold });
    }
    return svg(out);
  }

  /* ==== chapter: divisibility rules ==============================================
     Step 19's own facts: rules for 2, 3, 4, 5, 6, 8, 9 and 10, none for 7; the
     rule for 4 reads the last two digits, the rule for 8 the last three. The
     digit boxes reuse 7,315's own digits to show WHICH digits each rule reads,
     without claiming a divisibility result for it - the lesson's own point
     about 7,315 is that nothing in its digits hints at 7 going in. */
  function hwnDigitBoxes(cx, cy, digits, litCount, col) {
    var n = digits.length, gap = 64, x0 = cx - (n - 1) * gap / 2, out = "", k;
    for (k = 0; k < n; k++) {
      var lit = k >= n - litCount;
      out += R(x0 + k * gap - 24, cy - 30, 48, 60, 10, lit ? col : "#17384F", lit ? col : P.line, 2);
      out += Tx(x0 + k * gap, cy + 12, String(digits[k]), "lab big", "middle", { fill: lit ? "#0B1D2C" : P.ink });
    }
    return out;
  }
  function hwnDivisibilityChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRule = c(0, "rule"), cWithout = c(0, "without");
    var cList = c(1, "list");
    var cNone = c(2, "none");
    var cByFour = c(3, "byfour"), cByEight = c(3, "byeight");
    var cNum = c(4, "num"), cNoShortcut = c(4, "noshortcut");
    var w0 = hwnOnly(t, scene, 0), w1 = hwnOnly(t, scene, 1), w2 = hwnOnly(t, scene, 2),
      w3 = hwnOnly(t, scene, 3), w4 = hwnOnly(t, scene, 4);
    var out = "", k;
    if (w0 > 0.002) {
      out += MK.pill(580, 110, "a divisibility rule", popIn(t, cRule, 0.4) * w0, { size: 32, col: P.plum });
      out += G(Em(580, 220, 70, "\u{1F50D}"), { opacity: on(t, cRule, 0.5) * w0 });
      out += MK.pill(580, 310, "no need to divide", on(t, cWithout, 0.4) * w0, { size: 26, col: P.line });
    }
    if (w1 > 0.002) {
      var RULES = [2, 3, 4, 5, 6, 8, 9, 10], rx = 165;
      for (k = 0; k < RULES.length; k++) {
        var pOn = popIn(t, cList == null ? null : cList + k * 0.1, 0.3) * w1;
        out += MK.pill(rx + k * 118, 200, String(RULES[k]), pOn, { size: 32, col: P.plum });
      }
    }
    if (w2 > 0.002) {
      out += MK.pill(560, 180, "7", popIn(t, cNone, 0.4) * w2, { size: 60, col: P.line });
      out += MK.cross(660, 180, 26, popIn(t, cNone, 0.4) * w2);
      out += MK.pill(580, 280, "no useful rule", on(t, cNone, 0.5) * w2, { size: 28, col: P.line });
    }
    if (w3 > 0.002) {
      var digits = [7, 3, 1, 5];
      var fourOnly = on(t, cByFour, 0.4) * (1 - on(t, cByEight, 0.4)) * w3;
      var eightOnly = on(t, cByEight, 0.4) * w3;
      if (fourOnly > 0.002) { out += G(hwnDigitBoxes(580, 190, digits, 2, P.teal), { opacity: fourOnly }); out += MK.pill(580, 290, "last two digits, for 4", fourOnly, { size: 26, col: P.teal }); }
      if (eightOnly > 0.002) { out += G(hwnDigitBoxes(580, 190, digits, 3, P.gold), { opacity: eightOnly }); out += MK.pill(580, 290, "last three digits, for 8", eightOnly, { size: 26, col: P.gold }); }
    }
    if (w4 > 0.002) {
      out += G(Tx(580, 190, "7,315 ÷ 7 = 1,045", "lab", "middle", { fill: P.ink, "font-size": 46 }), { opacity: on(t, cNum, 0.5) * w4 });
      out += MK.qmark(870, 190, 26, on(t, cNoShortcut, 0.5) * w4);
      out += MK.pill(580, 290, "no shortcut", on(t, cNoShortcut, 0.4) * w4, { size: 26, col: P.line });
    }
    return svg(out);
  }

  /* ==== chapter: prime numbers ====================================================
     Step 20's own facts: a prime has exactly two factors; 21 = 3 x 7 is
     composite; the sieve of Eratosthenes crosses out multiples of 2, then 3,
     then 5, then 7, on a 1-100 grid - real, computed sieve stages, not a typed
     list, so the cells crossed are always correct; 1 is neither, 2 is the only
     even prime. */
  function hwnCrossedUpTo(primes) {
    var crossed = {}, p, n;
    for (p = 0; p < primes.length; p++) for (n = 2 * primes[p]; n <= 100; n += primes[p]) crossed[n] = true;
    return crossed;
  }
  function hwnFillCells(crossed) {
    var arr = [], n;
    for (n = 2; n <= 100; n++) if (crossed[n]) arr.push([(n - 1) % 10, Math.floor((n - 1) / 10)]);
    return arr;
  }
  function hwnGridCell(gx, gy, cell, n) {
    var col = (n - 1) % 10, row = Math.floor((n - 1) / 10), edge = 22;
    return [gx + edge + col * cell + cell / 2, gy + edge + row * cell + cell / 2];
  }
  function hwnPrimesChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPrime1 = c(0, "prime1"), cTwo2 = c(0, "two2");
    var cComposite = c(1, "composite"), cBuilt = c(1, "built");
    var cSieve = c(2, "sieve"), cCrossing = c(2, "crossing");
    var cSteps = c(3, "steps"), cHundred = c(3, "hundred");
    var cOne1 = c(4, "one1"), cTwoPrime = c(4, "twoprime");
    var w0 = hwnOnly(t, scene, 0), w1 = hwnOnly(t, scene, 1);
    var w2 = hwnOnly(t, scene, 2), w3 = hwnOnly(t, scene, 3), w4 = hwnOnly(t, scene, 4);
    var w234 = Math.min(1, w2 + w3 + w4);
    var out = "";
    if (w0 > 0.002) {
      out += MK.pill(580, 110, "prime number", popIn(t, cPrime1, 0.4) * w0, { size: 34, col: P.good });
      out += MK.pill(580, 190, "1 and itself", on(t, cTwo2, 0.5) * w0, { size: 30, col: P.line });
      out += G(Tx(580, 280, "exactly two factors", "lab big", "middle", { fill: P.good }), { opacity: on(t, cTwo2, 0.5) * w0 });
    }
    if (w1 > 0.002) {
      out += MK.pill(580, 110, "composite number", popIn(t, cComposite, 0.4) * w1, { size: 34, col: P.plum });
      out += G(Tx(580, 220, "21 = 3 × 7", "lab", "middle", { fill: P.plum, "font-size": 64 }), { opacity: on(t, cBuilt, 0.5) * w1 });
    }
    if (w234 > 0.002) {
      var reached = tally(t, cSteps, 4, 1.6);
      var stagePrimes = [[2], [2, 3], [2, 3, 5], [2, 3, 5, 7]];
      var crossed = reached > 0 ? hwnCrossedUpTo(stagePrimes[reached - 1]) : {};
      var grid = ART.grid({ cols: 10, rows: 10, cell: 30, numbers: true, fill: hwnFillCells(crossed), colour: "bad" });
      out += G(ART.place(grid, 60, 40, 344, 344), { opacity: w234 });
      out += MK.pill(870, 90, "sieve of Eratosthenes", popIn(t, cSieve, 0.4) * w2, { size: 25, col: P.good });
      out += MK.pill(870, 150, "cross out multiples", on(t, cCrossing, 0.4) * w2, { size: 25, col: P.line });
      out += MK.pill(870, 90, "to 100", on(t, cHundred, 0.4) * w3, { size: 30, col: P.good });
      if (w4 > 0.002) {
        var pos1 = hwnGridCell(60, 40, 30, 1), pos2 = hwnGridCell(60, 40, 30, 2);
        var oneO = on(t, cOne1, 0.5) * w4;
        out += G(R(pos1[0] - 15, pos1[1] - 15, 30, 30, 6, "none", P.line, 3, { "stroke-dasharray": "5 4" }), { opacity: oneO });
        out += MK.pill(870, 220, "1: neither", oneO, { size: 26, col: P.line });
        var twoO = popIn(t, cTwoPrime, 0.4) * w4;
        if (twoO > 0) out += G(C(pos2[0], pos2[1], 20, "none", P.good, 4), { opacity: Math.min(1, twoO), transform: around(pos2[0], pos2[1], Math.min(twoO, 1.1)) });
        out += MK.pill(870, 280, "2: only even prime", on(t, cTwoPrime, 0.5) * w4, { size: 24, col: P.good });
      }
    }
    return svg(out);
  }

  /* ==== what you now know ========================================================= */
  var HWN_RECAP = MK.recapKind([
    { beat: 0, at: "oddr", title: "Odd numbers", sub: "1+3+5+7 = 16",
      pic: function (cx, cy, size) {
        var out = "", off = size * 0.16, r = size * 0.09, pts = [[-1, -1], [1, -1], [-1, 1], [1, 1]], k;
        for (k = 0; k < 4; k++) out += C(cx + pts[k][0] * off, cy + pts[k][1] * off, r, P.gold);
        return out;
      } },
    { beat: 0, at: "evenr", title: "Even numbers", sub: "2+4+6+8 = 20",
      pic: function (cx, cy, size) { return R(cx - size * 0.3, cy - size * 0.22, size * 0.6, size * 0.44, 4, "none", P.teal, 4); } },
    { beat: 1, at: "timesfirst", title: "Times, divide first", sub: "then + and −",
      pic: function (cx, cy, size) { return Tx(cx, cy + size * 0.12, "× ÷", "lab", "middle", { fill: P.accent, "font-size": size * 0.4 }); } },
    { beat: 1, at: "beforepa", title: "Before + and −", sub: "the agreed order",
      pic: function (cx, cy, size) { return Tx(cx, cy + size * 0.12, "+ −", "lab", "middle", { fill: P.line, "font-size": size * 0.4 }); } },
    { beat: 2, at: "factorr", title: "A factor divides in", sub: "with nothing left over",
      pic: function (cx, cy, size) { return MK.arrow(cx - size * 0.3, cy, cx + size * 0.3, cy, 1, P.teal, 6); } },
    { beat: 2, at: "multipler", title: "A multiple counts up", sub: "in a times table",
      pic: function (cx, cy, size) { return MK.arrow(cx + size * 0.3, cy, cx - size * 0.3, cy, 1, P.gold, 6); } },
    { beat: 3, at: "primer", title: "Prime numbers", sub: "exactly two factors",
      pic: function (cx, cy, size) { return C(cx, cy, size * 0.28, "none", P.good, 5) + C(cx, cy, size * 0.06, P.good); } },
    { beat: 3, at: "rulesr", title: "Divisibility rules", sub: "check without dividing",
      pic: function (cx, cy, size) { return C(cx - size * 0.05, cy - size * 0.05, size * 0.2, "none", P.plum, 4) +
        L(cx + size * 0.1, cy + size * 0.1, cx + size * 0.26, cy + size * 0.26, P.plum, 5); } }
  ], { goBeat: 3, goAt: "rulesr" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Odd, even and the order of operations", "Factors, multiples and common factors", "Divisibility rules and prime numbers"] }),
    oddeven: hwnOddEvenChapter, order: hwnOrderChapter, factors: hwnFactorsChapter,
    common: hwnCommonChapter, divisibility: hwnDivisibilityChapter, primes: hwnPrimesChapter,
    recap: HWN_RECAP
  };
