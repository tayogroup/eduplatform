  /* ==== Caesar and Pigpen, part 2: the Pigpen cipher, and the key ============
     tools/lib/film-scenes/computing-g4/caesar-and-pigpen-2.js. See the header
     of caesar-and-pigpen.js.

     Every glyph drawn here is ART.pigpen(letter) - the lesson's own pigpenSvg,
     sliced live out of computing.js - placed edge to edge so the nine cells of
     a grid tile into the lesson's own "noughts and crosses" pattern. Nothing
     here decides what a letter's shape looks like; this file only decides
     where each glyph sits and when it is lit. */

  /* ---- one pen, drawn from the lesson's own glyph -------------------------
     A bordered cell holding ART.pigpen(letter), with the letter itself as a
     small caption - the film's own addition, not part of the cipher. */
  function cpGridCell(x, y, size, letter, o, hi) {
    if (!(o > 0)) return "";
    var pad = size * 0.16;
    var glyph = ART.place(ART.pigpen(letter), x + pad, y + pad, size - pad * 2, size - pad * 2);
    return G(
      R(x, y, size, size, 8, hi ? "#1B3A52" : P.cell, hi ? P.gold : P.line, hi ? 3 : 1.6) +
      glyph +
      Tx(x + size - 6, y + 14, letter.toUpperCase(), "lab small muted", "end"),
      { opacity: clamp(o, 0, 1), transform: hi ? around(x + size / 2, y + size / 2, 1.06) : null });
  }
  function cpGridBlock(letters, cols, x, y, size, gap, o, hiIdx, revealCount) {
    var out = "", rc = revealCount == null ? letters.length : revealCount;
    letters.forEach(function (ch, k) {
      var cx0 = x + (k % cols) * (size + gap), cy0 = y + Math.floor(k / cols) * (size + gap);
      var cellO = o * clamp(rc - k, 0, 1);
      out += cpGridCell(cx0, cy0, size, ch, cellO, (hiIdx || []).indexOf(k) >= 0);
    });
    return out;
  }

  var CP_G1 = "abcdefghi".split("");   /* pens 0-8: plain grid */
  var CP_G2 = "jklmnopqr".split("");   /* pens 9-17: the dotted grid */
  var CP_G3 = "stuvwxyz".split("");    /* pens 18-25: the two X shapes */

  /* ==== chapter: the Pigpen cipher =========================================== */
  function cpPigpenChapter(scene, beat, t, i) {
    var cNoshift = sc(scene, 0, "noshift"), cShape = sc(scene, 0, "shape");
    var cGrid = sc(scene, 1, "grid"), cAi = sc(scene, 1, "ai"), cPens = sc(scene, 1, "pens");
    var cSymbol = sc(scene, 2, "symbol"), cLines = sc(scene, 2, "lines");
    var cPen = sc(scene, 3, "pen"), cCorner = sc(scene, 3, "corner");
    var cMiddle = sc(scene, 4, "middle"), cBox = sc(scene, 4, "box");
    var cSecond = sc(scene, 5, "second"), cDot = sc(scene, 5, "dot"), cX = sc(scene, 5, "x");
    var cWrite = sc(scene, 6, "write"), cThree = sc(scene, 6, "three"), cRead = sc(scene, 6, "read");

    var out = "";
    var size = 68, g = 3;

    var g1On = on(t, cGrid, 0.6);
    var aiOn = on(t, cAi, 0.4);
    /* single-owner, last-cue-wins - the same shape as the Caesar chapter's
       hiIdx/label (caesar-and-pigpen.js lines 139-146): each cue below
       reassigns hi1 outright, in chronological order, so the pen lit always
       matches the example just spoken, and moving on to the second grid
       clears it rather than leaving "e" lit through the rest of the chapter. */
    var hi1 = [];
    if (cpPast(t, cPen) || cpPast(t, cCorner)) hi1 = [0];        /* a: top-left pen */
    if (cpPast(t, cMiddle) || cpPast(t, cBox)) hi1 = [4];        /* e: the middle pen */
    if (cpPast(t, cSecond)) hi1 = [];                            /* second grid now: no pen stays lit */
    /* the nine pens fill in as "nine pens" is said, rather than popping in at
       once - "ai" starts the count, "pens" finishes it exactly on the word */
    var revealed1 = cpPast(t, cPens) ? 9 : tally(t, cAi, 9, 1.3);
    out += cpGridBlock(CP_G1, 3, 40, 56, size, g, g1On, hi1, revealed1);
    out += Tx(40 + (3 * size + 2 * g) / 2, 44, "a to i", "lab mid muted", "middle", { opacity: aiOn });

    var g2On = on(t, cSecond, 0.6);
    out += cpGridBlock(CP_G2, 3, 320, 56, size, g, g2On, []);
    out += Tx(320 + (3 * size + 2 * g) / 2, 44, "j to r, with a dot", "lab mid muted", "middle", { opacity: g2On });
    var dotBump = bump(t, cDot, 1.4);
    if (dotBump > 0.02) out += R(320 - 6, 56 - 6, 3 * size + 2 * g + 12, 3 * size + 2 * g + 12, 14,
      "none", P.gold, 3, { opacity: dotBump });

    var g3On = on(t, cX, 0.6);
    out += cpGridBlock(CP_G3, 4, 600, 56, size, g, g3On, []);
    out += Tx(600 + (4 * size + 3 * g) / 2, 44, "s to z: two X shapes", "lab mid muted", "middle", { opacity: g3On });

    var introOn = on(t, cNoshift, 0.5) * (1 - Math.min(1, on(t, cGrid, 0.4)));
    if (introOn > 0) out += MK.pill(880, 100, "a shape, not a shift", introOn, { size: 20, col: P.plum, ink: P.plum });
    var shapeOn = on(t, cShape, 0.5) * (1 - Math.min(1, on(t, cGrid, 0.4)));
    if (shapeOn > 0) out += MK.pill(880, 150, "each letter, its own shape", shapeOn, { size: 20, col: P.plum, ink: P.plum });

    /* one pill, single-owner: reassigned rather than stacked, the same shape
       as hi1 above, and cleared at cSecond too so it never sits under the
       wrong pen once the second grid is on screen. */
    var penLabel = null, penLabelAt = null;
    if (cpPast(t, cPen) || cpPast(t, cCorner)) { penLabel = "a corner: open at top & left"; penLabelAt = cCorner; }
    if (cpPast(t, cMiddle) || cpPast(t, cBox)) { penLabel = "a closed box: lines all round"; penLabelAt = cBox; }
    if (cpPast(t, cSecond)) penLabel = null;
    if (penLabel) out += MK.pill(44, 288, penLabel, on(t, penLabelAt, 0.5), { size: 16, col: P.gold, ink: P.gold, anchor: "start" });

    /* "A letter's symbol is the shape of the lines round its pen": a flash
       round the whole grid, so the words land on the picture they describe */
    var symBump = Math.max(bump(t, cSymbol, 1.6), bump(t, cLines, 1.6));
    if (symBump > 0.02) out += R(40 - 6, 56 - 6, 3 * size + 2 * g + 12, 3 * size + 2 * g + 12, 14,
      "none", P.gold, 3, { opacity: symBump });

    /* "write cat in Pigpen": three of the lesson's own glyphs, read back */
    var wOn = on(t, cWrite, 0.6);
    if (wOn > 0) {
      var wx = 430, wy = 306, cw = 78;
      var revealed = cpPast(t, cRead) ? 3 : tally(t, cThree, 3, 1.2);
      CP_CAT.split("").forEach(function (ch, k) {
        out += cpGridCell(wx + k * (cw + 10), wy, cw, ch, revealed > k ? wOn : 0, false);
      });
      if (cpPast(t, cRead)) out += MK.pill(wx + 1.5 * (cw + 10), wy + cw + 24, CP_CAT, on(t, cRead, 0.4), { size: 22, col: P.good, ink: P.good });
    }

    return svg(out);
  }

  /* ==== chapter: the key is everything ======================================
     Caesar telling his generals the shift, a captured messenger, and then the
     25 shifts a Caesar cipher has to try - a plain fact about the alphabet
     (26 letters, 25 non-zero shifts), not a cipher claim, so nothing here
     needs ART.caesar. */
  function cpKeyChapter(scene, beat, t, i) {
    var cSecret = sc(scene, 0, "secret"), cWhoever = sc(scene, 0, "whoever");
    var cGenerals = sc(scene, 1, "generals"), cAdvance = sc(scene, 1, "advance");
    var cCaught = sc(scene, 2, "caught"), cOpen = sc(scene, 2, "open");
    var cOnly = sc(scene, 3, "only");
    var cOne = sc(scene, 4, "one"), cAppear = sc(scene, 4, "appear"), cWeak = sc(scene, 4, "weak");

    var out = "";
    var keyOn = on(t, cSecret, 0.6);
    out += G(Em(90, 90, 66, "\u{1F511}"), { opacity: keyOn });
    out += Tx(90, 140, "the key", "lab mid muted", "middle", { opacity: keyOn });

    var lockOn = on(t, cWhoever, 0.5);
    out += G(Em(340, 90, 56, cpPast(t, cOpen) ? "\u{1F513}" : "\u{1F512}"), { opacity: lockOn });
    out += Tx(340, 140, "whoever holds it, reads it", "lab mid muted", "middle", { opacity: lockOn });

    var genOn = on(t, cGenerals, 0.5);
    out += G(Em(90, 250, 60, "\u{1F3DB}️"), { opacity: genOn });
    out += Tx(90, 296, "Caesar", "lab mid muted", "middle", { opacity: genOn });
    var advOn = on(t, cAdvance, 0.5);
    out += MK.arrow(126, 250, 250, 250, advOn, P.accent, 5);
    out += G(Em(200, 224, 34, "\u{1F4DC}"), { opacity: advOn });
    out += G(Em(286, 250, 60, "\u{1F9D1}"), { opacity: advOn });
    out += Tx(286, 296, "a general", "lab mid muted", "middle", { opacity: advOn });

    var caughtOn = on(t, cCaught, 0.5);
    if (caughtOn > 0) {
      out += G(Em(200, 190, 40, "\u{1F575}️"), { opacity: caughtOn });
      out += MK.cross(200, 224, 22, popIn(t, cCaught, 0.4));
    }
    var openOn = on(t, cOpen, 0.5);
    if (openOn > 0) out += MK.pill(188, 340, "every message open", openOn, { size: 19, col: P.bad, ink: P.bad });

    /* 25 shifts to try, one by one, until the right one appears */
    var gx = 620, gy = 50, cell = 34, gap = 6, cols = 5;
    var onlyOn = on(t, cOnly, 0.5);
    if (onlyOn > 0) out += MK.pill(gx + (cols * (cell + gap)) / 2 - gap / 2, gy - 24, "25 shifts to try", onlyOn, { size: 20, col: P.muted, ink: P.muted });
    var filled = cpPast(t, cAppear) ? 25 : tally(t, cOne, 25, 2.6);
    for (var k = 0; k < 25; k++) {
      var cx0 = gx + (k % cols) * (cell + gap), cy0 = gy + Math.floor(k / cols) * (cell + gap);
      var show = onlyOn > 0 ? clamp(filled - k, 0, 1) : 0;
      if (show <= 0) continue;
      var isRight = k === 2;   /* shift "3": the one this film has just taught */
      var right = isRight && cpPast(t, cAppear);
      out += R(cx0, cy0, cell, cell, 6, right ? "#1B3A52" : P.cell, right ? P.good : P.line, right ? 3 : 1.6);
      out += Tx(cx0 + cell / 2, cy0 + cell / 2 + 6, String(k + 1), "lab small", "middle", { fill: right ? P.good : P.muted });
      if (isRight) out += MK.tick(cx0 + cell - 7, cy0 + 7, 8, popIn(t, cAppear, 0.35));
    }
    var weakOn = on(t, cWeak, 0.5);
    if (weakOn > 0) out += MK.pill(gx + (cols * (cell + gap)) / 2 - gap / 2, gy + 5 * (cell + gap) + 22, "a weak lock", weakOn, { size: 22, col: P.bad, ink: P.bad });

    return svg(out);
  }
