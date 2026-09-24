  /* ==== Follow, Edit, Correct, part 3: correcting, editing, and the four verbs
     tools/lib/film-scenes/computing-g3/follow-edit-correct-3.js. See the header
     of follow-edit-correct.js.

     The kite and the tower are the lesson's own scenes, drawn from the list on
     the left. "Cut the paper into tiny pieces" is not a step the kite scene
     knows, so it adds nothing to the kite and the sticks stay bare - which is
     exactly what the lesson says is wrong with that step. Nothing here draws a
     picture of a mistake of its own. */

  /* ==== chapter: correcting a step ================================================
     The kite algorithm, with one step wrong. Find it, take it out, put the
     right step in its place, then run it again and watch the kite fly. */
  var FEC_KITE_BUG = ["sticks", "tie", "tiny", "tail", "string", "fly"];
  var FEC_KITE_OK = ["sticks", "tie", "paper", "tail", "string", "fly"];
  var FEC_STICKS_AT = [170, 120];        /* where the kit draws the tied sticks */

  function fecCorrectOpen(scene, t) {
    var cWrong = sc(scene, 0, "wrong"), cCorrecting = sc(scene, 0, "correcting"),
      cPlace = sc(scene, 0, "place");
    var out = "", shown = tally(t, cWrong, 6, 0.9);
    FEC_KITE_BUG.forEach(function (id, k) {
      if (k >= shown) return;
      out += fecRow(FEC_PANEL.x, fec6Y(k), FEC_PANEL.w, FEC_R6.h, k + 1, id, { o: 1, dimmed: true });
    });
    var bp = popIn(t, cCorrecting, 0.42), sp = popIn(t, cPlace, 0.42);
    out += MK.glow(856, 132, 128, P.accent, Math.min(1, bp) * (0.6 + 0.4 * breathe(t)));
    out += MK.pop(Em(856, 132, 116, "\u{1F41B}"), 856, 132, bp);
    out += MK.arrow(936, 196, 1010, 250, on(t, cPlace, 0.5), P.gold, 8);
    out += MK.pop(Em(1046, 292, 100, "\u{1F527}"), 978, 296, sp);
    return out;
  }

  function fecCorrectMain(scene, t) {
    var cKite = sc(scene, 1, "kite"), cSticks = sc(scene, 1, "sticks"),
      cTie = sc(scene, 1, "tie"), cTiny = sc(scene, 1, "tiny");
    var cTinyq = sc(scene, 2, "tinyq"), cCover = sc(scene, 2, "cover"), cBug = sc(scene, 2, "bug");
    var cOut = sc(scene, 3, "out"), cIn = sc(scene, 3, "in"), cGlue = sc(scene, 3, "glue");
    var cRun = sc(scene, 4, "run"), cCheck = sc(scene, 4, "check"), cFlies = sc(scene, 4, "flies");
    var out = "";

    var gone = on(t, cOut, 0.6), drop = on(t, cGlue, 0.55), fixed = fecPast(t, cGlue);
    var ran = fecPast(t, cRun), n = ran ? tally(t, cRun, 6, 1.5) : 0;
    var ids = ran ? FEC_KITE_OK.slice(0, n)
      : fixed ? ["sticks", "tie", "paper"]
        : fecPast(t, cTie) ? ["sticks", "tie"]
          : fecPast(t, cSticks) ? ["sticks"] : [];
    out += fecKite(ids, on(t, cKite, 0.5));

    var shown = tally(t, cKite, 6, 1.0);
    FEC_KITE_BUG.forEach(function (id, k) {
      if (k >= shown) return;
      if (k === 2) return;                       /* the wrong step, drawn below */
      var lit = (k === 0 && fecPast(t, cSticks) && !fecPast(t, cTie)) ||
        (k === 1 && fecPast(t, cTie) && !fecPast(t, cTiny));
      out += fecRow(FEC_PANEL.x, fec6Y(k), FEC_PANEL.w, FEC_R6.h, k + 1, id,
        { o: 1, col: lit ? P.gold : null, mark: ran && k < n ? "tick" : null,
          markP: popIn(t, cRun == null ? null : cRun + 0.2 + k * 0.25, 0.35) });
      out += MK.ripple(FEC_PANEL.x + 38, fec6Y(k) + FEC_R6.h / 2, t, k === 0 ? cSticks : k === 1 ? cTie : null, P.gold);
    });

    /* the wrong step: named, questioned, found, and taken out. It waits for the
       list to reach it, like every other row. */
    var slotC = [FEC_PANEL.x + FEC_PANEL.w / 2, fec6Y(2) + FEC_R6.h / 2];
    if (shown > 2 && gone < 1) out += G(fecRow(FEC_PANEL.x, fec6Y(2), FEC_PANEL.w, FEC_R6.h, 3, "tiny",
      { o: 1, col: fecPast(t, cBug) ? P.bad : fecPast(t, cTiny) ? P.gold : null,
        mark: fecPast(t, cOut) ? "cross" : fecPast(t, cBug) ? "bug" : fecPast(t, cTinyq) ? "qmark" : null,
        markP: popIn(t, fecPast(t, cOut) ? cOut : fecPast(t, cBug) ? cBug : cTinyq, 0.38) }),
      { opacity: 1 - gone, transform: around(slotC[0], slotC[1], 1 - 0.32 * gone) });
    if (shown > 2) out += fecSlot(FEC_PANEL.x, fec6Y(2), FEC_PANEL.w, FEC_R6.h, 3, gone * (1 - drop));
    if (drop > 0) out += G(fecRow(FEC_PANEL.x, fec6Y(2), FEC_PANEL.w, FEC_R6.h, 3, "paper",
      { o: drop, col: P.good, mark: ran && n > 2 ? "tick" : null,
        markP: popIn(t, cRun == null ? null : cRun + 0.7, 0.35) }),
      { transform: around(slotC[0], slotC[1], 0.72 + 0.28 * drop) });
    out += MK.arrow(FEC_GUT + 22, slotC[1], FEC_GUT - 22, slotC[1], on(t, cIn, 0.5) * (1 - drop), P.good, 7);
    out += MK.ripple(FEC_PANEL.x + 38, slotC[1], t, cTiny, P.gold);

    /* the paper has to cover the sticks - which are standing there bare */
    out += MK.leader(FEC_PANEL.x + FEC_PANEL.w + 8, slotC[1],
      fecSX(FEC_STICKS_AT[0]), fecSY(FEC_STICKS_AT[1]), on(t, cCover, 0.6) * (1 - gone), P.gold);
    /* run it again and check */
    var ck = bump(t, cCheck, 1.0);
    if (ck > 0) out += R(FEC_PANEL.x - 8, fec6Y(0) - 8, FEC_PANEL.w + 16,
      fec6Y(5) + FEC_R6.h - fec6Y(0) + 16, 26, "none", P.good, 5, { opacity: ck });
    out += MK.tick(fecSX(284), fecSY(42), 30, popIn(t, cFlies, 0.42));
    return out;
  }

  function fecCorrectChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1), out = "";
    if (u < 1) out += G(fecCorrectOpen(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(fecCorrectMain(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: editing on purpose ===============================================
     The tower algorithm, with nothing wrong with it at all. One step is changed
     because a red top is wanted, and the kit stacks a red brick where the small
     yellow one was. Then the difference the lesson keeps coming back to: edit is
     a change you want, correct is a fix you need. */
  var FEC_TOWER = ["big", "middle", "small", "flag"];
  var FEC_TOWER_RED = ["big", "middle", "red", "flag"];

  function fecEditOpen(scene, t) {
    var cEditing = sc(scene, 0, "editing"), cNothing = sc(scene, 0, "nothing"),
      cDifferent = sc(scene, 0, "different");
    var out = "", shown = tally(t, cEditing, 4, 0.9);
    FEC_TOWER.forEach(function (id, k) {
      if (k >= shown) return;
      out += fecRow(FEC_PANEL.x, fec4Y(k), FEC_PANEL.w, FEC_R4.h, k + 1, id, { o: 1, dimmed: true, fs: 24 });
    });
    /* no bug here */
    var np = popIn(t, cNothing, 0.42);
    out += MK.pop(Em(856, 128, 96, "\u{1F41B}"), 790, 128, np);
    out += MK.cross(856, 128, 58, popIn(t, cNothing == null ? null : cNothing + 0.35, 0.42));
    /* a pencil instead */
    var dp = popIn(t, cDifferent, 0.42);
    out += MK.glow(856, 300, 118, P.good, Math.min(1, dp) * (0.6 + 0.4 * breathe(t)));
    out += MK.pop(Em(856, 300, 100, "✏️"), 790, 300, dp);
    return out;
  }

  function fecEditMain(scene, t) {
    var cTower = sc(scene, 1, "tower"), cBig = sc(scene, 1, "big"), cMiddle = sc(scene, 1, "middle"),
      cSmall = sc(scene, 1, "small"), cFlag = sc(scene, 1, "flag");
    var cRedtop = sc(scene, 2, "redtop"), cChange = sc(scene, 2, "change"), cRed = sc(scene, 2, "red");
    var cOne = sc(scene, 3, "one"), cDiff = sc(scene, 3, "diff"), cTop = sc(scene, 3, "top");
    var at = [cBig, cMiddle, cSmall, cFlag], out = "", built = 0;
    at.forEach(function (c) { if (fecPast(t, c)) built++; });
    var edited = fecPast(t, cRed);
    out += fecTower(edited ? FEC_TOWER_RED : FEC_TOWER.slice(0, built), on(t, cTower, 0.5));

    var swap = on(t, cRed, 0.5);
    for (var k = 0; k < 4; k++) {
      if (k >= built) { out += fecSlot(FEC_PANEL.x, fec4Y(k), FEC_PANEL.w, FEC_R4.h, k + 1, on(t, cTower, 0.5)); continue; }
      var lit = built - 1 === k && !fecPast(t, cRedtop);
      if (k !== 2) {
        out += fecRow(FEC_PANEL.x, fec4Y(k), FEC_PANEL.w, FEC_R4.h, k + 1, FEC_TOWER[k],
          { o: 1, col: lit ? P.gold : null, fs: 24 });
      } else {
        /* the one step that decides the top brick */
        var hot = fecPast(t, cChange) && !edited;
        if (swap < 1) out += G(fecRow(FEC_PANEL.x, fec4Y(2), FEC_PANEL.w, FEC_R4.h, 3, "small",
          { o: 1, col: hot ? P.gold : lit ? P.gold : null, fs: 24 }),
          { opacity: 1 - swap, transform: around(FEC_PANEL.x + FEC_PANEL.w / 2, fec4Y(2) + FEC_R4.h / 2, 1 - 0.22 * swap) });
        if (swap > 0) out += G(fecRow(FEC_PANEL.x, fec4Y(2), FEC_PANEL.w, FEC_R4.h, 3, "red",
          { o: swap, col: P.good, fs: 24 }),
          { transform: around(FEC_PANEL.x + FEC_PANEL.w / 2, fec4Y(2) + FEC_R4.h / 2, 0.78 + 0.22 * swap) });
        out += MK.ripple(FEC_PANEL.x + 46, fec4Y(2) + FEC_R4.h / 2, t, cChange, P.gold);
      }
      out += MK.ripple(FEC_PANEL.x + 46, fec4Y(k) + FEC_R4.h / 2, t, at[k], P.gold);
    }

    /* a red top, please */
    var rp = popIn(t, cRedtop, 0.42) * (1 - swap);
    out += MK.pop(R(940, 66, 74, 44, 8, FEC_BRICK.red, P.ground, 3), 977, 88, rp);
    out += MK.qmark(1044, 88, 26, Math.min(1, rp));
    /* one step changed, and there it is on top */
    var ob = bump(t, cOne, 1.1);
    if (ob > 0) out += R(FEC_PANEL.x - 6, fec4Y(2) - 6, FEC_PANEL.w + 12, FEC_R4.h + 12, 24, "none", P.good, 5, { opacity: ob });
    out += MK.tick(fecTX(286), fecTY(36), 28, popIn(t, cDiff, 0.42));
    var tp = on(t, cTop, 0.5);
    if (tp > 0) out += E(fecTX(160), fecTY(129), 80 + 4 * breathe(t), 32 + 3 * breathe(t), "none", P.good, 5, { opacity: tp });
    return out;
  }

  /* the last beat: the difference the lesson keeps coming back to */
  function fecEditRule(scene, t) {
    var cWant = sc(scene, 4, "want"), cNeed = sc(scene, 4, "need");
    function card(x, pic, title, sub, p, col) {
      if (!(p > 0)) return "";
      return MK.pop(R(x, 92, 440, 256, 28, P.card, col, 3) +
        Em(x + 220, 176, 88, pic) +
        Tx(x + 220, 268, title, "lab huge", "middle") +
        Tx(x + 220, 312, sub, "lab mid muted readable", "middle"), x + 220, 220, p);
    }
    return card(110, "✏️", "Edit", "a change you want", popIn(t, cWant, 0.42), P.good) +
      card(618, "\u{1F41B}", "Correct", "a fix you need", popIn(t, cNeed, 0.42), P.accent);
  }

  function fecEditChapter(scene, beat, t, i) {
    var u1 = into(t, scene.first + 1), u2 = into(t, scene.first + 4), out = "";
    if (u1 < 1) out += G(fecEditOpen(scene, t), { opacity: 1 - u1 });
    if (u1 > 0 && u2 < 1) out += G(fecEditMain(scene, t), { opacity: u1 * (1 - u2) });
    if (u2 > 0) out += G(fecEditRule(scene, t), { opacity: u2 });
    return svg(out);
  }

  /* ==== chapter: four things to do ================================================
     The lesson's own four bins, lit as they are named, and then one of its own
     sorting items: swapping jam for honey because you like honey. */
  var FEC_FOUR = [
    { pic: "\u{1F463}", title: "Follow", sub: "do the steps", beat: 1, at: "follow" },
    { pic: "\u{1F4A1}", title: "Understand", sub: "know why", beat: 1, at: "understand" },
    { pic: "✏️", title: "Edit", sub: "change it on purpose", beat: 2, at: "edit" },
    { pic: "\u{1F41B}", title: "Correct", sub: "fix a step that is wrong", beat: 2, at: "correct" }
  ];
  var FEC_CARD = { x: 26, y: 40, w: 264, h: 230, gap: 20 };
  function fecCardX(k) { return FEC_CARD.x + k * (FEC_CARD.w + FEC_CARD.gap); }

  function fecFourChapter(scene, beat, t, i) {
    var cFour = sc(scene, 0, "four"), cOne = sc(scene, 0, "one");
    var cJam = sc(scene, 3, "jam"), cEditing = sc(scene, 3, "editing"), cNot = sc(scene, 3, "notcorrect");
    var out = "", shown = tally(t, cFour, 4, 1.0);

    FEC_FOUR.forEach(function (c, k) {
      if (k >= shown) return;
      var x = fecCardX(k), cx = x + FEC_CARD.w / 2;
      var p = popIn(t, cFour == null ? null : cFour + k * 0.2, 0.36);
      var lit = popIn(t, sc(scene, c.beat, c.at), 0.4), on1 = Math.min(1, lit);
      out += G(R(x, FEC_CARD.y, FEC_CARD.w, FEC_CARD.h, 24, on1 > 0 ? "#1B3A52" : P.card,
          on1 > 0 ? P.teal : P.line, on1 > 0 ? 3 : 2) +
        Em(cx, FEC_CARD.y + 84, 74, c.pic) +
        Tx(cx, FEC_CARD.y + 166, c.title, "lab big", "middle") +
        Tx(cx, FEC_CARD.y + 202, c.sub, "lab mid muted readable", "middle"),
        { opacity: (0.42 + 0.58 * on1) * Math.min(1, p),
          transform: around(cx, FEC_CARD.y + FEC_CARD.h / 2, 0.96 + 0.04 * Math.min(1, lit)) });
    });

    /* one algorithm, and four things to do with it */
    var jam = on(t, cJam, 0.5), strip = on(t, cOne, 0.5);
    if (strip > 0) {
      out += G(R(434, 316, 300, 76, 26, P.cell, P.gold, 3), { opacity: strip });
      if (jam < 1) out += G(Em(478, 356, 38, "\u{1F4CF}") +
        L(514, 354, 712, 354, P.gold, 4) +
        C(556, 354, 9, P.gold) + C(598, 354, 9, P.gold) + C(640, 354, 9, P.gold) + C(682, 354, 9, P.gold),
        { opacity: strip * (1 - jam) });
      for (var k = 0; k < 4; k++)
        out += MK.leader(584, 316, fecCardX(k) + FEC_CARD.w / 2, FEC_CARD.y + FEC_CARD.h + 4,
          strip * (1 - jam), P.gold);
    }
    /* swapping jam for honey: a change you want, so it is editing */
    /* the lesson's own sorting item. Windows draws no jam, and a strawberry is
       not one, so the two things being swapped are said in words. */
    if (jam > 0) out += MK.pill(504, 354, "jam", jam, { size: 26, col: P.gold, ink: P.gold }) +
      MK.arrow(556, 354, 616, 354, jam, P.gold, 7) +
      MK.pill(672, 354, "honey", jam, { size: 26, col: P.good, ink: P.good });
    out += MK.arrow(700, 330, 726, FEC_CARD.y + FEC_CARD.h + 10, on(t, cEditing, 0.5), P.good, 8);
    out += MK.tick(fecCardX(2) + FEC_CARD.w - 34, FEC_CARD.y + 30, 24, popIn(t, cEditing, 0.42));
    out += MK.cross(fecCardX(3) + FEC_CARD.w - 34, FEC_CARD.y + 30, 24, popIn(t, cNot, 0.42));
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own five words, with the pictures its own steps carry. */
  var FEC_RECAP = MK.recapKind([
    { beat: 0, at: "linear", title: "Linear", sub: "a line of steps", pic: "\u{1F4CF}" },
    { beat: 1, at: "follow", title: "Follow", sub: "do the steps in order", pic: "\u{1F463}" },
    { beat: 1, at: "understand", title: "Understand", sub: "know why each step is there", pic: "\u{1F4A1}" },
    { beat: 2, at: "edit", title: "Edit", sub: "a change you want", pic: "✏️" },
    { beat: 2, at: "correct", title: "Correct", sub: "a fix you need", pic: "\u{1F41B}" }
  ], { goBeat: 2, goAt: "correct" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What makes an algorithm linear", "Why every step is where it is", "How to correct a step, and how to edit one"] }),
    linear: fecLinearChapter, follow: fecFollowChapter, understand: fecUnderstandChapter,
    correct: fecCorrectChapter, edit: fecEditChapter, four: fecFourChapter, recap: FEC_RECAP
  };
