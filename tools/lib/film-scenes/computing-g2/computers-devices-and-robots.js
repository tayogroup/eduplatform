  /* ==== Grade 2 Computing, Lesson 11: Computers, Devices and Robots ===========
     tools/lib/film-scenes/computing-g2/computers-devices-and-robots.js, with
     -2.js and -3.js: the film's pictures, after the shared marks (MK) and
     before the engine's tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/computers-devices-and-robots.json.

     THIS LESSON SORTS THINGS INTO KINDS, so every contrast is drawn SIDE BY
     SIDE in a region of its own and nothing correct is ever crossed out. The
     people chapter carries no cross at all - the computer simply has a
     question mark over it; the two device sizes both finish with a tick,
     because the lesson's answer is "it depends on the job"; and the story
     robots and the real robots stand in the lesson's own two bins, each
     labelled, neither marked wrong.

     This file: the palette, the timing helpers, the small pieces every
     chapter shares, the title motif and the chapter "What computers do
     better". Every top-level name here starts with cdr, so nothing can
     replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, faster: P.gold, people: P.accent, device: P.blue,
    portable: P.plum, robots: P.good, recap: P.teal
  };
  var KINDS = {};

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function cdrOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function cdrFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function cdrPast(t, at) { return at != null && t >= at; }

  /* ---- pieces every chapter shares -------------------------------------------- */

  /* a rounded panel: the box a group of things lives in */
  function cdrPanel(x, y, w, h, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 22, P.card, col || P.line, col ? 3.5 : 2), { opacity: clamp(o, 0, 1) });
  }

  /* a boxed thing with a picture and up to two lines of words under it.
     opt: {col (border), fill, size (the picture), art (markup instead of a
     picture), dim (0 to 1, how faded the whole tile is)} */
  function cdrTile(x, y, w, h, pic, l1, l2, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var cx = x + w / 2, size = opt.size || 96;
    var body = R(x, y, w, h, 20, opt.fill || P.cell, opt.col || P.line, opt.col ? 3.5 : 2);
    body += opt.art ? opt.art : Em(cx, y + h * 0.36, size, pic);
    if (l1) body += Tx(cx, y + h - (l2 ? 62 : 36), l1, "lab big", "middle");
    if (l2) body += Tx(cx, y + h - 26, l2, "lab mid muted readable", "middle");
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dim == null ? 1 : opt.dim), transform: around(cx, y + h / 2, Math.min(1.06, o)) });
  }

  /* ==== the title ===============================================================
     The lesson's own closing line as one picture: the computer wins the sums,
     and you win the kindness. The screen tile arrives on "adds up a hundred
     numbers" and its answer lands on "before you can blink"; the child and the
     heart arrive on "comfort a sad friend", and the two words under them on
     "not the same as kind". The three chips along the foot - a phone, a
     speaker and a robot - are the card's own furniture and never move. */
  function cdrMotifScreen(x, y, w, h, p, ans) {
    if (!(p > 0)) return "";
    var out = R(x, y, w, h, 16, P.cell, P.gold, 3) +
      R(x + 12, y + 12, w - 24, h * 0.52, 8, P.glass);
    out += Tx(x + w / 2, y + h * 0.40, ans > 0 ? "5,050" : "1 + 2 + 3", "lab", "middle",
      { "font-size": 26, fill: ans > 0 ? P.gold : P.muted });
    out += Tx(x + w / 2, y + h - 18, "fast", "lab big gold", "middle");
    return G(out, { transform: around(x + w / 2, y + h / 2, Math.min(1.06, p)), opacity: Math.min(1, p) });
  }

  function cdrMotifChild(x, y, w, h, p, kindOn) {
    if (!(p > 0)) return "";
    var out = R(x, y, w, h, 16, P.cell, P.good, 3) +
      Em(x + w * 0.44, y + h * 0.36, 72, "\u{1F9D1}") +
      Em(x + w * 0.76, y + h * 0.24, 38, "❤️");
    out += G(Tx(x + w / 2, y + h - 18, "kind", "lab big good", "middle"), { opacity: Math.min(1, kindOn) });
    return G(out, { transform: around(x + w / 2, y + h / 2, Math.min(1.06, p)), opacity: Math.min(1, p) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cAdds = sn ? sc(sn, 0, "adds") : null, cBlink = sn ? sc(sn, 0, "blink") : null,
      cComfort = sn ? sc(sn, 1, "comfort") : null, cKind = sn ? sc(sn, 1, "kind") : null;
    var pA = sn ? popIn(t, cAdds, 0.42) : 1, ans = sn ? on(t, cBlink, 0.4) : 1;
    var pB = sn ? popIn(t, cComfort, 0.42) : 1, kindOn = sn ? on(t, cKind, 0.45) : 1;

    out += R(8, 20, 344, 320, 30, P.card, P.line, 3);
    out += cdrMotifScreen(36, 52, 136, 160, pA, ans);
    out += cdrMotifChild(188, 52, 136, 160, pB, kindOn);
    /* the rest of the lesson, sitting still: a device and a robot */
    out += G(C(96, 272, 34, P.cell, P.line, 2) + Em(96, 272, 36, "\u{1F4F2}") +
      C(180, 272, 34, P.cell, P.line, 2) + Em(180, 272, 36, "\u{1F50A}") +
      C(264, 272, 34, P.cell, P.line, 2) + Em(264, 272, 36, "\u{1F916}"), { opacity: 0.42 });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A screen that is fast, a child who is kind, and a phone, a speaker and a robot">' + out + "</svg>";
  }

  KINDS.title = MK.titleKind({
    sub: [
      "Some jobs belong to the computer. Some belong to you.",
      "The place and the purpose choose the device.",
      "Story robots, and real robots with a real job."
    ]
  });

  /* ==== chapter: what computers do better ========================================
     The lesson's own sum racer, then the two other jobs its explain() names -
     sorting a thousand names, and counting cars all day and all night. Three
     pictures in one chapter, each crossfading into the next.
     Nothing here is crossed out: the child's lane simply fills more slowly. */

  var CDR_SUMS = [
    { q: "24 + 38", a: "62" }, { q: "57 - 29", a: "28" }, { q: "45 + 47", a: "92" },
    { q: "83 - 46", a: "37" }, { q: "66 + 25", a: "91" }
  ];
  var CDR_COL = { x: 300, w: 144, gap: 18 };
  function cdrColX(k) { return CDR_COL.x + k * (CDR_COL.w + CDR_COL.gap); }

  function cdrLane(y, h, pic, name, o) {
    if (!(o > 0)) return "";
    return G(R(40, y, 1088, h, 22, P.card, P.line, 2) +
      Em(100, y + h / 2, 52, pic) +
      Tx(142, y + h / 2 + 10, name, "lab big", "start"), { opacity: clamp(o, 0, 1) });
  }

  /* one answer box in a lane; v is how far it has been filled in */
  function cdrAnswer(k, y, h, v, col) {
    if (!(v > 0)) return "";
    var x = cdrColX(k);
    return G(R(x, y, CDR_COL.w, h, 14, P.cell, col || P.line, col ? 3 : 2) +
      Tx(x + CDR_COL.w / 2, y + h / 2 + 11, CDR_SUMS[k].a, "lab big", "middle", { fill: col || P.ink }),
      { opacity: clamp(v, 0, 1) });
  }

  /* ---- the race ---------------------------------------------------------- */
  function cdrRace(scene, t) {
    var cSums = sc(scene, 0, "sums"), cRace = sc(scene, 0, "race");
    var cFive = sc(scene, 1, "five"), cOne = sc(scene, 1, "one");
    var cRight = sc(scene, 2, "right"), cAcc = sc(scene, 2, "accurate");
    var out = "", k;

    /* the five sums */
    var shown = tally(t, cSums, 5, 0.7);
    out += G(Tx(150, 68, "Five sums", "lab big muted", "middle"), { opacity: on(t, cSums, 0.4) });
    for (k = 0; k < 5; k++) {
      var p = popIn(t, cSums == null ? null : cSums + k * 0.14, 0.38);
      if (shown <= k) p = 0;
      out += MK.pop(R(cdrColX(k), 16, CDR_COL.w, 84, 18, P.cell, P.line, 2) +
        Tx(cdrColX(k) + CDR_COL.w / 2, 70, CDR_SUMS[k].q, "lab big", "middle"),
        cdrColX(k) + CDR_COL.w / 2, 58, p);
    }
    out += MK.pop(Em(255, 58, 46, "\u{1F3C1}"), 255, 58, popIn(t, cRace, 0.4));

    /* the two lanes */
    var lanes = on(t, cRace, 0.5);
    out += cdrLane(118, 118, "\u{1F9D1}", "You", lanes);
    out += cdrLane(250, 118, "\u{1F4BB}", "Computer", lanes);

    /* the computer fills all five; you fill one */
    var pcDone = tally(t, cFive, 5, 0.55);
    for (k = 0; k < 5; k++) {
      if (pcDone > k) out += cdrAnswer(k, 272, 74, popIn(t, cFive + k * 0.11, 0.3), P.gold);
      var mark = popIn(t, cRight == null ? null : cRight + k * 0.12, 0.34);
      if (mark > 0) out += MK.tick(cdrColX(k) + 120, 288, 15, mark);
    }
    out += cdrAnswer(0, 140, 74, popIn(t, cOne, 0.4), P.muted);
    for (k = 1; k < 5; k++)
      out += G(R(cdrColX(k), 140, CDR_COL.w, 74, 14, P.card, P.line, 2, { "stroke-dasharray": "9 8" }), { opacity: lanes * 0.8 });

    out += MK.pill(584, 402, "accurate", on(t, cAcc, 0.45), { size: 26, col: P.gold, ink: P.gold });
    return out;
  }

  /* ---- a thousand names, sorted ------------------------------------------- */
  var CDR_JUMBLED = ["Fay", "Ada", "Hana", "Cara", "Gus", "Ben", "Eli", "Dev"];
  var CDR_SORTED = ["Ada", "Ben", "Cara", "Dev", "Eli", "Fay", "Gus", "Hana"];

  function cdrNameCol(x, names, n, o, col) {
    var out = "";
    for (var k = 0; k < names.length; k++) {
      if (k >= n) break;
      var y = 50 + k * 44;
      out += G(R(x, y, 200, 38, 12, P.cell, col || P.line, col ? 3 : 2) +
        Tx(x + 100, y + 27, names[k], "lab", "middle", { fill: col || P.ink }), { opacity: clamp(o, 0, 1) });
    }
    return out;
  }

  function cdrSort(scene, t) {
    var cSort = sc(scene, 3, "sort"), cSaid = sc(scene, 3, "said");
    var out = "";
    out += Tx(400, 34, "a thousand names", "lab mid muted readable", "middle");
    out += cdrNameCol(300, CDR_JUMBLED, 8, 1, null);
    out += G(Tx(800, 34, "in order", "lab mid muted readable", "middle"), { opacity: on(t, cSort, 0.4) });
    out += cdrNameCol(700, CDR_SORTED, tally(t, cSort, 8, 0.85), on(t, cSort, 0.3), P.gold);
    out += MK.arrow(524, 220, 676, 220, on(t, cSort, 0.55), P.gold, 9);
    out += Em(140, 250, 96, "\u{1F9D1}");
    out += MK.bubble(44, 86, 192, 66, "Ada", popIn(t, cSaid, 0.4), 140, 192);
    return out;
  }

  /* ---- counting cars, all day and all night -------------------------------- */
  function cdrCars(scene, t) {
    var cCount = sc(scene, 4, "count"), cNight = sc(scene, 4, "night");
    var cTired = sc(scene, 5, "tired"), cBored = sc(scene, 5, "bored");
    var out = "", k;

    /* the road */
    var road = on(t, cCount, 0.45);
    out += G(R(40, 208, 1088, 104, 18, P.night, P.line, 2) +
      L(60, 260, 1108, 260, P.line, 5, { "stroke-dasharray": "34 26" }), { opacity: road });
    if (road > 0) {
      for (k = 0; k < 5; k++) {
        var x = 40 + ((t * 120 + k * 216) % 1080);
        var fade = Math.min(1, (x - 40) / 70) * Math.min(1, (1120 - x) / 70);
        if (fade <= 0) continue;
        out += Em(x, 240, 50, "\u{1F697}", { opacity: (fade * road).toFixed(3) });
      }
    }

    /* all day and all night */
    var dn = popIn(t, cNight, 0.42);
    out += MK.pop(R(50, 28, 300, 130, 20, P.card, P.line, 2) +
      Em(130, 78, 54, "☀️") + Tx(130, 132, "all day", "lab mid readable", "middle") +
      Em(270, 78, 54, "\u{1F319}") + Tx(270, 132, "all night", "lab mid readable", "middle"),
      200, 93, dn);

    /* the counter */
    var n = cdrPast(t, cCount) ? Math.floor((t - cCount) * 137) : 0;
    out += G(R(700, 28, 420, 130, 20, P.card, P.gold, 3) +
      Tx(910, 62, "cars counted", "lab mid muted readable", "middle") +
      Tx(910, 128, String(n), "lab huge gold", "middle"), { opacity: road });

    out += MK.pill(340, 382, "never tired", on(t, cTired, 0.4), { size: 24, col: P.good, ink: P.good });
    out += MK.tick(470, 382, 22, popIn(t, cTired == null ? null : cTired + 0.3, 0.35));
    out += MK.pill(800, 382, "never bored", on(t, cBored, 0.4), { size: 24, col: P.good, ink: P.good });
    out += MK.tick(930, 382, 22, popIn(t, cBored == null ? null : cBored + 0.3, 0.35));
    return out;
  }

  KINDS.faster = function (scene, beat, t, i) {
    var toSort = into(t, scene.first + 3), toCars = into(t, scene.first + 4), out = "";
    if (toSort < 1) out += G(cdrRace(scene, t), { opacity: 1 - toSort });
    if (toSort > 0 && toCars < 1) out += G(cdrSort(scene, t), { opacity: toSort * (1 - toCars) });
    if (toCars > 0) out += G(cdrCars(scene, t), { opacity: toCars });
    return svg(out);
  };
