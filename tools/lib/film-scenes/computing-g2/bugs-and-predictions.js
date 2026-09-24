  /* ==== Grade 2 Computing, Lesson 2: Bugs and Predictions ======================
     tools/lib/film-scenes/computing-g2/bugs-and-predictions.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/bugs-and-predictions.json.

     TWO RULES THIS FILM IS BUILT ON.

     THE ORDER IS THE TEACHING. Every wrong order is drawn by handing the
     LESSON'S OWN scene the wrong list - ART.scene("tea", ["water"]) - so the
     kit paints the puddle and writes its own caption ("water on the table, not
     in a cup!"). The film draws no picture of a mistake of its own.

     THE MARK GOES ON THE STEP, NEVER ON A PERSON. A wrong step is crossed on
     its own row; a right step in the wrong PLACE is crossed on its NUMBER,
     because the number is the mistake. Nobody in this film is ever crossed.

     This file: the palette, the step table, the algorithm row every chapter
     shares, the boxes the lesson's scenes are drawn in, the title motif and
     the chapter "What you get at the end". Every top-level name here starts
     with bp, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, output: P.gold, bug: P.plum, fix: P.good,
    precise: P.accent, linear: P.blue, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* has this cue been reached? (a cue the beat never names is never reached) */
  function bpPast(t, at) { return at != null && t >= at; }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function bpFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 as beat k comes in, back to 0 as beat k + 1 does: for a thing that
     belongs to that beat alone (rule 7) */
  function bpOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }

  /* ---- the steps, in the lesson's own words ----------------------------------
     Every label is the text of the lesson's own step, and every picture its own
     emoji - except the tea bag, whose emoji in the lesson is a basket. The kit's
     tea scene draws the bag as a brown block on a string, so it is drawn that
     way here too, for the same reason order-matters draws the butter. */
  function bpPic(cx, cy, size, pic) {
    if (pic === "bag") {
      var w = size * 0.54, h = size * 0.46;
      return L(cx, cy - h * 0.1, cx + size * 0.30, cy - size * 0.40, "#F7F4EC", 2) +
        R(cx + size * 0.22, cy - size * 0.54, size * 0.22, size * 0.18, 3, "#F7F4EC") +
        R(cx - w / 2, cy - h * 0.1, w, h, size * 0.08, "#8B5A2B", "#5E3A1B", 2);
    }
    return Em(cx, cy, size, pic);
  }

  var BP_STEP = {
    apples2: { pic: "\u{1F34E}", label: "take 2 apples" },
    apples3: { pic: "\u{1F34E}", label: "take 3 more" },
    give:    { pic: "\u{1F91D}", label: "give 1 to Sami" },
    count5:  { pic: "\u{1F535}", label: "start with 5 counters" },
    countt:  { pic: "\u{1F535}", label: "take 2 away" },
    counta:  { pic: "\u{1F535}", label: "add 4" },
    cup:     { pic: "☕",    label: "get a cup" },
    sock:    { pic: "\u{1F9E6}", label: "put a sock in the cup" },
    bag:     { pic: "bag",       label: "put a tea bag in the cup" },
    water:   { pic: "\u{1F4A7}", label: "pour in the hot water" },
    milk:    { pic: "\u{1F95B}", label: "add a little milk" },
    tin:     { pic: "\u{1F96B}", label: "open the tin" },
    food:    { pic: "\u{1F944}", label: "spoon the food into the bowl" },
    floor:   { pic: "⬇️", label: "put the bowl on the floor" },
    call:    { pic: "\u{1F431}", label: "call the cat" }
  };

  /* One row of an algorithm: a number, the step's picture and its words.
     opt: {o, col (a border colour), numCol, fill, label, mark ("tick"|"cross"|
     "bug"), markP, numMark ("cross"|"bug"), numMarkP, dimmed} */
  function bpRow(x, y, w, h, n, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var st = BP_STEP[id] || { pic: "", label: String(id) };
    var col = opt.col || P.line, sw = opt.col ? 3.5 : 2;
    var fs = Math.min(24, h * 0.30), nc = opt.numCol || opt.col || P.muted;
    var body = R(x, y, w, h, h * 0.26, opt.fill || P.cell, col, sw) +
      C(x + h * 0.50, y + h / 2, h * 0.26, P.card, nc, 2) +
      Tx(x + h * 0.50, y + h / 2 + h * 0.11, String(n), "lab", "middle", { fill: nc, "font-size": h * 0.32 }) +
      bpPic(x + h * 1.16, y + h / 2, h * 0.50, st.pic) +
      Tx(x + h * 1.52, y + h / 2 + fs * 0.35, opt.label || st.label, "lab", "start", { "font-size": fs });
    var mx = x + w - h * 0.42, my = y + h / 2, mr = h * 0.26, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    else if (opt.mark === "bug") body += MK.pop(Em(mx, my, mr * 1.9, "\u{1F41B}"), mx, my, p);
    /* a right step in the WRONG PLACE: the number is what is wrong, so the mark
       goes on the number */
    var np = opt.numMarkP == null ? 1 : opt.numMarkP;
    if (opt.numMark === "cross") body += MK.cross(x + h * 0.50, my, mr * 0.92, np);
    else if (opt.numMark === "bug") body += MK.pop(Em(x + h * 0.50, my, mr * 1.7, "\u{1F41B}"), x + h * 0.50, my, np);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dimmed ? 0.42 : 1) });
  }

  /* an empty slot, for "four steps" before any of them is read out */
  function bpSlot(x, y, w, h, n, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.26, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      C(x + h * 0.50, y + h / 2, h * 0.26, P.card, P.line, 2) +
      Tx(x + h * 0.50, y + h / 2 + h * 0.11, String(n), "lab", "middle", { fill: P.muted, "font-size": h * 0.32 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the space every teaching chapter shares -------------------------------- */

  var BP_PANEL = { x: 44, w: 566 };
  var BP_BOX = { x: 660, y: 58, w: 448, h: 336 };     /* the kit's scenes are 320 x 240 */
  function bpBX(v) { return BP_BOX.x + v * BP_BOX.w / 320; }
  function bpBY(v) { return BP_BOX.y + v * BP_BOX.h / 240; }
  /* where the k-th of n rows sits; k may be fractional, so a row can slide */
  function bpRowY(k, n, h, gap) { return (440 - n * h - (n - 1) * gap) / 2 + k * (h + gap); }

  function bpScene(name, ids, o) {
    if (!(o > 0)) return "";
    return G(ART.place(ART.scene(name, ids), BP_BOX.x, BP_BOX.y, BP_BOX.w, BP_BOX.h) +
      R(BP_BOX.x, BP_BOX.y, BP_BOX.w, BP_BOX.h, 8, "none", P.line, 3), { opacity: clamp(o, 0, 1) });
  }
  /* the goal of the algorithm on the left, in the lesson's own words */
  function bpGoal(text, o, col) {
    return MK.pill(BP_PANEL.x, 34, text, o, { size: 22, anchor: "start", col: col || P.gold, ink: col || P.gold });
  }

  /* ==== the title ===============================================================
     Two cards, which are the two halves of the lesson: above, an algorithm and
     the output you can work out before you run it; below, the same tea
     algorithm the film debugs, with the bug marked on the step that is wrong
     and then edited into the step that belongs. On the two silent cards it
     stands still, in its finished state. */
  function bpMini(x, y, w, h, n, pic, o, col, label) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.30, P.cell, col || P.line, 3) +
      C(x + h * 0.52, y + h / 2, h * 0.28, P.card, col || P.line, 2) +
      Tx(x + h * 0.52, y + h / 2 + h * 0.11, String(n), "lab", "middle", { fill: col || P.muted, "font-size": h * 0.34 }) +
      bpPic(x + h * 1.22, y + h / 2, h * 0.56, pic) +
      (label ? Tx(x + h * 1.66, y + h / 2 + h * 0.12, label, "lab", "start", { "font-size": h * 0.34 }) : ""),
      { transform: around(x + w / 2, y + h / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cTwo = sn ? sc(sn, 0, "two") : null, cThree = sn ? sc(sn, 0, "three") : null,
      cGive = sn ? sc(sn, 0, "give") : null, cEnd = sn ? sc(sn, 0, "end") : null,
      cWork = sn ? sc(sn, 1, "work") : null, cWrong = sn ? sc(sn, 1, "wrong") : null,
      cFix = sn ? sc(sn, 1, "fix") : null;
    var p1 = sn ? popIn(t, cTwo, 0.4) : 1, p2 = sn ? popIn(t, cThree, 0.4) : 1,
      p3 = sn ? popIn(t, cGive, 0.4) : 1, pq = sn ? popIn(t, cEnd, 0.4) : 1,
      pw = sn ? popIn(t, cWork, 0.45) : 1, pb = sn ? popIn(t, cWrong, 0.45) : 1,
      pf = sn ? popIn(t, cFix, 0.45) : 1;

    /* above: three steps and the output you can say before you follow them */
    out += R(10, 16, 340, 162, 24, P.card, P.line, 3);
    out += bpMini(26, 32, 128, 38, 1, "\u{1F34E}", p1, P.gold);
    out += bpMini(26, 78, 128, 38, 2, "\u{1F34E}", p2, P.gold);
    out += bpMini(26, 124, 128, 38, 3, "\u{1F91D}", p3, P.gold);
    out += MK.arrow(166, 97, 210, 97, sn ? on(t, cEnd, 0.5) : 1, P.gold, 7);
    var done = pw > 0;
    out += G(R(224, 62, 108, 70, 18, P.cell, done ? P.good : P.line, 3) +
      Tx(278, 118, done ? "4" : "?", "lab", "middle", { "font-size": 54, fill: done ? P.good : P.muted }),
      { transform: around(278, 97, Math.min(1.08, Math.max(pq, pw))), opacity: Math.min(1, Math.max(pq, pw)) });
    out += Tx(278, 158, "output", "lab mid muted readable", "middle", { opacity: Math.min(1, pq) });

    /* below: the tea algorithm, its bug marked on the step, then edited */
    out += R(10, 190, 340, 158, 24, P.card, P.line, 3);
    var swapped = pf > 0;
    out += bpMini(26, 204, 308, 38, 1, "☕", pb, P.line);
    out += bpMini(26, 250, 308, 38, 2, swapped ? "bag" : "\u{1F9E6}", pb, swapped ? P.good : P.bad);
    out += bpMini(26, 296, 308, 38, 3, "\u{1F4A7}", pb, P.line);
    out += MK.cross(306, 269, 17, sn ? popIn(t, cWrong == null ? null : cWrong + 0.35, 0.35) * (1 - Math.min(1, pf)) : 0);
    out += MK.tick(306, 269, 17, Math.min(1.08, pf));
    return '<svg viewBox="0 0 360 360" role="img" aria-label="An algorithm whose output is four, and a tea algorithm with its wrong step corrected">' + out + "</svg>";
  }

  /* ==== chapter: what you get at the end ==========================================
     The lesson's own two prediction algorithms, both predicted and then
     checked: the apples of its demo, then the counters of its first question.
     The steps stand on the left; the output card on the right holds a question
     mark while the prediction is made, then counts along as the steps are
     followed with a finger. */
  var BP_OCARD = { x: 660, y: 84, w: 448, h: 272 };

  /* the things counted so far, and the number they come to */
  function bpCount(n, pic, o, col) {
    if (!(o > 0)) return "";
    var cx = BP_OCARD.x + BP_OCARD.w / 2, out = "", gap = 48;
    var left = cx - (n - 1) * gap / 2;
    for (var k = 0; k < n; k++) out += Em(left + k * gap, 196, 40, pic);
    out += Tx(cx, 318, String(n), "lab", "middle", { "font-size": 66, fill: col || P.gold });
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* the prediction: a question mark where the number will be */
  function bpGuess(o, pred) {
    if (!(o > 0)) return "";
    var cx = BP_OCARD.x + BP_OCARD.w / 2;
    return G(Em(cx - 108, 236, 66, "\u{1F52E}") +
      Tx(cx + 34, 262, "?", "lab", "middle", { "font-size": 96, fill: P.muted }) +
      MK.pill(cx, 336, "predict", pred, { size: 21, col: P.gold, ink: P.gold }),
      { opacity: clamp(o, 0, 1) });
  }

  var BP_OROW = { h: 88, gap: 20 };

  /* one half of the chapter: three steps, a prediction, then the count */
  function bpOutputHalf(scene, t, q) {
    if (!(q.o > 0)) return "";
    var out = "", rows = q.rows, at = q.rowAt, counts = q.counts, countAt = q.countAt;
    var right = popIn(t, q.right, 0.4);

    /* the card the output lands in */
    var cardIn = Math.max(on(t, q.card, 0.5), on(t, at[0], 0.4));
    out += G(R(BP_OCARD.x, BP_OCARD.y, BP_OCARD.w, BP_OCARD.h, 24, P.card, right > 0 ? P.good : P.line, right > 0 ? 4 : 3) +
      Tx(BP_OCARD.x + BP_OCARD.w / 2, BP_OCARD.y + 46, "output", "lab big muted readable", "middle"),
      { opacity: clamp(cardIn, 0, 1) });

    /* the name of the algorithm, and its steps */
    out += bpGoal("Algorithm", on(t, q.cap, 0.45));
    var n = rows.length, k, live = -1;
    for (k = 0; k < q.stepAt.length; k++) if (bpPast(t, q.stepAt[k])) live = k;
    for (k = 0; k < n; k++) {
      var y = bpRowY(k, n, BP_OROW.h, BP_OROW.gap);
      var ro = on(t, at[k], 0.45), so = on(t, q.slots, 0.5) * (1 - ro);
      out += bpSlot(BP_PANEL.x, y, BP_PANEL.w, BP_OROW.h, k + 1, so);
      out += bpRow(BP_PANEL.x, y, BP_PANEL.w, BP_OROW.h, k + 1, rows[k], { o: ro, col: live === k ? P.gold : null });
      out += MK.ripple(BP_PANEL.x + 46, y + BP_OROW.h / 2, t, at[k], P.gold);
    }

    /* the finger that follows the steps, one row at a time, moving as each
       step is done rather than as the count changes */
    if (q.finger != null) {
      var slot = 0;
      for (k = 1; k < q.stepAt.length; k++) slot += on(t, q.stepAt[k], 0.35);
      var fy = bpRowY(Math.min(slot, n - 1), n, BP_OROW.h, BP_OROW.gap);
      out += MK.finger(BP_PANEL.x + 46, fy + BP_OROW.h + 2, on(t, q.finger, 0.4));
    }

    /* the output: a question mark while it is predicted, then the count */
    var have = -1;
    for (k = 0; k < countAt.length; k++) if (bpPast(t, countAt[k])) have = k;
    if (bpPast(t, q.done)) have = counts.length - 1;
    if (have < 0) out += bpGuess(on(t, q.guess, 0.5), popIn(t, q.predict, 0.4));
    else out += bpCount(counts[have], q.pic, 1, right > 0 ? P.good : P.gold);
    out += MK.tick(BP_OCARD.x + BP_OCARD.w - 42, BP_OCARD.y + 42, 26, right);
    return G(out, { opacity: clamp(q.o, 0, 1) });
  }

  function bpOutputChapter(scene, beat, t, i) {
    var second = into(t, scene.first + 6), out = "";
    var aStep = [sc(scene, 3, "two"), sc(scene, 4, "three"), sc(scene, 4, "give")];
    var cSeq = sc(scene, 7, "seq");

    if (second < 1) out += bpOutputHalf(scene, t, {
      o: 1 - second, pic: "\u{1F34E}",
      card: sc(scene, 0, "output"), slots: sc(scene, 0, "done"), cap: sc(scene, 1, "algo"),
      rows: ["apples2", "apples3", "give"],
      rowAt: [sc(scene, 1, "two"), sc(scene, 1, "three"), sc(scene, 1, "give")],
      guess: sc(scene, 2, "say"), predict: sc(scene, 2, "predict"),
      finger: sc(scene, 3, "finger"), stepAt: aStep,
      counts: [2, 5, 4], countAt: [aStep[0], sc(scene, 4, "five"), sc(scene, 4, "four")],
      done: sc(scene, 5, "four"), right: sc(scene, 5, "right")
    });

    /* the second algorithm: the lesson's own five counters */
    if (second > 0) {
      var bStep = [cSeq, cSeq == null ? null : cSeq + 0.55, cSeq == null ? null : cSeq + 1.1];
      out += bpOutputHalf(scene, t, {
        o: second, pic: "\u{1F535}",
        card: sc(scene, 6, "try"), slots: sc(scene, 6, "try"), cap: sc(scene, 6, "try"),
        rows: ["count5", "countt", "counta"],
        rowAt: [sc(scene, 6, "five"), sc(scene, 6, "take"), sc(scene, 6, "add")],
        guess: sc(scene, 6, "try"), predict: sc(scene, 6, "add"),
        finger: cSeq, stepAt: bStep,
        counts: [5, 3, 7], countAt: bStep,
        done: sc(scene, 7, "out"), right: sc(scene, 7, "out")
      });
    }
    return svg(out);
  }
