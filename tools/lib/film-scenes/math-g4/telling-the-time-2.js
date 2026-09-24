
  /* ==== Telling the Time, part 2 ==============================================
     The chapters "Writing it in 24-hour" and "Reading a timetable". Part 1 has
     the palette, the clock helpers and the title motif; part 3 has the
     interval, the month and the recap.

     The timetable is the only drawing in this film with no ART function behind
     it: the library has no table, so the grid, its row and column highlights
     and its marks are drawn here. Its times are the lesson page's own TT3,
     stop for stop and bus for bus. */

  /* the width MK.pill gives a word, so an arrow can stop short of one */
  function ttPillW(text, size) { return String(text).length * size * 0.56 + size * 1.3; }

  /* ==== chapter: Writing it in 24-hour ========================================
     One example a beat, each one the lesson's: 09:15 stays, 15:30 is 3:30 in
     the afternoon with 12 added, 15:45 goes back to 3:45 with 12 taken off,
     and midday and midnight are the two to learn. The clock always shows the
     12-hour time being talked about, and ART.clock puts its own hands there. */
  var TT_TF_BOX = ttBox(60, 62, 300);
  var TT_TF = [
    null,
    { mins: 9 * 60 + 15, left: "9:15 a.m.", right: "09:15", link: "stays", sum: "9 stays as 09" },
    { mins: 15 * 60 + 30, left: "3:30 p.m.", right: "15:30", link: "+ 12", sum: "3 + 12 = 15" },
    { mins: 15 * 60 + 45, left: "15:45", right: "3:45 p.m.", link: "− 12", sum: "15 − 12 = 3" },
    { mins: 12 * 60, left: "12:00", right: "00:00", link: null, sum: null }
  ];
  var TT_TF_L = 585, TT_TF_R = 1000, TT_TF_Y = 170;

  function ttTfBody(scene, k, t) {
    var c = function (n) { return sc(scene, k, n); };
    var out = "";

    if (k === 0) {
      /* a.m. and p.m., struck out; then the whole 24-hour day */
      var cAm = c("ampm"), cTf = c("tf");
      var w = ttPillW("a.m. or p.m.", 44), x0 = 584 - w / 2;
      out += MK.pill(584, 150, "a.m. or p.m.", on(t, cAm, 0.4), { size: 44, col: P.line, ink: P.muted });
      var st = on(t, cAm == null ? null : cAm + 0.4, 0.5);
      out += L(x0 + 10, 150, lerp(x0 + 10, x0 + w - 10, st), 150, P.bad, 8, { opacity: st });
      out += MK.cross(584 + w / 2 + 52, 150, 30, popIn(t, cAm == null ? null : cAm + 0.7, 0.4));
      var tf = on(t, cTf, 0.5);
      if (tf > 0) {
        var bx = 120, bw = 930, by = 280, bh = 46, seg = bw / 24, q, grid = "";
        for (q = 0; q < 24; q++) grid += R(bx + q * seg + 1, by, seg - 2, bh, 3, q < 12 ? P.tealSoft : "#4B3663");
        out += G(grid + R(bx, by, bw, bh, 6, "none", P.line, 2) +
          L(bx + bw / 2, by - 8, bx + bw / 2, by + bh + 8, P.gold, 3) +
          Tx(bx, by - 22, "00:00", "lab big", "start", { fill: P.teal }) +
          Tx(bx + bw / 2, by - 22, "12:00", "lab big", "middle", { fill: P.gold }) +
          Tx(bx + bw, by - 22, "23:59", "lab big", "end", { fill: P.plum }) +
          Tx(bx + bw / 2, by + bh + 42, "24-hour time, and no a.m. or p.m. needed", "lab big", "middle", { fill: P.muted }),
          { opacity: tf, transform: around(bx + bw / 2, by + bh / 2, 0.96 + 0.04 * Math.min(1, tf)) });
      }
      return out;
    }

    var E = TT_TF[k], B = TT_TF_BOX;
    /* the face shows the 12-hour time in every one of these beats */
    out += ttFace(B, E.mins, 1);

    if (k === 4) {
      /* midday and midnight, the two the rule gets wrong */
      out += ttPlate(700, 150, "12:00", popIn(t, c("noon"), 0.45), 46, TTC.gold);
      out += Tx(700, 222, "midday", "lab big", "middle", { fill: P.gold, opacity: on(t, c("noon"), 0.5) });
      out += ttPlate(1000, 150, "00:00", popIn(t, c("night"), 0.45), 46, TTC.plum);
      out += Tx(1000, 222, "midnight", "lab big", "middle", { fill: P.plum, opacity: on(t, c("night"), 0.5) });
      out += Tx(850, 330, "four zeros, never 24", "lab big", "middle",
        { fill: P.muted, opacity: on(t, c("night") == null ? null : c("night") + 0.5, 0.5) });
      return out;
    }

    var cLeft = k === 3 ? c("before") : k === 1 ? c("morning") : c("midday");
    var cRight = k === 3 ? c("after") : k === 1 ? c("nine") : c("half");
    var cLink = k === 3 ? c("off") : k === 1 ? c("morning") : c("add");
    var lw = ttPillW(E.left, 40), rw = ttPillW(E.right, 40);
    out += MK.pill(TT_TF_L, TT_TF_Y, E.left, popIn(t, cLeft, 0.45), { size: 40, col: P.teal, ink: P.ink });
    out += MK.pill(TT_TF_R, TT_TF_Y, E.right, popIn(t, cRight, 0.45), { size: 40, col: P.gold, ink: P.gold });
    out += MK.arrow(TT_TF_L + lw / 2 + 18, TT_TF_Y, TT_TF_R - rw / 2 - 18, TT_TF_Y, on(t, cLink, 0.5), P.gold, 8);
    out += MK.pill((TT_TF_L + TT_TF_R) / 2, TT_TF_Y - 62, E.link, on(t, cLink, 0.4), { size: 30, col: P.gold, ink: P.gold });
    out += Tx((TT_TF_L + TT_TF_R) / 2, 300, E.sum, "lab huge", "middle",
      { fill: P.ink, opacity: on(t, cLink == null ? null : cLink + 0.4, 0.5) });
    /* "After midday": which half of the day this one is in */
    if (k === 2) out += ttPlate(210, 404, "afternoon", on(t, c("midday"), 0.45), 26, TTC.plum);
    if (k === 1) out += ttPlate(210, 404, "morning", on(t, c("morning"), 0.45), 26, TTC.teal);
    if (k === 3) out += ttPlate(210, 404, "afternoon", on(t, c("after"), 0.45), 26, TTC.plum);
    return out;
  }

  function ttTfChapter(scene, beat, t, i) {
    return svg(crossfade(t, i, scene, function (g) { return ttTfBody(scene, g - scene.first, t); }));
  }

  /* ==== chapter: Reading a timetable ==========================================
     The lesson page's own table (STOPS3, BUSES3, TT3), drawn as a grid because
     ART has no table. Four stops down, four buses across, every time in
     24-hour, and Hodan's question answered on it: Bus C reaches School at
     10:40, which is after nine, and Bus B reaches it at 08:55. */
  var TT_TT_STOPS = ["Market Gate", "Riverside", "Hill Road", "School"];
  var TT_TT_BUSES = ["Bus A", "Bus B", "Bus C", "Bus D"];
  var TT_TT_TIMES = [                       /* [stop][bus], minutes since midnight */
    [7 * 60 + 20, 8 * 60 + 5, 9 * 60 + 40, 11 * 60 + 15],
    [7 * 60 + 38, 8 * 60 + 23, 10 * 60 + 2, 11 * 60 + 31],
    [7 * 60 + 55, 8 * 60 + 40, 10 * 60 + 22, 11 * 60 + 46],
    [8 * 60 + 10, 8 * 60 + 55, 10 * 60 + 40, 12 * 60]
  ];
  var TT_G = { x: 106, stopW: 236, colW: 180, headY: 44, headH: 56, rowY: 100, rowH: 64 };
  function ttColX(b) { return TT_G.x + TT_G.stopW + b * TT_G.colW; }
  function ttRowY(r) { return TT_G.rowY + r * TT_G.rowH; }
  function ttCellCx(b) { return ttColX(b) + TT_G.colW / 2; }
  function ttCellCy(r) { return ttRowY(r) + TT_G.rowH / 2; }

  function ttTimetableChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var out = "", r, b;
    var show = popIn(t, c(0, "table"), 0.5);
    if (!(show > 0)) return svg("");

    var gridRight = ttColX(3) + TT_G.colW, gridBottom = ttRowY(3) + TT_G.rowH;
    var body = R(92, 30, 984, 338, 20, TTC.card, TTC.line, 2);

    /* highlights go under the writing */
    /* the column steps back when the question is asked: a Bus B already lit
       gold would be answering "which is the latest bus?" before the child does */
    var down = on(t, c(1, "down"), 0.7) * ttUntil(t, scene, 3), across = on(t, c(2, "across"), 0.7);
    var again = on(t, c(3, "hodan"), 0.5) * ttFrom(t, scene, 3);
    if (down > 0) body += R(ttColX(1) + 4, TT_G.headY, TT_G.colW - 8,
      lerp(0, gridBottom - TT_G.headY, down), 10, TTC.goldSoft);
    if (Math.max(across, again) > 0) body += R(TT_G.x, ttRowY(3) + 3,
      lerp(0, gridRight - TT_G.x, Math.max(across, again)), TT_G.rowH - 6, 10, TTC.tealSoft);

    /* the grid */
    body += L(TT_G.x, TT_G.rowY, gridRight, TT_G.rowY, TTC.ink, 3);
    body += L(TT_G.x + TT_G.stopW, TT_G.headY, TT_G.x + TT_G.stopW, gridBottom, TTC.ink, 3);
    for (r = 1; r < 4; r++) body += L(TT_G.x, ttRowY(r), gridRight, ttRowY(r), TTC.line, 2);
    for (b = 1; b < 4; b++) body += L(ttColX(b), TT_G.headY, ttColX(b), gridBottom, TTC.line, 2);

    /* the writing */
    body += Tx(TT_G.x + 12, TT_G.headY + 38, "Stop", "lab big", "start", { fill: TTC.muted });
    for (b = 0; b < 4; b++) body += Tx(ttCellCx(b), TT_G.headY + 38, TT_TT_BUSES[b], "lab big", "middle", { fill: TTC.ink });
    for (r = 0; r < 4; r++) {
      body += Tx(TT_G.x + 12, ttCellCy(r) + 10, TT_TT_STOPS[r], "lab big", "start", { fill: TTC.muted });
      for (b = 0; b < 4; b++) body += Tx(ttCellCx(b), ttCellCy(r) + 10, tt24(TT_TT_TIMES[r][b]), "lab big", "middle", { fill: TTC.ink });
    }
    out += MK.pop(body, 584, 199, show);

    /* "every time on it is 24-hour": the block of times flashes once */
    var fl = bump(t, c(0, "tf"), 1.1);
    if (fl > 0) out += R(TT_G.x + TT_G.stopW + 4, TT_G.rowY + 4, gridRight - TT_G.x - TT_G.stopW - 8,
      gridBottom - TT_G.rowY - 8, 10, "none", P.gold, 5, { opacity: fl });

    /* "all the way to school": the end of that column */
    out += C(ttCellCx(1), ttCellCy(3), 52, "none", P.gold, 5, { opacity: on(t, c(1, "school"), 0.4) * ttOnly(t, scene, 1) });
    /* "that one stop": the row's own name, ringed where it is written */
    out += R(TT_G.x + 4, ttRowY(3) + 6, TT_G.stopW - 8, TT_G.rowH - 12, 10, "none", P.teal, 4,
      { opacity: on(t, c(2, "stop"), 0.5) * ttOnly(t, scene, 2) });

    /* the question */
    out += ttPlate(584, 402, "at school by 09:00", popIn(t, c(3, "nine"), 0.45), 30, TTC.accent);
    var which = on(t, c(3, "which"), 0.45) * ttOnly(t, scene, 3);
    if (which > 0) for (b = 0; b < 4; b++)
      out += R(ttColX(b) + 8, TT_G.headY + 4, TT_G.colW - 16, TT_G.headH - 8, 10, "none", P.gold, 3, { opacity: which });

    /* the answer: Bus C is too late, Bus B is in time */
    var last = ttFrom(t, scene, 4);
    out += R(ttColX(2) + 8, TT_G.headY + 4, TT_G.colW - 16, TT_G.headH - 8, 10, "none", P.bad, 4,
      { opacity: on(t, c(4, "cbus"), 0.4) * last });
    out += MK.cross(ttCellCx(2) + 66, ttCellCy(3), 20, popIn(t, c(4, "late"), 0.4) * last);
    out += R(ttColX(1) + 8, TT_G.headY + 4, TT_G.colW - 16, TT_G.headH - 8, 10, "none", P.good, 4,
      { opacity: on(t, c(4, "bbus"), 0.4) * last });
    out += MK.tick(ttCellCx(1) + 66, ttCellCy(3), 20, popIn(t, c(4, "bbus") == null ? null : c(4, "bbus") + 0.5, 0.4) * last);
    return svg(out);
  }
