  /* ==== Grade 4 Computing, Lesson 1: Loops in Algorithms ======================
     tools/lib/film-scenes/computing-g4/loops-in-algorithms.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/loops-in-algorithms.json.

     EVERY COUNT IN THIS FILM COMES FROM THE LESSON'S OWN RULES. Computing has
     no ART.sim, so the algorithm lists, the loop boxes, the counter dial, the
     traffic light and the plants are drawn here in the engine's idiom - but
     the arithmetic is the kit's: ART.algo.flatten unrolls a repeat box and a
     forever box (and puts the lesson's own Stop at the end of the forever
     one), and ART.algo.expandLoop writes the nine and the twelve steps out
     long. Nothing in this film counts a turn for itself, so no number here can
     disagree with the lesson that runs the same algorithm.

     This file: the palette, the step vocabulary, the row and loop-box
     drawings, the counter dial, the title motif and the chapter "Going round a
     loop". Every top-level name starts with lp, so nothing can replace a name
     of the engine, ART or MK. */

  var HUE = {
    title: P.teal, loop: P.gold, count: P.blue, forever: P.accent,
    inside: P.plum, concise: P.good, third: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------- */

  /* 0 -> 1 from the chapter's beat k on */
  function lpFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function lpPast(t, at) { return at != null && t >= at; }
  /* the later of two cues that have been reached, or null */
  function lpLast(t) {
    var best = null;
    for (var k = 1; k < arguments.length; k++) {
      var a = arguments[k];
      if (a != null && t >= a && (best == null || a > best)) best = a;
    }
    return best;
  }

  /* ---- the steps, in the lesson's own words ------------------------------
     Every label is the label the lesson's own s() gives the step. Two pictures
     are drawn rather than taken: the lesson gives "Get the watering can" a
     shower head and "Tip the can upside down" an upside-down face, and neither
     is the thing the words name (reported, not fixed - the lesson is not
     ours). The traffic-light steps carry the lesson's own colour swatches. */
  var LP_STEP = {
    can:      { draw: "can",  label: "Get the watering can" },
    fill:     { pic: "\u{1F4A7}", label: "Fill the can" },
    pour:     { pic: "\u{1F331}", label: "Pour on a plant" },
    walk:     { pic: "\u{1F6B6}", label: "Walk to the next plant" },
    away:     { pic: "\u{1F6AA}", label: "Put the can away" },
    tip:      { draw: "tip",  label: "Tip the can upside down" },
    paste:    { pic: "\u{1F9B7}", label: "Put paste on the brush" },
    top:      { pic: "\u{1F9B7}", label: "Brush the top teeth" },
    bottom:   { pic: "\u{1F9B7}", label: "Brush the bottom teeth" },
    rinse:    { pic: "\u{1F4A7}", label: "Rinse" },
    red:      { disc: ["#D93F3F"], label: "Red" },
    redamber: { disc: ["#D93F3F", "#F2A93B"], label: "Red and amber" },
    green:    { disc: ["#3FB06B"], label: "Green" },
    amber:    { disc: ["#F2A93B"], label: "Amber" },
    stop:     { pic: "\u{1F6D1}", label: "Stop" }
  };
  var LP_LIGHT = { red: "#D93F3F", amber: "#F2A93B", green: "#3FB06B", off: "#2A3742" };

  /* one or two of the lesson's own colour discs, side by side */
  function lpDiscs(cx, cy, size, cols) {
    var r = size * 0.30, gap = r * 2.2, out = "";
    var x0 = cx - (cols.length - 1) * gap / 2;
    for (var k = 0; k < cols.length; k++) out += C(x0 + k * gap, cy, r, cols[k], "#0B1D2C", 1.6);
    return out;
  }

  /* a watering can, upright or tipped over and emptying */
  function lpCan(cx, cy, size, tipped) {
    var sc1 = size / 46;
    var body = Pth("M-17,-3 L-14,15 Q-13,20 -8,20 L8,20 Q13,20 14,15 L17,-3 Z", "#7FA8C4", "#3D5E77", 2.4) +
      R(-19, -10, 38, 8, 3, "#9CC0D8", "#3D5E77", 2.4) +
      Pth("M-7,-10 Q0,-24 9,-11", null, "#3D5E77", 3) +
      Pth("M15,0 L27,-12 L31,-8 L19,4 Z", "#7FA8C4", "#3D5E77", 2.2) +
      C(29, -10, 5, "#9CC0D8", "#3D5E77", 2);
    var out = G(body, { transform: tr(cx, cy, sc1) + (tipped ? " rotate(148)" : "") });
    if (tipped) out += G(C(0, 0, 3.4, "#6E9DE8") + C(8, 9, 2.8, "#6E9DE8") + C(-6, 11, 2.4, "#6E9DE8"),
      { transform: tr(cx - size * 0.24, cy + size * 0.32, sc1) });
    return out;
  }

  function lpPic(cx, cy, size, st) {
    if (st.disc) return lpDiscs(cx, cy, size, st.disc);
    if (st.draw) return lpCan(cx, cy, size, st.draw === "tip");
    return Em(cx, cy, size, st.pic);
  }

  /* ---- one row of an algorithm -------------------------------------------
     A number, the step's picture and the lesson's own words for it.
     opt: {o, col (a border and number colour), fill, mark ("tick"|"cross"|
     "bug"), markP, dimmed, fs} */
  function lpRow(x, y, w, h, n, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var st = LP_STEP[id] || { pic: "", label: String(id) };
    var col = opt.col || P.line, sw = opt.col ? 3.5 : 2;
    var fs = opt.fs || Math.min(23, h * 0.36);
    var body = R(x, y, w, h, h * 0.28, opt.fill || P.cell, col, sw);
    if (n != null) body += C(x + h * 0.46, y + h / 2, h * 0.25, P.card, col, 2) +
      Tx(x + h * 0.46, y + h / 2 + h * 0.10, String(n), "lab", "middle",
        { fill: opt.col || P.muted, "font-size": h * 0.30 });
    var px = n == null ? x + h * 0.44 : x + h * 1.06;
    body += lpPic(px, y + h / 2, h * 0.52, st) +
      Tx(px + h * 0.46, y + h / 2 + fs * 0.35, st.label, "lab", "start", { "font-size": fs });
    var mx = x + w - h * 0.40, my = y + h / 2, mr = h * 0.25, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    else if (opt.mark === "bug") body += MK.pop(Em(mx, my, mr * 1.9, "\u{1F41B}"), mx, my, p);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dimmed ? 0.4 : 1) });
  }

  /* an empty slot, for a step that is about to be put back */
  function lpSlot(x, y, w, h, n, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.28, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      C(x + h * 0.46, y + h / 2, h * 0.25, P.card, P.line, 2) +
      Tx(x + h * 0.46, y + h / 2 + h * 0.10, String(n), "lab", "middle", { fill: P.muted, "font-size": h * 0.30 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the loop box -------------------------------------------------------
     The lesson draws a repeat or forever block as a box with a header - its
     structHtml writes "repeat 4 times - time 2 of 4" and "forever - round 3" -
     and the body indented inside it. The same box, drawn here.
     opt: {kind, times, turn (null while it is not running), o, col, pad, head} */
  var LP_HEAD = 42, LP_PAD = 11;
  function lpBoxH(n, rowH, gap) { return LP_HEAD + LP_PAD + n * rowH + (n - 1) * gap + LP_PAD; }
  function lpBoxTop(y, k, rowH, gap) { return y + LP_HEAD + LP_PAD + k * (rowH + gap); }
  function lpBoxHead(kind, times, turn) {
    if (kind === "forever") return "forever" + (turn ? " · round " + turn : "");
    return "repeat " + times + " times" + (turn ? " · time " + turn + " of " + times : "");
  }
  function lpBox(x, y, w, n, rowH, gap, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var h = lpBoxH(n, rowH, gap), col = opt.col || P.gold;
    var icon = opt.kind === "forever" ? "♾️" : "\u{1F501}";
    var out = R(x, y, w, h, 20, "rgba(244,201,93,0.07)", col, 3) +
      R(x, y, w, LP_HEAD, 20, "none", null, null) +
      L(x + 2, y + LP_HEAD, x + w - 2, y + LP_HEAD, col, 2, { opacity: 0.5 }) +
      Em(x + 26, y + LP_HEAD / 2, 26, icon) +
      Tx(x + 48, y + LP_HEAD / 2 + 8, lpBoxHead(opt.kind, opt.times, opt.turn), "lab", "start",
        { "font-size": 23, fill: col });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- the counter --------------------------------------------------------
     What a count-controlled loop has and a forever loop has not: a dial with
     one pip per turn, and the count in the middle. n null draws the empty
     dial a forever loop would need, with nothing to put in it. */
  function lpCounter(cx, cy, r, n, value, o, opt) {
    opt = opt || {};
    if (!(o > 0)) return "";
    var col = opt.col || P.gold, out = "";
    out += C(cx, cy, r, P.card, n == null ? P.line : col, 3, n == null ? { "stroke-dasharray": "9 8" } : null);
    if (n != null) {
      /* the pips sit on a ring that is a share of the dial, not a fixed 15 px
         in from its rim: at the motif's r = 28 a fixed inset put all four on
         top of the number and the dial read as a gold flower. */
      for (var k = 0; k < n; k++) {
        var a = -Math.PI / 2 + k * 2 * Math.PI / n;
        var px = cx + Math.cos(a) * r * 0.72, py = cy + Math.sin(a) * r * 0.72;
        out += C(px, py, r * 0.155, k < value ? col : P.cell, k < value ? col : P.line, 2);
      }
      out += Tx(cx, cy + r * 0.28, String(value), "lab", "middle", { "font-size": r * 0.86, fill: col });
    } else {
      out += Tx(cx, cy + r * 0.22, "–", "lab", "middle", { "font-size": r * 0.8, fill: P.muted });
    }
    var lab = opt.label == null ? "counter" : opt.label;
    if (lab) out += Tx(cx, cy + r + 30, lab, "lab mid muted readable", "middle");
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- the plants ---------------------------------------------------------
     Three plants on the ground, as the lesson's watering task has them: one is
     poured on each turn round the loop. spill is the water the tipped can puts
     on the floor. */
  var LP_PLANT_X = [716, 898, 1080], LP_GROUND = 352;
  /* watered: the plant has had its pour. ticked: that turn went right - a turn
     that also emptied the can on the floor has not. spilt: the water the
     tipped can put on the floor. */
  function lpPlants(watered, ticked, spilt, t, opt) {
    opt = opt || {};
    var out = R(628, LP_GROUND, 520, 46, 8, "#3E8E4A");
    for (var k = 0; k < LP_PLANT_X.length; k++) {
      var x = LP_PLANT_X[k], grown = watered > k;
      if (spilt > k) out += E(x, LP_GROUND + 30, 42, 11, "#6E9DE8", null, null, { opacity: 0.85 });
      out += Pth("M" + n2(x - 26) + "," + n2(LP_GROUND + 2) + " h52 l-8,-34 h-36 Z", "#C76B3B", "#A9552B", 2);
      out += Em(x, LP_GROUND - 54, grown ? 62 : 46, "\u{1F331}");
      if (ticked > k) out += MK.tick(x + 34, LP_GROUND - 92, 17, 1);
    }
    if (opt.canAt != null) {
      var cxf = lerp(LP_PLANT_X[0], LP_PLANT_X[2], clamp(opt.canAt, 0, 2) / 2) - 6;
      out += lpCan(cxf, LP_GROUND - 126, 62, !!opt.tipped);
      if (opt.pour > 0) out += G(C(0, 0, 4, "#6E9DE8") + C(6, 17, 3.4, "#6E9DE8") + C(-5, 32, 3, "#6E9DE8"),
        { transform: tr(cxf + 20, LP_GROUND - 100 + 22 * opt.pour), opacity: opt.pour });
    }
    return out;
  }

  /* ==== the title motif =====================================================
     Two steps in a loop box with a counter on it, and, under it, the same box
     with no count at all: the whole lesson in one picture. In the spoken title
     chapter each piece arrives as it is named; on the two cards it stands
     still. */
  function lpTile(x, y, w, h, pic, label, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.26, P.cell, col || P.line, 3) +
      Em(x + h * 0.55, y + h / 2, h * 0.56, pic) +
      Tx(x + h * 0.95, y + h / 2 + 7, label, "lab", "start", { "font-size": 19 }),
      { transform: around(x + w / 2, y + h / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cRepeat = sn ? sc(sn, 0, "repeat") : null, cTop = sn ? sc(sn, 0, "top") : null,
      cBottom = sn ? sc(sn, 0, "bottom") : null, cRound = sn ? sc(sn, 0, "round") : null,
      cLoop = sn ? sc(sn, 1, "loop") : null, cCount = sn ? sc(sn, 1, "count") : null,
      cNever = sn ? sc(sn, 1, "never") : null;
    var pHead = sn ? popIn(t, cRepeat, 0.4) : 1, pA = sn ? popIn(t, cTop, 0.4) : 1,
      pB = sn ? popIn(t, cBottom, 0.4) : 1, spin = sn ? on(t, cRound, 0.5) : 1;
    var low = sn ? popIn(t, cNever, 0.45) : 1, cnt = sn ? on(t, cCount, 0.5) : 1,
      box2 = sn ? popIn(t, cLoop, 0.4) : 1;

    out += R(6, 10, 348, 340, 30, P.card, P.line, 3);
    /* the counted loop */
    out += G(R(24, 34, 250, 132, 20, "rgba(244,201,93,0.10)", P.gold, 3) +
      Tx(40, 62, "repeat 4 times", "lab", "start", { "font-size": 19, fill: P.gold }),
      { opacity: Math.min(1, pHead) });
    out += lpTile(40, 74, 218, 38, "\u{1F9B7}", "brush the top", pHead && pA, P.gold);
    out += lpTile(40, 118, 218, 38, "\u{1F9B7}", "brush the bottom", pHead && pB, P.gold);
    out += G(Pth("M292,64 a34,34 0 1,1 -18,-30", null, P.gold, 7) +
      Pth("M266,22 L276,36 L259,41 Z", P.gold, P.gold, 2), { opacity: spin });
    out += lpCounter(314, 130, 28, 4, 4, cnt, { label: "" });
    /* the loop with no count */
    out += G(R(24, 196, 250, 126, 20, "rgba(233,116,79,0.10)", P.accent, 3) +
      Tx(40, 224, "forever", "lab", "start", { "font-size": 19, fill: P.accent }),
      { opacity: Math.min(1, box2) });
    out += lpTile(40, 236, 218, 34, "\u{1F6A6}", "red, amber, green", box2, P.accent);
    out += lpTile(40, 276, 218, 34, "♾️", "round and round", box2, P.accent);
    out += lpCounter(314, 282, 28, null, 0, low, { label: "" });
    out += MK.cross(314, 282, 21, low);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A repeat loop with a counter, and a forever loop with none">' + out + "</svg>";
  }

  /* ==== chapter: going round a loop =========================================
     The lesson's watering algorithm - get the can, repeat 3 times [fill, pour,
     walk], put the can away - with the loop box round the three repeated
     steps, the return arrow from the last of them back to the first, and the
     counter. The turns are ART.algo.flatten's, so the three turns on screen
     are the three the lesson would run. */
  var LP_WATER_BLOCKS = [
    { id: "can" },
    { kind: "repeat", times: 3, body: [{ id: "fill" }, { id: "pour" }, { id: "walk" }] },
    { id: "away" }
  ];
  /* the lesson's own unrolling: 1 + 3 x 3 + 1 = eleven steps, the figure the
     lesson's "Repetition makes it concise" step quotes */
  var LP_WATER_FLAT = ART.algo.flatten(LP_WATER_BLOCKS);
  var LP_WATER_TURNS = LP_WATER_BLOCKS[1].times;

  var LP_LOOP = { x: 40, w: 520, rowH: 58, bodyH: 56, bodyGap: 8, gap: 12 };
  /* where each of the five rows sits: can, the box (3 rows inside), away */
  function lpLoopLayout() {
    var y = 22, out = { can: y };
    y += LP_LOOP.rowH + LP_LOOP.gap;
    out.box = y;
    y += lpBoxH(3, LP_LOOP.bodyH, LP_LOOP.bodyGap) + LP_LOOP.gap;
    out.away = y;
    out.bottom = y + LP_LOOP.rowH;
    return out;
  }
  var LP_LOOP_Y = lpLoopLayout();
  var LP_BODY_X = LP_LOOP.x + 26, LP_BODY_W = LP_LOOP.w - 52;

  function lpLoopChapter(scene, beat, t, i) {
    var cLoop = sc(scene, 0, "loop"), cAgain = sc(scene, 0, "again");
    var cThree = sc(scene, 1, "three"), cFill = sc(scene, 1, "fill"),
      cPour = sc(scene, 1, "pour"), cWalk = sc(scene, 1, "walk");
    var cLast = sc(scene, 2, "last"), cBack = sc(scene, 2, "back");
    var cCount = sc(scene, 3, "count"), cTimes = sc(scene, 3, "three");
    var out = "", body = ["fill", "pour", "walk"], bodyAt = [cFill, cPour, cWalk];

    /* the turns: one on beat 1 as the three steps are named, then all three
       counted on beat 3. Both are read off the lesson's own flat list. */
    var running = lpPast(t, cCount);
    var doneSteps = running ? tally(t, cCount, LP_WATER_FLAT.length - 2, 2.7)
      : lpPast(t, cWalk) ? 3 : lpPast(t, cPour) ? 2 : lpPast(t, cFill) ? 1 : 0;
    var item = doneSteps > 0 ? LP_WATER_FLAT[doneSteps] : null;   /* [0] is "can" */
    var turn = item && item.t ? item.t : running ? 1 : 0;
    var watered = running ? Math.min(LP_WATER_TURNS, Math.floor((doneSteps + 1) / 3))
      : lpPast(t, cPour) ? 1 : 0;

    /* the algorithm */
    var showAll = on(t, cLoop, 0.5);
    out += lpRow(LP_LOOP.x, LP_LOOP_Y.can, LP_LOOP.w, LP_LOOP.rowH, 1, "can", { o: showAll });
    out += lpBox(LP_LOOP.x, LP_LOOP_Y.box, LP_LOOP.w, 3, LP_LOOP.bodyH, LP_LOOP.bodyGap,
      { o: showAll, kind: "repeat", times: LP_WATER_TURNS, turn: turn || null,
        col: bump(t, cAgain, 1.4) > 0.05 || bump(t, cTimes, 1.4) > 0.05 ? P.ink : P.gold });
    body.forEach(function (id, k) {
      var by = lpBoxTop(LP_LOOP_Y.box, k, LP_LOOP.bodyH, LP_LOOP.bodyGap);
      var named = on(t, bodyAt[k], 0.4);
      var live = item && item.j === k;
      out += lpRow(LP_BODY_X, by, LP_BODY_W, LP_LOOP.bodyH, k + 2, id,
        { o: Math.max(showAll * 0.5, named), col: live ? P.gold : null,
          fill: live ? "#1B3A52" : null });
      out += MK.ripple(LP_BODY_X + 40, by + LP_LOOP.bodyH / 2, t, bodyAt[k], P.gold);
    });
    out += lpRow(LP_LOOP.x, LP_LOOP_Y.away, LP_LOOP.w, LP_LOOP.rowH, 5, "away", { o: showAll });
    /* "these three steps": the body glows as one */
    var three = bump(t, cThree, 1.6);
    if (three > 0.02) out += R(LP_BODY_X - 8, lpBoxTop(LP_LOOP_Y.box, 0, LP_LOOP.bodyH, LP_LOOP.bodyGap) - 8,
      LP_BODY_W + 16, 3 * LP_LOOP.bodyH + 2 * LP_LOOP.bodyGap + 16, 18, "none", P.ink, 3, { opacity: three * 0.9 });

    /* the last step in the loop, and the way back to the first */
    var lastY = lpBoxTop(LP_LOOP_Y.box, 2, LP_LOOP.bodyH, LP_LOOP.bodyGap) + LP_LOOP.bodyH / 2;
    var firstY = lpBoxTop(LP_LOOP_Y.box, 0, LP_LOOP.bodyH, LP_LOOP.bodyGap) + LP_LOOP.bodyH / 2;
    if (bump(t, cLast, 1.5) > 0.02) out += R(LP_BODY_X - 5, lastY - LP_LOOP.bodyH / 2 - 5, LP_BODY_W + 10,
      LP_LOOP.bodyH + 10, 20, "none", P.ink, 3, { opacity: bump(t, cLast, 1.5) });
    var bk = on(t, cBack, 0.75);
    if (bk > 0) {
      var ax = LP_BODY_X + LP_BODY_W + 14, bend = ax + 52;
      out += Pth("M" + n2(ax) + "," + n2(lastY) + " C" + n2(bend) + "," + n2(lastY) + " " +
        n2(bend) + "," + n2(firstY) + " " + n2(ax) + "," + n2(firstY), null, P.gold, 5,
        { "stroke-dasharray": n2(340 * bk) + " 999" });
      if (bk > 0.85) out += Pth("M" + n2(ax) + "," + n2(firstY) + " L" + n2(ax + 15) + "," + n2(firstY - 10) +
        " L" + n2(ax + 15) + "," + n2(firstY + 10) + " Z", P.gold, P.gold, 2);
    }

    /* the three plants, and the can going round them */
    var canAt = running ? clamp((doneSteps - 1) / 3, 0, 2) : lpPast(t, cFill) ? 0 : null;
    var pouring = running ? (item && item.id === "pour" ? 1 : 0) : (lpPast(t, cPour) && !lpPast(t, cWalk) ? 1 : 0);
    out += G(lpPlants(watered, watered, 0, t, { canAt: canAt, pour: pouring }), { opacity: on(t, cFill, 0.6) });
    /* the counter, only once the film says the turns are counted */
    out += lpCounter(1055, 82, 52, LP_WATER_TURNS, turn, on(t, cCount, 0.5), { label: "turns counted" });
    return svg(out);
  }
