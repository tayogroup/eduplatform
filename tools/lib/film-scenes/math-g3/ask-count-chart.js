  /* ==== Grade 3 Mathematics, Lesson 8: Ask, Count and Chart ===================
     tools/lib/film-scenes/math-g3/ask-count-chart.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-3-app/lecture-video/ask-count-chart.json.

     ONE SURVEY RUNS THROUGH THE FILM, and it is the lesson's own question
     ("How do the children in this class travel to school?", STATQ[0], with the
     lesson's own four answers: Walk, Bus, Bicycle, Car). Its counts are
     declared once, in AC_TRAVEL below, and the tally, the bar chart, the
     difference, the total and every spoken number are all read from it - so
     the tally cannot show a different nine from the bar chart's nine. The same
     rule holds for the pictogram (AC_FRUIT, the lesson's key of two children a
     picture), the Venn and Carroll (the lesson's own even / more-than-twenty
     test, VTESTS[0]) and the spinner (AC_SPINS, whose running totals ARE the
     numbers the last line says). Each of those carries its own check, at the
     bottom of -3.js, which throws as the page loads if the picture and the
     words have drifted apart.

     The drawings come from ART (tools/lib/ehel-film-art-math.page.js): the
     tally, the pictogram, the bar chart and the two sorting diagrams are the
     shared Mathematics pictures, so this film counts and charts in the same
     visual language as the other thirty. The spinner is drawn here instead:
     ART.spinner divides a circle into EQUAL parts, and this lesson's spinner
     is three parts red, two blue and one gold.

     This file: the palette, the survey data, the timing helpers, the small
     drawings the chapters share, the title motif and the chapter "A question
     worth asking". Every top-level name here starts with ac or AC. */

  var HUE = {
    title: P.teal, ask: P.gold, tally: P.teal, picto: P.plum,
    bars: P.blue, sort: P.good, chance: P.accent, recap: P.teal
  };

  /* ---- the lesson's own data, declared once ----------------------------------- */

  /* the lesson's travel survey: THINGS, and one class's counts */
  var AC_TRAVEL = [
    { label: "Walk", value: 9 },
    { label: "Bus", value: 6 },
    { label: "Bicycle", value: 4 },
    { label: "Car", value: 3 }
  ];
  var AC_WALK = AC_TRAVEL[0].value;                 /* 9  - the tally chapter counts to this */
  var AC_CAR = AC_TRAVEL[3].value;                  /* 3  - the shortest bar */
  var AC_DIFF = AC_WALK - AC_CAR;                   /* 6  - "six more walk than come by car" */
  var AC_TOTAL = AC_TRAVEL.reduce(function (s, r) { return s + r.value; }, 0);  /* 22 */
  var AC_BUNDLES = Math.floor(AC_WALK / 5);         /* 1 */
  var AC_LEFT = AC_WALK % 5;                        /* 4 */

  /* the lesson's fruit pictogram, its key at two children a picture */
  var AC_EACH = 2;
  var AC_FRUIT = [
    { label: "Apples", count: 10 },
    { label: "Bananas", count: 6 },
    { label: "Mangoes", count: 4 },
    { label: "Oranges", count: 3 }
  ];
  var AC_APPLE_PICS = AC_FRUIT[0].count / AC_EACH;  /* 5 whole pictures */
  var AC_ORANGE_WHOLE = Math.floor(AC_FRUIT[3].count / AC_EACH);  /* 1 */

  /* the lesson's Venn and Carroll test: even, and more than twenty */
  var AC_SORT_A = "even", AC_SORT_B = "more than 20";   /* the lesson's own written form */
  var AC_ITEMS = [
    { label: "8", a: true },                  /* even, not more than twenty */
    { label: "33", b: true },                 /* more than twenty, odd */
    { label: "24", a: true, b: true },        /* both: the middle */
    { label: "7" }                            /* neither: outside both hoops */
  ];

  /* ---- timing ----------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function acOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function acFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var AC_JITTER = [0.42, 0.71, 0.18, 0.86, 0.33, 0.58, 0.07, 0.94, 0.49, 0.65, 0.24, 0.79];

  /* ---- small drawings the chapters share --------------------------------------- */

  /* a child, brown by the film's skin, centred on (x, y) */
  function acChild(x, y, size, o) {
    if (!(o > 0)) return "";
    return G(Em(x, y, size, "\u{1F9D2}"), { opacity: clamp(o, 0, 1) });
  }

  /* a panel: a rounded card with a faint fill, for a half of the stage */
  function acPanel(x, y, w, h, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 24, P.card, col || P.line, 2.5), { opacity: clamp(o, 0, 1) });
  }

  /* one tally bundle of five, drawn by hand for the recap card and the motif:
     four uprights and the fifth laid across them, like the lesson's gate */
  function acGate(x, y, h, col, n) {
    var out = "", k, pitch = h * 0.24;
    n = n == null ? 5 : n;
    for (k = 0; k < Math.min(n, 4); k++) out += L(x + k * pitch, y, x + k * pitch, y + h, col, h * 0.11);
    if (n >= 5) out += L(x - pitch * 0.5, y + h * 0.9, x + pitch * 3.5, y + h * 0.1, col, h * 0.11);
    return out;
  }

  /* three bars of a chart, drawn by hand for the motif and the recap card */
  function acBars(x, y, w, h, vals, col, grown) {
    var out = "", k, bw = w / (vals.length * 2 - 1), top = Math.max.apply(null, vals);
    var u = grown == null ? 1 : clamp(grown, 0, 1);
    out += L(x - bw * 0.3, y + h, x + w + bw * 0.3, y + h, P.muted, Math.max(2, h * 0.035));
    for (k = 0; k < vals.length; k++) {
      var bh = (vals[k] / top) * h * u;
      out += R(x + k * bw * 2, y + h - bh, bw, bh, bw * 0.18, col);
    }
    return out;
  }

  /* two overlapping hoops, for the recap card */
  function acHoops(cx, cy, r, colA, colB) {
    return C(cx - r * 0.55, cy, r, colA, colA, 3, { "fill-opacity": 0.2 }) +
      C(cx + r * 0.55, cy, r, colB, colB, 3, { "fill-opacity": 0.2 });
  }

  /* a word in a pill with a leader line to the thing it names; the newest gold */
  function acLabel(t, x, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return MK.leader(x, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 26, col: now ? P.gold : P.line });
  }

  /* ==== the title motif =========================================================
     The whole lesson in one round window: a question asked, a tally kept, a
     chart drawn. In the spoken title chapter each arrives on its own word -
     the question mark on "your own head", then ask, count and chart in turn.
     On the two cards all three simply stand. */
  function titleMotif(o) {
    var t = o.t || 0, sp = !!o.scene, out = "";
    var cHead = sp ? sc(o.scene, 0, "head") : null;
    var cAsk = sp ? sc(o.scene, 1, "ask") : null;
    var cCount = sp ? sc(o.scene, 1, "count") : null;
    var cChart = sp ? sc(o.scene, 1, "chart") : null;
    /* On the two cards the motif is a faint watermark behind the title, so it
       carries the question, the tally and the chart and NOT the speech bubble:
       at that opacity a word reads as a stray label over the school's mark. */
    var oHead = sp ? popIn(t, cHead, 0.45) : 1;
    var oAsk = sp ? popIn(t, cAsk, 0.4) : 0;
    var oCount = sp ? popIn(t, cCount, 0.4) : 1;
    var oChart = sp ? popIn(t, cChart, 0.4) : 1;

    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 176, 168, P.teal, 0.55 * Math.min(1, oChart));

    /* the question, asked */
    var headFade = sp && cAsk != null && t >= cAsk ? clamp(1 - (t - cAsk) / 0.5, 0, 1) : 1;
    out += MK.pop(C(180, sp ? 176 : 118, 66, P.cell, P.gold, 5) +
      Tx(180, sp ? 208 : 150, "?", "lab", "middle", { "font-size": 104, fill: P.gold }), 180, sp ? 176 : 118,
      oHead * headFade);

    /* ask: a child and a speech bubble, clear of the circle's rim */
    out += MK.pop(Em(126, 128, 58, "\u{1F9D2}") +
      MK.bubble(164, 78, 116, 54, "Walk", 1, 152, 114), 180, 110, oAsk);
    /* count: one bundle of five and four more */
    out += MK.pop(G(acGate(0, 0, 52, P.teal, 5) + acGate(76, 0, 52, P.teal, 4),
      { transform: tr(100, 186) }), 164, 212, oCount);
    /* chart: the travel survey as bars */
    out += MK.pop(G(acBars(0, 0, 172, 72, [9, 6, 4, 3], P.blue, 1), { transform: tr(96, 264) }), 182, 300, oChart);

    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A question, a tally of five and four, and a bar chart">' + out + "</svg>";
  }

  /* ==== chapter: a question worth asking ========================================
     3Ss.01. Two question cards, side by side: the lesson's own spider question
     (one answer, the same for everybody - nothing to collect) and its travel
     question (four different answers - worth asking). The children under each
     card show their answers, and that is the whole test: do the answers vary? */
  var AC_Q1 = { x: 48, y: 30, w: 512, h: 382 };
  var AC_Q2 = { x: 608, y: 30, w: 512, h: 382 };
  var AC_SPIDER_LEGS = 8;

  /* four children in a row across a card, each with an answer pill below */
  function acAnswerRow(box, answers, t, at, together, col) {
    var out = "", k, n = answers.length;
    var pitch = (box.w - 96) / (n - 1), x0 = box.x + 48;
    for (k = 0; k < n; k++) {
      var when = at == null ? null : together ? at : at + k * 0.34;
      var o = popIn(t, when, 0.36);
      if (o <= 0) continue;
      var cx = x0 + k * pitch;
      out += MK.pop(Em(cx, box.y + 250, 58, "\u{1F9D2}"), cx, box.y + 250, o);
      out += MK.pill(cx, box.y + 316, answers[k], Math.min(1, o), { size: 23, col: col || P.line, ink: P.ink });
    }
    return out;
  }

  function acAskChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cJust = c(0, "just"), cData = c(0, "data");
    var cSpider = c(1, "spider"), cEight = c(1, "eight"), cEvery = c(1, "everybody");
    var cTravel = c(2, "travel"), cAsk = c(2, "ask");
    var cVary = c(3, "vary"), cWorth = c(3, "worth");
    var out = "";

    /* the two cards. The left one is lit while "just answer" is said, the
       right one from "need data" on. */
    var litA = on(t, cJust, 0.45) * (1 - 0.55 * on(t, cData, 0.6));
    var litB = on(t, cData, 0.45);
    out += acPanel(AC_Q1.x, AC_Q1.y, AC_Q1.w, AC_Q1.h, 1, litA > 0.5 ? P.gold : P.line);
    out += acPanel(AC_Q2.x, AC_Q2.y, AC_Q2.w, AC_Q2.h, 1, litB > 0.5 ? P.gold : P.line);
    /* the pool of light stays inside the 1168 x 440 box: a glow is a disc, and
       a 250 radius on a card centred at 221 reached 31 px below it. */
    out += MK.glow(AC_Q1.x + AC_Q1.w / 2, AC_Q1.y + AC_Q1.h / 2, 200, P.gold, litA * 0.5);
    out += MK.glow(AC_Q2.x + AC_Q2.w / 2, AC_Q2.y + AC_Q2.h / 2, 200, P.gold, litB * 0.5);

    /* the spider question, and the one answer everybody gives */
    var qa = popIn(t, cSpider, 0.4);
    if (qa > 0) {
      out += MK.pop(Em(AC_Q1.x + 70, AC_Q1.y + 74, 54, "\u{1F577}️"), AC_Q1.x + 70, AC_Q1.y + 74, qa);
      out += G(Tx(AC_Q1.x + 116, AC_Q1.y + 68, "How many legs", "lab big", "start") +
        Tx(AC_Q1.x + 116, AC_Q1.y + 104, "has a spider?", "lab big", "start"), { opacity: Math.min(1, qa) });
    }
    var eo = popIn(t, cEight, 0.4);
    if (eo > 0) out += MK.pop(C(AC_Q1.x + AC_Q1.w / 2, AC_Q1.y + 168, 44, P.cell, P.gold, 4) +
      Tx(AC_Q1.x + AC_Q1.w / 2, AC_Q1.y + 184, String(AC_SPIDER_LEGS), "lab huge", "middle", { fill: P.gold }),
      AC_Q1.x + AC_Q1.w / 2, AC_Q1.y + 168, eo);
    out += acAnswerRow(AC_Q1, ["8", "8", "8", "8"], t, cEvery, true, P.line);
    /* nothing to collect: the same answer four times */
    out += MK.cross(AC_Q1.x + AC_Q1.w - 52, AC_Q1.y + 46, 26, popIn(t, cEvery == null ? null : cEvery + 0.9, 0.4));

    /* the travel question, and the four answers that vary */
    var qb = popIn(t, cTravel, 0.4);
    if (qb > 0) {
      out += MK.pop(Em(AC_Q2.x + 70, AC_Q2.y + 74, 54, "\u{1F3EB}"), AC_Q2.x + 70, AC_Q2.y + 74, qb);
      out += G(Tx(AC_Q2.x + 116, AC_Q2.y + 68, "How do we", "lab big", "start") +
        Tx(AC_Q2.x + 116, AC_Q2.y + 104, "travel to school?", "lab big", "start"), { opacity: Math.min(1, qb) });
    }
    out += MK.qmark(AC_Q2.x + AC_Q2.w / 2, AC_Q2.y + 168, 42,
      on(t, cTravel, 0.5) * (1 - on(t, cVary, 0.5)));
    var varied = on(t, cVary, 0.4);
    out += acAnswerRow(AC_Q2, ["Walk", "Bus", "Bicycle", "Car"], t, cAsk, false,
      varied > 0.4 ? P.gold : P.line);
    /* worth asking */
    out += MK.tick(AC_Q2.x + AC_Q2.w - 52, AC_Q2.y + 46, 26, popIn(t, cWorth, 0.4));
    if (varied > 0) out += MK.pill(AC_Q2.x + AC_Q2.w / 2, AC_Q2.y + 178, "they all differ", varied,
      { size: 24, col: P.gold });

    return svg(out);
  }
