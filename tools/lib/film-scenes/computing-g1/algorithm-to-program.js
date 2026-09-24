  /* ==== Grade 1 Computing, Lesson 4: Algorithm to Program =====================
     tools/lib/film-scenes/computing-g1/algorithm-to-program.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-1-app/lecture-video/algorithm-to-program.json.

     What comes from the lesson rather than from here:
       ART.block(id)      every block's label, icon and category, so a block in
                          the film is the block the child taps (and its colour
                          is computing.css's: move teal, look plum, control
                          accent, on dark ink)
       ART.run(cat, ids)  the sprite's OWN end state after a script, so move
                          right being one square, stopping at three, and grow
                          being x1.4 capped at 2.2 come from the kit. Every
                          script this film shows is run ONCE here, at load, and
                          the frames read the answers off AP_* below - the
                          adapter leaves a timer behind per block, so running
                          one inside a draw function would run it thousands of
                          times.
       ART.figure         the laptop (chapter "Words and code") and the tablet
                          (chapter "Programs everywhere").
     The sprite stage itself is HTML in the kit and ART.foreign draws it
     unstyled, so it is drawn here instead, to the kit's own measurements:
     560 x 170 with a 36 px grass floor, a 64 px sprite sitting 30 px up, and
     one square of movement = 64 px. Everything is scaled by k = h / 170.

     This file: the palette, the marks every chapter shares, the title motif
     and the chapter "Words and code". Every top-level name starts with ap. */

  var HUE = {
    title: P.teal, words: P.gold, blocks: P.teal, build: P.plum,
    predict: P.blue, test: P.good, everywhere: P.accent, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function apOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function apFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 from beat k on, and away again at beat j */
  function apBetween(t, scene, k, j) { return apFrom(t, scene, k) * (1 - apFrom(t, scene, j)); }

  /* ---- the lesson's blocks --------------------------------------------------- */

  /* computing.css: .block.move teal, .block.look plum, .block.control accent,
     text #06231F, radius 10 on a 44 px control. */
  var AP_CAT_FILL = { move: P.teal, look: P.plum, control: P.accent };
  var AP_BLOCK_INK = "#06231F";

  /* how wide a block must be for its own label at font size fs */
  function apBlockW(id, fs, h) { return h * 0.96 + ART.block(id).label.length * fs * 0.6 + fs * 0.8; }

  /* One of the lesson's blocks, its top-left at (x, y).
     opt: {fs, ring (a colour for the lesson's .now / .right outline), label
     (text instead of the block's own), fill, icon} */
  function apBlock(x, y, w, h, id, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var b = id ? ART.block(id) : { label: opt.label || "", icon: opt.icon || "", cat: "move" };
    var fs = opt.fs || Math.round(h * 0.42);
    var out = R(x, y, w, h, h * 0.23, opt.fill || AP_CAT_FILL[b.cat] || P.teal) +
      Em(x + h * 0.5, y + h / 2, fs * 1.05, opt.icon || b.icon) +
      Tx(x + h * 0.96, y + h / 2 + fs * 0.36, opt.label || b.label, "lab", "start", { "font-size": fs, fill: AP_BLOCK_INK });
    if (opt.ring) out += R(x - 6, y - 6, w + 12, h + 12, h * 0.3, "none", opt.ring, 5);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* an empty slot of a script, the lesson's dashed .script strip */
  function apSlot(x, y, w, h, o, col) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, h * 0.23, "rgba(0,0,0,0.18)", col || P.line, 3,
      { "stroke-dasharray": "12 9", opacity: clamp(o, 0, 1) });
  }

  /* a numbered chip: the step this block is */
  function apChip(cx, cy, r, text, o, col) {
    if (!(o > 0)) return "";
    return G(C(cx, cy, r, col || P.gold, P.ground, 2) +
      Tx(cx, cy + r * 0.38, text, "lab", "middle", { "font-size": r * 1.2, fill: AP_BLOCK_INK }),
      { transform: around(cx, cy, Math.min(o, 1.1)), opacity: Math.min(1, o) });
  }

  /* ---- a card of words: the algorithm, on paper ------------------------------- */
  function apCard(x, y, w, h, title, o, ringO) {
    if (!(o > 0)) return "";
    var out = R(x, y, w, h, 22, P.paper, P.line, 2) +
      Tx(x + w / 2, y + 46, title, "lab big dark", "middle") +
      L(x + 22, y + 66, x + w - 22, y + 66, "#C9C2B0", 2);
    if (ringO > 0) out += R(x - 7, y - 7, w + 14, h + 14, 28, "none", P.gold, 5, { opacity: clamp(ringO, 0, 1) });
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* one numbered line of that card */
  function apCardLine(x, y, n, text, o, bump0) {
    if (!(o > 0)) return "";
    var g = clamp(bump0 || 0, 0, 1);
    return G(C(x + 26, y - 9, 20, g > 0 ? P.gold : "#D9D3C4", "#9A937F", 2) +
      Tx(x + 26, y - 1, String(n), "lab", "middle", { "font-size": 22, fill: "#3A342A" }) +
      Tx(x + 58, y, text, "lab big dark", "start") +
      (g > 0 ? R(x + 4, y - 32, 62 + String(text).length * 16.8, 46, 12, "none", P.gold, 4, { opacity: g }) : ""),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the sprite stage, drawn to the kit's measurements ---------------------- */
  /* opt: {squares: how many squares each side to notch on the floor} */
  function apStage(x, y, w, h, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var k = h / 170, gh = h * 0.2118, cid = "apClip" + Math.round(x) + "_" + Math.round(y) + "_" + Math.round(w);
    var floor = R(x, y + h - gh, w, gh, 0, P.grass);
    if (opt.squares) {
      var sq = 64 * k, cx = x + w / 2;
      for (var s = -opt.squares; s <= opt.squares; s++) {
        var lx = cx + (s + 0.5) * sq;
        if (lx > x + 6 && lx < x + w - 6) floor += L(lx, y + h - gh + 4, lx, y + h - 4, "#2F6F39", 3);
      }
    }
    return G('<defs><linearGradient id="apStageBg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#0E2434"/><stop offset="1" stop-color="#17384F"/></linearGradient>' +
      el("clipPath", { id: cid }, R(x, y, w, h, 22)) + "</defs>" +
      R(x, y, w, h, 22, "url(#apStageBg)", P.line, 2) +
      G(floor, { "clip-path": "url(#" + cid + ")" }), { opacity: clamp(o, 0, 1) });
  }
  /* where the sprite's middle sits, and how wide one square is */
  function apSQ(h) { return 64 * (h / 170); }
  function apCatY(y, h) { return y + h - 62 * (h / 170); }

  /* The cat. st is one of the lesson's own end states ({x, scale, spin,
     hidden}); jump is 0..1 of the kit's 70 px hop. */
  function apCat(cx, y, h, st, jump, o) {
    if (!(o > 0)) return "";
    var k = h / 170, oy = y + h - 55.6 * k;
    var tf = "translate(" + n2(st.x * 64 * k) + "," + n2(-(jump || 0) * 70 * k) + ") rotate(" +
      n2(st.spin || 0) + " " + n2(cx) + " " + n2(oy) + ") " + around(cx, oy, st.scale == null ? 1 : st.scale);
    return G(Em(cx, apCatY(y, h), 56 * k, "\u{1F431}"),
      { transform: tf, opacity: (st.hidden ? 0.15 : 1) * clamp(o, 0, 1) });
  }
  /* a green Run button, the one the lesson tells the child to press */
  function apRunBtn(x, y, w, h, o, press) {
    if (!(o > 0)) return "";
    var dy = 3 * clamp(press || 0, 0, 1);
    return G(R(x, y + dy, w, h, h * 0.32, P.good) +
      Pth("M" + n2(x + h * 0.55) + "," + n2(y + dy + h * 0.28) + " L" + n2(x + h * 0.55) + "," + n2(y + dy + h * 0.72) +
        " L" + n2(x + h * 0.95) + "," + n2(y + dy + h * 0.5) + " Z", AP_BLOCK_INK) +
      Tx(x + h * 1.18, y + dy + h * 0.5 + h * 0.19, "Run", "lab", "start", { "font-size": h * 0.5, fill: AP_BLOCK_INK }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the lesson's own arithmetic, worked out once --------------------------- */
  /* ART.run mounts the kit's stage and leaves a 720 ms timer per block, so
     every script this film shows is run here, at load, and never in a frame. */
  function apRun(ids) { return ART.run("\u{1F431}", ids)[0]; }
  function apPrefixes(ids) {
    var out = [apRun([])];
    for (var k = 1; k <= ids.length; k++) out.push(apRun(ids.slice(0, k)));
    return out;
  }
  var AP_HOME = apRun([]);
  var AP_RIGHT1 = apRun(["right"]);          /* one square right */
  var AP_BACK = apRun(["right", "left"]);    /* and back again */
  var AP_GROW = apRun(["grow"]);             /* the kit's x1.4 */
  var AP_SHRINK = apRun(["grow", "shrink"]); /* and back to 1 */
  var AP_BUILD = apPrefixes(["right", "jump"]);            /* the lesson's round 1 */
  var AP_PRED = apPrefixes(["right", "right", "jump"]);    /* the predictor's round 1 */

  /* ==== the title motif =======================================================
     The whole lesson in one picture: the algorithm in words, an arrow down,
     the same three steps as blocks, and the cat that runs them. In the spoken
     title chapter the words write themselves in, the arrow draws on "needs
     code", and the blocks and the cat arrive on the second line. On the two
     cards it simply stands. */
  var AP_MOTIF_STEPS = ["move right", "jump", "say hello"];
  var AP_MOTIF_IDS = ["right", "jump", "say"];
  function titleMotif(o) {
    var t = o.t || 0, sc0 = o.scene, out = "";
    var cAlg = sc0 ? sc(sc0, 0, "algorithm") : null, cWords = sc0 ? sc(sc0, 0, "words") : null,
      cCode = sc0 ? sc(sc0, 0, "code") : null, cBlocks = sc0 ? sc(sc0, 1, "blocks") : null,
      cProg = sc0 ? sc(sc0, 1, "program") : null;
    var pCard = sc0 ? popIn(t, cAlg, 0.45) : 1;
    var nWords = sc0 ? tally(t, cWords, 3, 0.75) : 3;
    var pArrow = sc0 ? on(t, cCode, 0.55) : 1;
    var nBlocks = sc0 ? tally(t, cBlocks, 3, 0.7) : 3;
    var pProg = sc0 ? on(t, cProg, 0.5) : 1;

    /* the algorithm, on paper */
    if (pCard > 0) {
      var card = R(60, 10, 240, 112, 16, P.paper) +
        Tx(180, 42, "Algorithm", "lab dark", "middle", { "font-size": 24 });
      for (var w = 0; w < nWords; w++)
        card += R(80, 58 + w * 20, 30 + w * 6, 9, 4, "#8E8778") +
          R(118 + w * 6, 58 + w * 20, 92 - w * 10, 9, 4, "#C2BBAA");
      out += G(card, { transform: around(180, 66, Math.min(pCard, 1.1)), opacity: Math.min(1, pCard) });
    }
    /* words become code */
    out += MK.arrow(180, 128, 180, 158, pArrow, P.gold, 9);
    /* the same three steps, as blocks */
    for (var b = 0; b < nBlocks; b++) {
      var by = 166 + b * 42, bb = ART.block(AP_MOTIF_IDS[b]);
      var pb = sc0 ? popIn(t, cBlocks == null ? null : cBlocks + b * 0.23, 0.35) : 1;
      out += G(R(66, by, 228, 36, 9, AP_CAT_FILL[bb.cat]) +
        Em(84, by + 18, 20, bb.icon) +
        Tx(102, by + 25, bb.label, "lab", "start", { "font-size": 19, fill: AP_BLOCK_INK }),
        { transform: around(180, by + 18, Math.min(pb, 1.1)), opacity: Math.min(1, pb) });
    }
    /* a row of blocks is a program: the cat runs it */
    if (pProg > 0) out += R(56, 158, 248, 136, 14, "none", P.gold, 5, { opacity: pProg });
    out += R(30, 332, 300, 12, 6, P.grass);
    out += G(Em(180, 314, 40, "\u{1F431}"), { opacity: sc0 ? Math.min(1, pProg * 1.2) : 1 });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="An algorithm in words, and the same steps as blocks a cat runs">' +
      out + "</svg>";
  }

  /* ==== chapter: Words and code ================================================
     Left, the algorithm in words, the lesson's own three steps. Middle, the
     lesson's laptop: it cannot read the sentence (a cross on its screen), and
     then the word code appears on it. Right, the three blocks, one per step,
     numbered to match the card, bracketed into a program. */
  var AP_W_CARD = { x: 30, y: 56, w: 310, h: 310 };
  var AP_W_LINE = [176, 241, 306];
  var AP_W_LAP = { x: 380, y: 118, w: 320, h: 238 };
  var AP_W_BLK = { x: 756, w: 272, h: 64, y: [96, 188, 280] };
  function apLapX(v) { return AP_W_LAP.x + v * AP_W_LAP.w / 360; }
  function apLapY(v) { return AP_W_LAP.y + v * AP_W_LAP.h / 268; }

  function apWordsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cAlg = c(0, "algorithm"), cSteps = c(0, "steps"), cOne = c(0, "one"), cTwo = c(0, "two"), cThree = c(0, "three");
    var cCannot = c(1, "cannot"), cAsCode = c(1, "code");
    var cCode = c(2, "code"), cForm = c(2, "form");
    var cBlocks = c(3, "blocks"), cOneBlock = c(3, "one"), cIsCode = c(3, "iscode");
    var cRow = c(4, "row"), cProgram = c(4, "program"), cRuns = c(4, "runs");
    var out = "";

    /* the algorithm, in words */
    var nLines = tally(t, cSteps, 3, 0.9), lineCue = [cOne, cTwo, cThree];
    out += apCard(AP_W_CARD.x, AP_W_CARD.y, AP_W_CARD.w, AP_W_CARD.h, "Algorithm",
      popIn(t, cAlg, 0.45), bump(t, cAlg, 1.1) * 0.9 + on(t, c(0, "steps"), 0.4) * 0);
    for (var n = 0; n < 3; n++) {
      if (n >= nLines) break;
      out += apCardLine(AP_W_CARD.x + 12, AP_W_LINE[n], n + 1, AP_MOTIF_STEPS[n],
        on(t, lineCue[n] == null ? cSteps : lineCue[n], 0.35), bump(t, lineCue[n], 0.9));
    }

    /* the computer that cannot read them */
    var lapO = on(t, cCannot, 0.5);
    if (lapO > 0) {
      var codeOn = Math.max(on(t, cAsCode, 0.5), on(t, cCode, 0.4));
      var lap = ART.figure("laptop");
      if (codeOn > 0.5) lap = ART.ring(lap, "screen", P.good, 6);
      out += G(ART.place(lap, AP_W_LAP.x, AP_W_LAP.y, AP_W_LAP.w, AP_W_LAP.h), { opacity: clamp(lapO, 0, 1) });
      /* the sentence goes over: refused */
      var arr = on(t, cCannot, 0.5) * (1 - on(t, cAsCode, 0.5));
      out += MK.arrow(346, 214, 424, 214, arr, P.gold, 7);
      out += MK.cross(apLapX(180), apLapY(96), 34, popIn(t, cCannot == null ? null : cCannot + 0.35, 0.4) * (1 - on(t, cAsCode, 0.5)));
      /* and then the steps as code */
      out += MK.pill(apLapX(180), apLapY(96), "code", codeOn, { size: 26, col: P.good, fill: P.ground, ink: P.good });
      out += MK.glow(apLapX(180), apLapY(96), 92, P.good, on(t, cForm, 0.6) * (0.55 + 0.45 * breathe(t)));
    }

    /* the blocks, one per step */
    var nB = tally(t, cBlocks, 3, 0.85);
    for (var b = 0; b < 3; b++) {
      if (b >= nB) break;
      var at = cBlocks == null ? null : cBlocks + b * 0.3;
      /* the ring belongs to the block being spoken of, and gives way to the
         bracket once the three are called a program */
      var ringing = on(t, cRow, 0.3) === 0 &&
        ((b === 0 && on(t, cOneBlock, 0.3) > 0 && on(t, cIsCode, 0.3) === 0) || on(t, cIsCode, 0.3) > 0);
      var p = popIn(t, at, 0.4);
      out += G(apBlock(AP_W_BLK.x, AP_W_BLK.y[b], AP_W_BLK.w, AP_W_BLK.h, AP_MOTIF_IDS[b], Math.min(1, p),
        { ring: ringing ? P.gold : null }), { transform: around(AP_W_BLK.x + AP_W_BLK.w / 2, AP_W_BLK.y[b] + 32, Math.min(p, 1.1)) });
      out += apChip(AP_W_BLK.x - 20, AP_W_BLK.y[b] + 32, 21, String(b + 1), popIn(t, at == null ? null : at + 0.2, 0.35));
    }
    /* one block is one instruction */
    var oneO = on(t, cOneBlock, 0.4) * (1 - on(t, cIsCode, 0.4));
    if (oneO > 0) out += MK.pill(1040, AP_W_BLK.y[0] + 32, "1 step", oneO, { size: 24, anchor: "start", col: P.gold });

    /* blocks in a row are a program */
    var rowO = on(t, cRow, 0.5);
    if (rowO > 0) out += R(744, 80, 300, 268, 24, "none", P.gold, 5, { opacity: rowO });
    out += MK.pill(894, 392, "program", on(t, cProgram, 0.45), { size: 30, col: P.gold });
    /* code a computer runs */
    out += apRunBtn(500, 368, 148, 48, on(t, cRuns, 0.45), 0);
    out += MK.ripple(524, 392, t, cRuns == null ? null : cRuns + 0.3, P.good);
    return svg(out);
  }
