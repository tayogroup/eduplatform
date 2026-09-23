  /* ==== chapters: standard units, and the right equipment =====================
     tools/lib/film-scenes/science-g3/solids-liquids-and-gases-4.js, the last
     part, so it also holds KINDS.

     Standard units: the lesson's own home project ("Everyone measures the
     table in their own hand spans, then measure it once with the ruler") drawn
     as two bars, and its "How deep is the water in the tall glass?" step drawn
     as eight centimetres counted up the film's own glass - the same glass the
     water was poured into two chapters earlier.
     The right equipment: the tools its "Choose the equipment" step asks for,
     each with the unit the lesson gives it. The measuring jug is drawn, not an
     emoji: no emoji on this machine is one. */

  /* ---- things both chapters use ------------------------------------------------ */

  /* a ruler lying across (x, y, w, h) with n centimetres marked, `shown` of
     them drawn; litK flashes the k-th */
  function slRuler(x, y, w, h, n, shown, o, litK, litP) {
    if (!(o > 0)) return "";
    var seg = w / n, out = "";
    out += R(x, y, w, h, 8, "#E8C87A", "#B08A2E", 3);
    out += R(x, y, w, h * 0.22, 8, "#F4DFA8");
    for (var k = 0; k <= n; k++) {
      var p = clamp(shown - k, 0, 1);
      if (p <= 0) continue;
      var mx = x + k * seg, tall = k % 5 === 0 ? h * 0.62 : h * 0.4;
      out += L(mx, y, mx, y + tall, "#6E5518", k % 5 === 0 ? 4 : 3, { opacity: p });
      if (k % 5 === 0) out += Tx(mx, y + h - 12, String(k), "lab mid", "middle", { opacity: p, fill: "#6E5518" });
    }
    if (litP > 0 && litK != null) out += R(x + litK * seg, y, seg, h, 4, P.gold, null, null, { opacity: 0.5 * litP });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the green counting cube of last year's lesson */
  function slCube(cx, cy, s, o) {
    if (!(o > 0)) return "";
    var h = s / 2;
    return G(R(cx - h, cy - h, s, s, s * 0.14, "#43B864", "#2A8A4A", 3) +
      R(cx - h + s * 0.12, cy - h + s * 0.1, s * 0.76, s * 0.18, s * 0.08, "#7FDB98"),
      { opacity: clamp(o, 0, 1) });
  }

  /* a measuring jug, upright, its body centred on (cx, cy), with its scale.
     Drawn rather than borrowed: no emoji on this machine is a measuring jug.
     The lip is SMALL and the base is rounded - the first cut had a straight
     base and a lip a seventh of the jug wide, and at the size chapter 7 draws
     it that read as a grey pennant on a tank. */
  function slMeasJug(cx, cy, s, fill, o) {
    if (!(o > 0)) return "";
    var w = s * 0.7, h = s * 0.66, top = cy - h / 2, bot = cy + h / 2, r = s * 0.07, out = "";
    var lev = h * 0.58 * clamp(fill, 0, 1);
    out += R(cx - w / 2 + 5, bot - lev - 4, w - 10, lev, s * 0.03, SL_WATER, null, null, { opacity: 0.75 });
    out += Pth("M" + n2(cx - w / 2) + "," + n2(top) +
      " L" + n2(cx - w / 2) + "," + n2(bot - r) +
      " Q" + n2(cx - w / 2) + "," + n2(bot) + " " + n2(cx - w / 2 + r) + "," + n2(bot) +
      " L" + n2(cx + w / 2 - r) + "," + n2(bot) +
      " Q" + n2(cx + w / 2) + "," + n2(bot) + " " + n2(cx + w / 2) + "," + n2(bot - r) +
      " L" + n2(cx + w / 2) + "," + n2(top), null, "#8FA6B8", 5);
    out += Pth("M" + n2(cx + w / 2 - 2) + "," + n2(top + s * 0.02) +
      " L" + n2(cx + w / 2 + s * 0.085) + "," + n2(top - s * 0.005) +
      " L" + n2(cx + w / 2 - 2) + "," + n2(top + s * 0.1) + " Z", "#8FA6B8");
    out += Pth("M" + n2(cx - w / 2) + "," + n2(top + h * 0.2) + " q" + n2(-s * 0.16) + "," + n2(s * 0.13) + " 0," + n2(s * 0.26), null, "#8FA6B8", 6);
    for (var k = 1; k <= 3; k++) {
      var my = bot - h * 0.2 * k;
      out += L(cx + w / 2 - (k === 2 ? s * 0.22 : s * 0.13), my, cx + w / 2 - 4, my, "#C6D6E4", 3);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: standard units ==================================================
     beat 0 hands and cubes; beats 1-2 the same table measured by two different
     hands; beats 3-4 the ruler, every centimetre the same; beat 5 eight of them
     counted up the glass. */

  var SL_BAR = { x: 70, w: 760, a: 176, b: 306, h: 30 };

  /* beat 0: what last year measured with */
  function slUnitsHands(t, scene) {
    var cLast = sc(scene, 0, "last"), cHands = sc(scene, 0, "hands"), out = "";
    out += MK.pill(584, 84, "last year", on(t, cLast, 0.45), { size: 26, col: P.line });
    var ph = popIn(t, cHands, 0.42), pc = popIn(t, cHands == null ? null : cHands + 0.35, 0.42);
    out += MK.pop(Em(452, 244, 200, "✋"), 452, 244, ph);
    out += MK.pop(slCube(748, 250, 150, 1), 748, 250, pc);
    out += MK.pill(452, 386, "hands", Math.min(1, ph), { size: 28, col: P.gold });
    out += MK.pill(748, 386, "cubes", Math.min(1, pc), { size: 28, col: P.gold });
    return out;
  }

  /* beats 1 and 2: two hands, two answers, one table */
  function slUnitsSpans(t, scene) {
    var cYour = sc(scene, 1, "your"), cMy = sc(scene, 1, "my"), cDiff = sc(scene, 1, "diff");
    var cAgree = sc(scene, 2, "agree"), cCheck = sc(scene, 2, "check");
    var B = SL_BAR, out = "";
    var rows = [
      { at: cYour, y: B.a, n: 6, hy: 110, size: 126, br: 152, count: 196 },
      { at: cMy, y: B.b, n: 9, hy: 386, size: 84, br: 344, count: 326 }
    ];
    var walk = on(t, cAgree, 1.5);
    rows.forEach(function (r) {
      var o = on(t, r.at, 0.45);
      if (o <= 0) return;
      var seg = B.w / r.n, s = "";
      s += R(B.x, r.y, B.w, B.h, 8, P.cell, P.line, 3);
      /* the spans each hand steps off, as it walks the bar */
      var done = tally(t, cAgree, r.n, 1.4);
      for (var k = 0; k < done; k++) {
        s += R(B.x + k * seg + 3, r.y + 4, seg - 6, B.h - 8, 5, P.gold, null, null, { opacity: 0.2 + 0.1 * (k % 2) });
        s += L(B.x + (k + 1) * seg, r.y - 7, B.x + (k + 1) * seg, r.y + B.h + 7, P.gold, 3);
      }
      /* the hand: its own width shown first, then walking the bar */
      var hx = B.x + seg / 2 + (r.n - 1) * seg * walk;
      s += Em(hx, r.hy, r.size, "✋");
      var br = on(t, cDiff, 0.5) * (1 - walk);
      if (br > 0) {
        s += L(hx - seg / 2, r.br, hx + seg / 2, r.br, P.gold, 4, { opacity: br });
        s += L(hx - seg / 2, r.br - 8, hx - seg / 2, r.br + 8, P.gold, 4, { opacity: br });
        s += L(hx + seg / 2, r.br - 8, hx + seg / 2, r.br + 8, P.gold, 4, { opacity: br });
      }
      /* the answer each one gives */
      var no = popIn(t, cAgree == null ? null : cAgree + 1.45, 0.4);
      if (no > 0) {
        s += MK.pop(Tx(918, r.count + 16, String(r.n), "lab huge", "middle", { fill: P.gold }), 918, r.count, no);
        s += Tx(1024, r.count + 10, "hand spans", "lab mid muted", "middle", { opacity: Math.min(1, no) });
      }
      out += G(s, { opacity: o });
    });
    out += Tx(450, 264, "the same table, measured twice", "lab big muted", "middle", { opacity: on(t, cMy, 0.6) });
    out += MK.cross(918, 262, 26, popIn(t, cCheck, 0.4));
    out += MK.pill(1000, 420, "they do not agree", on(t, cCheck, 0.5), { size: 22, col: P.bad });
    return out;
  }

  /* beats 3 and 4: the ruler, and every centimetre the same.
     The marks are drawn as the ruler arrives, not on the word "centimetres":
     an unmarked plank is not a ruler, and that word comes at the end of its
     line. What the word brings is one centimetre of it, bracketed. */
  function slUnitsRuler(t, scene) {
    var cStd = sc(scene, 3, "std"), cCm = sc(scene, 3, "cm");
    var cSame = sc(scene, 4, "same"), cEvery = sc(scene, 4, "every");
    var x = 96, y = 160, w = 976, h = 96, n = 12, seg = w / n, out = "";
    /* the ruler arrives with the line, not with the words "standard units"
       halfway through it: this beat crossfades in from the hand spans, and
       waiting for a mid-line cue left half a second of empty stage */
    var open = BEATS[scene.first + 3].start;
    var here = into(t, scene.first + 3);
    var shown = tally(t, open, n + 1, 1.0);
    /* the wave that flashes every centimetre, one after another: all the same */
    var lit = null, litP = 0;
    if (cSame != null && t >= cSame) {
      var k = Math.floor((t - cSame) / 0.11);
      if (k < n) { lit = k; litP = 1; }
    }
    out += slRuler(x, y, w, h, n, shown, here, lit, litP);
    /* one centimetre, named and bracketed above the ruler */
    var cmO = on(t, cCm, 0.5);
    if (cmO > 0) {
      out += L(x + 2 * seg, 132, x + 3 * seg, 132, P.gold, 4, { opacity: cmO });
      out += L(x + 2 * seg, 124, x + 2 * seg, 140, P.gold, 4, { opacity: cmO });
      out += L(x + 3 * seg, 124, x + 3 * seg, 140, P.gold, 4, { opacity: cmO });
      out += MK.pill(x + 2.5 * seg, 100, "one centimetre", cmO, { size: 22, col: P.gold });
    }
    /* your hand and my hand read the same ruler and agree */
    var hp = popIn(t, cSame, 0.45), mk = popIn(t, cSame == null ? null : cSame + 0.55, 0.4);
    if (hp > 0) {
      out += MK.pop(Em(176, 330, 108, "✋"), 176, 330, hp);
      out += MK.pop(Em(1000, 334, 76, "✋"), 1000, 334, hp);
      out += MK.pill(322, 330, "your hand", Math.min(1, hp), { size: 22, col: P.line });
      out += MK.pill(862, 334, "my hand", Math.min(1, hp), { size: 22, col: P.line });
      out += MK.tick(438, 330, 22, mk);
      out += MK.tick(752, 334, 22, mk);
    }
    var last = 1 - into(t, scene.first + 4);
    out += MK.pill(584, 406, "standard units", on(t, cStd, 0.45) * last, { size: 30, col: P.gold });
    out += MK.pill(584, 406, "the same size for everyone", on(t, cEvery, 0.45), { size: 26, col: P.good });
    return out;
  }

  /* beat 5: eight centimetres of water, counted up the glass */
  function slUnitsGlass(t, scene) {
    var cCount = sc(scene, 5, "count"), cEight = sc(scene, 5, "eight");
    var bot = 400, cm = 38, cx = 414, out = "";
    out += slGlass(cx, 60, 340, 200, 150, 0.894, 1);
    out += L(276, bot, 1092, bot, P.line, 5);
    /* a centimetre at a time, counted: the lesson's own "Add a centimetre" */
    var got = tally(t, cCount, 8, 2.1);
    for (var k = 0; k < got; k++) {
      var yTop = bot - cm * (k + 1);
      out += R(556, yTop + 2, 62, cm - 4, 5, k % 2 ? "#E8C87A" : "#F4DFA8", "#B08A2E", 2);
      out += Tx(654, yTop + cm - 11, String(k + 1), "lab big", "middle", { fill: P.gold });
    }
    out += MK.pill(898, 176, "8 centimetres deep", on(t, cEight, 0.45), { size: 30, col: P.gold });
    out += MK.tick(898, 270, 30, popIn(t, cEight == null ? null : cEight + 0.4, 0.4));
    return out;
  }

  function slUnitsChapter(scene, beat, t, i) {
    function draw(bi) {
      var k = bi - scene.first;
      return k === 0 ? slUnitsHands(t, scene) : k <= 2 ? slUnitsSpans(t, scene)
        : k <= 4 ? slUnitsRuler(t, scene) : slUnitsGlass(t, scene);
    }
    var k = i - scene.first;
    return svg(k === 1 || k === 3 || k === 5 ? crossfade(t, i, scene, draw) : draw(i));
  }
