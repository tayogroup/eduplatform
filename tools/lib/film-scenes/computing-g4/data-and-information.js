  /* ==== Grade 4 Computing, Lesson 8: Data and Information =====================
     tools/lib/film-scenes/computing-g4/data-and-information.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/data-and-information.json.

     THE FILM HAS ONE COUNT AND EVERY PICTURE DRAWS IT. The lesson's own eight
     children answer walk, bus, car, bike, walk, bus, walk, car, so walk 3,
     bus 2, car 2, bike 1 and 3 + 2 + 2 + 1 = 8. DI_KIDS below is that list,
     diCount() is the only place anything is counted, and the check just under
     it stops the page loading if the film's spoken figures and its list ever
     part company. Nothing here is a pictogram: one tally mark, one bar cell
     and one child's face are each ONE child, so no key is needed and none is
     drawn.

     RAW DATA IS DRAWN AS RAW. Wherever the voice says data means nothing yet,
     the picture carries no label, no order, no total and no axis - bare tiles
     and a question mark. The labels, the table and the axis arrive only with
     the words that give the numbers their meaning.

     The Computing kit draws nothing for a database, a form or a table (there
     is no ART.sim, and its scenes are everyday tasks), so every picture here
     is the film's own, in the engine's idiom, using the lesson's own words,
     names, choices and emoji.

     This file: the palette, the one count, the drawings every chapter shares,
     the title motif and the chapter "Paper and digital". Every top-level name
     here starts with di or DI_, so nothing can replace a name of the engine,
     ART or MK. */

  var HUE = {
    title: P.teal, dbase: P.gold, form: P.accent, data: P.plum,
    info: P.good, raw: P.blue, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function diOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function diFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function diPast(t, at) { return at != null && t >= at; }

  /* ---- the one count ---------------------------------------------------------
     The lesson's four choices, in the order its form offers them, and its
     eight children with the answer each of them gives. */

  var DI_WAY = {
    walk: { pic: "\u{1F6B6}", label: "walk" },
    bike: { pic: "\u{1F6B2}", label: "bike" },
    car:  { pic: "\u{1F697}", label: "car" },
    bus:  { pic: "\u{1F68C}", label: "bus" }
  };
  var DI_FORM_ORDER = ["walk", "bike", "car", "bus"];      /* the form's own choices */
  var DI_TABLE_ORDER = ["walk", "bus", "car", "bike"];     /* the order the film counts them */

  var DI_KIDS = [
    { name: "Amal",  pic: "\u{1F467}\u{1F3FE}", ans: "walk" },
    { name: "Sami",  pic: "\u{1F466}\u{1F3FE}", ans: "bus" },
    { name: "Zara",  pic: "\u{1F467}\u{1F3FD}", ans: "car" },
    { name: "Omar",  pic: "\u{1F466}\u{1F3FD}", ans: "bike" },
    { name: "Leo",   pic: "\u{1F466}\u{1F3FB}", ans: "walk" },
    { name: "Nora",  pic: "\u{1F467}\u{1F3FB}", ans: "bus" },
    { name: "Karim", pic: "\u{1F466}\u{1F3FE}", ans: "walk" },
    { name: "Maya",  pic: "\u{1F467}\u{1F3FC}", ans: "car" }
  ];
  function diCount(id) {
    var n = 0;
    for (var k = 0; k < DI_KIDS.length; k++) if (DI_KIDS[k].ans === id) n++;
    return n;
  }
  /* The film SAYS "walk three, bus two, car two, bike one" and "all eight
     children". If the list above ever stops giving that, the page stops here
     rather than drawing a table that disagrees with the voice. */
  (function () {
    var got = DI_TABLE_ORDER.map(function (id) { return diCount(id); }), total = 0;
    got.forEach(function (n) { total += n; });
    if (got.join(",") !== "3,2,2,1" || DI_KIDS.length !== 8 || total !== 8)
      throw new Error("data-and-information: the narration says walk 3, bus 2, car 2, bike 1 of eight children; the list gives " +
        got.join(",") + " of " + DI_KIDS.length);
  })();

  /* the five classroom temperatures of the lesson's last lecture part */
  var DI_TEMPS = [21, 19, 24, 22, 30];

  /* ---- small drawings the chapters share -------------------------------------- */

  /* A fan of index cards standing in a box: the paper database. `shown` is how
     many names have been written on, as a number that may be part way. */
  function diNameCards(cx, cy, names, shown, o) {
    if (!(o > 0)) return "";
    var w = 250, h = 44, pitch = 33, top = cy - 78, out = "";
    for (var k = 0; k < names.length; k++) {
      var y = top + k * pitch;
      out += R(cx - w / 2, y, w, h, 8, P.paper, "#C9BFA6", 2);
      var no = shown == null ? 1 : clamp(shown - k, 0, 1);
      if (no > 0) out += Tx(cx - w / 2 + 22, y + 28, names[k], "lab mid dark", "start", { opacity: no });
    }
    out += R(cx - 134, cy + 52, 268, 44, 8, P.body, P.edge, 3) +
      R(cx - 112, cy + 59, 224, 8, 4, P.edge, null, null, { opacity: 0.45 });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* A screen on a stand, with rows of text on it: the digital database. */
  function diScreen(cx, cy, w, h, rows, shown, o, lit) {
    if (!(o > 0)) return "";
    var out = R(cx - w / 2, cy - h / 2, w, h, 12, P.body, P.edge, 3) +
      R(cx - w / 2 + 10, cy - h / 2 + 10, w - 20, h - 20, 6, P.ground);
    var n = Math.max(rows.length, 1), lh = (h - 40) / n, y0 = cy - h / 2 + 20 + lh * 0.66;
    for (var k = 0; k < rows.length; k++) {
      var no = shown == null ? 1 : clamp(shown - k, 0, 1);
      if (no > 0) out += Tx(cx - w / 2 + 28, y0 + k * lh, rows[k], "lab mid", "start", { fill: P.teal, opacity: no });
    }
    out += R(cx - 16, cy + h / 2, 32, 14, 2, P.edge) + R(cx - 46, cy + h / 2 + 14, 92, 9, 4, P.edge);
    if (lit > 0) out += C(cx + w / 2 - 17, cy + h / 2 - 17, 5, P.good, null, null, { opacity: lit });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* A bare value in a box: one raw fact, with nothing said about it. */
  function diTile(cx, cy, w, h, text, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var col = opt.col || P.line;
    return G(R(cx - w / 2, cy - h / 2, w, h, 14, opt.fill || P.cell, col, opt.sw || 3) +
      Tx(cx, cy + (opt.size || 38) * 0.36, text, "lab", "middle", { "font-size": opt.size || 38, fill: opt.ink || P.ink }),
      { transform: around(cx, cy, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  /* One of the four ways to get to school: its picture over its word. */
  function diWayChip(cx, cy, w, h, id, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var way = DI_WAY[id], col = opt.col || P.line;
    return G(R(cx - w / 2, cy - h / 2, w, h, 12, opt.fill || P.cell, col, opt.sw || 3) +
      Em(cx, cy - h * 0.14, h * 0.40, way.pic) +
      Tx(cx, cy + h * 0.38, way.label, "lab mid", "middle", { fill: opt.ink || P.ink }),
      { transform: around(cx, cy, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  /* ==== the title motif ==========================================================
     The whole lesson in one picture: four raw answers with a question mark
     over them, an arrow down, and the counts they become beside a lightbulb.
     Two walks, one bus, one car - four children, four answers, and the bars
     say two, one, one. In the spoken title chapter each piece arrives as it is
     named; on the two cards it stands still. */
  var DI_MOTIF = ["walk", "bus", "car", "walk"];
  var DI_MOTIF_BARS = [
    { id: "walk", n: 2 }, { id: "bus", n: 1 }, { id: "car", n: 1 }
  ];

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cWords = sn ? sc(sn, 0, "words") : null, cNone = sn ? sc(sn, 0, "none") : null;
    var cOrg = sn ? sc(sn, 1, "organise") : null, cCount = sn ? sc(sn, 1, "count") : null,
      cOut = sn ? sc(sn, 1, "out") : null;

    out += R(8, 26, 344, 308, 30, P.card, P.line, 3);

    /* four raw answers, in the order they were given */
    for (var k = 0; k < DI_MOTIF.length; k++) {
      var p = sn ? popIn(t, cWords == null ? null : cWords + k * 0.16, 0.34) : 1;
      if (!(p > 0)) continue;
      var x = 30 + k * 82;
      out += G(R(x, 50, 74, 56, 12, P.cell, P.line, 3) +
        Tx(x + 37, 84, DI_WAY[DI_MOTIF[k]].label, "lab mid", "middle"),
        { transform: around(x + 37, 78, Math.min(1.08, p)), opacity: Math.min(1, p) });
    }
    out += MK.qmark(180, 142, 24, sn ? popIn(t, cNone, 0.4) : 1);

    /* organised, and counted */
    out += MK.arrow(180, 172, 180, 208, sn ? on(t, cOrg, 0.5) : 1, P.gold, 7);
    var total = 0;
    DI_MOTIF_BARS.forEach(function (b, k) {
      total += b.n;
      var u = sn ? on(t, cCount == null ? null : cCount + k * 0.22, 0.4) : 1;
      if (!(u > 0)) return;
      var hgt = b.n * 32 * u, x = 44 + k * 62;
      out += R(x, 300 - hgt, 46, hgt, 5, P.teal) +
        Tx(x + 23, 292 - b.n * 32, String(b.n), "lab mid", "middle", { fill: P.teal, opacity: u }) +
        Tx(x + 23, 318, DI_WAY[b.id].label, "lab tiny muted", "middle", { opacity: u });
    });
    out += L(30, 300, 224, 300, P.line, 3);
    out += MK.pop(Em(288, 258, 62, "\u{1F4A1}"), 288, 258, sn ? popIn(t, cOut, 0.42) : 1);
    if (total !== DI_MOTIF.length) throw new Error("data-and-information: the title motif shows " + DI_MOTIF.length + " answers and counts " + total);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Four answers with a question mark, and the counts they become">' + out + "</svg>";
  }

  /* ==== chapter: paper and digital ================================================
     Beat 0 stands the four records in the middle and points to the two places
     they can live. From beat 1 the picture is the lesson's own comparison:
     a paper panel and a digital one, the SAME four names in each, and each
     panel's strengths ticking in as they are said. */

  function diDbaseIntro(scene, t) {
    var cDb = sc(scene, 0, "database"), cOrg = sc(scene, 0, "organised"),
      cPaper = sc(scene, 0, "paper"), cComp = sc(scene, 0, "computer");
    var names = DI_KIDS.slice(0, 4).map(function (k) { return k.name; });
    var out = "";

    out += MK.pill(584, 54, "An organised collection of data", on(t, cOrg, 0.45),
      { size: 26, col: P.gold, ink: P.gold });

    /* the four records, one card each */
    for (var k = 0; k < 4; k++) {
      var p = popIn(t, cDb == null ? null : cDb + k * 0.22, 0.38);
      if (!(p > 0)) continue;
      var y = 118 + k * 64;
      out += G(R(434, y, 300, 54, 14, P.cell, P.line, 3) +
        Em(468, y + 27, 34, DI_KIDS[k].pic) +
        Tx(502, y + 35, DI_KIDS[k].name, "lab", "start"),
        { transform: around(584, y + 27, Math.min(1.08, p)), opacity: Math.min(1, p) });
    }

    /* the two places the same records can live */
    var pp = on(t, cPaper, 0.5), pc = on(t, cComp, 0.5);
    out += MK.leader(430, 240, 330, 240, pp, P.gold);
    out += diNameCards(200, 230, names, 4, popIn(t, cPaper, 0.45));
    out += MK.pill(200, 356, "on paper", pp, { size: 22, col: P.gold, ink: P.gold });
    out += MK.leader(738, 240, 858, 240, pc, P.teal);
    out += diScreen(968, 230, 210, 140, names, 4, popIn(t, cComp, 0.45), pc);
    out += MK.pill(968, 356, "on a computer", pc, { size: 22, col: P.teal, ink: P.teal });
    return out;
  }

  /* each panel's own strengths, in the lesson's own words */
  var DI_PAPER_ROWS = [
    { text: "works with no power", cue: "power" },
    { text: "needs no login", cue: "login" },
    { text: "cannot be reached from far away", cue: "far" }
  ];
  var DI_DIGI_ROWS = [
    { text: "found in a blink", cue: "search" },
    { text: "sorted by any field", cue: "sort" },
    { text: "read by many at once", cue: "share" },
    { text: "a million records on a chip", cue: "small" }
  ];
  function diStrengths(scene, t, k, rows, x, y) {
    return MK.list(x, y, rows.map(function (r) {
      var at = sc(scene, k, r.cue);
      return { text: r.text, at: at, mark: "tick", markAt: at == null ? null : at + 0.25 };
    }), t, { lh: 42, cls: "lab mid", markR: 15 });
  }

  function diDbasePanels(scene, t) {
    var cBox = sc(scene, 1, "box"), cReg = sc(scene, 1, "register");
    var cSame = sc(scene, 2, "same"), cDig = sc(scene, 2, "digitally");
    var cBetter = sc(scene, 5, "better"), cPlace = sc(scene, 5, "place");
    var names = DI_KIDS.slice(0, 4).map(function (k) { return k.name; });
    var out = "";

    /* paper */
    out += R(40, 14, 510, 412, 22, P.card, P.line, 2);
    out += MK.pill(295, 56, "Paper", 1, { size: 24, col: P.gold, ink: P.gold });
    out += diNameCards(295, 170, names, tally(t, cReg, 4, 0.7), popIn(t, cBox, 0.45));
    out += diStrengths(scene, t, 4, DI_PAPER_ROWS, 66, 324);

    /* digital: the same four names, stored the other way */
    var dOn = diFrom(t, scene, 2);
    out += G(R(618, 14, 510, 412, 22, P.card, P.line, 2), { opacity: dOn });
    out += MK.pill(873, 56, "Digital", popIn(t, cDig, 0.45), { size: 24, col: P.teal, ink: P.teal });
    out += diScreen(873, 168, 284, 166, names, tally(t, cSame, 4, 0.8), popIn(t, cSame, 0.45), on(t, cDig, 0.5));
    out += diStrengths(scene, t, 3, DI_DIGI_ROWS, 644, 282);

    /* "not better at everything": a question between them, and then a tick on
       each, because each has its place */
    out += MK.qmark(584, 200, 30, popIn(t, cBetter, 0.4) * (1 - on(t, cPlace, 0.4)));
    var pl = popIn(t, cPlace, 0.4);
    out += MK.tick(200, 56, 20, pl) + MK.tick(770, 56, 20, pl);
    return out;
  }

  function diDbaseChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1), out = "";
    if (u < 1) out += G(diDbaseIntro(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(diDbasePanels(scene, t), { opacity: u });
    return svg(out);
  }
