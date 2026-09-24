  /* ==== Grade 1 Mathematics, Lesson 5: Asking and Sorting =====================
     tools/lib/film-scenes/math-g1/asking-and-sorting.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-1-app/g1v2/lecture-video/asking-and-sorting.json.

     Mathematics has no lesson kit, so the manipulatives come from ART
     (tools/lib/ehel-film-art-math.js): the pictogram of the Pictogram chapter
     and the two sorting diagrams of Hoops and boxes are ART.pictogram and
     ART.sortDiagram, nested with ART.place. The block graph is drawn here,
     because the lesson builds TOWERS OF SEPARATE BLOCKS with a plus button
     ("one block means one child") and ART.barChart draws one solid bar.

     The survey is the lesson page's own: the twelve children of its CLASS,
     asked which fruit they like best. Every number the narration says is
     counted from that list below rather than written twice, and the guard
     under it stops the film if the list ever stops saying five, four, two,
     one and twelve.

     This file: the palette, the survey, the block graph and the small
     drawings every chapter shares, the title motif, and the chapter
     "Asking everyone". Every top-level name here starts with aso, so nothing
     can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, ask: P.gold, table: P.blue, graph: P.accent,
    picto: P.plum, sort: P.good, say: P.gold, recap: P.teal
  };

  /* ---- the survey -------------------------------------------------------- */

  /* the lesson page's FRUIT, with the colour each tower is built in */
  var ASO_FRUIT = [
    { em: "\u{1F34D}", name: "pineapple", col: "#F2A93B" },
    { em: "\u{1F34C}", name: "banana", col: "#E9C63E" },
    { em: "\u{1F34A}", name: "orange", col: "#F26B2A" },
    { em: "\u{1F34E}", name: "apple", col: "#D2412F" }
  ];
  /* the lesson page's CLASS, in its order, with the faces it chose */
  var ASO_CLASS = [
    { n: "Amina", f: 0, face: "\u{1F467}\u{1F3FD}" }, { n: "Musa", f: 1, face: "\u{1F466}\u{1F3FE}" },
    { n: "Hodan", f: 0, face: "\u{1F467}\u{1F3FF}" }, { n: "Kiki", f: 2, face: "\u{1F467}\u{1F3FB}" },
    { n: "Omar", f: 0, face: "\u{1F466}\u{1F3FD}" }, { n: "Nadia", f: 1, face: "\u{1F467}\u{1F3FE}" },
    { n: "Sami", f: 3, face: "\u{1F466}\u{1F3FB}" }, { n: "Leila", f: 0, face: "\u{1F467}\u{1F3FC}" },
    { n: "Yusuf", f: 1, face: "\u{1F466}\u{1F3FF}" }, { n: "Zara", f: 2, face: "\u{1F467}\u{1F3FD}" },
    { n: "Ali", f: 0, face: "\u{1F466}\u{1F3FC}" }, { n: "Dayo", f: 1, face: "\u{1F466}\u{1F3FD}" }
  ];
  /* counted, never typed: 5, 4, 2, 1 */
  var ASO_N = ASO_FRUIT.map(function (f, i) {
    return ASO_CLASS.filter(function (k) { return k.f === i; }).length;
  });

  /* the lesson page's PETS and PETC, for the last chapter */
  var ASO_PET = [
    { em: "\u{1F415}", name: "dog", n: 6, col: "#C08552" },
    { em: "\u{1F408}", name: "cat", n: 4, col: "#8E5AA8" },
    { em: "\u{1F41F}", name: "fish", n: 4, col: "#2F6FD2" },
    { em: "\u{1F426}", name: "bird", n: 2, col: "#1E8C86" }
  ];

  /* The narration says five, four, two, one, twelve, six and sixteen. If the
     lesson's survey ever changes, the film must stop rather than draw a
     picture its own voice contradicts. */
  (function asoCheck() {
    var want = [5, 4, 2, 1], i, sum = 0;
    for (i = 0; i < want.length; i++)
      if (ASO_N[i] !== want[i]) throw new Error("asking-and-sorting: the fruit survey now counts " + ASO_N.join(", ") + ", not " + want.join(", "));
    if (ASO_CLASS.length !== 12) throw new Error("asking-and-sorting: the class is " + ASO_CLASS.length + " children, not twelve");
    for (i = 0; i < ASO_PET.length; i++) sum += ASO_PET[i].n;
    if (sum !== 16) throw new Error("asking-and-sorting: the pet graph adds to " + sum + ", not sixteen");
    if (ASO_PET[1].n !== ASO_PET[2].n) throw new Error("asking-and-sorting: cat and fish are no longer the same");
  })();

  /* ---- timing ------------------------------------------------------------ */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does:
     for something that belongs to that beat alone */
  function asoOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for something that stays */
  function asoFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* how much of n has arrived by t, filling from `at` over `span`; fractional,
     so the block that is still arriving can be drawn growing */
  function asoFill(t, at, span, n) {
    if (at == null || t < at || n <= 0) return 0;
    return Math.min(n, ((t - at) / span) * n);
  }

  /* ---- the block graph ---------------------------------------------------
     The lesson's own: one block for one child, stacked into a tower, with a
     scale up the side. The number printed over a tower is how many WHOLE
     blocks are in it, so the number and the picture can never disagree.
     o: {x (the axis), base (the zero line), bw, bh, pitch, max, cats, vals
         (one number per tower, whole or part), lit, glow, values} */
  function asoBlock(x, y, w, h, col) {
    return R(x, y, w, h, 7, col, "rgba(11,29,44,0.55)", 2.5) +
      R(x + w * 0.1, y + h * 0.16, w * 0.8, h * 0.2, h * 0.1, "#FFFFFF", null, null, { opacity: 0.32 });
  }
  function asoGraph(o) {
    var out = "", i, k, cx, cols = o.cats.length, bw = o.bw, bh = o.bh;
    var x0 = o.x, x1 = o.x + cols * o.pitch, top = o.base - o.max * bh;
    for (k = 0; k <= o.max; k++) {
      var gy = o.base - k * bh;
      out += L(x0, gy, x1, gy, k ? P.line : P.muted, k ? 1.5 : 3);
      out += Tx(x0 - 14, gy + 7, String(k), "lab mid muted", "end");
    }
    out += L(x0, top, x0, o.base, P.muted, 3);
    for (i = 0; i < cols; i++) {
      cx = x0 + o.pitch * (i + 0.5);
      var v = o.vals[i], hot = o.lit === i, whole = Math.floor(v + 1e-9);
      for (k = 0; k < Math.ceil(v - 1e-9); k++) {
        var p = clamp(v - k, 0, 1), by = o.base - (k + 1) * bh + 3;
        out += MK.pop(asoBlock(cx - bw / 2, by, bw, bh - 6, o.cats[i].col), cx, by + bh / 2, ease(p));
      }
      if (hot) out += asoRing(o, i, 1);
      /* the count sits above the TOP of the tower, the block still arriving
         included, so a number is never written across a block */
      if (o.values !== false && whole > 0)
        out += Tx(cx, o.base - Math.ceil(v - 1e-9) * bh - 16, String(whole), o.small ? "lab" : "lab big", "middle",
          { fill: hot ? P.gold : P.ink });
      out += Em(cx, o.base + (o.emSize || 38), o.emSize || 38, o.cats[i].em);
      if (o.names !== false) out += Tx(cx, o.base + 74, o.cats[i].name, "lab mid muted", "middle");
    }
    return out;
  }
  /* where the top of tower i sits, for a leader line or a bracket */
  function asoTowerTop(o, i) { return o.base - o.vals[i] * o.bh; }
  function asoTowerX(o, i) { return o.x + o.pitch * (i + 0.5); }
  /* a gold ring round tower i, for the one being talked about */
  function asoRing(o, i, op, col) {
    if (!(op > 0)) return "";
    var whole = Math.floor(o.vals[i] + 1e-9);
    if (whole <= 0) return "";
    return R(asoTowerX(o, i) - o.bw / 2 - 7, o.base - whole * o.bh - 5, o.bw + 14, whole * o.bh + 10, 12,
      "none", col || P.gold, 4, { opacity: clamp(op, 0, 1) });
  }

  /* ---- small drawings ---------------------------------------------------- */

  /* a light card, the shape ART draws its own drawings on */
  function asoCard(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 20, P.card, P.line, 2, { opacity: clamp(o, 0, 1) });
  }
  /* one of the lesson's attribute cards: a red or blue circle, square or
     triangle on a white card, size px across, centred on (cx, cy) */
  var ASO_RED = "#D2412F", ASO_BLUE = "#2F6FD2";
  function asoShape(cx, cy, size, col, kind, o, ring) {
    if (!(o > 0)) return "";
    var s = size, f = col === "red" ? ASO_RED : ASO_BLUE, in_ = "";
    if (kind === "circle") in_ = C(0, 0, s * 0.34, f, "#1B2A2F", s * 0.05);
    else if (kind === "square") in_ = R(-s * 0.31, -s * 0.31, s * 0.62, s * 0.62, s * 0.06, f, "#1B2A2F", s * 0.05);
    else in_ = Pth("M0," + n2(-s * 0.36) + " L" + n2(s * 0.36) + "," + n2(s * 0.31) + " L" + n2(-s * 0.36) + "," + n2(s * 0.31) + " Z", f, "#1B2A2F", s * 0.05);
    return G(R(-s / 2, -s / 2, s, s, s * 0.14, P.card, ring ? P.gold : P.line, ring ? 4 : 2) + in_,
      { transform: tr(cx, cy), opacity: clamp(o, 0, 1) });
  }
  /* one child of the class: a face, a name, and the fruit once they have
     answered. `pick` is 0 -> 1 as their answer arrives. */
  function asoChild(cx, cy, k, pick, o) {
    if (!(o > 0)) return "";
    var got = pick > 0;
    return G(R(cx - 46, cy - 44, 92, 92, 16, got ? "#1B3A52" : P.card, got ? P.teal : P.line, got ? 3 : 2) +
      Em(cx, cy - 10, 44, ASO_CLASS[k].face) +
      Tx(cx, cy + 34, ASO_CLASS[k].n, "lab small", "middle", { fill: got ? P.ink : "#4A6275" }) +
      (got ? "" : MK.qmark(cx + 30, cy - 30, 14, 0.9)) +
      MK.pop(Em(cx + 30, cy - 30, 30, ASO_FRUIT[ASO_CLASS[k].f].em), cx + 30, cy - 30, pick),
      { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title ==========================================================
     Twelve faces, one question, four fruits, and the four towers the answers
     make. On the two cards nothing is cued, so everything simply stands. */
  function asoMotifFaces(t, at, all) {
    var out = "", k, n = all ? 12 : tally(t, at, 12, 1.1);
    for (k = 0; k < 12; k++) {
      if (k >= n) continue;
      var cx = 90 + (k % 6) * 34, cy = 78 + Math.floor(k / 6) * 34;
      out += MK.pop(Em(cx, cy, 28, ASO_CLASS[k].face), cx, cy, all ? 1 : popIn(t, at == null ? null : at + k * 0.09, 0.3));
    }
    return out;
  }
  function titleMotif(o) {
    var t = o.t || 0, sc0 = o.scene, out = "", k;
    var cTwelve = sc0 ? sc(sc0, 0, "twelve") : null, cOne = sc0 ? sc(sc0, 0, "one") : null,
      cWhich = sc0 ? sc(sc0, 0, "which") : null, cCollect = sc0 ? sc(sc0, 1, "collect") : null,
      cDraw = sc0 ? sc(sc0, 1, "draw") : null;
    var card = !sc0;
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 170, 168, P.teal, card ? 0.7 : on(t, cDraw, 0.8) * (0.6 + 0.4 * breathe(t)));
    out += asoMotifFaces(t, cTwelve, card);
    /* one question */
    out += MK.qmark(280, 60, 22, card ? 1 : popIn(t, cOne, 0.4));
    /* the four fruits */
    for (k = 0; k < 4; k++) {
      var fx = 108 + k * 48;
      out += MK.pop(Em(fx, 168, 34, ASO_FRUIT[k].em), fx, 168, card ? 1 : popIn(t, cWhich == null ? null : cWhich + k * 0.1, 0.32));
    }
    /* "collect every answer": the answers come down out of the class */
    for (k = 0; k < 4 && !card; k++) {
      var ax = 108 + k * 48;
      out += MK.arrow(ax, 126, ax, 146, on(t, cCollect == null ? null : cCollect + k * 0.08, 0.4), P.gold, 5);
    }
    /* the towers the answers make: 5, 4, 2, 1 */
    for (k = 0; k < 4; k++) {
      var tx = 108 + k * 48, grown = card ? ASO_N[k] : asoFill(t, cDraw, 1.2, ASO_N[k]);
      for (var b = 0; b < Math.ceil(grown - 1e-9); b++) {
        var p = clamp(grown - b, 0, 1), by = 300 - (b + 1) * 18 + 2;
        out += MK.pop(asoBlock(tx - 13, by, 26, 14, ASO_FRUIT[k].col), tx, by + 7, ease(p));
      }
    }
    out += L(84, 300, 276, 300, P.muted, 3, { opacity: card ? 1 : on(t, cDraw, 0.5) });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Twelve children, four fruits, and the block graph their answers make">' + out + "</svg>";
  }

  /* ==== chapter: asking everyone ===========================================
     The class on the left, twelve children in a grid; the answers collecting
     on the right, one drawing in each fruit's own row. Amina, Musa and Hodan
     are asked on their own names; the rest follow on "All twelve answers". */
  var ASO_ROWY = [104, 178, 252, 326];
  function asoAskChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cAns = c(0, "answers"), cEvery = c(1, "every"), cSame = c(1, "same");
    var cAmina = c(2, "amina"), cMusa = c(2, "musa"), cHodan = c(2, "hodan");
    var cOnce = c(3, "once"), cTwelve = c(3, "twelve"), cRows = c(3, "rows");
    var out = "", k, r;

    /* when each child answers: the first three on their own names, the rest
       spread across "All twelve answers" */
    var when = [cAmina, cMusa, cHodan];
    for (k = 3; k < 12; k++) when.push(cTwelve == null ? null : cTwelve + 0.1 + (k - 3) * 0.12);
    /* When the LAST answer of a row has finished arriving. The count beside a
       row is never shown before the row holds that many drawings: the words
       "five" and "four" are printed there, and a picture two short of them is
       exactly the fault this lesson is about. */
    var ready = ASO_FRUIT.map(function (f, r) {
      var last = null, k2;
      for (k2 = 0; k2 < 12; k2++)
        if (ASO_CLASS[k2].f === r && when[k2] != null) last = last == null ? when[k2] : Math.max(last, when[k2]);
      return last == null ? null : last + 0.62;
    });
    function asoCountAt(r) {
      if (cRows == null || ready[r] == null) return null;
      return Math.max(cRows + r * 0.12, ready[r]);
    }

    /* the class */
    out += asoCard(22, 56, 466, 352, 1);
    out += Tx(255, 88, "our class", "lab mid muted caps", "middle");
    for (k = 0; k < 12; k++) {
      var cx = 108 + (k % 4) * 104, cy = 152 + Math.floor(k / 4) * 100;
      out += asoChild(cx, cy, k, popIn(t, when[k], 0.34), 1);
      /* a tick on each face once it is asked, for "ask each child once" */
      out += MK.tick(cx - 30, cy - 30, 13, popIn(t, cOnce == null || when[k] == null ? null : Math.max(cOnce, when[k]) + 0.2, 0.3));
      out += MK.ripple(cx, cy - 10, t, when[k], P.gold);
    }

    /* the question, asked of the whole class */
    var qo = on(t, cEvery, 0.4) * asoOnly(t, scene, 1);
    out += MK.bubble(560, 74, 566, 84, "Which fruit do you like best?", Math.max(qo, on(t, cSame, 0.4) * asoOnly(t, scene, 1)), 600, 150);

    /* the answers, collecting in rows */
    var rowsO = on(t, cAmina, 0.5);
    out += asoCard(520, 66, 626, 342, rowsO * 0.001 + (rowsO > 0 ? 1 : 0));
    for (r = 0; r < 4; r++) {
      var y = ASO_ROWY[r] + 30, got = 0;
      out += Em(566, y, 40, ASO_FRUIT[r].em, { opacity: rowsO });
      out += L(596, y + 30, 1122, y + 30, P.line, 2, { opacity: rowsO * 0.8 });
      for (k = 0; k < 12; k++) {
        if (ASO_CLASS[k].f !== r) continue;
        var px = 640 + got * 62;
        out += MK.pop(Em(px, y, 40, ASO_FRUIT[r].em), px, y, popIn(t, when[k] == null ? null : when[k] + 0.25, 0.36));
        got++;
      }
      /* how many are in the row, once the row actually holds that many */
      out += MK.pill(1092, y, String(ASO_N[r]), popIn(t, asoCountAt(r), 0.34), { size: 26, col: P.gold });
      out += R(600, y - 34, 522, 68, 14, "none", P.gold, 3, { opacity: 0.85 * bump(t, asoCountAt(r), 1.1) });
    }
    /* what the chapter is for, before anybody has answered */
    out += MK.pill(830, 240, "no answers yet", on(t, cAns, 0.4) * (1 - on(t, cAmina, 0.45)), { size: 28, col: P.line, ink: P.muted });
    return svg(out);
  }
