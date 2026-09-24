  /* ==== Grade 4 Mathematics, Lesson 2: Patterns and Square Numbers ===========
     tools/lib/film-scenes/math-g4/patterns-and-squares.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     mathematics/grade-4-app/lecture-video/patterns-and-squares.json.

     Mathematics has no lesson kit, so every manipulative comes from the shared
     maths library (renderer.art: ["math"]): ART.counters boxed in pairs for
     odd and even, ART.barModel for the shape that hides a number, and
     ART.array for the squares and for the L between one square and the next.
     Each returns its own <svg>; psqPlace nests one at a scale that is EXACT
     (width and height both natural x s), so nothing is letterboxed and a mark
     drawn in the film's space lands on the dot it names - psqXY maps a card's
     own coordinates into the film's 1168 x 440.

     This file: the palette, the placement helpers, the card geometry the
     chapters share, the title motif, and the chapter "Pair them off". Every
     top-level name starts with psq, so nothing here can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, pairs: P.teal, adding: P.good, hidden: P.plum,
    steps: P.blue, squares: P.gold, lshape: P.accent, recap: P.teal
  };

  /* ---- timing ------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function psqOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function psqFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 from beat k, back to 0 at beat m (a thing that lives over a range) */
  function psqSpan(t, scene, k, m) {
    var a = psqFrom(t, scene, k);
    var z = m >= scene.beats.length ? 0 : into(t, scene.first + m);
    return a * (1 - z);
  }

  /* ---- nesting one of the library's drawings ------------------------------
     A box of exactly natural x s, so ART.place cannot letterbox it and a point
     of the card maps into the film by the same scale in both directions. */
  function psqPlace(markup, vw, vh, x, y, s, extra) {
    return ART.place(markup, x, y, vw * s, vh * s, extra);
  }
  function psqBox(x, y, s) { return { x: x, y: y, s: s }; }
  function psqX(b, v) { return b.x + v * b.s; }
  function psqY(b, v) { return b.y + v * b.s; }

  /* ---- the geometry of the two library drawings this film points inside ----

     ART.counters(n, {pairs: true}): boxes of 48 x 92, 10 apart, inside an edge
     of 20; the lone counter of an odd n is the last box's top one. */
  function psqPairW(n) { var b = Math.max(1, Math.ceil(n / 2)); return 40 + b * 48 + (b - 1) * 10; }
  var PSQ_PAIR_H = 122;
  function psqPairBox(k) { return [20 + k * 58, 20, 48, 92]; }
  function psqPairTop(k) { return [20 + k * 58 + 24, 45]; }
  function psqPairBot(k) { return [20 + k * 58 + 24, 87]; }

  /* ART.array(rows, cols): cells of 36 inside a pad of 12, a gutter of 44 on
     the left and 38 on top, inside an edge of 20; a caption adds 32. */
  function psqArrW(cols) { return 108 + cols * 36; }
  function psqArrH(rows, lab) { return 102 + rows * 36 + (lab ? 32 : 0); }
  function psqArrDot(i, j) { return [94 + 36 * j, 88 + 36 * i]; }

  /* ART.barModel: 520 wide, 188 tall with no caption; the whole bar is
     (24, 24, 472, 62) and the parts sit at y = 102, also 62 tall. */
  var PSQ_BAR_W = 520, PSQ_BAR_H = 188;
  function psqBarParts(vals) {
    var i, sum = 0, avail = 472 - (vals.length - 1) * 8, out = [], x = 24;
    for (i = 0; i < vals.length; i++) sum += vals[i];
    for (i = 0; i < vals.length; i++) {
      var w = (vals[i] / sum) * avail;
      out.push({ x: x, w: w, mid: x + w / 2 });
      x += w + 8;
    }
    return out;
  }

  /* ---- small marks of this film's own ------------------------------------- */

  /* a ring drawn round a counter, to pick it out of the card */
  function psqRing(cx, cy, r, o, col, w) {
    if (!(o > 0)) return "";
    return C(cx, cy, r, "none", col || P.gold, w || 4, { opacity: clamp(o, 0, 1) });
  }
  /* a rounded box drawn round a box of the card, to pick out a pair */
  function psqFrame(b, k, o, col) {
    if (!(o > 0)) return "";
    var r = psqPairBox(k);
    return R(psqX(b, r[0]) - 6, psqY(b, r[1]) - 6, r[2] * b.s + 12, r[3] * b.s + 12, 18,
      "none", col || P.gold, 5, { opacity: clamp(o, 0, 1) });
  }
  /* a word in a pill with a line to the thing it names */
  function psqTag(t, x, y, text, at, to, opt) {
    opt = opt || {};
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var out = "";
    if (to) out += MK.leader(x, y + (opt.below ? -18 : 18), to[0], to[1], on(t, at, 0.6), opt.col || P.gold);
    return out + MK.pill(x, y, text, o, { size: opt.size || 26, col: opt.col || P.gold, ink: opt.ink || P.ink });
  }
  /* the big answer, popped in on its own cue */
  function psqBig(t, x, y, text, at, col) {
    var p = popIn(t, at, 0.4);
    if (!(p > 0)) return "";
    return MK.pop(Tx(x, y, text, "lab huge", "middle", { fill: col || P.gold }), x, y - 14, p);
  }

  /* ==== the title motif ======================================================
     The lesson's emblem: 16 dots in a 4 by 4 square. In the spoken title
     chapter eight capsules pair the dots off on "pair off exactly", a lone
     red counter drops in beside them on "leave one over", and then the gold
     square is drawn round the block on "a perfect square of dots" with its
     16 written under it. On the two cards the block simply stands. */
  var PSQ_M = { x0: 84, y0: 70, step: 64, r: 17 };
  function psqMotifDot(i, j) { return [PSQ_M.x0 + PSQ_M.step * j, PSQ_M.y0 + PSQ_M.step * i]; }
  function titleMotif(o) {
    var t = o.t || 0, out = "", i, j, p;
    var cPair = o.scene ? sc(o.scene, 0, "pair") : null;
    var cOver = o.scene ? sc(o.scene, 0, "over") : null;
    var cSq = o.scene ? sc(o.scene, 1, "square") : null;
    var cSix = o.scene ? sc(o.scene, 1, "sixteen") : null;
    var still = !o.scene;

    /* the eight capsules, arriving one at a time; they fade as the square is drawn */
    var capsules = still ? 0 : tally(t, cPair, 8, 0.95) * (1 - on(t, cSq, 0.45));
    for (i = 0; i < 4; i++) for (p = 0; p < 2; p++) {
      var k = i * 2 + p;
      if (k >= capsules) continue;
      var cy = PSQ_M.y0 + PSQ_M.step * i;
      out += R(56 + 128 * p, cy - 28, 120, 56, 28, "rgba(244,201,93,0.14)", P.gold, 4,
        { opacity: clamp(capsules - k, 0, 1) });
    }

    /* the 4 by 4 block: 16 dots */
    for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) {
      var d = psqMotifDot(i, j);
      out += C(d[0], d[1], PSQ_M.r, P.teal);
    }

    /* the square drawn round it, and the 16 under it */
    var sq = still ? 1 : on(t, cSq, 0.7);
    if (sq > 0) out += R(54, 40, 252, 252, 14, "none", P.gold, 6,
      { opacity: clamp(sq, 0, 1), "stroke-dasharray": "1008", "stroke-dashoffset": n2(1008 * (1 - sq)) });

    /* the lone counter, red, while "leave one over" is being said */
    var lone = still ? 0 : on(t, cOver, 0.4) * (1 - on(t, cSq, 0.4));
    if (lone > 0) out += G(C(180, 322, PSQ_M.r, P.bad) + C(180, 322, 28, "none", P.bad, 4, { "stroke-dasharray": "8 6" }),
      { opacity: clamp(lone, 0, 1) });

    var six = still ? 1 : popIn(t, cSix, 0.4);
    if (six > 0) out += MK.pop(Tx(180, 338, "16", "lab huge", "middle", { fill: P.gold }), 180, 326, six);

    return '<svg viewBox="0 0 360 360" role="img" aria-label="Sixteen dots in a four by four square">' + out + "</svg>";
  }

  /* ==== chapter: pair them off ===============================================
     ART.counters, boxed in pairs. 8 pairs off exactly into four boxes; 7 makes
     three boxes and one counter alone, which the library draws in red in a
     dashed box of its own (markOdd). Both cards are 262 x 122, so they sit at
     one origin and the swap is a crossfade with the boxes in the same places.
     The loose row that opens the chapter is the same 8 counters, unboxed. */
  var PSQ_P = psqBox(150, 80, 2.5);           /* the paired card, 655 x 305 */
  var PSQ_PL = psqBox(114, 130, 2.5);         /* the loose row, 940 x 205 */

  function psqPairsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCount = c(0, "counters"), cPair = c(0, "pair");
    var cEight = c(1, "eight"), cNone = c(1, "none"), cEven = c(1, "even");
    var cSeven = c(2, "seven"), cThree = c(2, "three"), cOne = c(2, "one"), cOdd = c(2, "odd");
    var cLeft = c(3, "left"), cWatch = c(3, "watch");
    var out = "", k, d;
    var atEight = psqSpan(t, scene, 1, 2), atSeven = psqFrom(t, scene, 2), atLast = psqFrom(t, scene, 3);

    /* beat 0: eight loose counters, there as the chapter opens and lifted on
       "some counters", then the same eight boxed in pairs */
    var loose = inAt(t, BEATS[scene.first].start - 0.5, 0.6) * (1 - on(t, cPair, 0.5));
    if (loose > 0) out += G(psqPlace(ART.counters(8, { cols: 8, colour: "teal" }), 376, 82, PSQ_PL.x, PSQ_PL.y, PSQ_PL.s),
      { opacity: clamp(loose, 0, 1), transform: around(584, 232, 1 + 0.05 * bump(t, cCount, 0.8)) });

    /* the boxed cards: 8 from "pair them off", 7 from "Now try 7" */
    /* The two cards are the same card but for one counter, so the swap is a
       cut at the half-way point rather than a dissolve: two half-lit white
       cards over the dark stage read as one grey one. */
    var boxed = on(t, cPair, 0.5), toSeven = on(t, cSeven, 0.5);
    if (boxed > 0 && toSeven < 0.5)
      out += G(psqPlace(ART.counters(8, { pairs: true, colour: "teal" }), psqPairW(8), PSQ_PAIR_H, PSQ_P.x, PSQ_P.y, PSQ_P.s),
        { opacity: clamp(boxed, 0, 1) });
    if (toSeven >= 0.5)
      out += psqPlace(ART.counters(7, { pairs: true, markOdd: true, colour: "teal" }), psqPairW(7), PSQ_PAIR_H, PSQ_P.x, PSQ_P.y, PSQ_P.s);

    /* beat 1: the four whole pairs of 8, ringed one at a time */
    if (atEight > 0.02) {
      var four = tally(t, cEight, 4, 0.9);
      for (k = 0; k < 4; k++) if (k < four) out += psqFrame(PSQ_P, k, clamp(four - k, 0, 1) * atEight, P.gold);
      /* "nothing is left over": the fifth box, empty, and a tick under it */
      var none = on(t, cNone, 0.45) * atEight, eb = psqPairBox(4);
      if (none > 0) {
        out += R(psqX(PSQ_P, eb[0]), psqY(PSQ_P, eb[1]), eb[2] * PSQ_P.s, eb[3] * PSQ_P.s, 14,
          "none", P.muted, 4, { opacity: 0.85 * none, "stroke-dasharray": "10 8" });
        out += Tx(psqX(PSQ_P, eb[0] + 24), psqY(PSQ_P, eb[1] + 52), "none", "lab big muted", "middle", { opacity: none });
        out += MK.tick(psqX(PSQ_P, eb[0] + 24), 402, 22,
          popIn(t, cNone == null ? null : cNone + 0.4, 0.35) * atEight);
      }
      out += G(MK.pill(1010, 70, "8 is even", on(t, cEven, 0.4), { size: 30, col: P.good, ink: P.good }), { opacity: atEight });
    }

    /* beat 2: three whole pairs of 7, then the one left over */
    if (atSeven > 0.02) {
      var three = tally(t, cThree, 3, 0.8);
      for (k = 0; k < 3; k++) if (k < three) out += psqFrame(PSQ_P, k, clamp(three - k, 0, 1) * atSeven, P.gold);
      d = psqPairTop(3);
      var lx = psqX(PSQ_P, d[0]), ly = psqY(PSQ_P, d[1]);
      var lone = on(t, cOne, 0.45) * atSeven;
      if (lone > 0) {
        out += MK.glow(lx, ly, 108, P.bad, lone * (0.7 + 0.3 * breathe(t)));
        out += psqRing(lx, ly, 56, lone, P.bad, 5);
      }
      out += G(MK.pill(1010, 70, "7 is odd", on(t, cOdd, 0.4), { size: 30, col: P.bad, ink: P.bad }), { opacity: atSeven });

      /* beat 3: that one leftover is the whole story */
      if (atLast > 0.02) {
        var la = on(t, cLeft, 0.5) * atLast;
        out += MK.leader(950, 300, lx + 62, ly + 24, on(t, cLeft, 0.7) * atLast, P.gold);
        out += G(MK.pill(1000, 326, "1 left over", la, { size: 28, col: P.gold }), { opacity: atLast });
        var w = on(t, cWatch, 0.5) * atLast;
        if (w > 0) out += psqRing(lx, ly, 68 + 9 * breathe(t), w, P.gold, 5);
      }
    }

    return svg(out);
  }
