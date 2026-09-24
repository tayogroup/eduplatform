  /* ==== Grade 4 Computing, Lesson 6, part 2 of the pictures ===================
     "Planning an object" and "Testing part by part". See the header of
     inputs-outputs-and-parts.js. */

  /* ---- a plan: one slot for the input, one for the output ---------------------
     Empty, it is a dashed slot with a question mark, which is what the lesson's
     planner shows before the child answers. */
  function ioSlot(x, y, w, h, tag, value, o, col) {
    if (!(o > 0)) return "";
    var filled = !!value;
    var body = R(x, y, w, h, 16, filled ? P.cell : P.card, filled ? col : P.line, filled ? 3 : 2,
      filled ? null : { "stroke-dasharray": "10 8" }) +
      Tx(x + 22, y + 30, tag, "lab small caps muted", "start");
    if (filled) body += Tx(x + 22, y + h - 22, value, "lab mid", "start", { fill: col });
    else body += Tx(x + w - 30, y + h - 22, "?", "lab big muted", "end");
    return G(body, { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: planning an object ==============================================
     One empty plan, then the lesson's three objects with their own inputs and
     outputs, then the mistake the lesson names: the output planned and the
     input forgotten, so nothing happens at all. */

  var IO_WIDE = { x: 304, y: 54, w: 560, h: 332 };
  var IO_CARD = { y: 48, w: 340, h: 344, gap: 24 };
  function ioCardX(k) { return 50 + k * (IO_CARD.w + IO_CARD.gap); }

  /* beat 1: the plan with nothing in it yet */
  function ioPlanBlank(scene, t) {
    var c = IO_WIDE, cPlan = sc(scene, 0, "plan"), cIn = sc(scene, 0, "input"), cOut = sc(scene, 0, "output");
    var p = popIn(t, cPlan, 0.5), out = "";
    if (!(p > 0)) return "";
    out += G(R(c.x, c.y, c.w, c.h, 24, P.card, P.line, 2), { opacity: Math.min(1, p) });
    out += MK.pop(Em(c.x + c.w / 2, c.y + 72, 66, "\u{1F4CB}"), c.x + c.w / 2, c.y + 72, p);
    out += ioSlot(c.x + 40, c.y + 136, c.w - 80, 88, "INPUT", null, Math.min(1, p));
    out += ioSlot(c.x + 40, c.y + 236, c.w - 80, 88, "OUTPUT", null, Math.min(1, p));
    /* the two questions, each lighting its own slot as it is asked */
    var qi = on(t, cIn, 0.45), qo = on(t, cOut, 0.45);
    if (qi > 0) out += R(c.x + 40, c.y + 136, c.w - 80, 88, 16, "none", P.gold, 4, { opacity: qi * (1 - 0.5 * qo) });
    if (qo > 0) out += R(c.x + 40, c.y + 236, c.w - 80, 88, 16, "none", P.gold, 4, { opacity: qo });
    out += MK.ripple(c.x + 60, c.y + 180, t, cIn, P.gold);
    out += MK.ripple(c.x + 60, c.y + 280, t, cOut, P.gold);
    return out;
  }

  /* the three objects, in the lesson's own words */
  var IO_OBJ = [
    { title: "the cat", pic: "\u{1F431}", card: 1, cardAt: "cat",
      inAt: [1, "akey"], input: "the A key", outAt: [1, "jump"], output: "a jump" },
    { title: "the door", pic: "\u{1F6AA}", card: 2, cardAt: "door",
      inAt: [2, "touch"], input: "the player walks into it", outAt: [3, "opening"], output: "it opens" },
    { title: "the score sign", pic: null, card: 4, cardAt: "sign",
      inAt: [4, "ball"], input: "the ball hits the goal", outAt: [4, "adds"], output: "the number goes up by one" }
  ];

  /* the score sign: a goal, a ball, and a number that goes up by one */
  function ioScoreSign(cx, cy, ballU, up) {
    var out = "";
    var gx = cx - 118, gy = cy - 38;
    out += L(gx, gy, gx, gy + 54, P.plastic, 5) + L(gx + 70, gy, gx + 70, gy + 54, P.plastic, 5) +
      L(gx - 4, gy, gx + 74, gy, P.plastic, 5);
    if (ballU > 0) out += Em(lerp(gx - 40, gx + 34, ballU), lerp(cy + 42, cy + 14, ballU), 32, "⚽");
    out += R(cx + 38, cy - 32, 76, 62, 10, P.cell, up > 0 ? P.good : P.line, 3) +
      Tx(cx + 76, cy + 14, up > 0.5 ? "1" : "0", "lab", "middle", { "font-size": 46, fill: up > 0 ? P.good : P.muted });
    return out;
  }

  /* beats 2 to 5: the three plans, filling in as they are named */
  function ioPlanCards(scene, t) {
    var out = "";
    IO_OBJ.forEach(function (ob, k) {
      var x = ioCardX(k), c = IO_CARD;
      var p = popIn(t, sc(scene, ob.card, ob.cardAt), 0.45);
      if (!(p > 0)) return;
      var inAt = sc(scene, ob.inAt[0], ob.inAt[1]), outAt = sc(scene, ob.outAt[0], ob.outAt[1]);
      var hasIn = ioPast(t, inAt), hasOut = ioPast(t, outAt);
      out += G(R(x, c.y, c.w, c.h, 24, P.card, P.line, 2), { opacity: Math.min(1, p) });
      if (ob.pic) out += MK.pop(Em(x + c.w / 2, c.y + 64, 64, ob.pic), x + c.w / 2, c.y + 64, p);
      else out += G(ioScoreSign(x + c.w / 2, c.y + 64, on(t, inAt, 0.7), on(t, outAt, 0.5)), { opacity: Math.min(1, p) });
      out += Tx(x + c.w / 2, c.y + 124, ob.title, "lab big", "middle", { opacity: Math.min(1, p) });
      /* the door's creak is added to its own output as it is said */
      var value = ob.output;
      if (k === 1 && ioPast(t, sc(scene, 3, "creak"))) value = "it opens and plays a creak";
      out += ioSlot(x + 20, c.y + 144, c.w - 40, 86, "INPUT", hasIn ? ob.input : null, Math.min(1, p), P.gold);
      out += ioSlot(x + 20, c.y + 242, c.w - 40, 86, "OUTPUT", hasOut ? value : null, Math.min(1, p), P.good);
      out += MK.tick(x + c.w - 34, c.y + 158, 16, popIn(t, hasIn ? inAt : null, 0.35));
      out += MK.tick(x + c.w - 34, c.y + 256, 16, popIn(t, hasOut ? outAt : null, 0.35));
      /* the creak, heard from the door */
      if (k === 1) out += MK.waves(x + c.w / 2 + 40, c.y + 64, t, sc(scene, 3, "creak"), {
        dir: -0.5, spread: 1.2, reach: 90, col: P.good,
        until: sc(scene, 3, "creak") == null ? null : sc(scene, 3, "creak") + 1.6
      });
    });
    return out;
  }

  /* beat 6: the output planned and the input forgotten, so nothing happens */
  function ioPlanForget(scene, t) {
    var c = IO_WIDE, out = "";
    var cNo = sc(scene, 5, "nothing"), cBoth = sc(scene, 5, "both");
    var both = ioPast(t, cBoth);
    out += R(c.x, c.y, c.w, c.h, 24, P.card, P.line, 2);
    out += Em(c.x + c.w / 2, c.y + 70, 66, "\u{1F6AA}");
    out += ioSlot(c.x + 40, c.y + 136, c.w - 80, 88, "INPUT", both ? "the player walks into it" : null, 1, P.gold);
    out += ioSlot(c.x + 40, c.y + 236, c.w - 80, 88, "OUTPUT", "it opens and plays a creak", 1, P.good);
    /* nothing happens: the door stays shut and the plan is crossed */
    out += MK.cross(c.x + c.w - 60, c.y + 180, 26, popIn(t, both ? null : cNo, 0.4));
    out += MK.tick(c.x + c.w - 60, c.y + 180, 26, popIn(t, cBoth, 0.4));
    out += MK.tick(c.x + c.w - 60, c.y + 280, 26, popIn(t, cBoth == null ? null : cBoth + 0.3, 0.4));
    out += MK.waves(c.x + c.w / 2 + 40, c.y + 70, t, cBoth, {
      dir: -0.5, spread: 1.2, reach: 90, col: P.good, until: cBoth == null ? null : cBoth + 1.4
    });
    return out;
  }

  function ioPlanChapter(scene, beat, t, i) {
    var u1 = into(t, scene.first + 1), u2 = into(t, scene.first + 5), out = "";
    if (u1 < 1) out += G(ioPlanBlank(scene, t), { opacity: 1 - u1 });
    if (u1 > 0 && u2 < 1) out += G(ioPlanCards(scene, t), { opacity: u1 * (1 - u2) });
    if (u2 > 0) out += G(ioPlanForget(scene, t), { opacity: u2 });
    return svg(out);
  }

  /* ==== chapter: testing part by part ============================================
     The lesson's own first round: go home, jump twice, say hello, with part 2
     spinning when it should jump. The parts stand on the left and the cat does
     what the part it has just been given does, on the right. */

  var IO_PB = { x: 40, w: 620, h: 112, gap: 22 };
  function ioPartY(k) { return 30 + k * (IO_PB.h + IO_PB.gap); }

  /* the lesson's part names and the blocks each part holds */
  var IO_RUN1 = [
    { name: "Part 1: reset", ids: ["home"] },
    { name: "Part 2: the jumps", ids: ["repeat2", "spin"] },
    { name: "Part 3: the greeting", ids: ["say"] }
  ];
  /* what the kit says those blocks actually do, rather than a count typed here */
  var IO_JUMPS = ART.program.expand(["repeat2", "jump"]).length;   /* two jumps */
  var IO_SPINS = ART.program.expand(["repeat2", "spin"]).length;   /* and two spins */
  var IO_HOME = ART.run("\u{1F431}", ["right", "right", "home"])[0].x;  /* go home puts it back at nought */

  /* one part of a program: its name, its blocks, and a mark when it is decided */
  function ioPartBox(k, part, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var y = ioPartY(k), b = IO_PB, col = opt.col || P.line;
    var out = R(b.x, y, b.w, b.h, 18, P.cell, col, opt.sw || 2) +
      Tx(b.x + 22, y + 34, part.name, "lab", "start", { fill: opt.ink || P.ink });
    var cx = b.x + 22;
    part.ids.forEach(function (id, q) {
      out += ioChip(cx, y + 50, 44, id, 1, (opt.chipAt && opt.chipAt[q]) || {});
      cx += ioChipW(id) + 10;
    });
    var mx = b.x + b.w - 40, my = y + 34;
    if (opt.mark === "tick") out += MK.tick(mx, my, 20, opt.markP == null ? 1 : opt.markP);
    else if (opt.mark === "cross") out += MK.cross(mx, my, 20, opt.markP == null ? 1 : opt.markP);
    else if (opt.mark === "bug") out += MK.pop(Em(mx, my, 40, "\u{1F41B}"), mx, my, opt.markP == null ? 1 : opt.markP);
    return G(out, { opacity: clamp(o, 0, 1) * (opt.fade == null ? 1 : opt.fade) });
  }

  /* an empty part, before the voice has said what is in it */
  function ioPartSlot(k, n, o) {
    if (!(o > 0)) return "";
    var y = ioPartY(k), b = IO_PB;
    return G(R(b.x, y, b.w, b.h, 18, P.card, P.line, 2, { "stroke-dasharray": "12 9" }) +
      Tx(b.x + 28, y + b.h / 2 + 10, "Part " + n, "lab muted", "start"), { opacity: clamp(o, 0, 1) });
  }

  function ioPartsChapter(scene, beat, t, i) {
    var k = i - scene.first, out = "";
    var cThree = sc(scene, 0, "three"), cReset = sc(scene, 0, "reset"),
      cJumps = sc(scene, 0, "jumps"), cGreet = sc(scene, 0, "greeting");
    var cRun1 = sc(scene, 1, "run1"), cHome = sc(scene, 1, "home"), cFine = sc(scene, 1, "fine");
    var cRun2 = sc(scene, 2, "run2"), cSpins = sc(scene, 2, "spins"), cWant = sc(scene, 2, "wanted");
    var cBug = sc(scene, 3, "bug"), cPart2 = sc(scene, 3, "part2"), cNo = sc(scene, 3, "nowhere");
    var cOne = sc(scene, 4, "onepart"), cWhere = sc(scene, 4, "where"), cGuess = sc(scene, 4, "guess");

    var slots = tally(t, cThree, 3, 0.8);
    var filled = [ioPast(t, cReset), ioPast(t, cJumps), ioPast(t, cGreet)];
    var scan = k === 4 ? tally(t, cOne, 3, 1.3) - 1 : -1;
    var dimOthers = k === 3 ? on(t, cNo, 0.5) : 0;

    IO_RUN1.forEach(function (part, n) {
      if (!filled[n]) { out += ioPartSlot(n, n + 1, n < slots ? 1 : 0); return; }
      var opt = { fade: 1 };
      if (n === 0) {
        if (k === 1 && ioPast(t, cRun1)) { opt.col = P.gold; opt.sw = 4; }
        if (k >= 1 && ioPast(t, cFine)) { opt.mark = "tick"; opt.markP = popIn(t, cFine, 0.35); }
        opt.fade = 1 - 0.6 * dimOthers;
      } else if (n === 1) {
        if ((k === 2 && ioPast(t, cRun2)) || (k === 3 && ioPast(t, cPart2))) { opt.col = k === 3 ? P.bad : P.gold; opt.sw = 4; }
        if (k === 3 && ioPast(t, cBug)) { opt.mark = "bug"; opt.markP = popIn(t, cBug, 0.4); }
        else if (k >= 2 && ioPast(t, cWant)) { opt.mark = "cross"; opt.markP = popIn(t, cWant, 0.35); }
        /* the block that is wrong: the part spins where two jumps were wanted */
        if (k >= 2 && ioPast(t, cWant)) opt.chipAt = [{}, { col: P.bad, ink: P.bad }];
      } else {
        opt.fade = 1 - 0.6 * dimOthers;
      }
      if (scan === n) { opt.col = P.gold; opt.sw = 4; }
      out += ioPartBox(n, part, 1, opt);
    });

    /* which part the voice is pointing at, in its own words */
    if (k === 4) {
      out += MK.pill(IO_PB.x + IO_PB.w - 30, ioPartY(1) + 78, "Part 2", on(t, cWhere, 0.45),
        { size: 22, anchor: "end", col: P.bad, ink: P.bad });
    }

    /* the stage: home is marked, and the cat does what the part it was given does */
    var extra = E(IO_CX, IO_GY, 46, 12, "none", P.muted, 3, { "stroke-dasharray": "9 9", opacity: 0.7 }) +
      Em(IO_CX, IO_GY + 32, 34, "\u{1F3E0}");
    var cat = { dx: 1.6 };
    if (k === 0) cat.dx = 1.6;
    else if (k === 1) cat.dx = lerp(1.6, IO_HOME, ioDo(t, cHome, 0.85));
    else { cat.dx = IO_HOME; if (k === 2) cat.spin = ioDo(t, cSpins, 1.1) * IO_SPINS; }
    out += ioStage(1, extra) + ioCat(cat);

    /* what was wanted instead: two jump blocks, ghosted */
    if (k === 2) {
      var w = on(t, cWant, 0.45);
      if (w > 0) {
        var ids = [], q;
        for (q = 0; q < IO_JUMPS; q++) ids.push("jump");
        var bw = ioChipsW(ids) + 36;
        out += G(R(IO_CX - bw / 2, 76, bw, 68, 14, "none", P.gold, 3, { "stroke-dasharray": "11 8" }) +
          ioChips(IO_CX - bw / 2 + 18, 88, 44, ids, 1, { col: P.gold, dim: 0.85 }), { opacity: w });
      }
    }
    /* guessing, instead of knowing where */
    if (k === 4) {
      var g = popIn(t, cGuess, 0.4);
      out += MK.qmark(IO_CX, 150, 50, Math.min(1, g));
      out += MK.cross(IO_CX + 72, 106, 24, popIn(t, cGuess == null ? null : cGuess + 0.3, 0.35));
    }
    return svg(out);
  }
