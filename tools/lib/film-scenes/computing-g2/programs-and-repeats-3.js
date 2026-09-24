  /* ==== Programs and Repeats, part 3: same output, and testing as you go ======
     tools/lib/film-scenes/computing-g2/programs-and-repeats-3.js. See the
     header of programs-and-repeats.js.

     The two programs in "Same output, fewer blocks" are the lesson's own sort
     items: repeat 3 times jump against jump jump jump (same), and repeat 2
     times move right against three moves right (different). Both cats stand
     where ART.run puts them, so the two squares against three is the kit's
     arithmetic and not the film's. */

  var PR_R2_MOVES = ART.program.expand(["repeat2", "right"]);
  var PR_R2_AT = PR_R2_MOVES.map(function (_, k) { return prRunTo(PR_R2_MOVES, k + 1); });
  var PR_R3_MOVES = ["right", "right", "right"];
  var PR_R3_AT = PR_R3_MOVES.map(function (_, k) { return prRunTo(PR_R3_MOVES, k + 1); });
  if (PR_R2_MOVES.length !== 2)
    throw new Error("Programs and Repeats: repeat 2 times, move right makes " + PR_R2_MOVES.length + " moves and the film says two");

  /* ---- the two bands both halves of the chapter use -----------------------
     One program to a band, all the way across: the blocks on the left with
     room for the lesson's own words on them, and the cat on its stage on the
     right. Stacking them is what lets a block carry a readable label - side by
     side, "repeat 3 times" came out at 13 px. */

  var PR_BAND = [20, 250], PR_BH = 170;
  var PR_BX = 100, PR_BW = 660;              /* where a program's blocks sit */
  var PR_SP = { cx: 955, pitch: 50, size: 46 };

  function prBand(k, o, col) {
    if (!(o > 0)) return "";
    return R(30, PR_BAND[k], 1108, PR_BH, 20, P.card, col || P.line, col ? 4 : 3, { opacity: Math.min(1, o) });
  }
  /* the blocks of one program, left to right */
  function prProgramRow(y, ids, o, lit) {
    if (!(o > 0)) return "";
    var n = ids.length, gap = 10, w = Math.min(230, (PR_BW - (n - 1) * gap) / n), out = "";
    ids.forEach(function (id, k) {
      out += prBlock(PR_BX + k * (w + gap), y, w, 64, id, { lit: lit === k + 1, col: lit === k + 1 ? P.gold : null });
    });
    return G(out, { opacity: Math.min(1, o) });
  }
  /* n dots that fill as the moves land, with what they count beside them */
  function prCountRow(cy, n, done, o, label) {
    if (!(o > 0)) return "";
    var r = 14, gap = 40, out = "", x0 = PR_SP.cx - (n - 1) * gap / 2;
    for (var k = 0; k < n; k++)
      out += C(x0 + k * gap, cy, r, k < done ? P.gold : P.card, k < done ? P.gold : P.line, 3);
    out += Tx(x0 - 26, cy + 7, label, "lab mid muted", "end");
    return G(out, { opacity: Math.min(1, o) });
  }

  /* ==== chapter: same output, fewer blocks ======================================
     One band each, the lesson's own two pairs: repeat 3 times jump against
     three jump blocks, then repeat 2 times move right against three moves. */

  function prSameBand(k, side, play, o, col) {
    var y = PR_BAND[k], out = prBand(k, o, col);
    if (!(o > 0)) return out;
    out += MK.pill(66, y + 34, side.tag, o, { size: 24, col: P.muted, ink: P.muted });
    out += prProgramRow(y + 18, side.ids, o, side.lit ? play.done : 0);
    out += prCountRow(y + 38, side.n, play.done, o, side.label);
    out += prGround(PR_SP.cx, y + 128, PR_SP.pitch, o);
    out += prCat(PR_SP.cx, y + 128, PR_SP.pitch, play, play.up, PR_SP.size, o);
    out += MK.pop(Tx(1082, y + 52, String(side.n), "lab huge gold", "middle"), 1082, y + 42, side.num);
    if (side.blocks > 0)
      out += MK.pill(88, y + 132, side.ids.length + " blocks", side.blocks,
        { size: 24, col: col ? P.gold : P.muted, ink: col ? P.gold : P.muted });
    return out;
  }

  function prSameJumps(scene, t) {
    var cLong = sc(scene, 0, "long"), cShort = sc(scene, 0, "short"), cSame = sc(scene, 0, "same");
    var cOut = sc(scene, 1, "output"), cThree = sc(scene, 1, "three");
    var cShorter = sc(scene, 2, "shorter"), cFix = sc(scene, 2, "fix");
    var still = PR_REPEAT_JUMP.map(function () { return PR_HOME; });
    var play = prPlay(t, cOut == null ? null : cOut + 0.3, PR_REPEAT_JUMP, still, 2.4);
    var num = popIn(t, cThree, 0.4), blocks = on(t, cShorter, 0.5), out = "";

    out += prSameBand(0, { tag: "A", ids: ["jump", "jump", "jump"], n: PR_REPEAT_JUMP.length,
      label: "jumps", num: num, blocks: blocks }, play, popIn(t, cLong, 0.5), null);
    out += prSameBand(1, { tag: "B", ids: ["repeat3", "jump"], n: PR_REPEAT_JUMP.length,
      label: "jumps", num: num, blocks: blocks }, play, popIn(t, cShort, 0.5),
      blocks > 0.5 ? P.gold : null);
    out += Tx(584, 238, "=", "lab huge gold", "middle", { opacity: Math.min(1, popIn(t, cSame, 0.45)) });
    out += MK.tick(672, 220, 22, popIn(t, cThree == null ? null : cThree + 0.3, 0.4));
    out += MK.tick(1090, 220, 22, popIn(t, cFix, 0.4));
    return out;
  }

  function prSameMoves(scene, t) {
    var cCareful = sc(scene, 3, "careful"), cProg = sc(scene, 3, "prog"), cTwo = sc(scene, 3, "two");
    var cMoves = sc(scene, 4, "moves"), cThree = sc(scene, 4, "three"), cCount = sc(scene, 4, "count");
    var o = popIn(t, cCareful, 0.5), out = "";
    var pA = prPlay(t, cProg == null ? null : cProg + 0.35, PR_R2_MOVES, PR_R2_AT, 1.2);
    var pB = prPlay(t, cMoves == null ? null : cMoves + 0.35, PR_R3_MOVES, PR_R3_AT, 1.6);

    out += prSameBand(0, { tag: "A", ids: ["repeat2", "right"], n: PR_R2_MOVES.length, lit: 1,
      label: "moves", num: popIn(t, cTwo, 0.4), blocks: 0 }, pA, o, null);
    out += prSameBand(1, { tag: "B", ids: PR_R3_MOVES, n: PR_R3_MOVES.length, lit: 1,
      label: "moves", num: popIn(t, cThree, 0.4), blocks: 0 }, pB, o, null);
    out += Tx(584, 238, "≠", "lab huge bad", "middle", { opacity: Math.min(1, popIn(t, cCount, 0.45)) });
    out += MK.cross(672, 220, 22, popIn(t, cCount == null ? null : cCount + 0.3, 0.4));
    return out;
  }

  function prSameChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(prSameJumps(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(prSameMoves(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: test as you go =================================================
     Ten blocks run once at the end, against the same ten run after every two.
     The blocks carry no words: this picture is about HOW MANY places a bug can
     hide, not about which instruction each one is. */

  var PR_T1 = { x: 125, w: 72, gap: 8, y: 56, h: 64, run: 988 };
  var PR_T2 = { x: 76, w: 64, gap: 8, pitch: 206, y: 264, h: 64 };
  function prPairX(p) { return PR_T2.x + p * PR_T2.pitch; }
  function prPairMark(p) { return prPairX(p) + PR_T2.w * 2 + PR_T2.gap + 34; }

  function prTestChapter(scene, beat, t, i) {
    var cTen = sc(scene, 0, "ten"), cWrong0 = sc(scene, 0, "wrong");
    var cAny = sc(scene, 1, "any"), cPlaces = sc(scene, 1, "places");
    var cTwo = sc(scene, 2, "two"), cCheck = sc(scene, 2, "check"), cMore = sc(scene, 2, "more");
    var cWrong = sc(scene, 3, "wrong"), cLast = sc(scene, 3, "last");
    var cReg = sc(scene, 4, "regularly"), cNew = sc(scene, 4, "newest");
    var out = "", T = PR_T1, B = PR_T2;

    /* ---- one run, right at the end ---- */
    var shown = tally(t, cTen, 10, 1.2), asked = tally(t, cAny, 10, 1.0);
    out += MK.pill(584, 32, "run once, at the end", on(t, cTen, 0.5), { size: 22, col: P.muted, ink: P.muted });
    for (var k = 0; k < 10; k++) {
      if (k >= shown) break;
      var x = T.x + k * (T.w + T.gap);
      out += prChipSmall(x, T.y, T.w, T.h, 1, prPast(t, cAny) ? P.bad : P.line);
      if (k < asked) out += MK.qmark(x + T.w / 2, T.y + T.h / 2, 24, 1);
    }
    out += prRunBtn(T.run, T.y + T.h / 2, 110, on(t, cTen, 0.5) * (shown >= 10 ? 1 : 0.35),
      prPast(t, cWrong0));
    out += MK.cross(1086, T.y + T.h / 2, 26, popIn(t, cWrong0, 0.4));
    out += MK.pill(584, 168, "ten places to look", popIn(t, cPlaces, 0.5), { size: 24, col: P.bad, ink: P.bad });
    out += L(80, 212, 1088, 212, P.line, 2, { "stroke-dasharray": "8 10" });

    /* ---- a run after every two ---- */
    var pairAt = [cTwo, cMore, cWrong, cReg, cReg == null ? null : cReg + 0.5];
    var markAt = [cCheck, cMore == null ? null : cMore + 0.5, cWrong == null ? null : cWrong + 0.5,
      cReg == null ? null : cReg + 0.4, cReg == null ? null : cReg + 0.9];
    out += MK.pill(584, 240, "run after every two", on(t, cTwo, 0.5), { size: 22, col: P.good, ink: P.good });
    for (var p = 0; p < 5; p++) {
      var o = popIn(t, pairAt[p], 0.45);
      if (!(o > 0)) continue;
      var newest = p === (prPast(t, cReg) ? 4 : 2);
      var faded = prPast(t, cLast) && !prPast(t, cReg) && p < 2 ? 0.55 : 1;
      var col = p === 2 && prPast(t, cWrong) && !prPast(t, cReg) ? P.bad : P.line;
      /* The fade that sends the already-tested pairs back is a group opacity,
         never the o passed to a chip: o is also its pop-in SCALE, so a dimmed
         pair was drawn at 55% of its size and read as having vanished. */
      var pair = "";
      for (var c = 0; c < 2; c++)
        pair += prChipSmall(prPairX(p) + c * (B.w + B.gap), B.y, B.w, B.h, o, col);
      /* the pair that failed shows the bug, and is put right when it is found */
      var failing = p === 2 && prPast(t, cWrong) && !prPast(t, cReg);
      if (failing) {
        pair += MK.cross(prPairMark(p), B.y + B.h / 2, 24, popIn(t, markAt[p], 0.4));
        pair += MK.pop(Em(prPairX(p) + B.w + B.gap + B.w / 2, B.y + B.h / 2, 48, "\u{1F41B}"),
          prPairX(p) + B.w + B.gap + B.w / 2, B.y + B.h / 2, popIn(t, cWrong, 0.4));
      } else {
        pair += MK.tick(prPairMark(p), B.y + B.h / 2, 24,
          popIn(t, p === 2 ? cReg : markAt[p], 0.4) * (bump(t, cNew == null ? null : cNew + p * 0.16, 0.5) > 0 ? 1.08 : 1));
      }
      out += faded < 1 ? G(pair, { opacity: faded }) : pair;
      if (newest && (prPast(t, cLast) || prPast(t, cNew)))
        out += G(R(prPairX(p) - 8, B.y - 10, B.w * 2 + B.gap + 16, B.h + 20, 14, "none", P.gold, 4),
          { opacity: on(t, prPast(t, cReg) ? cNew : cLast, 0.45) });
    }
    out += MK.pill(584, 396, "the newest two", popIn(t, cLast, 0.5), { size: 24, col: P.gold, ink: P.gold });
    return svg(out);
  }
