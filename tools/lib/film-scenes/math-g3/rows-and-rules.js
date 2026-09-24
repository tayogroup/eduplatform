  /* ==== Grade 3 Mathematics, Lesson 3: Rows and Rules =========================
     tools/lib/film-scenes/math-g3/rows-and-rules.js, with -2.js, -3.js and
     -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     mathematics/grade-3-app/lecture-video/rows-and-rules.json.

     Mathematics has no lesson kit, so the drawings come from ART
     (tools/lib/ehel-film-art-math.js): its number line, its 100 square, its
     bar model. The ARRAY is drawn here instead of with ART.array, because
     every array in this film moves - rows arrive one at a time, dots are
     counted one at a time, the whole thing turns ninety degrees, a row loses
     a dot - and ART.array draws one finished array. rrDots copies ART.array's
     own geometry and colours (a light cell panel, round dots, a bracket and a
     count on each side) so that a film array and an ART one are one picture.

     THE NUMBERS ARE THE LESSON'S: the 4 by 6 array its first step opens on,
     24 x 3 split into 20 and 4, 38 x 4 estimated at 40 x 4, 13 shared between
     4 with 12 / 4 estimated first, the growing sequence 3, 6, 9, 12 and its
     shrinking twin 12, 9, 6, 3. Every array drawn is counted: rows x columns
     is what the voice says, in that order.

     This file: the palette, the shared array drawing, the title motif and the
     chapter "Rows and columns". Every top-level name here starts with rr. */

  var HUE = {
    title: P.teal, rows: P.teal, family: P.blue, split: P.gold,
    share: P.accent, multiples: P.plum, rules: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function rrOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function rrFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* on from beat k, off again at beat j */
  function rrBetween(t, scene, k, j) { return rrFrom(t, scene, k) * (1 - rrFrom(t, scene, j)); }

  /* ---- the array ------------------------------------------------------------
     ART.array's geometry, animatable. (cx, cy) is the centre of the panel.
     o: {cell, colour, show (how many dots, row-major, fractional so the last
     one pops), missing ([[row, col], ...]), markRow, markCol, rot (degrees,
     clockwise, about the centre)} */
  var RR_CELL = 46;
  function rrPad(cell) { return cell * 0.28; }
  function rrPanel(rows, cols, cell) {
    var p = rrPad(cell);
    return { w: cols * cell + 2 * p, h: rows * cell + 2 * p, pad: p };
  }
  /* the centre of dot (i, j), in film coordinates, with no rotation */
  function rrDotAt(cx, cy, rows, cols, cell, i, j) {
    var s = rrPanel(rows, cols, cell);
    return [cx - s.w / 2 + s.pad + j * cell + cell / 2, cy - s.h / 2 + s.pad + i * cell + cell / 2];
  }
  function rrDots(cx, cy, rows, cols, o) {
    o = o || {};
    var cell = o.cell || RR_CELL, s = rrPanel(rows, cols, cell);
    var x0 = cx - s.w / 2, y0 = cy - s.h / 2, r = cell * 0.3;
    var fill = o.colour || ART.C.teal, mark = o.markColour || ART.C.accent;
    var show = o.show == null ? rows * cols : o.show;
    var miss = {}, k, i, j, u, col, p;
    (o.missing || []).forEach(function (m) { miss[m[0] + "," + m[1]] = m[2] == null ? 0 : m[2]; });
    var out = R(x0, y0, s.w, s.h, 16, ART.C.cell, ART.C.line, 2);
    for (i = 0; i < rows; i++) {
      for (j = 0; j < cols; j++) {
        k = i * cols + j;
        u = clamp(show - k, 0, 1);
        if (miss[i + "," + j] != null) u *= miss[i + "," + j];
        if (u <= 0.001) continue;
        col = (o.markRow === i || o.markCol === j) ? mark : fill;
        p = rrDotAt(cx, cy, rows, cols, cell, i, j);
        out += C(p[0], p[1], r * u, col);
      }
    }
    return o.rot ? G(out, { transform: "rotate(" + n2(o.rot) + " " + n2(cx) + " " + n2(cy) + ")" }) : out;
  }
  /* the count of rows down the left and of columns along the top, drawn the
     way ART.array draws them; each fades in on its own cue */
  function rrBrackets(cx, cy, rows, cols, cell, oRows, oCols, words) {
    var s = rrPanel(rows, cols, cell), x0 = cx - s.w / 2, y0 = cy - s.h / 2, out = "";
    if (oCols > 0.001) {
      out += G(L(x0 + s.pad, y0 - 16, x0 + s.w - s.pad, y0 - 16, P.muted, 3) +
        Tx(cx, y0 - 30, String(cols), "lab big", "middle", { fill: P.muted }) +
        (words > 0.001 ? Tx(cx, y0 - 60, "columns", "lab mid", "middle", { fill: P.gold, opacity: n3(words) }) : ""),
        { opacity: n3(clamp(oCols, 0, 1)) });
    }
    if (oRows > 0.001) {
      out += G(L(x0 - 16, y0 + s.pad, x0 - 16, y0 + s.h - s.pad, P.muted, 3) +
        Tx(x0 - 34, cy + 10, String(rows), "lab big", "middle", { fill: P.muted }) +
        (words > 0.001 ? Tx(x0 - 34, y0 - 14, "rows", "lab mid", "middle", { fill: P.gold, opacity: n3(words) }) : ""),
        { opacity: n3(clamp(oRows, 0, 1)) });
    }
    return out;
  }

  /* a number sentence on a light card, the way the lesson prints one under an
     array. (x, y) is its centre. */
  function rrFact(x, y, text, o, opt) {
    if (!(o > 0.001)) return "";
    opt = opt || {};
    var size = opt.size || 34, w = opt.w || (String(text).length * size * 0.6 + 34), h = size * 1.7;
    return G(R(x - w / 2, y - h / 2, w, h, 12, opt.fill || ART.C.card, opt.col || ART.C.line, opt.sw || 2.5) +
      Tx(x, y + size * 0.36, text, "lab", "middle", { "font-size": size, fill: opt.ink || ART.C.ink }),
      { opacity: n3(clamp(o, 0, 1)), transform: around(x, y, 0.94 + 0.06 * Math.min(1, o)) });
  }

  /* ==== the title ==============================================================
     The lesson's own opening array, 4 rows of 6, in a round window. The rows
     arrive one at a time on "counting equal groups"; the fact is written under
     it on "neat rows". On the two cards it simply stands. */
  function titleMotif(o) {
    var t = o.t || 0, cell = 38, out = "";
    var cGroups = o.scene ? sc(o.scene, 0, "groups") : null;
    var cRows = o.scene ? sc(o.scene, 0, "rows") : null;
    var cShare = o.scene ? sc(o.scene, 1, "share") : null;
    var cRule = o.scene ? sc(o.scene, 1, "rule") : null;
    var show = o.scene ? (cGroups == null ? 0 : tally(t, cGroups, 4, 1.05) * 6) : 24;
    var lab = o.scene ? on(t, cRows, 0.5) : 1;
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 150, 150, P.teal, o.scene ? on(t, cShare, 0.7) * (0.55 + 0.45 * breathe(t)) : 0.5);
    out += rrDots(180, 146, 4, 6, { cell: cell, show: show });
    /* "find its rule": the pattern runs through the array, left to right */
    var sweep = o.scene ? on(t, cRule, 0.9) : 0;
    if (sweep > 0.001) {
      var sp = rrPanel(4, 6, cell);
      out += el("clipPath", { id: "rrTitleSweep" },
        R(180 - sp.w / 2, 146 - sp.h / 2, sp.w * clamp(sweep, 0, 1), sp.h));
      out += G(rrDots(180, 146, 4, 6, { cell: cell, show: show, colour: ART.C.gold }),
        { "clip-path": "url(#rrTitleSweep)" });
    }
    if (lab > 0.001) {
      out += G(Tx(180, 300, "4 × 6 = 24", "lab", "middle", { "font-size": 44, fill: P.gold }),
        { opacity: n3(lab) });
    }
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="An array of four rows of six dots, four times six is twenty-four">' + out + "</svg>";
  }

  /* ==== chapter: rows and columns ===============================================
     The lesson's first two steps in one drawing: its 4 by 6 array, counted a
     dot at a time, read as rows times columns, broken by a short row, and then
     turned on its side into 6 rows of 4. The closing beat shows both facts
     side by side, ticked: one fact, learned twice. (The chapter used to close
     with a second pay-off example, 8 nines against 9 eights - pure extra
     practice, trimmed to make room for the estimate and shrinking-pattern
     beats the review notes asked for elsewhere in the film.) */
  var RR_AX = 392, RR_AY = 214;

  function rrRowsChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cRows = c(0, "rows"), cSix = c(0, "six");
    var cCount = c(1, "count"), cNot = c(1, "not");
    var cFour = c(2, "four"), cRead = c(2, "read");
    var cEqual = c(3, "equal"), cShort = c(3, "short");
    var cTurn = c(4, "turn");
    var cSixRows = c(5, "six"), cSame = c(5, "same");

    var main = 1, out = "", cell = RR_CELL;

    if (main > 0.001) {
      var turn = on(t, cTurn, 0.95);                /* 0 = 4 rows of 6, 1 = 6 rows of 4 */
      var rot = 90 * ease(turn);
      /* the short row: one dot shrinks away while beat 3 is on screen, and is
         back by the time the array turns */
      var gone = on(t, cShort, 0.35) * (1 - rrFrom(t, scene, 4));
      /* the rows arrive one at a time on "four rows"; from beat 1 the array is
         whole and stays whole */
      var show = cRows == null ? 24 : tally(t, cRows, 4, 0.85) * 6;
      if (cSix != null && t >= cSix) show = 24;
      if (rrFrom(t, scene, 1) > 0) show = 24;

      var panel = rrPanel(4, 6, cell);
      var lit = bump(t, cSix, 1.1) > 0.02 ? 0 : null;   /* the top row, as "six in every row" is said */
      /* the panel arrives with its first row, not before it */
      var arrO = Math.max(on(t, cRows, 0.5), rrFrom(t, scene, 1));
      out += G(rrDots(RR_AX, RR_AY, 4, 6, {
          cell: cell, show: show, missing: [[3, 5, 1 - gone]], rot: rot, markRow: lit
        }) +
        rrBrackets(RR_AX, RR_AY, 4, 6, cell, on(t, cRows, 0.5) * (1 - turn), on(t, cSix, 0.5) * (1 - turn),
          on(t, cRead, 0.5) * (1 - turn)) +
        rrBrackets(RR_AX, RR_AY, 6, 4, cell, on(t, cSixRows, 0.45), on(t, cSixRows, 0.45), 0),
        { opacity: n3(main * arrO) });

      /* "count all twenty-four, one at a time": a ring walks the dots and the
         running total climbs; the cross lands on "you do not need to" */
      var counting = rrOnly(t, scene, 1);
      if (counting > 0.01 && cCount != null) {
        var n = tally(t, cCount, 24, 1.5), stop = on(t, cNot, 0.3);
        var k = clamp(n, 1, 24) - 1;
        var p = rrDotAt(RR_AX, RR_AY, 4, 6, cell, Math.floor(k / 6), k % 6);
        out += G(C(p[0], p[1], cell * 0.42, "none", P.gold, 4), { opacity: n3(counting * (1 - stop)) });
        if (n >= 1) {
          out += G(Tx(880, 196, String(n), "lab", "middle", { "font-size": 96, fill: P.gold }),
            { opacity: n3(counting * (1 - 0.6 * stop)) });
          out += G(Tx(880, 248, n === 1 ? "dot counted" : "dots counted", "lab big", "middle", { fill: P.muted }),
            { opacity: n3(counting * (1 - stop)) });
        }
        out += MK.cross(880, 176, 58, popIn(t, cNot, 0.4) * counting);
        out += G(Tx(880, 342, "one at a time is slow", "lab big", "middle", { fill: P.muted }),
          { opacity: n3(stop * counting) });
      }

      /* "Four sixes is twenty-four": the lesson's own label, kept on screen
         until the closing beat (5) replaces it with the two facts side by
         side */
      var factO = rrBetween(t, scene, 2, 5) * (1 - rrOnly(t, scene, 3)) * on(t, cFour, 0.45) * main;
      out += rrFact(880, 196, turn > 0.5 ? "6 × 4 = 24" : "4 × 6 = 24", factO,
        { size: 48, col: P.gold, fill: "#FFFFFF", sw: 3 });
      if (factO > 0.001) {
        out += G(Tx(880, 276, turn > 0.5 ? "6 rows of 4" : "4 rows of 6", "lab big", "middle", { fill: P.muted }),
          { opacity: n3(factO) });
      }

      /* "Every row must be equal. A short row is not a times fact." */
      var broke = rrOnly(t, scene, 3);
      if (broke > 0.01) {
        var lastRow = rrDotAt(RR_AX, RR_AY, 4, 6, cell, 3, 5);
        /* "Every row must be equal": each row is ringed, one at a time */
        var eq = on(t, cEqual, 0.4) * broke * (1 - on(t, cShort, 0.4));
        if (eq > 0.001) {
          var many = tally(t, cEqual, 4, 0.85);
          for (var q = 0; q < many; q++) {
            out += G(R(RR_AX - panel.w / 2 + panel.pad - 6, rrDotAt(RR_AX, RR_AY, 4, 6, cell, q, 0)[1] - cell / 2 - 4,
              cell * 6 + 12, cell + 8, 12, "none", P.gold, 2.5), { opacity: n3(eq) });
          }
          out += G(Tx(880, 210, "every row the same", "lab big", "middle", { fill: P.gold }), { opacity: n3(eq) });
        }
        /* "A short row": one dot goes, and only then do the counts differ */
        out += G(R(RR_AX - panel.w / 2 + panel.pad - 6, lastRow[1] - cell / 2 - 4, cell * 6 + 12, cell + 8, 12,
          "none", P.bad, 3.5, { "stroke-dasharray": "10 7" }), { opacity: n3(on(t, cShort, 0.4) * broke) });
        out += MK.cross(lastRow[0], lastRow[1], 20, popIn(t, cShort, 0.4) * broke);
        out += G(Tx(880, 174, "5 in this row,", "lab big", "middle", { fill: P.bad }) +
          Tx(880, 220, "6 in the others", "lab big", "middle", { fill: P.bad }) +
          Tx(880, 292, "not a times fact", "lab big", "middle", { fill: P.muted }),
          { opacity: n3(on(t, cShort, 0.5) * broke) });
      }

      /* "Six rows of four. The same dots, looked at another way.": the
         chapter's closing beat - the two facts side by side, ticked, and
         the same 24 dots named again */
      var closing = rrOnly(t, scene, 5);
      if (closing > 0.01) {
        out += rrFact(880, 146, "4 × 6 = 24", on(t, cSixRows, 0.4) * closing, { size: 36, col: P.teal });
        out += rrFact(880, 222, "6 × 4 = 24", on(t, cSixRows, 0.4) * closing, { size: 36, col: P.teal });
        out += MK.tick(880, 300, 26, popIn(t, cSame, 0.4) * closing);
        out += G(Tx(880, 344, "the same 24 dots", "lab big", "middle", { fill: P.gold }),
          { opacity: n3(on(t, cSame, 0.5) * closing) });
        out += G(Tx(880, 372, "one fact, learned twice", "lab big", "middle", { fill: P.muted }),
          { opacity: n3(on(t, cSame, 0.6) * closing) });
      }
    }
    return svg(out);
  }
