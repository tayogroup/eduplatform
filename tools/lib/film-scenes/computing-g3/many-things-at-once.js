  /* ==== Grade 3 Computing, Lesson 6: Many Things at Once =====================
     tools/lib/film-scenes/computing-g3/many-things-at-once.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/many-things-at-once.json.

     COMPUTING HAS NO ART.sim, so the sprite stage here is DRAWN by the film -
     a ground, a sprite on it, a square of 76 - while every RULE it obeys is
     borrowed from the lesson kit:
       ART.run   move right is one square (MTO_SQ_RIGHT), grow is x1.4
                 (MTO_GROW), go home puts the cat back on nothing (MTO_HOME)
       ART.block  every block's own label, icon and category
       ART.program.expand  the repeat that repeated the wrong block, unrolled
     A stage the film draws and a rule the film borrows cannot disagree with
     the lesson; a rule retyped here could.

     THE ONE THING THIS FILM HAD TO WATCH, because it is a film about several
     things moving at once: two sprites never move over each other. The cat
     moves one square right (76) and the nearest other sprite is at least 180
     away, so at the closest moment of every chapter there is clear ground
     between them. Checked at the moment they are closest, not before and
     after.

     This file: the palette, the block chip and script card every chapter
     shares, the stage, the title motif, and the chapter "At the same time".
     Every top-level name here starts with mto. */

  var HUE = {
    title: P.teal, same: P.gold, tabs: P.blue, static: P.good,
    together: P.plum, mistakes: P.accent, recap: P.teal
  };

  /* ---- the lesson's own arithmetic, worked out once -------------------------- */
  var MTO_SQ = 76;                                                     /* a square, in film units */
  var MTO_SQ_RIGHT = ART.run(["\u{1F431}", "\u{1F436}"], ["right"], { sprite: 0 })[0].x;   /* 1 */
  var MTO_GROW = ART.run(["\u{1F333}"], ["say", "grow"])[0].scale;                          /* 1.4 */
  var MTO_HOME = ART.run(["\u{1F431}"], ["right", "right", "home"])[0].x;                   /* 0 */
  var MTO_LOST = ART.run(["\u{1F431}"], ["right", "right"])[0].x;                           /* 2 */
  var MTO_REPEAT = ART.program.expand(["repeat2", "spin", "jump"]);            /* spin, spin, jump */

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function mtoOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function mtoFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function mtoPast(t, at) { return at != null && t >= at; }
  /* a cue, d seconds later; still null if the beat never named it */
  function mtoAt(at, d) { return at == null ? null : at + d; }
  /* one hop: up and down again, finished in 0.55 s */
  function mtoHop(t, at) { return bump(t, at, 0.55); }

  /* ---- a block, drawn as the lesson's palette draws it ------------------------ */

  var MTO_BCOL = { move: P.blue, look: P.plum, control: P.gold };

  /* opt: {o, col (a border that overrides the category colour), fill, dim,
     mark ("tick"|"cross"), markP} */
  function mtoBlock(x, y, w, h, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var b = ART.block(id);
    var col = opt.col || MTO_BCOL[b.cat] || P.line;
    var fs = Math.min(25, h * 0.44);
    var body = R(x, y, w, h, h * 0.30, opt.fill || P.cell, col, opt.col ? 4 : 2) +
      Em(x + h * 0.56, y + h / 2, h * 0.50, b.icon) +
      Tx(x + h * 1.05, y + h / 2 + fs * 0.35, b.label, "lab", "start", { "font-size": fs });
    if (opt.mark === "tick") body += MK.tick(x + w - h * 0.46, y + h / 2, h * 0.26, opt.markP == null ? 1 : opt.markP);
    else if (opt.mark === "cross") body += MK.cross(x + w - h * 0.46, y + h / 2, h * 0.26, opt.markP == null ? 1 : opt.markP);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dim ? 0.4 : 1), transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)) });
  }

  /* an empty slot, for a script that has no blocks in it yet */
  function mtoSlot(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, h * 0.30, P.card, P.line, 2, { "stroke-dasharray": "10 8", opacity: clamp(o, 0, 1) });
  }

  /* ---- a script card: one object's own script -------------------------------- */

  /* opt: {col (a lit border), note (a few words at the right of the header)} */
  function mtoCard(x, y, w, h, pic, name, o, opt) {
    opt = opt || {};
    if (!(o > 0)) return "";
    var col = opt.col || P.line;
    return G(R(x, y, w, h, 20, P.card, col, opt.col ? 4 : 2) +
      Em(x + 38, y + 34, 40, pic) +
      Tx(x + 70, y + 43, name, "lab big", "start", opt.col ? { fill: opt.col } : null) +
      (opt.note ? Tx(x + w - 20, y + 43, opt.note, "lab mid muted", "end") : ""),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the stage the film draws ----------------------------------------------- */

  function mtoGround(b) { return b.y + b.h - 58; }
  function mtoStage(b, o) {
    if (!(o > 0)) return "";
    var gy = mtoGround(b);
    return G(R(b.x, b.y, b.w, b.h, 20, P.cell, P.line, 2) +
      R(b.x + 12, gy, b.w - 24, 8, 4, P.line), { opacity: clamp(o, 0, 1) });
  }
  /* a: {pic, cx, sq (squares moved right), jump (0..1), scale, o, size} */
  function mtoSprite(b, a) {
    var o = a.o == null ? 1 : a.o;
    if (!(o > 0)) return "";
    var size = (a.size || 84) * (a.scale == null ? 1 : a.scale);
    var x = a.cx + (a.sq || 0) * MTO_SQ;
    var cy = mtoGround(b) - 10 - size / 2 - (a.jump || 0) * 62;
    return Em(x, cy, size, a.pic, { opacity: clamp(o, 0, 1) });
  }
  /* where a sprite's head is, for a bubble tail or a mark above it */
  function mtoHeadY(b, a) {
    var size = (a.size || 84) * (a.scale == null ? 1 : a.scale);
    return mtoGround(b) - 10 - size - (a.jump || 0) * 62;
  }

  /* the Run button every chapter presses */
  function mtoRun(x, y, w, h, o, lit, t, at) {
    if (!(o > 0)) return "";
    var col = lit ? P.good : P.line;
    return G(R(x, y, w, h, h / 2, P.card, col, lit ? 4 : 2) +
      Pth("M" + n2(x + h * 0.52) + "," + n2(y + h * 0.30) + " L" + n2(x + h * 0.52) + "," + n2(y + h * 0.70) +
        " L" + n2(x + h * 0.86) + "," + n2(y + h * 0.50) + " Z", col, col, 2) +
      Tx(x + h * 1.02, y + h / 2 + 9, "Run", "lab big", "start", { fill: col }) +
      MK.ripple(x + w / 2, y + h / 2, t, at, P.good), { opacity: clamp(o, 0, 1) });
  }

  /* one cell of the beat strip: "beat 1", "beat 2" */
  function mtoBeatCell(x, y, w, h, label, o, lit) {
    if (!(o > 0)) return "";
    var col = lit > 0.5 ? P.gold : P.line;
    return G(R(x, y, w, h, 14, lit > 0.5 ? "#2A2414" : P.card, col, lit > 0.5 ? 4 : 2) +
      Tx(x + w / 2, y + h / 2 + 9, label, "lab big", "middle", { fill: lit > 0.5 ? P.gold : P.muted }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title motif =========================================================
     One Run button, two arrows, two scripts and two sprites: one press, two
     programs. In the spoken title chapter the button arrives as Run is named,
     each column as its animal is named, both sprites move together on "both
     start moving", and the crossed hourglass lands on "Nobody waits". On the
     two cards it stands still. */
  function mtoMiniBlock(x, y, w, h, icon, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.34, P.cell, col || P.line, 2) + Em(x + h * 0.62, y + h / 2, h * 0.62, icon),
      { opacity: Math.min(1, o), transform: around(x + w / 2, y + h / 2, Math.min(1.08, o)) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cRun = sn ? sc(sn, 0, "run") : null, cCat = sn ? sc(sn, 0, "cat") : null,
      cDog = sn ? sc(sn, 0, "dog") : null, cMove = sn ? sc(sn, 0, "move") : null,
      cWait = sn ? sc(sn, 1, "waits") : null, cTwo = sn ? sc(sn, 1, "two") : null,
      cSame = sn ? sc(sn, 1, "same") : null;
    var pRun = sn ? popIn(t, cRun, 0.4) : 1;
    var pCat = sn ? popIn(t, cCat, 0.4) : 1, pDog = sn ? popIn(t, cDog, 0.4) : 1;
    var aArr = sn ? on(t, cRun, 0.6) : 1;
    var moveU = sn ? on(t, cMove, 0.5) : 1;
    var hopU = sn ? mtoHop(t, cMove) : 0;
    var pWait = sn ? popIn(t, cWait, 0.4) : 1;
    var lit = sn ? on(t, cTwo, 0.5) : 1;
    var pSame = sn ? on(t, cSame, 0.5) : 1;

    out += R(8, 16, 344, 328, 30, P.card, P.line, 3);
    /* the Run button */
    out += G(R(112, 34, 136, 48, 24, P.cell, P.good, 3) +
      Pth("M140,46 L140,70 L160,58 Z", P.good, P.good, 2) +
      Tx(170, 68, "Run", "lab big", "start", { fill: P.good }),
      { opacity: Math.min(1, pRun), transform: around(180, 58, Math.min(1.08, pRun)) });
    out += MK.ripple(180, 58, t, cRun, P.good);
    /* one press reaches both scripts */
    out += MK.arrow(158, 88, 104, 132, aArr, P.good, 6);
    out += MK.arrow(202, 88, 256, 132, aArr, P.good, 6);
    /* the two scripts */
    out += mtoMiniBlock(52, 140, 92, 34, "➡️", pCat, lit > 0.5 ? P.gold : P.line);
    out += mtoMiniBlock(52, 180, 92, 34, "⬆️", pCat, lit > 0.5 ? P.gold : P.line);
    out += mtoMiniBlock(216, 140, 92, 34, "⬆️", pDog, lit > 0.5 ? P.gold : P.line);
    out += mtoMiniBlock(216, 180, 92, 34, "⬆️", pDog, lit > 0.5 ? P.gold : P.line);
    /* the ground, and the two animals on it */
    out += R(30, 290, 300, 7, 4, P.line);
    out += Em(90 + moveU * 16, 262 - hopU * 22, 60, "\u{1F431}", { opacity: Math.min(1, pCat) });
    out += Em(270, 262 - hopU * 22, 60, "\u{1F436}", { opacity: Math.min(1, pDog) });
    /* nobody waits */
    if (pWait > 0) {
      out += MK.pop(Em(180, 246, 34, "⏳"), 180, 246, pWait);
      out += MK.cross(180, 246, 22, pWait);
    }
    /* at the same time */
    out += MK.pill(180, 320, "at the same time", pSame, { size: 20, col: P.teal, ink: P.teal });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="One Run button, two scripts, a cat and a dog moving at the same time">' + out + "</svg>";
  }

  /* ==== chapter: at the same time ================================================
     The cat's script and the dog's script stand one above the other on the
     left, and the film's stage is on the right. Press Run and the beat strip
     lights: in beat one the cat moves one square right (the kit's own rule)
     while the dog jumps, in beat two they both jump. The cat ends 184 away
     from the dog at its nearest, so the two moving things never share a spot. */

  var MTO_SAME_STAGE = { x: 556, y: 46, w: 588, h: 302 };
  var MTO_SAME_CAT = { x: 28, y: 46, w: 500, h: 176 };
  var MTO_SAME_DOG = { x: 28, y: 240, w: 500, h: 176 };
  /* the header takes the card's first 62; the two rows sit under it, and the
     second one ends 4 inside the card's own bottom edge */
  var MTO_SAME_ROW = { h: 48, gap: 6, x: 56, w: 444 };
  function mtoSameRowY(card, k) { return card.y + 70 + k * (MTO_SAME_ROW.h + MTO_SAME_ROW.gap); }

  function mtoSameChapter(scene, beat, t, i) {
    var cObjects = sc(scene, 0, "objects"), cCat = sc(scene, 0, "cat"), cDog = sc(scene, 0, "dog");
    var cOwn = sc(scene, 1, "own"), cRight = sc(scene, 1, "right"), cJump = sc(scene, 1, "jump");
    var cDogs = sc(scene, 2, "dogs"), cJump1 = sc(scene, 2, "jump1"), cJump2 = sc(scene, 2, "jump2");
    var cRun = sc(scene, 3, "run"), cBeat1 = sc(scene, 3, "beat1"),
      cMove = sc(scene, 3, "move"), cDjump = sc(scene, 3, "jump");
    var cBeat2 = sc(scene, 4, "beat2"), cBoth = sc(scene, 4, "both"), cWaits = sc(scene, 4, "waits");
    var b = MTO_SAME_STAGE, out = "";

    /* the stage, and the two animals on it */
    out += mtoStage(b, on(t, cObjects, 0.5));
    var catSq = on(t, cMove, 0.55) * MTO_SQ_RIGHT;
    var catA = { pic: "\u{1F431}", cx: 700, sq: catSq, jump: mtoHop(t, cBoth), o: popIn(t, cCat, 0.4) };
    var dogA = { pic: "\u{1F436}", cx: 960, jump: Math.max(mtoHop(t, cDjump), mtoHop(t, cBoth)), o: popIn(t, cDog, 0.4) };
    out += mtoSprite(b, catA) + mtoSprite(b, dogA);
    /* who is who, under each of them */
    out += MK.pill(700 + catSq * MTO_SQ, 322, "cat", popIn(t, cCat, 0.4), { size: 19, col: P.gold, ink: P.gold });
    out += MK.pill(960, 322, "dog", popIn(t, cDog, 0.4), { size: 19, col: P.gold, ink: P.gold });

    /* the two script cards */
    var cardO = on(t, cOwn, 0.5);
    var litCat = mtoPast(t, cRight) && !mtoPast(t, cDogs), litDog = mtoPast(t, cDogs) && !mtoPast(t, cRun);
    out += mtoCard(MTO_SAME_CAT.x, MTO_SAME_CAT.y, MTO_SAME_CAT.w, MTO_SAME_CAT.h, "\u{1F431}", "the cat's script",
      cardO, { col: litCat ? P.gold : null });
    out += mtoCard(MTO_SAME_DOG.x, MTO_SAME_DOG.y, MTO_SAME_DOG.w, MTO_SAME_DOG.h, "\u{1F436}", "the dog's script",
      cardO, { col: litDog ? P.gold : null });

    /* the rows: two slots first, then the blocks as each is named */
    var rows = [
      { card: MTO_SAME_CAT, k: 0, id: "right", at: cRight, runAt: cMove },
      { card: MTO_SAME_CAT, k: 1, id: "jump", at: cJump, runAt: cBoth },
      { card: MTO_SAME_DOG, k: 0, id: "jump", at: cJump1, runAt: cDjump },
      { card: MTO_SAME_DOG, k: 1, id: "jump", at: cJump2, runAt: cBoth }
    ];
    rows.forEach(function (r) {
      var y = mtoSameRowY(r.card, r.k), o = on(t, r.at, 0.45);
      out += mtoSlot(MTO_SAME_ROW.x, y, MTO_SAME_ROW.w, MTO_SAME_ROW.h, cardO * (1 - o));
      var running = mtoPast(t, r.runAt);
      out += mtoBlock(MTO_SAME_ROW.x, y, MTO_SAME_ROW.w, MTO_SAME_ROW.h, r.id,
        { o: o, col: running ? P.gold : null, mark: running ? "tick" : null, markP: popIn(t, mtoAt(r.runAt, 0.3), 0.35) });
    });

    /* Run, and the two beats it starts */
    out += mtoRun(566, 368, 130, 50, on(t, cOwn, 0.5), mtoPast(t, cRun), t, cRun);
    out += mtoBeatCell(716, 368, 206, 50, "beat 1", on(t, cRun, 0.5), on(t, cBeat1, 0.4));
    out += mtoBeatCell(938, 368, 206, 50, "beat 2", on(t, cRun, 0.5), on(t, cBeat2, 0.4));

    /* the dog never waits: a crossed-out wait, between the two of them */
    var pw = popIn(t, cWaits, 0.4);
    if (pw > 0) {
      out += MK.pop(Em(846, 132, 46, "⏳"), 846, 132, pw);
      out += MK.cross(846, 132, 30, pw);
    }
    return svg(out);
  }
