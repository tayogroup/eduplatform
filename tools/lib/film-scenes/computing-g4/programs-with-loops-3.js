  /* ==== Programs with Loops, part 3 ==========================================
     The two comment chapters. Every note in them is a comment the lesson
     itself writes - "reset the cat so every run starts the same", "one jump
     for each wall in the level", "give the player time to read the message",
     "the jump that gets repeated" - and the bad one is the lesson's own bad
     one: "jump" beside jump. */

  /* ==== chapter: comments =====================================================
     The lesson's commented program - go home, repeat 3 times, jump, say hello -
     with its four notes arriving one at a time beside the block each explains.
     On "the computer skips it" the notes fade and the reading line runs down
     the blocks alone; the people beside it are who the notes are for. */
  var PL_CM = { x: 80, w: 280, h: 64, y0: 76, gap: 16 };
  var PL_CN = { x: 400, w: 400 };
  var PL_CM_IDS = ["home", "repeat3", "jump", "say"];
  var PL_CM_NOTES = [
    "reset the cat so every run starts the same",
    "one jump for each wall in the level",
    "jump over the wall",
    "greet the player when the jumps are done"
  ];
  function plCmY(k) { return PL_CM.y0 + k * (PL_CM.h + PL_CM.gap); }

  function plCommentChapter(scene, beat, t, i) {
    var cNote = sc(scene, 0, "note"), cFor = sc(scene, 0, "forwhat");
    var cPeople = sc(scene, 1, "people"), cSkips = sc(scene, 1, "skips");
    var cHome = sc(scene, 2, "gohome"), cReset = sc(scene, 2, "reset");
    var cRep = sc(scene, 3, "rep"), cWall2 = sc(scene, 3, "wall");
    var cJust = sc(scene, 4, "justjump"), cWhy = sc(scene, 4, "why"), cWall = sc(scene, 4, "wall");
    var out = "", skip = on(t, cSkips, 0.5) * plSpan(t, scene, 1, 2);

    /* the program, with the block being explained rung. The notes arrive in
       the order the voice gives them - say hello first, then go home, the
       repeat, and the jump last - so each block is live from its own cue
       until the next block's. */
    var ringAt = [cHome, cRep, cJust, cNote];
    var liveTo = [cRep, cJust, null, cHome];
    var leadAt = [cReset, cWall2, cWall, cFor];
    for (var k = 0; k < 4; k++) {
      var live = plPast(t, ringAt[k]) && (liveTo[k] == null || !plPast(t, liveTo[k]));
      out += plBlock(PL_CM.x, plCmY(k), PL_CM.w, PL_CM.h, PL_CM_IDS[k],
        { o: 1, col: k === 2 && plPast(t, cJust) && !plPast(t, cWhy) ? P.bad : (live ? P.gold : null) });
    }

    /* what the computer reads: the blocks, and not one word of the notes */
    if (skip > 0.01) {
      out += G(L(62, plCmY(0) + 4, 62, plCmY(3) + PL_CM.h - 4, P.gold, 4, { "stroke-dasharray": "8 10" }) +
        Pth("M52," + n2(plCmY(3) + PL_CM.h - 18) + " L62," + n2(plCmY(3) + PL_CM.h - 2) +
          " L72," + n2(plCmY(3) + PL_CM.h - 18) + " Z", P.gold, P.gold, 2), { opacity: skip });
    }

    /* the notes, each beside its own block */
    var noteO = [popIn(t, cHome, 0.45), popIn(t, cRep, 0.45), 0, popIn(t, cNote, 0.45)];
    var bad = popIn(t, cJust, 0.45) * (1 - on(t, cWhy, 0.45));
    noteO[2] = popIn(t, cWhy, 0.45);
    for (var n = 0; n < 4; n++) {
      var y = plCmY(n), cy = y + PL_CM.h / 2, o = noteO[n] * (1 - 0.55 * skip);
      if (n === 2 && bad > 0) {
        out += plNote(PL_CN.x, y, 210, PL_CM.h, "jump", bad * (1 - 0.55 * skip), { col: P.bad, size: 21 });
        out += MK.cross(650, cy, 24, bad);
      }
      if (!(o > 0)) continue;
      out += plNote(PL_CN.x, y, PL_CN.w, PL_CM.h, PL_CM_NOTES[n], o, { per: 25, size: 19 });
      out += MK.leader(PL_CM.x + PL_CM.w + 6, cy, PL_CN.x - 8, cy, on(t, leadAt[n], 0.4) * (1 - 0.55 * skip), P.gold);
      out += MK.tick(830, cy, 22, popIn(t, leadAt[n], 0.4) * (1 - skip));
    }

    /* who the notes are written for, and what skips them */
    var who = popIn(t, cPeople, 0.45);
    out += MK.pop(Em(900, 130, 66, "\u{1F9D2}"), 900, 130, who);
    out += MK.pop(Em(992, 130, 66, "\u{1F9D2}"), 992, 130, who * 0.9);
    var lap = on(t, cSkips, 0.5);
    if (lap > 0.01) out += G(ART.place(ART.figure("laptop"), 860, 196, 260, 194), { opacity: lap });
    return svg(out);
  }

  /* ==== chapter: why comments help ============================================
     Three pictures: the wait block you will not remember next week and the
     note that remembers for you; the partner who reads it without asking; and
     the comment that disagrees with its block, which is a bug. */
  function plWhyRemember(scene, t) {
    var cNext = sc(scene, 0, "next"), cForgot = sc(scene, 0, "forgotten");
    var cRem = sc(scene, 1, "remembers"), cGive = sc(scene, 1, "give");
    var out = "", note = popIn(t, cRem, 0.45), good = popIn(t, cGive, 0.45);

    out += plBlock(120, 168, 300, 72, "say", { o: 1 });
    out += plBlock(120, 262, 300, 72, "wait", { o: 1, col: plPast(t, cForgot) ? P.gold : null });
    out += plNote(480, 262, 400, 72, "give the player time to read the message", note, { per: 24, size: 20 });
    out += MK.leader(428, 298, 472, 298, on(t, cRem, 0.4), P.gold);
    out += MK.pop(Em(1042, 128, 62, "\u{1F4C5}"), 1042, 128, popIn(t, cNext, 0.45));
    out += MK.pill(1042, 196, "next week", on(t, cNext, 0.45), { size: 20, col: P.gold, ink: P.gold });
    out += MK.pop(Em(1042, 330, 84, "\u{1F9D2}"), 1042, 330, popIn(t, cForgot, 0.45));
    out += MK.qmark(944, 262, 38, on(t, cForgot, 0.45) * (1 - on(t, cGive, 0.45)));
    out += MK.tick(944, 262, 38, good);
    return out;
  }

  var PL_WP = { x: 110, w: 270, h: 52, y0: 110, gap: 10 };
  var PL_WP_NOTES = ["reset the cat", "one jump for each wall", "the jump that gets repeated", "greet the player"];
  function plWhyPartner(scene, t) {
    var cPartner = sc(scene, 2, "partner"), cUnd = sc(scene, 2, "understands");
    var out = "", who = popIn(t, cPartner, 0.45), und = on(t, cUnd, 0.5);
    for (var k = 0; k < 4; k++) {
      var y = PL_WP.y0 + k * (PL_WP.h + PL_WP.gap);
      out += plBlock(PL_WP.x, y, PL_WP.w, PL_WP.h, PL_CM_IDS[k], { o: 1 });
      out += plNote(400, y, 340, PL_WP.h, PL_WP_NOTES[k], 1, { per: 24, size: 17, col: und > 0.4 ? P.good : null });
    }
    out += MK.pop(Em(900, 210, 80, "\u{1F9D2}"), 900, 210, who);
    out += MK.pop(Em(1000, 210, 80, "\u{1F9D2}"), 1000, 210, who * 0.9);
    out += MK.leader(880, 290, 760, 290, und, P.good);
    out += MK.tick(950, 348, 30, popIn(t, cUnd, 0.45));
    return out;
  }

  function plWhyBug(scene, t) {
    var cSays = sc(scene, 3, "says"), cBlock = sc(scene, 3, "block"),
      cBug = sc(scene, 3, "bug"), cFound = sc(scene, 3, "found");
    var out = "", said = popIn(t, cSays, 0.45), blk = popIn(t, cBlock, 0.45), bug = popIn(t, cBug, 0.45);
    var col = plPast(t, cFound) ? P.bad : P.gold;
    out += plNote(100, 116, 470, 92, "jump three times", said, { per: 22, size: 23 });
    out += plBlock(690, 120, 320, 84, "repeat2", { o: blk, col: plPast(t, cFound) ? P.bad : null });
    out += L(335, 214, 335, 236, col, 3, { opacity: Math.min(1, said), "stroke-dasharray": "6 6" });
    out += L(850, 214, 850, 236, col, 3, { opacity: Math.min(1, blk), "stroke-dasharray": "6 6" });
    out += MK.pop(C(335, 282, 46, "rgba(244,201,93,0.20)", col, 4) +
      Tx(335, 298, "3", "lab", "middle", { "font-size": 48, fill: col }), 335, 282, said);
    out += MK.pop(C(850, 282, 46, "rgba(244,201,93,0.20)", col, 4) +
      Tx(850, 298, "2", "lab", "middle", { "font-size": 48, fill: col }), 850, 282, blk);
    out += MK.pop(Tx(592, 302, "≠", "lab", "middle", { "font-size": 60, fill: col }), 592, 282, blk);
    /* The box ends at 440 and an emoji's ink runs past its own box: --sweep
       found this one 2 px out at 84 px sitting on y = 388. */
    out += MK.pop(Em(592, 372, 80, "\u{1F41B}"), 592, 372, bug);
    out += MK.cross(1068, 162, 28, popIn(t, cFound, 0.45));
    return out;
  }

  function plWhyChapter(scene, beat, t, i) {
    var a = plSpan(t, scene, 0, 2), b = plSpan(t, scene, 2, 3), c = plFrom(t, scene, 3), out = "";
    if (a > 0) out += G(plWhyRemember(scene, t), { opacity: a });
    if (b > 0) out += G(plWhyPartner(scene, t), { opacity: b });
    if (c > 0) out += G(plWhyBug(scene, t), { opacity: c });
    return svg(out);
  }
