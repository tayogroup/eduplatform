
  /* ==== Grade 1 Mathematics, Lesson 1: Counting to Twenty =====================
     tools/lib/film-scenes/math-g1/counting-to-twenty.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-1-app/g1v2/lecture-video/counting-to-twenty.json.

     MATHEMATICS HAS NO LESSON KIT, so every drawing here comes from the shared
     Mathematics picture library (ART, tools/lib/ehel-film-art-math.page.js):
     the ten frame the lesson builds in HTML, its dice patterns, its counters
     boxed in pairs, its number line. What the library does not hold - the
     apples of the estimating step, the socks of the twos step, the racing line
     of the ordinal step, and the two digit boxes of the writing step - is drawn
     here with the engine's own helpers, and said so in the report.

     This file: the palette, the helpers every chapter shares, the title motif
     and the chapter "Counting carefully". Every top-level name here starts with
     ctw, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, count: P.gold, look: P.plum, teen: P.blue,
    twos: P.good, order: P.accent, recap: P.teal
  };

  /* ---- placing one of ART's drawings ----------------------------------------
     ART.place needs a box; every drawing carries its own viewBox, so this reads
     it and centres the drawing inside the box asked for, at the largest scale
     that fits. It hands back the mapping as well (X, Y), so the film can point
     at something INSIDE the drawing - a ten frame's third cell, a number line's
     tick - without guessing where ART put it. */
  function ctwAt(markup, cx, cy, maxW, maxH) {
    var m = String(markup).match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/);
    if (!m) throw new Error("ctwAt: that drawing has no viewBox: " + String(markup).slice(0, 60));
    var vw = parseFloat(m[1]), vh = parseFloat(m[2]);
    var s = Math.min(maxW / vw, maxH / vh), x = cx - vw * s / 2, y = cy - vh * s / 2;
    return {
      s: s, x: x, y: y, w: vw * s, h: vh * s,
      X: function (u) { return x + u * s; },
      Y: function (u) { return y + u * s; },
      draw: function () { return ART.place(markup, x, y, vw * s, vh * s); }
    };
  }

  /* ---- the ten frame's own geometry -----------------------------------------
     ART.tenFrame's numbers (its TF), so a finger can land on the cell that was
     just filled. Cell i counts across the top row of five first, as a child
     lays counters out, then the bottom row, then the second frame. */
  var CTW_TF = { cell: 40, gap: 4, pad: 6, edge: 20, between: 18, fw: 228, fh: 96 };
  function ctwCell(i) {
    var f = Math.floor(i / 10), k = i % 10, col = k % 5, row = k < 5 ? 0 : 1;
    return [CTW_TF.edge + f * (CTW_TF.fw + CTW_TF.between) + CTW_TF.pad + col * (CTW_TF.cell + CTW_TF.gap) + CTW_TF.cell / 2,
            CTW_TF.edge + CTW_TF.pad + row * (CTW_TF.cell + CTW_TF.gap) + CTW_TF.cell / 2];
  }
  /* the outline of whole frame f, in the drawing's own coordinates */
  function ctwFrameRect(f) {
    return [CTW_TF.edge + f * (CTW_TF.fw + CTW_TF.between), CTW_TF.edge, CTW_TF.fw, CTW_TF.fh];
  }
  /* A ten frame whose caption is a single space keeps the same height as one
     carrying a number, so the drawing does not jump when the number arrives. */
  function ctwTF(n, frames, showNumber) {
    return ART.tenFrame(n, { frames: frames, label: showNumber ? String(n) : " " });
  }
  /* a gold ring round something inside a placed drawing */
  function ctwRing(box, rect, o, col, pad) {
    if (!(o > 0)) return "";
    pad = pad == null ? 5 : pad;
    return R(box.X(rect[0]) - pad, box.Y(rect[1]) - pad, rect[2] * box.s + pad * 2, rect[3] * box.s + pad * 2,
      12, "none", col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }
  function ctwRingCell(box, i, o, col) {
    if (!(o > 0)) return "";
    var c = ctwCell(i);
    return C(box.X(c[0]), box.Y(c[1]), CTW_TF.cell * box.s * 0.62, "none", col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }

  /* how many of the cue times in `times` have been reached by t */
  function ctwStep(t, times) {
    var n = 0;
    for (var k = 0; k < times.length; k++) if (times[k] != null && t >= times[k]) n = k + 1;
    return n;
  }
  /* a big number, popped in about (x, y) */
  function ctwNum(x, y, text, size, p, col) {
    if (!(p > 0)) return "";
    return MK.pop(Tx(x, y + size * 0.36, String(text), "lab", "middle", { "font-size": size, fill: col || P.ink }), x, y, p);
  }
  /* MK's finger, half again as big: at its own size it reads as a smudge
     against a 40 px ten-frame cell. The tip stays on (x, y). */
  function ctwFinger(x, y, o) {
    if (!(o > 0)) return "";
    return G(MK.finger(x, y, 1), { transform: around(x, y, 1.45), opacity: clamp(o, 0, 1) });
  }
  /* one counter, the colour ART fills a ten frame with */
  var CTW_DOT = "#F26B2A";
  function ctwDot(x, y, r, o, col) {
    if (!(o > 0)) return "";
    return C(x, y, r, col || CTW_DOT, null, null, { opacity: clamp(o, 0, 1) });
  }
  /* a chapter drawn one beat at a time: the beat before fades out under it, so
     nothing is ever left over from a beat that has finished (rule 7) */
  function ctwChapter(scene, t, i, drawBeat) {
    return svg(crossfade(t, i, scene, function (k) { return drawBeat(scene, k - scene.first, t); }));
  }

  /* ==== the title ==============================================================
     Two ten frames in a round window, filling to twenty as the first line is
     said - the lesson's own picture of what "to twenty" means. On the second
     line three small emblems arrive, one for each thing the film teaches: a
     finger touching one counter, a number to read, and a pair with one left
     over. On the title and end cards the frames simply stand full. */
  function ctwMotifCount(t, o) {
    if (!o.scene) return 20;
    var at = sc(o.scene, 0, "count");
    if (at == null || t < at) return 0;
    return tally(t, at, 20, 2.4);
  }
  function titleMotif(o) {
    var t = o.t || 0, n = ctwMotifCount(t, o), out = "";
    var twenty = o.scene ? sc(o.scene, 0, "twenty") : null;
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 190, 150, P.gold, on(t, twenty, 0.6) * (0.55 + 0.45 * breathe(t)));
    out += ctwAt(ctwTF(n, 2, true), 180, 196, 318, 132).draw();
    if (o.scene) {
      var cCare = sc(o.scene, 1, "careful"), cRead = sc(o.scene, 1, "read"), cOdd = sc(o.scene, 1, "odd");
      out += MK.finger(88, 74, on(t, cCare, 0.4));
      out += MK.pill(180, 80, "13", popIn(t, cRead, 0.4), { size: 26, col: P.gold });
      var po = popIn(t, cOdd, 0.4);
      if (po > 0) out += MK.pop(C(258, 70, 11, P.teal) + C(258, 94, 11, P.teal) + C(292, 82, 11, P.accent), 272, 82, po);
    }
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Two ten frames filling up to twenty">' + out + "</svg>";
  }

  /* ==== chapter: counting carefully ===========================================
     The lesson's step 1, done as the lesson does it: counters go into a ten
     frame one at a time, one number said for each; the same counter is never
     given two numbers; the full frame is mixed up and is still ten; and then
     they are taken away, down to zero. */
  function ctwCountBeat(scene, k, t) {
    var c = function (kk, name) { return sc(scene, kk, name); };
    var out = "";

    if (k === 0) {
      /* one number, one thing: the numeral, then the counter it names */
      var b0 = ctwAt(ctwTF(0, 1, false), 300, 214, 470, 290);
      out += b0.draw();
      out += ctwNum(846, 128, "1", 96, popIn(t, c(0, "one"), 0.4), P.gold);
      var eo = popIn(t, c(0, "each"), 0.45);
      out += MK.leader(846, 186, 846, 254, on(t, c(0, "each"), 0.5), P.gold);
      out += ctwDot(846, 300, 42, eo);
      return out;
    }

    if (k === 1) {
      /* touch each one once: a counter lands as each number is said */
      var n1 = c(1, "n1"), n2 = c(1, "n2"), n3 = c(1, "n3"), cT = c(1, "touch");
      var n = ctwStep(t, [n1, n2, n3]);
      var b1 = ctwAt(ctwTF(n, 1, false), 300, 214, 470, 290);
      out += b1.draw();
      var last = Math.max(0, n - 1), cell = ctwCell(last);
      out += MK.ripple(b1.X(cell[0]), b1.Y(cell[1]), t, [n1, n2, n3][last], P.gold);
      var fo = Math.max(on(t, cT, 0.4) * (n === 0 ? 1 : 0), n > 0 ? 1 : 0);
      var fc = ctwCell(n === 0 ? 0 : last);
      out += ctwFinger(b1.X(fc[0]) + 4, b1.Y(fc[1]) + 16, fo);
      [n1, n2, n3].forEach(function (at, j) {
        out += ctwNum(880, 118 + j * 96, String(j + 1), 64, popIn(t, at, 0.35), P.gold);
      });
      return out;
    }

    if (k === 2) {
      /* never two numbers for one thing */
      var b2 = ctwAt(ctwTF(3, 1, false), 300, 214, 470, 290);
      out += b2.draw();
      var cc = ctwCell(2), cx = b2.X(cc[0]), cy = b2.Y(cc[1]);
      var nv = popIn(t, c(2, "never"), 0.4), sa = popIn(t, c(2, "same"), 0.4);
      out += ctwNum(cx - 44, cy - 108, "3", 54, nv, P.gold);
      out += ctwNum(cx + 44, cy - 108, "4", 54, popIn(t, c(2, "never") == null ? null : c(2, "never") + 0.3, 0.4), P.bad);
      out += MK.leader(cx - 44, cy - 84, cx - 6, cy - 34, on(t, c(2, "never"), 0.5), P.gold);
      out += MK.leader(cx + 44, cy - 84, cx + 6, cy - 34, on(t, c(2, "never") == null ? null : c(2, "never") + 0.3, 0.5), P.bad);
      out += ctwRingCell(b2, 2, on(t, c(2, "same"), 0.4), P.bad);
      out += MK.cross(880, 214, 54, sa);
      return out;
    }

    if (k === 3) {
      /* on to the end of the frame: ten */
      var cK = c(3, "keep"), cE = c(3, "end"), cTen = c(3, "ten");
      var n3f = 3 + tally(t, cK, 7, 1.7);
      var b3 = ctwAt(ctwTF(n3f, 1, cTen != null && t >= cTen), 300, 214, 470, 290);
      out += b3.draw();
      out += ctwRingCell(b3, 9, bump(t, cE, 1.3), P.gold);
      out += ctwRing(b3, ctwFrameRect(0), on(t, cTen, 0.5), P.good, 9);
      out += MK.tick(880, 214, 40, popIn(t, cTen, 0.4));
      return out;
    }

    if (k === 4) {
      /* mix them up: the same ten, laid out another way */
      var cM = c(4, "mix"), cN = c(4, "nothing"), cS = c(4, "still");
      var b4 = ctwAt(ctwTF(10, 1, false), 258, 196, 400, 250);
      out += b4.draw();
      var mo = popIn(t, cM, 0.45);
      if (mo > 0) {
        var loose = ctwAt(ART.counters(10, { cols: 4, label: " " }), 880, 196, 290, 270);
        out += MK.pop(loose.draw(), 880, 196, mo);
      }
      out += MK.arrow(500, 196, 692, 196, on(t, cM, 0.5), P.gold, 9);
      out += MK.tick(596, 314, 30, popIn(t, cN, 0.4));
      out += MK.pill(258, 382, "10", popIn(t, cS, 0.4), { size: 38, col: P.good });
      out += MK.pill(880, 382, "10", popIn(t, cS == null ? null : cS + 0.2, 0.4), { size: 38, col: P.good });
      return out;
    }

    /* k === 5: take them all away, down to zero */
    var cA = c(5, "away"), cZ = c(5, "zero"), cNm = c(5, "number");
    var n5 = 10 - tally(t, cA, 10, 1.7);
    var b5 = ctwAt(ctwTF(n5, 1, false), 296, 206, 450, 280);
    out += b5.draw();
    out += ctwRing(b5, ctwFrameRect(0), on(t, cZ, 0.5) * (n5 === 0 ? 1 : 0), P.gold, 9);
    out += ctwNum(872, 132, "0", 108, popIn(t, cZ, 0.45), P.gold);
    var zo = popIn(t, cNm, 0.45);
    if (zo > 0) {
      var line = ctwAt(ART.numberLine({ from: 0, to: 5, step: 1, labelEvery: 1, marks: [{ at: 0 }], width: 420 }), 872, 318, 440, 120);
      out += MK.pop(line.draw(), 872, 318, zo);
    }
    return out;
  }

  function ctwCountChapter(scene, beat, t, i) { return ctwChapter(scene, t, i, ctwCountBeat); }
