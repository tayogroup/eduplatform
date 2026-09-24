
  /* ==== Coins and Change, part 3: writing money, comparing purses, how much
     more, and what you now know ==============================================
     tools/lib/film-scenes/math-g2/coins-and-change-3.js. See part 1 for the
     shared helpers, and it ends with HUE's companions KINDS and the recap.

     write    coins-and-change.html step 10 - "45 sh and KSh 45 both mean
              forty-five shillings."
     compare  step 11, its first purse pair: PURSE_PAIRS[0] is
              { a: [20, 20, 5], b: [50] }.
     more     step 9, its data-explain - "You have 35 shillings and the price
              is 50. Hop 5 to reach 40, then hop 10 to reach 50. 5 and 10 make
              15, so you need 15 shillings more." */

  /* ==== chapter: Writing money ====================================================
     The money on the left (a 20, a 10, a 10 and a 5 - 45 sh), and the three
     ways the lesson writes that same amount stacked on the right. */
  var CC_WR_COINS = [20, 10, 10, 5];               /* 20 + 10 + 10 + 5 = 45 */
  var CC_WR_X = 838, CC_WR_W = 420, CC_WR_H = 84;
  var CC_WR_Y = [104, 212, 320];

  /* one written form on its own plaque: the number and the letters drawn apart,
     so either half can be lit as the voice names it */
  function ccWritten(cy, numTxt, letTxt, letFirst, o, hiNum, hiLet) {
    if (!(o > 0)) return "";
    var x = CC_WR_X, nS = 52, lS = 38, gap = 11;
    var nW = String(numTxt).length * nS * 0.58, lW = String(letTxt).length * lS * 0.58;
    var whole = nW + gap * 2 + lW, left = x - whole / 2;
    var nx = letFirst ? left + lW + gap * 2 : left;
    var lx = letFirst ? left : left + nW + gap * 2;
    var band = function (bx, bw, col, op) {
      return op > 0 ? R(bx - 8, cy - 31, bw + 16, 62, 12, col, null, null, { opacity: 0.32 * op }) : "";
    };
    return G(R(x - CC_WR_W / 2, cy - CC_WR_H / 2, CC_WR_W, CC_WR_H, 18, P.card, P.line, 2) +
      band(nx, nW, P.gold, hiNum) + band(lx, lW, P.teal, hiLet) +
      Tx(nx + nW / 2, cy, String(numTxt), "lab", "middle", { "font-size": nS, fill: P.ink, "dominant-baseline": "central" }) +
      Tx(lx + lW / 2, cy, String(letTxt), "lab", "middle", { "font-size": lS, fill: P.muted, "dominant-baseline": "central" }),
      { opacity: Math.min(1, o), transform: around(x, cy, 0.94 + 0.06 * Math.min(1, o)) });
  }
  /* the same plaque with the amount in words, which has no number half */
  function ccWords(cy, text, o) {
    if (!(o > 0)) return "";
    return G(R(CC_WR_X - CC_WR_W / 2, cy - CC_WR_H / 2, CC_WR_W, CC_WR_H, 18, P.card, P.line, 2) +
      Tx(CC_WR_X, cy, text, "lab", "middle", { "font-size": 30, fill: P.ink, "dominant-baseline": "central" }),
      { opacity: Math.min(1, o), transform: around(CC_WR_X, cy, 0.94 + 0.06 * Math.min(1, o)) });
  }

  function ccWriteChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOwn = c(0, "own");
    var cWordsAt = c(1, "words"), cShort = c(1, "short"), cAfter = c(1, "after");
    var cKsh = c(2, "ksh"), cFront = c(2, "front");
    var cSame = c(3, "same"), cNumber = c(3, "number"), cLetters = c(3, "letters");
    var out = "", amount = ccSum(CC_WR_COINS);

    var card = ccCoins(CC_WR_COINS, 4);
    /* the money itself carries no written total: the whole chapter is about how
       that total is written, so it is the three plaques that say it */
    out += G(ccFit(card, 280, 212, 1.15), { opacity: Math.min(1, popIn(t, cOwn, 0.5)) });
    out += MK.qmark(CC_WR_X, CC_WR_Y[1], 44, on(t, cOwn, 0.4) * ccOnly(t, scene, 0));

    /* the letters lit: on "after it" for 45 sh, on "in front" for KSh 45, and
       on "then the letters" for both */
    var allLet = on(t, cLetters, 0.35);
    var allNum = on(t, cNumber, 0.35) * (1 - allLet);
    out += ccWords(CC_WR_Y[0], "forty-five shillings", on(t, cWordsAt, 0.45));
    out += ccWritten(CC_WR_Y[1], String(amount), "sh", false, on(t, cShort, 0.45),
      allNum, Math.max(on(t, cAfter, 0.35) * ccOnly(t, scene, 1), allLet));
    out += ccWritten(CC_WR_Y[2], String(amount), "KSh", true, on(t, cKsh, 0.45),
      allNum, Math.max(on(t, cFront, 0.35) * ccOnly(t, scene, 2), allLet));

    /* "Both mean the same money": the two short forms tied back to the coins */
    var same = on(t, cSame, 0.5);
    if (same > 0) {
      out += L(612, CC_WR_Y[1], 612, CC_WR_Y[2], P.gold, 4, { opacity: same });
      out += G(MK.leader(612, (CC_WR_Y[1] + CC_WR_Y[2]) / 2, 434, 250, same, P.gold), { opacity: same });
      out += MK.tick(1098, CC_WR_Y[1], 22, popIn(t, cSame, 0.4));
      out += MK.tick(1098, CC_WR_Y[2], 22, popIn(t, cSame == null ? null : cSame + 0.25, 0.4));
    }
    return svg(out);
  }

  /* ==== chapter: Which purse is worth more? =======================================
     The lesson's own first pair: 20 + 20 + 5 against a single 50. */
  var CC_CP_A = [20, 20, 5], CC_CP_B = [50];       /* 45 sh against 50 sh */
  var CC_CP_AX = 350, CC_CP_BX = 860, CC_CP_CY = 216;

  function ccCompareChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTwo = c(0, "two"), cMore = c(0, "more");
    var cA = c(1, "a"), cAdd = c(1, "add"), cTotA = c(1, "total");
    var cB = c(2, "b"), cOne = c(2, "one"), cTotB = c(2, "total");
    var cFewer = c(3, "fewer"), cMoney = c(3, "money"), cCoinsMore = c(3, "coins");
    var out = "", k;
    var cardA = ccCoins(CC_CP_A, 3), cardB = ccCoins(CC_CP_B);
    var sumA = ccSum(CC_CP_A), sumB = ccSum(CC_CP_B);
    var arrive = popIn(t, cTwo, 0.5);

    out += ccPurse(140, 130, 420, 192, arrive);
    out += ccPurse(690, 130, 340, 192, popIn(t, cTwo == null ? null : cTwo + 0.2, 0.5));
    out += G(ccFit(cardA, CC_CP_AX, CC_CP_CY, 1.3), { opacity: Math.min(1, arrive) });
    out += G(ccFit(cardB, CC_CP_BX, CC_CP_CY, 1.3), { opacity: Math.min(1, popIn(t, cTwo == null ? null : cTwo + 0.2, 0.5)) });
    out += MK.pill(CC_CP_AX, 72, "Purse A", Math.min(1, arrive) * (1 + 0.1 * bump(t, cA, 0.7)), { size: 28, col: on(t, cA, 0.4) > 0.5 ? P.accent : P.line });
    out += MK.pill(CC_CP_BX, 72, "Purse B", Math.min(1, arrive) * (1 + 0.1 * bump(t, cB, 0.7)), { size: 28, col: on(t, cB, 0.4) > 0.5 ? P.teal : P.line });

    /* "Which one is worth more?" */
    out += MK.qmark(622, CC_CP_CY, 40, on(t, cMore, 0.4) * ccOnly(t, scene, 0));

    /* "Add them up": each of A's coins in turn */
    for (k = 0; k < CC_CP_A.length; k++) {
      var s = ccSlot(k), p = ccSpot(cardA, CC_CP_AX, CC_CP_CY, 1.3, s[0], s[1]);
      out += MK.glow(p[0], p[1], 64, P.accent, on(t, cAdd == null ? null : cAdd + k * 0.3, 0.35) * ccOnly(t, scene, 1));
    }
    /* "just one coin" */
    var bs = ccSlot(0), bp = ccSpot(cardB, CC_CP_BX, CC_CP_CY, 1.3, bs[0], bs[1]);
    out += MK.glow(bp[0], bp[1], 72, P.teal, on(t, cOne, 0.4) * ccOnly(t, scene, 2));

    /* the two totals, each added up from the coins drawn in that purse */
    out += MK.pill(CC_CP_AX, 350, ccSh(sumA), on(t, cTotA, 0.4), { size: 34, col: P.gold });
    out += MK.pill(CC_CP_BX, 350, ccSh(sumB), on(t, cTotB, 0.4) * (1 + 0.12 * bump(t, cMoney, 0.8)), { size: 34, col: P.gold });
    out += MK.tick(1000, 350, 22, popIn(t, cMoney, 0.4));

    /* "fewer pieces": how many pieces each purse holds */
    var few = on(t, cFewer, 0.4);
    out += MK.pill(330, 408, CC_CP_A.length + " pieces", few, { size: 24, col: P.line });
    out += MK.cross(442, 408, 20, popIn(t, cCoinsMore, 0.4));
    out += MK.pill(840, 408, CC_CP_B.length + (CC_CP_B.length === 1 ? " piece" : " pieces"), few, { size: 24, col: P.line });
    return svg(out);
  }

  /* ==== chapter: How much more? ===================================================
     ART.numberLine from 35 to 50, pinned so its axis never moves, with the two
     hops drawn over it. The hops grow rather than appear, which the library's
     own jumps cannot do, so they are drawn here with a dash offset. */
  var CC_MORE = { have: 35, price: 50, hops: [5, 10] };
  if (CC_MORE.have + ccSum(CC_MORE.hops) !== CC_MORE.price)
    throw new Error("coins-and-change: the hops do not reach the price");
  var CC_NL_W = 760, CC_NL_S = 1.35, CC_NL_CX = 584, CC_NL_AXIS = 300;

  /* where a value sits on the line, in the film's space */
  function ccNlX(v) {
    var pad = 36, left = CC_NL_CX - CC_NL_W * CC_NL_S / 2;
    var u = (v - CC_MORE.have) / (CC_MORE.price - CC_MORE.have);
    return left + (pad + u * (CC_NL_W - 2 * pad)) * CC_NL_S;
  }
  /* the line itself, with the marks reached so far; its axis is always at
     CC_NL_AXIS, whatever the card's own height is */
  function ccNlCard(marks) {
    var card = ART.numberLine({
      from: CC_MORE.have, to: CC_MORE.price, step: 1, labelEvery: 5,
      marks: marks, width: CC_NL_W
    });
    var b = ccBox(card), ay = 46;                    /* top 26 + 20, with no jumps */
    return ART.place(card, CC_NL_CX - b.w * CC_NL_S / 2, CC_NL_AXIS - ay * CC_NL_S, b.w * CC_NL_S, b.h * CC_NL_S);
  }
  /* an arc from x1 to x2 that draws itself as u goes 0 -> 1 */
  function ccArc(x1, x2, y, peak, u, col, w) {
    if (!(u > 0)) return "";
    var mx = (x1 + x2) / 2, cy = y - 2 * peak, len = 0, px = x1, py = y, k, s, a, bx, by;
    for (k = 1; k <= 24; k++) {
      s = k / 24; a = 1 - s;
      bx = a * a * x1 + 2 * a * s * mx + s * s * x2;
      by = a * a * y + 2 * a * s * cy + s * s * y;
      len += Math.hypot(bx - px, by - py); px = bx; py = by;
    }
    return Pth("M" + n2(x1) + "," + n2(y) + " Q" + n2(mx) + "," + n2(cy) + " " + n2(x2) + "," + n2(y),
      null, col, w || 6, { "stroke-dasharray": n2(len) + " " + n2(len + 6), "stroke-dashoffset": n2(len * (1 - clamp(u, 0, 1))) });
  }

  function ccMoreChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cHave = c(0, "have"), cPrice0 = c(0, "price");
    var cOn = c(1, "on"), cPrice1 = c(1, "price");
    var cHop5 = c(2, "hop5"), cAt40 = c(2, "at40"), cHop10 = c(2, "hop10"), cAt50 = c(2, "at50");
    var cHops = c(3, "hops"), cNeed = c(3, "need");
    var out = "", marks = [];

    /* the marks are labelled with the numbers themselves: a mark's label covers
       the tick number under it, so a word there would hide the 35 and the 50 */
    if (cHave == null || t >= cHave) marks.push({ at: CC_MORE.have, label: String(CC_MORE.have) });
    if (cPrice0 != null && t >= cPrice0) marks.push({ at: CC_MORE.price, label: String(CC_MORE.price), colour: "teal" });
    out += ccNlCard(marks);

    var x0 = ccNlX(CC_MORE.have), x1 = ccNlX(CC_MORE.have + CC_MORE.hops[0]), x2 = ccNlX(CC_MORE.price);
    /* beat 0: what you have, and what it costs */
    out += ccPoint(t, cHave, 250, 196, "you have " + ccSh(CC_MORE.have), [x0, CC_NL_AXIS - 6], 24, P.gold, ccOnly(t, scene, 0));
    out += ccPoint(t, cPrice0, 930, 196, "it costs " + ccSh(CC_MORE.price), [x2, CC_NL_AXIS - 6], 24, P.teal, ccOnly(t, scene, 0));
    /* beat 1: count on, from what you have up to the price */
    var onU = on(t, cOn, 0.7) * ccOnly(t, scene, 1);
    if (onU > 0) out += MK.arrow(x0 + 18, 244, x2 - 18, 244, onU, P.teal, 6);
    out += MK.glow(x2, CC_NL_AXIS, 70, P.teal, on(t, cPrice1, 0.4) * ccOnly(t, scene, 1));

    /* beat 2: the two hops */
    var u1 = on(t, cHop5, 0.55), u2 = on(t, cHop10, 0.55);
    out += ccArc(x0, x1, CC_NL_AXIS - 10, 74, u1, P.accent, 6);
    out += ccArc(x1, x2, CC_NL_AXIS - 10, 96, u2, P.gold, 6);
    out += C(x1, CC_NL_AXIS - 10, 9, P.accent, P.ground, 3, { opacity: u1 >= 1 ? 1 : 0 });
    out += C(x2, CC_NL_AXIS - 10, 9, P.gold, P.ground, 3, { opacity: u2 >= 1 ? 1 : 0 });
    out += MK.glow(x1, CC_NL_AXIS, 62, P.accent, on(t, cAt40, 0.4) * ccOnly(t, scene, 2));
    out += MK.glow(x2, CC_NL_AXIS, 62, P.gold, on(t, cAt50, 0.4) * ccOnly(t, scene, 2));
    out += MK.pill((x0 + x1) / 2, CC_NL_AXIS - 104, "+" + CC_MORE.hops[0], u1 * (1 + 0.12 * bump(t, cHops, 0.8)), { size: 30, col: P.accent });
    out += MK.pill((x1 + x2) / 2, CC_NL_AXIS - 126, "+" + CC_MORE.hops[1], u2 * (1 + 0.12 * bump(t, cHops == null ? null : cHops + 0.3, 0.8)), { size: 30, col: P.gold });

    /* beat 3: the two hops added up - the same number as price take away have */
    out += MK.pill(560, 96, ccSh(ccSum(CC_MORE.hops)) + " more", on(t, cNeed, 0.45), { size: 38, col: P.good });
    out += MK.tick(766, 96, 24, popIn(t, cNeed == null ? null : cNeed + 0.3, 0.4));
    return svg(out);
  }

  /* ==== what you now know =========================================================
     The lesson's own word pictures: the purse, the total, the coin, the target
     the build steps use, the note and the price tag. */
  /* "50, 70, 75" on the Count on card is the purse of the count chapter added
     up again, so the two cannot come to say different things */
  var CC_RECAP_RUN = (function () { var r = [], n = 0, k;
    for (k = 0; k < CC_CNT_VALUES.length; k++) { n += CC_CNT_VALUES[k]; r.push(n); } return r.join(", "); })();
  /* "Many ways" and "45 sh = KSh 45" used to carry a money-bag and a
     dollar-banknote emoji - both draw a US $ in most fonts, in a film whose
     every coin, note and plaque says sh. Drawn instead: two of the lesson's
     own coins (ccCoin, the same face the chapters use - it prints "sh", not
     $), and, for the written-form card, the two plaques themselves, small. */
  function ccRecapCoins(cx, cy, size) {
    var r = size * 0.3;
    return ccCoin(cx - r * 0.82, cy, r, 20, 1) + ccCoin(cx + r * 0.82, cy, r * 0.86, 5, 1);
  }
  function ccRecapWritten(cx, cy, size) {
    var s = size * 0.5;
    return Tx(cx, cy - s * 0.12, "45 sh", "lab", "middle", { "font-size": s * 0.6, fill: P.ink }) +
      Tx(cx, cy + s * 0.56, "KSh 45", "lab", "middle", { "font-size": s * 0.48, fill: P.muted });
  }
  var CC_RECAP = MK.recapKind([
    { beat: 0, at: "biggest", title: "Biggest first", sub: "start with the biggest piece", pic: "\u{1F45B}" },
    { beat: 0, at: "counton", title: "Count on", sub: CC_RECAP_RUN, pic: "\u{1F522}" },
    { beat: 1, at: "ways", title: "Many ways", sub: "one amount, other coins", pic: ccRecapCoins },
    { beat: 1, at: "fewest", title: "Fewest pieces", sub: "take the biggest that fits", pic: "\u{1F3AF}" },
    { beat: 2, at: "both", title: "45 sh = KSh 45", sub: "two ways to write it", pic: ccRecapWritten },
    { beat: 3, at: "value", title: "Compare by value", sub: "not by how many pieces", pic: "\u{1F3F7}️" }
  ], { goBeat: 3, goAt: "more" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "The coins and the note, and what each is worth",
      "Counting a purse, and making an amount",
      "Comparing two purses, and finding how much more"
    ] }),
    know: ccKnowChapter, count: ccCountChapter, make: ccMakeChapter,
    write: ccWriteChapter, compare: ccCompareChapter, more: ccMoreChapter, recap: CC_RECAP
  };
