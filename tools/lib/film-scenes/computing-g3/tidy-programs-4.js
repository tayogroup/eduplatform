  /* ==== Tidy Programs, part 4: the real block names, and what you now know ====
     tools/lib/film-scenes/computing-g3/tidy-programs-4.js. See the header of
     tidy-programs.js.

     The Scratch names are the lesson's own list, from its "Where these
     programs really live" lecture part; the block beside each one is the kit's
     (ART.block), so the two columns cannot drift apart. Scratch's set volume
     block is the one block here the lesson's block box does not have, so it is
     given to tpBlock as a plain {label, icon, cat} instead of an id. */

  var TP_TBL = { x: 128, lw: 330, rx: 560, h: 52, gap: 8, top: 104 };
  var TP_SCRATCH = [
    { id: "right", name: "move 10 steps", beat: 1, at: "move" },
    { id: "jump", name: "change y by 50", beat: 1, at: "jump" },
    { id: "spin", name: "turn 90 degrees", beat: 1, at: "spin" },
    { id: "home", name: "go to x: 0 y: 0", beat: 2, at: "home" },
    { id: "repeat3", name: "repeat 3", beat: 2, at: "repeat" }
  ];
  var TP_VOLUME = { label: "set volume", icon: "\u{1F50A}", cat: "look" };

  function tpScratchTable(scene, t) {
    var cOther = sc(scene, 0, "other"), cScratch = sc(scene, 0, "scratch");
    var cSame = sc(scene, 2, "same");
    var out = "", frame = on(t, cOther, 0.5), done = on(t, cSame, 0.5);

    out += R(108, 44, 980, 368, 24, P.card, done > 0.5 ? P.good : P.line, done > 0.5 ? 3.5 : 2,
      { opacity: frame });
    out += G(Tx(TP_TBL.x, 82, "Your block", "lab mid caps muted", "start") +
      Tx(TP_TBL.rx, 82, "In Scratch", "lab mid caps muted", "start"), { opacity: frame });
    out += MK.pop(Em(1036, 74, 44, "\u{1F431}"), 1036, 74, popIn(t, cScratch, 0.45));

    /* the child's own blocks arrive first, then each Scratch name as it is
       said, with a light on just the one being named */
    TP_SCRATCH.forEach(function (row, k) {
      var at = sc(scene, row.beat, row.at), y = TP_TBL.top + k * (TP_TBL.h + TP_TBL.gap);
      var blockP = popIn(t, cOther == null ? null : cOther + 0.3 + k * 0.16, 0.34);
      if (!(blockP > 0)) return;
      var named = at != null && t >= at && t < at + 1.3;
      out += G(tpBlock(TP_TBL.x, y, TP_TBL.lw, TP_TBL.h, row.id, { ring: named ? P.gold : null }),
        { transform: around(TP_TBL.x + TP_TBL.lw / 2, y + TP_TBL.h / 2, Math.min(1.06, blockP)) });
      var p = popIn(t, at, 0.38);
      if (!(p > 0)) return;
      out += MK.arrow(TP_TBL.x + TP_TBL.lw + 12, y + TP_TBL.h / 2, TP_TBL.rx - 22, y + TP_TBL.h / 2,
        on(t, at, 0.4), P.gold, 6);
      out += Tx(TP_TBL.rx, y + TP_TBL.h / 2 + 10, row.name, "lab big", "start",
        { opacity: Math.min(1, p), fill: P.ink });
    });
    out += MK.tick(1040, 360, 26, popIn(t, cSame, 0.42));
    return out;
  }

  /* the number a block holds: the lesson's move and wait, and Scratch's set
     volume with the loudness it is set to */
  function tpScratchNumbers(scene, t) {
    var cHold = sc(scene, 3, "hold"), cSteps = sc(scene, 3, "steps"), cSeconds = sc(scene, 3, "seconds");
    var cVolume = sc(scene, 4, "volume"), cLoud = sc(scene, 4, "loud"), cRange = sc(scene, 4, "range");
    /* the two blocks are here as the beat opens, so the screen is never empty
       while the first line is being said; the line itself lands on "hold" */
    var out = "", hold = into(t, scene.first + 3);

    out += Tx(584, 60, "A block can hold a number", "lab big", "middle", { opacity: on(t, cHold, 0.45) });

    var rows = [
      { b: "right", n: 10, cap: "steps", y: 108, at: cSteps },
      { b: "wait", n: 1, cap: "seconds", y: 224, at: cSeconds }
    ];
    rows.forEach(function (r) {
      var p = Math.min(1, hold);
      if (!(p > 0)) return;
      out += tpBlock(140, r.y, 400, 64, r.b, { o: p, num: r.n, numCol: tpPast(t, r.at) ? P.gold : null });
      var lit = on(t, r.at, 0.42);
      if (lit > 0) {
        out += C(140 + 400 - 64 * 0.46, r.y + 32, 64 * 0.30 + 8, "none", P.gold, 4, { opacity: lit });
        out += Tx(150, r.y + 106, r.cap, "lab mid", "start", { opacity: lit, fill: P.gold });
      }
    });

    var v = popIn(t, cVolume, 0.45);
    if (v > 0) {
      out += G(tpBlock(628, 108, 400, 64, TP_VOLUME, { num: 40 }),
        { transform: around(828, 140, Math.min(1.06, v)), opacity: Math.min(1, v) });
    }
    out += Tx(638, 206, "how loud a sound is", "lab mid", "start",
      { opacity: on(t, cLoud, 0.45), fill: P.muted });
    /* The track is there as soon as the block is; the loudness fills it as
       "how loud a sound is" is said, and the two ends are named last. (The
       fill used to wait for "from 0 to 100", the last phrase of the last
       teaching beat, so the bar was still empty at the 70% still and had a
       second at most to finish - rule 2.) */
    var track = on(t, cVolume == null ? null : cVolume + 0.3, 0.5), bar = on(t, cLoud, 0.7);
    var ends = on(t, cRange, 0.45);
    if (track > 0) out += G(R(628, 264, 400, 26, 13, P.cell, P.line, 2), { opacity: track });
    if (bar > 0) {
      out += G(R(628, 264, 400 * 0.40 * bar, 26, 13, P.gold) +
        C(628 + 160 * bar, 277, 15, P.paper, P.gold, 3), { opacity: bar });
      out += Tx(628 + 160 * bar, 246, "40", "lab", "middle", { opacity: bar, fill: P.gold });
    }
    if (ends > 0) {
      out += MK.pill(628, 332, "0", ends, { size: 22, col: P.muted, ink: P.muted });
      out += MK.pill(1028, 332, "100", popIn(t, cRange == null ? null : cRange + 0.35, 0.4),
        { size: 22, col: P.muted, ink: P.muted });
    }
    return out;
  }

  function tpScratchChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(tpScratchTable(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(tpScratchNumbers(scene, t), { opacity: u });
    return svg(out);
  }

  /* ---- what you now know -----------------------------------------------------
     The lesson's own words for this unit, with its own pictures for them. */
  var TP_RECAP = MK.recapKind([
    { beat: 0, at: "unused", title: "Unused", sub: "a block that does nothing", pic: "\u{23F3}" },
    { beat: 0, at: "duplicate", title: "Duplicate", sub: "the same block again and again", pic: "\u{1F501}" },
    { beat: 1, at: "init", title: "Initialisation", sub: "go home first, every run", pic: "\u{1F3E0}" },
    { beat: 1, at: "number", title: "The number", sub: "change one inside a block", pic: "\u{1F522}" },
    { beat: 2, at: "test", title: "Test", sub: "run it after every change", pic: "▶️" }
  ], { goBeat: 2, goAt: "test" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "How to make a program shorter without changing what it does",
      "Why a program starts by putting the cat back where it began",
      "How one number inside a block changes where the cat stops"
    ] }),
    tidy: tpTidyChapter, reset: tpResetChapter, number: tpNumberChapter,
    test: tpTestChapter, scratch: tpScratchChapter, recap: TP_RECAP
  };
