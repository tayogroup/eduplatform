  /* ==== Grade 3 Computing, Lesson 8: Mistakes Make Programs Better ============
     tools/lib/film-scenes/computing-g3/mistakes-make-programs-better.js, with
     -2.js and -3.js: the film's pictures, after the shared marks (MK) and
     before the engine's tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/mistakes-make-programs-better.json.

     TWO RULES THIS FILM IS BUILT ON, both of them about what a mark means in a
     film that is itself about mistakes:

     1. EVERY MARK LANDS ON A BLOCK. A bug, a cross or a red border is drawn on
        the block that is wrong, never on the cat, never on a child and never on
        a person's work as a whole. The two children in the partner chapter
        carry no mark of any kind but a tick beside the one who found the bug.
     2. A FIXED BLOCK FADES INTO ITS OWN SLOT. Nothing slides in from off the
        side and nothing moves the blocks above it, because in a film about
        fixing a mistake a picture that damages what is above it reads as a new
        bug. mbBlockSwap() draws the old block fading out and the new one fading
        in at exactly the same place.

     The programs are the lesson's own: round 1 of the two-bug debugger (goal
     shrink, jump, hide; program grow, jump, spin; bugs at 0 and 2) and round 2
     (repeat 3 times, spin, say hello, shrink), whose bug is the block after the
     repeat - which is what the lesson's own "think" step says to look for. The
     cat's sizes come from ART.run, the lesson's own arithmetic, so grow's x1.4
     and shrink's divide-by-1.4 are the kit's and not a copy.

     This file: the palette, the block and card drawings every chapter shares,
     the title motif, and the chapter "The debugging habit". Every top-level
     name here starts with mb, so nothing can replace a name of the engine, ART
     or MK. */

  var HUE = {
    title: P.teal, habit: P.gold, twobugs: P.accent, rules: P.plum,
    error: P.blue, partner: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* has this cue been reached? (a cue the beat never names is never reached) */
  function mbPast(t, at) { return at != null && t >= at; }
  /* a cue plus a delay, or null if the beat never names it */
  function mbAfter(at, d) { return at == null ? null : at + d; }

  /* ---- the lesson's blocks --------------------------------------------------- */

  /* the kit's three block categories, one colour each */
  var MB_CAT = { move: P.blue, look: P.plum, control: P.gold };

  /* One of the lesson's own blocks, drawn as a card: a number, the block's own
     icon and its own label, both read from the kit (ART.block).
     opt: {o, n, col, fill, fs, mark ("bug"|"tick"|"cross"), markP, dim} */
  function mbBlock(x, y, w, h, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var b = ART.block(id);
    var col = opt.col || MB_CAT[b.cat] || P.line;
    var fs = opt.fs || Math.min(26, h * 0.31);
    var ix = opt.n ? x + h * 0.84 : x + h * 0.46;
    var body = R(x, y, w, h, h * 0.24, opt.fill || P.cell, col, opt.sw || 3);
    if (opt.n) body += C(x + h * 0.34, y + h / 2, h * 0.20, P.card, col, 2) +
      Tx(x + h * 0.34, y + h / 2 + h * 0.08, String(opt.n), "lab", "middle", { fill: col, "font-size": h * 0.24 });
    body += Em(ix, y + h / 2, h * 0.46, b.icon) +
      Tx(ix + h * 0.36, y + h / 2 + fs * 0.36, b.label, "lab", "start", { "font-size": fs });
    var mx = x + w - h * 0.38, my = y + h / 2, mr = h * 0.26, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "bug") body += MK.pop(Em(mx, my, mr * 2.0, "\u{1F41B}"), mx, my, p);
    else if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dim ? 0.4 : 1) });
  }

  /* A block being put right: the wrong one fades out and the right one fades in
     AT THE SAME PLACE, so nothing above it moves. u is 0 before the fix and 1
     after it. */
  function mbBlockSwap(x, y, w, h, oldId, newId, u, oldOpt, newOpt) {
    u = clamp(u, 0, 1);
    var a = Object.assign({}, oldOpt || {}), b = Object.assign({}, newOpt || {});
    a.o = (a.o == null ? 1 : a.o) * (1 - u);
    b.o = (b.o == null ? 1 : b.o) * u;
    return mbBlock(x, y, w, h, oldId, a) + mbBlock(x, y, w, h, newId, b);
  }

  /* An empty numbered slot, for a step that has not been said yet. */
  function mbSlot(x, y, w, h, n, o) {
    if (!(o > 0)) return "";
    var badge = n == null ? "" :
      C(x + w / 2, y + h * 0.30, h * 0.11, P.card, P.line, 2) +
      Tx(x + w / 2, y + h * 0.30 + h * 0.05, String(n), "lab", "middle", { fill: P.muted, "font-size": h * 0.14 });
    return G(R(x, y, w, h, h * 0.24, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) + badge,
      { opacity: clamp(o, 0, 1) });
  }

  /* One of the five steps of the habit, in the lesson's own picture and words.
     opt: {o, col, lit, big} */
  function mbStepCard(x, y, w, h, n, pic, label, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.col || P.line, fs = opt.fs || Math.min(30, h * 0.15);
    return G(R(x, y, w, h, 22, opt.lit ? "#1B3A52" : P.card, col, opt.lit ? 4 : 2) +
      C(x + w / 2, y + h * 0.20, h * 0.105, P.cell, col, 2) +
      Tx(x + w / 2, y + h * 0.20 + h * 0.045, String(n), "lab", "middle", { fill: col === P.line ? P.muted : col, "font-size": h * 0.13 }) +
      Em(x + w / 2, y + h * 0.505, h * 0.30, pic) +
      Tx(x + w / 2, y + h * 0.855, label, "lab", "middle", { "font-size": fs }),
      { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, opt.lit ? 1.03 : 1) });
  }

  /* a line that grows from one end to the other, as one leg of a longer path */
  function mbLeg(x1, y1, x2, y2, u, col, w) {
    if (!(u > 0)) return "";
    return L(x1, y1, lerp(x1, x2, clamp(u, 0, 1)), lerp(y1, y2, clamp(u, 0, 1)), col || P.teal, w || 7);
  }

  /* An arc that draws itself from (x1, y) to (x2, y), bulging DOWN by lift.
     Pure: the dash offset is a function of u alone. */
  function mbArc(x1, y1, x2, y2, lift, u, col, w) {
    if (!(u > 0)) return "";
    var mx = (x1 + x2) / 2, len = Math.hypot(x2 - x1, y2 - y1) + Math.abs(lift) * 1.7;
    var d = "M" + n2(x1) + "," + n2(y1) + " Q" + n2(mx) + "," + n2(y1 + lift) + " " + n2(x2) + "," + n2(y2);
    return Pth(d, null, col || P.bad, w || 6,
      { "stroke-dasharray": n2(len) + " " + n2(len), "stroke-dashoffset": n2(len * (1 - clamp(u, 0, 1))) });
  }

  /* ==== the title motif =======================================================
     The lesson in one picture: a three-block program whose spin block carries a
     bug, a spanner, and the block it should have been, ticked. Standing still
     on both cards; in the spoken title chapter the blocks arrive on "You run
     your program", the spin block turns red as it is named, the block that was
     wanted appears on "should have jumped", the bug lands on "That is a bug"
     and the spanner on "called debugging". */
  var MB_MOTIF = ["repeat3", "spin", "say"];

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cRun = sn ? sc(sn, 0, "run") : null, cSpin = sn ? sc(sn, 0, "spin") : null,
      cJump = sn ? sc(sn, 0, "jump") : null, cBug = sn ? sc(sn, 1, "bug") : null,
      cDebug = sn ? sc(sn, 1, "debug") : null;
    var shown = sn ? tally(t, cRun, 3, 0.8) : 3;
    var bad = sn ? on(t, cSpin, 0.5) : 1;
    var want = sn ? popIn(t, cJump, 0.45) : 1;
    var bug = sn ? popIn(t, cBug, 0.45) : 1;
    var wr = sn ? popIn(t, cDebug, 0.45) : 1;

    out += R(8, 26, 344, 308, 30, P.card, P.line, 3);
    /* the program: the three blocks, the second of them the one that spins */
    MB_MOTIF.forEach(function (id, k) {
      if (k >= shown) return;
      var col = k === 1 ? (bad > 0.5 ? P.bad : null) : null;
      out += mbBlock(30, 56 + k * 62, 200, 54, id, { col: col, fs: 19, sw: 3 });
    });
    if (bug > 0) out += MK.pop(Em(212, 145, 34, "\u{1F41B}"), 212, 145, bug);
    /* the spanner, and the block that was wanted */
    if (wr > 0) out += MK.pop(Em(288, 214, 42, "\u{1F527}"), 288, 214, wr);
    if (want > 0) out += G(mbBlock(30, 258, 200, 54, "jump", { col: P.good, fs: 19, sw: 3 }) +
      MK.tick(262, 285, 21, 1), { opacity: Math.min(1, want), transform: around(130, 285, Math.min(1.06, want)) });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A three block program whose spin block has a bug on it, a spanner, and the jump block it should have been">' + out + "</svg>";
  }

  /* ==== chapter: the debugging habit ==========================================
     The lesson's own five steps, in its own pictures and words, filling one at
     a time as they are named, with the loop back to the start drawn on "run
     again". Then the same five, smaller, while the film shows what happens if
     look is skipped: an arc that jumps straight from run it to fix, crossed;
     and under it the lesson's own program, where the block the child would
     change first (the repeat) is not the block that went wrong (the spin after
     it), which is exactly what the lesson's think step says. */
  var MB_HABIT = [
    { pic: "▶️", label: "run it" },
    { pic: "\u{1F440}", label: "look" },
    { pic: "\u{1F914}", label: "think" },
    { pic: "\u{1F527}", label: "fix" },
    { pic: "\u{1F501}", label: "run again" }
  ];
  var MB_HX = [50, 272, 494, 716, 938], MB_HW = 180;

  /* the five steps, each either a waiting slot or the step itself. A slot takes
     its number when the voice counts it; a step that has been named fills its
     own slot rather than arriving beside it. */
  function mbHabitRow(y, h, fill, live, numbered, slotO) {
    var out = "";
    MB_HABIT.forEach(function (s, k) {
      var f = clamp(fill[k], 0, 1);
      if (f < 1) out += mbSlot(MB_HX[k], y, MB_HW, h, k < numbered ? k + 1 : null, slotO * (1 - f));
      if (f > 0) out += mbStepCard(MB_HX[k], y, MB_HW, h, k + 1, s.pic, s.label,
        { o: f, col: live === k ? P.gold : P.line, lit: live === k, fs: h > 170 ? 29 : 23 });
    });
    return out;
  }

  function mbHabitMain(scene, t) {
    var cHabit = sc(scene, 0, "habit"), cFive = sc(scene, 0, "five");
    var cRun = sc(scene, 1, "run"), cLook = sc(scene, 2, "look"), cThink = sc(scene, 2, "think");
    var cFix = sc(scene, 3, "fix"), cAgain = sc(scene, 3, "again");
    var at = [cRun, cLook, cThink, cFix, cAgain];
    var y = 104, h = 200, out = "";

    /* the habit itself: a soft band behind the five steps */
    var base = on(t, cHabit, 0.5);
    /* One plate behind all five steps: the habit is one thing. (A glow was
       tried here and is a circle, so it both spilled outside the 1168 x 440 box
       and put a spotlight on whichever step it happened to sit behind.) */
    if (base > 0) out += G(R(30, 86, 1108, 236, 34, P.gold, P.gold, 2,
      { "fill-opacity": 0.05, "stroke-opacity": 0.18 }), { opacity: base });

    /* the five empty slots are there from the first frame and brighten on "a
       habit"; they take their numbers as the voice counts "five steps", and
       each fills as its step is named */
    var numbered = tally(t, cFive, 5, 0.9);
    var fill = at.map(function (a) { return on(t, a, 0.45); });
    var live = -1;
    at.forEach(function (a, k) { if (mbPast(t, a)) live = k; });
    out += mbHabitRow(y, h, fill, live, numbered, 0.45 + 0.55 * base);

    /* the arrows between the steps, each drawn as the next step is named */
    for (var a = 0; a < 4; a++) {
      var u = on(t, at[a + 1], 0.4);
      out += MK.arrow(MB_HX[a] + MB_HW + 8, y + h / 2, MB_HX[a + 1] - 8, y + h / 2, u, P.gold, 6);
    }
    /* each step rings as it is named */
    at.forEach(function (a, k) { out += MK.ripple(MB_HX[k] + MB_HW / 2, y + h * 0.5, t, a, P.gold); });

    /* and round again: down from step five, back along, and up into step one */
    var lp = on(t, cAgain, 0.5);   /* short, so the loop is closed before the line ends */
    var legs = [76, 888, 68], tot = 1032, gone = lp * tot, o1 = clamp(gone / legs[0], 0, 1),
      o2 = clamp((gone - legs[0]) / legs[1], 0, 1), o3 = clamp((gone - legs[0] - legs[1]) / legs[2], 0, 1);
    out += mbLeg(MB_HX[4] + MB_HW / 2, y + h, MB_HX[4] + MB_HW / 2, 380, o1, P.teal, 7);
    out += mbLeg(MB_HX[4] + MB_HW / 2, 380, MB_HX[0] + MB_HW / 2, 380, o2, P.teal, 7);
    if (o3 > 0) out += MK.arrow(MB_HX[0] + MB_HW / 2, 380, MB_HX[0] + MB_HW / 2, y + h + 6, o3, P.teal, 7);
    if (lp > 0.55) out += Tx(584, 414, "and round again", "lab gold", "middle",
      { "font-size": 26, opacity: clamp((lp - 0.55) / 0.35, 0, 1) });
    return out;
  }

  /* the two beats about skipping look */
  var MB_SKIP_PROG = ["repeat3", "spin", "say"];

  function mbHabitSkip(scene, t) {
    var cSkip = sc(scene, 4, "skip"), cFirst = sc(scene, 4, "first");
    var cWatch = sc(scene, 5, "watch"), cBug = sc(scene, 5, "bug");
    var y = 40, h = 150, out = "";
    var skip = on(t, cSkip, 0.6), watch = on(t, cWatch, 0.5);

    /* the five steps, smaller; look and think go dim while they are skipped */
    var live = mbPast(t, cWatch) ? 1 : -1;
    MB_HABIT.forEach(function (s, k) {
      var faded = (k === 1 || k === 2) ? 1 - 0.62 * skip * (1 - watch) : 1;
      out += G(mbStepCard(MB_HX[k], y, MB_HW, h, k + 1, s.pic, s.label,
        { col: live === k ? P.gold : P.line, lit: live === k, fs: 23 }), { opacity: faded });
    });
    /* the jump straight from run it to fix, and the cross on it. Both go when
       look is found again: a mark that outlives what it marks is a new mistake */
    var arcO = skip * (1 - watch);
    if (arcO > 0.01) out += G(
      mbArc(MB_HX[0] + MB_HW / 2, y + h + 4, MB_HX[3] + MB_HW / 2, y + h + 4, 66, skip, P.bad, 6) +
      MK.cross(473, y + h + 54, 26, popIn(t, mbAfter(cSkip, 0.55), 0.4)), { opacity: arcO });
    /* look, found again */
    out += MK.ripple(MB_HX[1] + MB_HW / 2, y + h / 2, t, cWatch, P.gold);

    /* the lesson's own program: the first block you see is not the bug */
    var px = 175, pw = 258, pgap = 22, py = 330, ph = 78;
    MB_SKIP_PROG.forEach(function (id, k) {
      var x = px + k * (pw + pgap);
      var first = k === 0 && mbPast(t, cFirst) && !mbPast(t, cBug);
      out += mbBlock(x, py, pw, ph, id, {
        o: on(t, cSkip, 0.5), fs: 23,
        col: k === 1 && mbPast(t, cBug) ? P.bad : first ? P.gold : null,
        mark: k === 1 && mbPast(t, cBug) ? "bug" : null, markP: popIn(t, cBug, 0.4)
      });
      /* the block a child would change first: its own ring, in a colour no block
         category uses, and the spanner clear of the card above it */
      if (first) {
        out += R(x - 7, py - 7, pw + 14, ph + 14, 26, "none", P.accent, 4, { opacity: on(t, cFirst, 0.4) });
        out += MK.pop(Em(x + pw / 2, py - 30, 36, "\u{1F527}"), x + pw / 2, py - 30, popIn(t, cFirst, 0.4));
      }
    });
    /* the block that did go wrong: the one after the repeat */
    if (mbPast(t, cBug)) out += MK.leader(MB_HX[1] + MB_HW / 2, y + h + 12,
      px + pw + pgap + pw / 2, py - 12, on(t, mbAfter(cBug, 0.1), 0.6), P.gold);
    return out;
  }

  function mbHabitChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(mbHabitMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(mbHabitSkip(scene, t), { opacity: u });
    return svg(out);
  }
