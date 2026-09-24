  /* ==== Adding, Taking Away and Money, part 2 =================================
     The three calculation chapters: "Add in any order", "Adding with
     regrouping" and "Taking away with regrouping".

     THE COLUMN METHOD IS ART'S OWN DRAWING, revealed a digit at a time.
     ART.columnSum works the whole calculation out for itself and draws all of
     it at once - every carry, every exchange, every answer digit. A film has
     to write them as they are said, so the card is drawn finished and the
     parts not yet said are covered by a patch of its own card colour, which
     fades away on the cue. Every numeral on screen is therefore ART's, drawn
     once, in the one place; nothing is a hand-made copy that could disagree
     with the arithmetic beside it.

     The two exceptions are the two top-row digits of 400 - 178 that ART draws
     GREY AND STRUCK THROUGH, because it knows the exchange is coming. Before
     the exchange is named a child must see a plain black 4 and 0, so those
     two are covered and rewritten with amNum - the same Inter the card uses
     (.sf text in the film's stylesheet), at the same size and position. */

  /* ---- the tiles of "Add in any order" ---------------------------------- */
  function amTile(cx, cy, w, h, text, o, col, size) {
    if (!(o > 0)) return "";
    var line = col || AMC.line, ink = col || AMC.ink;
    return G(R(cx - w / 2, cy - h / 2, w, h, 20, AMC.card, line, col ? 4 : 2) +
      amNum(cx, cy, text, size || 58, ink), { opacity: clamp(o, 0, 1) });
  }

  var AM_TILE = { w: 170, h: 130, y: 160 };
  function amAnyOrderChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOrder = c(0, "order"), cSum = c(0, "sum");
    var cPick = c(1, "pick"), cTwenty = c(1, "twenty"), cRound = c(1, "round");
    var cNine = c(2, "nine"), cEasy = c(2, "easy");
    var cNot = c(3, "not"), cSwap = c(3, "swap");
    var W = AM_TILE.w, H = AM_TILE.h, Y = AM_TILE.y, out = "";

    var u = on(t, cTwenty, 0.55);                 /* 17 and 3 close up into 20 */
    var so = Math.min(1, popIn(t, cOrder, 0.45));
    var picked = on(t, cPick, 0.4);
    var gold = picked > 0.5 ? P.gold : null;

    /* the three numbers of the lesson's own sum, 17 + 9 + 3 */
    out += amTile(lerp(290, 360, u), Y, W, H, "17", so * (1 - u), gold);
    out += amTile(lerp(770, 360, u), Y, W, H, "3", so * (1 - u), gold);
    out += amTile(lerp(530, 596, u), Y, W, H, "9", so);
    out += G(amNum(lerp(410, 478, u), Y, "+", 54, "#FFFFFF"), { opacity: so });
    out += G(amNum(650, Y, "+", 54, "#FFFFFF"), { opacity: so * (1 - u) });
    /* the pair, joined: a round twenty */
    out += amTile(360, Y, W, H, "20", u, P.gold);
    /* "17 add 9 add 3": the sum the chapter is about, named */
    var qo = on(t, cSum, 0.5) * amOnly(t, scene, 0);
    if (qo > 0) out += R(195, Y - 76, 660, 152, 26, null, P.blue, 3, { "stroke-dasharray": "12 9", opacity: qo });

    /* "in any order": the three may be taken in whichever order helps */
    var oo = on(t, cOrder, 0.5) * amOnly(t, scene, 0);
    if (oo > 0) {
      out += G(Pth("M290,88 C390,34 670,34 770,88", null, P.gold, 3, { "stroke-dasharray": "10 8" }), { opacity: oo });
      out += MK.pill(530, 54, "any order", oo, { size: 26, col: P.gold });
    }
    /* "a round number" */
    out += MK.pill(360, 306, "a round number", on(t, cRound, 0.4) * amOnly(t, scene, 1), { size: 24, col: P.gold });

    /* 20 add 9 is 29 */
    var no = popIn(t, cNine, 0.45);
    out += G(amNum(714, Y, "=", 54, "#FFFFFF"), { opacity: Math.min(1, no) });
    out += amTile(832, Y, W, H, "29", Math.min(1, no), P.good);
    out += MK.tick(962, Y, 28, popIn(t, cEasy, 0.4));

    /* "Taking away is not like this" */
    var po = popIn(t, cNot, 0.45);
    if (po > 0) {
      out += amTile(430, 366, 260, 110, "10 − 3", Math.min(1, po), null, 54);
      out += amTile(770, 366, 260, 110, "3 − 10", Math.min(1, po), null, 54);
      out += MK.cross(600, 366, 34, popIn(t, cSwap, 0.4));
    }
    return svg(out);
  }

  /* ==== the written column method ==========================================
     ART.columnSum draws a 276 x 260 card; it is placed at 1.52 times, so its
     own coordinates map into the film by amCX and amCY. The figures below are
     the drawing's own: columns 58 apart with the ones at x 225, the carry row
     at y 58, the written numbers at 104 and 162, the answer at 226. */
  var AM_CS = { x: 58, y: 26, s: 1.52, w: 276, h: 260 };
  function amCX(v) { return AM_CS.x + v * AM_CS.s; }
  function amCY(v) { return AM_CS.y + v * AM_CS.s; }
  function amColX(k) { return 225 - 58 * k; }
  /* the patch that hides one part of the card until its cue; box in the
     card's own coordinates, o is how much of it is still hidden */
  function amHideCard(x, y, w, h, o) {
    return amHide(amCX(x), amCY(y), w * AM_CS.s, h * AM_CS.s, o);
  }
  /* 1 while the cue has not come, 0 once it has arrived and settled */
  function amUntil(t, at, span) { return 1 - on(t, at, span || 0.35); }

  function amCarryChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOne = c(0, "one"), cRight = c(0, "right");
    var cSum = c(1, "sum"), cOnes = c(1, "ones");
    var cBig = c(2, "big"), cWrite2 = c(2, "write"), cCarry = c(2, "carry");
    var cTens = c(3, "tens"), cThirteen = c(3, "thirteen"), cWrite3 = c(3, "write"), cAgain = c(3, "again");
    var cHuns = c(4, "huns"), cAnswer = c(4, "answer");
    var cRough = c(5, "rough"), cClose = c(5, "close");
    var k = i - scene.first, out = "";

    var hi = null;
    if (cOnes != null && t >= cOnes) hi = 0;
    if (cTens != null && t >= cTens) hi = 1;
    if (cHuns != null && t >= cHuns) hi = 2;
    if (k >= 5) hi = null;

    var card = ART.columnSum({ a: 247, b: 185, op: "+", answer: 432, highlight: hi });
    out += ART.place(card, AM_CS.x, AM_CS.y, AM_CS.w * AM_CS.s, AM_CS.h * AM_CS.s);
    /* the two carried tens, each written when it is said */
    out += amHideCard(amColX(1) - 34, 42, 28, 32, amUntil(t, cCarry));
    out += amHideCard(amColX(2) - 34, 42, 28, 32, amUntil(t, cAgain));
    /* the three answer digits, each written when it is said */
    out += amHideCard(amColX(0) - 26, 203, 52, 46, amUntil(t, cWrite2));
    out += amHideCard(amColX(1) - 26, 203, 52, 46, amUntil(t, cWrite3));
    out += amHideCard(amColX(2) - 26, 203, 52, 46, amUntil(t, cAnswer));
    /* "247 add 185": the two numbers of the calculation, as they are read */
    var qo = on(t, cSum, 0.5) * amOnly(t, scene, 1);
    if (qo > 0) out += MK.glow(amCX(160), amCY(133), 132, P.gold, qo * (0.6 + 0.4 * breathe(t)));
    /* "starting from the right": a pointer at the ones column */
    var ro = on(t, cRight, 0.5) * amOnly(t, scene, 0);
    if (ro > 0) out += MK.arrow(amCX(amColX(0)) + 112, amCY(104), amCX(amColX(0)) + 40, amCY(104), ro, P.gold, 7);
    var oo = on(t, cOne, 0.5) * amOnly(t, scene, 0);
    if (oo > 0) out += MK.pill(820, 120, "one column at a time", oo, { size: 26, col: P.gold });
    /* "12 is too big for the ones" */
    out += MK.pill(amCX(amColX(0)) + 150, amCY(226), "12", popIn(t, cBig, 0.4) * amOnly(t, scene, 2), { size: 30, col: P.accent, ink: P.accent });

    /* the working, one column a line, and then the rough check */
    var stay = 1 - (k >= 5 ? into(t, scene.first + 5) : 0);
    if (stay > 0) {
      out += G(MK.list(608, 152, [
        { text: "7 + 5 = 12", at: cOnes, mark: "tick", markAt: cWrite2 },
        { text: "4 + 8 + 1 = 13", at: cThirteen, mark: "tick", markAt: cWrite3 },
        { text: "2 + 1 + 1 = 4", at: cHuns, mark: "tick", markAt: cAnswer }
      ], t, { lh: 74 }), { opacity: stay });
    }
    if (cRough != null) {
      var est = into(t, scene.first + 5);
      if (est > 0) {
        out += G(MK.list(608, 122, [
          { text: "247 is about 200", at: cRough },
          { text: "185 is about 200", at: cRough + 0.4 },
          { text: "200 + 200 = 400", at: cRough + 0.8, mark: "tick", markAt: cRough + 1.1 },
          { text: "432 is close to 400", at: cClose, mark: "tick", markAt: cClose == null ? null : cClose + 0.4 }
        ], t, { lh: 72 }), { opacity: est });
      }
    }
    return svg(out);
  }

  /* ==== taking away, with an exchange ======================================
     400 - 178, the lesson's own example ("You cannot work out 400 - 178 by
     taking the 0 from the 8 in the ones"). */
  function amTakeChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCols = c(0, "cols"), cRight = c(0, "right");
    var cSum = c(1, "sum"), cSmall = c(1, "small");
    var cNever = c(2, "never"), cFetch = c(2, "fetch");
    var cThree = c(3, "three"), cNine = c(3, "nine"), cTen = c(3, "ten");
    var cDown = c(4, "down"), cAnswer = c(4, "answer");
    var k = i - scene.first, out = "";

    var hi = (k === 1 || k === 2) ? 0 : null;
    var card = ART.columnSum({ a: 400, b: 178, op: "-", answer: 222, highlight: hi });
    out += ART.place(card, AM_CS.x, AM_CS.y, AM_CS.w * AM_CS.s, AM_CS.h * AM_CS.s);

    /* before the exchange is named, the top row is a plain 4 0 0: ART draws
       the two lent digits grey and struck, so those two columns are covered
       and rewritten. The ones digit it leaves alone; only its borrowed 1 is
       covered. */
    var pre3 = amUntil(t, cThree, 0.4), pre9 = amUntil(t, cNine, 0.4), pre10 = amUntil(t, cTen, 0.4);
    out += amHideCard(82, 56, 54, 72, pre3);
    if (pre3 > 0) out += amNum(amCX(amColX(2)), amCY(104), "4", 38 * AM_CS.s, AMC.ink, { opacity: clamp(pre3, 0, 1) });
    out += amHideCard(140, 56, 54, 72, pre9);
    if (pre9 > 0) out += amNum(amCX(amColX(1)), amCY(104), "0", 38 * AM_CS.s, AMC.ink, { opacity: clamp(pre9, 0, 1) });
    out += amHideCard(186, 74, 24, 28, pre10);
    /* the three answer digits, as they are counted off */
    out += amHideCard(amColX(0) - 26, 203, 52, 46, amUntil(t, cDown));
    out += amHideCard(amColX(1) - 26, 203, 52, 46, amUntil(t, cDown == null ? null : cDown + 0.35));
    out += amHideCard(amColX(2) - 26, 203, 52, 46, amUntil(t, cDown == null ? null : cDown + 0.7));

    /* "the same columns", "from the right" */
    var co = on(t, cCols, 0.5) * amOnly(t, scene, 0);
    if (co > 0) out += MK.pill(820, 120, "the same columns", co, { size: 26, col: P.plum });
    var ro = on(t, cRight, 0.5) * amOnly(t, scene, 0);
    if (ro > 0) out += MK.arrow(amCX(amColX(0)) + 112, amCY(104), amCX(amColX(0)) + 40, amCY(104), ro, P.gold, 7);
    /* "Fetch a ten from the left": the hundred coming across */
    var fo = on(t, cFetch, 0.5) * (1 - on(t, cTen, 0.5));
    if (fo > 0) out += MK.arrow(amCX(amColX(2)), amCY(44), amCX(amColX(0)) - 8, amCY(44), fo, P.gold, 6);
    /* "400 take away 178": the calculation itself, as it is read */
    var qo = on(t, cSum, 0.5) * amOnly(t, scene, 1);
    if (qo > 0) out += MK.glow(amCX(160), amCY(133), 132, P.plum, qo * (0.6 + 0.4 * breathe(t)));
    /* the answer, once it is all down */
    out += MK.tick(amCX(amColX(0)) + 92, amCY(226), 24, popIn(t, cAnswer, 0.4));

    out += MK.list(608, 140, [
      { text: "0 − 8", at: cSmall, mark: "cross", markAt: cSmall == null ? null : cSmall + 0.45 },
      { text: "8 − 0", at: cNever, mark: "cross", markAt: cNever == null ? null : cNever + 0.45 },
      { text: "10 − 8 = 2", at: cTen, mark: "tick", markAt: cTen == null ? null : cTen + 0.5 },
      { text: "9 − 7 = 2", at: cDown == null ? null : cDown + 0.35, mark: "tick" },
      { text: "3 − 1 = 2", at: cDown == null ? null : cDown + 0.7, mark: "tick" }
    ], t, { lh: 66 });
    return svg(out);
  }
