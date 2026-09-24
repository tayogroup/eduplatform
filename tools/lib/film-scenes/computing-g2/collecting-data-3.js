  /* ==== Collecting Data, part 3: statistical or not, and the three kinds =========
     tools/lib/film-scenes/computing-g2/collecting-data-3.js.

     The sorting chapter is the lesson's own bin step: two bins with the
     lesson's own labels, and three of its own questions - how many pets, which
     fruit do you like best, why do you like your dog - each carried to the bin
     the lesson puts it in. The last beat draws an EMPTY table, because the
     question there is "could I make a table of the answers?" and a table with
     numbers in it would be answering a different question with data nobody
     collected. */

  /* ==== chapter: statistical, or not? ============================================ */
  var CD_BIN = [
    { x: 90, pic: "\u{1F4CA}", label: "Statistical: we can count it", col: P.good },
    { x: 618, pic: "\u{1F4AC}", label: "Not statistical: a story", col: P.plum }
  ];
  var CD_BIN_BOX = { y: 250, w: 460, h: 160 };
  var CD_CARD = { w: 450, h: 110, y: 48, start: 359 };
  /* the lesson's own questions, in the order the film says them */
  var CD_ASK = [
    { beat: 1, at: "pets", decide: "number", pic: "\u{1F436}", text: "how many pets do you have?", bin: 0 },
    { beat: 2, at: "fruit", decide: "category", pic: "\u{1F34E}", text: "which fruit do you like best?", bin: 0 },
    { beat: 3, at: "dog", decide: "story", pic: "❤️", text: "why do you like your dog?", bin: 1 }
  ];

  function cdStatChapter(scene, beat, t, i) {
    var cStat = sc(scene, 0, "statistical"), cCount = sc(scene, 0, "count");
    var cCannot = sc(scene, 4, "cannot"), cTable = sc(scene, 4, "table");
    var out = "", bins = on(t, cStat, 0.5);

    /* the two bins, with the lesson's own labels */
    CD_BIN.forEach(function (b, k) {
      var B = CD_BIN_BOX, bad = k === 1 && cdPast(t, cCannot);
      out += G(R(b.x, B.y, B.w, B.h, 22, P.card, bad ? P.bad : b.col, bad ? 3.5 : 2.5) +
        Em(b.x + 42, B.y + 42, 40, b.pic) +
        Tx(b.x + 76, B.y + 50, b.label, "lab mid", "start"), { opacity: bins });
    });
    /* what has been sorted into each of them */
    var done = [0, 0];
    CD_ASK.forEach(function (a) {
      var at = sc(scene, a.beat, a.decide), p = popIn(t, at == null ? null : at + 0.55, 0.4);
      if (!(p > 0)) return;
      var b = CD_BIN[a.bin], x = b.x + 44 + done[a.bin] * 82, y = CD_BIN_BOX.y + 116;
      done[a.bin]++;
      out += MK.pop(R(x - 34, y - 34, 68, 68, 16, P.cell, b.col, 2.5) + MK.pic(x, y, 38, a.pic), x, y, p);
      if (a.bin === 1 && cdPast(t, cCannot)) out += MK.cross(x + 30, y - 30, 17, popIn(t, cCannot, 0.4));
    });

    /* the rule, while it is being said */
    out += MK.pill(584, 96, "count it, or measure it", cdOnly(t, scene, 0) * on(t, cCount, 0.5),
      { size: 24, col: P.good, ink: P.good });

    /* the question being sorted, travelling to its bin */
    CD_ASK.forEach(function (a) {
      var ap = sc(scene, a.beat, a.at), at = sc(scene, a.beat, a.decide);
      var o = cdOnly(t, scene, a.beat) * popIn(t, ap, 0.4);
      if (!(o > 0)) return;
      var u = on(t, at, 0.7), b = CD_BIN[a.bin];
      var x = lerp(CD_CARD.start, b.x + (CD_BIN_BOX.w - CD_CARD.w) / 2, u);
      out += G(R(x, CD_CARD.y, CD_CARD.w, CD_CARD.h, 22, P.cell, b.col, u > 0.5 ? 3.5 : 2.5) +
        MK.pic(x + 46, CD_CARD.y + CD_CARD.h / 2, 46, a.pic) +
        Tx(x + 84, CD_CARD.y + CD_CARD.h / 2 + 8, a.text, "lab", "start"), { opacity: Math.min(1, o) });
      out += MK.arrow(x + CD_CARD.w / 2, 168, b.x + CD_BIN_BOX.w / 2, 240,
        Math.min(1, o) * on(t, at == null ? null : at + 0.3, 0.45), b.col, 7);
      if (a.bin === 0) out += MK.tick(x + CD_CARD.w - 34, CD_CARD.y + 20, 24, popIn(t, at, 0.4) * Math.min(1, o));
      else out += MK.cross(x + CD_CARD.w - 34, CD_CARD.y + 20, 24, popIn(t, at, 0.4) * Math.min(1, o));
    });

    /* could I make a table of the answers? An empty one: nobody has asked yet */
    var tb = popIn(t, cTable, 0.45);
    if (tb > 0) {
      var g = "", r0, c0;
      for (r0 = 0; r0 < 3; r0++) for (c0 = 0; c0 < 2; c0++)
        g += R(470 + c0 * 115, 34 + r0 * 46, 115, 46, 0, "none", P.muted, 2);
      out += MK.pop(R(470, 34, 230, 138, 4, P.card, P.muted, 2) + g, 585, 103, tb);
      out += MK.qmark(770, 103, 44, Math.min(1, tb));
    }
    return svg(out);
  }

  /* ==== chapter: three kinds =====================================================
     Three columns, each filled as its kind is named and then given the lesson's
     own example of it. */
  var CD_KIND = [
    { at: "count", ex: "pets", pic: "\u{1F522}", name: "A count", expic: "\u{1F436}", extext: "how many pets" },
    { at: "measurement", ex: "tall", pic: "\u{1F4CF}", name: "A measurement", expic: "\u{1F9D2}", extext: "how tall you are" },
    { at: "category", ex: "fruit", pic: "\u{1F3F7}️", name: "A category", expic: "\u{1F34E}", extext: "favourite fruit" }
  ];
  var CD_COL = { xs: [36, 412, 788], w: 344, y: 40, h: 310 };

  function cdKindsChapter(scene, beat, t, i) {
    var cThree = sc(scene, 0, "three"), cThink = sc(scene, 4, "think");
    var out = "", slots = tally(t, cThree, 3, 0.8), think = on(t, cThink, 0.5);

    CD_KIND.forEach(function (kd, k) {
      var x = CD_COL.xs[k], cx = x + CD_COL.w / 2;
      var at = sc(scene, k + 1, kd.at), p = popIn(t, at, 0.45), ex = popIn(t, sc(scene, k + 1, kd.ex), 0.4);
      var ghost = k < slots ? on(t, cThree == null ? null : cThree + k * 0.28, 0.45) : 0;
      if (!(ghost > 0) && !(p > 0)) return;
      var lit = Math.min(1, p), pulse = 0.55 + 0.45 * breathe(t + k * 0.5);
      out += G(R(x, CD_COL.y, CD_COL.w, CD_COL.h, 24, P.card, lit > 0 ? P.teal : P.line, lit > 0 ? 3 : 2,
        { "stroke-dasharray": lit > 0 ? null : "12 10" }), { opacity: Math.max(ghost, lit) });
      if (think > 0)
        out += R(x, CD_COL.y, CD_COL.w, CD_COL.h, 24, "none", P.gold, 3, { opacity: think * pulse });
      if (!(lit > 0)) {
        out += Tx(cx, CD_COL.y + CD_COL.h / 2 + 22, String(k + 1), "lab muted", "middle",
          { "font-size": 64, opacity: ghost * 0.7 });
        return;
      }
      out += MK.pill(cx, CD_COL.y + 48, kd.name, lit, { size: 24, col: P.teal, ink: P.teal });
      out += MK.pop(MK.pic(cx, CD_COL.y + 140, 92, kd.pic), cx, CD_COL.y + 140, p);
      out += MK.pop(R(x + 24, CD_COL.y + 202, CD_COL.w - 48, 76, 18, P.cell, P.line, 2) +
        MK.pic(x + 66, CD_COL.y + 240, 42, kd.expic) +
        Tx(x + 100, CD_COL.y + 248, kd.extext, "lab mid", "start"), cx, CD_COL.y + 240, ex);
    });

    out += MK.bubble(264, 368, 640, 56, "Which kind will this question give?", think);
    return svg(out);
  }
