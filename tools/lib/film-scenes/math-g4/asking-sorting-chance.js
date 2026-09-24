  /* ==== Grade 4 Mathematics, Lesson 8: Asking, Sorting and Chance ==============
     tools/lib/film-scenes/math-g4/asking-sorting-chance.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     mathematics/grade-4-app/lecture-video/asking-sorting-chance.json.

     Mathematics has no lesson kit, so every drawing here is either one of the
     shared Maths pictures (ART: tally, barChart, pictogram, sortDiagram,
     spinner, dice, fraction) or drawn with the engine's own helpers. The
     numbers are the lesson page's: its survey A4 = {Walk 9, Bus 6, Car 4,
     Bike 3} and B4 = {5, 11, 4, 2}, both 22 children; its Venn examples 12, 8,
     15 and 7; its four-equal-part spinner at 10 and 1000 spins.

     This file: the palette, the shared survey data, the small helpers, the
     title motif and the chapter "Ask, then tally". Every top-level name here
     starts with as, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, plan: P.gold, pictures: P.blue, sorting: P.plum,
    compare: P.accent, chance: P.good, spin: P.gold, recap: P.teal
  };

  /* ---- the lesson's own survey ------------------------------------------------
     asking-sorting-chance.html :: CATS, ICON, A4 and B4. 9 + 6 + 4 + 3 = 22,
     and 5 + 11 + 4 + 2 = 22. */
  var AS_CATS = ["Walk", "Bus", "Car", "Bike"];
  var AS_ICON = ["\u{1F6B6}", "\u{1F68C}", "\u{1F697}", "\u{1F6B2}"];
  var AS_A = [9, 6, 4, 3];
  var AS_B = [5, 11, 4, 2];
  function asBars(counts) {
    return AS_CATS.map(function (c, k) { return { label: c, value: counts[k] }; });
  }

  /* ---- timing ------------------------------------------------------------------ */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does:
     for a thing that belongs to that beat alone (rule 7) */
  function asOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function asFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 until the chapter's beat k arrives, then 0 */
  function asUntil(t, scene, k) { return 1 - asFrom(t, scene, k); }

  /* ---- small drawings the film shares ------------------------------------------ */

  /* a gate of five tally strokes, its middle at (cx, cy), `n` of them drawn
     (0 to 5); h is the height of a stroke */
  function asGate(cx, cy, h, n, col, o) {
    if (!(o > 0) || !(n > 0)) return "";
    var pitch = h * 0.24, w = 3 * pitch, x0 = cx - w / 2, y0 = cy - h / 2, out = "", k;
    for (k = 0; k < Math.min(4, n); k++) out += L(x0 + k * pitch, y0, x0 + k * pitch, y0 + h, col || P.teal, h * 0.12);
    if (n >= 5) out += L(x0 - pitch * 0.55, y0 + h * 0.9, x0 + w + pitch * 0.55, y0 + h * 0.1, col || P.teal, h * 0.12);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* one round counter of the lesson's colour */
  function asCounter(cx, cy, r, col, o) {
    if (!(o > 0)) return "";
    return C(cx, cy, r, col, "#0B1D2C", r * 0.14, { opacity: clamp(o, 0, 1) });
  }

  /* a card the film draws itself, in the stage's own dark tokens */
  function asCard(x, y, w, h, lit, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 22, lit > 0 ? "#1B3A52" : P.card, lit > 0 ? P.gold : P.line, lit > 0 ? 3 : 2,
      { opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill with a line from it to the thing it names */
  function asLabel(t, x, y, text, at, to, col, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    col = col || P.gold;
    return MK.leader(x - 8, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 26, anchor: "start", col: col });
  }

  /* ==== the title motif ==========================================================
     A round window holding the four things the lesson does: a gate of five
     tally strokes, the survey as bars, two overlapping hoops, and a spinner of
     four equal parts. In the spoken title chapter each lights as it is named -
     record it, draw it, sort it, how likely it is - and a question mark sits
     in the middle until the word "data" arrives. On the two cards all four
     simply stand. */
  var AS_RINGS = [[246, 188], [294, 188]];
  function asMotifTally(cx, cy, hot) {
    return asGate(cx, cy, 52, 5, hot > 0 ? P.gold : P.teal, 1);
  }
  function asMotifBars(x0, base, hot, grow) {
    var out = "", k, bw = 18, gap = 10, top;
    for (k = 0; k < 4; k++) {
      top = base - AS_A[k] * 7.2 * clamp(grow, 0, 1);
      out += R(x0 + k * (bw + gap), top, bw, base - top, 4, hot > 0 ? P.gold : P.blue);
    }
    return out + L(x0 - 6, base, x0 + 4 * bw + 3 * gap + 6, base, P.muted, 3);
  }
  function asMotifRings(hot) {
    var col = hot > 0 ? P.gold : P.plum;
    return C(AS_RINGS[0][0], AS_RINGS[0][1], 34, col, col, 3, { "fill-opacity": 0.2 }) +
      C(AS_RINGS[1][0], AS_RINGS[1][1], 34, col, col, 3, { "fill-opacity": 0.2 });
  }
  function asMotifSpinner(cx, cy, r, hot, turn) {
    var out = "", k, a0, a1, tones = [P.teal, P.accent, P.plum, P.gold];
    for (k = 0; k < 4; k++) {
      a0 = (k * 90 - 90) * Math.PI / 180; a1 = ((k + 1) * 90 - 90) * Math.PI / 180;
      out += Pth("M" + n2(cx) + "," + n2(cy) + " L" + n2(cx + r * Math.cos(a0)) + "," + n2(cy + r * Math.sin(a0)) +
        " A" + n2(r) + "," + n2(r) + " 0 0,1 " + n2(cx + r * Math.cos(a1)) + "," + n2(cy + r * Math.sin(a1)) + " Z",
        tones[k], "#0B1D2C", 2);
    }
    var a = (turn || 0) - Math.PI / 2;
    out += L(cx, cy, cx + r * 0.72 * Math.cos(a), cy + r * 0.72 * Math.sin(a), P.ink, 5);
    out += C(cx, cy, r * 0.14, P.ink);
    if (hot > 0) out += C(cx, cy, r + 8, "none", P.gold, 4, { opacity: hot });
    return out;
  }
  function titleMotif(o) {
    var t = o.t || 0, sc0 = o.scene, out = "";
    var cAsk = sc0 ? sc(sc0, 0, "askthem") : null, cData = sc0 ? sc(sc0, 0, "data") : null;
    var cRec = sc0 ? sc(sc0, 1, "record") : null, cDraw = sc0 ? sc(sc0, 1, "drawit") : null;
    var cSort = sc0 ? sc(sc0, 1, "sortit") : null, cLike = sc0 ? sc(sc0, 1, "likely") : null;
    var live = !!sc0;
    var show = live ? Math.max(0.3, on(t, cData, 0.8)) : 1;
    var grow = live ? on(t, cDraw, 0.9) : 1;

    out += C(180, 180, 172, "#123247");
    out += G(asMotifTally(180, 78, on(t, cRec, 0.4)), { opacity: show });
    out += G(asMotifBars(66, 214, on(t, cDraw, 0.4), grow), { opacity: show });
    out += G(asMotifRings(on(t, cSort, 0.4)), { opacity: show });
    out += G(asMotifSpinner(180, 292, 42, on(t, cLike, 0.4), live ? on(t, cLike, 1.2) * 4.2 : 0.9), { opacity: show });
    out += C(180, 180, 172, "none", P.line, 3);
    if (live) {
      var q = popIn(t, cAsk, 0.4) * (1 - on(t, cData, 0.5));
      if (q > 0) out += MK.qmark(180, 180, 30, Math.min(1, q));
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A tally gate, a bar chart, two sorting hoops and a spinner">' +
      out + "</svg>";
  }

  /* ==== chapter: Ask, then tally =================================================
     Beats 0 to 2 are the two kinds of answer - names on the left, numbers on
     the right - each lit and named as the voice reaches it. Beats 3 and 4 are
     the tally: one gate of five built stroke by stroke, then the whole survey
     as four tally cards, one per group, each popping in as its number is said. */
  function asKindsHalf(t, x, lit, head, noteAt, chips, note) {
    var out = asCard(x, 92, 500, 276, lit, 1);
    out += Tx(x + 250, 138, head, "lab big", "middle", { fill: lit > 0 ? P.gold : P.muted });
    if (chips) {
      chips.forEach(function (ch, k) {
        var cx = x + (k % 2 ? 374 : 126), cy = k < 2 ? 196 : 286, p = popIn(t, ch.at, 0.4);
        if (p <= 0) return;
        out += MK.pop(Em(cx, cy - 12, 52, ch.pic) + Tx(cx, cy + 40, ch.text, "lab", "middle"), cx, cy, p);
      });
    }
    if (note) out += Tx(x + 250, note.y, note.text, note.cls || "lab mid muted readable", "middle", { opacity: on(t, noteAt, 0.4) });
    return out;
  }

  function asPlanChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cDecide = c(0, "decide"), cNames = c(0, "names"), cNums = c(0, "numbers");
    var cGroups = c(1, "groups"), cCat = c(1, "categorical");
    var cHow = c(2, "howmany"), cCount = c(2, "counted"), cDisc = c(2, "discrete");
    var cChildren = c(3, "children"), cStroke = c(3, "stroke"), cFifth = c(3, "fifth"), cGate = c(3, "gate");
    var cFives = c(4, "fives"), cAll = c(4, "alltotal");
    var atCat = [c(4, "walk"), c(4, "bus"), c(4, "car"), c(4, "bike")];

    var early = asUntil(t, scene, 3), late = asFrom(t, scene, 3), out = "";

    /* ---- beats 0 to 2: what would answer the question ---- */
    if (early > 0.01) {
      var e = "";
      e += MK.pill(584, 46, "What shall we collect?", on(t, cDecide, 0.4), { size: 30, col: P.gold });
      e += asKindsHalf(t, 64, on(t, cNames, 0.4), "names", null,
        AS_CATS.map(function (name, k) {
          return { text: name, pic: AS_ICON[k], at: cNames == null ? null : cNames + 0.16 * k };
        }), null);
      /* "groups you can name": all four together, inside one ring */
      e += R(88, 152, 452, 196, 18, "none", P.gold, 3, { opacity: on(t, cGroups, 0.5) });
      e += asKindsHalf(t, 604, on(t, cNums, 0.4), "numbers", cHow, null,
        { text: "brothers and sisters", y: 320 });
      /* the whole numbers a child would count */
      var no = on(t, cHow, 0.4);
      if (no > 0) {
        ["0", "1", "2", "3"].forEach(function (d, k) {
          var dx = 704 + k * 100, p = popIn(t, cHow == null ? null : cHow + 0.14 * k, 0.35);
          e += MK.pop(Tx(dx, 250, d, "lab huge", "middle", { fill: k === 0 ? P.muted : P.ink }), dx, 236, p);
        });
        e += L(672, 274, 1036, 274, P.line, 3, { opacity: on(t, cCount, 0.5) });
      }
      e += MK.pill(314, 400, "categorical data", on(t, cCat, 0.4), { size: 28, col: P.gold, ink: P.gold });
      e += MK.pill(854, 400, "discrete data", on(t, cDisc, 0.4), { size: 28, col: P.gold, ink: P.gold });
      out += G(e, { opacity: early });
    }

    /* ---- beats 3 and 4: the tally ---- */
    if (late > 0.01) {
      var l = "", one = asUntil(t, scene, 4), two = asFrom(t, scene, 4);
      if (one > 0.01) {
        var marks = (cChildren != null && t >= cChildren ? 1 : 0) +
          tally(t, cStroke, 3, 0.9) + (cFifth != null && t >= cFifth ? 1 : 0);
        var g = "";
        g += MK.pill(160, 56, "22 children answer", on(t, cChildren, 0.4), { size: 27, anchor: "start", col: P.teal });
        g += asCard(410, 92, 348, 240, 0, 1);
        g += asGate(584, 206, 180, Math.min(5, marks), P.teal, 1);
        g += asLabel(t, 792, 382, "a gate of five", cGate, [648, 258], P.gold, 28);
        l += G(g, { opacity: one });
      }
      if (two > 0.01) {
        var f = "";
        AS_CATS.forEach(function (name, k) {
          var p = popIn(t, atCat[k], 0.4);
          if (p <= 0) return;
          var bx = k % 2 ? 628 : 56, by = k < 2 ? 36 : 216;
          f += MK.pop(ART.place(ART.tally(AS_A[k], { label: name + " · " + AS_A[k] }), bx, by, 484, 160),
            bx + 242, by + 80, Math.min(1, p));
        });
        f += MK.pill(584, 408, "22 in all", on(t, cAll, 0.4), { size: 30, col: P.gold, ink: P.gold });
        f += MK.pill(140, 408, "count in fives", on(t, cFives, 0.4), { size: 24, anchor: "start", col: P.teal });
        l += G(f, { opacity: two });
      }
      out += G(l, { opacity: late });
    }
    return svg(out);
  }
