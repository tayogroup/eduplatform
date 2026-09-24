  /* ==== Presenting Data, part 3: the problem, data at work, paper or computer,
     and what you now know =====================================================
     tools/lib/film-scenes/computing-g2/presenting-data-3.js.

     The playground holds exactly as many children as the day being said - the
     count comes from PD_DAYS, the same list the table prints - so Monday is
     visibly packed and Thursday visibly quiet without a second claim being
     made anywhere. The football badge travels from the Monday row to the
     Thursday row round the OUTSIDE of the table, in the empty gap, so it never
     crosses a row and nothing is ever unreadable under it. */

  /* ==== chapter: solving a problem =========================================== */
  var PD_PY = 52;                                   /* the five-row table's top */
  var PD_YARD = { x: 636, y: 58, w: 490, h: 286 };  /* the playground */
  /* nine fixed places for nine children: no scatter that could differ per frame */
  var PD_KIDS = [
    [710, 146], [796, 126], [884, 152], [964, 134], [682, 218],
    [764, 236], [848, 212], [932, 240], [1018, 192]
  ];

  function pdYard(t, n, o) {
    if (!(o > 0)) return "";
    var out = R(PD_YARD.x, PD_YARD.y, PD_YARD.w, PD_YARD.h, 22, P.card, P.line, 3);
    out += R(PD_YARD.x + 14, PD_YARD.y + 14, PD_YARD.w - 28, PD_YARD.h - 28, 16, "#123249");
    PD_KIDS.forEach(function (p, k) {
      var a = clamp(n - k, 0, 1);
      if (a > 0.01) out += G(Em(p[0], p[1], 52, "\u{1F9D2}"), { opacity: a });
    });
    out += Em(PD_YARD.x + PD_YARD.w / 2, PD_YARD.y + PD_YARD.h - 44, 44, "⚽");
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the problem itself, while the table is not there yet */
  function pdProblemCard(t, p) {
    if (!(p > 0)) return "";
    return MK.pop(R(74, 96, 420, 244, 24, P.card, P.bad, 3) +
      Em(284, 186, 96, "\u{1F9E9}") +
      Tx(284, 292, "a problem", "lab big", "middle", { fill: P.bad }),
      284, 218, Math.min(1, p));
  }

  function pdProblemChapter(scene, beat, t, i) {
    var cCrowded = sc(scene, 0, "crowded"), cProblem = sc(scene, 0, "problem");
    var cCounted = sc(scene, 1, "counted"), cEach = sc(scene, 1, "each");
    var day = [sc(scene, 2, "mon"), sc(scene, 2, "tue"), sc(scene, 2, "wed"), sc(scene, 2, "thu"), sc(scene, 2, "fri")];
    var cMost = sc(scene, 3, "most"), cLeast = sc(scene, 4, "least");
    var cMoves = sc(scene, 5, "moves"), cDecide = sc(scene, 5, "decide");
    var out = "";

    /* which day the playground is showing, and the one before it, so the
       children fade between the two counts instead of jumping */
    var steps = [{ at: null, d: PD_BUSY_I }];
    day.forEach(function (at, k) { steps.push({ at: at, d: k }); });
    steps.push({ at: cMost, d: PD_BUSY_I }, { at: cLeast, d: PD_QUIET_I }, { at: cMoves, d: PD_QUIET_I });
    var cur = 0;
    for (var s = 1; s < steps.length; s++) if (pdPast(t, steps[s].at)) cur = s;
    var prev = steps[cur > 0 ? cur - 1 : 0];
    var u = cur === 0 ? 1 : on(t, steps[cur].at, 0.45);
    var n = lerp(PD_DAYS[prev.d].value, PD_DAYS[steps[cur].d].value, u);
    var yardO = on(t, cCrowded, 0.55);
    /* the day pill waits for a day to be named: before that it is just a
       crowded playground, and naming Monday early would be a claim the voice
       has not made yet */
    var pillO = yardO * (pdPast(t, day[0]) ? 1 : 0);

    out += pdYard(t, n, yardO);
    /* the day the playground is showing, and how many that is */
    var pillY = PD_YARD.y + PD_YARD.h + 40;
    if (cur > 0 && u < 1)
      out += MK.pill(PD_YARD.x + PD_YARD.w / 2, pillY, PD_DAYS[prev.d].label + ": " + PD_DAYS[prev.d].value,
        (1 - u) * pillO, { size: 22, col: P.line, ink: P.muted, fill: P.card });
    out += MK.pill(PD_YARD.x + PD_YARD.w / 2, pillY, PD_DAYS[steps[cur].d].label + ": " + PD_DAYS[steps[cur].d].value,
      u * pillO, { size: 22, col: pdPast(t, cLeast) ? P.good : P.gold, ink: pdPast(t, cLeast) ? P.good : P.gold, fill: P.card });

    /* too many children is the problem */
    var pr = popIn(t, cProblem, 0.45) * pdOnly(t, scene, 0);
    out += MK.pop(R(PD_YARD.x + 6, PD_YARD.y + 6, PD_YARD.w - 12, PD_YARD.h - 12, 18, "none", P.bad, 4),
      PD_YARD.x + PD_YARD.w / 2, PD_YARD.y + PD_YARD.h / 2, Math.min(1, pr));
    out += pdProblemCard(t, pr);

    /* counting the children, one at a time, before the table can hold them */
    if (pdPast(t, cCounted))
      PD_KIDS.forEach(function (k, j) { out += MK.ripple(k[0], k[1], t, cCounted + j * 0.13, P.gold); });

    /* the table: a row per day, then a number per day */
    var rowsIn = pdPast(t, cCounted) ? tally(t, cCounted, PD_DAYS.length, 1.3) : 0;
    var shown = 0;
    for (var k = 0; k < PD_DAYS.length; k++) if (pdPast(t, day[k])) shown = k + 1;
    out += pdTable(PD_TX, PD_PY, PD_TW, PD_DAYS, {
      o: on(t, cCounted, 0.5), headL: "Day", headR: "How many", shown: shown,
      numberO: on(t, cEach, 0.5),
      rowO: function (k) { return k < rowsIn ? 1 : 0; },
      rowCol: function (k) {
        if (pdPast(t, cLeast) && k === PD_QUIET_I) return P.good;
        if (pdPast(t, cMost) && k === PD_BUSY_I) return P.gold;
        return k === steps[cur].d && !pdPast(t, cMost) && pdPast(t, day[0]) ? P.gold : null;
      }
    });

    /* the biggest number, and the smallest; both gone before the ball travels */
    var lab = 1 - into(t, scene.first + 5);
    if (lab > 0) {
      out += MK.pill(578, pdRowY(PD_PY, PD_BUSY_I) + PD_T.rowH / 2, "biggest", popIn(t, cMost, 0.4) * lab,
        { size: 17, col: P.gold, ink: P.gold, fill: P.card });
      out += MK.pill(578, pdRowY(PD_PY, PD_QUIET_I) + PD_T.rowH / 2, "smallest", popIn(t, cLeast, 0.4) * lab,
        { size: 17, col: P.good, ink: P.good, fill: P.card });
    }

    /* football club moves to the quiet day, round the outside of the table */
    var mv = on(t, cMoves, 1.1);
    if (mv > 0) {
      var y1 = pdRowY(PD_PY, PD_BUSY_I) + PD_T.rowH / 2, y2 = pdRowY(PD_PY, PD_QUIET_I) + PD_T.rowH / 2;
      var pts = [[534, y1], [594, y1], [594, y2], [538, y2]];
      var at = polyAt(pts, polyLen(pts) * ease(mv));
      out += Pth("M534," + n2(y1) + " L594," + n2(y1) + " L594," + n2(y2) + " L538," + n2(y2),
        null, P.good, 3, { "stroke-dasharray": "8 8", opacity: 0.55 });
      out += G(C(at[0], at[1], 24, P.card, P.good, 3) + Em(at[0], at[1], 28, "⚽"), { opacity: 1 });
      out += MK.tick(PD_TX + PD_TW - 96, y2, 18, popIn(t, cDecide, 0.4));
    }
    return svg(out);
  }

  /* ==== chapter: data at work ================================================
     The lesson's own four: a shop, a doctor, a city and a school kitchen, with
     its own picture for each. Each card lights as it is named and keeps its
     light; the one being named is ringed. */
  var PD_W = { w: 268, gap: 22, x0: 15, y: 52, h: 330 };
  var PD_WORK = [
    { pic: "\u{1F3EA}", label: "a shop", sub: "counts what sells" },
    { pic: "\u{1F469}‍⚕️", label: "a doctor", sub: "charts a temperature" },
    { pic: "\u{1F6A6}", label: "a city", sub: "counts the cars" },
    { pic: "\u{1F371}", label: "a school kitchen", sub: "counts the lunches" }
  ];
  function pdWorkX(k) { return PD_W.x0 + k * (PD_W.w + PD_W.gap); }

  /* the little piece of data inside each card */
  function pdWorkMark(k, cx, y, t, at, extra) {
    var out = "";
    if (k === 0) {
      /* two bars: bananas sell out, apples do not */
      var g = on(t, at, 0.6);
      [["\u{1F34C}", 88, -46], ["\u{1F34E}", 34, 46]].forEach(function (b) {
        var h = b[1] * g;
        out += R(cx + b[2] - 22, y + 96 - h, 44, h, 6, P.teal, "rgba(11,29,44,0.5)", 2);
        out += Em(cx + b[2], y + 122, 26, b[0]);
      });
      out += MK.arrow(cx - 46, y + 44, cx - 46, y - 2, on(t, extra, 0.5), P.gold, 6);
    } else if (k === 1) {
      /* a temperature going down */
      var pts = [[cx - 66, y + 14], [cx - 22, y + 36], [cx + 22, y + 66], [cx + 66, y + 92]];
      var seen = tally(t, at, 4, 0.9);
      for (var j = 1; j < seen; j++) out += L(pts[j - 1][0], pts[j - 1][1], pts[j][0], pts[j][1], P.good, 4);
      for (var j2 = 0; j2 < seen; j2++) out += C(pts[j2][0], pts[j2][1], 7, P.good);
    } else if (k === 2) {
      var cars = tally(t, at, 3, 0.7);
      for (var c = 0; c < cars; c++) out += Em(cx - 62 + c * 62, y + 56, 40, "\u{1F697}");
    } else {
      var lunch = tally(t, at, 3, 0.7);
      for (var q = 0; q < lunch; q++) out += Em(cx - 62 + q * 62, y + 56, 40, "\u{1F371}");
    }
    return out;
  }

  function pdWorkChapter(scene, beat, t, i) {
    var cGrown = sc(scene, 0, "grown");
    var at = [sc(scene, 1, "shop"), sc(scene, 2, "doctor"), sc(scene, 2, "city"), sc(scene, 3, "kitchen")];
    var cOrders = sc(scene, 1, "orders"), cRight = sc(scene, 3, "right");
    var out = "", arrived = pdPast(t, cGrown) ? tally(t, cGrown, 4, 0.9) : 0;
    var active = pdLast(t, at[0], at[1], at[2], at[3]);

    PD_WORK.forEach(function (w, k) {
      if (k >= arrived) return;
      var x = pdWorkX(k), cx = x + PD_W.w / 2;
      var p = popIn(t, cGrown == null ? null : cGrown + k * 0.22, 0.35);
      var seen = pdPast(t, at[k]), live = k === active;
      var body = R(x, PD_W.y, PD_W.w, PD_W.h, 22, seen ? "#1B3A52" : P.card,
        live ? P.gold : seen ? P.teal : P.line, live ? 3.5 : seen ? 3 : 2);
      body += Em(cx, PD_W.y + 62, 60, w.pic);
      body += pdWorkMark(k, cx, PD_W.y + 108, t, at[k], k === 0 ? cOrders : null);
      body += Tx(cx, PD_W.y + 272, w.label, "lab big", "middle");
      body += Tx(cx, PD_W.y + 302, w.sub, "lab mid muted readable", "middle");
      out += G(body, { transform: around(cx, PD_W.y + PD_W.h / 2, Math.min(1.04, p)),
        opacity: Math.min(1, p) * (seen ? 1 : 0.62) });
    });
    out += MK.tick(pdWorkX(3) + PD_W.w - 26, PD_W.y + 26, 18, popIn(t, cRight, 0.4));
    return svg(out);
  }

  /* ==== chapter: paper, or computer? =========================================
     The lesson's own four answers, in its own order: the spill, the search, the
     copy, the graph. The computer is the KIT'S laptop (ART.figure), with its
     screen painted over: the same table, then the same graph, drawn from the
     same PD_FRUIT. */
  var PD_PAPER = { x: 96, y: 66, w: 374, h: 300 };
  var PD_LAP = { x: 620, y: 66, w: 380, h: 283 };
  var PD_SCREEN = { x: 696, y: 100, w: 228, h: 133 };   /* the laptop's own screen, placed */
  /* Two columns of fifteen names each. The voice says "one name out of five
     hundred", so the page has to LOOK like a long list rather than the eight
     fat lines it began as, and the pill at the search cue says the number out
     loud. Fixed widths, never random: every frame draws the same page. */
  var PD_LEFT = [118, 142, 104, 131, 150, 96, 126, 138, 112, 145, 101, 134, 123, 148, 108];
  var PD_RIGHT = [92, 78, 104, 85, 98, 72, 104, 89, 95, 81, 101, 76, 100, 90, 84];
  var PD_ROWS = 15, PD_ROWP = 15;
  /* the row the search lands on. Not the winner: on this film gold already
     means "the tallest column", and a found row is a different idea. */
  var PD_FOUND_I = PD_WIN_I === 2 ? 3 : 2;

  function pdPaper(t, wet, searching) {
    var out = R(PD_PAPER.x, PD_PAPER.y, PD_PAPER.w, PD_PAPER.h, 12, P.paper, "#C9C2B2", 3);
    out += R(PD_PAPER.x + 22, PD_PAPER.y + 24, 150, 16, 8, "#8C8677");
    var rows = "";
    for (var k = 0; k < PD_ROWS; k++) {
      var y = PD_PAPER.y + 60 + k * PD_ROWP;
      rows += C(PD_PAPER.x + 26, y + 3, 3, "#8C8677");
      rows += R(PD_PAPER.x + 36, y, PD_LEFT[k], 7, 4, "#B9B2A2");
      rows += C(PD_PAPER.x + 204, y + 3, 3, "#8C8677");
      rows += R(PD_PAPER.x + 214, y, PD_RIGHT[k], 7, 4, "#B9B2A2");
    }
    out += G(rows, { opacity: 1 - 0.75 * wet });
    if (wet > 0) {
      out += R(PD_PAPER.x, PD_PAPER.y, PD_PAPER.w, PD_PAPER.h, 12, P.blue, null, null, { opacity: 0.3 * wet });
      [[160, 120], [300, 210], [230, 310]].forEach(function (p, k) {
        out += G(Em(p[0], p[1], 46, "\u{1F4A7}"), { opacity: wet });
      });
    }
    if (searching > 0) {
      var y = PD_PAPER.y + 60 + Math.floor(clamp(searching * 15, 0, 14.4)) * PD_ROWP;
      out += G(Em(PD_PAPER.x + PD_PAPER.w - 32, y + 3, 36, "\u{1F50D}"), { opacity: 1 });
    }
    return out;
  }

  /* What is on the screen, in the order the voice asks for it: the SAME list
     that is on the paper (so "the copy on the computer" is a copy of the thing
     beside it, not of something else), one row of it found, then the party
     table when the voice says table, then the graph. */
  var PD_SLIST = [64, 78, 58, 72, 66, 80, 61];
  var PD_SLIST2 = [56, 68, 52, 74, 60, 50, 70];
  var PD_SFOUND = 3;

  function pdScreenList(t, o, foundO) {
    if (!(o > 0)) return "";
    var s = PD_SCREEN, out = "";
    for (var k = 0; k < PD_SLIST.length; k++) {
      var y = s.y + 18 + k * 16, hit = foundO > 0 && k === PD_SFOUND;
      if (hit) out += R(s.x + 8, y - 6, s.w - 16, 15, 4, P.gold, null, null, { opacity: 0.9 * foundO });
      out += C(s.x + 18, y + 1, 2.5, hit ? P.dark : P.muted);
      out += R(s.x + 26, y - 2, PD_SLIST[k], 6, 3, hit ? P.dark : P.muted);
      out += C(s.x + 124, y + 1, 2.5, hit ? P.dark : P.muted);
      out += R(s.x + 132, y - 2, PD_SLIST2[k], 6, 3, hit ? P.dark : P.muted);
    }
    return G(out, { opacity: Math.min(1, o) });
  }

  /* the screen: the copied list, then the party table, then the graph */
  function pdScreen(t, listO, foundO, tableO, graphO) {
    var s = PD_SCREEN, out = R(s.x, s.y, s.w, s.h, 4, P.ground);
    out += pdScreenList(t, listO * (1 - tableO), foundO);
    if (tableO > 0) {
      var rows = "";
      PD_FRUIT.forEach(function (f, k) {
        var y = s.y + 20 + k * 30;
        rows += Em(s.x + 30, y, 20, f.pic);
        rows += Tx(s.x + 52, y + 6, f.label, "lab small", "start", { fill: P.muted });
        rows += Tx(s.x + s.w - 24, y + 6, String(f.value), "lab small", "end", { fill: P.teal });
      });
      out += G(rows, { opacity: tableO * (1 - graphO) });
    }
    if (graphO > 0) {
      var g = "", x0 = s.x + 30, pitch = 46, cw = 30, base = s.y + s.h - 18, bh = 22, bg = 3;
      g += L(s.x + 14, base + 2, s.x + s.w - 14, base + 2, P.line, 2);
      PD_FRUIT.forEach(function (f, k) {
        for (var j = 0; j < f.value; j++)
          g += R(x0 + k * pitch, base - (j + 1) * bh - j * bg, cw, bh, 4,
            k === PD_WIN_I ? P.gold : P.teal, "rgba(11,29,44,0.5)", 1.5);
        g += Em(x0 + k * pitch + cw / 2, base + 12, 16, f.pic);
      });
      out += G(g, { opacity: graphO });
    }
    return out;
  }

  function pdPaperChapter(scene, beat, t, i) {
    var cAsk = sc(scene, 0, "ask");
    var cWet = sc(scene, 1, "wet"), cStill = sc(scene, 1, "still");
    var cFind = sc(scene, 2, "find"), cBlink = sc(scene, 2, "blink");
    var cCopies = sc(scene, 3, "copies"), cSends = sc(scene, 3, "sends"), cDraws = sc(scene, 3, "draws");
    var out = "", start = into(t, scene.first);

    var wet = on(t, cWet, 0.6);
    var searching = pdPast(t, cFind) ? clamp((t - cFind) / 2.2, 0, 1) * (1 - on(t, cBlink, 0.4)) : 0;
    out += G(pdPaper(t, wet, searching), { opacity: start });
    out += Tx(PD_PAPER.x + PD_PAPER.w / 2, PD_PAPER.y + PD_PAPER.h + 36, "the class list, on paper",
      "lab mid muted", "middle", { opacity: start });
    out += MK.cross(PD_PAPER.x + PD_PAPER.w - 26, PD_PAPER.y + 26, 22, popIn(t, cWet, 0.45));
    /* how long the list is, said and shown on the same words */
    out += MK.pill(PD_PAPER.x + PD_PAPER.w / 2, PD_PAPER.y - 22, "500 names", popIn(t, cFind, 0.4),
      { size: 20, col: P.gold, ink: P.gold, fill: P.card });

    out += G(ART.place(ART.figure("laptop"), PD_LAP.x, PD_LAP.y, PD_LAP.w, PD_LAP.h), { opacity: start });
    out += G(pdScreen(t, on(t, cStill, 0.5), on(t, cBlink, 0.35), on(t, cCopies, 0.5), on(t, cDraws, 0.6)),
      { opacity: start });
    out += Tx(PD_LAP.x + PD_LAP.w / 2, PD_LAP.y + PD_LAP.h + 46, "the copy, on the computer",
      "lab mid muted", "middle", { opacity: start });
    out += MK.tick(PD_LAP.x + PD_LAP.w - 22, PD_LAP.y + 18, 22, popIn(t, cStill, 0.45));
    /* the search that ends in a blink */
    out += MK.ripple(PD_SCREEN.x + PD_SCREEN.w / 2, PD_SCREEN.y + PD_SCREEN.h / 2, t, cBlink, P.gold);

    /* paper, or computer? */
    out += MK.qmark(545, 212, 30, on(t, cAsk, 0.5) * (1 - on(t, cWet, 0.5)));

    /* copied, and sent */
    var cp = popIn(t, cCopies, 0.4);
    if (cp > 0) out += MK.pop(R(1008, 104, 140, 92, 14, P.card, P.teal, 3) +
      Em(1078, 140, 40, "\u{1F4CB}") + Tx(1078, 182, "a copy", "lab mid muted", "middle"),
      1078, 150, Math.min(1, cp));
    var sd = popIn(t, cSends, 0.4);
    if (sd > 0) out += MK.pop(R(1008, 238, 140, 92, 14, P.card, P.teal, 3) +
      Em(1078, 274, 40, "\u{1F4E8}") + Tx(1078, 316, "sent", "lab mid muted", "middle"),
      1078, 284, Math.min(1, sd));
    out += MK.arrow(1078, 204, 1078, 230, on(t, cSends, 0.45), P.gold, 5);
    return svg(out);
  }

  /* ==== what you now know =====================================================
     The lesson's own six words, in its own wording (LESSON["words"]). */
  function pdRecapBars(cx, cy, size, t) {
    var out = "", w = size * 0.2, h = [0.5, 1, 0.34], base = cy + size * 0.42;
    for (var k = 0; k < 3; k++)
      out += R(cx - size * 0.42 + k * size * 0.32, base - size * 0.72 * h[k], w, size * 0.72 * h[k], 4,
        k === 1 ? P.gold : P.teal, "rgba(11,29,44,0.5)", 1.5);
    return out;
  }

  var PD_RECAP = MK.recapKind([
    { beat: 0, at: "table", title: "Table", sub: "the numbers, in rows", pic: "\u{1F4CB}" },
    { beat: 0, at: "graph", title: "Graph", sub: "a column for each one", pic: "\u{1F4CA}" },
    { beat: 1, at: "tallest", title: "Column", sub: "the tallest is the most", pic: pdRecapBars },
    { beat: 2, at: "problem", title: "Problem", sub: "something to decide", pic: "\u{1F9E9}" },
    { beat: 2, at: "decide", title: "Decision", sub: "what you choose to do", pic: "✅" },
    { beat: 3, at: "computer", title: "Computer", sub: "safe, and fast", pic: "\u{1F4BB}" }
  ], { goBeat: 3, goAt: "computer" });

  var KINDS = {
    title: MK.titleKind({ sub: ["A table holds the numbers", "A graph shows the answer", "Read the data, then decide"] }),
    table: pdTableChapter, graph: pdGraphChapter, build: pdBuildChapter,
    problem: pdProblemChapter, work: pdWorkChapter, paper: pdPaperChapter,
    recap: PD_RECAP
  };
