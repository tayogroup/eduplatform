  /* ==== Grade 2 Computing, Lesson 5: Debugging Together ======================
     tools/lib/film-scenes/computing-g2/debugging-together.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/debugging-together.json.

     WHAT IS BORROWED AND WHAT IS DRAWN. Computing has no ART.sim, so the block
     list and the dog's stage are drawn here, in the engine's own idiom. Every
     RULE comes from the kit: ART.block(id) gives each block its label and its
     icon, ART.run gives the dog's end state after a program (grow is x1.4, a
     move is one square), and ART.program.runWords says in words what a run
     actually did. So the film cannot disagree with the lesson about what a
     block does.

     THE MARK GOES ON THE BLOCK, NEVER ON THE CHILD. This lesson is about
     people finding faults together, so no cross, bug or red outline in this
     film is ever drawn on or beside Sami, Amal or anyone else: it sits on the
     wrong block, or on the line saying what the program produced.

     A BLOCK THAT IS REPLACED NEVER SLIDES PAST ITS NEIGHBOUR. The wrong block
     shrinks away about its own slot's centre and the right one grows into the
     empty slot, exactly where the wrong one stood (the Grade 1 Computing idiom).
     Nothing travels across the row above it, because in a film about fixing
     mistakes an overlap reads as a new bug.

     This file: the palette, the block row and the dog stage that the two
     debugging chapters share, the title motif, and the chapter "Run it first".
     Every top-level name here starts with dt. */

  var HUE = {
    title: P.teal, run: P.gold, two: P.accent, heads: P.blue,
    aloud: P.plum, pros: P.good, recap: P.teal
  };

  var DT_DOG = "\u{1F436}";            /* the lesson's own sprite for these rounds */

  /* ---- timing ------------------------------------------------------------- */

  /* has this cue been reached? (a cue the beat never names is never reached) */
  function dtPast(t, at) { return at != null && t >= at; }
  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does */
  function dtOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }

  /* ---- the space the two debugging chapters share -------------------------- */

  var DT_GOALC = { x: 44, y: 14, w: 462, h: 70 };
  var DT_PANEL = { x: 44, w: 462 };
  var DT_ROW = { h: 92, gap: 16, top: 106 };
  function dtRowY(k) { return DT_ROW.top + k * (DT_ROW.h + DT_ROW.gap); }   /* 106, 214, 322 */
  var DT_STAGE = { x: 556, y: 106, w: 576, h: 236 };
  var DT_BTN = { x: 556, y: 14, w: 150, h: 70 };
  var DT_BTN_C = [DT_BTN.x + 42, DT_BTN.y + DT_BTN.h / 2];
  var DT_NOTE = [900, 49];             /* a short note, right of the Run button */
  var DT_CAP = [812, 388];             /* what the program actually did */
  /* The tick or cross that judges that caption, in the clear strip to its
     right. The longest caption this film shows is "move left, then move
     right, then spin" - 528 units wide, reaching 1076 - and the mark used
     to sit on its end. */
  var DT_MARK = 1120;
  var DT_SQ = 84;                       /* how wide one of the dog's squares is drawn */
  var DT_GUTTER = 531;                 /* clear space between the list and the stage */

  /* One block of a program: its number, the kit's own icon and the kit's own
     label. opt: {o, col (border and number), mark ("tick"|"cross"|"bug"),
     markP, dim} */
  function dtRow(x, y, w, h, n, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var b = ART.block(id);
    var col = opt.col || P.line, sw = opt.col ? 3.5 : 2;
    var fs = Math.min(30, h * 0.34);
    var body = R(x, y, w, h, h * 0.26, P.cell, col, sw) +
      C(x + h * 0.46, y + h / 2, h * 0.25, P.card, col, 2) +
      Tx(x + h * 0.46, y + h / 2 + h * 0.11, String(n), "lab", "middle",
        { fill: opt.col || P.muted, "font-size": h * 0.32 }) +
      Em(x + h * 1.06, y + h / 2, h * 0.44, b.icon) +
      Tx(x + h * 1.44, y + h / 2 + fs * 0.35, b.label, "lab", "start", { "font-size": fs });
    var mx = x + w - h * 0.40, my = y + h / 2, mr = h * 0.25, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    else if (opt.mark === "bug") body += MK.pop(Em(mx, my, mr * 1.9, "\u{1F41B}"), mx, my, p);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dim ? 0.45 : 1) });
  }

  /* the empty place a block left behind, waiting for the right one */
  function dtSlot(x, y, w, h, n, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.26, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      C(x + h * 0.46, y + h / 2, h * 0.25, P.card, P.line, 2) +
      Tx(x + h * 0.46, y + h / 2 + h * 0.11, String(n), "lab", "middle", { fill: P.muted, "font-size": h * 0.32 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* the goal, in the lesson's own words, above the program */
  function dtGoalCard(text, cardO, textO, opt) {
    if (!(cardO > 0)) return "";
    opt = opt || {};
    var g = DT_GOALC, col = P.gold, fl = opt.flash || 0;
    return G(R(g.x, g.y, g.w, g.h, 18, P.card, col, 3) +
      (fl > 0 ? R(g.x - 4, g.y - 4, g.w + 8, g.h + 8, 22, "none", col, 4, { opacity: fl }) : "") +
      Tx(g.x + 20, g.y + 28, "Goal", "lab mid gold", "start") +
      Tx(g.x + 20, g.y + 58, text, "lab big", "start", { opacity: clamp(textO, 0, 1), "font-size": 26 }),
      { opacity: clamp(cardO, 0, 1) });
  }

  /* the Run button; green while the program is running */
  function dtBtn(o, hot) {
    if (!(o > 0)) return "";
    var b = DT_BTN;
    return G(R(b.x, b.y, b.w, b.h, 20, hot ? "#1B3A52" : P.cell, hot ? P.good : P.line, hot ? 3.5 : 2) +
      Em(b.x + 42, b.y + b.h / 2, 34, "▶️") +
      Tx(b.x + 76, b.y + b.h / 2 + 10, "Run", "lab big", "start"),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the dog, running the lesson's own program ---------------------------
     ART.run gives the end state after each prefix of the program, so the size
     and the square the dog ends on are the LESSON'S arithmetic. Worked out once
     here, never inside a draw function. A jump and a spin leave no end state
     behind (the lesson paints them and puts the sprite back), so the hop and
     the turn are drawn from how far through the block we are. */
  function dtStates(ids) {
    var out = [{ x: 0, scale: 1, spin: 0, hidden: false }];
    for (var k = 1; k <= ids.length; k++) out.push(ART.run(DT_DOG, ids.slice(0, k))[0]);
    return out;
  }

  /* which block is running at t, and how far through it: times[k] is when block
     k starts, dur how long its move takes */
  function dtRunState(ids, states, times, dur, t) {
    var done = 0, cur = -1;
    for (var k = 0; k < ids.length; k++) if (times[k] != null && t >= times[k]) { done = k + 1; cur = k; }
    var u = cur >= 0 ? clamp((t - times[cur]) / dur, 0, 1) : 1;
    var a = states[Math.max(0, done - 1)], b = states[done];
    var id = cur >= 0 ? ids[cur] : null;
    return {
      done: done, id: id, u: u,
      s: { x: lerp(a.x, b.x, ease(u)), scale: lerp(a.scale, b.scale, ease(u)), hidden: b.hidden },
      /* a hop is drawn over a whole second, whatever the run's pace: at the
         block's own pace it was back on the ground before the voice finished
         naming it, and every sampled frame showed the dog standing still */
      hop: id === "jump" ? Math.pow(Math.sin(Math.PI * clamp((t - times[cur]) / 1.0, 0, 1)), 0.6) : 0,
      spin: id === "spin" ? 360 * ease(u) : 0,
      say: id === "say" ? clamp((t - times[cur]) / 0.3, 0, 1) : 0
    };
  }

  function dtStageDraw(r, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var b = DT_STAGE, gy = b.y + b.h - 46;
    var out = R(b.x, b.y, b.w, b.h, 22, P.card, opt.lit ? P.gold : P.line, opt.lit ? 3 : 2) +
      R(b.x + 18, gy, b.w - 36, 12, 6, P.cell);
    var s = r.s, size = 74 * s.scale;
    var cx = b.x + b.w / 2 + s.x * DT_SQ, cy = gy - size * 0.44 - r.hop * 52;
    var extra = { opacity: s.hidden ? 0.15 : 1 };
    if (r.spin) extra.transform = "rotate(" + n2(r.spin) + "," + n2(cx) + "," + n2(cy) + ")";
    out += Em(cx, cy, size, DT_DOG, extra);
    if (r.say > 0) out += MK.bubble(cx + 26, cy - size * 0.62 - 66, 158, 58, "Hello!", r.say, cx + 10, cy - size * 0.46);
    if (opt.watch > 0) out += MK.pop(Em(b.x + b.w - 44, b.y + 40, 40, "\u{1F440}"), b.x + b.w - 44, b.y + 40, opt.watch);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a bracket in the left margin, round the whole program */
  function dtBracket(o) {
    if (!(o > 0)) return "";
    return Pth("M32," + n2(dtRowY(0) + 4) + " L18," + n2(dtRowY(0) + 4) +
      " L18," + n2(dtRowY(2) + DT_ROW.h - 4) + " L32," + n2(dtRowY(2) + DT_ROW.h - 4),
      null, P.gold, 4, { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title ==============================================================
     The lesson in one picture: a three-block program with a bug on the middle
     block, which becomes a tick, and the two children who found it. */
  function dtTile(x, y, w, h, id, o, col, mark, markP) {
    if (!(o > 0)) return "";
    var b = ART.block(id);
    var body = R(x, y, w, h, 12, P.cell, col || P.line, col ? 3 : 2) +
      Em(x + 30, y + h / 2, 26, b.icon) +
      Tx(x + 54, y + h / 2 + 7, b.label, "lab", "start", { "font-size": 20 });
    if (mark === "bug") body += MK.pop(Em(x + w - 28, y + h / 2, 30, "\u{1F41B}"), x + w - 28, y + h / 2, markP);
    else if (mark === "tick") body += MK.tick(x + w - 28, y + h / 2, 15, markP);
    return G(body, { opacity: Math.min(1, o), transform: around(x + w / 2, y + h / 2, Math.min(1.08, o)) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cWrong = sn ? sc(sn, 0, "wrong") : null, cBug = sn ? sc(sn, 0, "bug") : null;
    var cRun = sn ? sc(sn, 1, "run") : null, cFix = sn ? sc(sn, 1, "fix") : null,
      cAgain = sn ? sc(sn, 1, "again") : null, cFriend = sn ? sc(sn, 1, "friend") : null;
    var rows = sn ? tally(t, cWrong, 3, 0.7) : 3;
    var mended = sn ? dtPast(t, cFix) : true;

    out += R(12, 12, 336, 180, 24, P.card, P.line, 3);
    ["grow", "spin", "jump"].forEach(function (id, k) {
      var live = k === 1;
      var use = live && mended ? "jump" : id;
      out += dtTile(28, 26 + k * 54, 304, 44, use,
        k < rows ? 1 : 0,
        live ? (mended ? P.good : sn && dtPast(t, cBug) ? P.bad : null) : null,
        live ? (mended ? "tick" : "bug") : null,
        sn ? popIn(t, mended ? cFix : cBug, 0.4) : 1);
    });

    /* run it, and run it again */
    var pr = sn ? popIn(t, cRun, 0.4) : 1, pa = sn ? popIn(t, cAgain, 0.4) : 1;
    out += MK.pop(R(28, 210, 128, 50, 16, P.cell, P.good, 3) + Em(58, 235, 26, "▶️") +
      Tx(80, 243, "Run", "lab", "start", { "font-size": 22 }), 92, 235, pr);
    out += MK.pop(Em(212, 235, 46, "\u{1F501}"), 212, 235, pa);

    /* the two who looked at it together */
    var pf = sn ? popIn(t, cFriend, 0.45) : 1;
    out += MK.pop(Em(112, 306, 86, "\u{1F466}\u{1F3FE}"), 112, 306, pf);
    out += MK.pop(Em(248, 306, 86, "\u{1F467}\u{1F3FE}"), 248, 306, pf);
    out += MK.pop(Em(180, 268, 34, "\u{1F4AC}"), 180, 268, pf);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A three block program with a bug on the middle block, and two children looking at it together">' + out + "</svg>";
  }

  /* ==== chapter: run it first =====================================================
     The lesson's first debugging round. Goal: grow, then jump twice. Program:
     grow, spin, jump. Run it and watch; the dog spins where we wanted a jump;
     the spin block goes out and a jump block grows into its place; run it again. */
  var DT_R1 = ["grow", "spin", "jump"];
  var DT_R1_FIX = ["grow", "jump", "jump"];
  var DT_R1_ST = dtStates(DT_R1);
  var DT_R1F_ST = dtStates(DT_R1_FIX);

  function dtRunChapter(scene, beat, t, i) {
    var cTop = sc(scene, 0, "top"), cGoal = sc(scene, 0, "goal");
    var cProg = sc(scene, 1, "program"), cRun = sc(scene, 1, "run"), cWatch = sc(scene, 1, "watch");
    var cGrow = sc(scene, 2, "grow"), cSpin = sc(scene, 2, "spin"), cJump = sc(scene, 2, "jump");
    var cNotgoal = sc(scene, 3, "notgoal"), cLook = sc(scene, 3, "look");
    var cSecond = sc(scene, 4, "second"), cWanted = sc(scene, 4, "wanted"), cBug = sc(scene, 4, "bug");
    var cOut = sc(scene, 5, "out"), cIn = sc(scene, 5, "in");
    var cAgain = sc(scene, 6, "again"), cMoves = sc(scene, 6, "moves"), cDone = sc(scene, 6, "done");
    var out = "";

    var fixed = dtPast(t, cIn);
    var ids = fixed ? DT_R1_FIX : DT_R1, states = fixed ? DT_R1F_ST : DT_R1_ST;
    var times, dur;
    if (dtPast(t, cMoves)) { times = [cMoves, cMoves + 0.6, cMoves + 1.2]; dur = 0.55; }
    else if (fixed) { times = [null, null, null]; dur = 0.55; }
    else { times = [cGrow, cSpin, cJump]; dur = 0.6; }
    var r = dtRunState(ids, states, times, dur, t);
    var running = dtPast(t, cMoves);

    /* the goal, and the flash when the voice says what we wanted */
    out += dtGoalCard("grow, then jump twice", on(t, cTop, 0.5), on(t, cGoal, 0.5),
      { flash: bump(t, cWanted, 1.4) });

    /* the empty stage and the three waiting places, from the chapter's first
       words: the program then fills them rather than arriving in a blank page */
    var chapIn = inAt(t, BEATS[scene.first].start, 0.7);
    out += G(R(DT_STAGE.x, DT_STAGE.y, DT_STAGE.w, DT_STAGE.h, 22, P.card, P.line, 2) +
      R(DT_STAGE.x + 18, DT_STAGE.y + DT_STAGE.h - 46, DT_STAGE.w - 36, 12, 6, P.cell),
      { opacity: chapIn * (1 - on(t, cProg, 0.45)) });

    /* the three blocks. Block 2 is the one that is taken out and replaced, so
       it is drawn on its own: it shrinks away about the centre of its own slot
       and the jump block grows into the slot it left. */
    var lift = on(t, cOut, 0.5) * 12,
      gone = on(t, cOut == null ? null : cOut + 0.5, 0.6),
      drop = on(t, cIn == null ? null : cIn + 0.35, 0.5);
    var slotC = [DT_PANEL.x + DT_PANEL.w / 2, dtRowY(1) + DT_ROW.h / 2];
    function rowIn(k) { return on(t, cProg == null ? null : cProg + k * 0.22, 0.4); }
    function ranCol(k) { return running && times[k] != null && t >= times[k] ? P.good : null; }
    function ranMark(k) { return running && times[k] != null && t >= times[k] ? "tick" : null; }
    function ranMarkP(k) { return popIn(t, running ? times[k] : null, 0.35); }
    function liveCol(k) { return !running && !dtPast(t, cNotgoal) && r.done === k + 1 ? P.gold : null; }

    [0, 1, 2].forEach(function (k) {
      out += dtSlot(DT_PANEL.x, dtRowY(k), DT_PANEL.w, DT_ROW.h, k + 1, chapIn * (1 - rowIn(k)));
    });
    [0, 2].forEach(function (k) {
      out += dtRow(DT_PANEL.x, dtRowY(k), DT_PANEL.w, DT_ROW.h, k + 1, DT_R1[k],
        { o: rowIn(k), col: ranCol(k) || liveCol(k), mark: ranMark(k), markP: ranMarkP(k) });
    });

    if (gone < 1) out += G(dtRow(DT_PANEL.x, dtRowY(1) - lift, DT_PANEL.w, DT_ROW.h, 2, "spin",
      { o: rowIn(1),
        col: dtPast(t, cOut) ? P.bad : dtPast(t, cSecond) ? P.gold : liveCol(1),
        mark: dtPast(t, cOut) ? "cross" : dtPast(t, cBug) ? "bug" : null,
        markP: popIn(t, dtPast(t, cOut) ? cOut : cBug, 0.4) }),
      { opacity: 1 - gone, transform: around(slotC[0], slotC[1] - lift, 1 - 0.34 * gone) });
    if (gone > 0) out += dtSlot(DT_PANEL.x, dtRowY(1), DT_PANEL.w, DT_ROW.h, 2, gone * (1 - drop));
    if (drop > 0) out += G(dtRow(DT_PANEL.x, dtRowY(1), DT_PANEL.w, DT_ROW.h, 2, "jump",
      { o: drop, col: ranCol(1) || P.good, mark: ranMark(1), markP: ranMarkP(1) }),
      { transform: around(slotC[0], slotC[1], 0.72 + 0.28 * drop) });
    /* the new block comes in from clear space beside the list, never across the
       block above it */
    out += MK.arrow(DT_GUTTER + 22, slotC[1], DT_GUTTER - 22, slotC[1],
      on(t, cIn, 0.3) * (1 - on(t, cIn == null ? null : cIn + 0.5, 0.4)), P.good, 8);
    out += MK.ripple(DT_PANEL.x + 52, dtRowY(1) + DT_ROW.h / 2, t, cSecond, P.gold);

    /* where to look: a bracket round the whole program, and a glass beside it */
    var looking = on(t, cLook, 0.5) * (1 - on(t, cSecond, 0.5));
    out += dtBracket(looking);
    /* the glass sits in the gutter, clear of the block beside it: at 52 it
       overlapped block two's border, which named the bug a beat early */
    out += MK.pop(Em(DT_GUTTER + 1, 260, 42, "\u{1F50D}"), DT_GUTTER + 1, 260, popIn(t, cLook, 0.45) * (1 - on(t, cSecond, 0.5)));

    /* the stage, the Run button and what the program actually did */
    out += dtStageDraw(r, on(t, cProg, 0.5),
      { lit: running || (dtPast(t, cGrow) && !dtPast(t, cNotgoal)),
        watch: popIn(t, cWatch, 0.45) * (1 - on(t, cNotgoal, 0.5)) });
    var hot = (dtPast(t, cGrow) && !dtPast(t, cNotgoal)) || (running && !dtPast(t, cDone));
    out += dtBtn(on(t, cRun, 0.4), hot);
    out += MK.ripple(DT_BTN_C[0], DT_BTN_C[1], t, cRun, P.good);
    out += MK.ripple(DT_BTN_C[0], DT_BTN_C[1], t, cAgain, P.good);

    out += MK.pill(DT_NOTE[0], DT_NOTE[1], "we wanted: jump", on(t, cWanted, 0.45) * (1 - on(t, cOut, 0.5)),
      { size: 24, col: P.gold, ink: P.gold });

    if (r.done > 0) {
      var capCol = dtPast(t, cDone) ? P.good : dtPast(t, cNotgoal) && !fixed ? P.bad : P.gold;
      out += MK.pill(DT_CAP[0], DT_CAP[1], ART.program.runWords(ids.slice(0, r.done)),
        on(t, times[r.done - 1], 0.4), { size: 24, col: capCol, ink: capCol });
    }
    out += MK.cross(DT_MARK, DT_CAP[1], 24, popIn(t, cNotgoal, 0.4) * (1 - on(t, cOut, 0.4)));
    out += MK.tick(DT_MARK, DT_CAP[1], 24, popIn(t, cDone, 0.4));
    return svg(out);
  }
