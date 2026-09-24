
  /* ==== chapter: the equals sign, and the recap ==============================
     tools/lib/film-scenes/math-g1/what-comes-next-3.js.

     Three pictures in one chapter, each crossfading into the next, because the
     lesson teaches the equals sign in three moves: both sides the same (two
     equal sets of counters), the missing number found by counting on (the
     lesson's 3 + ? = 7 on its ten frame), and the pan balance (the lesson's
     first scale, 4 + 2 = ? + 3, whose answer is 3 and whose sides both make 6).
     The counters, the ten frame and the balance are ART's; the number sentence
     is drawn here, glyph by glyph, so the ? can turn into the answer. */

  var WCN_E = {
    countL: [180, 180, 250, 124], countR: [738, 180, 250, 124],
    frame: [450, 200, 268, 136], balance: [314, 96, 540, 252]
  };

  /* a number sentence, one glyph every 46 px, centred on 584 */
  function wcnSentence(y, tokens, hide) {
    var s = "", k, x0 = 584 - ((tokens.length - 1) / 2) * 56;
    for (k = 0; k < tokens.length; k++) {
      if (hide != null && k === hide) continue;
      s += Tx(x0 + k * 56, y, tokens[k], "lab huge", "middle", { fill: tokens[k] === "=" ? P.gold : P.ink });
    }
    return s;
  }
  function wcnSentenceX(n, k) { return 584 - ((n - 1) / 2) * 56 + k * 56; }

  function wcnEqualsChapter(scene, beat, t, i) {
    var out = "";
    var atEquals = sc(scene, 0, "equals"), atBoth = sc(scene, 0, "both");
    var atAnswer = sc(scene, 1, "answer");
    var atThree = sc(scene, 2, "three"), atSeven = sc(scene, 2, "seven");
    var atCountOn = sc(scene, 3, "countOn"), atFour = sc(scene, 3, "four");
    var atScale = sc(scene, 4, "scale"), atOther = sc(scene, 4, "other");
    var atAdd = sc(scene, 5, "add"), atLevel = sc(scene, 5, "level"), atSix = sc(scene, 5, "six");

    var toFrame = wcnFrom(t, scene, 2), toScale = wcnFrom(t, scene, 4);
    var aO = 1 - toFrame, bO = toFrame * (1 - toScale), cO = toScale;

    /* ---- both sides the same ---- */
    if (aO > 0.02) {
      var setsO = on(t, atEquals == null ? null : atEquals + 0.45, 0.8);
      out += G(ART.place(ART.counters(6, { colour: "teal" }), WCN_E.countL[0], WCN_E.countL[1], WCN_E.countL[2], WCN_E.countL[3]) +
        ART.place(ART.counters(6, { colour: "accent" }), WCN_E.countR[0], WCN_E.countR[1], WCN_E.countR[2], WCN_E.countR[3]), { opacity: aO * setsO });
      var sixO = popIn(t, atBoth, 0.42);
      out += G(Tx(305, 340, "6", "lab big", "middle", { fill: P.teal }) +
        Tx(863, 340, "6", "lab big", "middle", { fill: P.accent }), { opacity: aO * Math.min(1, sixO) });
      out += G(Tx(584, 258, "=", "lab huge", "middle", { fill: P.gold, "font-size": 88 }), { opacity: aO * popIn(t, atEquals, 0.45) });
      /* not "here comes the answer" */
      var noU = popIn(t, atAnswer, 0.42);
      out += G(MK.pill(626, 396, "here comes the answer", Math.min(1, noU), { size: 22, col: P.bad, ink: P.bad }), { opacity: aO });
      out += G(MK.cross(430, 396, 26, noU), { opacity: aO });
    }

    /* ---- three add something makes seven ---- */
    if (bO > 0.02) {
      var n = 3 + tally(t, atCountOn, 4, 1.35);
      out += G(ART.place(ART.tenFrame(n, { split: 3 }), WCN_E.frame[0], WCN_E.frame[1], WCN_E.frame[2], WCN_E.frame[3]),
        { opacity: bO * on(t, atThree, 0.5) });
      var gotIt = popIn(t, atFour, 0.42);
      out += G(wcnSentence(140, ["3", "+", "?", "=", "7"], 2), { opacity: bO * on(t, atThree, 0.5) });
      out += G(Tx(wcnSentenceX(5, 2), 140, "?", "lab huge", "middle", { fill: P.accent }),
        { opacity: bO * on(t, atThree, 0.5) * (1 - Math.min(1, gotIt)) });
      out += G(Tx(wcnSentenceX(5, 2), 140, "4", "lab huge", "middle", { fill: P.good }), { opacity: bO * Math.min(1, gotIt) });
      out += G(wcnRing(wcnSentenceX(5, 4), 128, 18, P.gold, on(t, atSeven, 0.45)), { opacity: bO });
      out += G(MK.tick(792, 128, 24, popIn(t, atFour == null ? null : atFour + 0.2, 0.38)), { opacity: bO });
      out += G(Tx(584, 386, "count on: 4, 5, 6, 7", "lab mid muted", "middle"), { opacity: bO * on(t, atCountOn, 0.5) });
    }

    /* ---- the scale ---- */
    if (cO > 0.02) {
      var added = atAdd != null && t >= atAdd, levelU = on(t, atLevel, 0.5);
      var right = added ? "3 + 3" : "3 + ?";
      out += G(ART.place(ART.balance("4 + 2", right, { tilt: "left" }), WCN_E.balance[0], WCN_E.balance[1], WCN_E.balance[2], WCN_E.balance[3]),
        { opacity: cO * on(t, atScale, 0.5) * (1 - levelU) });
      out += G(ART.place(ART.balance("4 + 2", "3 + 3", { tilt: "level" }), WCN_E.balance[0], WCN_E.balance[1], WCN_E.balance[2], WCN_E.balance[3]),
        { opacity: cO * levelU });
      out += G(wcnSentence(400, ["4", "+", "2", "=", "?", "+", "3"], 4), { opacity: cO * on(t, atScale, 0.5) });
      out += G(Tx(wcnSentenceX(7, 4), 400, "?", "lab huge", "middle", { fill: P.accent }),
        { opacity: cO * on(t, atScale, 0.5) * (added ? 0 : 1) });
      out += G(Tx(wcnSentenceX(7, 4), 400, "3", "lab huge", "middle", { fill: P.good }), { opacity: cO * popIn(t, atAdd, 0.4) });
      out += G(wcnRing(740, 213, 46, P.accent, on(t, atOther, 0.45)), { opacity: cO * (1 - levelU) });
      var sixP = popIn(t, atSix, 0.42);
      out += G(MK.pill(426, 62, "6", Math.min(1, sixP), { size: 26, col: P.teal, ink: P.teal }) +
        MK.pill(742, 62, "6", Math.min(1, sixP), { size: 26, col: P.accent, ink: P.accent }) +
        MK.tick(584, 62, 24, sixP), { opacity: cO });
    }
    return svg(out);
  }

  /* ==== what you now know ==================================================== */
  function wcnRecapBeads(cx, cy, size) {
    var r = size * 0.17, d = size * 0.44;
    return wcnBead(cx - d, cy, r, "purple", "circle", 1) + wcnBead(cx, cy, r, "gold", "square", 1) +
      wcnBead(cx + d, cy, r, "gold", "square", 1);
  }
  function wcnRecapJump(cx, cy, size) {
    var a = cx - size * 0.44, b = cx + size * 0.44, y = cy + size * 0.24;
    return Pth("M" + n2(a) + "," + n2(y) + " C" + n2(a + size * 0.3) + "," + n2(y - size * 0.8) + " " +
      n2(b - size * 0.3) + "," + n2(y - size * 0.8) + " " + n2(b) + "," + n2(y), null, P.blue, 5) +
      C(a, y, size * 0.09, P.blue) + C(b, y, size * 0.09, P.blue) +
      Tx(cx, cy - size * 0.26, "+2", "lab mid", "middle", { fill: P.blue });
  }
  function wcnRecapEquals(cx, cy, size) {
    return L(cx - size * 0.34, cy - size * 0.13, cx + size * 0.34, cy - size * 0.13, P.gold, size * 0.13) +
      L(cx - size * 0.34, cy + size * 0.17, cx + size * 0.34, cy + size * 0.17, P.gold, size * 0.13);
  }

  var WCN_RECAP = MK.recapKind([
    { beat: 0, at: "part", title: "A part repeats", sub: "purple, gold, gold", pic: wcnRecapBeads },
    { beat: 1, at: "jump", title: "Jump patterns", sub: "2, 4, 6, 8, 10", pic: wcnRecapJump },
    { beat: 2, at: "equals", title: "Equals", sub: "the same on both sides", pic: wcnRecapEquals }
  ], { goBeat: 2, goAt: "go" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The part of a pattern that repeats", "Jump patterns, forwards and backwards", "What the equals sign really means"] }),
    repeat: wcnRepeatChapter, unit: wcnUnitChapter, jump: wcnJumpChapter,
    grow: wcnGrowChapter, equals: wcnEqualsChapter, recap: WCN_RECAP
  };
