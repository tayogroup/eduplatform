  /* ==== Secret Codes, part 3: the two names, the weakness, the recap ============
     tools/lib/film-scenes/computing-g3/secret-codes-3.js. See the header of
     secret-codes.js. */

  /* ==== chapter: plain text and ciphertext ========================================
     The lesson's own sentence drawn as a line: plain text, the rule,
     ciphertext, the rule again, plain text. The word is hat, which the
     lesson's birthday-surprise step sends as 8 1 20; the code on the card is
     asked of the rule. */
  var SEC_PIPE = { y: 232, cardW: 194, cardH: 88, ruleW: 164, ruleH: 74 };
  var SEC_SLOT = [150, 380, 610, 840, 1064];

  function secNamesChapter(scene, beat, t, i) {
    var cTwo = sc(scene, 0, "two"), cName = sc(scene, 0, "name");
    var cBefore = sc(scene, 1, "before"), cPlain = sc(scene, 1, "plain");
    var cRule = sc(scene, 2, "rule"), cCipher = sc(scene, 2, "cipher");
    var cHat = sc(scene, 3, "hat"), cCode = sc(scene, 3, "code"), cSame = sc(scene, 3, "same");
    var cOther = sc(scene, 4, "other"), cBack = sc(scene, 4, "back");
    var out = "", y = SEC_PIPE.y, W = SEC_PIPE.cardW, H = SEC_PIPE.cardH;
    var plain = "hat", code = secCode(plain).join(" ");

    /* the two forms, as two empty cards first */
    var box1 = popIn(t, cTwo, 0.45), box2 = popIn(t, cTwo == null ? null : cTwo + 0.3, 0.45);
    out += secCard(SEC_SLOT[0], y, W, H, secPast(t, cBefore) ? plain : null,
      secPast(t, cPlain) ? "plain text" : null,
      { o: box1, col: secPast(t, cPlain) ? P.teal : null, labCol: secPast(t, cPlain) ? P.teal : P.muted });
    out += secCard(SEC_SLOT[2], y, W, H, secPast(t, cCipher) ? code : null,
      secPast(t, cCipher) ? "ciphertext" : null,
      { o: box2, col: secPast(t, cCipher) ? P.gold : null, ink: secPast(t, cCipher) ? P.gold : null,
        labCol: secPast(t, cCipher) ? P.gold : P.muted });
    /* each one has its own name: a question mark over each label until it has one */
    var asking = on(t, cName, 0.45) * (1 - on(t, cPlain, 0.45));
    out += MK.qmark(SEC_SLOT[0], y - H / 2 - 22, 19, asking);
    out += MK.qmark(SEC_SLOT[2], y - H / 2 - 22, 19, asking * (1 - on(t, cCipher, 0.45)));

    /* the emoji the lesson's own word cards carry */
    out += MK.pop(Em(SEC_SLOT[0], y + H / 2 + 34, 44, "\u{1F4C4}"), SEC_SLOT[0], y + H / 2 + 34, popIn(t, cPlain, 0.4));
    out += MK.pop(Em(SEC_SLOT[2], y + H / 2 + 34, 44, "\u{1F510}"), SEC_SLOT[2], y + H / 2 + 34, popIn(t, cCipher, 0.4));

    /* the rule, applied once and then the other way */
    out += MK.arrow(SEC_SLOT[0] + W / 2 + 8, y, SEC_SLOT[1] - SEC_PIPE.ruleW / 2 - 8, y, on(t, cRule, 0.5), P.muted, 7);
    out += secRuleBox(SEC_SLOT[1], y, SEC_PIPE.ruleW, SEC_PIPE.ruleH, popIn(t, cRule, 0.45), P.gold);
    out += MK.arrow(SEC_SLOT[1] + SEC_PIPE.ruleW / 2 + 8, y, SEC_SLOT[2] - W / 2 - 8, y, on(t, cCipher, 0.5), P.muted, 7);

    out += MK.arrow(SEC_SLOT[2] + W / 2 + 8, y, SEC_SLOT[3] - SEC_PIPE.ruleW / 2 - 8, y, on(t, cOther, 0.5), P.muted, 7);
    out += secRuleBox(SEC_SLOT[3], y, SEC_PIPE.ruleW, SEC_PIPE.ruleH, popIn(t, cOther, 0.45), P.gold);
    out += MK.arrow(SEC_SLOT[3] + SEC_PIPE.ruleW / 2 + 8, y, SEC_SLOT[4] - W / 2 - 8, y, on(t, cBack, 0.5), P.muted, 7);
    out += secCard(SEC_SLOT[4], y, W, H, plain, "plain text", popIn(t, cBack, 0.45) > 0
      ? { o: popIn(t, cBack, 0.45), col: P.good, labCol: P.good } : { o: 0 });
    /* the badge's own radius (up to 1.1x on its pop-in overshoot) must clear
       1168 from its centre; the card's right edge (SEC_SLOT[4] + W/2) is
       already only 7px from it, so the tick sits inside the corner rather
       than on it. */
    out += MK.tick(SEC_SLOT[4] + W / 2 - 24, y - H / 2 - 4, 20, popIn(t, cBack == null ? null : cBack + 0.5, 0.4));

    /* it is the same message, twice over */
    var r1 = bump(t, cHat, 1.3), r2 = bump(t, cCode, 1.3);
    if (r1 > 0.02) out += R(SEC_SLOT[0] - W / 2 - 7, y - H / 2 - 7, W + 14, H + 14, 20, "none", P.teal, 4, { opacity: r1 });
    if (r2 > 0.02) out += R(SEC_SLOT[2] - W / 2 - 7, y - H / 2 - 7, W + 14, H + 14, 20, "none", P.gold, 4, { opacity: r2 });
    var sm = on(t, cSame, 0.45);
    if (sm > 0.02) {
      out += Pth("M" + SEC_SLOT[0] + "," + (y + H / 2 + 62) + " L" + SEC_SLOT[0] + "," + (y + H / 2 + 80) +
        " L" + SEC_SLOT[2] + "," + (y + H / 2 + 80) + " L" + SEC_SLOT[2] + "," + (y + H / 2 + 62),
        null, P.teal, 3, { opacity: sm });
      out += MK.pill(380, y + H / 2 + 80, "the same message", sm, { size: 23, col: P.teal, ink: P.teal });
    }
    return svg(out);
  }

  /* ==== chapter: why this cipher can be broken ====================================
     A longer coded message, made of two of the lesson's own decode answers and
     enciphered by the lesson's own rule. Its numbers are counted on screen:
     the one that turns up most really is 5, and 5 really is e - both asked of
     the rule rather than asserted here. */
  var SEC_MSG_WORDS = ["secret", "code"];
  var SEC_MSG = (function () {
    var nums = [], groups = [], at = 0;
    SEC_MSG_WORDS.forEach(function (w) {
      var c = secCode(w);
      groups.push({ from: at, to: at + c.length });
      nums = nums.concat(c);
      at += c.length;
    });
    /* which number turns up most, counted rather than claimed */
    var freq = {}, top = null;
    nums.forEach(function (n) { freq[n] = (freq[n] || 0) + 1; });
    Object.keys(freq).forEach(function (n) { if (!top || freq[n] > freq[top]) top = n; });
    var hits = [];
    nums.forEach(function (n, k) { if (String(n) === String(top)) hits.push(k); });
    return { nums: nums, groups: groups, top: Number(top), count: freq[top], hits: hits,
      letter: secDecode([Number(top)]) };
  })();
  var SEC_TILE = { w: 72, h: 68, gap: 12, groupGap: 34, y: 172 };

  function secMsgX(k) {
    var x = 0, g;
    for (g = 0; g < SEC_MSG.groups.length; g++) {
      if (k >= SEC_MSG.groups[g].to) x += SEC_TILE.groupGap;
      else break;
    }
    var total = SEC_MSG.nums.length * SEC_TILE.w + (SEC_MSG.nums.length - 1) * SEC_TILE.gap +
      (SEC_MSG.groups.length - 1) * SEC_TILE.groupGap;
    return (1168 - total) / 2 + x + k * (SEC_TILE.w + SEC_TILE.gap) + SEC_TILE.w / 2;
  }

  function secBreakChapter(scene, beat, t, i) {
    var cSame = sc(scene, 0, "same"), cEasy = sc(scene, 0, "easy");
    var cWeak = sc(scene, 1, "weakness"), cCount = sc(scene, 1, "count");
    var cMost = sc(scene, 2, "most"), cE = sc(scene, 2, "e"), cEng = sc(scene, 2, "english");
    var cStart = sc(scene, 3, "start"), cRest = sc(scene, 3, "rest"), cNever = sc(scene, 3, "never");
    var out = "", n = SEC_MSG.nums.length;

    var shown = tally(t, cSame, n, 1.1);
    var swept = tally(t, cCount, n, 1.7);
    var found = 0, k;
    for (k = 0; k < swept; k++) if (String(SEC_MSG.nums[k]) === String(SEC_MSG.top)) found++;

    /* the coded message */
    for (k = 0; k < n; k++) {
      if (k >= shown) break;
      var cx = secMsgX(k), isTop = String(SEC_MSG.nums[k]) === String(SEC_MSG.top);
      var seen = k < swept, hot = isTop && seen;
      out += secTile(cx, SEC_TILE.y, SEC_TILE.w, SEC_TILE.h, SEC_MSG.nums[k],
        { o: on(t, cSame == null ? null : cSame + k * 0.08, 0.35),
          col: hot ? P.gold : seen ? P.teal : null,
          ink: hot ? P.gold : P.ink, fs: 34 });
      /* the letter, once somebody has worked it out */
      var letterAt = isTop ? cStart : (cRest == null ? null : cRest + 0.35 + k * 0.1);
      var lp = popIn(t, letterAt, 0.38);
      if (lp > 0)
        out += secTile(cx, SEC_TILE.y + 82, SEC_TILE.w - 10, SEC_TILE.h - 10, secDecode([SEC_MSG.nums[k]]),
          { o: lp, col: isTop ? P.gold : P.good, ink: isTop ? P.gold : P.good, fs: 34 });
    }
    /* the sweep that does the counting */
    if (swept > 0 && swept < n + 1 && on(t, cCount, 0.3) > 0 && !secPast(t, cMost))
      out += MK.finger(secMsgX(Math.min(swept, n) - 1), SEC_TILE.y + 44, on(t, cCount, 0.3));

    /* "it is also its weakness": the message flashes as one thing to attack */
    var wb = bump(t, cWeak, 1.5);
    if (wb > 0.02)
      out += R(secMsgX(0) - SEC_TILE.w / 2 - 10, SEC_TILE.y - SEC_TILE.h / 2 - 10,
        secMsgX(n - 1) - secMsgX(0) + SEC_TILE.w + 20, SEC_TILE.h + 20, 16, "none", P.bad, 4, { opacity: wb });

    /* the count, and what the commonest number must be */
    var cardO = on(t, cCount, 0.5);
    if (cardO > 0.02) {
      var cxC = 466, cyC = 348;
      out += G(R(cxC - 150, cyC - 44, 300, 88, 18, P.card, secPast(t, cMost) ? P.gold : P.line,
        secPast(t, cMost) ? 3.5 : 2), { opacity: cardO });
      out += secTile(cxC - 100, cyC, 68, 64, SEC_MSG.top, { o: cardO, col: P.gold, ink: P.gold, fs: 32 });
      for (k = 0; k < SEC_MSG.count; k++)
        out += C(cxC - 26 + k * 40, cyC, 15, k < found ? P.gold : P.cell, P.line, 2, { opacity: cardO });
      out += Tx(cxC + 110, cyC + 10, String(found), "lab", "middle", { "font-size": 34, fill: P.gold, opacity: cardO });
    }
    /* so it is e, the commonest letter in English */
    var ep = popIn(t, cE, 0.45);
    out += MK.arrow(626, 348, 676, 348, on(t, cMost, 0.5), P.gold, 7);
    out += secTile(730, 348, 78, 78, SEC_MSG.letter, { o: ep, col: P.gold, ink: P.gold, fs: 44 });
    out += MK.pill(584, secPillY(22), "e is the commonest letter in English", on(t, cEng, 0.45),
      { size: 22, col: P.gold, ink: P.gold });

    /* and they never needed the key */
    var nv = popIn(t, cNever, 0.45);
    out += MK.pop(Em(1016, 348, 60, "\u{1F511}"), 1016, 348, nv);
    out += MK.cross(1016, 348, 36, popIn(t, cNever == null ? null : cNever + 0.4, 0.4));
    out += MK.tick(1016, 60, 26, popIn(t, cEasy, 0.4) * (1 - on(t, cWeak, 0.5)));
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------------
     The lesson's own six words, with the lesson's own emoji for each, and the
     two worked examples read back out of the rule. */
  var SEC_RECAP = MK.recapKind([
    { beat: 0, at: "cipher", title: "Cipher", sub: "a rule for changing a message", pic: "\u{1F512}" },
    { beat: 0, at: "key", title: "Key", sub: "the rule that reads it back", pic: "\u{1F511}" },
    { beat: 1, at: "encode", title: "Encode", sub: "cat becomes " + secCode("cat").join(" "), pic: "✏️" },
    { beat: 1, at: "decode", title: "Decode", sub: secCode("hi").join(" ") + " becomes hi", pic: "\u{1F513}" },
    { beat: 2, at: "plain", title: "Plain text", sub: "the words as you read them", pic: "\u{1F4C4}" },
    { beat: 2, at: "ciphertext", title: "Ciphertext", sub: "the message after the rule", pic: "\u{1F510}" }
  ], { goBeat: 2, goAt: "nonsense" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Why a message travels in code", "The code where 1 is a and 2 is b", "How to write one, and how to read one"] }),
    why: secWhyChapter, code: secCodeChapter, write: secWriteChapter,
    read: secReadChapter, names: secNamesChapter, "break": secBreakChapter,
    recap: SEC_RECAP
  };
