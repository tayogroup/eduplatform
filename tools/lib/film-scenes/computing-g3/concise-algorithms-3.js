  /* ==== Concise Algorithms, part 3: the steps that repeat, and why it is better ==
     tools/lib/film-scenes/computing-g3/concise-algorithms-3.js. See the header
     of concise-algorithms.js.

     The lesson's two repeat activities. Neither the three plants nor the table
     for four is a scene the Computing kit draws - it has no ART.sim and no
     scene for either - so both pictures are drawn here in the engine's own
     idiom, from the lesson's own steps and its own counts. Every count the
     voice says is drawn: eleven rows and then five for the plants, and for the
     table six rows beside a grid of eighteen chips, one chip per step, laid
     out as the lesson lays them out - wipe, four runs of four, the jug. */

  /* a column of small bars: a list too long to write out in words */
  function caMini(x, top, n, w, rh, gap, col, o) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < n; k++)
      out += R(x, top + k * (rh + gap), w, rh, rh * 0.36, P.cell, col || P.line, 1.6);
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  function caMiniSpan(n, rh, gap) { return n * (rh + gap) - gap; }

  /* a table knife, drawn rather than taken from an emoji, so the fork beside
     it (also drawn) and it are one picture */
  function caKnife(cx, cy, size) {
    var s = size * 0.46;
    return R(cx - s * 0.1, cy + s * 0.14, s * 0.2, s * 0.78, s * 0.08, "#8A5A3A") +
      Pth("M" + n2(cx - s * 0.2) + "," + n2(cy + s * 0.16) + " L" + n2(cx - s * 0.14) + "," + n2(cy - s * 0.92) +
        " q" + n2(s * 0.3) + "," + n2(s * 0.28) + " " + n2(s * 0.34) + "," + n2(s * 1.08) + " Z", "#C6D3DE");
  }

  /* ==== chapter: steps that repeat ================================================ */
  var CA_R = { x: 210, w: 430 };
  var CA_PLANT = { x: [760, 913, 1066], y: 300, soil: 330 };

  function caRunBox(lay, flow, r, o, col) {
    if (!(o > 0)) return "";
    var a = 1 + r * 3, b = 3 + r * 3;
    var y0 = lay.y(flow.slots[a]) - 4, y1 = lay.y(flow.slots[b]) + lay.h + 4;
    return R(CA_R.x - 7, y0, CA_R.w + 14, y1 - y0, 13, "none", col || P.gold, 3.5, { opacity: clamp(o, 0, 1) });
  }
  function caDrops(x, y0, y1, at, t, o) {
    if (at == null || t < at || t > at + 1.7 || !(o > 0)) return "";
    var out = "";
    for (var d = 0; d < 3; d++) {
      var ph = ((t - at) / 0.5 + d / 3) % 1;
      out += Em(x + (d - 1) * 10, lerp(y0, y1, ph), 24, "\u{1F4A7}", { opacity: (1 - ph) * clamp(o, 0, 1) });
    }
    return out;
  }

  var CA_PLANTS = ["can", "fill", "pour", "walk", "fill", "pour", "walk", "fill", "pour", "walk", "away"];
  var CA_PLANTS_BIG = { h: 34, gap: 4 }, CA_PLANTS_SMALL = { n: 5, h: 62, gap: 12 };

  function caPlantsHalf(scene, t) {
    var cThree = sc(scene, 0, "three"), cFill = sc(scene, 0, "fill"),
      cPour = sc(scene, 0, "pour"), cWalk = sc(scene, 0, "walk");
    var cRun = sc(scene, 1, "run"), cSecond = sc(scene, 1, "second"), cThird = sc(scene, 1, "third");
    var cEleven = sc(scene, 2, "eleven");
    var cOnce = sc(scene, 3, "once"), cRepeat = sc(scene, 3, "repeat");
    var cFive = sc(scene, 4, "five"), cWatered = sc(scene, 4, "watered");
    var out = "", fold = on(t, cRepeat, 0.9);

    /* the three plants, and the can that goes along the row */
    var show = on(t, cThree, 0.5);
    out += G(R(676, CA_PLANT.soil, 474, 28, 11, "#6B4A2B"), { opacity: show });
    var pourAt = [cPour, cSecond, cThird];
    CA_PLANT.x.forEach(function (px, k) {
      out += MK.pop(Em(px, CA_PLANT.y, 96, "\u{1F331}"), px, CA_PLANT.y,
        popIn(t, cThree == null ? null : cThree + k * 0.22, 0.4));
      out += MK.tick(px, 168, 26, popIn(t, pourAt[k] == null ? null : pourAt[k] + 0.7, 0.4));
    });
    var pos = Math.min(2, on(t, cWalk, 0.7) * 0.5 + on(t, cSecond, 0.7) * 0.5 + on(t, cThird, 0.7));
    var seg = Math.min(1, Math.floor(pos)), fr = pos - seg;
    var canX = lerp(CA_PLANT.x[seg], CA_PLANT.x[seg + 1], fr);
    var canO = on(t, cFill, 0.5);
    if (canO > 0) {
      out += G(caPic(canX - 8, 238, 86, "can"), { opacity: canO });
      out += MK.pop(Em(canX - 20, 186, 32, "\u{1F4A7}"), canX - 20, 186, popIn(t, cFill, 0.4) * (1 - on(t, cPour, 0.4)));
      pourAt.forEach(function (at) { out += caDrops(canX + 14, 262, 302, at, t, canO); });
    }

    /* the eleven steps, written out, and then folded into five */
    var removed = {};
    for (var g = 4; g <= 9; g++) removed[g] = fold;
    var flow = caFlow(CA_PLANTS.length, removed);
    var lay = caLayout(CA_PLANTS.length, flow.gone, CA_PLANTS_BIG, CA_PLANTS_SMALL);
    var lit = [on(t, cRun, 0.5), on(t, cSecond, 0.5) * (1 - fold), on(t, cThird, 0.5) * (1 - fold)];

    CA_PLANTS.forEach(function (id, k) {
      var cut = removed[k] || 0;
      var o = on(t, cThree == null ? null : cThree + k * 0.1, 0.35);
      if (!(o > 0)) return;
      var slot = flow.slots[k], y = lay.y(slot);
      var row = caRow(CA_R.x, y, CA_R.w, lay.h, Math.round(slot) + 1, id, { o: o });
      if (cut > 0) {
        if (cut >= 1) return;
        out += G(row, { opacity: 1 - cut, transform: around(CA_R.x + CA_R.w / 2, y + lay.h / 2, 1 - 0.4 * cut) });
        return;
      }
      out += row;
    });
    out += caRunBox(lay, flow, 1, lit[1] * (1 - fold));
    out += caRunBox(lay, flow, 2, lit[2] * (1 - fold));
    out += caRunBox(lay, flow, 0, lit[0] * (1 - on(t, cOnce, 0.5)));
    /* written once, with a repeat */
    out += caBracket(CA_R.x, lay.y(flow.slots[1]) - 4, lay.y(flow.slots[3]) + lay.h + 4,
      "repeat 3 times", on(t, cOnce, 0.5));
    out += MK.pill(122, 22, "11 steps", on(t, cEleven, 0.45) * (1 - on(t, cRepeat, 0.4)),
      { size: 22, col: P.muted, ink: P.muted });
    out += MK.pill(122, 22, "5 steps", on(t, cFive, 0.45), { size: 22, col: P.good, ink: P.good });
    out += MK.pill(913, 404, "three plants watered", on(t, cWatered, 0.45), { size: 23, col: P.good, ink: P.good });
    return out;
  }

  /* ---- the table for four ------------------------------------------------------
     Six rows on the left with the run written once; on the right the table
     filling place by place, and then the same algorithm written out long - one
     chip per step, eighteen of them: the wipe, four runs of four, the jug. */
  var CA_TABLE = ["wipe", "plate", "fork", "knife", "cup2", "jug"];
  var CA_TSMALL = { h: 58, gap: 10 };
  var CA_PLACE = [[790, 186], [1036, 186], [790, 306], [1036, 306]];

  function caTableTop(o) {
    if (!(o > 0)) return "";
    return G(R(686, 96, 454, 278, 30, "#C9A06A", "#A67C44", 4) +
      R(700, 110, 426, 250, 22, "#D8B383", null, null), { opacity: clamp(o, 0, 1) });
  }
  function caPlaceSetting(p, items, t) {
    var out = "", px = p[0], py = p[1];
    if (items[0] > 0) out += MK.pop(caPic(px, py, 72, "plate"), px, py, items[0]);
    if (items[1] > 0) out += MK.pop(caPic(px - 54, py, 52, "fork"), px - 54, py, items[1]);
    if (items[2] > 0) out += MK.pop(caKnife(px + 54, py, 52), px + 54, py, items[2]);
    if (items[3] > 0) out += MK.pop(Em(px, py - 58, 40, "\u{1F964}"), px, py - 58, items[3]);
    return out;
  }

  /* the same algorithm written out long: eighteen chips */
  var CA_CHIP = { x: 676, w: 474, rows: 6, h: 52, gap: 10 };
  function caLongGrid(t, at) {
    if (at == null) return "";
    var out = "", top = (440 - (CA_CHIP.rows * (CA_CHIP.h + CA_CHIP.gap) - CA_CHIP.gap)) / 2;
    var cw = (CA_CHIP.w - 3 * CA_CHIP.gap) / 4;
    var chip = function (x, y, w, id, o, col) {
      if (!(o > 0)) return "";
      return G(R(x, y, w, CA_CHIP.h, 16, P.cell, col || P.line, col ? 3 : 2) +
        caPic(x + w / 2, y + CA_CHIP.h / 2, 34, CA_STEP[id].pic), { opacity: clamp(o, 0, 1) });
    };
    var n = tally(t, at, 6, 1.2);
    out += chip(CA_CHIP.x, top, cw, "wipe", n > 0 ? 1 : 0);
    for (var r = 0; r < 4; r++) {
      var y = top + (r + 1) * (CA_CHIP.h + CA_CHIP.gap), o = n > r + 1 ? 1 : 0;
      ["plate", "fork", "knife", "cup2"].forEach(function (id, c) {
        out += chip(CA_CHIP.x + c * (cw + CA_CHIP.gap), y, cw, id, o, P.gold);
      });
    }
    out += chip(CA_CHIP.x, top + 5 * (CA_CHIP.h + CA_CHIP.gap), cw, "jug", n > 5 ? 1 : 0);
    return out;
  }

  function caTableHalf(scene, t) {
    var cTable = sc(scene, 5, "table"), cPlate = sc(scene, 5, "plate"), cFour = sc(scene, 5, "four");
    var cEighteen = sc(scene, 6, "eighteen"), cSix = sc(scene, 6, "six");
    var out = "", swap = into(t, scene.first + 6);

    /* the six rows, with the run written once */
    var span = CA_TABLE.length * (CA_TSMALL.h + CA_TSMALL.gap) - CA_TSMALL.gap;
    var top = (440 - span) / 2;
    var rowY = function (k) { return top + k * (CA_TSMALL.h + CA_TSMALL.gap); };
    var runLit = on(t, cPlate, 0.4);
    CA_TABLE.forEach(function (id, k) {
      var o = on(t, cTable == null ? null : cTable + k * 0.1, 0.35);
      var inRun = k >= 1 && k <= 4;
      out += caRow(CA_R.x, rowY(k), CA_R.w, CA_TSMALL.h, k + 1, id,
        { o: o, col: inRun && runLit > 0.5 ? P.gold : null });
    });
    out += caBracket(CA_R.x, rowY(1) - 4, rowY(4) + CA_TSMALL.h + 4, "repeat 4 times", on(t, cPlate, 0.5));
    out += MK.pill(122, 22, "6 steps", on(t, cSix, 0.45), { size: 22, col: P.good, ink: P.good });

    /* the table filling, then the same algorithm written out long */
    if (swap < 1) {
      var tbl = caTableTop(on(t, cTable, 0.5));
      CA_PLACE.forEach(function (p, k) {
        var at = k === 0 ? cPlate : (cFour == null ? null : cFour + (k - 1) * 0.22);
        var items = [0, 1, 2, 3].map(function (j) {
          return popIn(t, at == null ? null : at + (k === 0 ? j * 0.28 : j * 0.07), 0.35);
        });
        tbl += caPlaceSetting(p, items, t);
      });
      out += G(tbl, { opacity: 1 - swap });
    }
    if (swap > 0) out += G(caLongGrid(t, cEighteen) +
      MK.pill(913, 20, "18 steps written out", on(t, cEighteen, 0.45), { size: 21, col: P.muted, ink: P.muted }),
      { opacity: swap });
    return out;
  }

  function caRepeatChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 5), out = "";
    if (u < 1) out += G(caPlantsHalf(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(caTableHalf(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: why concise is better ============================================
     One picture per reason, each crossfading into the next: less to read, every
     step matters, one change reaches all three, and the computer does less
     work. The list is the five-step watering algorithm from the chapter before,
     so the child is looking at something they have just been taught. */
  var CA_B = { x: 300, w: 560, h: 62, gap: 12 };
  var CA_BLIST = ["can", "fill", "pour", "walk", "away"];
  function caBRowY(k) { return (440 - (5 * (CA_B.h + CA_B.gap) - CA_B.gap)) / 2 + k * (CA_B.h + CA_B.gap); }

  function caBetterDraw(scene, t, k) {
    var out = "";
    if (k === 0) {
      var cCon = sc(scene, 0, "concise"), cFollow = sc(scene, 0, "follow"), cLess = sc(scene, 0, "less");
      var rh = 24, gap = 8, tall = caMiniSpan(11, rh, gap), shortSpan = caMiniSpan(5, rh, gap);
      var topA = (440 - tall) / 2 + 16, topB = topA + (tall - shortSpan) / 2;
      out += Tx(390, topA - 26, "11 to read", "lab mid muted", "middle", { opacity: on(t, cFollow, 0.5) });
      out += Tx(778, topA - 26, "5 to read", "lab mid muted", "middle", { opacity: on(t, cLess, 0.5) });
      out += caMini(300, topA, 11, 180, rh, gap, P.line, on(t, cCon, 0.5));
      out += caMini(688, topB, 5, 180, rh, gap, P.good, on(t, cLess, 0.5));
      out += R(678, topB - 12, 200, shortSpan + 24, 14, "none", P.gold, 4, { opacity: on(t, cLess, 0.6) });
      out += MK.pop(Em(534, topA + tall / 2, 60, "\u{1F440}"), 534, topA + tall / 2, popIn(t, cFollow, 0.45));
      return out;
    }
    if (k === 1) {
      var cUnd = sc(scene, 1, "understand"), cMat = sc(scene, 1, "matters");
      var ticks = tally(t, cMat, 5, 1.5);
      CA_BLIST.forEach(function (id, j) {
        out += caRow(304, caBRowY(j), CA_B.w, CA_B.h, j + 1, id,
          { o: on(t, cUnd == null ? null : cUnd + j * 0.1, 0.35),
            col: ticks > j ? P.good : null, mark: ticks > j ? "tick" : null,
            markP: popIn(t, cMat == null ? null : cMat + j * 0.2, 0.35) });
      });
      return out;
    }
    if (k === 2) {
      var cEdit = sc(scene, 2, "edit"), cOnce = sc(scene, 2, "once"), cAll = sc(scene, 2, "all");
      CA_BLIST.forEach(function (id, j) {
        var hot = j === 2 && on(t, cOnce, 0.5) > 0.4;
        out += caRow(CA_R.x, caBRowY(j), CA_R.w, CA_B.h, j + 1, id,
          { o: 1, col: hot ? P.gold : null });
      });
      out += caBracket(CA_R.x, caBRowY(1) - 4, caBRowY(3) + CA_B.h + 4, "repeat 3 times", on(t, cEdit, 0.5));
      out += MK.pop(Em(676, caBRowY(2) + CA_B.h / 2, 48, "✏️"), 676, caBRowY(2) + CA_B.h / 2, popIn(t, cOnce, 0.4));
      var p = popIn(t, cAll, 0.45);
      [810, 950, 1090].forEach(function (px) {
        out += Em(px, 250, 86, "\u{1F331}", { opacity: on(t, cEdit, 0.5) });
        out += MK.pop(C(px, 250, 50, "none", P.gold, 4), px, 250, p);
      });
      out += MK.arrow(710, 250, 752, 250, on(t, cAll, 0.5), P.gold, 8);
      return out;
    }
    var cComp = sc(scene, 3, "computers"), cFew = sc(scene, 3, "fewer"), cWork = sc(scene, 3, "work");
    out += G(ART.place(ART.figure("laptop"), 700, 60, 430, 320), { opacity: on(t, cComp, 0.5) });
    CA_BLIST.forEach(function (id, j) {
      out += caRow(CA_R.x, caBRowY(j), CA_R.w, CA_B.h, j + 1, id, { o: on(t, cFew, 0.4), col: P.good });
    });
    out += MK.pill(880, 414, "5 steps, not 11", on(t, cFew, 0.45), { size: 23, col: P.good, ink: P.good });
    out += MK.arrow(656, 220, 698, 220, on(t, cWork, 0.6), P.good, 8);
    out += MK.tick(1100, 88, 30, popIn(t, cWork, 0.42));
    return out;
  }

  function caBetterChapter(scene, beat, t, i) {
    return svg(crossfade(t, i, scene, function (bi) { return caBetterDraw(scene, t, bi - scene.first); }));
  }

  /* ---- what you now know --------------------------------------------------------
     The lesson's own five words, and its own pictures for them. */
  var CA_RECAP = MK.recapKind([
    { beat: 0, at: "efficient", title: "Efficient", sub: "the whole job, no waste", pic: "⚡" },
    { beat: 0, at: "concise", title: "Concise", sub: "only the steps you need", pic: "✂️" },
    { beat: 0, at: "task", title: "Task", sub: "the job the algorithm is for", pic: "\u{1F4CB}" },
    { beat: 1, at: "waste", title: "Waste", sub: "a step that does nothing", pic: "\u{1F5D1}️" },
    { beat: 2, at: "repeat", title: "Repeat", sub: "write the run once", pic: "\u{1F501}" }
  ], { goBeat: 2, goAt: "repeat" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What makes an algorithm efficient", "How to cut the steps a task does not need", "How to write a repeated run just once"] }),
    efficient: caEfficientChapter, cake: caCakeChapter, present: caPresentChapter,
    repeat: caRepeatChapter, better: caBetterChapter, recap: CA_RECAP
  };
