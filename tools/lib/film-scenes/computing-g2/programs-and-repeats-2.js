  /* ==== Programs and Repeats, part 2: building one, and the repeat block ======
     tools/lib/film-scenes/computing-g2/programs-and-repeats-2.js. See the
     header of programs-and-repeats.js.

     Both chapters have the same shape: the program on the left, built out of
     the lesson's own blocks, and the cat on a stage on the right standing
     exactly where ART.run leaves it. Nothing here works out a position or a
     count for itself. */

  /* how far a run has got: which move is happening, how high the jump is, and
     where the sprite is between the state before and the state after - the two
     states both being the kit's */
  var PR_HOME = { x: 0, scale: 1 };
  function prPlay(t, at, moves, states, span) {
    if (at == null || t < at) return { done: 0, up: 0, x: PR_HOME.x, scale: PR_HOME.scale };
    var each = span / moves.length, i = Math.floor((t - at) / each);
    if (i >= moves.length) {
      var e = states[moves.length - 1];
      return { done: moves.length, up: 0, x: e.x, scale: e.scale };
    }
    var u = clamp(((t - at) - i * each) / (each * 0.78), 0, 1);
    var from = i === 0 ? PR_HOME : states[i - 1], to = states[i];
    return { done: i, up: moves[i] === "jump" ? Math.sin(Math.PI * u) : 0,
      x: lerp(from.x, to.x, ease(u)), scale: lerp(from.scale, to.scale, ease(u)) };
  }

  /* n dots that fill as the moves land, with the count beside them */
  function prCount(cx, cy, n, done, o, label) {
    if (!(o > 0)) return "";
    var r = 15, gap = 42, out = "", x0 = cx - (n - 1) * gap / 2;
    for (var k = 0; k < n; k++)
      out += C(x0 + k * gap, cy, r, k < done ? P.gold : P.card, k < done ? P.gold : P.line, 3);
    out += Tx(cx, cy + 56, label, "lab mid muted", "middle");
    return G(out, { opacity: Math.min(1, o) });
  }

  /* ==== chapter: build it and run it ============================================
     The lesson's own first round - jump, jump, move left - written in words,
     built block by block, then run. The cat finishes on square minus one
     because that is where the kit puts it. */

  var PR_BROW = [34, 130, 226], PR_BRH = 76;
  var PR_BPAN = { x: 36, w: 540 };
  var PR_BST = { cx: 870, y: 300, pitch: 74, size: 68 };

  function prBuildChapter(scene, beat, t, i) {
    var cWrite = sc(scene, 0, "write"), cBuild = sc(scene, 0, "build");
    var cEach = sc(scene, 1, "each"), cPlace = sc(scene, 1, "place"), cOrder = sc(scene, 1, "order");
    var cAlgo = sc(scene, 2, "algo"), cTwo = sc(scene, 2, "two"), cLeft = sc(scene, 2, "left");
    var cRun = sc(scene, 3, "run"), cOne = sc(scene, 3, "one");
    var cTest = sc(scene, 4, "test"), cDid = sc(scene, 4, "did");
    var out = "", P0 = PR_BPAN, S = PR_BST;
    var blockAt = [cTwo, cTwo == null ? null : cTwo + 0.45, cLeft];

    /* the stage, and the cat where the kit leaves it */
    out += R(596, 40, 552, 340, 20, P.card, P.line, 3);
    out += prGround(S.cx, S.y, S.pitch, 1);
    var play = prPlay(t, cRun == null ? null : cRun + 0.3, PR_BUILD, PR_BUILD_AT, 2.4);
    out += prCat(S.cx, S.y, S.pitch, play, play.up, S.size, 1);
    out += prCount(S.cx, 110, PR_BUILD.length, play.done, on(t, cRun, 0.5), "blocks done");

    /* the algorithm in words, the slot beside it, then the block */
    var words = tally(t, cWrite, 3, 0.9), slots = tally(t, cBuild, 3, 0.7);
    var step = tally(t, cEach, 3, 1.0), nums = tally(t, cOrder, 3, 0.7);
    PR_BUILD.forEach(function (id, k) {
      var y = PR_BROW[k], o = k < words ? 1 : 0;
      if (o <= 0) return;
      var live = step === k + 1 && !prPast(t, cAlgo);
      out += prNum(P0.x + 34, y + PR_BRH / 2, 23, k + 1, nums > k ? P.gold : P.muted, 1);
      var flash = bump(t, cAlgo == null ? null : cAlgo + k * 0.22, 0.7);
      out += Tx(P0.x + 70, y + PR_BRH / 2 + 11, ART.block(id).label, "lab big", "start",
        { fill: live || flash > 0.3 ? P.gold : P.ink });
      var bx = P0.x + 250, bw = 250, by = y + 6, bh = 64;
      var p = popIn(t, blockAt[k], 0.45);
      if (p > 0) out += prBlock(bx, by, bw, bh, id, { o: p, lit: play.done === k + 1, col: play.done === k + 1 ? P.gold : null });
      else if (k < slots) out += prSlot(bx, by, bw, bh, on(t, cBuild, 0.4));
      if (live) out += MK.arrow(P0.x + 214, y + PR_BRH / 2, P0.x + 242, y + PR_BRH / 2, on(t, cPlace, 0.5), P.gold, 6);
      if (play.done === k + 1) out += MK.ripple(bx + 30, by + bh / 2, t, cRun == null ? null : cRun + 0.3 + k * 0.8, P.gold);
      out += MK.tick(P0.x + 524, y + PR_BRH / 2, 22, popIn(t, cDid == null ? null : cDid + k * 0.26, 0.35));
    });

    /* Run, and then the check */
    out += prRunBtn(P0.x + 130, 372, 190, on(t, cRun, 0.4), prPast(t, cRun == null ? null : cRun + 0.15));
    out += MK.ripple(P0.x + 130, 372, t, cRun, P.good);
    var look = popIn(t, cTest, 0.45);
    if (look > 0) {
      out += MK.glow(1060, 108, 78, P.good, Math.min(1, look) * 0.8);
      out += MK.pop(Em(1060, 108, 66, "\u{1F50E}"), 1060, 108, look);
    }
    out += Tx(S.cx, 366, "one at a time", "lab mid muted", "middle", { opacity: on(t, cOne, 0.5) });
    return svg(out);
  }

  /* ==== chapter: the repeat block ===============================================
     Two blocks on the left and the cat on the right. Every jump the cat makes
     is one item of ART.program.expand, so the film cannot show a different
     number from the one the lesson runs: three with the repeat before the
     jump, one with it after. */

  var PR_RPAN = { x: 36, w: 470, cx: 271 };
  var PR_RCH = { x: 56, w: 430, h: 72, top: 96, bottom: 240 };
  var PR_RST = { cx: 830, y: 300, pitch: 74, size: 68 };

  function prRepeatMain(scene, t) {
    var cNew = sc(scene, 0, "new"), cRep = sc(scene, 0, "repeat");
    var cRepeats = sc(scene, 1, "repeats"), cAfter = sc(scene, 1, "after");
    var cSay = sc(scene, 2, "say"), cThree = sc(scene, 2, "three"), cTwo = sc(scene, 2, "two");
    var cBefore = sc(scene, 3, "before");
    var cPut = sc(scene, 4, "after"), cNeeds = sc(scene, 4, "needs");
    var C0 = PR_RCH, S = PR_RST, out = "";

    /* after the swap the jump is on top and the repeat below it */
    var sw = on(t, cPut, 0.7), swapped = prPast(t, cPut);
    var repY = lerp(C0.top, C0.bottom, sw), jumpY = lerp(C0.bottom, C0.top, sw);

    /* what the kit makes of the program as it stands */
    var moves = swapped ? PR_AFTER_JUMP : PR_REPEAT_JUMP;
    var runAt = swapped ? (cPut == null ? null : cPut + 0.95) : cSay;
    var span = swapped ? 0.9 : 2.0;
    var states = moves.map(function () { return PR_HOME; });   /* a jump moves nothing */
    var play = prPlay(t, runAt, moves, states, span);

    out += R(542, 40, 606, 340, 20, P.card, P.line, 3);
    out += prGround(S.cx, S.y, S.pitch, 1);
    out += prCat(S.cx, S.y, S.pitch, play, play.up, S.size, 1);
    out += prCount(S.cx, 108, 3, play.done, on(t, cSay, 0.5), "jumps");
    out += MK.pop(Tx(S.cx + 150, 122, String(PR_REPEAT_JUMP.length), "lab huge gold", "middle"),
      S.cx + 150, 112, popIn(t, cThree, 0.4) * (1 - sw));

    /* the bracket: the repeat block reaches round the block after it */
    var br = on(t, cAfter, 0.55) * (1 - sw * 0.75);
    if (br > 0) {
      var by = Math.min(repY, jumpY) + C0.h * 0.5, b2 = Math.max(repY, jumpY) + C0.h * 0.5;
      out += Pth("M" + n2(C0.x + C0.w - 6) + "," + n2(by) + " C" + n2(C0.x + C0.w + 44) + "," + n2(by) +
        " " + n2(C0.x + C0.w + 44) + "," + n2(b2) + " " + n2(C0.x + C0.w - 6) + "," + n2(b2),
        null, swapped ? P.bad : P.gold, 5, { opacity: br });
    }

    /* the two blocks */
    out += prBlock(C0.x, repY, C0.w, C0.h, "repeat3",
      { o: popIn(t, cNew, 0.45), lit: bump(t, cRep, 0.8) > 0.4 || (!swapped && play.done > 0) });
    out += prBlock(C0.x, jumpY, C0.w, C0.h, "jump",
      { o: popIn(t, cRepeats, 0.45), lit: play.done > 0 && (swapped || prPast(t, cSay)) });
    out += MK.ripple(C0.x + 44, repY + C0.h / 2, t, cRep, P.gold);

    /* "it always goes before": the two places, numbered */
    var ord = popIn(t, cBefore, 0.45) * (1 - sw);
    if (ord > 0) {
      out += prNum(C0.x - 22, repY + C0.h / 2, 21, swapped ? 2 : 1, P.gold, ord);
      out += prNum(C0.x - 22, jumpY + C0.h / 2, 21, swapped ? 1 : 2, P.muted, ord);
      out += MK.pill(PR_RPAN.cx, 204, "before", ord, { size: 24, col: P.gold, ink: P.gold });
    }
    /* put it after, and it has nothing to repeat */
    out += MK.cross(C0.x + C0.w - 44, repY + C0.h / 2, 24, popIn(t, cNeeds, 0.4));
    out += MK.pill(PR_RPAN.cx, 204, "repeats nothing", popIn(t, cNeeds, 0.45),
      { size: 24, col: P.bad, ink: P.bad });
    out += MK.pill(PR_RPAN.cx, 390, "2 blocks", on(t, cTwo, 0.45) * (1 - sw), { size: 24, col: P.blue, ink: P.blue });
    return out;
  }

  /* the last beat: this repeat block against the kind other apps have */
  var PR_OTHER = ["jump", "spin", "say"];
  function prRepeatApps(scene, t) {
    var cSome = sc(scene, 5, "some"), cSeveral = sc(scene, 5, "several"), cJust = sc(scene, 5, "just");
    var out = "", a = popIn(t, cSome, 0.5), b = popIn(t, cJust, 0.5);
    var inside = tally(t, cSeveral, 3, 0.8);
    if (!(a > 0)) return out;

    /* Both panels stand up together, so neither half of the picture is empty
       while the other is being talked about: what arrives later is what makes
       them different - the three blocks inside the box, and the bracket round
       one block only. */
    out += G(R(40, 50, 520, 340, 22, P.card, P.line, 3) +
      R(608, 50, 520, 340, 22, P.card, P.line, 3), { opacity: Math.min(1, a) });
    out += MK.pill(300, 86, "Some apps", a, { size: 24, col: P.muted, ink: P.muted });
    out += MK.pill(868, 86, "This one", a, { size: 24, col: P.gold, ink: P.gold });

    /* some apps: a box that holds several blocks, and repeats them all */
    out += G(R(80, 128, 440, 232, 18, "none", P.plum, 4, { "stroke-dasharray": "12 8" }), { opacity: Math.min(1, a) });
    out += MK.pill(152, 128, ART.block("repeat3").label, a, { size: 20, col: P.plum, ink: P.plum, fill: P.ground });
    PR_OTHER.forEach(function (id, k) {
      out += prBlock(100, 154 + k * 68, 400, 56, id, { o: k < inside ? 1 : 0, size: 22, col: P.plum });
    });

    /* this one: just the block after it */
    out += prBlock(668, 128, 400, 56, "repeat3", { o: a, size: 22 });
    out += prBlock(668, 200, 400, 56, "jump", { o: a, size: 22, lit: b > 0.4, col: b > 0.4 ? P.gold : null });
    out += prBlock(668, 292, 400, 56, "spin", { o: a * (b > 0.4 ? 0.42 : 1), size: 22 });
    out += G(R(650, 190, 436, 76, 14, "none", P.gold, 4), { opacity: Math.min(1, b) });
    out += MK.pill(868, 366, "just the next one", b, { size: 22, col: P.gold, ink: P.gold });
    return out;
  }

  function prRepeatChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 5), out = "";
    if (u < 1) out += G(prRepeatMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(prRepeatApps(scene, t), { opacity: u });
    return svg(out);
  }
