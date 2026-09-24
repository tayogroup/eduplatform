  /* ==== Grade 3 Computing, Lesson 5: Tidy Programs ============================
     tools/lib/film-scenes/computing-g3/tidy-programs.js, with -2.js, -3.js and
     -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/tidy-programs.json.

     WHERE A PROGRAM ENDS IS THE LESSON'S ARITHMETIC, NOT THE FILM'S. The kit
     runs its own sprite stage (ART.run) and its own numbered walk
     (ART.walkEnd), so the untidy program and the tidy one are SHOWN ending in
     the same place by the lesson rather than by a copy of its rules here, and
     the cat the last program left two squares along really does end on square
     3 with no go home block and square 1 with one. Every block's label and
     icon is the kit's too (ART.block), so a block renamed in the lesson is
     renamed here. Computing has no ART.sim, so the sprite stage is DRAWN
     here, in the engine's idiom - the picture is the film's, the rules are
     the lesson's.

     This file: the block and program-column drawings, the sprite stage, the
     card above it, the constants every chapter reads, and the title motif.
     Every top-level name starts with tp or TP, so nothing can replace a name
     of the engine, ART or MK. */

  var HUE = {
    title: P.teal, tidy: P.gold, reset: P.accent, number: P.blue,
    test: P.plum, scratch: P.good, recap: P.teal
  };

  /* has this cue been reached? (a cue the beat never names is never reached) */
  function tpPast(t, at) { return at != null && t >= at; }

  /* ---- a block, drawn as the lesson draws it ---------------------------------
     computing.css: a rounded block in its category's colour (move teal, look
     plum, control accent) with its icon and its label in dark ink. `b` is a
     block id, and the label and icon are then the kit's own; it may also be
     {label, icon, cat} for the one block this film shows that the lesson's
     block box does not have, Scratch's set volume. */
  var TP_CAT = { move: P.teal, look: P.plum, control: P.accent };
  var TP_INK = "#08222E";

  /* opt: {o, ring (a colour), mark ("tick"|"cross"|"bug"), markP, num (a number
     chip at the right end), numCol, dimmed, label (instead of the kit's)} */
  function tpBlock(x, y, w, h, b, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    if (typeof b === "string") b = ART.block(b);
    var fs = Math.min(25, h * 0.44);
    var body = R(x, y, w, h, h * 0.26, TP_CAT[b.cat] || P.teal, opt.ring || null, opt.ring ? 4 : null);
    body += Em(x + h * 0.52, y + h / 2, fs * 1.15, b.icon);
    body += Tx(x + h * 0.98, y + h / 2 + fs * 0.36, opt.label || b.label, "lab", "start",
      { "font-size": fs, fill: TP_INK });
    if (opt.num != null) {
      var cx = x + w - h * 0.46, r = h * 0.30;
      body += C(cx, y + h / 2, r, P.paper, opt.numCol || TP_INK, 3) +
        Tx(cx, y + h / 2 + r * 0.40, String(opt.num), "lab", "middle", { "font-size": r * 1.25, fill: TP_INK });
    }
    var mx = x + w + 26, my = y + h / 2, mr = Math.min(18, h * 0.32), p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    else if (opt.mark === "bug") body += MK.pop(Em(mx, my, mr * 2.1, "\u{1F41B}"), mx, my, p);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dimmed ? 0.42 : 1) });
  }

  /* the empty place a block has just left, waiting for the one that replaces it */
  function tpSlot(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, h * 0.26, P.card, P.line, 2, { "stroke-dasharray": "10 8", opacity: clamp(o, 0, 1) });
  }

  /* ---- the program column ----------------------------------------------------- */
  var TP_COL = { x: 48, w: 344, h: 58, gap: 13 };
  /* where the k-th of n rows sits, the whole column centred in the 440 box */
  function tpColY(k, n, h, gap) {
    h = h || TP_COL.h; gap = gap == null ? TP_COL.gap : gap;
    return (440 - n * h - (n - 1) * gap) / 2 + k * (h + gap);
  }

  /* how many blocks this program has, said in the picture as well as in the voice */
  function tpCount(cx, cy, n, o, col) {
    if (!(o > 0)) return "";
    return MK.pill(cx, cy, n + (n === 1 ? " block" : " blocks"), o,
      { size: 25, col: col || P.line, ink: col || P.ink });
  }

  /* ---- the sprite stage, drawn here ------------------------------------------
     The kit's stage is HTML and the film carries no computing.css, so this is
     that stage in the engine's idiom: a green ground, seven squares from -3 to
     3, and the cat standing on one of them. WHERE the cat stands comes from
     ART.run and ART.walkEnd; only the drawing is the film's.
     st: {x (a square, and it may be between two), scale, spin}
     opt: {hop (0 to 1, a jump), home (show the home mark), flower ({x, p}, a
     flower on a square, drawn BEHIND the cat so the cat can stand on it),
     catPop (the cat popping in, 0 to 1), o} */
  var TP_ST = { x: 452, y: 234, w: 684, h: 186, sq: 88, ground: 378 };
  var TP_CX = TP_ST.x + TP_ST.w / 2;
  function tpSqX(n) { return TP_CX + n * TP_ST.sq; }

  function tpCatAt(square, scale, spin, hop) {
    var x = tpSqX(square), y = TP_ST.ground - 30 * scale - 54 * (hop || 0);
    var g = Em(x, y, 60 * scale, "\u{1F431}");
    if (spin) g = G(g, { transform: "rotate(" + n2(spin % 360) + " " + n2(x) + " " + n2(y) + ")" });
    return g;
  }
  function tpCatTop(square, scale, hop) { return TP_ST.ground - 30 * scale - 54 * (hop || 0) - 30 * scale; }

  function tpStage(st, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var out = R(TP_ST.x, TP_ST.y, TP_ST.w, TP_ST.h, 22, P.card, P.line, 2);
    out += R(TP_ST.x + 3, TP_ST.ground, TP_ST.w - 6, TP_ST.y + TP_ST.h - TP_ST.ground - 3, 12, P.grass);
    for (var k = -3; k <= 3; k++) {
      var sx = tpSqX(k);
      out += R(sx - 38, TP_ST.ground + 5, 76, 30, 8, "rgba(255,255,255,0.10)");
      out += Tx(sx, TP_ST.ground + 27, String(k), "lab small", "middle", { fill: "#EAF4FA", opacity: 0.85 });
    }
    /* the home mark and the flower sit to one side of their square, so the cat
       standing on that square does not hide them */
    if (opt.home) out += Em(tpSqX(0) - 32, TP_ST.ground - 18, 34, "\u{1F3E0}");
    if (opt.flower && opt.flower.p > 0)
      out += MK.pop(Em(tpSqX(opt.flower.x) + 24, TP_ST.ground - 20, 38, "\u{1F338}"),
        tpSqX(opt.flower.x) + 24, TP_ST.ground - 20, opt.flower.p);
    var sc0 = st.scale == null ? 1 : st.scale;
    var cat = tpCatAt(st.x, sc0, st.spin || 0, opt.hop || 0);
    out += opt.catPop == null ? cat
      : MK.pop(cat, tpSqX(st.x), TP_ST.ground - 30 * sc0 - 54 * (opt.hop || 0), opt.catPop);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- the card above the stage -----------------------------------------------
     opt: {col, ink, mark ("tick"|"cross"), markP, sub, subCol} */
  var TP_CARD = { x: 440, y: 22, w: 700, h: 186 };
  function tpCardBox(title, text, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var b = TP_CARD, col = opt.col || P.line;
    var out = R(b.x, b.y, b.w, b.h, 22, P.card, col, opt.col ? 3.5 : 2);
    out += Tx(b.x + 30, b.y + 44, title, "lab mid caps muted", "start");
    if (text) out += Tx(b.x + 30, b.y + 104, text, "lab big", "start", opt.ink ? { fill: opt.ink } : null);
    if (opt.sub) out += Tx(b.x + 30, b.y + 150, opt.sub, "lab mid", "start", { fill: opt.subCol || P.muted });
    var mx = b.x + b.w - 46, my = b.y + b.h - 46, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") out += MK.tick(mx, my, 26, p);
    else if (opt.mark === "cross") out += MK.cross(mx, my, 26, p);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ==== what the lesson's own machinery answers, asked ONCE ====================
     ART.run mounts the kit's sprite stage and runs a script on it, so it is
     asked here rather than inside a draw function a render calls thousands of
     times. Every number and every phrase below is the lesson's. */

  var TP_LONG = ["jump", "jump", "jump", "wait", "say"];
  var TP_SHORT = ["repeat3", "jump", "say"];
  var TP_BUGGY = ["repeat3", "spin", "say"];
  var TP_FIXED = ["repeat3", "jump", "say"];

  /* what the cat actually does, in the kit's words, with the unused wait taken
     out exactly as the lesson's own sameEffect does */
  function tpDoes(ids) {
    return ART.program.runWords(ART.program.expand(ids).filter(function (x) { return x !== "wait"; }));
  }
  var TP_JOB = tpDoes(TP_SHORT);              /* "jump 3 times, then say hello" */
  var TP_SAME = ART.program.same(TP_LONG, TP_SHORT);
  var TP_BUG_DOES = tpDoes(TP_BUGGY);         /* "spin 3 times, then say hello" */
  var TP_FIX_DOES = tpDoes(TP_FIXED);
  var TP_BUG_SAME = ART.program.same(TP_BUGGY, TP_FIXED);

  /* the cat the last program left two squares along and big (the lesson's own
     round), run with and without a go home block at the top */
  var TP_START = { x: 2, scale: 1.4 };
  var TP_NOHOME = ART.run("\u{1F431}", ["right", "jump"], { start: TP_START })[0];
  var TP_WITHHOME = ART.run("\u{1F431}", ["home", "right", "jump"], { start: TP_START })[0];

  /* the numbered program and the flower, by the kit's own walk (3P.05) */
  var TP_TARGET = 3;
  var TP_PROG_A = [{ id: "right", n: 1 }, { id: "jump", n: 1 }, { id: "right", n: 1 }];
  var TP_PROG_B = [{ id: "right", n: 2 }, { id: "jump", n: 1 }, { id: "right", n: 1 }];
  var TP_END_A = ART.walkEnd(TP_PROG_A);
  var TP_END_B = ART.walkEnd(TP_PROG_B);

  /* ==== the title motif =========================================================
     The whole lesson in one picture: five blocks on the left, three on the
     right, an equals sign between them, and the count under each. In the
     spoken title chapter the left stack arrives as the five blocks are read
     out, the wait is crossed on "one does nothing", the right stack arrives on
     the short program, and the equals and its tick land on "exactly the same".
     On the two cards it stands still. */
  var TP_M = { lx: 14, rx: 200, w: 150, h: 34, gap: 9, ltop: 60, rtop: 104 };
  function tpChip(x, y, id, o, col) {
    if (!(o > 0)) return "";
    var b = ART.block(id), w = TP_M.w, h = TP_M.h;
    return G(R(x, y, w, h, 10, TP_CAT[b.cat] || P.teal, col || null, col ? 3 : null) +
      Em(x + 17, y + h / 2, 19, b.icon) +
      Tx(x + 32, y + h / 2 + 5, b.label, "lab", "start", { "font-size": 14, fill: TP_INK }),
      { transform: around(x + w / 2, y + h / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cLong = sn ? sc(sn, 0, "long") : null, cFive = sn ? sc(sn, 0, "five") : null,
      cNothing = sn ? sc(sn, 0, "nothing") : null, cShort = sn ? sc(sn, 1, "short") : null,
      cThree = sn ? sc(sn, 1, "three") : null, cSame = sn ? sc(sn, 1, "same") : null;

    out += R(6, 18, 348, 324, 28, P.card, P.line, 3);
    /* the long program, one block at a time as it is read out */
    var lit = sn ? tally(t, cLong, TP_LONG.length, 1.1) : TP_LONG.length;
    TP_LONG.forEach(function (id, k) {
      var p = sn ? (k < lit ? popIn(t, cLong == null ? null : cLong + k * 0.22, 0.34) : 0) : 1;
      var crossed = (id === "wait" && sn) ? popIn(t, cNothing, 0.4) : 0;
      var y = TP_M.ltop + k * (TP_M.h + TP_M.gap);
      out += tpChip(TP_M.lx, y, id, p, crossed > 0 ? P.bad : null);
      /* a dark cross: a red one on the wait block's own orange does not read */
      if (crossed > 0) out += MK.cross(TP_M.lx + TP_M.w - 21, y + TP_M.h / 2, 15, crossed, TP_INK);
    });
    /* the tidy one */
    var rlit = sn ? tally(t, cShort, TP_SHORT.length, 0.9) : TP_SHORT.length;
    TP_SHORT.forEach(function (id, k) {
      var p = sn ? (k < rlit ? popIn(t, cShort == null ? null : cShort + k * 0.24, 0.34) : 0) : 1;
      out += tpChip(TP_M.rx, TP_M.rtop + k * (TP_M.h + TP_M.gap), id, p);
    });
    /* the counts, and the equals between them */
    var pf = sn ? popIn(t, cFive, 0.4) : 1, pt = sn ? popIn(t, cThree, 0.4) : 1;
    out += MK.pop(C(TP_M.lx + TP_M.w / 2, 300, 29, P.cell, P.bad, 3) +
      Tx(TP_M.lx + TP_M.w / 2, 311, "5", "lab", "middle", { "font-size": 36, fill: P.bad }),
      TP_M.lx + TP_M.w / 2, 300, pf);
    out += MK.pop(C(TP_M.rx + TP_M.w / 2, 300, 29, P.cell, P.good, 3) +
      Tx(TP_M.rx + TP_M.w / 2, 311, "3", "lab", "middle", { "font-size": 36, fill: P.good }),
      TP_M.rx + TP_M.w / 2, 300, pt);
    var ps = sn ? popIn(t, cSame, 0.42) : 1;
    out += MK.pop(Tx(182, 196, "=", "lab", "middle", { "font-size": 58, fill: P.gold }), 182, 180, ps);
    out += MK.tick(182, 300, 25, ps);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A five block program beside a three block program, and a tick under both">' + out + "</svg>";
  }
