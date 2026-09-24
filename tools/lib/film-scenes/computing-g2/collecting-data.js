  /* ==== Grade 2 Computing, Lesson 7: Collecting Data ==========================
     tools/lib/film-scenes/computing-g2/collecting-data.js, with -2.js, -3.js and
     -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/collecting-data.json.

     THE FILM AGREES WITH ITSELF BECAUSE EVERY FIGURE COMES FROM ONE LIST.
     CD_ANSWERS is the lesson's own survey step - the eight children answer
     banana, apple, grapes, banana, apple, banana, orange, banana - and every
     number the film draws is counted off it: the tally marks (one per answer,
     written in the order they were given), each fruit's count, the form's
     running totals and the total of eight. Nothing is typed in twice, so the
     voice's "four marks for banana, two for apple" and "eight children answer"
     cannot come apart from the picture. The lesson's own tally line for the
     same eight answers is "Apple || Banana |||| Orange | Grapes |".

     This file: the palette, the eight answers, the tally chart, the paper and
     the panels every chapter shares, the title motif and the chapter "Why
     computers keep data". Every top-level name here starts with cd. */

  var HUE = {
    title: P.teal, keep: P.blue, purpose: P.gold, ways: P.accent,
    stat: P.plum, kinds: P.good, backup: P.gold, recap: P.teal
  };

  /* ---- the lesson's eight answers, and everything counted off them --------- */
  var CD_ANSWERS = ["banana", "apple", "grapes", "banana", "apple", "banana", "orange", "banana"];
  var CD_FRUIT = [
    { id: "apple", pic: "\u{1F34E}", label: "Apple" },
    { id: "banana", pic: "\u{1F34C}", label: "Banana" },
    { id: "orange", pic: "\u{1F34A}", label: "Orange" },
    { id: "grapes", pic: "\u{1F347}", label: "Grapes" }
  ];
  CD_FRUIT.forEach(function (f) {
    f.n = CD_ANSWERS.filter(function (a) { return a === f.id; }).length;
  });
  var CD_TOTAL = CD_ANSWERS.length;

  /* how many marks each fruit has once `shown` of the eight answers are written */
  function cdGot(shown) {
    var out = {};
    CD_FRUIT.forEach(function (f) { out[f.id] = 0; });
    for (var k = 0; k < Math.min(shown, CD_TOTAL); k++) out[CD_ANSWERS[k]]++;
    return out;
  }
  /* everything written: the state every still outside a counting beat shows */
  var CD_ALL = cdGot(CD_TOTAL);

  /* ---- timing -------------------------------------------------------------- */
  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does */
  function cdOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on */
  function cdFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  function cdPast(t, at) { return at != null && t >= at; }

  /* ---- the marks, and the chart they stand in ------------------------------ */

  /* n tally marks, upright, the newest one still arriving. A count never goes
     past four here, so there is no gate-and-bar five to draw. */
  function cdTally(x, cy, n, h, pitch, col, o) {
    if (!(n > 0) || !(o > 0)) return "";
    var out = "";
    for (var k = 0; k < Math.ceil(n); k++) {
      var p = clamp(n - k, 0, 1);
      out += L(x + k * pitch, cy - h / 2, x + k * pitch, cy + h / 2, col, Math.max(3, h * 0.11), { opacity: p * o });
    }
    return out;
  }

  /* The tally chart: one row per fruit, in the lesson's own option order, each
     row the fruit, its marks and - once every one of its answers is written -
     its count. opt: {got, ink, o, ring (a fruit id), rowH, em, markX, countX,
     markH, label} */
  function cdChart(x, y, w, opt) {
    opt = opt || {};
    var got = opt.got || CD_ALL, ink = opt.ink || P.ink, o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var rowH = opt.rowH || 68, em = opt.em || 34, markX = opt.markX == null ? w * 0.46 : opt.markX,
      countX = opt.countX == null ? w * 0.86 : opt.countX, markH = opt.markH || 34, out = "";
    CD_FRUIT.forEach(function (f, k) {
      var cy = y + rowH / 2 + k * rowH, n = got[f.id] || 0;
      if (opt.ring === f.id)
        out += R(x - 8, cy - rowH / 2 + 3, w + 16, rowH - 6, 12, "none", P.gold, 3);
      out += Em(x + em * 0.6, cy, em, f.pic);
      if (opt.label !== false)
        out += Tx(x + em * 1.3, cy + em * 0.24, f.label, "lab", "start", { fill: ink, "font-size": em * 0.66 });
      out += cdTally(x + markX, cy, n, markH, markH * 0.44, opt.mark || P.gold, 1);
      if (n >= f.n) {
        out += G(C(x + countX, cy, markH * 0.52, "none", P.good, 3) +
          Tx(x + countX, cy + markH * 0.2, String(f.n), "lab", "middle", { fill: P.good, "font-size": markH * 0.62 }),
          { opacity: 1 });
      }
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a sheet of paper, ruled, with a torn top corner */
  function cdPaper(x, y, w, h, o) {
    if (!(o > 0)) return "";
    var out = R(x, y, w, h, 8, P.paper, "#CFC8B6", 2), k;
    for (k = 1; k < 5; k++) out += L(x + 16, y + h * k / 5, x + w - 16, y + h * k / 5, "#E4DDCB", 2);
    out += Pth("M" + n2(x + w - 34) + "," + n2(y) + " l10,9 l-9,8 l12,7 l-8,8 l13,6 l14,-6 l0,-32 Z", P.ground);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* juice across the paper, and the writing running with it */
  function cdSpill(cx, cy, r, o) {
    if (!(o > 0)) return "";
    return G(E(cx, cy, r * 1.35, r * 0.82, "#E07A3C", null, null, { opacity: 0.55 }) +
      E(cx - r * 0.7, cy + r * 0.4, r * 0.52, r * 0.34, "#E07A3C", null, null, { opacity: 0.45 }) +
      E(cx + r * 0.8, cy - r * 0.32, r * 0.42, r * 0.28, "#E07A3C", null, null, { opacity: 0.4 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* The kit's laptop, with THE SAME FRUIT ANSWERS on its screen in place of the
     figure's own "hello": the voice says "the computer's copy", so the computer
     has to be holding the data the paper beside it holds. The screen's inner
     rect is x 72, y 32, 216 x 126 of the figure's own 360 x 268 viewBox, and
     ART.place nests the drawing with the browser's default xMidYMid meet, so
     the box is worked out here the same way rather than measured off a still.
     Four fruits, two by two, and no numbers: they are on the paper next to it,
     and a count small enough to fit this screen would be too small to read. */
  function cdLaptop(x, y, w, h, o) {
    if (!(o > 0)) return "";
    var s = Math.min(w / 360, h / 268), ox = x + (w - 360 * s) / 2, oy = y + (h - 268 * s) / 2;
    var sx = ox + 72 * s, sy = oy + 32 * s, sw = 216 * s, sh = 126 * s;
    var inner = R(sx, sy, sw, sh, 4 * s, P.ground);
    CD_FRUIT.forEach(function (f, k) {
      inner += Em(sx + sw * (k % 2 === 0 ? 0.29 : 0.71), sy + sh * (k < 2 ? 0.34 : 0.74), sh * 0.34, f.pic);
    });
    return G(ART.place(ART.figure("laptop"), x, y, w, h) + inner, { opacity: clamp(o, 0, 1) });
  }

  /* one of the four things a computer can do with data */
  function cdDoes(x, y, w, h, pic, word, p) {
    if (!(p > 0)) return "";
    return MK.pop(R(x, y, w, h, h * 0.34, P.cell, P.teal, 2.5) +
      Em(x + h * 0.56, y + h / 2, h * 0.56, pic) +
      Tx(x + h * 1.02, y + h / 2 + 7, word, "lab mid", "start"),
      x + w / 2, y + h / 2, p);
  }

  /* ==== the title ===============================================================
     The lesson's own tally chart: the four fruits, a mark for each of the eight
     answers, and each count once its row is complete. In the spoken title
     chapter the card arrives on "the class party", the four fruits on "to ask",
     the eight marks are written one by one on "Eight children answer", and the
     banana row is ringed on "Four of them choose banana". On the two cards it
     stands finished. */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cParty = sn ? sc(sn, 0, "party") : null, cAsk = sn ? sc(sn, 0, "ask") : null,
      cEight = sn ? sc(sn, 1, "eight") : null, cFour = sn ? sc(sn, 1, "four") : null;
    var card = sn ? popIn(t, cParty, 0.45) : 1;
    var rows = sn ? on(t, cAsk, 0.5) : 1;
    var shown = sn ? tally(t, cEight, CD_TOTAL, 1.5) : CD_TOTAL;
    var ring = sn ? (cdPast(t, cFour) ? "banana" : null) : "banana";

    out += MK.pop(R(8, 26, 344, 308, 30, P.card, P.line, 3), 180, 180, card);
    out += Tx(180, 74, "Which fruit?", "lab big", "middle", { opacity: card, fill: P.gold });
    if (rows > 0)
      out += G(cdChart(34, 96, 292, { got: cdGot(shown), rowH: 54, em: 30, markX: 150,
        countX: 258, markH: 28, ring: ring }), { opacity: rows });
    out += Tx(180, 322, CD_TOTAL + " answers", "lab mid muted", "middle",
      { opacity: sn ? on(t, cEight, 0.6) : 1 });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A tally chart of eight answers: apple two, banana four, orange one, grapes one">' + out + "</svg>";
  }

  /* ==== chapter: why computers keep data ==========================================
     The same eight answers twice: written on paper on the left, and held by the
     lesson's own laptop on the right. The juice lands on the paper and the
     writing runs; the computer's copy is ticked, and the four things it can do
     arrive one at a time as they are named. */
  var CD_STRIP = { r: 26, pitch: 82, cy: 48 };
  var CD_KEEP = {
    paper: { x: 36, y: 102, w: 470, h: 306 },
    comp: { x: 562, y: 102, w: 570, h: 306 },
    lap: { x: 586, y: 150, w: 300, h: 223 },
    does: { x: 906, w: 210, h: 58, gap: 12 }
  };
  function cdDoesY(k) {
    var d = CD_KEEP.does, all = 4 * d.h + 3 * d.gap;
    return CD_KEEP.comp.y + (CD_KEEP.comp.h - all) / 2 + k * (d.h + d.gap);
  }

  function cdKeepChapter(scene, beat, t, i) {
    var cData = sc(scene, 0, "data"), cPaper = sc(scene, 0, "paper"), cComp = sc(scene, 0, "computer");
    var cSpilt = sc(scene, 1, "spilt"), cSafe = sc(scene, 1, "safe");
    var cSearch = sc(scene, 2, "search"), cCopy = sc(scene, 2, "copy"), cSend = sc(scene, 2, "send");
    var cCount = sc(scene, 3, "count"), cBlink = sc(scene, 3, "blink");
    var out = "";

    /* the data itself: one circle per child's answer, in the order given */
    var got = tally(t, cData, CD_TOTAL, 1.1);
    var first = (1168 - ((CD_TOTAL - 1) * CD_STRIP.pitch + 2 * CD_STRIP.r)) / 2 + CD_STRIP.r;
    CD_ANSWERS.forEach(function (id, k) {
      var p = popIn(t, cData == null ? null : cData + k * (1.1 / CD_TOTAL), 0.35);
      if (!(p > 0) || k >= got) return;
      var cx = first + k * CD_STRIP.pitch;
      out += MK.pop(C(cx, CD_STRIP.cy, CD_STRIP.r, P.cell, P.line, 2) +
        Em(cx, CD_STRIP.cy, CD_STRIP.r * 1.25, CD_FRUIT.filter(function (f) { return f.id === id; })[0].pic),
        cx, CD_STRIP.cy, p);
    });

    /* on paper */
    var pp = popIn(t, cPaper, 0.45), spill = on(t, cSpilt, 0.6);
    var P0 = CD_KEEP.paper;
    out += Tx(P0.x + P0.w / 2, P0.y - 14, "on paper", "lab mid muted", "middle", { opacity: Math.min(1, pp) });
    out += MK.pop(cdPaper(P0.x, P0.y, P0.w, P0.h, 1), P0.x + P0.w / 2, P0.y + P0.h / 2, pp);
    if (pp > 0)
      out += G(cdChart(P0.x + 40, P0.y + 22, P0.w - 80, { got: cdGot(tally(t, cPaper, CD_TOTAL, 1.2)),
        ink: "#2A2A2A", mark: "#3B3B3B", rowH: 66, em: 36, markX: 176, countX: 320, markH: 34 }),
        { opacity: Math.min(1, pp) * (1 - 0.7 * spill) });
    out += cdSpill(P0.x + P0.w * 0.55, P0.y + P0.h * 0.56, 96, spill);
    if (spill > 0) out += MK.pic(P0.x + 74, P0.y + 52, 60, "\u{1F964}", { opacity: spill });
    out += MK.cross(P0.x + P0.w - 30, P0.y + P0.h - 26, 28, popIn(t, cSpilt == null ? null : cSpilt + 0.5, 0.4));

    /* on a computer */
    var cp = popIn(t, cComp, 0.45), C0 = CD_KEEP.comp, L0 = CD_KEEP.lap;
    out += Tx(C0.x + C0.w / 2, C0.y - 14, "on a computer", "lab mid muted", "middle", { opacity: Math.min(1, cp) });
    out += MK.pop(R(C0.x, C0.y, C0.w, C0.h, 20, P.card, P.line, 2), C0.x + C0.w / 2, C0.y + C0.h / 2, cp);
    if (cp > 0) {
      out += MK.glow(L0.x + L0.w / 2, L0.y + L0.h / 2, 168, P.good, on(t, cSafe, 0.6) * 0.9);
      out += cdLaptop(L0.x, L0.y, L0.w, L0.h, Math.min(1, cp));
    }
    out += MK.tick(L0.x + L0.w - 14, L0.y + 18, 28, popIn(t, cSafe, 0.4));

    /* what it can do, one as each is said */
    var d = CD_KEEP.does;
    [[cSearch, "\u{1F50E}", "search it"], [cCopy, "\u{1F4CB}", "copy it"],
     [cSend, "\u{1F4E4}", "send it"], [cCount, "⚡", "count it"]].forEach(function (row, k) {
      out += cdDoes(d.x, cdDoesY(k), d.w, d.h, row[1], row[2], popIn(t, row[0], 0.4));
    });
    /* the whole lot counted in a blink */
    var bl = bump(t, cBlink, 1.4);
    if (bl > 0)
      out += MK.pop(C(L0.x + L0.w / 2, L0.y + L0.h * 0.42, 46, P.ground, P.gold, 3) +
        Tx(L0.x + L0.w / 2, L0.y + L0.h * 0.42 + 15, String(CD_TOTAL), "lab", "middle",
          { fill: P.gold, "font-size": 44 }),
        L0.x + L0.w / 2, L0.y + L0.h * 0.42, bl);
    return svg(out);
  }
