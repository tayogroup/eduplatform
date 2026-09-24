  /* ==== Grade 3 Computing, Lesson 9: Data Problems ============================
     tools/lib/film-scenes/computing-g3/data-problems.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/data-problems.json.

     ONE SET OF NUMBERS, DRAWN FOUR WAYS. The lesson's two data sets live in
     DP_PETS and DP_FAV below, and every figure the film shows - the running
     table, the table view, the bars, the axis ticks, the pictogram pictures,
     the total and the sum in the "numerical" chapter - is computed from them.
     Nothing is typed twice, so the voice, the tally, the bars and the axis
     cannot disagree with each other. If a figure is spoken in the storyboard
     it is one of these:

        pets       0 pets 2, 1 pet 3, 2 pets 2, 3 or more 1   (8 children)
        favourite  cat 4, dog 2, fish 1, rabbit 1             (8 children)

     The three wrong cases in this film are each drawn as wrong and labelled:
     a story is "not a data problem", "1 and a half pets" carries a cross, and
     "a cat plus a dog" carries a cross. Nothing else in the film shows data
     that is not the lesson's own.

     This file: the palette, the timing helpers, the data, the cards, the title
     motif and the chapter "Problems data solves". Every top-level name here
     starts with dp. */

  var HUE = {
    title: P.teal, problems: P.gold, twokinds: P.plum, named: P.blue,
    views: P.accent, choose: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function dpFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 as beat k comes in and back to 0 as beat k + 1 does: a thing that
     belongs to that beat alone (rule 7) */
  function dpOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function dpPast(t, at) { return at != null && t >= at; }

  /* A CLEAN SWAP, not a crossfade. Two of this film's chapters replace one set
     of data with another in the same place, and a plain crossfade draws both at
     half opacity for half a second: "How many pets?" and "Which pet?" sat on
     top of each other and read as one jumbled title, and a pictogram row read
     "0 pets" and "cat" at once. So the first goes out completely and only then
     does the second come in. dpOut is 1 before the cue and 0 after it; dpIn is
     0 until the old one has gone. A cue the beat never names leaves the first
     drawing up and the second down, which is the right way round. */
  function dpOut(t, at) { return at == null ? 1 : 1 - inAt(t, at, 0.28); }
  function dpIn(t, at) { return at == null ? 0 : inAt(t, at + 0.3, 0.28); }

  /* ---- the lesson's two sets of data ------------------------------------------
     The counts are the lesson's own: the eight children of the "how many pets"
     form, and the same eight of the "which pet would you most like" form.
     `short` is the label a bar wears under the axis, where a row's full words
     do not fit; `pic` is the picture the lesson's own column carries. */
  var DP_PETS = {
    col: "pets", val: "children", title: "How many pets?",
    rows: [
      { label: "0 pets", short: "0", pic: "\u{1F6AB}", v: 2 },
      { label: "1 pet", short: "1", pic: "\u{1F431}", v: 3 },
      { label: "2 pets", short: "2", pic: "\u{1F436}", v: 2 },
      { label: "3 or more", short: "3+", pic: "\u{1F430}", v: 1 }
    ]
  };
  var DP_FAV = {
    col: "pet", val: "children", title: "Which pet?",
    rows: [
      { label: "cat", short: "cat", pic: "\u{1F431}", v: 4 },
      { label: "dog", short: "dog", pic: "\u{1F436}", v: 2 },
      { label: "fish", short: "fish", pic: "\u{1F41F}", v: 1 },
      { label: "rabbit", short: "rabbit", pic: "\u{1F430}", v: 1 }
    ]
  };
  function dpMax(set) {
    var m = 0;
    set.rows.forEach(function (r) { if (r.v > m) m = r.v; });
    return m;
  }
  function dpTotal(set) {
    var s = 0;
    set.rows.forEach(function (r) { s += r.v; });
    return s;
  }
  /* the row with the biggest count, for "the tallest bar" and "the favourite" */
  function dpTopRow(set) {
    var best = 0;
    set.rows.forEach(function (r, k) { if (r.v > set.rows[best].v) best = k; });
    return best;
  }

  /* ---- furniture -------------------------------------------------------------- */

  /* a plain card; col gives it a lit border */
  function dpCard(x, y, w, h, o, col, fill) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 20, fill || P.card, col || P.line, col ? 3.5 : 2, { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title =================================================================
     Eight children answer, and their answers become four bars; a magnifying
     glass over the tallest is the reading half. In the spoken title chapter the
     snack arrives on "Which snack", the eight children on "Ask every child",
     the bars grow on "count", the word data appears on "collecting data" and
     the magnifier on "reading what it says". On the two cards it stands still. */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cSnack = sn ? sc(sn, 0, "snack") : null, cAsk = sn ? sc(sn, 0, "ask") : null,
      cCount = sn ? sc(sn, 0, "count") : null, cCollect = sn ? sc(sn, 1, "collect") : null,
      cRead = sn ? sc(sn, 1, "read") : null;
    var pSnack = sn ? popIn(t, cSnack, 0.4) : 1;
    var nKids = sn ? tally(t, cAsk, 8, 0.9) : 8;
    var grow = sn ? on(t, cCount, 0.9) : 1;
    var pData = sn ? popIn(t, cCollect, 0.4) : 1;
    var pRead = sn ? popIn(t, cRead, 0.4) : 1;

    out += R(8, 26, 344, 308, 30, P.card, P.line, 3);
    /* the question, and the eight children asked */
    out += MK.pop(Em(62, 70, 44, "\u{1F36A}"), 62, 70, pSnack);
    for (var k = 0; k < nKids; k++) out += Em(118 + k * 30, 70, 24, "\u{1F9D2}");
    /* their answers as bars, on an axis that reaches the biggest count */
    var base = 280, unit = 140 / dpMax(DP_PETS);
    out += G(L(56, 130, 56, base, P.line, 3) + L(56, base, 336, base, P.line, 3), { opacity: grow });
    DP_PETS.rows.forEach(function (r, j) {
      var h = r.v * unit * grow;
      out += R(78 + j * 62, base - h, 46, h, 7, j === dpTopRow(DP_PETS) ? P.gold : P.teal);
    });
    out += MK.pop(Em(163, 112, 40, "\u{1F50D}"), 163, 112, pRead);
    out += MK.pill(180, 312, "data", pData, { size: 18, col: P.teal, ink: P.teal });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Eight children asked, their answers drawn as four bars, and a magnifying glass reading the tallest">' + out + "</svg>";
  }

  /* ==== chapter: problems data solves =============================================
     The lesson's own three school problems, each with a row of dots that fills
     as the counting is said, and under them the two halves of the work:
     collect, then interpret. The last beat sets the story problem beside them
     and crosses it out - the lesson's "that is imagination, not counting". */

  var DP_PROB = [
    { pic: "\u{1F36A}", label: "which snack to sell", n: 6 },
    { pic: "\u{1F4BA}", label: "how many chairs", n: 6 },
    { pic: "\u{1F938}", label: "when is it busiest", n: 6 }
  ];
  var DP_PCARD = { y: 24, w: 340, h: 208, xs: [40, 414, 788] };

  /* one problem card: its picture, its words, and the dots it is counted with */
  function dpProblemCard(k, o, countAt, t, col) {
    if (!(o > 0)) return "";
    var c = DP_PROB[k], x = DP_PCARD.xs[k], y = DP_PCARD.y, w = DP_PCARD.w, h = DP_PCARD.h;
    var cx = x + w / 2, out = dpCard(x, y, w, h, 1, col);
    out += Em(cx, y + 62, 56, c.pic);
    out += Tx(cx, y + 126, c.label, "lab mid", "middle");
    var got = tally(t, countAt, c.n, 0.9);
    for (var j = 0; j < c.n; j++)
      out += C(cx - 75 + j * 30, y + 168, 9, j < got ? P.gold : P.cell, P.line, 2);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* collect -> interpret, the two halves of the lecture's first part */
  function dpWorkStrip(t, cCollect, cInterp) {
    var out = "", y = 272, h = 132;
    var a = popIn(t, cCollect, 0.45), b = popIn(t, cInterp, 0.45);
    if (a > 0) {
      out += MK.pop(dpCard(120, y, 380, h, 1, P.gold) +
        Em(186, y + 62, 46, "\u{1F5E3}️") + Em(250, y + 62, 46, "\u{1F522}") +
        Tx(310, y + 52, "Collect", "lab big gold", "start") +
        Tx(310, y + 88, "ask, or count", "lab mid muted", "start"), 310, y + h / 2, a);
    }
    out += MK.arrow(520, y + h / 2, 640, y + h / 2, on(t, cInterp, 0.5), P.teal, 9);
    if (b > 0) {
      out += MK.pop(dpCard(660, y, 380, h, 1, P.teal) +
        Em(726, y + 62, 46, "\u{1F50D}") +
        Tx(786, y + 52, "Interpret", "lab big hue", "start", { fill: P.teal }) +
        Tx(786, y + 88, "read what it says", "lab mid muted", "start"), 786, y + h / 2, b);
    }
    return out;
  }

  function dpProblemsMain(scene, t) {
    var at = [
      { card: sc(scene, 0, "snack"), count: sc(scene, 0, "snack") },
      { card: sc(scene, 1, "chairs"), count: sc(scene, 1, "count") },
      { card: sc(scene, 2, "playground"), count: sc(scene, 2, "count") }
    ];
    var cThree = sc(scene, 0, "three");
    var cCollect = sc(scene, 3, "collecting"), cInterp = sc(scene, 3, "interpreting");
    var out = "";
    /* the three empty slots, then each problem as it is named */
    DP_PROB.forEach(function (c, k) {
      var slot = on(t, cThree == null ? null : cThree + k * 0.16, 0.4);
      if (slot > 0 && !dpPast(t, at[k].card))
        out += G(R(DP_PCARD.xs[k], DP_PCARD.y, DP_PCARD.w, DP_PCARD.h, 20, P.card, P.line, 2,
          { "stroke-dasharray": "12 9" }), { opacity: slot });
      var live = dpPast(t, at[k].card) && !dpPast(t, at[k + 1] ? at[k + 1].card : null);
      out += dpProblemCard(k, popIn(t, at[k].card, 0.45),
        k === 0 ? (at[0].count == null ? null : at[0].count + 0.7) : at[k].count, t, live ? P.gold : null);
    });
    out += dpWorkStrip(t, cCollect, cInterp);
    return out;
  }

  /* the last beat: the three that data solves, ticked, and the one it does not */
  function dpProblemsNot(scene, t) {
    var cNot = sc(scene, 4, "not"), cStory = sc(scene, 4, "story");
    var out = "", y = 30, w = 236, h = 238;
    DP_PROB.forEach(function (c, k) {
      var x = 44 + k * 252, o = popIn(t, cNot == null ? null : cNot + k * 0.14, 0.4);
      if (!(o > 0)) return;
      out += MK.pop(dpCard(x, y, w, h, 1, P.good) + Em(x + w / 2, y + 74, 56, c.pic) +
        Tx(x + w / 2, y + 146, c.label, "lab mid", "middle") +
        MK.tick(x + w / 2, y + 196, 22, 1), x + w / 2, y + h / 2, o);
    });
    out += Tx(404, y + h + 34, "data can solve these", "lab mid good", "middle",
      { opacity: Math.min(1, popIn(t, cNot, 0.5)) });
    /* and the one it cannot: the lesson's own "that is imagination, not counting" */
    var s = popIn(t, cStory, 0.45);
    if (s > 0) {
      var sx = 820, sw = 300;
      out += MK.pop(dpCard(sx, y, sw, h, 1, P.bad) + Em(sx + sw / 2, y + 74, 56, "\u{1F4D6}") +
        Tx(sx + sw / 2, y + 146, "what my story is about", "lab mid", "middle") +
        MK.cross(sx + sw / 2, y + 196, 24, 1), sx + sw / 2, y + h / 2, s);
      out += Tx(sx + sw / 2, y + h + 34, "not a data problem", "lab mid bad", "middle", { opacity: Math.min(1, s) });
    }
    out += MK.pill(584, y + h + 92, "data solves counts, mosts and whens", popIn(t, cNot, 0.5),
      { size: 24, col: P.gold, ink: P.gold });
    return out;
  }

  function dpProblemsChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(dpProblemsMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(dpProblemsNot(scene, t), { opacity: u });
    return svg(out);
  }
