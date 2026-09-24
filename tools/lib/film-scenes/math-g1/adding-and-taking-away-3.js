  /* ==== Adding and Taking Away, part 3 ========================================
     The chapter "Coins and shillings", the recap, and KINDS. Continues
     tools/lib/film-scenes/math-g1/adding-and-taking-away.js and -2.js, in the
     same scope.

     The coins are the lesson's own four - 1, 2, 5 and 10 shillings - and its
     own worked payment: a price of seven shillings, paid with a five and a
     two. Two coins, seven shillings, which is the lesson's whole point about
     counting what coins are WORTH rather than how many there are. */

  var ATA_C = {
    purseX: 372, purseY: 296, purseS: 1.35,
    trayX: 686, trayY: 140, trayW: 420, trayH: 230
  };
  function ataPurse() { return ART.coins([1, 2, 5, 10], { perRow: 4, label: false }); }
  /* the centre and radius of the i-th coin of the purse row, in film
     coordinates: the coins card lays its coins out at 58 + 90 i, 58 */
  function ataCoinAt(i) {
    var f = ataFit(ataPurse(), ATA_C.purseX, ATA_C.purseY, ATA_C.purseS);
    return [f.X(58 + 90 * i), f.Y(58), 35 * ATA_C.purseS];
  }

  function ataCoinsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cMoney = c(0, "money"), cSh = c(0, "sh");
    var cNumber = c(1, "number"), cWorth = c(1, "worth");
    var cPrice = c(2, "price"), cFive = c(2, "five");
    var cTwo = c(3, "two"), cSeven = c(3, "seven");
    var out = "", k, pt;

    /* the purse: one of each coin the lesson uses */
    out += ataAt(ataPurse(), ATA_C.purseX, ATA_C.purseY, ATA_C.purseS, Math.min(1, popIn(t, cMoney, 0.5)));
    out += MK.pill(ATA_C.purseX, 400, "purse", on(t, cMoney, 0.5), { size: 26, col: P.line, ink: P.muted });

    /* beat 0: shillings, written sh */
    out += MK.pill(896, 236, "sh", popIn(t, cSh, 0.4) * ataOnly(t, scene, 0), { size: 54, col: P.gold });
    out += MK.pill(896, 312, "shillings", on(t, cSh, 0.5) * ataOnly(t, scene, 0), { size: 26, col: P.line, ink: P.muted });

    /* beat 1: each coin's number ringed in turn, then what one coin is worth */
    var b1 = ataOnly(t, scene, 1);
    if (b1 > 0) {
      var lit = tally(t, cNumber, 4, 1.1) * (cNumber == null ? 0 : 1);
      for (k = 0; k < 4; k++) {
        if (k >= lit) continue;
        pt = ataCoinAt(k);
        /* teal, and wider than the coin's own gold rim, or the highlight
           reads as nothing more than a slightly thicker edge */
        out += C(pt[0], pt[1], pt[2] + 12, "none", P.teal, 5,
          { opacity: popIn(t, ataStep(cNumber, k, 4, 1.1), 0.3) * b1 });
      }
      var wo = on(t, cWorth, 0.5) * b1;
      if (wo > 0) {
        pt = ataCoinAt(3);
        out += MK.leader(770, 176, pt[0] + 34, pt[1] - 34, on(t, cWorth, 0.7), P.gold);
        out += MK.pill(896, 170, "worth 10 sh", wo, { size: 32, col: P.gold });
      }
    }

    /* beats 2-3: the price, and paying it with a five and a two */
    var pay = ataFrom(t, scene, 2);
    if (pay > 0) {
      var inner = "";
      inner += R(ATA_C.trayX, ATA_C.trayY, ATA_C.trayW, ATA_C.trayH, 22, "#0F2C3E", P.teal, 3, { "stroke-dasharray": "12 9" });
      inner += MK.pill(ATA_C.trayX + 60, ATA_C.trayY + 4, "tray", 1, { size: 24, col: P.teal, ink: P.teal, fill: P.ground });
      inner += MK.pill(896, 70, "price: 7 sh", popIn(t, cPrice, 0.45), { size: 38, col: P.accent, ink: P.accent });
      var five = on(t, cFive, 0.6), two = on(t, cTwo, 0.6), onlyFive = five * (1 - two);
      /* which coin is being paid, and where it goes */
      if (five > 0) {
        pt = ataCoinAt(2);
        inner += MK.ripple(pt[0], pt[1], t, cFive, P.gold);
        inner += MK.arrow(pt[0], 196, 676, 196, onlyFive, P.gold, 6);
      }
      if (two > 0) {
        pt = ataCoinAt(1);
        inner += MK.ripple(pt[0], pt[1], t, cTwo, P.gold);
        inner += MK.arrow(pt[0], 172, 676, 172, two, P.gold, 6);
      }
      /* what is in the tray: one coin, then two */
      if (onlyFive > 0) inner += ataAt(ART.coins([5], { label: false }), 896, 228, 1.2, onlyFive);
      if (two > 0) inner += ataAt(ART.coins([5, 2], { label: false }), 896, 228, 1.2, two);
      /* the total, which is what the coins are worth and not how many there are */
      inner += MK.pill(896, 334, "5 sh", onlyFive * (1 - on(t, cSeven, 0.5)), { size: 34, col: P.gold });
      inner += MK.pill(896, 334, "5 + 2 = 7 sh", on(t, cSeven, 0.45), { size: 34, col: P.gold });
      inner += MK.tick(1064, 70, 24, popIn(t, cSeven == null ? null : cSeven + 0.5, 0.4));
      out += G(inner, { opacity: clamp(pay, 0, 1) });
    }
    return svg(out);
  }

  /* ==== what you now know ============================================================
     Six cards, one per idea, each carrying the library's own drawing of the
     film's own example, so the recap shows nothing the film did not teach. */
  function ataRecapPic(make, maxW, maxH) {
    return function (cx, cy) {
      var markup = make(), m = /viewBox="0 0 ([0-9.]+) ([0-9.]+)"/.exec(markup);
      return ataFit(markup, cx, cy, Math.min(maxW / parseFloat(m[1]), maxH / parseFloat(m[2]))).svg;
    };
  }
  var ATA_RECAP = MK.recapKind([
    { beat: 0, at: "add", title: "Adding", sub: "3 and 2 make 5",
      pic: ataRecapPic(function () { return ART.tenFrame(5, { split: 3, colour: "accent", second: "teal", label: false }); }, 300, 104) },
    { beat: 0, at: "away", title: "Taking away", sub: "7 take away 3 is 4",
      pic: ataRecapPic(function () { return ART.counters(4, { cols: 4, colour: "accent", label: false }); }, 300, 104) },
    { beat: 1, at: "more", title: "How many more?", sub: "8 is 3 more than 5",
      pic: ataRecapPic(function () { return ART.barModel({ whole: 8, parts: [5, 3], label: false }); }, 300, 104) },
    { beat: 1, at: "bond", title: "Bonds to ten", sub: "6 and 4 make 10",
      pic: ataRecapPic(function () { return ART.tenFrame(10, { split: 6, colour: "accent", second: "teal", label: false }); }, 300, 104) },
    { beat: 2, at: "dbl", title: "Doubles", sub: "double 3 is 6",
      pic: ataRecapPic(function () { return ART.array(2, 3, { colour: "good", label: false }); }, 300, 104) },
    { beat: 2, at: "coin", title: "Shillings", sub: "5 and 2 make 7 sh",
      pic: ataRecapPic(function () { return ART.coins([5, 2], { label: false }); }, 300, 104) }
  ], { goBeat: 3, goAt: "go" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Adding, and counting on", "Taking away, and counting back", "Bonds to ten, doubles and coins"] }),
    adding: ataAddingChapter,
    takeaway: ataTakeChapter,
    more: ataMoreChapter,
    bonds: ataBondsChapter,
    doubles: ataDoublesChapter,
    coins: ataCoinsChapter,
    recap: ATA_RECAP
  };
