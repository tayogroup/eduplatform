  /* ==== Secret Codes, part 2: the code strip, writing, reading ==================
     tools/lib/film-scenes/computing-g3/secret-codes-2.js. See the header of
     secret-codes.js. Every letter and every number below is asked of the
     lesson's own rule (SEC_NUM, secCode, secDecode), so nothing here can
     disagree with the strip the child is about to use. */

  /* the strip, big, in the chapter that teaches it */
  var SEC_BIG = { x: 20, y: 160, w: 1128, h: 120, gap: 3 };
  /* and small, at the top of the two chapters that use it */
  var SEC_TOP = { x: 20, y: 22, w: 1128, h: 96, gap: 3 };

  /* a pill's box is size*1.8 tall, so a fixed y=424 overhangs the 440 floor
     for the bigger sizes (32 lands at 452.8). y here keeps a 6px margin at
     every size instead: 434 - size*0.9 puts the pill's own bottom at 434. */
  function secPillY(size) { return 434 - size * 0.9; }

  /* only the letter being named is lit; the one before it fades as it goes */
  function secLitOne(t, at, next) {
    return on(t, at, 0.3) * (next == null ? 1 : 1 - 0.72 * on(t, next, 0.3));
  }

  /* ==== chapter: the 1 = a code ===================================================
     The strip is built letter by letter, then every letter is given its
     number, and the film stops on the one the lesson says children slip on. */
  function secCodeChapter(scene, beat, t, i) {
    var cAlpha = sc(scene, 0, "alphabet"), cLetters = sc(scene, 0, "letters");
    var cGive = sc(scene, 1, "give"), cA = sc(scene, 1, "a"), cB = sc(scene, 1, "b"), cC = sc(scene, 1, "c");
    var cCount = sc(scene, 2, "counting"), cZ = sc(scene, 2, "z");
    var cJ = sc(scene, 3, "j"), cStrip = sc(scene, 3, "strip");
    var cRule = sc(scene, 4, "rule"), cKey = sc(scene, 4, "key");
    var out = "", box = SEC_BIG, lit = {}, nums = {}, k;

    /* which cells are there at all */
    var shown = Math.max(tally(t, cAlpha, 26, 1.2), secPast(t, cLetters) ? 26 : 0);

    /* which numbers have arrived */
    for (k = 0; k < 26; k++) nums[k] = 0;
    if (secPast(t, cA)) nums[0] = on(t, cA, 0.3);
    if (secPast(t, cB)) nums[1] = on(t, cB, 0.3);
    if (secPast(t, cC)) nums[2] = on(t, cC, 0.3);
    var fill = tally(t, cCount, 23, 1.5);
    for (k = 0; k < fill; k++) { nums[k + 3] = 1; nums[0] = nums[1] = nums[2] = 1; }

    /* which cell is being pointed at */
    lit[0] = secLitOne(t, cA, cB);
    lit[1] = secLitOne(t, cB, cC);
    lit[2] = secLitOne(t, cC, cCount);
    lit[25] = Math.max(lit[25] || 0, secLitOne(t, cZ, cJ));
    /* counting along to j, the step the lesson warns about */
    var count = tally(t, cStrip, 10, 1.3), jLit = secLitOne(t, cJ, cStrip);
    for (k = 0; k < count; k++) lit[k] = Math.max(lit[k] || 0, k === count - 1 ? 1 : 0.34);
    lit[9] = Math.max(lit[9] || 0, jLit, count >= 10 ? 1 : 0);

    out += secStrip(box, { shown: shown, lit: lit, num: nums, o: on(t, cAlpha, 0.5) });

    /* how long the alphabet is */
    out += MK.pill(584, 104, "26 letters", on(t, cLetters, 0.45), { size: 26, col: P.teal, ink: P.teal });
    /* "give every letter its number": a label under the strip while it happens */
    var giving = on(t, cGive, 0.45) * (1 - on(t, cJ, 0.45));
    out += MK.pill(584, 330, "every letter gets its number", giving, { size: 24, col: P.line });

    /* z is the last one */
    out += MK.leader(secCellCx(box, 25), 142, secCellCx(box, 25), box.y - 4, on(t, cZ, 0.4), P.gold);

    /* the slip the lesson names: j is 10, not 9 */
    var jGone = 1 - into(t, scene.first + 4);
    var jp = popIn(t, cJ, 0.45) * jGone;
    out += MK.leader(secCellCx(box, 9), 360, secCellCx(box, 9), box.y + box.h + 6, Math.min(1, jp), P.gold);
    out += MK.pill(584, 392, "j is 10, not 9", jp, { size: 28, col: P.gold, ink: P.gold });
    /* the finger counting along the strip, a to j */
    if (count > 0 && jGone > 0.02)
      out += MK.finger(secCellCx(box, Math.min(count, 10) - 1), box.y + box.h + 8, jGone);

    /* the rule is the key */
    out += secRuleBox(584, 378, 230, 74, popIn(t, cRule, 0.45), P.gold);
    out += MK.glow(584, 378, 58, P.gold, on(t, cKey, 0.5) * 0.9);
    return svg(out);
  }

  /* ==== letters, numbers and the strip above them ================================
     The shared layout of the two working chapters: the strip at the top, a row
     of columns under it, and a leader from each column to its cell. */
  var SEC_COL = { letterY: 226, letterW: 96, letterH: 96, numY: 358, numW: 118, numH: 86 };
  function secColX(n, k) { var pitch = n <= 3 ? 150 : n <= 4 ? 170 : 150; return 584 + (k - (n - 1) / 2) * pitch; }

  /* one column: the letter, the number under it, and the line up to the strip */
  function secColumn(n, k, letter, number, t, o, opt) {
    opt = opt || {};
    var cx = secColX(n, k), out = "";
    var lo = opt.letterO == null ? o : opt.letterO, no = opt.numO == null ? 0 : opt.numO;
    out += secTile(cx, SEC_COL.letterY, SEC_COL.letterW, SEC_COL.letterH, letter,
      { o: lo, col: opt.letterCol, ink: opt.letterInk });
    if (no > 0)
      out += secTile(cx, SEC_COL.numY, SEC_COL.numW, SEC_COL.numH, number,
        { o: no, col: opt.numCol || P.gold, ink: opt.numInk || P.gold, fs: 40 });
    else if (opt.slot > 0)
      out += G(R(cx - SEC_COL.numW / 2, SEC_COL.numY - SEC_COL.numH / 2, SEC_COL.numW, SEC_COL.numH, 17,
        P.card, P.line, 2, { "stroke-dasharray": "9 7" }), { opacity: clamp(opt.slot, 0, 1) });
    return out;
  }

  /* ==== chapter: writing in code ==================================================
     cat, one letter at a time, each looked up on the strip; then bee, where
     the same letter comes out the same number twice. */
  function secWordView(scene, t, word, cues, opt) {
    opt = opt || {};
    var box = SEC_TOP, letters = String(word).split(""), nums = secCode(word), n = letters.length;
    var lit = {}, out = "", k;
    letters.forEach(function (ch, j) {
      var at = cues[j];
      if (at == null) return;
      var idx = secAt(ch);
      lit[idx] = Math.max(lit[idx] || 0, on(t, at, 0.35));
    });
    out += secStrip(box, { lit: lit, o: opt.stripO == null ? 1 : opt.stripO });
    letters.forEach(function (ch, j) {
      var at = cues[j], cx = secColX(n, j), idx = secAt(ch);
      var hot = on(t, at, 0.35) * (j + 1 < n && cues[j + 1] != null ? 1 - 0.7 * on(t, cues[j + 1], 0.35) : 1);
      out += secColumn(n, j, ch, nums[j], t, opt.o == null ? 1 : opt.o, {
        letterCol: hot > 0.4 ? P.gold : null,
        numO: popIn(t, opt.numAt ? opt.numAt[j] : at, 0.4),
        slot: on(t, opt.slotAt, 0.45)
      });
      /* the line from the column up to its cell on the strip */
      out += MK.leader(cx, SEC_COL.letterY - SEC_COL.letterH / 2 - 8,
        secCellCx(box, idx), box.y + box.h + 6, on(t, at, 0.5), P.gold);
    });
    return out;
  }

  function secWriteCat(scene, t) {
    var cWrite = sc(scene, 0, "write"), cOne = sc(scene, 0, "one");
    var cCat = sc(scene, 1, "cat"), cFind = sc(scene, 1, "find"), cThree = sc(scene, 1, "three");
    var cA = sc(scene, 2, "a"), cT = sc(scene, 2, "t"), cCode = sc(scene, 2, "code");
    var cSame = sc(scene, 3, "same");
    var out = secWordView(scene, t, "cat", [cCat, cA, cT], {
      stripO: on(t, cWrite, 0.5),
      numAt: [cThree, cA, cT],
      slotAt: cOne
    });
    out += MK.pill(584, secPillY(30), secCode("cat").join(" "), on(t, cCode, 0.45), { size: 30, col: P.good, ink: P.good });
    /* "find c on the strip": the cell it is found in, ringed once */
    var f = on(t, cFind, 0.5) * (1 - on(t, cA, 0.4));
    if (f > 0.02)
      out += R(secCellX(SEC_TOP, secAt("c")) - 4, SEC_TOP.y - 4, secCellW(SEC_TOP) + 8, SEC_TOP.h + 8, 11,
        "none", P.gold, 4, { opacity: f });
    /* the same letter is always the same number */
    out += MK.pill(584, 148, "always the same number", on(t, cSame, 0.45), { size: 24, col: P.teal, ink: P.teal });
    return out;
  }

  function secWriteBee(scene, t) {
    var cBee = sc(scene, 4, "bee"), cTwice = sc(scene, 4, "twice");
    var box = SEC_TOP, word = "bee", nums = secCode(word), out = "", lit = {};
    lit[secAt("b")] = on(t, cBee, 0.4);
    lit[secAt("e")] = Math.max(on(t, cBee, 0.4), on(t, cTwice, 0.4));
    out += secStrip(box, { lit: lit });
    word.split("").forEach(function (ch, j) {
      var cx = secColX(3, j), idx = secAt(ch);
      var hot = ch === "e" ? on(t, cTwice, 0.4) : 0;
      out += secColumn(3, j, ch, nums[j], t, 1, {
        letterCol: hot > 0.3 ? P.gold : null,
        numCol: hot > 0.3 ? P.gold : P.gold,
        numO: popIn(t, cBee == null ? null : cBee + 0.18 + j * 0.2, 0.38)
      });
      out += MK.leader(cx, SEC_COL.letterY - SEC_COL.letterH / 2 - 8,
        secCellCx(box, idx), box.y + box.h + 6, on(t, cBee == null ? null : cBee + j * 0.12, 0.45),
        ch === "e" ? P.gold : P.muted);
    });
    out += MK.pill(584, secPillY(28), nums.join(" ") + " - the e is " + nums[1] + " twice",
      on(t, cTwice, 0.45), { size: 28, col: P.good, ink: P.good });
    return out;
  }

  function secWriteChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(secWriteCat(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(secWriteBee(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: reading code =====================================================
     The other way round: numbers on top, the strip searched for each one, and
     the letter arriving underneath. 8 9, then a longer one, then the same two
     numbers with nobody holding the key. */
  function secReadRow(scene, t, nums, cues, opt) {
    opt = opt || {};
    var box = SEC_TOP, n = nums.length, out = "", lit = {};
    nums.forEach(function (v, j) {
      var idx = v - 1;
      lit[idx] = Math.max(lit[idx] || 0, on(t, cues[j], 0.35));
    });
    out += secStrip(box, { lit: lit, o: opt.stripO == null ? 1 : opt.stripO });
    nums.forEach(function (v, j) {
      var cx = secColX(n, j), idx = v - 1, letter = secDecode([v]);
      var lo = opt.letterAt ? popIn(t, opt.letterAt[j], 0.4) : 0;
      /* the number, where the letter sat in the writing chapter */
      out += secTile(cx, SEC_COL.letterY, SEC_COL.numW, SEC_COL.letterH, v,
        { o: opt.numO == null ? 1 : opt.numO, col: on(t, cues[j], 0.35) > 0.4 ? P.gold : null,
          ink: opt.numInk || P.gold, fs: 42 });
      if (lo > 0)
        out += secTile(cx, SEC_COL.numY, SEC_COL.letterW, SEC_COL.numH, letter,
          { o: lo, col: P.good, ink: P.good, fs: 44 });
      out += MK.leader(cx, SEC_COL.letterY - SEC_COL.letterH / 2 - 8,
        secCellCx(box, idx), box.y + box.h + 6, on(t, cues[j], 0.5), P.gold);
    });
    return out;
  }

  function secReadHi(scene, t) {
    var cDec = sc(scene, 0, "decoding"), cNums = sc(scene, 0, "numbers");
    var cEight = sc(scene, 1, "eight"), cH = sc(scene, 1, "h");
    var cNine = sc(scene, 2, "nine"), cI = sc(scene, 2, "i"), cHi = sc(scene, 2, "hi");
    var code = secCode("hi");
    var out = secReadRow(scene, t, code, [cEight, cNine], {
      stripO: on(t, cDec, 0.5), numO: on(t, cNums, 0.45), letterAt: [cH, cI]
    });
    out += MK.pill(584, secPillY(32), secDecode(code), on(t, cHi, 0.45), { size: 32, col: P.good, ink: P.good });
    out += MK.pill(160, 148, "decode", on(t, cDec, 0.45), { size: 24, col: P.teal, ink: P.teal });
    return out;
  }

  function secReadSecret(scene, t) {
    var cLong = sc(scene, 3, "longer"), cSecret = sc(scene, 3, "secret");
    var code = secCode("secret"), n = code.length;
    var arrive = [];
    for (var j = 0; j < n; j++) arrive.push(cLong == null ? null : cLong + 0.55 + j * 0.2);
    var out = secReadRow(scene, t, code, arrive, { letterAt: arrive.map(function (v) { return v == null ? null : v + 0.1; }) });
    out += MK.pill(584, secPillY(32), secDecode(code), on(t, cSecret, 0.45), { size: 32, col: P.good, ink: P.good });
    return out;
  }

  function secReadNoKey(scene, t) {
    var cWithout = sc(scene, 4, "without"), cJust = sc(scene, 4, "just");
    var code = secCode("hi"), box = SEC_TOP, out = "";
    /* the strip goes: without the key there is nothing to look the numbers up in */
    var gone = on(t, cWithout, 0.6);
    out += secStrip(box, { o: 1 - gone });
    out += MK.pop(Em(584, 70, 74, "\u{1F511}"), 584, 70, popIn(t, cWithout, 0.45));
    out += MK.cross(584, 70, 42, popIn(t, cWithout == null ? null : cWithout + 0.35, 0.45));
    code.forEach(function (v, j) {
      out += secTile(secColX(2, j), SEC_COL.letterY, SEC_COL.numW, SEC_COL.letterH, v,
        { o: 1, ink: P.muted, fs: 42 });
      out += MK.qmark(secColX(2, j), SEC_COL.numY, 40, on(t, cJust, 0.45));
    });
    out += MK.pill(584, secPillY(28), "just two numbers", on(t, cJust, 0.45), { size: 28, col: P.muted, ink: P.muted });
    return out;
  }

  function secReadChapter(scene, beat, t, i) {
    var u3 = into(t, scene.first + 3), u4 = into(t, scene.first + 4), out = "";
    if (u3 < 1) out += G(secReadHi(scene, t), { opacity: 1 - u3 });
    if (u3 > 0 && u4 < 1) out += G(secReadSecret(scene, t), { opacity: u3 * (1 - u4) });
    if (u4 > 0) out += G(secReadNoKey(scene, t), { opacity: u4 });
    return svg(out);
  }
